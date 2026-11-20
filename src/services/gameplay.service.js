const { UniqueConstraintError } = require('sequelize');
const sessionService = require('./session.service');
const sessionRepository = require('../repositories/session.repository');
const playerRepository = require('../repositories/player.repository');
const gameplayRepository = require('../repositories/gameplay.repository');
const { badRequest, forbidden, conflict, notFound } = require('../errors/app-error');

// Rule (pure, no database, no clock): correct and on time = 5 stars within
// 10 s, 3 stars within 20 s, 1 star later but inside the question's limit.
// Wrong or too late = 0.
function starsFor(question, isCorrect, elapsedMs) {
  if (!isCorrect) return 0;
  if (elapsedMs > question.time_limit_sec * 1000) return 0;
  if (elapsedMs <= 10000) return 5;
  if (elapsedMs <= 20000) return 3;
  return 1;
}

function isHostOf(session, user) {
  return session.user_id === user.user_id || user.role === 'ADMIN';
}

async function runningSession(code) {
  const session = await sessionService.findOrFail(code);
  if (session.status !== 'RUNNING') {
    throw conflict('SESSION_NOT_RUNNING', 'The game is not running.');
  }
  return session;
}

async function currentQuestionOf(session) {
  const question = await gameplayRepository.findQuestionAt(
    session.set_id,
    session.current_position
  );
  if (!question) {
    throw notFound('QUESTION_NOT_FOUND', 'This game has no current question.');
  }
  return question;
}

// The current question. Never includes correct_index.
async function currentQuestion(code, user) {
  const session = await runningSession(code);
  if (!isHostOf(session, user)) {
    const seat = await playerRepository.findSeat(session.session_id, user.user_id);
    if (!seat) throw forbidden('You have no seat in this game.');
  }
  const question = await currentQuestionOf(session);
  const total = await sessionRepository.countQuestions(session.set_id);
  const elapsedMs = Date.now() - new Date(session.question_started_at).getTime();
  const secondsLeft = Math.max(0, question.time_limit_sec - elapsedMs / 1000);

  return {
    question_id: question.question_id,
    position: question.position,
    total,
    question_text: question.question_text,
    type: question.type,
    choices: question.choices,
    time_limit_sec: question.time_limit_sec,
    seconds_left: Math.round(secondsLeft * 10) / 10,
  };
}

// Checks run in this order: game RUNNING (409), caller seated (403),
// the current question (409), the choice exists (400), not answered yet (409).
// The server measures the time. The client never sends it.
async function submitAnswer(code, { question_id, choice_index }, user) {
  const session = await runningSession(code);

  const seat = await playerRepository.findSeat(session.session_id, user.user_id);
  if (!seat) throw forbidden('You have no seat in this game.');

  const question = await currentQuestionOf(session);
  if (question.question_id !== question_id) {
    throw conflict('NOT_CURRENT_QUESTION', 'That is not the question being asked now.');
  }

  if (choice_index >= question.choices.length) {
    throw badRequest(
      'INVALID_CHOICE',
      `choice_index must be 0 to ${question.choices.length - 1}.`
    );
  }

  const already = await gameplayRepository.findAnswer(seat.player_id, question.question_id);
  if (already) {
    throw conflict('ALREADY_ANSWERED', 'You already answered this question.');
  }

  const elapsedMs = Date.now() - new Date(session.question_started_at).getTime();
  const stars = starsFor(question, choice_index === question.correct_index, elapsedMs);

  try {
    await gameplayRepository.saveAnswerAndAddStars({
      player_id: seat.player_id,
      question_id: question.question_id,
      choice_index,
      time_taken: elapsedMs / 1000,
      correct: stars > 0,
      stars_earned: stars,
    });
  } catch (error) {
    // Two answers arrived at the same instant: the database UNIQUE rule decides.
    if (error instanceof UniqueConstraintError) {
      throw conflict('ALREADY_ANSWERED', 'You already answered this question.');
    }
    throw error;
  }

  await seat.reload();
  return {
    correct: stars > 0,
    stars_earned: stars,
    total_stars: seat.total_stars,
    late: elapsedMs > question.time_limit_sec * 1000,
  };
}

// Equal scores share a rank: 1, 2, 2, 4.
async function leaderboard(code, limit) {
  const session = await sessionService.findOrFail(code);
  const players = await playerRepository.findAllBySession(session.session_id);

  const sorted = [...players].sort(
    (a, b) => b.total_stars - a.total_stars || a.nickname.localeCompare(b.nickname)
  );

  let rank = 0;
  let previous = null;
  const ranked = sorted.map((player, index) => {
    if (player.total_stars !== previous) {
      rank = index + 1;
      previous = player.total_stars;
    }
    return {
      rank,
      player_id: player.player_id,
      nickname: player.nickname,
      score: player.total_stars,
    };
  });

  return ranked.slice(0, limit);
}

module.exports = { starsFor, currentQuestion, submitAnswer, leaderboard };