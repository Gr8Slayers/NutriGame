/**
 * Backend integration example with Express.js
 * This shows how to integrate the food detection API into your own backend
 * Install: npm install express multer axios form-data
 */

const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DETECTION_API_URL = 'https://nutrigame.onrender.com/predict';

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware
app.use(express.json());

/**
 * POST /api/analyze-food
 * Accepts an image upload, forwards it to the detection service,
 * and returns the detection results
 */
app.post('/api/analyze-food', upload.single('image'), async (req, res) => {
  try {
    // Validate request
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No image file provided' 
      });
    }

    console.log(`Processing image: ${req.file.originalname}`);

    // Forward the image to the detection service
    // Important: Include the original filename to preserve the extension
    const formData = new FormData();
    formData.append('image', fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const response = await axios.post(DETECTION_API_URL, formData, {
      headers: formData.getHeaders(),
      timeout: 300000 // 5 minute timeout for first request (model loading)
    });

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    // Validate response is an array
    const detections = response.data;
    if (!Array.isArray(detections)) {
      // Handle error response from API (e.g., first request with model download)
      return res.status(500).json({
        success: false,
        error: 'Invalid response from detection service',
        details: detections.message || 'Expected array of detections',
        raw_response: detections
      });
    }

    // Process and enhance results
    const enhancedResults = detections.map(det => ({
      food: det.class_name,
      confidence: Math.round(det.confidence * 100) / 100,
      boundingBox: {
        x1: Math.round(det.box[0]),
        y1: Math.round(det.box[1]),
        x2: Math.round(det.box[2]),
        y2: Math.round(det.box[3])
      }
    }));

    // Return success response
    res.json({
      success: true,
      count: enhancedResults.length,
      detections: enhancedResults
    });

    console.log(`Detected ${enhancedResults.length} object(s)`);

  } catch (error) {
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Detection error:', error.message);

    // Return error response
    res.status(500).json({
      success: false,
      error: error.response?.data?.message || 'Failed to detect objects in image',
      details: error.message
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'NutriGame Food Detection Backend',
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/analyze-batch
 * Process multiple images at once
 */
app.post('/api/analyze-batch', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No image files provided'
      });
    }

    console.log(`Processing ${req.files.length} images`);

    // Process all images in parallel
    const detectionPromises = req.files.map(async (file) => {
      try {
        const formData = new FormData();
        formData.append('image', fs.createReadStream(file.path));

        const response = await axios.post(DETECTION_API_URL, formData, {
          headers: formData.getHeaders(),
          timeout: 300000 // 5 minute timeout
        });

        // Clean up file
        fs.unlinkSync(file.path);

        return {
          filename: file.originalname,
          success: true,
          detections: response.data
        };
      } catch (error) {
        // Clean up file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }

        return {
          filename: file.originalname,
          success: false,
          error: error.message
        };
      }
    });

    const results = await Promise.all(detectionPromises);

    res.json({
      success: true,
      results: results
    });

  } catch (error) {
    // Clean up all files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.status(500).json({
      success: false,
      error: 'Batch processing failed',
      details: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`Food detection API: ${DETECTION_API_URL}`);
  console.log('\nAvailable endpoints:');
  console.log('  POST /api/analyze-food   - Analyze single image');
  console.log('  POST /api/analyze-batch  - Analyze multiple images');
  console.log('  GET  /api/health         - Health check');
});

module.exports = app;
