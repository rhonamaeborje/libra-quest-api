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

// Rule: only the host of the game (or an admin) changes it.
// A body with current_position moves to the next question.
// A body with status changes the status.
async function changeStatus(code, body, user) {
  const session = await findOrFail(code);
  if (session.user_id !== user.user_id && user.role !== 'ADMIN') {
    throw forbidden('This game belongs to another host.');
  }

  if (body.current_position !== undefined) {
    return moveToQuestion(session, body.current_position);
  }

  const { status } = body;
  const allowed = NEXT_STATUS[session.status] || [];
  if (!allowed.includes(status)) {
    throw conflict('INVALID_STATUS_CHANGE', `A ${session.status} game cannot become ${status}.`);
  }

  const updates = { status };
  if (status === 'RUNNING') {
    const total = await sessionRepository.countQuestions(session.set_id);
    if (total === 0) {
      throw conflict('SET_HAS_NO_QUESTIONS', 'This question set has no questions yet.');
    }
    const now = new Date();
    updates.started_at = now;
    updates.current_position = 1;
    updates.question_started_at = now; // the server's clock times every answer
  }
  if (status === 'CLOSED') updates.ended_at = new Date();

  return sessionRepository.update(session, updates);
}

// Rule: only the NEXT question may be asked, and only while RUNNING.
async function moveToQuestion(session, position) {
  if (session.status !== 'RUNNING') {
    throw conflict('SESSION_NOT_RUNNING', 'The game is not running.');
  }
  const total = await sessionRepository.countQuestions(session.set_id);
  if (session.current_position >= total) {
    throw conflict('NO_MORE_QUESTIONS', 'This was the last question. Close the game.');
  }
  if (position !== session.current_position + 1) {
    throw conflict(
      'NOT_NEXT_QUESTION',
      `Only question ${session.current_position + 1} can come next.`
    );
  }
  return sessionRepository.update(session, {
    current_position: position,
    question_started_at: new Date(),
  });
}

module.exports = { findOrFail, create, changeStatus };