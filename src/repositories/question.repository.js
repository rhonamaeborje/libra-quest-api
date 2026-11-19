const { Question } = require('../models');

function findAllBySet(setId, options = {}) {
  return Question.findAll({
    where: { set_id: setId },
    order: [['position', 'ASC'], ['question_id', 'ASC']],
    ...options,
  });
}

function findInSet(setId, questionId, options = {}) {
  return Question.findOne({ where: { set_id: setId, question_id: questionId }, ...options });
}

function maxPosition(setId, options = {}) {
  return Question.max('position', { where: { set_id: setId }, ...options });
}

function create(data, options = {}) {
  return Question.create(data, options);
}

function update(question, changes, options = {}) {
  return question.update(changes, options);
}

function remove(question, options = {}) {
  return question.destroy(options);
}

module.exports = { findAllBySet, findInSet, maxPosition, create, update, remove };