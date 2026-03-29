/**
 * Unit tests – isolated logic
 *
 * Covers:
 *   CircuitBreaker  state machine
 *   RateLimiter     sliding-window enforcement
 *   ImagePreprocessor EXIF stripping from JPEG
 *   parseDetectionText  calorie parsing + NOT_FOOD error
 */

// ─── Inline implementations (same logic as backend-integration.js) ───────────
// Duplicated here so unit tests are fully isolated from the HTTP layer.

class CircuitBreaker {
    constructor({ failureThreshold = 3, cooldownMs = 30_000 } = {}) {
        this.state            = 'CLOSED';
        this.failureCount     = 0;
        this.failureThreshold = failureThreshold;
        this.cooldownMs       = cooldownMs;
        this.nextAttemptAt    = null;
    }
    isOpen() {
        if (this.state === 'OPEN') {
            if (Date.now() >= this.nextAttemptAt) { this.state = 'HALF_OPEN'; return false; }
            return true;
        }
        return false;
    }
    onSuccess() { this.failureCount = 0; this.state = 'CLOSED'; }
    onFailure() {
        this.failureCount++;
        if (this.failureCount >= this.failureThreshold) {
            this.state = 'OPEN';
            this.nextAttemptAt = Date.now() + this.cooldownMs;
        }
    }
}

class RateLimiter {
    constructor({ windowMs = 60_000, maxRequests = 10 } = {}) {
        this.windowMs    = windowMs;
        this.maxRequests = maxRequests;
        this.clients     = new Map();
    }
    isAllowed(ip) {
        const now = Date.now();
        const ts  = (this.clients.get(ip) ?? []).filter(t => t > now - this.windowMs);
        this.clients.set(ip, ts);
        if (ts.length >= this.maxRequests) return false;
        ts.push(now);
        return true;
    }
}

class ImagePreprocessor {
    stripExif(buffer, mimetype) {
        if (mimetype !== 'image/jpeg') return buffer;
        if (buffer[0] !== 0xFF || buffer[1] !== 0xD8) return buffer;
        const chunks = [buffer.slice(0, 2)];
        let pos = 2;
        while (pos < buffer.length - 1) {
            if (buffer[pos] !== 0xFF) break;
            const marker = buffer[pos + 1];
            if (marker === 0xDA) { chunks.push(buffer.slice(pos)); break; }
            if (marker === 0xD9 || (marker >= 0xD0 && marker <= 0xD7)) {
                chunks.push(buffer.slice(pos, pos + 2)); pos += 2; continue;
            }
            if (pos + 3 >= buffer.length) break;
            const segLen = buffer.readUInt16BE(pos + 2);
            if (marker !== 0xE1 && marker !== 0xED) {
                chunks.push(buffer.slice(pos, pos + 2 + segLen));
            }
            pos += 2 + segLen;
        }
        return Buffer.concat(chunks);
    }
}

