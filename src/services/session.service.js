const sessionRepository = require('../repositories/session.repository');
const questionSetRepository = require('../repositories/question-set.repository');
const { notFound, forbidden, conflict } = require('../errors/app-error');
const { constraintOf } = require('../errors/db-errors');

// Rule: which status may follow which.
const NEXT_STATUS = {
  LOBBY: ['RUNNING', 'CLOSED'],
  RUNNING: ['CLOSED'],
  CLOSED: [],
};

// Six digits. 100000 to 999999 never starts with 0.
function randomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function findOrFail(code) {
  const session = await sessionRepository.findByCode(code);
  if (!session) {
    throw notFound('SESSION_NOT_FOUND', `No game has the code ${code}.`);
  }
  return session;
}

// Rule: the server makes the code. A client never chooses it.
async function create(setId, user) {
  const questionSet = await questionSetRepository.findById(setId);
  if (!questionSet) {
    throw notFound('QUESTION_SET_NOT_FOUND', `No question set has the id ${setId}.`);
  }
  if (questionSet.user_id !== user.user_id && user.role !== 'ADMIN') {
    throw forbidden('This question set belongs to another host.');
  }

  // A random code can already be in use. The UNIQUE rule on join_code tells us, and we try again.
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      return await sessionRepository.create({
        set_id: questionSet.set_id,
        user_id: user.user_id,
        join_code: randomCode(),
        status: 'LOBBY',
      });
    } catch (error) {
      if (constraintOf(error) !== 'game_sessions_join_code_key') throw error;
    }
  }
  throw new Error('Could not find a free join code after 5 attempts.');
}

// Rule: only the host of the game (or an admin) changes its status, and only to an allowed next status.
async function changeStatus(code, status, user) {
  const session = await findOrFail(code);
  if (session.user_id !== user.user_id && user.role !== 'ADMIN') {
    throw forbidden('This game belongs to another host.');
  }
  const allowed = NEXT_STATUS[session.status] || [];
  if (!allowed.includes(status)) {
    throw conflict('INVALID_STATUS_CHANGE', `A ${session.status} game cannot become ${status}.`);
  }
  return sessionRepository.update(session, { status });
}

module.exports = { findOrFail, create, changeStatus };