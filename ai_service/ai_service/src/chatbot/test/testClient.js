'use strict';

/**
 * Manual integration test client for the NutriCoach Chatbot Service.
 * Run: node test/testClient.js
 *
 * The chatbot service must be running on PORT 3001.
 *
 * Covers: TC-24, TC-25, TC-26, TC-27 (Test Plan Report – Feature 7)
 * Plus supporting tests: health check, session management, scope restriction,
 * streaming, and input validation.
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';
const TEST_USER_ID = 'test-user-001';

// ─── Result tracking ────────────────────────────────────────────────────────
const results = [];

function pass(id, description) {
  results.push({ id, description, status: 'PASS' });
  console.log(`   ✓ ${id} PASS`);
}

function fail(id, description, reason) {
  results.push({ id, description, status: 'FAIL', reason });
  console.log(`   ✗ ${id} FAIL – ${reason}`);
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
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
              if (parsed.done) console.log('\n   [Stream done]');
              if (parsed.error) console.log('\n   [Stream error]', parsed.error);
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

// ─── Test runner ──────────────────────────────────────────────────────────────
async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  NutriCoach Chatbot – Integration Test (TC-24 ~ TC-27)');
  console.log('═══════════════════════════════════════════════════════\n');

  // ── Health check ────────────────────────────────────────────────────────────
  console.log('[SETUP] Health check...');
  const health = await request('GET', '/health');
  if (health.status !== 200) {
    console.error('   Service is not running. Aborting.');
    process.exit(1);
  }
  console.log(`   Status: ${health.status} | ${JSON.stringify(health.body)}\n`);

  // ── Session setup ────────────────────────────────────────────────────────────
  console.log('[SETUP] Create new session...');
  const newSession = await request('POST', '/api/chat/new');
  const chatId = newSession.body.chatId;
  console.log(`   chatId: ${chatId}\n`);

  // ── TC-24: Basic NutriCoach chatbot response ─────────────────────────────────
  console.log('TC-24 – Verify basic NutriCoach chatbot response...');
  const tc24 = await request('POST', '/api/chat', {
    userId: TEST_USER_ID,
    chatId,
    message: 'What should I eat to increase my protein intake?',
  });
  console.log(`   Status: ${tc24.status}`);
  if (tc24.status === 200 && typeof tc24.body.response === 'string' && tc24.body.response.length > 0) {
    console.log(`   Response: ${tc24.body.response.slice(0, 200)}...`);
    pass('TC-24', 'Basic chatbot nutrition response');
  } else {
    console.log(`   Response: ${JSON.stringify(tc24.body).slice(0, 200)}`);
    fail('TC-24', 'Basic chatbot nutrition response', `status=${tc24.status}, no valid response`);
  }
  console.log();

  // ── TC-25: Chat session history persistence ──────────────────────────────────
  console.log('TC-25 – Verify chat session history persistence...');

  // Send 2 more messages so we have 3 total in this session (TC-24 sent the first)
  await request('POST', '/api/chat', {
    userId: TEST_USER_ID,
    chatId,
    message: 'How much water should I drink per day?',
  });
  await request('POST', '/api/chat', {
    userId: TEST_USER_ID,
    chatId,
    message: 'What are healthy snacks under 200 calories?',
  });

  const histRes = await request('GET', `/api/chat/history/${chatId}`);
  console.log(`   Status: ${histRes.status}`);
  console.log(`   History entries: ${histRes.body.history?.length}`);

  if (histRes.status === 200 && Array.isArray(histRes.body.history) && histRes.body.history.length >= 3) {
    pass('TC-25', 'Chat session history persistence');
  } else {
    fail('TC-25', 'Chat session history persistence',
      `expected ≥3 entries, got ${histRes.body.history?.length ?? 'undefined'}`);
  }
  console.log();

  // ── TC-26: Personal data anonymization ──────────────────────────────────────
  console.log('TC-26 – Verify personal data anonymization in chat...');

  // Use a fresh session so history check is isolated
  const anonSession = await request('POST', '/api/chat/new');
  const anonChatId = anonSession.body.chatId;

  const sensitiveMessage = 'My phone is 555-123-4567 and email is user@test.com, help me diet.';
  await request('POST', '/api/chat', {
    userId: TEST_USER_ID,
    chatId: anonChatId,
    message: sensitiveMessage,
  });

  const anonHist = await request('GET', `/api/chat/history/${anonChatId}`);
  const storedMessages = anonHist.body.history ?? [];
  const userEntry = storedMessages.find(
    (e) => e.role === 'user' || e.type === 'user' || e.sender === 'user'
  );
  const storedText = userEntry?.content ?? userEntry?.message ?? userEntry?.text ?? '';

  console.log(`   Stored message: "${storedText.slice(0, 120)}"`);

  const phoneLeaked = /555-123-4567/.test(storedText);
  const emailLeaked = /user@test\.com/.test(storedText);

  if (!phoneLeaked && !emailLeaked) {
    pass('TC-26', 'Personal data anonymization – phone and email masked');
  } else {
    fail('TC-26', 'Personal data anonymization',
      `leaked: ${phoneLeaked ? 'phone ' : ''}${emailLeaked ? 'email' : ''}`);
  }
  console.log();

  // ── TC-27: Multilingual interaction (Turkish) ────────────────────────────────
  console.log('TC-27 – Verify multilingual chatbot response (Turkish)...');
  const tc27 = await request('POST', '/api/chat', {
    userId: TEST_USER_ID,
    chatId,
    message: 'Günlük kalori ihtiyacım ne kadar olmalı?',
  });
  console.log(`   Status: ${tc27.status}`);
  if (tc27.status === 200 && typeof tc27.body.response === 'string' && tc27.body.response.length > 0) {
    console.log(`   Response: ${tc27.body.response.slice(0, 200)}...`);
    pass('TC-27', 'Multilingual response (Turkish)');
  } else {
    console.log(`   Response: ${JSON.stringify(tc27.body).slice(0, 200)}`);
    fail('TC-27', 'Multilingual response (Turkish)', `status=${tc27.status}, no valid response`);
  }
  console.log();

  // ── TC-E05: Scope restriction (out-of-scope question) ───────────────────────
  console.log('TC-E05 – Verify chatbot scope restriction (coding topic)...');
  const scopeRes = await request('POST', '/api/chat', {
    userId: TEST_USER_ID,
    chatId,
    message: 'Write me a Python program to sort a list.',
  });
  console.log(`   Status: ${scopeRes.status}`);
  console.log(`   Response: ${scopeRes.body.response?.slice(0, 200) ?? JSON.stringify(scopeRes.body)}`);
  if (scopeRes.status === 200 && typeof scopeRes.body.response === 'string') {
    // Expect the response to NOT contain code and to redirect to nutrition
    const hasCode = /def |import |print\(|\.sort\(/.test(scopeRes.body.response);
    if (!hasCode) {
      pass('TC-E05', 'Scope restriction – no Python code returned');
    } else {
      fail('TC-E05', 'Scope restriction', 'response contained code snippets');
    }
  } else {
    fail('TC-E05', 'Scope restriction', `status=${scopeRes.status}`);
  }
  console.log();

  // ── Streaming chat ────────────────────────────────────────────────────────────
  console.log('[EXTRA] Streaming chat – high-protein meal plan...');
  process.stdout.write('   Stream: ');
  await requestSSE('/api/chat/stream', {
    userId: TEST_USER_ID,
    chatId,
    message: 'Give me a high-protein meal plan for one day.',
  });
  console.log();

  // ── Input validation – empty message ─────────────────────────────────────────
  console.log('[EXTRA] Validation – empty message...');
  const emptyRes = await request('POST', '/api/chat', {
    userId: TEST_USER_ID,
    chatId,
    message: '',
  });
  console.log(`   Status: ${emptyRes.status} | ${JSON.stringify(emptyRes.body)}\n`);

  // ── Session cleanup ──────────────────────────────────────────────────────────
  console.log('[TEARDOWN] Delete sessions...');
  const del1 = await request('DELETE', `/api/chat/${chatId}`);
  const del2 = await request('DELETE', `/api/chat/${anonChatId}`);
  console.log(`   Session 1: ${del1.status} | Session 2: ${del2.status}\n`);

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Test Summary');
  console.log('═══════════════════════════════════════════════════════');
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✓' : '✗';
    const detail = r.reason ? ` (${r.reason})` : '';
    console.log(`  ${icon} ${r.id.padEnd(8)} ${r.status.padEnd(5)} – ${r.description}${detail}`);
  }
  console.log('───────────────────────────────────────────────────────');
  console.log(`  ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Test runner error:', err.message);
  process.exit(1);
});
