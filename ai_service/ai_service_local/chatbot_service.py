from fastapi import APIRouter, Body
from pydantic import BaseModel
from transformers import pipeline

# Sadece bu dosyaya ait endpoint'leri tanımlamak için yeni bir "Router" oluşturuyoruz.
router = APIRouter()

# --- CHATBOT (Hugging Face) ---
# Sunucu başladığında modeli ve "text-generation" pipeline'ını bir kereliğine yüklüyoruz.
# Not: İlk çalıştırmada model indirileceği için bu işlem uzun sürebilir.
chatbot = pipeline("text-generation", model="NEU-HAI/mental-alpaca")

# İstek gövdesi için Pydantic modeli
class ChatRequest(BaseModel):
    message: str

@router.post(
    "/chat",
    tags=["Chatbot"],
    summary="Chatbot ile konuş",
    response_description="Modelin ürettiği yanıt"
)
async def chat_with_bot(
    request: ChatRequest = Body(
        ..., 
        example={"message": "Bana sağlıklı bir kahvaltı önerir misin?"}
    )
):
    """
    Kullanıcıdan bir mesaj alır, bunu yerel Hugging Face modeline gönderir ve chatbot'un yanıtını geri döndürür.

    **Örnek İstek:**
    ```json
    {
      "message": "Bana sağlıklı bir kahvaltı önerir misin?"
    }
    ```

    **Örnek Yanıt:**
    ```json
    {
      "response": "Tabii! Yulaf ezmesi, taze meyve ve bir bardak süt sağlıklı bir kahvaltı için harika bir seçim olabilir."
    }
    ```
    """
    try:
        # Alpaca model formatına uygun bir prompt oluşturuyoruz.
        prompt = f"### Instruction:\n{request.message}\n\n### Response:"

        # Modeli çalıştır ve sonucu al
        # max_length: Üretilecek yanıtın maksimum uzunluğu
        # num_return_sequences: Kaç farklı yanıt üretileceği
        results = chatbot(prompt, max_length=200, num_return_sequences=1)
        
        # Model, verdiğimiz prompt'u da içeren tam metni döndürür.
        # Biz sadece "### Response:" sonrasındaki kısmı almalıyız.
        full_response = results[0]['generated_text']
        response_only = full_response.split("### Response:")[1].strip()

        return {"response": response_only}
    
    except Exception as e:
        return {"error": f"An error occurred with the local model: {str(e)}"}
