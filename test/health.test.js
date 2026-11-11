const test = require('node:test');
const assert = require('node:assert/strict');

test('GET /health endpoint response', async () => {
  process.env.NODE_ENV = 'test';
  const app = require('../app');
  const db = require('../config/db');

  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
    assert.strictEqual(data.database, 'connected');
    assert.strictEqual(data.db_check.result, 2);
  } finally {
    server.close();
    await db.end();
  }
});
