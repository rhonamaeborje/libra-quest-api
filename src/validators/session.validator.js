const { body, param, query } = require('express-validator');

// A join code is six digits and does not start with 0.
const codeParam = param('code')
  .matches(/^[1-9][0-9]{5}$/).withMessage('the join code must be six digits');

const createRules = [
  body('set_id')
    .exists().withMessage('set_id is required')
    .bail()
    .isInt({ min: 1 }).withMessage('set_id must be a positive whole number')
    .toInt(),
];

// A host sends EITHER a new status OR the next question position.
const statusRules = [
  codeParam,
  body('status')
    .optional()
    .isIn(['RUNNING', 'CLOSED']).withMessage('status must be RUNNING or CLOSED'),
  body('current_position')
    .optional()
    .isInt({ min: 1 }).withMessage('current_position must be a positive whole number')
    .toInt(),
  body().custom((_, { req }) => {
    const data = req.body || {};
    const hasStatus = data.status !== undefined;
    const hasPosition = data.current_position !== undefined;
    if (hasStatus === hasPosition) {
      throw new Error('send either status or current_position, not both');
    }
    return true;
  }),
];

const joinRules = [
  codeParam,
  body('nickname')
    .exists().withMessage('nickname is required')
    .bail()
    .isString().withMessage('nickname must be text')
    .bail()
    .trim()
    .isLength({ min: 2, max: 24 }).withMessage('nickname must be 2 to 24 characters long'),
];

const answerRules = [
  codeParam,
  body('question_id')
    .exists().withMessage('question_id is required')
    .bail()
    .isInt({ min: 1 }).withMessage('question_id must be a positive whole number')
    .toInt(),
  body('choice_index')
    .exists().withMessage('choice_index is required')
    .bail()
    .isInt({ min: 0 }).withMessage('choice_index must be 0 or more')
    .toInt(),
];

const leaderboardRules = [
  codeParam,
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('limit must be 1 to 50')
    .toInt(),
];

module.exports = {
  codeParam,
  createRules,
  statusRules,
  joinRules,
  answerRules,
  leaderboardRules,
};