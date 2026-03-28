/**
 * Food Recognition Service
 *
 * Implements the FoodRecognitionController defined in the LLD (§2.1.2):
 *   – ImagePreprocessor  : strips EXIF metadata from JPEG images (LLD §1.1.3)
 *   – CircuitBreaker     : halts requests when AI is repeatedly unavailable (LLD §2.1.2, TC-E02)
 *   – RateLimiter        : prevents abuse (LLD §2.1.2)
 *   – validateImage      : enforces 5 MB limit and JPEG/PNG-only (NFR-04)
 *   – 10-second timeout  : races AI call, triggers circuit breaker on breach (NFR-03)
 *   – Non-food fallback  : descriptive error + retake hint (TC-E01)
 *   – Timeout fallback   : suggests manual logging (TC-E02)
 */

import express from 'express';
import multer  from 'multer';
import path    from 'path';
import fs      from 'fs';
import { fileURLToPath } from 'url';
import { analyzeFoodFromHF, analyzeBatchFromHF } from './hf-gradio-api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ─── ImagePreprocessor ───────────────────────────────────────────────────────
// Removes APP1 (EXIF) and APP13 (IPTC) markers from JPEG buffers so that
// location data and camera metadata are never forwarded to external AI (LLD §1.1.3).
class ImagePreprocessor {
    stripExif(buffer, mimetype) {
        if (mimetype !== 'image/jpeg') return buffer;
        if (buffer[0] !== 0xFF || buffer[1] !== 0xD8) return buffer;

        const chunks = [buffer.slice(0, 2)]; // keep SOI
        let pos = 2;

        while (pos < buffer.length - 1) {
            if (buffer[pos] !== 0xFF) break;
            const marker = buffer[pos + 1];

            // SOS — image scan data follows, copy remainder verbatim
            if (marker === 0xDA) {
                chunks.push(buffer.slice(pos));
                break;
            }
            // EOI or standalone markers with no length field
            if (marker === 0xD9 || (marker >= 0xD0 && marker <= 0xD7)) {
                chunks.push(buffer.slice(pos, pos + 2));
                pos += 2;
                continue;
            }
            if (pos + 3 >= buffer.length) break;
            const segLen = buffer.readUInt16BE(pos + 2); // includes 2-byte length field

            // Skip APP1 (0xE1 – EXIF/XMP) and APP13 (0xED – IPTC/Photoshop)
            if (marker !== 0xE1 && marker !== 0xED) {
                chunks.push(buffer.slice(pos, pos + 2 + segLen));
            }
            pos += 2 + segLen;
        }
        return Buffer.concat(chunks);
    }
}

// ─── CircuitBreaker ──────────────────────────────────────────────────────────
class CircuitBreaker {
    constructor({ failureThreshold = 3, cooldownMs = 30_000 } = {}) {
        this.state            = 'CLOSED'; // CLOSED | OPEN | HALF_OPEN
        this.failureCount     = 0;
        this.failureThreshold = failureThreshold;
        this.cooldownMs       = cooldownMs;
        this.nextAttemptAt    = null;
    }

    isOpen() {
        if (this.state === 'OPEN') {
            if (Date.now() >= this.nextAttemptAt) {
                this.state = 'HALF_OPEN';
                return false;
            }
            return true;
        }
        return false;
    }

    onSuccess() {
        this.failureCount = 0;
        this.state        = 'CLOSED';
    }

    onFailure() {
        this.failureCount++;
        if (this.failureCount >= this.failureThreshold) {
            this.state         = 'OPEN';
            this.nextAttemptAt = Date.now() + this.cooldownMs;
        }
    }
}

// ─── RateLimiter ─────────────────────────────────────────────────────────────
class RateLimiter {
    constructor({ windowMs = 60_000, maxRequests = 10 } = {}) {
        this.windowMs    = windowMs;
        this.maxRequests = maxRequests;
        this.clients     = new Map();
    }

