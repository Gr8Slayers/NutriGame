import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ServerResponse } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { chatbotModel } from '../models/chatbot.model';
import {
  filterHistoryPersonalInformation,
  filterPersonalInformation,
} from '../utils/privacyUtils';

type ChatRole = 'user' | 'model';
type ChatHistoryItem = { role: ChatRole; parts: Array<{ text: string }> };
type SupportedLanguage = 'tr' | 'en';
type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack' | null;
type UserGoal = 'fat_loss' | 'muscle_gain' | 'weight_gain' | 'general';
type GenerativeModelLike = {
  generateContent: (args: { contents: ChatHistoryItem[] }) => Promise<{ response: { text: () => string | undefined } }>;
};

const MAX_MESSAGES_PER_MINUTE = parseInt(process.env.MAX_MESSAGES_PER_MINUTE ?? '10', 10);
const MAX_MESSAGE_LENGTH = parseInt(process.env.MAX_MESSAGE_LENGTH ?? '2000', 10);
const CONVERSATION_TTL_MS = parseInt(process.env.CONVERSATION_TTL_MS ?? '3600000', 10);
const MAX_CONTEXT_MESSAGES = parseInt(process.env.CHATBOT_CONTEXT_MESSAGES ?? '12', 10);
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';

const CHATBOT_SYSTEM_PROMPT = `
You are NutriCoach, a friendly nutrition and healthy-lifestyle assistant for the NutriGame app.
Always reply in the same language the user wrote in. If the user writes in Turkish, reply in Turkish; if in English, reply in English.
Always produce a helpful textual answer of at least one full sentence. Never reply with only an emoji or empty text.
Keep answers practical, supportive, and concise (2-5 sentences).
Prioritize nutrition, hydration, meal planning, exercise habits, sleep, and sustainable weight management.
Do not claim to diagnose, prescribe, or replace a doctor.
If a question is outside nutrition or healthy lifestyle topics, gently redirect the user back to those topics in a warm tone.
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

type ProviderErrorDetail = {
  '@type'?: string;
  retryDelay?: string;
};

type ProviderError = Error & {
  status?: number;
  statusText?: string;
  errorDetails?: ProviderErrorDetail[];
};

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

function createHttpError(message: string, statusCode: number, retryAfterMs?: number, code?: string) {
  const error = new Error(message) as Error & { statusCode: number; retryAfterMs?: number; code?: string };
  error.statusCode = statusCode;
  if (retryAfterMs !== undefined) {
    error.retryAfterMs = retryAfterMs;
  }
  if (code) {
    error.code = code;
  }
  return error;
}

function parseRetryDelayToMs(retryDelay: string | undefined): number | undefined {
  if (!retryDelay) {
    return undefined;
  }

  const match = retryDelay.trim().match(/^(\d+(?:\.\d+)?)(ms|s|m)?$/i);
  if (!match) {
    return undefined;
  }

  const value = Number(match[1]);
  const unit = (match[2] ?? 's').toLowerCase();

  if (!Number.isFinite(value)) {
    return undefined;
  }

  if (unit === 'ms') {
    return Math.max(1, Math.round(value));
  }

  if (unit === 'm') {
    return Math.max(1, Math.round(value * 60_000));
  }

  return Math.max(1, Math.round(value * 1000));
}

function extractRetryAfterMs(error: ProviderError): number | undefined {
  const retryInfo = error.errorDetails?.find((detail) => detail['@type']?.includes('RetryInfo'));
  const fromDetail = parseRetryDelayToMs(retryInfo?.retryDelay);
  if (fromDetail !== undefined) {
    return fromDetail;
  }

  const messageMatch = error.message?.match(/retry in\s+(\d+(?:\.\d+)?)s/i);
  if (messageMatch) {
    return Math.max(1, Math.round(Number(messageMatch[1]) * 1000));
  }

  return undefined;
}

function isProviderQuotaError(error: ProviderError): boolean {
  if (error.status === 429) {
    return true;
  }

  const message = `${error.statusText ?? ''} ${error.message ?? ''}`.toLowerCase();
  return message.includes('quota') || message.includes('too many requests') || message.includes('rate limit');
}

function sanitizeText(text: string): string {
  return filterPersonalInformation(text).trim();
}

function sanitizeHistory(history: ChatHistoryItem[]): ChatHistoryItem[] {
  return filterHistoryPersonalInformation(history).map((entry) => ({
    ...entry,
    parts: entry.parts.map((part) => ({
      ...part,
      text: part.text.trim(),
    })),
  }));
}

function isNutritionRelated(message: string): boolean {
  const normalized = message.toLocaleLowerCase('tr-TR');
  return TOPIC_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function detectLanguage(text: string): SupportedLanguage {
  const normalized = text.toLocaleLowerCase('tr-TR');
  const turkishSignal = /\b(merhaba|bana|tasarla|kahvalti|ogle|öğle|aksam|akşam|beslenme|ogun|öğün|kilo|yag|yağ|protein|su|uyku|egzersiz|ne|nasil|nasıl|bugun|bugün|oner|öner|peki|yemeliyim)\b/.test(
    normalized,
  );
  const englishSignal = /\b(hello|breakfast|lunch|dinner|snack|nutrition|meal|protein|water|sleep|exercise|weight|what|should|after|workout|plan)\b/.test(
    normalized,
  );

  if (/[çğıöşü]/i.test(text) || turkishSignal) {
    return 'tr';
  }

  if (englishSignal) {
    return 'en';
  }

  return 'en';
}

function getRecentUserContext(history: ChatHistoryItem[], currentMessage: string): string {
  const previousUserMessages = history
    .filter((entry) => entry.role === 'user')
    .flatMap((entry) => entry.parts.map((part) => part.text.trim()))
    .filter((text) => text && text !== currentMessage)
    .slice(-3);

  return [previousUserMessages.join(' '), currentMessage].filter(Boolean).join(' ').trim();
}

function detectMealSlot(text: string): MealSlot {
  const normalized = text.toLocaleLowerCase('tr-TR');

  if (/(kahvalti|breakfast|morning)/.test(normalized)) {
    return 'breakfast';
  }

  if (/(ogle|ögle|ogle|öğle|lunch|noon)/.test(normalized)) {
    return 'lunch';
  }

  if (/(aksam|akşam|dinner|evening|gece yemegi|supper)/.test(normalized)) {
    return 'dinner';
  }

  if (/(ara ogun|ara ogün|atistirm|atıştırm|snack)/.test(normalized)) {
    return 'snack';
  }

  return null;
}

function detectGoal(text: string): UserGoal {
  const normalized = text.toLocaleLowerCase('tr-TR');

  if (/(yag yak|yağ yak|yag kay|yağ kay|zayifla|zayıfla|kilo ver|fat loss|lose fat|cut)/.test(normalized)) {
    return 'fat_loss';
  }

  if (/(kas kazan|kas yap|muscle gain|build muscle|hypertrophy|bulk)/.test(normalized)) {
    return 'muscle_gain';
  }

  if (/(kilo al|weight gain|gain weight)/.test(normalized)) {
    return 'weight_gain';
  }

  return 'general';
}

function isFollowUpMessage(text: string): boolean {
  const normalized = text.toLocaleLowerCase('tr-TR').trim();
  return /^(peki|tamam|ya|ee|then|what about|and|ok\b|okay\b|so\b)/.test(normalized);
}

function getMealLabel(mealSlot: MealSlot, language: SupportedLanguage): string {
  const labels = {
    tr: {
      breakfast: 'kahvaltida',
      lunch: 'ogle yemeginde',
      dinner: 'aksam yemeginde',
      snack: 'ara ogunde',
    },
    en: {
      breakfast: 'breakfast',
      lunch: 'lunch',
      dinner: 'dinner',
      snack: 'a snack',
    },
  } as const;

  if (!mealSlot) {
    return language === 'tr' ? 'bir ogunde' : 'a balanced meal';
  }

  return labels[language][mealSlot];
}

function buildHydrationReply(language: SupportedLanguage): string {
  if (language === 'tr') {
    return 'Gun icine suyu yaymak icin her ana ogune 1 bardak su ekleyip yaninda tasinabilir bir sise bulundurabilirsin. Egzersiz yapiyorsan veya hava sicaksa ihtiyacin artabilir; idrar renginin acik sari kalmasi iyi bir pratik kontroldur.';
  }

  return 'A practical hydration habit is to pair each main meal with a glass of water and keep a refillable bottle nearby. If you are training hard or the weather is hot, your needs can rise, so pale-yellow urine is a simple hydration check.';
}

function buildProteinReply(language: SupportedLanguage, mealSlot: MealSlot, goal: UserGoal): string {
  const mealLabel = getMealLabel(mealSlot, language);

  if (language === 'tr') {
    if (goal === 'muscle_gain') {
      return `${mealLabel} yumurta, yogurt, kefir, tavuk, balik veya kurubaklagil gibi protein kaynaklarini ana oge yapmaya calis. Yanina tam tahil ya da meyve eklemek toparlanmayi ve gunluk enerji dengesini destekler.`;
    }

    if (goal === 'fat_loss') {
      return `${mealLabel} proteini onceleyip yanina sebze ve olculu kompleks karbonhidrat eklemek daha tok kalmana yardimci olur. Ornek olarak yumurta-yogurt, tavuk-salata veya mercimek-cacik gibi kombinasyonlar iyi baslangictir.`;
    }

    return `${mealLabel} yumurta, yogurt, peynir, kefir, tavuk, balik veya kurubaklagil gibi bir protein kaynagi bulundurmaya calis. Proteini gun icine yaymak hem toklugu hem de gunluk toparlanmayi destekler.`;
  }

  if (goal === 'muscle_gain') {
    return `For ${mealLabel}, make protein the anchor of the meal with options like eggs, Greek yogurt, chicken, fish, tofu, or beans. Adding fruit or whole grains on the side can support recovery and help you reach your energy needs.`;
  }

  if (goal === 'fat_loss') {
    return `For ${mealLabel}, keep protein high and pair it with vegetables plus a measured portion of complex carbs to stay fuller for longer. Simple combinations like eggs and yogurt, chicken with salad, or lentils with yogurt work well.`;
  }

  return `For ${mealLabel}, include a clear protein source such as eggs, yogurt, cheese, chicken, fish, tofu, or beans. Spreading protein across the day usually helps with fullness and steady energy.`;
}

function buildWeightReply(language: SupportedLanguage, goal: UserGoal): string {
  if (language === 'tr') {
    if (goal === 'muscle_gain') {
      return 'Kas kazanimi icin her ana ogunde protein, yaninda kompleks karbonhidrat ve duzenli ara ogun plani iyi bir baslangictir. Antrenman sonrasi yogurt-meyve, sutlu yulaf veya tavuk-pilav gibi kombinasyonlar toparlanmayi destekler.';
    }

    if (goal === 'weight_gain') {
      return 'Saglikli kilo almak icin ogun atlamamaya, ana ogunlere kuruyemis, yogurt, peynir, zeytinyagi veya tahin gibi enerji yogun eklemeler yapmaya odaklanabilirsin. Sivida kalori almak icin sut, kefir veya meyveli yogurtlu icecekler de pratik olur.';
    }

    return 'Surdurulebilir kilo yonetiminde tabagin yarisini sebze, ceyregini protein, ceyregini kompleks karbonhidrat yapisi ile kurmak iyi bir baslangictir. Porsiyon takibi, duzenli uyku ve sekerli icecekleri azaltmak genelde en hizli fark yaratan adimlardandir.';
  }

  if (goal === 'muscle_gain') {
    return 'For muscle gain, build meals around protein, add structured carbs, and avoid skipping meals. Post-workout options like yogurt with fruit, oats with milk, or chicken with rice are practical ways to support recovery.';
  }

  if (goal === 'weight_gain') {
    return 'For healthy weight gain, focus on consistent meals and add energy-dense extras like nuts, yogurt, cheese, olive oil, or tahini. Milk-based smoothies and yogurt-fruit drinks can also make it easier to increase intake without forcing huge meals.';
  }

  return 'A sustainable weight-management plate is usually half vegetables, a quarter protein, and a quarter high-fiber carbs. Portion awareness, regular sleep, and cutting back on sugary drinks tend to create the fastest consistent progress.';
}

function buildCalorieReply(language: SupportedLanguage): string {
  if (language === 'tr') {
    return 'Kalori hedefini yonetirken sadece toplam miktara degil, ogunun protein ve lif icermesine de bakmak faydalidir. Paketli atistirmaliklari azaltip ayni kaloriyi yogurt, meyve, yumurta veya kurubaklagil gibi daha tok tutan kaynaklardan almak genelde daha iyi sonuc verir.';
  }

  return 'When you manage calories, focus on meal quality as well as the total number. Replacing packaged snacks with more filling choices like yogurt, fruit, eggs, or beans usually makes calorie control much easier.';
}

function buildMealReply(language: SupportedLanguage, mealSlot: MealSlot, goal: UserGoal, followUp: boolean): string {
  const mealLabel = getMealLabel(mealSlot, language);

  if (language === 'tr') {
    const opener = followUp
      ? `${mealLabel.charAt(0).toUpperCase()}${mealLabel.slice(1)} protein agirlikli bir tabak kurup yanina sebze eklemeyi dusunebilirsin.`
      : `${mealLabel.charAt(0).toUpperCase()} protein, lifli karbonhidrat ve saglikli yag dengesini kurmak iyi baslangictir.`;

    if (goal === 'fat_loss') {
      return `${opener} Yag kaybi hedefinde yumurta-yogurt-yulaf, tavuk-salata-bulgur veya corba-izgara yogurt gibi sade kombinasyonlar hem tok tutar hem de kaloriyi kontrol etmeyi kolaylastirir.`;
    }

    if (goal === 'muscle_gain') {
      return `${opener} Kas kazanimi icin tavuk-pilav-sebze, omlet-ekmek-meyve veya yogurt-yulaf-muz gibi kombinasyonlarla hem proteini hem enerjiyi destekleyebilirsin.`;
    }

    return `${opener} Ornek olarak omlet ve tam bugday ekmegi, tavuklu salata yanina yogurt veya mercimek corbasi yanina ayran gibi kombinasyonlar gunluk duzeni kurmana yardimci olur.`;
  }

  const opener = followUp
    ? `For ${mealLabel}, start with a protein-focused plate and add vegetables on the side.`
    : `For ${mealLabel}, aim for protein, fiber-rich carbs, and a modest amount of healthy fat.`;

  if (goal === 'fat_loss') {
    return `${opener} For fat loss, simple combinations like eggs with yogurt and oats, chicken with salad and bulgur, or soup with grilled protein tend to be filling while keeping calories easier to manage.`;
  }

  if (goal === 'muscle_gain') {
    return `${opener} For muscle gain, combinations like chicken with rice, an omelet with bread and fruit, or yogurt with oats and banana can support both protein intake and energy needs.`;
  }

  return `${opener} Practical examples are eggs with whole-grain toast, chicken salad with yogurt, or lentil soup with ayran so the meal feels balanced and easy to repeat.`;
}

function buildGenericNutritionReply(language: SupportedLanguage): string {
  if (language === 'tr') {
    return 'Dengeli bir ogun icin once protein, sonra sebze veya meyve, sonra da lifli karbonhidrat eklemeyi dusunebilirsin. Hedefini yazarsan kahvalti, ara ogun, kilo verme veya kas kazanimi icin daha net bir oneriyi daraltabilirim.';
  }

  return 'A balanced meal usually gets easier when you anchor it with protein, then add produce, then a fiber-rich carb. If you share your goal, I can narrow this into a more specific breakfast, snack, fat-loss, or muscle-gain suggestion.';
}

function buildFallbackReply(
  message: string,
  history: ChatHistoryItem[] = [],
  options?: { limitedMode?: boolean },
): string {
  const context = getRecentUserContext(history, message);
  const language = detectLanguage(context || message);
  const mealSlot = detectMealSlot(message) ?? detectMealSlot(context);
  const goal = detectGoal(context);
  const followUp = isFollowUpMessage(message);
  const limitedModeLead = options?.limitedMode
    ? language === 'tr'
      ? 'NutriCoach su an temel modda calisiyor; bu yuzden en pratik oneriden basliyorum. '
      : "NutriCoach is in a limited mode right now, so I'll start with the most practical advice. "
    : '';
  const normalized = context.toLocaleLowerCase('tr-TR');

  if (!isNutritionRelated(context || message)) {
    return language === 'tr'
      ? `${limitedModeLead}Ben daha cok beslenme, su tuketimi, ogun planlama, kilo yonetimi ve saglikli yasam konularinda yardimci olabiliyorum. Istersen bu hedeflerden biriyle ilgili sorunu yaz.`
      : `${limitedModeLead}I can help most with nutrition, hydration, meal planning, weight management, and healthy routines. If you want, send a question about one of those goals and I will narrow it down.`;
  }

  if (normalized.includes('su') || normalized.includes('hydration') || normalized.includes('water')) {
    return `${limitedModeLead}${buildHydrationReply(language)}`;
  }

  if (normalized.includes('protein')) {
    return `${limitedModeLead}${buildProteinReply(language, mealSlot, goal)}`;
  }

  if (normalized.includes('kalori') || normalized.includes('calorie')) {
    return `${limitedModeLead}${buildCalorieReply(language)}`;
  }

  if (
    normalized.includes('kilo') ||
    normalized.includes('weight') ||
    normalized.includes('diyet') ||
    normalized.includes('diet')
  ) {
    return `${limitedModeLead}${buildWeightReply(language, goal)}`;
  }

  if (mealSlot || followUp) {
    return `${limitedModeLead}${buildMealReply(language, mealSlot, goal, followUp)}`;
  }

  return `${limitedModeLead}${buildGenericNutritionReply(language)}`;
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
    return '';
  }

  return normalized;
}

async function loadHistory(chatId: string, latestMessage: string): Promise<ChatHistoryItem[]> {
  const cached = sessionCache.get(chatId);
  if (cached && Date.now() - cached.updatedAt <= CONVERSATION_TTL_MS) {
    const nextHistory: ChatHistoryItem[] = [
      ...cached.history,
      { role: 'user', parts: [{ text: sanitizeText(latestMessage) }] },
    ];
    return sanitizeHistory(nextHistory.slice(-MAX_CONTEXT_MESSAGES));
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

      const sanitizedHistory = sanitizeHistory(history);
      sessionCache.set(chatId, { updatedAt: Date.now(), history: sanitizedHistory });
      return sanitizedHistory;
    }
  } catch (error) {
    console.error('[chatbot.service] Failed to load DB chat history:', error);
  }

  const initialHistory: ChatHistoryItem[] = [
    { role: 'user', parts: [{ text: sanitizeText(latestMessage) }] },
  ];
  const sanitizedInitialHistory = sanitizeHistory(initialHistory);
  sessionCache.set(chatId, { updatedAt: Date.now(), history: sanitizedInitialHistory });
  return sanitizedInitialHistory;
}

async function generateModelResponse(model: GenerativeModelLike, history: ChatHistoryItem[]): Promise<string> {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const result = await model.generateContent({ contents: history });
    const normalized = normalizeReply(result.response.text());

    if (normalized) {
      return normalized;
    }

    console.warn(`[chatbot.service] Gemini returned an empty response on attempt ${attempt}.`);
  }

  throw createHttpError(
    'NutriCoach could not generate a usable response right now. Please try again.',
    503,
    undefined,
    'AI_UNAVAILABLE',
  );
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
      'CHAT_RATE_LIMIT',
    );
  }

  const resolvedChatId = chatId ?? createNewSession();
  const history = await loadHistory(resolvedChatId, message);

  let response = buildFallbackReply(message, history);
  const aiClient = getGenerativeModel();

  if (aiClient) {
    try {
      const model = aiClient.getGenerativeModel({
        model: GEMINI_MODEL,
        systemInstruction: CHATBOT_SYSTEM_PROMPT,
      });

      response = await generateModelResponse(model, history);
    } catch (error) {
      console.error('[chatbot.service] Gemini request failed:', error);

      const providerError = error as ProviderError;
      if (isProviderQuotaError(providerError)) {
        console.warn(
          '[chatbot.service] Falling back to rule-based reply because Gemini quota is unavailable.',
          {
            retryAfterMs: extractRetryAfterMs(providerError),
            model: GEMINI_MODEL,
          },
        );
        response = buildFallbackReply(message, history, { limitedMode: true });
      } else if ((error as { code?: string }).code === 'AI_UNAVAILABLE') {
        console.warn('[chatbot.service] Falling back to rule-based reply because Gemini returned no usable text.');
        response = buildFallbackReply(message, history, { limitedMode: true });
      } else {
        response = buildFallbackReply(message, history, { limitedMode: true });
      }
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
