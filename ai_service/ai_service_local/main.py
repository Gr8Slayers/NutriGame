import io
from fastapi import FastAPI, File, UploadFile
from PIL import Image
from ultralytics import YOLO
import os
from pydantic import BaseModel
from dotenv import load_dotenv

# .env dosyasındaki değişkenleri yükle
load_dotenv()

# FastAPI uygulamasını başlat
app = FastAPI(title="NutriGame AI Service")

# --- MODEL YÜKLEME ---
# Modelin yolunu belirliyoruz. 'models' klasörünün içine koyacağınız
# fine-tune edilmiş modelin adını buraya yazın.
MODEL_PATH = r"D:\Datalarım\Desktop\Bitirme\NutriGame\ai_service\models\yolov8n.pt"

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

from transformers import pipeline, Conversation

# --- CHATBOT (Hugging Face) ---
# Sunucu başladığında modeli ve "conversational pipeline"ı bir kereliğine yüklüyoruz.
# Not: İlk çalıştırmada model indirileceği için bu işlem uzun sürebilir.
chatbot = pipeline("conversational", model="microsoft/DialoGPT-medium")

# İstek gövdesi için Pydantic modeli
class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
async def chat_with_bot(request: ChatRequest):
    """
    Kullanıcıdan bir mesaj alır, bunu yerel Hugging Face modeline gönderir ve
    chatbot'un yanıtını geri döndürür.
    """
    try:
        # Gelen mesajı bir "Conversation" objesine koyarak pipeline'a veriyoruz.
        conv = Conversation(request.message)
        chatbot(conv)
        # Modelin ürettiği son yanıtı alıyoruz.
        response_message = conv.generated_responses[-1]
        return {"response": response_message}
    
    except Exception as e:
        return {"error": f"An error occurred with the local model: {str(e)}"}
