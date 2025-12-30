import sys
import json
from ultralytics import YOLO
from PIL import Image

def predict(image_path):
    """
    Loads the RT-DETR model, performs inference on the given image,
    and returns the results in a JSON serializable format.
    """
    try:
        # Load YOLOv8n (nano) model - very lightweight (~6 MB)
        # Ultralytics will auto-download from its hub if not present
        model = YOLO('yolov8n')

        # Perform inference
        results = model(image_path)

        # Process results
        predictions = []
        for r in results:
            boxes = r.boxes
            for box in boxes:
                b = box.xyxy[0].tolist()  # get box coordinates in [x1, y1, x2, y2] format
                c = box.cls.item()       # get class
                conf = box.conf.item()   # get confidence score
                
                predictions.append({
                    'box': b,
                    'class_id': c,
                    'class_name': model.names[int(c)],
                    'confidence': conf
                })
        
        return predictions

    except Exception as e:
        # Return error information as a JSON object
        return {'error': str(e)}

if __name__ == "__main__":
    if len(sys.argv) > 1:
        image_file_path = sys.argv[1]
        
        # Check if the file exists
        try:
            with Image.open(image_file_path) as img:
                pass
        except FileNotFoundError:
            print(json.dumps({'error': f'Image file not found at {image_file_path}'}))
            sys.exit(1)
            
        prediction_results = predict(image_file_path)
        
        # Print results as a JSON string to stdout
        print(json.dumps(prediction_results))
    else:
        # Handle case where no image path is provided
        print(json.dumps({'error': 'No image path provided.'}))
        sys.exit(1)
