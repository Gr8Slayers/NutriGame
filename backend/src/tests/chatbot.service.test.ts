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

    it('retries once and then throws 503 when Gemini keeps returning empty text', async () => {
        const generateContent = jest
            .fn()
            .mockResolvedValueOnce({
                response: { text: () => '   ' },
            })
            .mockResolvedValueOnce({
                response: { text: () => '' },
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

        await expect(service.chat('empty-user', 'empty-chat', 'Bugün ne yemeliyim?')).rejects.toMatchObject({
            statusCode: 503,
        });
        expect(generateContent).toHaveBeenCalledTimes(2);
    });

    it('includes the latest user message when using cached conversation history', async () => {
        const generateContent = jest
            .fn()
            .mockResolvedValueOnce({
                response: { text: () => 'İlk yanıt' },
            })
            .mockResolvedValueOnce({
                response: { text: () => 'İkinci yanıt' },
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

        await service.chat('ctx-user', 'ctx-chat', 'Yağ kaybı için kahvaltı öner.');
        await service.chat('ctx-user', 'ctx-chat', 'Peki öğle yemeğinde?');

        const secondCallArgs = generateContent.mock.calls[1][0];
        const contents = secondCallArgs.contents as Array<{ role: string; parts: Array<{ text: string }> }>;
        expect(contents[contents.length - 1].role).toBe('user');
        expect(contents[contents.length - 1].parts[0].text).toBe('Peki öğle yemeğinde?');
    });

    it('masks email, phone, card, and address PII before sending to Gemini', async () => {
        const generateContent = jest
            .fn()
            .mockResolvedValueOnce({
                response: { text: () => 'Tamam.' },
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

        await service.chat(
            'pii-user',
            'pii-chat',
            'Emailim test@example.com, telefonum +90 555 123 45 67, kartim 4111 1111 1111 1111, adresim 123 Main Street.'
        );

        const firstCallArgs = generateContent.mock.calls[0][0];
        const contents = firstCallArgs.contents as Array<{ parts: Array<{ text: string }> }>;
        const sanitized = contents[0].parts[0].text;

        expect(sanitized).toContain('[PII_REMOVED]');
        expect(sanitized).not.toContain('test@example.com');
        expect(sanitized).not.toContain('4111 1111 1111 1111');
        expect(sanitized).not.toContain('123 Main Street');
    });
});
