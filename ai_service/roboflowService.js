/**
 * Roboflow AI Service - Object Detection
 * Roboflow workflow API'sini kullanarak resim analizi yapar
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Roboflow API bilgileri
const ROBOFLOW_CONFIG = {
    workflowUrl: 'https://serverless.roboflow.com/food-xslsx/workflows/custom-workflow',
    apiKey: 'sDi5WbWsM5oPhoeL7BlW'
};

/**
 * URL'den resim analizi yapar
 * @param {string} imageUrl - Analiz edilecek resmin URL'i
 * @returns {Promise<object>} - Roboflow'dan gelen tahmin sonuçları
 */
async function detectObjectsFromUrl(imageUrl) {
    try {
        console.log(`Roboflow'a istek gönderiliyor: ${imageUrl}`);

        const response = await axios.post(ROBOFLOW_CONFIG.workflowUrl, {
            api_key: ROBOFLOW_CONFIG.apiKey,
            inputs: {
                image: { type: "url", value: imageUrl }
            }
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Roboflow\'dan başarılı yanıt alındı');
        return response.data;

    } catch (error) {
        console.error('❌ Roboflow API hatası:', error.message);
        if (error.response) {
            console.error('Hata detayları:', error.response.data);
        }
        throw new Error('Nesne tespiti başarısız oldu');
    }
}

/**
 * Buffer (dosya verisi) üzerinden resim analizi yapar
 * @param {Buffer} imageBuffer - Resmin buffer verisi (multer'dan gelen req.file.buffer)
 * @param {string} filename - Dosya adı
 * @returns {Promise<object>} - Roboflow'dan gelen tahmin sonuçları
 */
async function detectObjectsFromBuffer(imageBuffer, filename = 'D:\\Datalarım\\Desktop\\Bitirme\\NutriGame\\ai_service\\mock_data\\banana.jpg') {
    try {
        console.log(`Roboflow'a resim yükleniyor: ${filename}`);

        // Base64'e çevir
        const base64Image = imageBuffer.toString('base64');

        const response = await axios.post(ROBOFLOW_CONFIG.workflowUrl, {
            api_key: ROBOFLOW_CONFIG.apiKey,
            inputs: {
                image: { type: "base64", value: base64Image }
            }
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Roboflow\'dan başarılı yanıt alındı');
        return response.data;

    } catch (error) {
        console.error('❌ Roboflow API hatası:', error.message);
        if (error.response) {
            console.error('Hata detayları:', error.response.data);
        }
        throw new Error('Nesne tespiti başarısız oldu');
    }
}

/**
 * Yerel dosya yolundan resim analizi yapar
 * @param {string} imagePath - Resim dosyasının tam yolu
 * @returns {Promise<object>} - Roboflow'dan gelen tahmin sonuçları
 */
async function detectObjectsFromFile(imagePath) {
    try {
        if (!fs.existsSync(imagePath)) {
            throw new Error(`Dosya bulunamadı: ${imagePath}`);
        }

        const imageBuffer = fs.readFileSync(imagePath);
        return await detectObjectsFromBuffer(imageBuffer, imagePath);

    } catch (error) {
        console.error('❌ Dosya okuma hatası:', error.message);
        throw error;
    }
}

module.exports = {
    detectObjectsFromUrl,
    detectObjectsFromBuffer,
    detectObjectsFromFile
};
