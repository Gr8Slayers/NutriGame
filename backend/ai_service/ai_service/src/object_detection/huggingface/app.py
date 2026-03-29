import gradio as gr
from ultralytics import YOLO
from PIL import Image
import numpy as np

model = YOLO('yolov8n.pt')

# Approximate kcal per standard serving for COCO food classes
FOOD_CALORIES = {
    'banana':   89,
    'apple':    95,
    'sandwich': 350,
    'orange':   62,
    'broccoli': 55,
    'carrot':   41,
    'hot dog':  290,
    'pizza':    285,
    'donut':    253,
    'cake':     350,
}

# COCO class names that are food items
FOOD_CLASS_NAMES = set(FOOD_CALORIES.keys())

CONF_THRESHOLD = 0.30


def detect_food(image):
    """
    Detect food items in the image using YOLOv8n.
    Returns NOT_FOOD: prefix when no food is found so the Node.js
    integration can surface a proper error to the client (TC-E01).
    Returns calorie estimates alongside detections (TC-03).
    """
    if image is None:
        return None, 'NOT_FOOD: No image provided. Please upload a food photo.'

    results = model(image)
    result  = results[0]

    annotated = result.plot()
    annotated_rgb = Image.fromarray(annotated[..., ::-1])

    food_detections = []
    total_calories  = 0

    for box in result.boxes:
        confidence = float(box.conf[0])
        if confidence < CONF_THRESHOLD:
            continue
        class_name = model.names[int(box.cls[0])]
        if class_name not in FOOD_CLASS_NAMES:
            continue
        calories = FOOD_CALORIES[class_name]
        food_detections.append({
            'name':       class_name,
            'confidence': confidence,
            'calories':   calories,
        })
        total_calories += calories

    if not food_detections:
        any_detected = any(
            float(b.conf[0]) >= CONF_THRESHOLD for b in result.boxes
        )
        if any_detected:
            return annotated_rgb, (
                'NOT_FOOD: No food items detected. '
                'Please retake the photo with food visible.'
            )
        return annotated_rgb, (
            'NOT_FOOD: Nothing detected. '
            'Please take a clearer photo of the food.'
        )

    lines = ['Detected items:']
    for item in food_detections:
        lines.append(
            f"• {item['name']}: {item['confidence']:.1%} (~{item['calories']} kcal)"
        )
    if total_calories > 0:
        lines.append(f'\nEstimated total: ~{total_calories} kcal')

    return annotated_rgb, '\n'.join(lines)


demo = gr.Interface(
    fn=detect_food,
    inputs=gr.Image(type='pil', label='Upload Food Image'),
    outputs=[
        gr.Image(type='pil',  label='Detection Result'),
        gr.Textbox(label='Detected Foods & Calorie Estimates', lines=6),
    ],
    title='YOLOv8n Food Detection',
    description=(
        'Upload a food photo to detect items and estimate calories. '
        'Supported foods: banana, apple, sandwich, orange, broccoli, '
        'carrot, hot dog, pizza, donut, cake.'
    ),
    cache_examples=False,
)

if __name__ == '__main__':
    demo.launch()
