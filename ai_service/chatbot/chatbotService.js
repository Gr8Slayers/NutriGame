/**
 * Mental Health Chatbot Service
 * Hugging Face Inference API kullanarak mental health model ile konuşma
 */

import axios from 'axios';
import dotenv from 'dotenv';
import { maskUserMessage } from './privacyUtils.js';

// .env dosyasını yükle
dotenv.config();

export class MentalHealthChatbot {
  /**
   * Chatbot'u başlat
   * @param {string} apiKey - Hugging Face API key. Verilmezse .env'den alınır.
   */
  constructor(apiKey = null) {
    this.apiKey = apiKey || process.env.HUGGINGFACE_API_KEY;
    
    if (!this.apiKey) {
      throw new Error(
        'Hugging Face API key bulunamadı! ' +
        'Lütfen .env dosyasına HUGGINGFACE_API_KEY ekleyin veya ' +
        'constructor\'a apiKey parametresi verin.'
      );
    }
    
    // Model ID
    this.modelId = 'mradermacher/Mental-Health-FineTuned-Mistral-7B-Instruct-v0.2-i1-GGUF';
    
    // API endpoint
    this.apiUrl = `https://api-inference.huggingface.co/models/${this.modelId}`;
    
    // Axios instance
    this.axiosInstance = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    // Conversation history
    this.conversationHistory = [];
  }

  /**
   * Mistral Instruct formatına uygun prompt oluştur
   * @param {string} message - Kullanıcı mesajı
   * @param {boolean} includeHistory - Geçmiş konuşmaları dahil et
   * @returns {string} Formatlanmış prompt
   */
  _formatPrompt(message, includeHistory = false) {
    if (includeHistory && this.conversationHistory.length > 0) {
      // Geçmiş konuşmaları dahil et (son 3 mesaj)
      let conversation = '';
      const recentHistory = this.conversationHistory.slice(-3);
      
      for (const turn of recentHistory) {
        if (turn.role === 'user') {
          conversation += `[INST] ${turn.content} [/INST]\n`;
        } else {
          conversation += `${turn.content}\n`;
        }
      }
      
      conversation += `[INST] ${message} [/INST]`;
      return conversation;
    } else {
      // Sadece mevcut mesaj
      return `[INST] ${message} [/INST]`;
    }
  }

  /**
   * Model ile konuş
   * @param {Object} options - Konuşma parametreleri
   * @returns {Promise<Object>} Model yanıtı
   */
  async chat({
    message,
    maskPersonalData = true,
    includeHistory = false,
    maxNewTokens = 512,
    temperature = 0.7,
    topP = 0.9
  }) {
    try {
      // Kişisel verileri maskele
      const originalMessage = message;
      let detectedEntities = [];
      let hasPersonalData = false;
      
      if (maskPersonalData) {
        const maskResult = maskUserMessage(message);
        message = maskResult.masked;
        detectedEntities = maskResult.detectedEntities;
        hasPersonalData = maskResult.hasPersonalData;
      }
      
      // Prompt'u formatla
      const prompt = this._formatPrompt(message, includeHistory);
      
      // API request payload
      const payload = {
        inputs: prompt,
        parameters: {
          max_new_tokens: maxNewTokens,
          temperature: temperature,
          top_p: topP,
          return_full_text: false,
          do_sample: true
        }
      };
      
      // API'ye istek gönder
      const response = await this.axiosInstance.post('', payload);
      
      // Yanıtı parse et
      let modelResponse = '';
      if (Array.isArray(response.data) && response.data.length > 0) {
        modelResponse = response.data[0].generated_text?.trim() || '';
      } else {
        modelResponse = response.data.generated_text?.trim() || '';
      }
      
      // Konuşma geçmişine ekle
      if (includeHistory) {
        this.conversationHistory.push({
          role: 'user',
          content: message
        });
        this.conversationHistory.push({
          role: 'assistant',
          content: modelResponse
        });
      }
      
      // Yanıtı döndür
      return {
        response: modelResponse,
        maskedMessage: maskPersonalData ? message : null,
        detectedEntities: maskPersonalData ? detectedEntities : null,
        hasPersonalData: maskPersonalData ? hasPersonalData : null,
        originalMessage: (maskPersonalData && hasPersonalData) ? originalMessage : null
      };
      
    } catch (error) {
      // Hata yönetimi
      if (error.code === 'ECONNABORTED') {
        return {
          error: 'API isteği zaman aşımına uğradı. Lütfen tekrar deneyin.',
          errorType: 'timeout'
        };
      }
      
      if (error.response) {
        let errorMessage = `HTTP hatası: ${error.message}`;
        
        // Model yükleniyor hatası
        if (error.response.status === 503) {
          const estimatedTime = error.response.data?.estimated_time;
          if (estimatedTime) {
            errorMessage = `Model yükleniyor. Tahmini bekleme süresi: ${estimatedTime} saniye`;
          } else {
            errorMessage = 'Model yükleniyor. Lütfen birkaç saniye sonra tekrar deneyin.';
          }
        }
        
        return {
          error: errorMessage,
          errorType: 'http_error',
          statusCode: error.response.status
        };
      }
      
      return {
        error: `Beklenmeyen hata: ${error.message}`,
        errorType: 'unknown'
      };
    }
  }

  /**
   * Konuşma geçmişini temizle
   */
  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * Konuşma geçmişini getir
   * @returns {Array} Konuşma geçmişi
   */
  getHistory() {
    return [...this.conversationHistory];
  }
}

// Global chatbot instance'ı
let chatbotInstance = null;

/**
 * Singleton pattern ile chatbot instance'ı döndür
 * @returns {MentalHealthChatbot}
 */
export function getChatbot() {
  if (!chatbotInstance) {
    chatbotInstance = new MentalHealthChatbot();
  }
  return chatbotInstance;
}
