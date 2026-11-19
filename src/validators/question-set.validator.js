const { body, param, query } = require('express-validator');
const { pageRules, sortRules } = require('./list.validator');

const idParam = param('id')
  .isInt({ min: 1 }).withMessage('id must be a positive whole number')
  .toInt();

const title = () => body('title')
  .exists().withMessage('title is required')
  .bail()
  .isString().withMessage('title must be text')
  .bail()
  .trim()
  .isLength({ min: 3, max: 150 }).withMessage('title must be 3 to 150 characters long');

const description = () => body('description')
  .optional({ values: 'null' })
  .isString().withMessage('description must be text')
  .bail()
  .trim();

const subject = () => body('subject')
  .exists().withMessage('subject is required')
  .bail()
  .isString().withMessage('subject must be text')
  .bail()
  .trim()
  .isLength({ min: 2, max: 60 }).withMessage('subject must be 2 to 60 characters long');

const gradeLevel = () => body('grade_level')
  .exists().withMessage('grade_level is required')
  .bail()
  .isString().withMessage('grade_level must be text')
  .bail()
  .trim()
  .isLength({ min: 1, max: 30 }).withMessage('grade_level must be 1 to 30 characters long');

const SORT_COLUMNS = ['set_id', 'title', 'subject', 'grade_level'];

const listRules = [
  ...pageRules,
  ...sortRules(SORT_COLUMNS),
  query('q').optional().isString().withMessage('q must be text')
    .bail().trim().isLength({ max: 100 }).withMessage('q must be at most 100 characters'),
];

// "read one": ?include=questions loads the questions in the same query
const getRules = [
  idParam,
  query('include').optional().isIn(['questions']).withMessage('include may only be: questions'),
];

const createRules = [title(), description(), subject(), gradeLevel()];

// PATCH: every field is optional, but at least one must be sent.
const updateRules = [
  idParam,
  title().optional(),
  description(),
  subject().optional(),
  gradeLevel().optional(),
  body().custom((value) => {
    const sent = Object.keys(value || {});
    const allowed = ['title', 'description', 'subject', 'grade_level'];
    if (!sent.some((key) => allowed.includes(key))) {
      throw new Error('send at least one of: title, description, subject, grade_level');
    }
    return true;
  }),
];

module.exports = { idParam, listRules, getRules, createRules, updateRules };