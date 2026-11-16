const jwt = require('jsonwebtoken');

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is missing in .env');
  }
  return secret;
}

// Make a token for a user. Pass the user object.
function issue(user) {
  const payload = {
    sub: String(user.user_id),
    role: user.role,
  };

  return jwt.sign(payload, getSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });
}

// Check a token. Returns the payload, or throws an error.
function verify(value) {
  return jwt.verify(value, getSecret());
}

module.exports = { issue, verify };