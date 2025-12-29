from flask import Flask, request, jsonify
from PIL import Image
import io
import time
import torch
import numpy as np

app = Flask(__name__)

model = None
device = "cpu"

CATEGORIES = {
    0: "pizza",
    1: "burger",
    2: "pasta",
    3: "salad",
    4: "soup",
    5: "kebab",
    6: "dessert",
}

def load_model():
    """Load RT-DETR model"""
    global model, device
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")
    
    try:
        # TODO: Model yükleme
        # from rfdetr import RFDETRBase
        # model = RFDETRBase(pretrain_weights="checkpoint_best_ema.pth")
        # model.to(device)
        # model.eval()
        
        print("⚠️ Running in mock mode")
        model = "mock"
    except Exception as e:
        print(f"Error: {e}")
        model = "mock"

def process_image(image, confidence_threshold=0.5):
    """Process image and return detections"""
    img_array = np.array(image)
    
    # Mock detections
    if model == "mock":
        return [
            {
                "label": "pizza",
                "confidence": 0.92,
                "bbox": [120, 80, 350, 290]
            },
            {
                "label": "salad",
                "confidence": 0.85,
                "bbox": [400, 100, 550, 280]
            }
        ]
    
    # TODO: Real inference
    # results = model.predict(img_array)
    # return process_results(results, confidence_threshold)
    
    return []

@app.route('/')
def home():
    return jsonify({
        "service": "Food Detection API",
        "model": "RT-DETR",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "predict": "/predict (POST)"
        }
    })

@app.route('/health')
def health():
    return jsonify({
        "status": "healthy",
        "model": "RT-DETR",
        "device": device,
        "mode": "mock" if model == "mock" else "production"
    })

@app.route('/predict', methods=['POST'])
def predict():
    try:
        start_time = time.time()
        
        # Get parameters
        confidence_threshold = float(request.form.get('confidence_threshold', 0.5))
        
        # Get image
        if 'image' not in request.files:
            return jsonify({"error": "No image provided"}), 400
        
        image_file = request.files['image']
        image = Image.open(io.BytesIO(image_file.read()))
        
        # Process
        detections = process_image(image, confidence_threshold)
        
        # Filter by confidence
        filtered = [d for d in detections if d["confidence"] >= confidence_threshold]
        
        inference_time = (time.time() - start_time) * 1000
        
        return jsonify({
            "detections": filtered,
            "inference_time": round(inference_time, 2),
            "image_size": list(image.size),
            "total_detections": len(filtered)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    load_model()
    
    import os
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
