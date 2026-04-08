import { Request, Response } from 'express';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import { foodRecognitionModel } from '../models/foodrecognition.model';

// Constants for constraints
const AI_TIMEOUT_MS = 120000;
const DETECTION_API_URL = 'https://nutrigame.onrender.com/predict';

// ─── Yardımcı Sınıflar (Güvenlik ve Performans) ──────────────────────────────

class ImagePreprocessor {
    /** JPEG'lerdeki konum ve kamera metadata'sını (EXIF) siler */
    stripExif(buffer: Buffer, mimetype: string): Buffer {
        if (mimetype !== 'image/jpeg') return buffer;
        if (buffer[0] !== 0xFF || buffer[1] !== 0xD8) return buffer;

        const chunks = [buffer.slice(0, 2)];
        let pos = 2;

        while (pos < buffer.length - 1) {
            if (buffer[pos] !== 0xFF) break;
            const marker = buffer[pos + 1];

            if (marker === 0xDA) {
                chunks.push(buffer.slice(pos));
                break;
            }
            if (marker === 0xD9 || (marker >= 0xD0 && marker <= 0xD7)) {
                chunks.push(buffer.slice(pos, pos + 2));
                pos += 2;
                continue;
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

class CircuitBreaker {
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
    failureCount = 0;
    failureThreshold: number;
    cooldownMs: number;
    nextAttemptAt: number | null = null;

    constructor(failureThreshold = 3, cooldownMs = 30_000) {
        this.failureThreshold = failureThreshold;
        this.cooldownMs = cooldownMs;
    }

    isOpen() {
        if (this.state === 'OPEN') {
            if (Date.now() >= (this.nextAttemptAt || 0)) {
                this.state = 'HALF_OPEN';
                return false;
            }
            return true;
        }
        return false;
    }

    onSuccess() {
        this.failureCount = 0;
        this.state = 'CLOSED';
    }

    onFailure() {
        this.failureCount++;
        if (this.failureCount >= this.failureThreshold) {
            this.state = 'OPEN';
            this.nextAttemptAt = Date.now() + this.cooldownMs;
        }
    }
}

class RateLimiter {
    windowMs: number;
    maxRequests: number;
    clients = new Map<string, number[]>();

    constructor(windowMs = 60_000, maxRequests = 10) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
    }

    isAllowed(clientIp: string) {
        const now = Date.now();
        const windowStart = now - this.windowMs;
        const timestamps = (this.clients.get(clientIp) ?? []).filter(t => t > windowStart);
        this.clients.set(clientIp, timestamps);

        if (timestamps.length >= this.maxRequests) return false;
        timestamps.push(now);
        return true;
    }
}

// ─── Controller Sınıfı ───────────────────────────────────────────────────────

export class FoodRecognitionController {
    private imagePreprocessor: ImagePreprocessor;
    private circuitBreaker: CircuitBreaker;
    private rateLimiter: RateLimiter;

    constructor() {
        // Bu güvenlik sınıflarını ayağa kaldırıyoruz
        this.imagePreprocessor = new ImagePreprocessor();
        this.circuitBreaker = new CircuitBreaker(3, 30_000); // 3 hatadan sonra 30sn bekle
        this.rateLimiter = new RateLimiter(60_000, 10); // 1 dakikada max 10 istek
    }

    // Arrow function kullandık ki Express route'larında "this" bağlamını kaybetmeyelim
    analyze_food = async (req: Request, res: Response) => {
        const clientIp = req.ip ?? req.socket?.remoteAddress ?? 'unknown';

        // 1. Rate Limiting Kontrolü
        if (!this.rateLimiter.isAllowed(clientIp)) {
            return res.status(429).json({ success: false, message: 'Too many requests. Please wait before retrying.' });
        }

        // 2. Circuit Breaker Kontrolü (Sistem çöktüyse direkt engelle)
        if (this.circuitBreaker.isOpen()) {
            return res.status(503).json({ success: false, message: 'AI service is temporarily unavailable. Please try again later.' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image provided.' });
        }

        const userId = req.user?.id;
        const { mealCategory } = req.body;

        if (!userId || !mealCategory) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ success: false, message: 'User authentication and mealCategory are required.' });
        }

        // 3. EXIF Silme İşlemi (Gizlilik için)
        try {
            const raw = fs.readFileSync(req.file.path);
            const cleaned = this.imagePreprocessor.stripExif(raw, req.file.mimetype);
            fs.writeFileSync(req.file.path, cleaned);
        } catch (err) {
            console.log("EXIF temizleme atlandı:", err);
        }

        try {
            // Dinamik import
            const { analyzeFoodFromHF } = await import('../../ai_service/ai_service/src/object_detection/huggingface/hf-gradio-api.js');

            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    const err = new Error('AI service did not respond in time.');
                    (err as any).code = 'ETIMEDOUT';
                    reject(err);
                }, AI_TIMEOUT_MS);
            });

