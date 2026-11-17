const { matchedData } = require('express-validator');
const userService = require('../services/user.service');

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

async function list(req, res) {
  const users = await userService.list();
  return res.status(200).json({ users: users.map(toJson) });
}

async function changeRole(req, res) {
  const { id, role } = matchedData(req);
  const user = await userService.changeRole(req.user.user_id, id, role);
  return res.status(200).json({ user: toJson(user) });
}

module.exports = { list, changeRole };