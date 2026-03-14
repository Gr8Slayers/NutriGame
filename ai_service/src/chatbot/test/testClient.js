'use strict';

/**
 * Manual integration test client for the NutriCoach Chatbot Service.
 * Run: node test/testClient.js
 *
 * The chatbot service must be running on PORT 3001.
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';
const TEST_USER_ID = 'test-user-001';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function requestSSE(path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const payload = JSON.stringify(body);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const chunks = [];
    const req = http.request(options, (res) => {
      res.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              chunks.push(parsed);
              if (parsed.chunk) process.stdout.write(parsed.chunk);
              if (parsed.done) console.log('\n[Stream done]');
              if (parsed.error) console.error('\n[Stream error]', parsed.error);
            } catch { /* ignore malformed lines */ }
          }
        }
      });
      res.on('end', () => resolve(chunks));
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('═══════════════════════════════════════');
  console.log('  NutriCoach Chatbot – Integration Test');
  console.log('═══════════════════════════════════════\n');

  // 1. Health check
  console.log('1. Health check...');
  const health = await request('GET', '/health');
  console.log('   Status:', health.status, '|', JSON.stringify(health.body), '\n');

  // 2. Create new session
  console.log('2. Create new session...');
  const newSession = await request('POST', '/api/chat/new');
  const chatId = newSession.body.chatId;
  console.log('   chatId:', chatId, '\n');

  // 3. Regular chat
  console.log('3. Regular chat – nutrition question...');
  const chatRes = await request('POST', '/api/chat', {
    userId: TEST_USER_ID,
    chatId,
    message: 'What should I eat for breakfast if I want to lose weight?',
  });
  console.log('   Status:', chatRes.status);
  console.log('   Response:', chatRes.body.response?.slice(0, 200), '...\n');

  // 4. Get history
  console.log('4. Get chat history...');
  const histRes = await request('GET', `/api/chat/history/${chatId}`);
  console.log('   Status:', histRes.status);
  console.log('   History entries:', histRes.body.history?.length, '\n');

  // 5. Out-of-scope question (should be redirected)
  console.log('5. Out-of-scope question (coding topic)...');
  const scopeRes = await request('POST', '/api/chat', {
    userId: TEST_USER_ID,
    chatId,
    message: 'Can you write me a Python script to sort a list?',
  });
  console.log('   Status:', scopeRes.status);
  console.log('   Response:', scopeRes.body.response?.slice(0, 200), '...\n');

  // 6. Streaming chat
  console.log('6. Streaming chat...');
  process.stdout.write('   Stream: ');
  await requestSSE('/api/chat/stream', {
    userId: TEST_USER_ID,
    chatId,
    message: 'Give me a high-protein meal plan for one day.',
  });
  console.log();

  // 7. Validation – empty message
  console.log('7. Validation – empty message...');
  const emptyRes = await request('POST', '/api/chat', {
    userId: TEST_USER_ID,
    chatId,
    message: '',
  });
  console.log('   Status:', emptyRes.status, '|', JSON.stringify(emptyRes.body), '\n');

  // 8. Delete session
  console.log('8. Delete session...');
  const delRes = await request('DELETE', `/api/chat/${chatId}`);
  console.log('   Status:', delRes.status, '|', JSON.stringify(delRes.body), '\n');

  console.log('All tests completed.');
}

runTests().catch((err) => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
