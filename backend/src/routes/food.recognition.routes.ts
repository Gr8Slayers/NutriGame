import { Router } from 'express';
import multer from 'multer';
import { foodRecognitionController } from '../controllers/foodrecognition.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

const storage = multer.memoryStorage();

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
