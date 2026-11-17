const { Router } = require('express');
const currentUser = require('../middlewares/current-user');

const router = Router();

// Public routes
router.use('/health', require('./health.routes'));
router.use('/game-info', require('./game-info.routes'));
router.use('/results', require('./results.routes'));
router.use('/auth', require('./auth.routes'));

// Docs routes go here in Milestone 5 (before currentUser):
// router.use(require('./docs.routes'));

// JWT middleware AFTER the public routes
router.use(currentUser);

// Protected routes
router.use('/question-sets', require('./question-set.routes'));
router.use('/sessions', require('./session.routes'));

// Admin routes
router.use('/users', require('./user.routes'));

module.exports = router;