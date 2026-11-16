const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const password = require('../security/password');
const token = require('../security/token');
const { unauthorized, conflict } = require('../errors/app-error');

// Make a new account. The role is ALWAYS PLAYER.
async function register({
  school_id,
  username,
  full_name,
  email,
  password: plainPassword,
}) {
  if (await userRepository.findBySchoolId(school_id)) {
    throw conflict('SCHOOL_ID_TAKEN', 'An account with this school ID already exists.');
  }

  if (await userRepository.findByUsername(username)) {
    throw conflict('USERNAME_TAKEN', 'This username is already used.');
  }

  if (await userRepository.findByEmail(email)) {
    throw conflict('EMAIL_TAKEN', 'An account with this email already exists.');
  }

  const password_hash = await password.hash(plainPassword);

  try {
    return await userRepository.create({
      school_id,
      username,
      full_name,
      email,
      password_hash,
      role: 'PLAYER',
    });
  } catch (error) {
    // Two requests at the same time can pass the checks above.
    // The database UNIQUE rule still catches the second one.
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw conflict(
        'ACCOUNT_EXISTS',
        'An account with this school ID, username or email already exists.'
      );
    }
    throw error;
  }
}

// A wrong password and an unknown school ID give the SAME error.
async function login({ school_id, password: plainPassword }) {
  const user = await userRepository.findForLogin(school_id);

  const ok = await password.matches(
    plainPassword,
    user ? user.password_hash : null
  );

  if (!ok) {
    throw unauthorized(
      'The school ID or password is incorrect.',
      'INVALID_CREDENTIALS'
    );
  }

  const signed = token.issue(user);
  const decoded = jwt.decode(signed);

  return {
    token: signed,
    token_type: 'Bearer',
    expires_in: decoded.exp - decoded.iat,
    user,
  };
}

async function me(userId) {
  return userRepository.findById(userId);
}

module.exports = {
  register,
  login,
  me,
};