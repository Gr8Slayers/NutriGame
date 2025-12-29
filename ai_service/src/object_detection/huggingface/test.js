import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

const BASE_URL = 'http://localhost:3002';

console.log('🧪 Testing Food Detection Service...\n');

// Test 1: Health Check
async function testHealth() {
  console.log('📊 Health Check...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Status:', response.data.status);
    console.log('   Space URL:', response.data.inference_url);
    return true;
  } catch (error) {
    console.log('⚠️  Service not ready:', error.message);
    console.log('   Note: Space might still be building (check HuggingFace)');
    return false;
  }
}

// Test 2: Detect from URL
async function testDetectURL() {
  console.log('\n🌐 Testing URL Detection...');
  try {
    const response = await axios.post(`${BASE_URL}/detect-url`, {
      image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
      confidence_threshold: 0.5
    });
    console.log('✅ Detection successful!');
    console.log('   Results:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log('⚠️  Detection failed:', error.message);
    if (error.response?.data) {
      console.log('   Error details:', error.response.data);
    }
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Food Detection Service Tests\n');
  console.log('=' .repeat(50));
  
  const healthOk = await testHealth();
  
  if (healthOk) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testDetectURL();
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('\n💡 Tips:');
  console.log('   • Check Space status: https://huggingface.co/spaces/nceyda/food-detection-rtdetr');
  console.log('   • First request may take 30-60s (cold start)');
  console.log('   • Space URL will be live in 2-5 minutes after push');
}

runTests();
