import gradio as gr
import torch
import numpy as np
from PIL import Image
import time

# Model placeholder - Hugging Face'e yükledikten sonra güncellenecek
model = None
device = "cpu"

# Food categories - kendi kategorilerinizi buraya ekleyin
CATEGORIES = {
    0: "pizza",
    1: "burger",
    2: "pasta",
    3: "salad",
    4: "soup",
    5: "kebab",
    6: "dessert",
    # Daha fazla kategori ekleyin
}

def load_model():
    """Load RT-DETR model"""
    global model, device
    
    # GPU varsa kullan, yoksa CPU
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")
    
    try:
        # TODO: Model yükleme kodunu buraya ekleyin
        # from rfdetr import RFDETRBase
        # model = RFDETRBase(pretrain_weights="checkpoint_best_ema.pth")
        # model.to(device)
        # model.eval()
        
        print("⚠️ Model loading not implemented - using mock mode")
        model = "mock"
    except Exception as e:
        print(f"Error loading model: {e}")
        model = "mock"

def detect_food(image, confidence_threshold=0.5):
    """
    Detect food items in image
    
    Args:
        image: PIL Image
        confidence_threshold: Minimum confidence score (0-1)
    
    Returns:
        annotated_image: Image with bounding boxes
        detections: List of detections
    """
    if image is None:
        return None, "Please upload an image"
    
    start_time = time.time()
    
    # Convert to numpy array
    img_array = np.array(image)
    
    # Mock detections for testing
    if model == "mock":
        detections = [
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
    else:
        # TODO: Real inference
        # results = model.predict(img_array)
        # detections = process_results(results, confidence_threshold)
        detections = []
    
    # Draw bounding boxes
    annotated_image = image.copy()
    from PIL import ImageDraw, ImageFont
    draw = ImageDraw.Draw(annotated_image)
    
    for det in detections:
        if det["confidence"] >= confidence_threshold:
            bbox = det["bbox"]
            label = f"{det['label']}: {det['confidence']:.2%}"
            
            # Draw rectangle
            draw.rectangle(bbox, outline="red", width=3)
            
            # Draw label
            draw.text((bbox[0], bbox[1] - 20), label, fill="red")
    
    inference_time = time.time() - start_time
    
    # Format results
    results_text = f"🎯 Detected {len(detections)} item(s) in {inference_time:.2f}s\n\n"
    for i, det in enumerate(detections, 1):
        if det["confidence"] >= confidence_threshold:
            results_text += f"{i}. {det['label']}: {det['confidence']:.2%}\n"
    
    return annotated_image, results_text

# Load model on startup
load_model()

# Create Gradio interface
with gr.Blocks(title="Food Detection - RT-DETR") as demo:
    gr.Markdown("""
    # 🍕 Food Detection Service
    RT-DETR model ile yemek tespiti. Resim yükleyin ve tespit sonuçlarını görün!
    
    **Model:** RT-DETR (Fine-tuned for Food Detection)
    """)
    
    with gr.Row():
        with gr.Column():
            input_image = gr.Image(type="pil", label="Upload Food Image")
            confidence_slider = gr.Slider(
                minimum=0.1,
                maximum=1.0,
                value=0.5,
                step=0.05,
                label="Confidence Threshold"
            )
            detect_btn = gr.Button("🔍 Detect Food", variant="primary")
            
        with gr.Column():
            output_image = gr.Image(type="pil", label="Detection Results")
            output_text = gr.Textbox(label="Detections", lines=10)
    
    gr.Examples(
        examples=[
            ["examples/pizza.jpg", 0.5],
            ["examples/burger.jpg", 0.5],
        ],
        inputs=[input_image, confidence_slider],
        label="Example Images"
    )
    
    detect_btn.click(
        fn=detect_food,
        inputs=[input_image, confidence_slider],
        outputs=[output_image, output_text]
    )

# Launch the app
if __name__ == "__main__":
    demo.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=False
    )
