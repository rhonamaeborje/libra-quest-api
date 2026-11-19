const { sequelize, Question, Answer, Player } = require('../models');

// The question of a set at one position (1, 2, 3 ...).
function findQuestionAt(setId, position) {
  return Question.findOne({ where: { set_id: setId, position } });
}

function findAnswer(playerId, questionId) {
  return Answer.findOne({ where: { player_id: playerId, question_id: questionId } });
}

// ONE transaction: the answer and the stars are saved together or not at all.
// increment() adds in the database, so two answers at once never lose stars.
function saveAnswerAndAddStars(data) {
  return sequelize.transaction(async (t) => {
    const answer = await Answer.create(data, { transaction: t });
    if (data.stars_earned > 0) {
      await Player.increment(
        { total_stars: data.stars_earned },
        { where: { player_id: data.player_id }, transaction: t }
      );
    }
    return answer;
  });
}

module.exports = { findQuestionAt, findAnswer, saveAnswerAndAddStars };