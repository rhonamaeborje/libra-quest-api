const { GameSession, Question } = require('../models');

function findByCode(code) {
  return GameSession.findOne({ where: { join_code: code } });
}

function create(data) {
  return GameSession.create(data);
}

function update(session, changes) {
  return session.update(changes);
}

// How many questions the set of a game has.
function countQuestions(setId) {
  return Question.count({ where: { set_id: setId } });
}

module.exports = { findByCode, create, update, countQuestions };