import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const INFERENCE_URL = process.env.INFERENCE_SERVICE_URL;

// Multer configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', async (req, res) => {
  try {
    if (!INFERENCE_URL) {
      return res.status(503).json({
        status: 'error',
        message: 'INFERENCE_SERVICE_URL not configured'
      });
    }

    const response = await axios.get(`${INFERENCE_URL}/health`, { timeout: 5000 });
    
    res.json({
      status: 'healthy',
      node_service: 'ok',
      inference_service: response.data
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Detect food from uploaded image
app.post('/detect', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    if (!INFERENCE_URL) {
      return res.status(503).json({ error: 'Inference service not configured' });
    }

    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    formData.append('confidence_threshold', req.body.confidence_threshold || 0.5);

    console.log(`Processing: ${req.file.originalname} (${req.file.size} bytes)`);

    const response = await axios.post(`${INFERENCE_URL}/predict`, formData, {
      headers: formData.getHeaders(),
      timeout: 30000
    });

    res.json({
      success: true,
      ...response.data
    });

  } catch (error) {
    console.error('Detection error:', error.message);
    res.status(500).json({
      error: 'Detection failed',
      message: error.message
    });
  }
});

// Detect food from URL
app.post('/detect-url', async (req, res) => {
  try {
    const { image_url, confidence_threshold } = req.body;

    if (!image_url) {
      return res.status(400).json({ error: 'No image URL provided' });
    }

    if (!INFERENCE_URL) {
      return res.status(503).json({ error: 'Inference service not configured' });
    }

    // Download image
    const imageResponse = await axios.get(image_url, {
      responseType: 'arraybuffer',
      timeout: 10000
    });

    const formData = new FormData();
    formData.append('image', Buffer.from(imageResponse.data), {
      filename: 'image.jpg',
      contentType: imageResponse.headers['content-type']
    });
    formData.append('confidence_threshold', confidence_threshold || 0.5);

    console.log(`Processing image from URL: ${image_url}`);

    const response = await axios.post(`${INFERENCE_URL}/predict`, formData, {
      headers: formData.getHeaders(),
      timeout: 30000
    });

    res.json({
      success: true,
      ...response.data
    });

  } catch (error) {
    console.error('Detection error:', error.message);
    res.status(500).json({
      error: 'Detection failed',
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Food Detection Service running on port ${PORT}`);
  console.log(`📡 Inference URL: ${INFERENCE_URL || 'NOT CONFIGURED'}`);
});

export default app;
