import express from 'express';
import multer from 'multer';
import { analyzeFoodFromHF, analyzeBatchFromHF } from './hf-gradio-api.js';
import fs from 'fs';

const app = express();
const upload = multer({ dest: 'uploads/' });

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'Hugging Face YOLOv8n Food Detection',
        space: 'nceyda/yolo-food-det'
    });
});

// Single image analysis endpoint
app.post('/api/analyze-food', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: 'No image file provided' 
            });
        }

        console.log(`Analyzing image: ${req.file.originalname}`);

        // Analyze with Hugging Face Space
        const result = await analyzeFoodFromHF(req.file.path);

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        if (!result.success) {
            return res.status(500).json(result);
        }

        // Format response
        res.json({
            success: true,
            detections: result.detections,
            summary: {
                total_items: result.detections.length,
                items: result.detections.map(d => d.class).join(', ') || 'No items detected'
            },
            annotated_image_url: result.annotated_image?.url,
            raw_text: result.raw_text,
            source: 'huggingface'
        });

    } catch (error) {
        console.error('Error analyzing image:', error);
        
        // Clean up file if exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Batch analysis endpoint (up to 10 images)
app.post('/api/analyze-batch', upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'No image files provided' 
            });
        }

        console.log(`Analyzing ${req.files.length} images...`);

        // Analyze all images
        const imagePaths = req.files.map(f => f.path);
        const results = await analyzeBatchFromHF(imagePaths);

        // Clean up uploaded files
        req.files.forEach(file => {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        });

        // Format response
        const formattedResults = results.map((result, index) => ({
            filename: req.files[index].originalname,
            success: result.success,
            detections: result.detections,
            summary: {
                total_items: result.detections.length,
                items: result.detections.map(d => d.class).join(', ') || 'No items detected'
            },
            annotated_image_url: result.annotated_image?.url,
            error: result.error
        }));

        res.json({
            success: true,
            total_images: req.files.length,
            results: formattedResults
        });

    } catch (error) {
        console.error('Error analyzing batch:', error);
        
        // Clean up files
        if (req.files) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
        }

        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║  Hugging Face YOLOv8n Food Detection Backend            ║
╚══════════════════════════════════════════════════════════╝

Server running on: http://localhost:${PORT}

Available endpoints:
  GET  /api/health          - Health check
  POST /api/analyze-food    - Analyze single image
  POST /api/analyze-batch   - Analyze multiple images (max 10)

Space: https://huggingface.co/spaces/nceyda/yolo-food-det
    `);
});
