// UNIT tests for the login rules. The repository and the password/token helpers
// are replaced with jest.mock, so no database and no bcrypt time is needed.
jest.mock('../../src/repositories/user.repository', () => ({
  findForLogin: jest.fn(),
  findBySchoolId: jest.fn(),
  findByUsername: jest.fn(),
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../../src/security/password', () => ({ hash: jest.fn(), matches: jest.fn() }));
jest.mock('../../src/security/token', () => ({ issue: jest.fn() }));

const jwt = require('jsonwebtoken');
const userRepository = require('../../src/repositories/user.repository');
const password = require('../../src/security/password');
const token = require('../../src/security/token');
const authService = require('../../src/services/auth.service');

beforeEach(() => jest.resetAllMocks());

async function failureOf(promise) {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('the login was expected to fail');
}

describe('login', () => {
  test('a wrong password throws 401 INVALID_CREDENTIALS', async () => {
    userRepository.findForLogin.mockResolvedValue({ user_id: 1, password_hash: 'hash' });
    password.matches.mockResolvedValue(false);

    const error = await failureOf(authService.login({ school_id: '2024-0001', password: 'wrong' }));
    expect(error).toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
  });

  test('an unknown school ID throws the SAME error as a wrong password', async () => {
    userRepository.findForLogin.mockResolvedValue({ user_id: 1, password_hash: 'hash' });
    password.matches.mockResolvedValue(false);
    const wrongPassword = await failureOf(authService.login({ school_id: '2024-0001', password: 'wrong' }));

    userRepository.findForLogin.mockResolvedValue(null);
    const unknownId = await failureOf(authService.login({ school_id: '0000-0000', password: 'wrong' }));

    expect(unknownId.status).toBe(wrongPassword.status);
    expect(unknownId.code).toBe(wrongPassword.code);
    expect(unknownId.message).toBe(wrongPassword.message);
  });

  test('an unknown school ID still compares against a dummy hash (null is passed on)', async () => {
    userRepository.findForLogin.mockResolvedValue(null);
    password.matches.mockResolvedValue(false);

    await failureOf(authService.login({ school_id: '0000-0000', password: 'wrong' }));
    expect(password.matches).toHaveBeenCalledWith('wrong', null);
    expect(token.issue).not.toHaveBeenCalled();
  });

  test('a correct password returns a Bearer token and its lifetime', async () => {
    const user = { user_id: 1, password_hash: 'hash' };
    userRepository.findForLogin.mockResolvedValue(user);
    password.matches.mockResolvedValue(true);
    token.issue.mockReturnValue(jwt.sign({ sub: 1 }, 'test-secret', { expiresIn: '1h' }));

    const result = await authService.login({ school_id: '2024-0001', password: 'right' });
    expect(result.token_type).toBe('Bearer');
    expect(result.expires_in).toBe(3600);
    expect(result.user).toBe(user);
  });
});