/**
 * Roboflow AI endpoints
 * Mobil uygulamadan gelen resimleri Roboflow API'sine gönderir
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { detectObjectsFromBuffer, detectObjectsFromUrl } = require('../services/roboflowService');

// Multer yapılandırması - resimleri memory'de tut
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Sadece resim dosyalarına izin ver
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Sadece resim dosyaları yüklenebilir'));
        }
    }
});

/**
 * POST /api/ai/detect-from-image
 * Mobil uygulamadan gelen resmi analiz eder
 */
router.post('/detect-from-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                error: 'Resim dosyası gönderilmedi' 
            });
        }

        console.log(`Resim alındı: ${req.file.originalname} (${req.file.size} bytes)`);

        // Roboflow'a gönder
        const result = await detectObjectsFromBuffer(req.file.buffer, req.file.originalname);

        // Sonucu mobil uygulamaya gönder
        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('AI detection hatası:', error);
        res.status(500).json({ 
            error: 'Görüntü analizi başarısız oldu',
            message: error.message 
        });
    }
});

/**
 * POST /api/ai/detect-from-url
 * URL'den resim analizi yapar
 */
router.post('/detect-from-url', async (req, res) => {
    try {
        const { imageUrl } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ 
                error: 'imageUrl parametresi gerekli' 
            });
        }

        console.log(`URL'den resim analizi: ${imageUrl}`);

        // Roboflow'a gönder
        const result = await detectObjectsFromUrl(imageUrl);

        // Sonucu mobil uygulamaya gönder
        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('AI detection hatası:', error);
        res.status(500).json({ 
            error: 'Görüntü analizi başarısız oldu',
            message: error.message 
        });
    }
});

module.exports = router;
