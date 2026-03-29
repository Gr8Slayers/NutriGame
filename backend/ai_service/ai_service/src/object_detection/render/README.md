# NutriGame Object Detection API

Food object detection service using YOLOv8n model, deployed on Render.

## API Endpoint

**Base URL:** `https://nutrigame.onrender.com`

### POST /predict

Detects food objects in an uploaded image and returns their bounding boxes, class names, and confidence scores.

#### Request

- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Body Parameter:**
  - `image` (file, required): Image file to analyze (JPEG, PNG, etc.)

#### Response

**Success (200 OK):**

```json
[
  {
    "box": [78.22, 35.93, 191.07, 119.45],
    "class_id": 46,
    "class_name": "banana",
    "confidence": 0.8596
  },
  {
    "box": [10.5, 20.3, 150.2, 100.8],
    "class_id": 47,
    "class_name": "apple",
    "confidence": 0.7225
  }
]
```

**Response Fields:**
- `box`: Array of 4 numbers `[x1, y1, x2, y2]` representing the bounding box coordinates (top-left and bottom-right corners)
- `class_id`: Numeric ID of the detected object class
- `class_name`: Human-readable name of the detected object (e.g., "banana", "pizza", "apple")
- `confidence`: Confidence score between 0 and 1 (higher means more confident)

**Error (500 Internal Server Error):**

```json
{
  "message": "Error during object detection.",
  "error": "Error details here"
}
```

## Usage Examples

### Quick Test (CLI)

**Test the API directly:**
```bash
npm install axios form-data
node inference.js path/to/image.jpg
```

### Backend Integration (Recommended)

For integrating into your NutriGame backend, use `backend-integration.js`:

**1. Install dependencies:**
```bash
npm install express multer axios form-data
```

**2. Run the backend server:**
```bash
node backend-integration.js
```

**3. Available endpoints:**
- `POST /api/analyze-food` - Analyze single image
- `POST /api/analyze-batch` - Analyze multiple images (up to 10)
- `GET /api/health` - Health check

**4. Test with curl:**
```bash
curl -X POST -F "image=@path/to/image.jpg" http://localhost:3000/api/analyze-food
```

**Response format:**
```json
{
  "success": true,
  "count": 1,
  "detections": [
    {
      "food": "banana",
      "confidence": 0.86,
      "boundingBox": {
        "x1": 78,
        "y1": 36,
        "x2": 191,
        "y2": 119
      }
    }
  ]
}
```

---

## Direct API Usage

If you want to call the Render API directly (without backend-integration.js):

### JavaScript (Fetch API)

```javascript
async function detectFood(imageFile) {
  const formData = new FormData();
  formData.append('image', imageFile);

  try {
    const response = await fetch('https://nutrigame.onrender.com/predict', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const predictions = await response.json();
    console.log('Detected objects:', predictions);
    return predictions;
  } catch (error) {
    console.error('Detection failed:', error);
    throw error;
  }
}

// Usage with file input
const fileInput = document.getElementById('imageInput');
fileInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (file) {
    const results = await detectFood(file);
    // Process results...
  }
});
```

### Node.js (axios)

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function detectFood(imagePath) {
  const formData = new FormData();
  formData.append('image', fs.createReadStream(imagePath));

  try {
    const response = await axios.post(
      'https://nutrigame.onrender.com/predict',
      formData,
      {
        headers: formData.getHeaders()
      }
    );

    console.log('Detected objects:', response.data);
    return response.data;
  } catch (error) {
    console.error('Detection failed:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
detectFood('./path/to/image.jpg')
  .then(predictions => {
    predictions.forEach(pred => {
      console.log(`Found ${pred.class_name} with ${(pred.confidence * 100).toFixed(1)}% confidence`);
    });
  });
```

### Python (requests)

```python
import requests

def detect_food(image_path):
    url = 'https://nutrigame.onrender.com/predict'
    
    with open(image_path, 'rb') as image_file:
        files = {'image': image_file}
        response = requests.post(url, files=files)
    
    if response.status_code == 200:
        predictions = response.json()
        print('Detected objects:', predictions)
        return predictions
    else:
        print(f'Error: {response.status_code}')
        print(response.json())
        return None

# Usage
results = detect_food('./path/to/image.jpg')
if results:
    for pred in results:
        print(f"Found {pred['class_name']} with {pred['confidence']:.2%} confidence")
```

### cURL

```bash
curl -X POST -F "image=@/path/to/image.jpg" https://nutrigame.onrender.com/predict
```

## Important Notes

### First Request Delay
⚠️ **The first request after a period of inactivity may take 2-3 minutes.** This is because:
1. The free tier service "spins down" after inactivity
2. The model needs to be downloaded and loaded into memory on the first request

**Subsequent requests are typically fast (1-5 seconds).**

**Important:** If using `backend-integration.js`, make sure the timeout is set to at least 5 minutes (300000ms) to handle the first request.

### Supported Objects

The model can detect 80 different object classes from the COCO dataset, including common food items:
- Fruits: apple, banana, orange
- Meals: pizza, sandwich, hot dog
- Beverages: bottle, cup, wine glass
- Utensils: fork, knife, spoon, bowl
- And many more...

Full list: [COCO Classes](https://github.com/ultralytics/ultralytics/blob/main/ultralytics/cfg/datasets/coco.yaml)

### Rate Limits
- No enforced rate limits on the free tier
- However, the service may be slow during high load
- For production use, consider upgrading to a paid Render plan

## Integration with Backend

The `backend-integration.js` file provides a complete Express.js server that wraps the Render API with additional features:

**Features:**
- ✅ File upload handling with multer
- ✅ Automatic file cleanup
- ✅ Enhanced error handling
- ✅ Formatted response structure
- ✅ Batch processing support (up to 10 images)
- ✅ Health check endpoint
- ✅ 5-minute timeout for first request

**Key Configuration:**
```javascript
const DETECTION_API_URL = 'https://nutrigame.onrender.com/predict';
const PORT = process.env.PORT || 3000;
```

**Integration Steps:**
1. Copy `backend-integration.js` to your backend project
2. Install dependencies: `npm install express multer axios form-data`
3. Import and mount the routes in your main Express app
4. Or run as standalone: `node backend-integration.js`

**Example Integration:**
```javascript
const detectionApp = require('./backend-integration');
app.use('/detection', detectionApp); // Mount on /detection path
```

## Troubleshooting

**Problem:** Request times out (timeout of 300000ms exceeded)  
**Solution:** This happens on the very first request when the model is being downloaded. The request can take 2-3 minutes. Just wait and retry.

**Problem:** "Connection refused" or service unavailable  
**Solution:** The Render service may have spun down due to inactivity. Make a request and wait 30-60 seconds for it to wake up, then retry.

**Problem:** "Invalid response from detection service"  
**Solution:** This can happen on the first request if the model download fails. Simply retry the request.

**Problem:** Port 3000 already in use (EADDRINUSE)  
**Solution:** Another instance of the backend server is already running. Stop it (Ctrl+C) before starting a new one.

## License

This service uses YOLOv8n from Ultralytics, which is licensed under AGPL-3.0.
