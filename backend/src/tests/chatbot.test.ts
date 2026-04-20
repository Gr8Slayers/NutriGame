import request from 'supertest';
import express from 'express';

const mockChat = jest.fn();
const mockDeleteSession = jest.fn();
const mockCreateSession = jest.fn();
const mockAddMessage = jest.fn();
const mockGetUserSessions = jest.fn();
const mockGetSessionMessages = jest.fn();
const mockDeleteDbSession = jest.fn();

jest.mock('../middleware/auth.middleware', () => ({
    authMiddleware: (req: any, _res: any, next: any) => next(),
}));

jest.mock('uuid', () => ({
    v4: () => 'mock-chat-id',
}));

jest.mock('../services/chatbot.service', () => ({
    chat: (...args: any[]) => mockChat(...args),
    deleteSession: (...args: any[]) => mockDeleteSession(...args),
}));

jest.mock('../models/chatbot.model', () => ({
    chatbotModel: {
        createSession: (...args: any[]) => mockCreateSession(...args),
        addMessage: (...args: any[]) => mockAddMessage(...args),
        getUserSessions: (...args: any[]) => mockGetUserSessions(...args),
        getSessionMessages: (...args: any[]) => mockGetSessionMessages(...args),
        deleteSession: (...args: any[]) => mockDeleteDbSession(...args),
    },
}));

import chatbotRoutes from '../routes/chatbot.routes';

describe('Chatbot API and safety coverage', () => {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
        (req as any).user = { id: 42 };
        next();
    });
    app.use('/api/chat', chatbotRoutes);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('creates a session, stores both messages, and returns the chatbot reply', async () => {
        mockCreateSession.mockResolvedValue({ id: 'chat_1' });
        mockAddMessage.mockResolvedValue({});
        mockChat.mockResolvedValue({ chatId: 'chat_1', response: 'Protein ve lif iceren bir kahvalti deneyebilirsin.' });

        const res = await request(app)
            .post('/api/chat/send')
            .send({ message: 'Kahvalti icin ne yemeliyim?' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.chatId).toBe('chat_1');
        expect(res.body.response).toContain('kahvalti');
        expect(mockCreateSession).toHaveBeenCalledWith(42, expect.stringContaining('Kahvalti icin'));
        expect(mockAddMessage).toHaveBeenNthCalledWith(1, 'chat_1', 'user', 'Kahvalti icin ne yemeliyim?');
        expect(mockAddMessage).toHaveBeenNthCalledWith(2, 'chat_1', 'model', 'Protein ve lif iceren bir kahvalti deneyebilirsin.');
        expect(mockChat).toHaveBeenCalledWith('42', 'chat_1', 'Kahvalti icin ne yemeliyim?');
    });

    it('returns 429 and Retry-After when the service rate limit is hit', async () => {
        const error = Object.assign(new Error('Too many chatbot messages. Please wait a bit before trying again.'), {
            statusCode: 429,
            retryAfterMs: 1500,
        });

        mockCreateSession.mockResolvedValue({ id: 'chat_rate' });
        mockAddMessage.mockResolvedValue({});
        mockChat.mockRejectedValue(error);

        const res = await request(app)
            .post('/api/chat/send')
            .send({ message: 'Bugun ne yemeliyim?' });

        expect(res.status).toBe(429);
        expect(res.headers['retry-after']).toBe('2');
        expect(res.body.success).toBe(false);
        expect(res.body.retryAfterMs).toBe(1500);
    });

    it('returns formatted and reversed history for the chat screen', async () => {
        mockGetSessionMessages.mockResolvedValue([
            {
                id: 1,
                role: 'user',
                content: 'Merhaba',
                createdAt: new Date('2026-04-20T10:00:00.000Z'),
            },
            {
                id: 2,
                role: 'model',
                content: 'Su tuketimini gun icine yay.',
                createdAt: new Date('2026-04-20T10:01:00.000Z'),
            },
        ]);

        const res = await request(app).get('/api/chat/history/chat_1');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.messages).toHaveLength(2);
        expect(res.body.messages[0].text).toBe('Su tuketimini gun icine yay.');
        expect(res.body.messages[0].user.name).toBe('NutriCoach');
        expect(res.body.messages[1].text).toBe('Merhaba');
    });

    it('lists conversation summaries for the authenticated user', async () => {
        mockGetUserSessions.mockResolvedValue([
            {
                id: 'chat_1',
                title: 'Kahvalti...',
                createdAt: new Date('2026-04-20T09:00:00.000Z'),
                updatedAt: new Date('2026-04-20T09:05:00.000Z'),
            },
        ]);

        const res = await request(app).get('/api/chat/history');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.history[0].id).toBe('chat_1');
        expect(mockGetUserSessions).toHaveBeenCalledWith(42);
    });

    it('deletes the persisted session and the in-memory session cache', async () => {
        mockDeleteDbSession.mockResolvedValue({});
        mockDeleteSession.mockReturnValue(true);

        const res = await request(app).delete('/api/chat/chat_1');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(mockDeleteDbSession).toHaveBeenCalledWith('chat_1');
        expect(mockDeleteSession).toHaveBeenCalledWith('chat_1');
    });

    it('redirects off-topic prompts back to nutrition guidance in the real chatbot service', async () => {
        const previousApiKey = process.env.GEMINI_API_KEY;
        delete process.env.GEMINI_API_KEY;
        mockGetSessionMessages.mockResolvedValue([]);

        const actualService = jest.requireActual('../services/chatbot.service') as typeof import('../services/chatbot.service');
        const result = await actualService.chat('scope_user', 'scope_chat_1', 'Bana uzay gemisi tasarla');

        expect(result.chatId).toBe('scope_chat_1');
        expect(result.response.toLocaleLowerCase('tr-TR')).toContain('beslenme');

        if (previousApiKey !== undefined) {
            process.env.GEMINI_API_KEY = previousApiKey;
        }
    });
});
