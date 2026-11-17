const { Router } = require('express');

const userController = require('../controllers/user.controller');
const userValidator = require('../validators/user.validator');
const validate = require('../middlewares/validate');
const requireUser = require('../middlewares/require-user');

const router = Router();

// Only an ADMIN may use every route below.
router.use(requireUser('ADMIN'));

router.get('/', userController.list);

router.patch(
  '/:id/role',
  userValidator.idParam,
  userValidator.roleRules,
  validate,
  userController.changeRole
);

module.exports = router;