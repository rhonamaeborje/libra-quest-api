const { Router } = require('express');
const sessionController = require('../controllers/session.controller');
const playerController = require('../controllers/player.controller');
const gameplayController = require('../controllers/gameplay.controller');
const rules = require('../validators/session.validator');
const validate = require('../middlewares/validate');
const requireUser = require('../middlewares/require-user');

const router = Router();

// Guards run BEFORE validation, so strangers learn nothing about the rules.
router.post('/', requireUser('HOST', 'ADMIN'), rules.createRules, validate, sessionController.create);
router.get('/:code', requireUser(), rules.codeParam, validate, sessionController.get);
router.patch('/:code', requireUser('HOST', 'ADMIN'), rules.statusRules, validate, sessionController.changeStatus);

// Players are a part of a session, so their URLs sit under it.
router.post('/:code/players', requireUser(), rules.joinRules, validate, playerController.join);
router.get('/:code/players', requireUser(), rules.codeParam, validate, playerController.list);

// Gameplay.
router.get('/:code/question', requireUser(), rules.codeParam, validate, gameplayController.question);
router.post('/:code/answers', requireUser(), rules.answerRules, validate, gameplayController.answer);
router.get('/:code/leaderboard', requireUser(), rules.leaderboardRules, validate, gameplayController.leaderboard);

module.exports = router;