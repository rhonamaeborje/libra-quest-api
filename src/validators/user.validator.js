const { body, param } = require('express-validator');

// :id in the URL must be a whole number
const idParam = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('id must be a whole number of 1 or more.')
    .toInt(),
];

// PATCH /users/:id/role
const roleRules = [
  body('role')
    .isString().withMessage('role must be text.')
    .bail()
    .isIn(['PLAYER', 'HOST', 'ADMIN'])
    .withMessage('role must be PLAYER, HOST or ADMIN.'),
];

module.exports = { idParam, roleRules };