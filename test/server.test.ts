import test from 'node:test';
import assert from 'node:assert/strict';
import {
  retrieveRelevantMemories,
  formatConversationHistory,
  formatDocumentAttachment,
  TOOLS_DISCLOSURE,
} from '../src/utils/engine.js';

const BASE_URL = 'http://localhost:3000';

test('Nexus AI API Health & Tools Disclosure', async () => {
  const res = await fetch(`${BASE_URL}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ok');
  assert.equal(data.geminiConfigured, true);
  assert.ok(Array.isArray(data.availableModels));
  assert.ok(data.availableModels.length >= 3);
  assert.ok(data.availableModels.some((m: any) => m.id === 'gemini-3.8-flash'));

  // Verify explicit disclosure of tools
  assert.ok(Array.isArray(data.toolsDisclosure));
  assert.ok(data.toolsDisclosure.length >= 5);

  const activeTools = data.toolsDisclosure.filter((t: any) => t.status === 'active' || t.status === 'configured');
  const unavailableTools = data.toolsDisclosure.filter((t: any) => t.status === 'unavailable');

  assert.ok(activeTools.some((t: any) => t.name === 'Google Search Grounding'));
  assert.ok(activeTools.some((t: any) => t.name.includes('Multimodal Document')));
  assert.ok(unavailableTools.some((t: any) => t.name.includes('Code Execution')));
  assert.ok(unavailableTools.some((t: any) => t.name.includes('Third-Party Private Account')));
});

test('Nexus AI Conversation Lifecycle', async () => {
  // 1. Create conversation
  const createRes = await fetch(`${BASE_URL}/api/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Automated Test Chat',
      model: 'gemini-3.8-flash',
      webSearchEnabled: true,
    }),
  });
  assert.equal(createRes.status, 201);
  const conv = await createRes.json();
  assert.ok(conv.id);
  assert.equal(conv.title, 'Automated Test Chat');

  // 2. Fetch specific conversation
  const getRes = await fetch(`${BASE_URL}/api/conversations/${conv.id}`);
  assert.equal(getRes.status, 200);
  const fetched = await getRes.json();
  assert.equal(fetched.id, conv.id);
  assert.equal(fetched.messages.length, 0);

  // 3. Post a message to conversation
  const msgRes = await fetch(`${BASE_URL}/api/conversations/${conv.id}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        id: 'msg-test-1',
        role: 'user',
        content: 'Explain binary search in TypeScript.',
        timestamp: Date.now(),
      },
    }),
  });
  assert.equal(msgRes.status, 201);

  // 4. Update conversation title
  const patchRes = await fetch(`${BASE_URL}/api/conversations/${conv.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Renamed Test Chat' }),
  });
  assert.equal(patchRes.status, 200);
  const patched = await patchRes.json();
  assert.equal(patched.title, 'Renamed Test Chat');

  // 5. Delete conversation
  const deleteRes = await fetch(`${BASE_URL}/api/conversations/${conv.id}`, {
    method: 'DELETE',
  });
  assert.equal(deleteRes.status, 200);
});

