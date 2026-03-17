/**
 * Node.js food detection example using axios
 * Install: npm install axios form-data
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_URL = 'https://nutrigame.onrender.com/predict';

/**
 * Detects food objects in an image file
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<Array>} Array of detected objects
 */
async function detectFood(imagePath) {
  // Check if file exists
  if (!fs.existsSync(imagePath)) {
    throw new Error(`File not found: ${imagePath}`);
  }

  const formData = new FormData();
  formData.append('image', fs.createReadStream(imagePath));

  try {
    const response = await axios.post(API_URL, formData, {
      headers: formData.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log('Detected objects:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('API error:', error.response.data);
    } else {
      console.error('Request failed:', error.message);
    }
    throw error;
  }
}

// Example usage
async function main() {
  const imagePath = process.argv[2] || 'D:\\Desktop\\Bitirme\\NutriGame\\ai_service\\mock_data\\banana.jpg';
  
  console.log(`Analyzing image: ${imagePath}`);
  console.log('Please wait... (first request may take several seconds)\n');

  try {
    const predictions = await detectFood(imagePath);
    
    console.log(`\nFound ${predictions.length} object(s):\n`);
    
    predictions.forEach((pred, index) => {
      console.log(`${index + 1}. ${pred.class_name}`);
      console.log(`   Confidence: ${(pred.confidence * 100).toFixed(1)}%`);
      console.log(`   Bounding box: [${pred.box.map(v => v.toFixed(1)).join(', ')}]`);
      console.log();
    });
  } catch (error) {
    console.error('Detection failed');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { detectFood };
