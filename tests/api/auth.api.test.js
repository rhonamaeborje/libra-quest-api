// HTTP tests of the accounts module: a real request goes through the whole app
// to the TEST database (<DB_NAME>_test), never to your own data.
const { app, request, bearer } = require('../setup/helpers');
const { sequelize } = require('../../src/models');

afterAll(() => sequelize.close());

// A school ID nobody has registered yet (8 digits, like the seeded accounts).
function newAccount() {
  const id = String(Math.floor(10000000 + Math.random() * 89999999));
  return {
    school_id: id,
    full_name: 'Test Player',
    email: `test.${id}@example.com`,
    password: 'Test-Pass-2026',
  };
}

describe('POST /auth/register', () => {
  test('creates a PLAYER even when the body asks for ADMIN, and never returns the hash', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...newAccount(), role: 'ADMIN' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('PLAYER');
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  test('a school ID that is already taken answers 409 SCHOOL_ID_TAKEN', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...newAccount(), school_id: '55555555' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('SCHOOL_ID_TAKEN');
  });

  test('a weak password answers 400 in the error format', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...newAccount(), password: 'abc' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({ code: expect.any(String), message: expect.any(String) });
  });
});

describe('POST /auth/login', () => {
  test('a wrong password answers 401 INVALID_CREDENTIALS', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ school_id: '55555555', password: 'Wrong-Pass-2026' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  test('an unknown school ID gets the same 401 body as a wrong password', async () => {
    const wrong = await request(app)
      .post('/api/v1/auth/login')
      .send({ school_id: '55555555', password: 'Wrong-Pass-2026' });
    const unknown = await request(app)
      .post('/api/v1/auth/login')
      .send({ school_id: '10000001', password: 'Wrong-Pass-2026' });
    expect(unknown.status).toBe(401);
    expect(unknown.body).toEqual(wrong.body);
  });

  test('a seeded player logs in and gets a Bearer token', async () => {
    const header = await bearer('55555555');
    expect(header).toMatch(/^Bearer eyJ/);
  });
});

describe('GET /auth/me', () => {
  test('answers 200 with the logged-in account and no hash', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', await bearer('55555555'));
    expect(res.status).toBe(200);
    expect(res.body.user.school_id).toBe('55555555');
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  test('without a token answers 401 AUTH_REQUIRED', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_REQUIRED');
  });

  test('a token with a changed signature answers 401 INVALID_TOKEN', async () => {
    const [scheme, token] = (await bearer('55555555')).split(' ');
    const [header, payload, signature] = token.split('.');
    const changed = `${signature[0] === 'A' ? 'B' : 'A'}${signature.slice(1)}`;
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `${scheme} ${header}.${payload}.${changed}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  test('the old X-Demo-User header no longer identifies anybody', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('X-Demo-User', '12345678');
    expect(res.status).toBe(401);
  });
});