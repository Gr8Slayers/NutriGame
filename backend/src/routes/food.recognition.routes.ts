import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { foodRecognitionController } from '../controllers/foodrecognition.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

const storage = multer.diskStorage({
    // Store temporarily in backend/uploads alongside profile pictures
    destination: path.join(__dirname, '..', '..', '..', 'uploads'),
    filename: (_req: any, file: any, cb: any) => {
        const ext = path.extname(file.originalname) || '.jpg';
        cb(null, `scan_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (_req: any, file: any, cb: any) => {
        if (['image/jpeg', 'image/png', 'image/jpg'].includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG and PNG are allowed.'));
        }
    },
});

router.post('/analyze', authMiddleware, upload.single('image'), foodRecognitionController.analyze_food);
router.post('/analyze-batch', authMiddleware, upload.array('images', 10), foodRecognitionController.analyze_batch);
router.get('/health', foodRecognitionController.getHealth);
router.get('/history/:userId', authMiddleware, foodRecognitionController.getHistory);

export default router;
