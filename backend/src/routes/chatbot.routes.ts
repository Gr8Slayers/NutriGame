/**
 * Chatbot Routes — /api/chat
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  handleChat,
  handleGetHistory,
  handleNewSession,
  handleDeleteSession,
} from '../controllers/chatbot.controller';

const router = Router();

// All chatbot routes require authentication
router.use(authMiddleware);

// POST /api/chat — Send a message and get AI response
router.post('/send', authMiddleware, handleChat);

// POST /api/chat/new — Create a new conversation session 
router.post('/new', authMiddleware, handleNewSession);

// GET /api/chat/history/:chatId — Get conversation history
router.get('/history/:chatId', authMiddleware, handleGetHistory);

// DELETE /api/chat/:chatId — Delete a conversation session
router.delete('/:chatId', authMiddleware, handleDeleteSession);

export default router;
