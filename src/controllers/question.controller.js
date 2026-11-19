const { matchedData } = require('express-validator');
const questionService = require('../services/question.service');

// A host sees correct_index here. The player route in M3 never will.
function toQuestionJson(question) {
  return {
    id: question.question_id,
    set_id: question.set_id,
    position: question.position,
    question_text: question.question_text,
    type: question.type,
    choices: question.choices,
    correct_index: question.correct_index,
    time_limit_sec: question.time_limit_sec,
  };
}

async function list(req, res) {
  const { id } = matchedData(req);
  const questions = await questionService.list(id, req.user);
  res.status(200).json({ data: questions.map(toQuestionJson) });
}

async function create(req, res) {
  const { id } = matchedData(req, { locations: ['params'] });
  const data = matchedData(req, { locations: ['body'] });
  const question = await questionService.create(id, data, req.user);
  res.status(201).json(toQuestionJson(question));
}

async function update(req, res) {
  const { id, questionId } = matchedData(req, { locations: ['params'] });
  const changes = matchedData(req, { locations: ['body'] });
  const question = await questionService.update(id, questionId, changes, req.user);
  res.status(200).json(toQuestionJson(question));
}

async function remove(req, res) {
  const { id, questionId } = matchedData(req);
  await questionService.remove(id, questionId, req.user);
  res.status(204).end();
}

module.exports = { toQuestionJson, list, create, update, remove };