const { matchedData } = require('express-validator');
const authService = require('../services/auth.service');

// Send only safe fields. Never send password_hash.
function toJson(user) {
  return {
    user_id: user.user_id,
    school_id: user.school_id,
    username: user.username,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
  };
}

async function register(req, res) {
  const data = matchedData(req);
  const user = await authService.register(data);
  return res.status(201).json({ user: toJson(user) });
}

async function login(req, res) {
  const data = matchedData(req);
  const result = await authService.login(data);

  return res.status(200).json({
    token: result.token,
    token_type: result.token_type,
    expires_in: result.expires_in,
    user: toJson(result.user),
  });
}

async function me(req, res) {
  return res.status(200).json({ user: toJson(req.account) });
}

module.exports = {
  register,
  login,
  me,
};