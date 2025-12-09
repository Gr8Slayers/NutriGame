/**
 * Test client for Mental Health Chatbot API
 */

import axios from 'axios';

const BASE_URL = process.env.API_URL || 'http://localhost:8001';

class ChatbotClient {
  constructor(baseUrl = BASE_URL) {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async chat({
    message,
    maskPersonalData = true,
    includeHistory = false,
    maxNewTokens = 512,
    temperature = 0.7,
    topP = 0.9
  }) {
    try {
      const response = await this.client.post('/chat', {
        message,
        maskPersonalData,
        includeHistory,
        maxNewTokens,
        temperature,
        topP
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  }

  async clearHistory() {
    const response = await this.client.post('/clear-history');
    return response.data;
  }

  async getHistory() {
    const response = await this.client.get('/history');
    return response.data;
  }

  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }
}

// Test functions
async function testBasicChat() {
  console.log('='.repeat(60));
  console.log('TEST 1: Basic Chat');
  console.log('='.repeat(60));

  const client = new ChatbotClient();

  // Health check
  console.log('\n1. Health Check:');
  const health = await client.healthCheck();
  console.log(JSON.stringify(health, null, 2));

  // Simple chat
  console.log('\n2. Simple Chat (without personal data):');
  const response = await client.chat({
    message: "I'm feeling stressed about work lately. What can I do?",
    maskPersonalData: true
  });
  console.log(JSON.stringify(response, null, 2));

  console.log('\n' + '='.repeat(60) + '\n');
}

async function testPersonalDataMasking() {
  console.log('='.repeat(60));
  console.log('TEST 2: Personal Data Masking');
  console.log('='.repeat(60));

  const client = new ChatbotClient();

  // Message with personal data
  const messageWithData = 
    "Hi, my name is John and my email is john.doe@example.com. " +
    "I'm feeling anxious. You can reach me at +90 555 123 4567.";

  console.log('\nOriginal Message:');
  console.log(messageWithData);

  console.log('\nChatbot Response:');
  const response = await client.chat({
    message: messageWithData,
    maskPersonalData: true
  });
  console.log(JSON.stringify(response, null, 2));

  console.log('\n' + '='.repeat(60) + '\n');
}

async function testConversationHistory() {
  console.log('='.repeat(60));
  console.log('TEST 3: Conversation with History');
  console.log('='.repeat(60));

  const client = new ChatbotClient();

  // Clear history first
  console.log('\n1. Clearing history...');
  await client.clearHistory();

  // First message
  console.log('\n2. First message:');
  const response1 = await client.chat({
    message: "I'm having trouble sleeping at night",
    includeHistory: true
  });
  console.log(`User: I'm having trouble sleeping at night`);
  console.log(`Bot: ${response1.response?.substring(0, 100) || 'Error'}...`);

  // Second message (with history)
  console.log('\n3. Second message (with context):');
  const response2 = await client.chat({
    message: "What else can help besides the previous suggestions?",
    includeHistory: true
  });
  console.log(`User: What else can help besides the previous suggestions?`);
  console.log(`Bot: ${response2.response?.substring(0, 100) || 'Error'}...`);

  // Get history
  console.log('\n4. Conversation History:');
  const history = await client.getHistory();
  console.log(JSON.stringify(history, null, 2));

  console.log('\n' + '='.repeat(60) + '\n');
}

async function testDifferentParameters() {
  console.log('='.repeat(60));
  console.log('TEST 4: Different Parameters');
  console.log('='.repeat(60));

  const client = new ChatbotClient();
  const message = "How can I manage my anxiety?";

  // Low temperature (more focused)
  console.log('\n1. Low Temperature (0.3 - More Focused):');
  const response1 = await client.chat({
    message,
    temperature: 0.3,
    maxNewTokens: 200
  });
  console.log(response1.response?.substring(0, 150) || 'Error');

  // High temperature (more creative)
  console.log('\n2. High Temperature (0.9 - More Creative):');
  const response2 = await client.chat({
    message,
    temperature: 0.9,
    maxNewTokens: 200
  });
  console.log(response2.response?.substring(0, 150) || 'Error');

  console.log('\n' + '='.repeat(60) + '\n');
}

async function interactiveMode() {
  console.log('='.repeat(60));
  console.log('INTERACTIVE MODE - Mental Health Chatbot');
  console.log('='.repeat(60));
  console.log('\nKomutlar:');
  console.log("  - 'quit' veya 'exit': Çıkış");
  console.log("  - 'clear': Geçmişi temizle");
  console.log("  - 'history': Geçmişi görüntüle");
  console.log('='.repeat(60) + '\n');

  const client = new ChatbotClient();
  const readline = await import('readline');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
  };

  while (true) {
    try {
      const userInput = await question('You: ');
      
      if (!userInput || userInput.trim() === '') {
        continue;
      }

      const input = userInput.trim();

      if (input.toLowerCase() === 'quit' || input.toLowerCase() === 'exit') {
        console.log('\nGüle güle!');
        rl.close();
        break;
      }

      if (input.toLowerCase() === 'clear') {
        await client.clearHistory();
        console.log('✓ Konuşma geçmişi temizlendi\n');
        continue;
      }

      if (input.toLowerCase() === 'history') {
        const history = await client.getHistory();
        console.log(JSON.stringify(history, null, 2));
        continue;
      }

      // Send message
      const response = await client.chat({
        message: input,
        includeHistory: true,
        maskPersonalData: true
      });

      if (response.error) {
        console.log(`\n❌ Error: ${response.error}\n`);
      } else {
        console.log(`\nBot: ${response.response}\n`);

        if (response.hasPersonalData) {
          console.log('⚠️  Kişisel veri tespit edildi ve maskelendi:');
          console.log(`   Entities: ${JSON.stringify(response.detectedEntities)}\n`);
        }
      }
    } catch (error) {
      if (error.code !== 'ERR_USE_AFTER_CLOSE') {
        console.log(`\n❌ Error: ${error.message}\n`);
      }
      break;
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('interactive')) {
    // Interactive mode
    await interactiveMode();
  } else {
    // Run all tests
    try {
      await testBasicChat();
      await testPersonalDataMasking();
      await testConversationHistory();
      await testDifferentParameters();

      console.log('\n' + '='.repeat(60));
      console.log('✓ Tüm testler tamamlandı!');
      console.log('='.repeat(60));
      console.log('\nInteractive mode için: node test/testClient.js interactive');
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('\n❌ Error: Sunucuya bağlanılamadı!');
        console.log('Lütfen önce sunucuyu başlatın: npm start');
      } else {
        console.log(`\n❌ Test hatası: ${error.message}`);
        console.error(error);
      }
    }
  }
}

main();
