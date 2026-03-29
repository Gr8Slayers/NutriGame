/**
 * Type declarations for chatbotService.js
 */

export function chat(
  userId: string,
  chatId: string | null,
  message: string,
): Promise<{ chatId: string; response: string }>;

export function chatStream(
  userId: string,
  chatId: string | null,
  message: string,
  res: import('http').ServerResponse,
): Promise<void>;

export function getChatHistory(
  chatId: string,
): { chatId: string; history: Array<{ role: string; parts: Array<{ text: string }> }> };

export function createNewSession(): string;

export function deleteSession(chatId: string): boolean;

export function validateMessage(
  message: string,
): { valid: boolean; error?: string };

export function checkRateLimit(
  userId: string,
): { allowed: boolean; retryAfterMs?: number };