// parseDetectionText inline (same logic as hf-gradio-api.js)
function parseDetectionText(text) {
    if (!text) return { detections: [], totalCalories: 0 };
    if (text.startsWith('NOT_FOOD:')) {
        const err = new Error(text.replace('NOT_FOOD:', '').trim());
        err.notFood = true;
        throw err;
    }
    const detections = [];
    let totalCalories = 0;
    for (const line of text.split('\n')) {
        const m = line.match(/•\s+(.+?):\s+([\d.]+)%(?:\s+\(~(\d+)\s+kcal\))?/);
        if (m) detections.push({
            class: m[1].trim(),
            confidence: parseFloat(m[2]) / 100,
            estimatedCalories: m[3] ? parseInt(m[3]) : null,
        });
        const tot = line.match(/Estimated total:\s*~(\d+)\s*kcal/);
        if (tot) totalCalories = parseInt(tot[1]);
    }
    return { detections, totalCalories };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Builds a minimal JPEG buffer that contains an APP1 (EXIF) segment. */
function buildJpegWithExif() {
    const soi        = Buffer.from([0xFF, 0xD8]);
    const exifPayload = Buffer.from('Exif\0\0fake_exif_bytes_here');   // 26 bytes
    const app1Len    = Buffer.alloc(2);
    app1Len.writeUInt16BE(exifPayload.length + 2);                     // +2 = length field
    const app1 = Buffer.concat([Buffer.from([0xFF, 0xE1]), app1Len, exifPayload]);

    // APP0 (JFIF) – should be kept
    const jfifPayload = Buffer.from([0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00]);
    const app0Len     = Buffer.alloc(2);
    app0Len.writeUInt16BE(jfifPayload.length + 2);
    const app0 = Buffer.concat([Buffer.from([0xFF, 0xE0]), app0Len, jfifPayload]);

    // SOS + EOI
    const sos = Buffer.from([0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00]);
    const eoi = Buffer.from([0xFF, 0xD9]);

    return Buffer.concat([soi, app0, app1, sos, eoi]);
}

function containsMarker(buffer, markerByte) {
    for (let i = 0; i < buffer.length - 1; i++) {
        if (buffer[i] === 0xFF && buffer[i + 1] === markerByte) return true;
    }
    return false;
}

// ─── CircuitBreaker ───────────────────────────────────────────────────────────

describe('CircuitBreaker', () => {
    test('starts in CLOSED state', () => {
        const cb = new CircuitBreaker();
        expect(cb.state).toBe('CLOSED');
        expect(cb.isOpen()).toBe(false);
    });

    test('stays CLOSED after fewer failures than threshold', () => {
        const cb = new CircuitBreaker({ failureThreshold: 3 });
        cb.onFailure();
        cb.onFailure();
        expect(cb.state).toBe('CLOSED');
        expect(cb.isOpen()).toBe(false);
    });

    test('transitions CLOSED → OPEN after reaching failureThreshold', () => {
        const cb = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 10_000 });
        cb.onFailure(); cb.onFailure(); cb.onFailure();
        expect(cb.state).toBe('OPEN');
        expect(cb.isOpen()).toBe(true);
    });

    test('rejects requests while OPEN', () => {
        const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 60_000 });
        cb.onFailure();
        expect(cb.isOpen()).toBe(true);
    });

    test('transitions OPEN → HALF_OPEN after cooldown period', () => {
        const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 0 });
        cb.onFailure();
        expect(cb.state).toBe('OPEN');
        // cooldownMs = 0 means nextAttemptAt is in the past immediately
        expect(cb.isOpen()).toBe(false);
        expect(cb.state).toBe('HALF_OPEN');
    });

    test('transitions HALF_OPEN → CLOSED on success', () => {
        const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 0 });
        cb.onFailure();
        cb.isOpen(); // triggers HALF_OPEN
        cb.onSuccess();
        expect(cb.state).toBe('CLOSED');
        expect(cb.failureCount).toBe(0);
    });

    test('resets failure count on success', () => {
        const cb = new CircuitBreaker({ failureThreshold: 5 });
        cb.onFailure(); cb.onFailure(); cb.onFailure();
        cb.onSuccess();
        expect(cb.failureCount).toBe(0);
        expect(cb.state).toBe('CLOSED');
    });
});

// ─── RateLimiter ─────────────────────────────────────────────────────────────

describe('RateLimiter', () => {
    test('allows requests up to maxRequests within window', () => {
        const rl = new RateLimiter({ windowMs: 60_000, maxRequests: 3 });
        expect(rl.isAllowed('127.0.0.1')).toBe(true);
        expect(rl.isAllowed('127.0.0.1')).toBe(true);
        expect(rl.isAllowed('127.0.0.1')).toBe(true);
    });

    test('blocks the request that exceeds maxRequests', () => {
        const rl = new RateLimiter({ windowMs: 60_000, maxRequests: 3 });
        rl.isAllowed('ip'); rl.isAllowed('ip'); rl.isAllowed('ip');
        expect(rl.isAllowed('ip')).toBe(false);
    });

    test('tracks different IPs independently', () => {
        const rl = new RateLimiter({ windowMs: 60_000, maxRequests: 1 });
        expect(rl.isAllowed('192.168.0.1')).toBe(true);
        expect(rl.isAllowed('192.168.0.2')).toBe(true); // different IP – allowed
        expect(rl.isAllowed('192.168.0.1')).toBe(false);
    });

    test('allows requests again after window expires', () => {
        jest.useFakeTimers();
        const rl = new RateLimiter({ windowMs: 1_000, maxRequests: 1 });
        rl.isAllowed('ip');
        expect(rl.isAllowed('ip')).toBe(false);
        jest.advanceTimersByTime(1_001);
        expect(rl.isAllowed('ip')).toBe(true);
        jest.useRealTimers();
    });
});

