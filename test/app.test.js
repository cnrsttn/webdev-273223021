const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { createApp } = require('../src/app');
const dbAccess = require('../src/db');
const services = require('../src/services');

const TEST_DB = path.join(__dirname, '../test_database.sqlite');

test('Slice 1 Tests', async (t) => {
  if (fs.existsSync(TEST_DB)) {
    fs.unlinkSync(TEST_DB);
  }
  process.env.DB_FILE = TEST_DB;

  await dbAccess.initDb();
  const app = createApp();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  t.after(async () => {
    server.close();
    await dbAccess.closeDb();
    if (fs.existsSync(TEST_DB)) {
      fs.unlinkSync(TEST_DB);
    }
  });

  await t.test('AC-1: A student registers with email and password, and the account is saved in the database', async () => {
    const res = await fetch(`${baseUrl}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@example.com', password: 'password123', name: 'Alice' })
    });
    assert.strictEqual(res.status, 201);
    const user = await res.json();
    assert.strictEqual(user.email, 'alice@example.com');
    assert.strictEqual(user.name, 'Alice');

    const dbUser = await dbAccess.getUserByEmail('alice@example.com');
    assert.notStrictEqual(dbUser, null);
    assert.strictEqual(dbUser.email, 'alice@example.com');
  });

  await t.test('AC-2: A student signs in with correct credentials', async () => {
    const res = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@example.com', password: 'password123' })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.email, 'alice@example.com');
  });

  await t.test('AC-10: A visitor who opens /groups without signing in is redirected to /login', async () => {
    const res = await fetch(`${baseUrl}/groups`, {
      redirect: 'manual'
    });
    assert.strictEqual(res.status, 302);
    assert.ok(res.headers.get('location').includes('/login'));
  });

  await t.test('AC-11: After signing in, a student sees three study groups loaded from the database', async () => {
    const loginRes = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@example.com', password: 'password123' })
    });
    const cookie = loginRes.headers.get('set-cookie');

    const groupsRes = await fetch(`${baseUrl}/api/groups`, {
      headers: { Cookie: cookie }
    });
    assert.strictEqual(groupsRes.status, 200);
    const groups = await groupsRes.json();
    assert.strictEqual(groups.length, 3);
  });

  await t.test('AC-12: Deleting a group from the database and reloading groups removes that group', async () => {
    const groupsBefore = await dbAccess.getAllGroups();
    assert.ok(groupsBefore.length > 0);
    const groupToDelete = groupsBefore[0];

    await dbAccess.deleteGroup(groupToDelete.id);

    const loginRes = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@example.com', password: 'password123' })
    });
    const cookie = loginRes.headers.get('set-cookie');

    const groupsRes = await fetch(`${baseUrl}/api/groups`, {
      headers: { Cookie: cookie }
    });
    const groupsAfter = await groupsRes.json();
    assert.strictEqual(groupsAfter.length, groupsBefore.length - 1);
    assert.strictEqual(groupsAfter.some(g => g.id === groupToDelete.id), false);
  });

  await t.test('Service layer unit test coverage (register, authenticate, hash, verify, addNewGroup)', async () => {
    await assert.rejects(async () => {
      await services.registerUser('alice@example.com', 'pwd', 'Alice2');
    }, /Email is already registered/);

    await assert.rejects(async () => {
      await services.registerUser('', 'pwd', 'Name');
    }, /Email, password, and name are required/);

    await assert.rejects(async () => {
      await services.authenticateUser('alice@example.com', 'wrongpassword');
    }, /Invalid email or password/);

    await assert.rejects(async () => {
      await services.authenticateUser('', '');
    }, /Email and password are required/);

    await assert.rejects(async () => {
      await services.authenticateUser('nonexistent@example.com', 'pwd');
    }, /Invalid email or password/);

    await assert.rejects(async () => {
      await services.addNewGroup('', '', '', 1);
    }, /Name, subject, and description are required/);

    assert.strictEqual(services.verifyPassword('pwd', null), false);
    assert.strictEqual(services.verifyPassword('pwd', 'invalidhashwithoutcolon'), false);

    const newG = await services.addNewGroup('Physics Club', 'Physics', 'Quantum mechanics', 1);
    assert.ok(newG.id);
  });
});
