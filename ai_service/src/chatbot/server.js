/**
 * Express server for Mental Health Chatbot
 */

import express from 'express';
import cors from 'cors';
import { getChatbot } from './chatbotService.js';

const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

/**
 * GET / - API ana sayfası
 */
app.get('/', (req, res) => {
  res.json({
    service: 'Mental Health Chatbot API',
    status: 'running',
    endpoints: {
      'POST /chat': 'Chatbot ile konuş',
      'POST /clear-history': 'Konuşma geçmişini temizle',
      'GET /history': 'Konuşma geçmişini getir',
      'GET /health': 'Servis sağlık kontrolü'
    }
  });
});

/**
 * GET /health - Servis sağlık kontrolü
 */
app.get('/health', (req, res) => {
  try {
    const chatbot = getChatbot();
    res.json({
      status: 'healthy',
      model: chatbot.modelId,
      apiConfigured: !!chatbot.apiKey
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

/**
 * POST /chat - Chatbot ile konuş
 * 
 * Request body:
 * {
 *   "message": "I'm feeling stressed",
 *   "maskPersonalData": true,
 *   "includeHistory": false,
 *   "maxNewTokens": 512,
 *   "temperature": 0.7,
 *   "topP": 0.9
 * }
 */
app.post('/chat', async (req, res) => {
  try {
    const {
      message,
      maskPersonalData = true,
      includeHistory = false,
      maxNewTokens = 512,
      temperature = 0.7,
      topP = 0.9
    } = req.body;

    // Validation
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        error: 'Message is required and must be a non-empty string'
      });
    }

    if (maxNewTokens < 50 || maxNewTokens > 2048) {
      return res.status(400).json({
        error: 'maxNewTokens must be between 50 and 2048'
      });
    }

    if (temperature < 0 || temperature > 1) {
      return res.status(400).json({
        error: 'temperature must be between 0 and 1'
      });
    }

    if (topP < 0 || topP > 1) {
      return res.status(400).json({
        error: 'topP must be between 0 and 1'
      });
    }

    // Get chatbot instance
    const chatbot = getChatbot();

    // Send message to chatbot
    const result = await chatbot.chat({
      message,
      maskPersonalData,
      includeHistory,
      maxNewTokens,
      temperature,
      topP
    });

    // Check for errors
    if (result.error) {
      const statusCode = result.statusCode || 500;
      return res.status(statusCode).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Beklenmeyen hata',
      message: error.message,
      errorType: 'server_error'
    });
  }
});

/**
 * POST /clear-history - Konuşma geçmişini temizle
 */
app.post('/clear-history', (req, res) => {
  try {
    const chatbot = getChatbot();
    chatbot.clearHistory();
    res.json({
      status: 'success',
      message: 'Konuşma geçmişi temizlendi'
    });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({
      error: 'Hata',
      message: error.message
    });
  }
});

/**
 * GET /history - Konuşma geçmişini getir
 */
app.get('/history', (req, res) => {
  try {
    const chatbot = getChatbot();
    const history = chatbot.getHistory();
    res.json({
      history,
      count: history.length
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      error: 'Hata',
      message: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mental Health Chatbot API running on http://localhost:${PORT}`);
  console.log(`📚 Endpoints:`);
  console.log(`   POST   http://localhost:${PORT}/chat`);
  console.log(`   POST   http://localhost:${PORT}/clear-history`);
  console.log(`   GET    http://localhost:${PORT}/history`);
  console.log(`   GET    http://localhost:${PORT}/health`);
});

export default app;
