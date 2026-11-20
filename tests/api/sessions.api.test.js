// HTTP tests of the session access rules: the guard runs BEFORE validation.
const { app, request, bearer } = require('../setup/helpers');
const { sequelize } = require('../../src/models');

afterAll(() => sequelize.close());

describe('POST /sessions', () => {
  test('without a token answers 401', async () => {
    const res = await request(app).post('/api/v1/sessions').send({ set_id: 1 });
    expect(res.status).toBe(401);
  });

  test('a PLAYER may not start a game: 403', async () => {
    const res = await request(app).post('/api/v1/sessions').set('Authorization', await bearer('55555555')).send({ set_id: 1 });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('a HOST who sends no set_id gets 400', async () => {
    const res = await request(app).post('/api/v1/sessions').set('Authorization', await bearer('12345678')).send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /sessions/:code', () => {
  test('without a token answers 401', async () => {
    const res = await request(app).get('/api/v1/sessions/123456');
    expect(res.status).toBe(401);
  });

  test('a join code that is not six digits answers 400', async () => {
    const res = await request(app).get('/api/v1/sessions/abc').set('Authorization', await bearer('55555555'));
    expect(res.status).toBe(400);
  });

  test('a well-formed code that no game has answers 404 in the error format', async () => {
    const res = await request(app).get('/api/v1/sessions/999999').set('Authorization', await bearer('55555555'));
    expect(res.status).toBe(404);
    expect(res.body.error).toEqual({ code: expect.any(String), message: expect.any(String) });
  });
});