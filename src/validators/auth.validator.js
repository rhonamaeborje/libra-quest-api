const { body } = require('express-validator');

// POST /auth/register
// No rule for "role": matchedData() throws it away,
// so nobody can register as an ADMIN.
const register = [
  body('school_id')
    .isString().withMessage('school_id must be text.')
    .bail()
    .trim()
    .matches(/^\d{8}$/).withMessage('school_id must be 8 digits.'),

  body('username')
    .isString().withMessage('username must be text.')
    .bail()
    .trim()
    .matches(/^[A-Za-z0-9_]{3,30}$/)
    .withMessage('username must be 3 to 30 letters, numbers or underscores.'),

  body('full_name')
    .isString().withMessage('full_name must be text.')
    .bail()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('full_name must be 2 to 100 characters.'),

  body('email')
    .isString().withMessage('email must be text.')
    .bail()
    .trim()
    .isEmail().withMessage('email must be a valid email.')
    .isLength({ max: 255 }).withMessage('email is too long.'),

  body('password')
    .isString().withMessage('password must be text.')
    .bail()
    .isLength({ min: 8, max: 72 })
    .withMessage('password must be 8 to 72 characters.')
    .matches(/[A-Za-z]/).withMessage('password needs a letter.')
    .matches(/\d/).withMessage('password needs a number.'),
];

// POST /auth/login
const login = [
  body('school_id')
    .isString().withMessage('school_id is required and must be text.')
    .bail()
    .trim()
    .notEmpty().withMessage('school_id is required.'),

  body('password')
    .isString().withMessage('password is required and must be text.')
    .bail()
    .notEmpty().withMessage('password is required.'),
];

// PATCH /users/:id/role (used later by the admin routes)
const roleRules = [
  body('role')
    .isString().withMessage('role must be text.')
    .bail()
    .isIn(['PLAYER', 'HOST', 'ADMIN'])
    .withMessage('role must be PLAYER, HOST or ADMIN.'),
];

module.exports = { register, login, roleRules };