    isAllowed(clientIp) {
        const now         = Date.now();
        const windowStart = now - this.windowMs;
        const timestamps  = (this.clients.get(clientIp) ?? []).filter(t => t > windowStart);
        this.clients.set(clientIp, timestamps);

        if (timestamps.length >= this.maxRequests) return false;
        timestamps.push(now);
        return true;
    }
}

// ─── FoodRecognitionController ───────────────────────────────────────────────
class FoodRecognitionController {
    constructor() {
        this.imagePreprocessor = new ImagePreprocessor();
        this.circuitBreaker    = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 30_000 });
        this.rateLimiter       = new RateLimiter({ windowMs: 60_000, maxRequests: 10 });
        this.AI_TIMEOUT_MS     = 10_000; // NFR-03: circuit breaker triggers at 10 s
    }

    /** Enforces 5 MB and JPEG/PNG-only rules (NFR-04). */
    validateImage(file) {
        const ALLOWED = ['image/jpeg', 'image/png'];
        const MAX     = 5 * 1024 * 1024;

        if (!ALLOWED.includes(file.mimetype)) {
            return { valid: false, error: 'Only JPEG and PNG images are accepted.' };
        }
        if (file.size > MAX) {
            return { valid: false, error: 'Image size must not exceed 5 MB.' };
        }
        return { valid: true };
    }

    /** Centralised error → HTTP response mapping. */
    handleAnalysisError(error, res) {
        const isTimeout    = error.code === 'ETIMEDOUT' || /timeout/i.test(error.message);
        const isCircuitOpen = !!error.circuitOpen;

        if (isTimeout || isCircuitOpen) {
            // TC-E02: AI unavailable → suggest manual logging
            return res.status(503).json({
                success:  false,
                error:    'AI service is currently unavailable. Please try again later.',
                fallback: 'manual_logging',
                source:   'huggingface',
            });
        }

        if (error.notFood) {
            // TC-E01: non-food image detected
            return res.status(422).json({
                success:  false,
                error:    error.message,
                fallback: 'retake_photo',
                source:   'huggingface',
            });
        }

        return res.status(500).json({
            success:  false,
            error:    'Food analysis failed. Please try again or use manual food logging.',
            fallback: 'manual_logging',
            source:   'huggingface',
        });
    }

    async analyzeFood(req, res) {
        const clientIp = req.ip ?? req.socket?.remoteAddress ?? 'unknown';

        if (!this.rateLimiter.isAllowed(clientIp)) {
            return res.status(429).json({ success: false, error: 'Too many requests. Please wait before retrying.' });
        }

        if (this.circuitBreaker.isOpen()) {
            const err = new Error('Circuit open – AI service temporarily suspended.');
            err.circuitOpen = true;
            return this.handleAnalysisError(err, res);
        }

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No image file provided.' });
        }

        const validation = this.validateImage(req.file);
        if (!validation.valid) {
            fs.unlink(req.file.path, () => {});
            return res.status(400).json({ success: false, error: validation.error });
        }

        // Strip EXIF before sending to external AI (LLD §1.1.3)
        try {
            const raw     = fs.readFileSync(req.file.path);
            const cleaned = this.imagePreprocessor.stripExif(raw, req.file.mimetype);
            fs.writeFileSync(req.file.path, cleaned);
        } catch { /* proceed with original if stripping fails */ }

        // Race AI call against 10-second limit (NFR-03)
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                const err = new Error('AI service did not respond within 10 seconds.');
                err.code  = 'ETIMEDOUT';
                reject(err);
            }, this.AI_TIMEOUT_MS);
        });

        try {
            const result = await Promise.race([analyzeFoodFromHF(req.file.path), timeoutPromise]);
            this.circuitBreaker.onSuccess();
            fs.unlink(req.file.path, () => {});

            return res.json({
                success:         true,
                detections:      result.detections,
                totalCalories:   result.totalCalories,
                summary: {
                    total_items:       result.detections.length,
                    items:             result.detections.map(d => d.class).join(', ') || 'None',
                    estimated_kcal:    result.totalCalories,
                },
                annotated_image_url: result.annotated_image?.url ?? null,
                raw_text:        result.raw_text,
                source:          'huggingface',
            });

        } catch (error) {
            this.circuitBreaker.onFailure();
            fs.unlink(req.file.path, () => {});
            return this.handleAnalysisError(error, res);
        }
    }

    async analyzeBatch(req, res) {
        const clientIp = req.ip ?? req.socket?.remoteAddress ?? 'unknown';

        if (!this.rateLimiter.isAllowed(clientIp)) {
            return res.status(429).json({ success: false, error: 'Too many requests.' });
        }

        if (this.circuitBreaker.isOpen()) {
            const err = new Error('Circuit open.');
            err.circuitOpen = true;
            return this.handleAnalysisError(err, res);
        }

        if (!req.files?.length) {
            return res.status(400).json({ success: false, error: 'No image files provided.' });
        }

        // Validate all files before processing any
        for (const file of req.files) {
            const v = this.validateImage(file);
            if (!v.valid) {
                req.files.forEach(f => fs.unlink(f.path, () => {}));
                return res.status(400).json({ success: false, error: `${file.originalname}: ${v.error}` });
            }
        }

        // Strip EXIF from all files
        for (const file of req.files) {
            try {
                const raw     = fs.readFileSync(file.path);
                const cleaned = this.imagePreprocessor.stripExif(raw, file.mimetype);
                fs.writeFileSync(file.path, cleaned);
            } catch { /* continue */ }
        }

        try {
            const results = await analyzeBatchFromHF(req.files.map(f => f.path));
            this.circuitBreaker.onSuccess();
            req.files.forEach(f => fs.unlink(f.path, () => {}));

            return res.json({
                success: true,
                total:   results.length,
                results: results.map((r, i) => ({
                    filename:      req.files[i].originalname,
                    success:       r.success,
                    detections:    r.detections,
                    totalCalories: r.totalCalories,
                    error:         r.error ?? null,
                })),
                source: 'huggingface',
            });

        } catch (error) {
            this.circuitBreaker.onFailure();
            req.files.forEach(f => fs.unlink(f.path, () => {}));
            return this.handleAnalysisError(error, res);
        }
    }
}

