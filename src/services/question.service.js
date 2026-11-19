const { sequelize } = require('../models');
const questionSetRepository = require('../repositories/question-set.repository');
const questionRepository = require('../repositories/question.repository');
const { notFound, forbidden, conflict, badRequest } = require('../errors/app-error');

async function loadOwnedSet(setId, user) {
  const questionSet = await questionSetRepository.findById(setId);
  if (!questionSet) {
    throw notFound('QUESTION_SET_NOT_FOUND', `No question set has the id ${setId}.`);
  }
  if (questionSet.user_id !== user.user_id && user.role !== 'ADMIN') {
    throw forbidden('This question set belongs to another host.');
  }
  return questionSet;
}

// Rule: a set that a game already used is frozen.
async function assertNotInUse(setId, options) {
  const games = await questionSetRepository.countGames(setId, options);
  if (games > 0) {
    throw conflict('SET_IN_USE', 'This set was used by a game, so its questions can no longer be changed.');
  }
}

async function findQuestionOrFail(setId, questionId, options) {
  const question = await questionRepository.findInSet(setId, questionId, options);
  if (!question) {
    throw notFound('QUESTION_NOT_FOUND', `Set ${setId} has no question with the id ${questionId}.`);
  }
  return question;
}

async function list(setId, user) {
  await loadOwnedSet(setId, user);
  return questionRepository.findAllBySet(setId);
}

// Rule: the question and its position are saved together, or not at all.
async function create(setId, data, user) {
  await loadOwnedSet(setId, user);
  return sequelize.transaction(async (t) => {
    await assertNotInUse(setId, { transaction: t });
    const last = (await questionRepository.maxPosition(setId, { transaction: t })) || 0;
    return questionRepository.create(
      {
        ...data,
        type: data.type || 'multiple-choice',
        time_limit_sec: data.time_limit_sec || 30,
        set_id: setId,
        position: last + 1, // the server decides the position
      },
      { transaction: t }
    );
  });
}

async function update(setId, questionId, changes, user) {
  await loadOwnedSet(setId, user);
  return sequelize.transaction(async (t) => {
    await assertNotInUse(setId, { transaction: t });
    const question = await findQuestionOrFail(setId, questionId, { transaction: t });

    // The final choices and the final correct_index must still agree.
    const choices = changes.choices || question.choices;
    const correct = changes.correct_index !== undefined ? changes.correct_index : question.correct_index;
    if (correct >= choices.length) {
      throw badRequest('CORRECT_INDEX_OUT_OF_RANGE', 'correct_index must point to one of the choices.');
    }
    return questionRepository.update(question, changes, { transaction: t });
  });
}

// After a delete the positions are closed up again: 1, 2, 3 ...
async function remove(setId, questionId, user) {
  await loadOwnedSet(setId, user);
  await sequelize.transaction(async (t) => {
    await assertNotInUse(setId, { transaction: t });
    const question = await findQuestionOrFail(setId, questionId, { transaction: t });
    await questionRepository.remove(question, { transaction: t });

    const rest = await questionRepository.findAllBySet(setId, { transaction: t });
    for (let i = 0; i < rest.length; i += 1) {
      if (rest[i].position !== i + 1) {
        await questionRepository.update(rest[i], { position: i + 1 }, { transaction: t });
      }
    }
  });
}

module.exports = { list, create, update, remove };