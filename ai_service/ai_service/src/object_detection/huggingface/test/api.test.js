/**
 * Integration tests – API endpoints via supertest
 *
 * Test plan coverage:
 *   TC-03   Calorie estimation returned in response
 *   TC-E01  Non-food image → 422 + fallback: 'retake_photo'
 *   TC-E02  AI timeout     → 503 + fallback: 'manual_logging'
 *   NFR-03  10-second circuit-breaker threshold
 *   NFR-04  5 MB size limit, JPEG/PNG only
 *   TC-E06  Circuit breaker opens after repeated failures → 503
 *           Rate limiter blocks after 10 req/min → 429
 */

import { jest } from '@jest/globals';

// ── Mock hf-gradio-api.js BEFORE importing the app ───────────────────────────
const mockAnalyzeFoodFromHF  = jest.fn();
const mockAnalyzeBatchFromHF = jest.fn();

await jest.unstable_mockModule('../hf-gradio-api.js', () => ({
    analyzeFoodFromHF:  mockAnalyzeFoodFromHF,
    analyzeBatchFromHF: mockAnalyzeBatchFromHF,
}));

// ── Import app AFTER mocks are registered ─────────────────────────────────────
const { app, controller } = await import('../backend-integration.js');
const supertest            = (await import('supertest')).default;

const request = supertest(app);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Minimal valid JPEG buffer (< 1 KB, well under 5 MB limit). */
function fakeJpeg() {
    const soi     = Buffer.from([0xFF, 0xD8]);
    const app0Payload = Buffer.from([0x4A,0x46,0x49,0x46,0x00,0x01,0x01,0x00,0x00,0x01,0x00,0x01,0x00,0x00]);
    const app0Len = Buffer.alloc(2); app0Len.writeUInt16BE(app0Payload.length + 2);
    const app0    = Buffer.concat([Buffer.from([0xFF, 0xE0]), app0Len, app0Payload]);
    const sos     = Buffer.from([0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0x7F]);
    const eoi     = Buffer.from([0xFF, 0xD9]);
    return Buffer.concat([soi, app0, sos, eoi]);
}

/** Minimal valid PNG buffer. */
function fakePng() {
    return Buffer.from([
        0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A, // PNG signature
        0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52, // IHDR length + type
        0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01, // 1x1 px
        0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53, // bit depth, color type, CRC
        0xDE,0x00,0x00,0x00,0x0C,0x49,0x44,0x41, // IDAT length + type
        0x54,0x08,0xD7,0x63,0xF8,0xCF,0xC0,0x00,
        0x00,0x00,0x02,0x00,0x01,0xE2,0x21,0xBC, // IDAT data + CRC
        0x33,0x00,0x00,0x00,0x00,0x49,0x45,0x4E, // IEND
        0x44,0xAE,0x42,0x60,0x82,
    ]);
}

/** Standard successful HF response with calorie data. */
const FOOD_RESULT = {
    success:        true,
    detections:     [{ class: 'pizza', confidence: 0.853, estimatedCalories: 285 }],
    totalCalories:  285,
    raw_text:       'Detected items:\n• pizza: 85.3% (~285 kcal)\n\nEstimated total: ~285 kcal',
    annotated_image: { url: 'https://example.com/annotated.jpg' },
};

// ─── Reset state between tests ───────────────────────────────────────────────

beforeEach(() => {
    jest.clearAllMocks();
    // Reset circuit breaker and rate limiter to clean state
    controller.circuitBreaker.state        = 'CLOSED';
    controller.circuitBreaker.failureCount = 0;
    controller.circuitBreaker.nextAttemptAt = null;
    controller.rateLimiter.clients.clear();
});

// ─── Health endpoint ──────────────────────────────────────────────────────────

describe('GET /api/health', () => {
    test('returns 200 with service info and circuit breaker state', async () => {
        const res = await request.get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.service).toBe('food-recognition');
        expect(res.body.circuitBreaker).toBe('CLOSED');
        expect(res.body.timestamp).toBeDefined();
    });
});

