import io
from fastapi import FastAPI, File, UploadFile
from PIL import Image
from ultralytics import YOLO
import os

# FastAPI uygulamasını başlat
app = FastAPI(title="NutriGame AI Service")

# --- MODEL YÜKLEME ---
# Modelin yolunu belirliyoruz. 'models' klasörünün içine koyacağınız
# fine-tune edilmiş modelin adını buraya yazın.
MODEL_PATH = os.path.join('models', 'best.pt')

# Modeli yükle
# Eğer model dosyası yoksa, bir hata fırlatacak.
if not os.path.exists(MODEL_PATH):
    raise RuntimeError(f"Model not found at {MODEL_PATH}. Please place your fine-tuned model in the 'ai_service/models' directory.")
    
model = YOLO(MODEL_PATH) 


@app.post("/detect")
async def detect_objects(file: UploadFile = File(...)):
    """
    Kullanıcıdan bir resim dosyası alır, bu resimdeki nesneleri tespit eder
    ve sonuçları JSON formatında geri döndürür.
    """
    # Gelen dosyayı byte olarak oku
    contents = await file.read()
    
    # Byte verisini bir resim objesine çevir
    try:
        image = Image.open(io.BytesIO(contents))
    except Exception as e:
        return {"error": f"Could not open image file: {e}"}

    # Modeli resim üzerinde çalıştırarak tahminleri al
    results = model(image)
    
    # Sonuçları işleyerek istemcinin anlayacağı temiz bir formata getir
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

@app.get("/")
def read_root():
    return {"message": "Welcome to the NutriGame AI Service. Use the /detect endpoint to get predictions."}
