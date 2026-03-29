/**
 * Chatbot Controller — Express request handlers for NutriCoach AI
 */

import { Request, Response } from 'express';
import {
  chat,
  getChatHistory,
  createNewSession,
  deleteSession,
} from '../../ai_service/ai_service/src/chatbot/chatbotService';

/**
 * POST /api/chat
 * Body: { message: string, chatId?: string }
 * Returns: { chatId: string, response: string }
 */
export async function handleChat(req: any, res: Response) {
  const userId = String(req.user!.id);
  const { message, chatId } = req.body;
  if (!req.user || !req.user.id) {
    return res.status(401).json({ success: false, message: 'Kimlik doğrulama hatası (User ID bulunamadı).' });
  }

  if (!message) {
    return res.status(400).json({ success: false, message: 'message is required.' });
  }

  try {
    const result = await chat(userId, chatId || null, message);
    return res.status(200).json({ success: true, ...result });
  } catch (err: any) {
    return handleChatError(err, res);
  }
}

/**
 * GET /api/chat/history/:chatId
 * Returns: { chatId: string, history: Array }
 */
export function handleGetHistory(req: Request, res: Response) {
  const { chatId } = req.params;
  if (!chatId) {
    return res.status(400).json({ success: false, message: 'chatId is required.' });
  }
  const result = getChatHistory(chatId);
  return res.status(200).json({ success: true, ...result });
}

/**
 * POST /api/chat/new
 * Creates a new conversation session.
 * Returns: { chatId: string }
 */
export function handleNewSession(_req: Request, res: Response) {
  const chatId = createNewSession();
  return res.status(201).json({ success: true, chatId });
}

/**
 * DELETE /api/chat/:chatId
 * Deletes a conversation session from cache.
 * Returns: { success: boolean }
 */
export async function handleDeleteSession(req: Request, res: Response) {
  const { chatId } = req.params;
  const deleted = deleteSession(chatId);
  return res.status(200).json({ success: deleted });
}

/**
 * Centralized error handler for chat errors.
 * The JS chatbot service throws plain Error objects with statusCode and
 * retryAfterMs properties, so we duck-type check for those.
 */
function handleChatError(err: any, res: Response) {
  console.error('[ChatbotController Error]', err.message);

  if (err.statusCode) {
    const body: any = { success: false, message: err.message };
    if (err.retryAfterMs) {
      body.retryAfterMs = err.retryAfterMs;
      res.setHeader('Retry-After', Math.ceil(err.retryAfterMs / 1000));
    }
    return res.status(err.statusCode).json(body);
  }

  return res.status(500).json({ success: false, message: 'Internal server error.' });
}
