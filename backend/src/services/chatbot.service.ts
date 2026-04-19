import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ServerResponse } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { chatbotModel } from '../models/chatbot.model';

type ChatRole = 'user' | 'model';
type ChatHistoryItem = { role: ChatRole; parts: Array<{ text: string }> };

const MAX_MESSAGES_PER_MINUTE = parseInt(process.env.MAX_MESSAGES_PER_MINUTE ?? '10', 10);
const MAX_MESSAGE_LENGTH = parseInt(process.env.MAX_MESSAGE_LENGTH ?? '2000', 10);
const CONVERSATION_TTL_MS = parseInt(process.env.CONVERSATION_TTL_MS ?? '3600000', 10);
const MAX_CONTEXT_MESSAGES = parseInt(process.env.CHATBOT_CONTEXT_MESSAGES ?? '12', 10);
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash';

const CHATBOT_SYSTEM_PROMPT = `
You are NutriCoach, a friendly nutrition and healthy-lifestyle assistant for the NutriGame app.
Keep answers practical, supportive, and concise.
Prioritize nutrition, hydration, meal planning, exercise habits, sleep, and sustainable weight management.
Do not claim to diagnose, prescribe, or replace a doctor.
If a question is outside nutrition or healthy lifestyle topics, gently redirect the user back to those topics.
`.trim();

const TOPIC_KEYWORDS = [
  'nutrition',
  'nutri',
  'food',
  'meal',
  'diet',
  'healthy',
  'health',
  'calorie',
  'protein',
  'carb',
  'fat',
  'fiber',
  'vitamin',
  'mineral',
  'hydration',
  'water',
  'exercise',
  'sleep',
  'weight',
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'beslen',
  'kalori',
  'protein',
  'karbonhidrat',
  'yag',
  'yağ',
  'lif',
  'vitamin',
  'mineral',
  'su ',
  'egzersiz',
  'uyku',
  'kilo',
  'kahval',
  'ogle',
  'öğle',
  'aksam',
  'akşam',
  'atistirm',
  'atıştırm',
  'diyet',
];

const sessionCache = new Map<string, { updatedAt: number; history: ChatHistoryItem[] }>();
const rateLimitCache = new Map<string, { count: number; windowStart: number }>();

let genAI: GoogleGenerativeAI | null | undefined;

function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [chatId, session] of sessionCache.entries()) {
    if (now - session.updatedAt > CONVERSATION_TTL_MS) {
      sessionCache.delete(chatId);
    }
  }
}

const cleanupTimer = setInterval(cleanupExpiredSessions, 60_000);
cleanupTimer.unref();

function createHttpError(message: string, statusCode: number, retryAfterMs?: number) {
  const error = new Error(message) as Error & { statusCode: number; retryAfterMs?: number };
  error.statusCode = statusCode;
  if (retryAfterMs !== undefined) {
    error.retryAfterMs = retryAfterMs;
  }
  return error;
}

function sanitizeText(text: string): string {
  return text
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[redacted-email]')
    .replace(/\b(?:\+?\d[\d\s().-]{8,}\d)\b/g, '[redacted-phone]')
    .replace(/\b\d{11}\b/g, '[redacted-id]')
    .trim();
}

