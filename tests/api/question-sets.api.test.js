// HTTP tests of the question bank lists: roles, paging and the allow-listed sort.
const { app, request, bearer } = require('../setup/helpers');
const { sequelize } = require('../../src/models');

afterAll(() => sequelize.close());

describe('GET /question-sets', () => {
  test('without a token answers 401', async () => {
    const res = await request(app).get('/api/v1/question-sets');
    expect(res.status).toBe(401);
  });

  test('a PLAYER is refused with 403 FORBIDDEN', async () => {
    const res = await request(app).get('/api/v1/question-sets').set('Authorization', await bearer('55555555'));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('a HOST gets the { data, meta } envelope', async () => {
    const res = await request(app).get('/api/v1/question-sets').set('Authorization', await bearer('12345678'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toEqual(expect.objectContaining({
      page: expect.any(Number),
      limit: expect.any(Number),
      total: expect.any(Number),
      pages: expect.any(Number),
    }));
  });

  test('limit=1 returns at most one row and says so in meta', async () => {
    const res = await request(app).get('/api/v1/question-sets?page=1&limit=1').set('Authorization', await bearer('12345678'));
    expect(res.status).toBe(200);
    expect(res.body.meta.limit).toBe(1);
    expect(res.body.data.length).toBeLessThanOrEqual(1);
  });

  test('sorting by a column that is not allowed answers 400', async () => {
    const res = await request(app).get('/api/v1/question-sets?sort=password_hash').set('Authorization', await bearer('12345678'));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toEqual(expect.any(String));
  });

  test('a search with no match is still 200 with an empty list', async () => {
    const res = await request(app).get('/api/v1/question-sets?q=zzzzzz-no-such-set').set('Authorization', await bearer('12345678'));
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });
});