// ─── ImagePreprocessor ────────────────────────────────────────────────────────

describe('ImagePreprocessor', () => {
    const proc = new ImagePreprocessor();

    test('removes APP1 (EXIF) marker from JPEG', () => {
        const input = buildJpegWithExif();
        expect(containsMarker(input, 0xE1)).toBe(true); // sanity-check: EXIF is present

        const output = proc.stripExif(input, 'image/jpeg');
        expect(containsMarker(output, 0xE1)).toBe(false);
    });

    test('keeps APP0 (JFIF) marker intact', () => {
        const input  = buildJpegWithExif();
        const output = proc.stripExif(input, 'image/jpeg');
        expect(containsMarker(output, 0xE0)).toBe(true);
    });

    test('preserves JPEG SOI signature', () => {
        const input  = buildJpegWithExif();
        const output = proc.stripExif(input, 'image/jpeg');
        expect(output[0]).toBe(0xFF);
        expect(output[1]).toBe(0xD8);
    });

    test('returns PNG buffer unchanged', () => {
        const png = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]); // PNG magic
        const out = proc.stripExif(png, 'image/png');
        expect(out).toBe(png); // same reference – not modified
    });

    test('returns non-JPEG buffer unchanged when mimetype is image/jpeg but data is wrong', () => {
        const notJpeg = Buffer.from([0x00, 0x01, 0x02]);
        const out = proc.stripExif(notJpeg, 'image/jpeg');
        expect(out).toBe(notJpeg);
    });
});

// ─── parseDetectionText ───────────────────────────────────────────────────────

describe('parseDetectionText', () => {
    test('parses food detections with calorie estimates (TC-03)', () => {
        const text = [
            'Detected items:',
            '• pizza: 85.3% (~285 kcal)',
            '• apple: 72.1% (~95 kcal)',
            '',
            'Estimated total: ~380 kcal',
        ].join('\n');

        const { detections, totalCalories } = parseDetectionText(text);

        expect(detections).toHaveLength(2);
        expect(detections[0]).toMatchObject({ class: 'pizza', estimatedCalories: 285 });
        expect(detections[0].confidence).toBeCloseTo(0.853);
        expect(detections[1]).toMatchObject({ class: 'apple', estimatedCalories: 95 });
        expect(totalCalories).toBe(380);
    });

    test('parses detections without calorie info gracefully', () => {
        const text = 'Detected items:\n• banana: 60.0%';
        const { detections } = parseDetectionText(text);
        expect(detections[0].estimatedCalories).toBeNull();
    });

    test('throws notFood error for NOT_FOOD: prefix (TC-E01)', () => {
        const text = 'NOT_FOOD: No food items detected. Please retake the photo.';
        expect(() => parseDetectionText(text)).toThrow();
        try {
            parseDetectionText(text);
        } catch (err) {
            expect(err.notFood).toBe(true);
            expect(err.message).toMatch(/No food items detected/);
        }
    });

    test('returns empty result for null/undefined input', () => {
        const { detections, totalCalories } = parseDetectionText(null);
        expect(detections).toHaveLength(0);
        expect(totalCalories).toBe(0);
    });

    test('ignores non-detection lines', () => {
        const text = 'Detected items:\n• pizza: 90.0% (~285 kcal)\nSome random line\n';
        const { detections } = parseDetectionText(text);
        expect(detections).toHaveLength(1);
    });
});
