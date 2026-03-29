from fastapi import APIRouter
from pydantic import BaseModel
from PIL import Image
from ultralytics import YOLO
import os
import io

# Sadece bu dosyaya ait endpoint'leri tanımlamak için yeni bir "Router" oluşturuyoruz.
router = APIRouter()

# --- MODEL YÜKLEME ---
MODEL_PATH = r"D:\Datalarım\Desktop\Bitirme\NutriGame\ai_service\models\yolov8n.pt"

# Modeli yükle
# Eğer model dosyası yoksa, bir hata fırlatacak.
if not os.path.exists(MODEL_PATH):
    raise RuntimeError(f"Model not found at {MODEL_PATH}. Please place your fine-tuned model in the 'ai_service/models' directory.")
    
model = YOLO(MODEL_PATH) 

@router.post("/detect", tags=["Object Detection"])
async def detect_objects(file: UploadFile = File(...)):
    """
    Kullanıcıdan bir resim dosyası alır, bu resimdeki nesneleri tespit eder
    ve sonuçları JSON formatında geri döndürür.
    """
    contents = await file.read()
    
    try:
        image = Image.open(io.BytesIO(contents))
    except Exception as e:
        return {"error": f"Could not open image file: {e}"}

    results = model(image)
    
    predictions = []
    for box in results[0].boxes.data.tolist():
        x1, y1, x2, y2, confidence_score, class_id = box
        class_name = model.names[int(class_id)]
        
        predictions.append({
            "class_name": class_name,
            "confidence": confidence_score,
            "bounding_box": {
                "x1": x1,
                "y1": y1,
                "x2": x2,
                "y2": y2
            }
        })

    return {"predictions": predictions}
