const { Op } = require('sequelize');
const { QuestionSet, Question, GameSession } = require('../models');

// One page of sets. hostId = null means "every host" (admin).
function findPage({ hostId, q, sort, order, limit, offset }) {
  const where = {};
  if (hostId) where.user_id = hostId;
  if (q) {
    // % and _ typed by the user are matched literally, not as wildcards
    const word = `%${q.replace(/[\\%_]/g, '\\$&')}%`;
    where[Op.or] = [{ title: { [Op.iLike]: word } }, { subject: { [Op.iLike]: word } }];
  }
  return QuestionSet.findAndCountAll({
    where,
    order: [[sort, order.toUpperCase()], ['set_id', 'ASC']],
    limit,
    offset,
  });
}

function findById(id, { withQuestions = false } = {}) {
  if (!withQuestions) return QuestionSet.findByPk(id); // a row, or null
  const questions = { model: Question, as: 'questions' };
  return QuestionSet.findByPk(id, {
    include: [questions],
    order: [[questions, 'position', 'ASC'], [questions, 'question_id', 'ASC']],
  });
}

// How many games were played with this set (0 = still editable).
function countGames(setId, options = {}) {
  return GameSession.count({ where: { set_id: setId }, ...options });
}

function create(data) {
  return QuestionSet.create(data);
}

function update(questionSet, changes) {
  return questionSet.update(changes);
}

function remove(questionSet) {
  return questionSet.destroy();
}

module.exports = { findPage, findById, countGames, create, update, remove };