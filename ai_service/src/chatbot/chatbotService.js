/**
 * Mental Health Chatbot Service
 * Hugging Face Inference API kullanarak mental health model ile konuşma
 */

import { HfInference } from '@huggingface/inference';
import { maskUserMessage } from './privacyUtils.js';
import dotenv from 'dotenv';

// .env dosyasını yükle
dotenv.config();

export class MentalHealthChatbot {
  /**
   * Chatbot'u başlat
   * @param {string} apiKey - Hugging Face API key. Verilmezse .env'den alınır.
   */
  constructor(apiKey = null) {
    if (!MentalHealthChatbot.instance) {
                  this.modelId = "meta-llama/Llama-3.2-1B-Instruct"; 
      this.apiKey = apiKey || process.env.HUGGINGFACE_API_KEY;
      
      if (!this.apiKey) {
        console.error('HUGGINGFACE_API_KEY not found in .env file.');
        throw new Error('HUGGINGFACE_API_KEY is not set.');
      }

      this.hf = new HfInference(this.apiKey);
      this.conversationHistory = [];
      MentalHealthChatbot.instance = this;
    }
    return MentalHealthChatbot.instance;
  }

  /**
   * Mistral Instruct formatına uygun prompt oluştur
   * @param {string} message - Kullanıcı mesajı
   * @param {boolean} includeHistory - Geçmiş konuşmaları dahil et
   * @returns {string} Formatlanmış prompt
   */
  _formatPrompt(message, includeHistory = false) {
    let prompt = 'The following is a conversation with a mental health assistant. The assistant is helpful, creative, clever, and very friendly.\n';
    const history = includeHistory ? this.conversationHistory.slice(-3) : this.conversationHistory;
    
    for (const turn of history) {
      prompt += `\nHuman: ${turn.user}\nAI: ${turn.bot}`;
    }
    
    prompt += `\nHuman: ${message}\nAI:`;
    return prompt;
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
    const originalMessage = message;
    let detectedEntities = [];
    let hasPersonalData = false;
    
    if (maskPersonalData) {
      const maskResult = maskUserMessage(message);
      message = maskResult.masked;
      detectedEntities = maskResult.detectedEntities;
      hasPersonalData = maskResult.hasPersonalData;
    }
    
    const prompt = this._formatPrompt(message, includeHistory);
    
    try {
      // Sohbet mesajlarını hazırla
      const messages = [];
      
      // Geçmiş konuşmaları ekle
      for (const turn of this.conversationHistory) {
        messages.push({ role: "user", content: turn.user });
        messages.push({ role: "assistant", content: turn.bot });
      }
      
      // Mevcut mesajı ekle
      messages.push({ role: "user", content: message });
      
      const response = await this.hf.chatCompletion({
        model: this.modelId,
        messages: messages,
        max_tokens: maxNewTokens,
        temperature: temperature,
      });

      const botResponse = response.choices[0].message.content.trim();
      
      if (includeHistory) {
        this.conversationHistory.push({ user: message, bot: botResponse });
      }
      
      return {
        response: botResponse,
        maskedMessage: maskPersonalData ? message : null,
        detectedEntities: maskPersonalData ? detectedEntities : null,
        hasPersonalData: maskPersonalData ? hasPersonalData : null,
        originalMessage: (maskPersonalData && hasPersonalData) ? originalMessage : null
      };

    } catch (error) {
      console.error('Hugging Face API Error:', error);
      
      // Detaylı hata bilgisi
      if (error.httpResponse && error.httpResponse.body) {
        console.error('API Response Body:', JSON.stringify(error.httpResponse.body, null, 2));
      }
      
      const errorMessage = error.message || 'An unknown error occurred with the Hugging Face API.';
      let statusCode = 500;
      
      if (error.httpResponse && error.httpResponse.status) {
        statusCode = error.httpResponse.status;
      } else if (error.response && error.response.status) {
        statusCode = error.response.status;
      } else if (error.code && typeof error.code === 'number') {
        statusCode = error.code;
      } else if (error.message && error.message.includes('410')) {
        statusCode = 410;
      }

      return {
        error: `Hugging Face API hatası: ${errorMessage}`,
        errorType: 'api_error',
        statusCode: statusCode
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
    return this.conversationHistory;
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
