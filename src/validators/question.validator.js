const { body, param } = require('express-validator');

const setIdParam = param('id').isInt({ min: 1 }).withMessage('id must be a positive whole number').toInt();
const questionIdParam = param('questionId').isInt({ min: 1 }).withMessage('questionId must be a positive whole number').toInt();

// Only ONE correct answer: a single whole number, never a list.
const oneCorrectIndex = (required) => {
  let chain = body('correct_index');
  chain = required
    ? chain.exists().withMessage('correct_index is required').bail()
    : chain.optional();
  return chain
    .custom((value) => !Array.isArray(value)).withMessage('send exactly one correct_index')
    .bail()
    .isInt({ min: 0, max: 3 }).withMessage('correct_index must be a whole number from 0 to 3')
    .bail()
    .toInt()
    .custom((value, { req }) => {
      const choices = req.body.choices;
      return !Array.isArray(choices) || value < choices.length;
    }).withMessage('correct_index must point to one of the choices');
};

// A second "correct answer" field is a client mistake, so it is refused.
const noExtraAnswers = body('correct_indexes')
  .not().exists().withMessage('a question has exactly one correct answer');

const createRules = [
  setIdParam,
  body('question_text').exists().withMessage('question_text is required').bail()
    .isString().withMessage('question_text must be text').bail()
    .trim().isLength({ min: 3, max: 500 }).withMessage('question_text must be 3 to 500 characters'),
  body('type').optional().isIn(['multiple-choice']).withMessage('type must be multiple-choice'),
  body('choices').exists().withMessage('choices is required').bail()
    .isArray({ min: 2, max: 4 }).withMessage('choices must be a list of 2 to 4 answers'),
  body('choices.*').isString().withMessage('each choice must be text').bail()
    .trim().isLength({ min: 1, max: 100 }).withMessage('each choice must be 1 to 100 characters'),
  oneCorrectIndex(true),
  noExtraAnswers,
  body('time_limit_sec').optional().isInt({ min: 5, max: 120 }).withMessage('time_limit_sec must be 5 to 120').toInt(),
];

const updateRules = [
  setIdParam,
  questionIdParam,
  body('question_text').optional().isString().withMessage('question_text must be text').bail()
    .trim().isLength({ min: 3, max: 500 }).withMessage('question_text must be 3 to 500 characters'),
  body('type').optional().isIn(['multiple-choice']).withMessage('type must be multiple-choice'),
  body('choices').optional().isArray({ min: 2, max: 4 }).withMessage('choices must be a list of 2 to 4 answers'),
  body('choices.*').isString().withMessage('each choice must be text').bail()
    .trim().isLength({ min: 1, max: 100 }).withMessage('each choice must be 1 to 100 characters'),
  oneCorrectIndex(false),
  noExtraAnswers,
  body('time_limit_sec').optional().isInt({ min: 5, max: 120 }).withMessage('time_limit_sec must be 5 to 120').toInt(),
];

const listRules = [setIdParam];
const idsRules = [setIdParam, questionIdParam];

module.exports = { setIdParam, createRules, updateRules, listRules, idsRules };