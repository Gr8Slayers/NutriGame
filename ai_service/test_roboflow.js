/**
 * Roboflow Service Test
 * roboflowService.js dosyasını test eder
 */

const { detectObjectsFromFile, detectObjectsFromUrl } = require('./roboflowService');

// Test edilecek resim
const TEST_IMAGE_PATH = 'D:\\Datalarım\\Desktop\\Bitirme\\NutriGame\\ai_service\\mock_data\\banana.jpg';

async function testDetection() {
    console.log('='.repeat(50));
    console.log('ROBOFLOW SERVICE TEST');
    console.log('='.repeat(50));

    try {
        console.log('\n📸 Test resmi:', TEST_IMAGE_PATH);
        console.log('\nRoboflow\'a gönderiliyor...\n');

        // Yerel dosyadan analiz
        const result = await detectObjectsFromFile(TEST_IMAGE_PATH);

        console.log('\n' + '='.repeat(50));
        console.log('SONUÇLAR');
        console.log('='.repeat(50));
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('\n❌ Test başarısız:', error.message);
        process.exit(1);
    }
}

// Testi çalıştır
testDetection();
