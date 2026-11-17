const userRepository = require('../repositories/user.repository');
const { notFound, conflict } = require('../errors/app-error');

async function list() {
  return userRepository.findAll();
}

// An admin cannot change their own role.
async function changeRole(actorId, targetId, role) {
  if (Number(actorId) === Number(targetId)) {
    throw conflict(
      'CANNOT_CHANGE_OWN_ROLE',
      'An admin cannot change their own role.'
    );
  }

  const user = await userRepository.findById(targetId);

  if (!user) {
    throw notFound('USER_NOT_FOUND', 'No user has this id.');
  }

  return userRepository.update(user, { role });
}

module.exports = { list, changeRole };