const { matchedData } = require('express-validator');
const gameplayService = require('../services/gameplay.service');

async function question(req, res) {
  const { code } = matchedData(req);
  const result = await gameplayService.currentQuestion(code, req.user);
  res.status(200).json(result);
}

// Only question_id and choice_index are read. Anything else the client
// sends (time, stars) is ignored: the server decides time and score.
async function answer(req, res) {
  const { code, question_id, choice_index } = matchedData(req);
  const result = await gameplayService.submitAnswer(
    code,
    { question_id, choice_index },
    req.user
  );
  res.status(201).json(result);
}

async function leaderboard(req, res) {
  const { code, limit } = matchedData(req);
  const rows = await gameplayService.leaderboard(code, limit || 10);
  res.status(200).json(rows);
}

module.exports = { question, answer, leaderboard };