test('Nexus AI User Memory Management & Contextual Retrieval', async () => {
  // 1. Create a memory
  const addRes = await fetch(`${BASE_URL}/api/memories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fact: 'User prefers Python for data engineering and TypeScript for web development.',
      category: 'preference',
    }),
  });
  assert.equal(addRes.status, 201);
  const memory = await addRes.json();
  assert.ok(memory.id);
  assert.equal(memory.category, 'preference');

  // 2. Test retrieveRelevantMemories scoring
  const testMemories = [
    { id: '1', fact: 'User prefers Python for data tasks', category: 'preference' },
    { id: '2', fact: 'User lives in Tokyo', category: 'personal' },
    { id: '3', fact: 'User works on React frontend apps', category: 'work' },
  ];

  const pythonMatches = retrieveRelevantMemories('How do I build a data pipeline with python pandas?', testMemories);
  assert.ok(pythonMatches.length > 0);
  assert.equal(pythonMatches[0].id, '1');

  const reactMatches = retrieveRelevantMemories('Help me debug this React component hook', testMemories);
  assert.ok(reactMatches.some((m) => m.id === '3'));

  // 3. Delete memory
  const delRes = await fetch(`${BASE_URL}/api/memories/${memory.id}`, {
    method: 'DELETE',
  });
  assert.equal(delRes.status, 200);
});

test('Nexus AI Conversation-History Sanitization', () => {
  const rawHistory: any[] = [
    { role: 'user', content: 'Turn 1' },
    { role: 'user', content: 'Turn 1 continuation' }, // Consecutive user turns
    { role: 'assistant', content: 'Response 1' },
    { role: 'user', content: '' }, // Empty turn
    { role: 'assistant', content: 'Response 2' },
  ];

  const formatted = formatConversationHistory(rawHistory, 10);
  assert.ok(Array.isArray(formatted));
  assert.ok(formatted.length > 0);

  // Consecutive user turns must be merged into one turn with multiple parts
  assert.equal(formatted[0].role, 'user');
  assert.equal(formatted[0].parts.length, 2);
  assert.equal(formatted[0].parts[0].text, 'Turn 1');
  assert.equal(formatted[0].parts[1].text, 'Turn 1 continuation');

  // Next turn is model
  assert.equal(formatted[1].role, 'model');
});

test('Nexus AI Document Context Formatting', () => {
  const sampleDoc = {
    name: 'rate_limiter.ts',
    size: 2048,
    type: 'text/typescript',
    textContent: 'export class RateLimiter { check() { return true; } }',
  };

  const formatted = formatDocumentAttachment(sampleDoc);
  assert.ok(formatted.includes('ATTACHED DOCUMENT CONTEXT'));
  assert.ok(formatted.includes('rate_limiter.ts'));
  assert.ok(formatted.includes('export class RateLimiter'));
  assert.ok(formatted.includes('Document Answering Directives'));
});

test('Nexus AI Settings & Data Export', async () => {
  // 1. Get settings
  const settingsRes = await fetch(`${BASE_URL}/api/settings`);
  assert.equal(settingsRes.status, 200);
  const settings = await settingsRes.json();
  assert.ok('theme' in settings);
  assert.ok('enableMemory' in settings);

  // 2. Export data
  const exportRes = await fetch(`${BASE_URL}/api/data/export`, { method: 'POST' });
  assert.equal(exportRes.status, 200);
  const exportData = await exportRes.json();
  assert.equal(exportData.version, '1.0');
  assert.ok(exportData.data);
});

test('Nexus AI Multi-User Isolation & Security', async () => {
  const userA = 'test-user-alice-123';
  const userB = 'test-user-bob-456';

  // 1. User Alice creates a private conversation
  const createAliceRes = await fetch(`${BASE_URL}/api/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userA,
    },
    body: JSON.stringify({ title: 'Alice Confidential Strategy' }),
  });
  assert.equal(createAliceRes.status, 201);
  const aliceConv = await createAliceRes.json();

  // 2. User Bob requests his conversation list
  const bobListRes = await fetch(`${BASE_URL}/api/conversations`, {
    headers: { 'x-user-id': userB },
  });
  assert.equal(bobListRes.status, 200);
  const bobList = await bobListRes.json();
  // Bob must not see Alice's conversation
  assert.ok(!bobList.some((c: any) => c.id === aliceConv.id));

  // 3. User Bob attempts to directly fetch Alice's conversation by ID
  const bobAccessAliceRes = await fetch(`${BASE_URL}/api/conversations/${aliceConv.id}`, {
    headers: { 'x-user-id': userB },
  });
  assert.equal(bobAccessAliceRes.status, 404);

  // 4. Clean up Alice's conversation
  await fetch(`${BASE_URL}/api/conversations/${aliceConv.id}`, {
    method: 'DELETE',
    headers: { 'x-user-id': userA },
  });
});

test('Nexus AI Upload & Attachment Security Validation', async () => {
  // Create test conversation
  const convRes = await fetch(`${BASE_URL}/api/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Upload Security Test' }),
  });
  assert.equal(convRes.status, 201);
  const conv = await convRes.json();

  // 1. Rejection of invalid mime type
  const badMimeRes = await fetch(`${BASE_URL}/api/conversations/${conv.id}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        id: 'msg-bad-1',
        role: 'user',
        content: 'Check this attachment',
        timestamp: Date.now(),
        attachments: [
          {
            name: 'malicious.exe',
            size: 500,
            type: 'application/x-msdownload',
            inlineData: {
              mimeType: 'application/x-msdownload',
              data: 'dGVzdA==',
            },
          },
        ],
      },
    }),
  });
  assert.equal(badMimeRes.status, 400);
  const badData = await badMimeRes.json();
  assert.ok(badData.error.includes('not permitted'));

  // 2. Rejection of oversized file (>10MB)
  const oversizedRes = await fetch(`${BASE_URL}/api/conversations/${conv.id}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        id: 'msg-bad-2',
        role: 'user',
        content: 'Check this huge attachment',
        timestamp: Date.now(),
        attachments: [
          {
            name: 'giant.png',
            size: 15 * 1024 * 1024, // 15MB
            type: 'image/png',
          },
        ],
      },
    }),
  });
  assert.equal(oversizedRes.status, 400);
  const overData = await oversizedRes.json();
  assert.ok(overData.error.includes('10MB limit'));

  // Clean up
  await fetch(`${BASE_URL}/api/conversations/${conv.id}`, { method: 'DELETE' });
});