function isNutritionRelated(message: string): boolean {
  const normalized = message.toLocaleLowerCase('tr-TR');
  return TOPIC_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function buildFallbackReply(message: string): string {
  const prefix = '';

  if (!isNutritionRelated(message)) {
    return `${prefix}Ben daha cok beslenme, su tuketimi, ogun planlama, kilo yonetimi ve saglikli yasam konularinda yardimci olabiliyorum. Istersen bu hedeflerden biriyle ilgili sorunu yaz.`;
  }

  const normalized = message.toLocaleLowerCase('tr-TR');

  if (normalized.includes('su') || normalized.includes('hydration') || normalized.includes('water')) {
    return `${prefix}Gun icinde duzenli su icmek icin her ogune 1 bardak su eklemeyi, yaninda tasinabilir bir sise bulundurmayi ve idrar renginin acik sari olmasini takip etmeyi deneyebilirsin. Yogun egzersiz yapiyorsan veya hava sicaksa ihtiyacin artabilir.`;
  }

  if (normalized.includes('protein')) {
    return `${prefix}Protein alimini dengelemek icin yumurta, yogurt, kefir, kurubaklagil, tavuk, balik veya peynir gibi kaynaklari ana ogunlerine yaymak faydali olur. Hedefin yag kaybiysa proteini sebze ve tam tahillarla birlestirmek tok kalmana yardimci olabilir.`;
  }

  if (normalized.includes('kilo') || normalized.includes('weight') || normalized.includes('diyet')) {
    return `${prefix}Surdurulebilir kilo yonetiminde tabagin yarisini sebze, ceyregini protein, ceyregini kompleks karbonhidrat yapisi ile kurmak iyi bir baslangictir. Porsiyon takibi, duzenli uyku ve sekerli icecekleri azaltmak da genelde en hizli fark yaratan adimlardandir.`;
  }

  return `${prefix}Dengeli bir ogun icin protein, lifli karbonhidrat ve saglikli yag kombinasyonu kurmayi deneyebilirsin. Istersen hedefini yaz; kahvalti, ara ogun, kilo verme veya kas kazanimi icin daha net bir plan onerebilirim.`;
}

function getGenerativeModel() {
  if (genAI !== undefined) {
    return genAI;
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
  return genAI;
}

function normalizeReply(text: string | undefined): string {
  const normalized = text?.trim();
  if (!normalized) {
    return 'Su an anlamli bir yanit uretemedim. Sorunu biraz daha acik yazarsan yardimci olayim.';
  }

  return normalized;
}

async function loadHistory(chatId: string, latestMessage: string): Promise<ChatHistoryItem[]> {
  const cached = sessionCache.get(chatId);
  if (cached && Date.now() - cached.updatedAt <= CONVERSATION_TTL_MS) {
    return cached.history;
  }

  try {
    const dbMessages = await chatbotModel.getSessionMessages(chatId);
    if (dbMessages.length > 0) {
      const history: ChatHistoryItem[] = dbMessages.slice(-MAX_CONTEXT_MESSAGES).map((message) => {
        const role: ChatRole = message.role === 'model' ? 'model' : 'user';
        return {
          role,
          parts: [{ text: sanitizeText(message.content) }],
        };
      });

      sessionCache.set(chatId, { updatedAt: Date.now(), history });
      return history;
    }
  } catch (error) {
    console.error('[chatbot.service] Failed to load DB chat history:', error);
  }

  const initialHistory: ChatHistoryItem[] = [
    { role: 'user', parts: [{ text: sanitizeText(latestMessage) }] },
  ];
  sessionCache.set(chatId, { updatedAt: Date.now(), history: initialHistory });
  return initialHistory;
}

export function validateMessage(message: string): { valid: boolean; error?: string } {
  if (typeof message !== 'string' || !message.trim()) {
    return { valid: false, error: 'Message cannot be empty.' };
  }

  if (message.trim().length > MAX_MESSAGE_LENGTH) {
    return {
      valid: false,
      error: `Message cannot be longer than ${MAX_MESSAGE_LENGTH} characters.`,
    };
  }

  return { valid: true };
}

export function checkRateLimit(userId: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const current = rateLimitCache.get(userId);

  if (!current || now - current.windowStart >= 60_000) {
    rateLimitCache.set(userId, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (current.count >= MAX_MESSAGES_PER_MINUTE) {
    return {
      allowed: false,
      retryAfterMs: Math.max(1, 60_000 - (now - current.windowStart)),
    };
  }

  current.count += 1;
  return { allowed: true };
}

export function createNewSession(): string {
  const chatId = uuidv4();
  sessionCache.set(chatId, { updatedAt: Date.now(), history: [] });
  return chatId;
}

export function getChatHistory(chatId: string) {
  cleanupExpiredSessions();
  return {
    chatId,
    history: sessionCache.get(chatId)?.history ?? [],
  };
}

export function deleteSession(chatId: string): boolean {
  return sessionCache.delete(chatId);
}

export async function chat(
  userId: string,
  chatId: string | null,
  message: string,
): Promise<{ chatId: string; response: string }> {
  const validation = validateMessage(message);
  if (!validation.valid) {
    throw createHttpError(validation.error ?? 'Invalid message.', 400);
  }

  const rateLimit = checkRateLimit(userId);
  if (!rateLimit.allowed) {
    throw createHttpError(
      'Too many chatbot messages. Please wait a bit before trying again.',
      429,
      rateLimit.retryAfterMs,
    );
  }

  const resolvedChatId = chatId ?? createNewSession();
  const history = await loadHistory(resolvedChatId, message);

  let response = buildFallbackReply(message);
  const aiClient = getGenerativeModel();

  if (aiClient) {
    try {
      const model = aiClient.getGenerativeModel({
        model: GEMINI_MODEL,
        systemInstruction: CHATBOT_SYSTEM_PROMPT,
      });

      const result = await model.generateContent({ contents: history });
      response = normalizeReply(result.response.text());
    } catch (error) {
      console.error('[chatbot.service] Gemini request failed:', error);
      response = buildFallbackReply(message);
    }
  }

  const updatedHistory = [
    ...history,
    { role: 'model' as const, parts: [{ text: response }] },
  ].slice(-MAX_CONTEXT_MESSAGES);

  sessionCache.set(resolvedChatId, {
    updatedAt: Date.now(),
    history: updatedHistory,
  });

  return { chatId: resolvedChatId, response };
}

export async function chatStream(
  userId: string,
  chatId: string | null,
  message: string,
  res: ServerResponse,
): Promise<void> {
  const result = await chat(userId, chatId, message);
  res.write(`data: ${JSON.stringify({ chunk: result.response })}\n\n`);
  res.write(`data: ${JSON.stringify({ done: true, chatId: result.chatId })}\n\n`);
  res.end();
}
