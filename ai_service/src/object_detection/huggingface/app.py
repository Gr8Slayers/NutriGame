import gradio as gr
from ultralytics import YOLO
from PIL import Image
import numpy as np

# Load YOLOv8n model
model = YOLO('yolov8n.pt')

def detect_food(image):
    """
    Detect food items in the image using YOLOv8n
    
    Args:
        image: PIL Image or numpy array
    
    Returns:
        tuple: (annotated_image, detection_text)
    """
    # Run inference
    results = model(image)
    
    # Get the first result
    result = results[0]
    
    # Get annotated image
    annotated_img = result.plot()
    
    # Convert BGR to RGB for display
    annotated_img = Image.fromarray(annotated_img[..., ::-1])
    
    # Extract detection details
    detections = []
    for box in result.boxes:
        class_id = int(box.cls[0])
        confidence = float(box.conf[0])
        class_name = model.names[class_id]
        detections.append(f"• {class_name}: {confidence:.1%}")
    
    if detections:
        detection_text = "Detected items:\n" + "\n".join(detections)
    else:
        detection_text = "No objects detected"
    
    return annotated_img, detection_text

# Create Gradio interface
demo = gr.Interface(
    fn=detect_food,
    inputs=gr.Image(type="pil", label="Upload Food Image"),
    outputs=[
        gr.Image(type="pil", label="Detection Results"),
        gr.Textbox(label="Detected Items", lines=5)
    ],
    title="🍕 YOLOv8n Food Detection",
    description="Upload an image to detect food items using YOLOv8n model trained on COCO dataset (80 classes including various food items)",
    examples=[],
    cache_examples=False
)

if __name__ == "__main__":
    demo.launch()
