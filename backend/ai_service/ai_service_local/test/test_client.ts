import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';

// Test edilecek resmin tam yolu
// __dirname, bu script'in çalıştığı klasörün yolunu verir.
const TEST_IMAGE_PATH = path.join('D:\\Datalarım\\Desktop\\Bitirme\\NutriGame\\ai_service', 
    'mock_data', 'banana.jpg');

// AI servisinin adresi
const API_URL = 'http://127.0.0.1:8001/detect';

async function runTest() {
    console.log(`Test script using TypeScript...`);

    // 1. Test resminin var olup olmadığını kontrol et
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
        console.error(`Hata: Test resmi bulunamadı: ${TEST_IMAGE_PATH}`);
        console.error("Lütfen 'ai_service/mock_data' klasörüne 'banana.jpg' adında bir test resmi koyun.");
        return;
    }

    // 2. Form verisi oluştur
    const formData = new FormData();
    // Resmi bir stream olarak oku ve forma ekle
    formData.append('file', fs.createReadStream(TEST_IMAGE_PATH));

    console.log(`'${path.basename(TEST_IMAGE_PATH)}' resmi ${API_URL} adresine gönderiliyor...`);

    try {
        // 3. Axios ile POST isteği gönder
        const response = await axios.post(API_URL, formData, {
            headers: {
                ...formData.getHeaders(), // 'Content-Type: multipart/form-data' başlığını ayarlar
            },
        });

        // 4. Yanıtı yazdır
        console.log('\nBaşarılı! Sunucudan gelen yanıt:');
        // JSON'ı daha okunaklı yazdırmak için JSON.stringify kullanılır
        console.log(JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error('\nHata: İstek gönderilemedi.');
        if (axios.isAxiosError(error)) {
            if (error.code === 'ECONNREFUSED') {
                console.error("Bağlantı hatası: Sunucuya bağlanılamadı.");
                console.error("Lütfen AI servisinin çalıştığından emin olun (uvicorn main:app --port 8001).");
            } else if (error.response) {
                // Sunucudan gelen hata mesajını yazdır
                console.error(`Sunucu ${error.response.status} koduyla yanıt verdi:`);
                console.error(error.response.data);
            }
        } else {
            console.error('Beklenmedik bir hata oluştu:', error);
        }
    }
}

// Testi çalıştır
runTest();

/*
Başarılı! Sunucudan gelen yanıt:
{
  "predictions": [
    {
      "class_name": "banana",
      "confidence": 0.8596363067626953,
      "bounding_box": {
        "x1": 78.22000885009766,
        "y1": 35.93109893798828,
        "x2": 191.0722198486328,
        "y2": 119.45285034179688
      }
    }
  ]
}
*/
