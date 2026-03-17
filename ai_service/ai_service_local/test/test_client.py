import requests
import os

# Test edilecek resmin yolu (bu dosyayı ai_service klasörüne koymalısınız)
TEST_IMAGE_PATH = r'D:\Datalarım\Desktop\Bitirme\NutriGame\ai_service\mock_data\banana.jpg'

# AI servisinin adresi
API_URL = 'http://127.0.0.1:8001/detect'

def run_test():
    """
    Test resmini AI servisine gönderir ve sonucu yazdırır.
    """
    # Test resminin var olup olmadığını kontrol et
    if not os.path.exists(TEST_IMAGE_PATH):
        print(f"Hata: '{TEST_IMAGE_PATH}' bulunamadı.")
        print("Lütfen 'ai_service' klasörünün içine test için bir .jpg dosyası koyun ve adını 'test_image.jpg' olarak değiştirin.")
        return

    # Resmi 'multipart/form-data' olarak göndermek için dosyayı aç
    with open(TEST_IMAGE_PATH, 'rb') as f:
        files = {'file': (TEST_IMAGE_PATH, f, 'image/jpeg')}
        
        print(f"'{TEST_IMAGE_PATH}' resmi {API_URL} adresine gönderiliyor...")
        
        try:
            # İsteği gönder
            response = requests.post(API_URL, files=files)
            
            # Yanıtı kontrol et
            if response.status_code == 200:
                print("\nBaşarılı! Sunucudan gelen yanıt:")
                print(response.json())
            else:
                print(f"\nHata! Sunucu {response.status_code} koduyla yanıt verdi:")
                print(response.text)
                
        except requests.exceptions.ConnectionError as e:
            print("\nHata: Sunucuya bağlanılamadı.")
            print("Lütfen 'uvicorn main:app --port 8001' komutunu çalıştırarak AI servisinin çalıştığından emin olun.")

if __name__ == "__main__":
    run_test()


"""
Başarılı! Sunucudan gelen yanıt:
{'predictions': [{'class_name': 'banana', 'confidence': 0.8596363067626953, 'bounding_box': {'x1': 78.22000885009766, 'y1': 35.93109893798828, 'x2': 191.0722198486328, 'y2': 119.45285034179688}}]}
"""