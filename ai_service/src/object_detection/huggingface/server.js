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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
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

    // Hugging Face Space health check
    const response = await axios.get(INFERENCE_URL, { timeout: 5000 });
    
    res.json({
      status: 'healthy',
      node_service: 'ok',
      inference_url: INFERENCE_URL,
      space_status: response.status === 200 ? 'running' : 'unknown'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      note: 'Space might be starting up (cold start)'
    });
  }
});

// Detect from uploaded image
app.post('/detect', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    if (!INFERENCE_URL) {
      return res.status(503).json({ error: 'Inference service not configured' });
    }

    const formData = new FormData();
    formData.append('data', JSON.stringify({
      data: [
        {
          name: req.file.originalname,
          data: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
        },
        req.body.confidence_threshold || 0.5
      ]
    }));

    console.log(`📸 Processing: ${req.file.originalname} (${req.file.size} bytes)`);

    // Gradio API endpoint
    const response = await axios.post(`${INFERENCE_URL}/api/predict`, formData, {
      headers: formData.getHeaders(),
      timeout: 60000 // Gradio can be slow on first request
    });

    res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('❌ Detection error:', error.message);
    res.status(500).json({
      error: 'Detection failed',
      message: error.message,
      note: 'Space might be in cold start (first request takes ~30-60s)'
    });
  }
});

// Detect from URL
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

    const base64Image = `data:${imageResponse.headers['content-type']};base64,${Buffer.from(imageResponse.data).toString('base64')}`;

    const formData = new FormData();
    formData.append('data', JSON.stringify({
      data: [base64Image, confidence_threshold || 0.5]
    }));

    console.log(`🌐 Processing URL: ${image_url}`);

    const response = await axios.post(`${INFERENCE_URL}/api/predict`, formData, {
      headers: formData.getHeaders(),
      timeout: 60000
    });

    res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('❌ Detection error:', error.message);
    res.status(500).json({
      error: 'Detection failed',
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Food Detection Gateway running on port ${PORT}`);
  console.log(`📡 Hugging Face Space: ${INFERENCE_URL || 'NOT CONFIGURED'}`);
  console.log(`\n💡 Test with: curl http://localhost:${PORT}/health`);
});

export default app;
