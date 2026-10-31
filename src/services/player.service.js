const playerRepository = require('../repositories/player.repository');
const sessionService = require('./session.service');
const { conflict } = require('../errors/app-error');
const { constraintOf } = require('../errors/db-errors');

const DEFAULT_MAX_PLAYERS = 50;

// Questions are asked in this order. The first "no" decides the answer.
async function join(code, nickname, user) {
  const session = await sessionService.findOrFail(code);

  // Rejoin: this account already has a seat here. Same row, same score.
  const seat = await playerRepository.findSeat(session.session_id, user.user_id);
  if (seat) {
    return { session, player: seat, created: false };
  }

  // One game at a time: a seat in another RUNNING game blocks a new seat.
  const elsewhere = await playerRepository.findRunningSeatElsewhere(
    user.user_id,
    session.session_id
  );
  if (elsewhere) {
    throw conflict('ALREADY_IN_GAME', 'You are still playing another game. Finish it first.');
  }

  // New seat: only while the game is in the lobby, and only if there is room.
  if (session.status === 'CLOSED') {
    throw conflict('SESSION_ENDED', 'This game has ended.');
  }
  if (session.status !== 'LOBBY') {
    throw conflict('SESSION_NOT_JOINABLE', 'This game has already started.');
  }

  const maxPlayers = session.max_players || DEFAULT_MAX_PLAYERS;
  const seatsTaken = await playerRepository.countBySession(session.session_id);
  if (seatsTaken >= maxPlayers) {
    throw conflict('SESSION_FULL', 'This game is full.');
  }

  try {
    const player = await playerRepository.create({
      session_id: session.session_id,
      user_id: user.user_id,
      nickname,
    });
    return { session, player, created: true };
  } catch (error) {
    // Two join requests from the same account arrived at the same instant,
    // and the other one won. Return the seat that exists.
    if (constraintOf(error) === 'unique_player_per_session_user') {
      const existing = await playerRepository.findSeat(session.session_id, user.user_id);
      return { session, player: existing, created: false };
    }
    // A taken nickname reaches the error handler and answers 409 (constraint map).
    throw error;
  }
}

async function list(code) {
  const session = await sessionService.findOrFail(code);
  return playerRepository.findAllBySession(session.session_id);
}

module.exports = { join, list };