from fastapi import APIRouter
from pydantic import BaseModel
from transformers import pipeline, Conversation

# Sadece bu dosyaya ait endpoint'leri tanımlamak için yeni bir "Router" oluşturuyoruz.
router = APIRouter()

# --- CHATBOT (Hugging Face) ---
# Sunucu başladığında modeli ve "conversational pipeline"ı bir kereliğine yüklüyoruz.
chatbot = pipeline("text-generation", model="NEU-HAI/mental-alpaca")      

# İstek gövdesi için Pydantic modeli
class ChatRequest(BaseModel):
    message: str

@router.post("/chat", tags=["Chatbot"])
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
