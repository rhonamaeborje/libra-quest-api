const { User } = require('../models');

function findBySchoolId(schoolId) {
  return User.findOne({
    where: { school_id: schoolId },
  });
}

function findByEmail(email) {
  return User.findOne({
    where: { email },
  });
}

function findByUsername(username) {
  return User.findOne({
    where: { username },
  });
}

// Used only during login.
function findForLogin(schoolId) {
  return User.scope('withPassword').findOne({
    where: { school_id: schoolId },
  });
}

function findById(userId) {
  return User.findByPk(userId);
}

function findAll() {
  return User.findAll({
    order: [['user_id', 'ASC']],
  });
}

function create(data) {
  return User.create(data);
}

function update(user, changes) {
  return user.update(changes);
}

module.exports = {
  findBySchoolId,
  findByEmail,
  findByUsername,
  findForLogin,
  findById,
  findAll,
  create,
  update,
};