// ─── POST /api/analyze-food ───────────────────────────────────────────────────

describe('POST /api/analyze-food', () => {

    // ── TC-03: successful calorie estimation ──────────────────────────────────
    test('TC-03 – returns detections with calorie estimates on success', async () => {
        mockAnalyzeFoodFromHF.mockResolvedValue(FOOD_RESULT);

        const res = await request
            .post('/api/analyze-food')
            .attach('image', fakeJpeg(), { filename: 'pizza.jpg', contentType: 'image/jpeg' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.detections).toHaveLength(1);
        expect(res.body.detections[0].class).toBe('pizza');
        expect(res.body.detections[0].estimatedCalories).toBe(285);
        expect(res.body.totalCalories).toBe(285);
        expect(res.body.summary.estimated_kcal).toBe(285);
        expect(res.body.source).toBe('huggingface');
    });

    test('TC-03 – summary includes comma-joined item names', async () => {
        mockAnalyzeFoodFromHF.mockResolvedValue({
            ...FOOD_RESULT,
            detections: [
                { class: 'pizza', confidence: 0.85, estimatedCalories: 285 },
                { class: 'apple', confidence: 0.72, estimatedCalories: 95 },
            ],
            totalCalories: 380,
        });

        const res = await request
            .post('/api/analyze-food')
            .attach('image', fakeJpeg(), { filename: 'meal.jpg', contentType: 'image/jpeg' });

        expect(res.body.summary.items).toBe('pizza, apple');
        expect(res.body.totalCalories).toBe(380);
    });

    // ── TC-E01: non-food image ─────────────────────────────────────────────────
    test('TC-E01 – returns 422 with retake_photo fallback for non-food image', async () => {
        const notFoodErr   = new Error('No food items detected. Please retake the photo with food visible.');
        notFoodErr.notFood = true;
        mockAnalyzeFoodFromHF.mockRejectedValue(notFoodErr);

        const res = await request
            .post('/api/analyze-food')
            .attach('image', fakeJpeg(), { filename: 'cat.jpg', contentType: 'image/jpeg' });

        expect(res.status).toBe(422);
        expect(res.body.success).toBe(false);
        expect(res.body.fallback).toBe('retake_photo');
        expect(res.body.error).toMatch(/food/i);
    });

    // ── TC-E02: AI timeout / circuit breaker ──────────────────────────────────
    test('TC-E02 – returns 503 with manual_logging fallback on timeout (NFR-03)', async () => {
        const timeoutErr  = new Error('AI service did not respond within 10 seconds.');
        timeoutErr.code   = 'ETIMEDOUT';
        mockAnalyzeFoodFromHF.mockRejectedValue(timeoutErr);

        const res = await request
            .post('/api/analyze-food')
            .attach('image', fakeJpeg(), { filename: 'food.jpg', contentType: 'image/jpeg' });

        expect(res.status).toBe(503);
        expect(res.body.success).toBe(false);
        expect(res.body.fallback).toBe('manual_logging');
    });

    test('TC-E02 – circuit breaker opens after 3 consecutive failures', async () => {
        const err = new Error('Network error'); // generic, non-notFood
        mockAnalyzeFoodFromHF.mockRejectedValue(err);

        // 3 failures to open the circuit
        for (let i = 0; i < 3; i++) {
            await request
                .post('/api/analyze-food')
                .attach('image', fakeJpeg(), { filename: 'f.jpg', contentType: 'image/jpeg' });
        }

        expect(controller.circuitBreaker.state).toBe('OPEN');

        // Next request should be rejected immediately (no AI call)
        const res = await request
            .post('/api/analyze-food')
            .attach('image', fakeJpeg(), { filename: 'f.jpg', contentType: 'image/jpeg' });

        expect(res.status).toBe(503);
        expect(res.body.fallback).toBe('manual_logging');
        // AI must NOT have been called on the 4th request
        expect(mockAnalyzeFoodFromHF).toHaveBeenCalledTimes(3);
    });

    // ── NFR-04: file validation ───────────────────────────────────────────────
    test('NFR-04 – rejects file larger than 5 MB', async () => {
        const bigBuffer = Buffer.alloc(5 * 1024 * 1024 + 1, 0xFF);

        const res = await request
            .post('/api/analyze-food')
            .attach('image', bigBuffer, { filename: 'big.jpg', contentType: 'image/jpeg' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('NFR-04 – rejects non-JPEG/PNG MIME type', async () => {
        const res = await request
            .post('/api/analyze-food')
            .attach('image', Buffer.from('%PDF-1.4'), { filename: 'doc.pdf', contentType: 'application/pdf' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toMatch(/JPEG.*PNG|PNG.*JPEG/i);
    });

    test('NFR-04 – accepts PNG images', async () => {
        mockAnalyzeFoodFromHF.mockResolvedValue(FOOD_RESULT);

        const res = await request
            .post('/api/analyze-food')
            .attach('image', fakePng(), { filename: 'food.png', contentType: 'image/png' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('returns 400 when no file is attached', async () => {
        const res = await request.post('/api/analyze-food');
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/no image/i);
    });

    // ── Rate limiter ──────────────────────────────────────────────────────────
    test('returns 429 after exceeding rate limit (10 req / min)', async () => {
        mockAnalyzeFoodFromHF.mockResolvedValue(FOOD_RESULT);

        // Exhaust 10 allowed requests
        for (let i = 0; i < 10; i++) {
            await request
                .post('/api/analyze-food')
                .attach('image', fakeJpeg(), { filename: 'f.jpg', contentType: 'image/jpeg' });
        }

        const res = await request
            .post('/api/analyze-food')
            .attach('image', fakeJpeg(), { filename: 'f.jpg', contentType: 'image/jpeg' });

        expect(res.status).toBe(429);
        expect(res.body.success).toBe(false);
    });
});

// ─── POST /api/analyze-batch ──────────────────────────────────────────────────

describe('POST /api/analyze-batch', () => {

    test('returns results for multiple valid images', async () => {
        mockAnalyzeBatchFromHF.mockResolvedValue([FOOD_RESULT, FOOD_RESULT]);

        const res = await request
            .post('/api/analyze-batch')
            .attach('images', fakeJpeg(), { filename: 'a.jpg', contentType: 'image/jpeg' })
            .attach('images', fakeJpeg(), { filename: 'b.jpg', contentType: 'image/jpeg' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.total).toBe(2);
        expect(res.body.results).toHaveLength(2);
        expect(res.body.results[0].filename).toBe('a.jpg');
    });

    test('returns 400 when no files are provided', async () => {
        const res = await request.post('/api/analyze-batch');
        expect(res.status).toBe(400);
    });

    test('returns 400 if any file exceeds 5 MB (NFR-04)', async () => {
        const bigBuffer = Buffer.alloc(5 * 1024 * 1024 + 1, 0xFF);

        const res = await request
            .post('/api/analyze-batch')
            .attach('images', bigBuffer, { filename: 'huge.jpg', contentType: 'image/jpeg' });

        expect(res.status).toBe(400);
    });

    test('returns 503 with manual_logging fallback when circuit is open', async () => {
        controller.circuitBreaker.state         = 'OPEN';
        controller.circuitBreaker.nextAttemptAt = Date.now() + 60_000;

        const res = await request
            .post('/api/analyze-batch')
            .attach('images', fakeJpeg(), { filename: 'f.jpg', contentType: 'image/jpeg' });

        expect(res.status).toBe(503);
        expect(res.body.fallback).toBe('manual_logging');
        expect(mockAnalyzeBatchFromHF).not.toHaveBeenCalled();
    });
});