            // Race the AI call against the timeout
            const result: any = await Promise.race([
                analyzeFoodFromHF(req.file.path),
                timeoutPromise
            ]);

            // Başarılı olursa circuit breaker'ı sıfırla
            this.circuitBreaker.onSuccess();

            const imageUrl = `/uploads/${req.file.filename}`;

            const savedPhoto = await foodRecognitionModel.addMealPhoto({
                userId: userId,
                mealCategory: mealCategory,
                imageUrl: imageUrl
            });



            // Clean up the temp file
            fs.unlink(req.file.path, () => { });

            return res.status(200).json({
                success: true,
                detections: result.detections,
                photoRecord: savedPhoto,
                totalCalories: result.totalCalories,
                annotated_image: result.annotated_image?.url || null,
                raw_text: result.raw_text
            });

        } catch (error: any) {
            // Hata olursa circuit breaker'ı tetikle
            this.circuitBreaker.onFailure();

            if (req.file) {
                fs.unlink(req.file.path, () => { });
            }

            console.error("[FoodRecognition Error]: ", error.message);

            if (error.notFood) {
                return res.status(422).json({ success: false, message: error.message });
            }

            if (error.code === 'ETIMEDOUT' || /timeout/i.test(error.message)) {
                return res.status(503).json({ success: false, message: 'AI service is temporarily unavailable. Please try again.' });
            }

            return res.status(500).json({ success: false, message: 'Failed to process image.' });
        }
    }

    getHealth = async (req: Request, res: Response) => {
        return res.json({
            status: 'OK',
            service: 'NutriGame Food Detection Backend',
            circuitBreaker: this.circuitBreaker.state, // Circuit Breaker durumunu da göster
            timestamp: new Date().toISOString()
        });
    }

    analyze_batch = async (req: Request, res: Response) => {
        const clientIp = req.ip ?? req.socket?.remoteAddress ?? 'unknown';

        if (!this.rateLimiter.isAllowed(clientIp)) {
            return res.status(429).json({ success: false, message: 'Too many requests.' });
        }

        if (this.circuitBreaker.isOpen()) {
            return res.status(503).json({ success: false, message: 'Circuit open.' });
        }

        try {
            if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No image files provided'
                });
            }

            const userId = req.user?.id;
            const { mealCategory } = req.body;
            if (!userId || !mealCategory) {
                (req.files as Express.Multer.File[]).forEach(file => {
                    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                });
                return res.status(400).json({ success: false, message: 'User authentication and mealCategory are required.' });
            }

            const files = req.files as Express.Multer.File[];
            console.log(`Processing ${files.length} images for user ${userId} (${mealCategory})`);

            // EXIF Temizliği
            for (const file of files) {
                try {
                    const raw = fs.readFileSync(file.path);
                    const cleaned = this.imagePreprocessor.stripExif(raw, file.mimetype);
                    fs.writeFileSync(file.path, cleaned);
                } catch { }
            }

            const detectionPromises = files.map(async (file) => {
                try {
                    const formData = new FormData();
                    formData.append('image', fs.createReadStream(file.path));

                    const response = await axios.post(DETECTION_API_URL, formData, {
                        headers: formData.getHeaders(),
                        timeout: 300000 // 5 dakika (Render'ın uyanması için)
                    });

                    // Başarılı analiz sonrası DB'ye kaydet
                    const imageUrl = `/uploads/${file.filename}`;
                    await foodRecognitionModel.mealPhoto.create({
                        data: {
                            userId: userId,
                            mealCategory: mealCategory,
                            imageUrl: imageUrl,
                        }
                    });

                    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

                    return {
                        filename: file.originalname,
                        success: true,
                        detections: response.data
                    };
                } catch (error: any) {
                    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

                    return {
                        filename: file.originalname,
                        success: false,
                        error: error.message
                    };
                }
            });

            const results = await Promise.all(detectionPromises);

            this.circuitBreaker.onSuccess();

            return res.json({
                success: true,
                results: results
            });

        } catch (error: any) {
            this.circuitBreaker.onFailure();

            if (req.files) {
                (req.files as Express.Multer.File[]).forEach(file => {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                });
            }

            return res.status(500).json({
                success: false,
                error: 'Batch processing failed',
                details: error.message
            });
        }
    }
    getHistory = async (req: Request, res: Response) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'User not authenticated' });
            }
            const photos = await foodRecognitionModel.getMealPhotosByUserId(userId as number);
            return res.json({
                success: true,
                photos: photos
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                error: 'Failed to get history',
                details: error.message
            });
        }

    }
}

export const foodRecognitionController = new FoodRecognitionController();