// ─── Express setup ───────────────────────────────────────────────────────────
const app        = express();
const controller = new FoodRecognitionController();

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename:    (_req, file, cb) =>
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`),
});

const upload = multer({
    storage,
    limits:     { fileSize: 5 * 1024 * 1024 },   // NFR-04: 5 MB hard limit
    fileFilter: (_req, file, cb) => {
        if (['image/jpeg', 'image/png'].includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG and PNG images are accepted.'));
        }
    },
});

app.use(express.json());

app.get('/api/health', (_req, res) => {
    res.json({
        status:         'ok',
        service:        'food-recognition',
        circuitBreaker: controller.circuitBreaker.state,
        timestamp:      new Date().toISOString(),
    });
});

app.post('/api/analyze-food',
    upload.single('image'),
    (req, res) => controller.analyzeFood(req, res)
);

app.post('/api/analyze-batch',
    upload.array('images', 5),            // max 5 in batch
    (req, res) => controller.analyzeBatch(req, res)
);

// Multer / validation error handler
app.use((err, _req, res, _next) => {
    if (err instanceof multer.MulterError || err.message?.includes('JPEG')) {
        return res.status(400).json({ success: false, error: err.message });
    }
    res.status(500).json({ success: false, error: 'Internal server error.' });
});

// Export app and controller for testing (api.test.js uses supertest directly)
export { app, controller };
export default app;

const PORT = process.env.PORT || 3002;

/* istanbul ignore next */
if (process.env.NODE_ENV !== 'test') {
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║  Food Recognition Service (HuggingFace)                 ║
╚══════════════════════════════════════════════════════════╝

Port : ${PORT}
Space: https://huggingface.co/spaces/nceyda/yolo-food-det

Endpoints:
  GET  /api/health         – Circuit breaker state + liveness
  POST /api/analyze-food   – Single image  (max 5 MB, JPEG/PNG)
  POST /api/analyze-batch  – Up to 5 images
    `);
});
}
