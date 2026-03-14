'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const chatbotService = require('./chatbotService');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Global rate limiter (coarse guard; fine-grained limit is inside chatbotService)
const globalLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// ── Error handler ─────────────────────────────────────────────────────────────

function handleChatError(err, res) {
  console.error('[ChatbotService Error]', err.message, err.cause || '');
  const status = err.statusCode || 500;
  const body = { error: err.message };
  if (err.retryAfterMs) {
    body.retryAfterMs = err.retryAfterMs;
    res.setHeader('Retry-After', Math.ceil(err.retryAfterMs / 1000));
  }
  return res.status(status).json(body);
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/chat
 * Body: { userId: string, chatId?: string, message: string }
 * Returns: { chatId: string, response: string }
 *
 * ChatbotController.chat()
 */
app.post('/api/chat', async (req, res) => {
  const { userId, chatId, message } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required.' });
  }

  try {
    const result = await chatbotService.chat(userId, chatId || null, message);
    return res.status(200).json(result);
  } catch (err) {
    return handleChatError(err, res);
  }
});

/**
 * POST /api/chat/stream
 * Body: { userId: string, chatId?: string, message: string }
 * Returns: Server-Sent Events stream
 *   data: { chunk: string }    – partial text
 *   data: { done: true, chatId: string } – end of stream
 *   data: { error: string }    – on failure
 *
 * ChatbotController.chatStream()
 */
app.post('/api/chat/stream', async (req, res) => {
  const { userId, chatId, message } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required.' });
  }

  try {
    // chatStream sets its own headers and writes directly to res
    await chatbotService.chatStream(userId, chatId || null, message, res);
  } catch (err) {
    // Headers may not have been sent yet if error was thrown before streaming began
    if (!res.headersSent) {
      return handleChatError(err, res);
    }
    // If streaming already started, write error as SSE event
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

/**
 * GET /api/chat/history/:chatId
 * Returns: { chatId: string, history: Array<{ role, parts }> }
 *
 * ChatbotController.getChatHistory()
 */
app.get('/api/chat/history/:chatId', (req, res) => {
  const { chatId } = req.params;
  if (!chatId) {
    return res.status(400).json({ error: 'chatId is required.' });
  }
  const result = chatbotService.getChatHistory(chatId);
  return res.status(200).json(result);
});

/**
 * POST /api/chat/new
 * Creates a new conversation session.
 * Returns: { chatId: string }
 */
app.post('/api/chat/new', (req, res) => {
  const chatId = chatbotService.createNewSession();
  return res.status(201).json({ chatId });
});

/**
 * DELETE /api/chat/:chatId
 * Deletes a conversation session from cache.
 * Returns: { success: boolean }
 */
app.delete('/api/chat/:chatId', (req, res) => {
  const { chatId } = req.params;
  const deleted = chatbotService.deleteSession(chatId);
  return res.status(200).json({ success: deleted });
});

/**
 * GET /health
 * Health check endpoint.
 */
app.get('/health', (req, res) => {
  return res.status(200).json({ status: 'ok', service: 'nutrigame-chatbot' });
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[NutriCoach Chatbot Service] Running on port ${PORT}`);
});

module.exports = app;
