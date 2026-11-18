const { Op } = require('sequelize');
const { Player, GameSession } = require('../models');

// The seat of one account in one game, or null. This one query is the rejoin rule.
function findSeat(sessionId, userId) {
  return Player.findOne({ where: { session_id: sessionId, user_id: userId } });
}

function findByNickname(sessionId, nickname) {
  return Player.findOne({ where: { session_id: sessionId, nickname } });
}

function countBySession(sessionId) {
  return Player.count({ where: { session_id: sessionId } });
}

function findAllBySession(sessionId) {
  return Player.findAll({ where: { session_id: sessionId }, order: [['player_id', 'ASC']] });
}

// A seat of this account in ANOTHER game that is RUNNING, or null.
function findRunningSeatElsewhere(userId, sessionId) {
  return Player.findOne({
    where: { user_id: userId, session_id: { [Op.ne]: sessionId } },
    include: [{ model: GameSession, where: { status: 'RUNNING' }, attributes: ['join_code'] }],
  });
}

function create(data) {
  return Player.create(data);
}

module.exports = {
  findSeat,
  findByNickname,
  countBySession,
  findAllBySession,
  findRunningSeatElsewhere,
  create,
};