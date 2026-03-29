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
import { chatbotModel } from '../models/chatbot.model';

/**
 * POST /api/chat
 * Body: { message: string, chatId?: string }
 * Returns: { chatId: string, response: string }
 */
export async function handleChat(req: any, res: Response) {
  try {
    const userId = parseInt(req.user?.id || req.userId);
    const { message, chatId } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Kimlik doğrulama hatası (User ID bulunamadı).' });
    }
    if (!message) {
      return res.status(400).json({ success: false, message: 'message is required.' });
    }

    let currentChatId = chatId;

    if (!currentChatId) {
      const title = message.substring(0, 30) + "..."; // İlk mesajı başlık yap
      const newSession = await chatbotModel.createSession(userId, title);
      currentChatId = newSession.id;
    }

    await chatbotModel.addMessage(currentChatId, 'user', message);

    const result = await chat(String(userId), currentChatId, message);

    await chatbotModel.addMessage(currentChatId, 'model', result.response);

    return res.status(200).json({
      success: true,
      chatId: currentChatId,
      response: result.response
    });

  } catch (err: any) {
    return handleChatError(err, res);
  }
}

/**
 * GET /api/chat/history
 */
export async function handleGetAllHistory(req: Request, res: Response) {
  try {
    const userId = parseInt((req as any).user?.id || (req as any).userId);
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const sessions = await chatbotModel.getUserSessions(userId);

    return res.status(200).json({ success: true, history: sessions });
  } catch (error: any) {
    console.error("[Chatbot Controller] handleGetAllHistory hatası:", error);
    return res.status(500).json({ success: false, message: 'Server error while fetching history' });
  }
}

/**
 * GET /api/chat/history/:chatId
 * Returns: { chatId: string, history: Array }
 */
export async function handleGetHistory(req: Request, res: Response) {
  try {
    const { chatId } = req.params;
    if (!chatId) {
      return res.status(400).json({ success: false, message: 'chatId is required.' });
    }
    const rawMessages = await chatbotModel.getSessionMessages(chatId);

    const formattedMessages = rawMessages.map((msg) => ({
      _id: msg.id,
      text: msg.content,
      createdAt: msg.createdAt,
      user: {
        _id: msg.role === 'user' ? 1 : 2,
        name: msg.role === 'user' ? 'You' : 'NutriCoach',
      }
    }));

    // GiftedChat için ters çeviriyoruz
    const giftedChatMessages = formattedMessages.reverse();

    return res.status(200).json({ success: true, messages: giftedChatMessages });
  } catch (error: any) {
    console.error("[Chatbot Controller] handleGetHistory hatası:", error);
    return res.status(500).json({ success: false, message: 'Server error while fetching session details' });
  }
}





/**
 * POST /api/chat/new
 * Creates a new conversation session.
 * Returns: { chatId: string }
 */
export async function handleNewSession(_req: Request, res: Response) {
  try {
    const userId = parseInt((_req as any).user?.id || (_req as any).userId);
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const session = await chatbotModel.createSession(userId, "New Chat");
    return res.status(201).json({ success: true, chatId: session.id });
  } catch (error: any) {
    console.error("[Chatbot Controller] handleNewSession hatası:", error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * DELETE /api/chat/:chatId
 * Deletes a conversation session from cache.
 * Returns: { success: boolean }
 */
export async function handleDeleteSession(req: Request, res: Response) {
  try {
    const { chatId } = req.params;
    if (!chatId) return res.status(400).json({ success: false, message: 'Chat ID is required' });

    await chatbotModel.deleteSession(chatId);

    try {
      deleteSession(chatId);
    } catch (e) {
      console.log("RAM'de silinecek session bulunamadı, atlandı.");
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("[Chatbot Controller] handleDeleteSession hatası:", error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
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
