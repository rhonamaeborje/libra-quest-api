// HTTP tests of the admin-only module: roles decide who may call.
const { app, request, bearer } = require('../setup/helpers');
const { sequelize } = require('../../src/models');

afterAll(() => sequelize.close());

describe('GET /users', () => {
  test('without a token answers 401', async () => {
    const res = await request(app).get('/api/v1/users');
    expect(res.status).toBe(401);
  });

  test('a PLAYER is refused with 403 FORBIDDEN', async () => {
    const res = await request(app).get('/api/v1/users').set('Authorization', await bearer('55555555'));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('a HOST is refused with 403 too', async () => {
    const res = await request(app).get('/api/v1/users').set('Authorization', await bearer('12345678'));
    expect(res.status).toBe(403);
  });

  test('the ADMIN may list the accounts', async () => {
    const res = await request(app).get('/api/v1/users').set('Authorization', await bearer('87654321'));
    expect(res.status).toBe(200);
  });
});

describe('PATCH /users/:id/role', () => {
  test('an admin who changes their own role gets 409', async () => {
    const auth = await bearer('87654321');
    const me = await request(app).get('/api/v1/auth/me').set('Authorization', auth);
    const res = await request(app)
      .patch(`/api/v1/users/${me.body.user.user_id}/role`)
      .set('Authorization', auth)
      .send({ role: 'HOST' });
    expect(res.status).toBe(409);
  });

  test('a PLAYER cannot change any role: 403', async () => {
    const res = await request(app)
      .patch('/api/v1/users/1/role')
      .set('Authorization', await bearer('55555555'))
      .send({ role: 'ADMIN' });
    expect(res.status).toBe(403);
  });
});