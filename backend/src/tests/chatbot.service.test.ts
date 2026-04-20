describe('chatbot.service provider error handling', () => {
    const originalApiKey = process.env.GEMINI_API_KEY;

    beforeEach(() => {
        jest.resetModules();
        process.env.GEMINI_API_KEY = 'test-gemini-key';
    });

    afterAll(() => {
        if (originalApiKey === undefined) {
            delete process.env.GEMINI_API_KEY;
        } else {
            process.env.GEMINI_API_KEY = originalApiKey;
        }
    });

    it('throws an HTTP 429 with retryAfterMs when Gemini quota is exceeded', async () => {
        const generateContent = jest.fn().mockRejectedValue({
            status: 429,
            statusText: 'Too Many Requests',
            message: 'Quota exceeded for model. Please retry in 20.851271357s.',
            errorDetails: [
                {
                    '@type': 'type.googleapis.com/google.rpc.RetryInfo',
                    retryDelay: '20s',
                },
            ],
        });

        jest.doMock('uuid', () => ({
            v4: () => 'mock-chat-id',
        }));

        jest.doMock('@google/generative-ai', () => ({
            GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
                getGenerativeModel: () => ({
                    generateContent,
                }),
            })),
        }));

        jest.doMock('../models/chatbot.model', () => ({
            chatbotModel: {
                getSessionMessages: jest.fn().mockResolvedValue([]),
            },
        }));

        const service = await import('../services/chatbot.service');

        await expect(service.chat('quota-user', 'quota-chat', 'Protein ağırlıklı kahvaltı öner.')).rejects.toMatchObject({
            statusCode: 429,
            retryAfterMs: 20000,
        });
    });
});
