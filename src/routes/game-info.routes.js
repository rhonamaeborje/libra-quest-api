const express = require('express');
const router = express.Router();

const { getGameInfo } = require('../controllers/game-info.controller');

router.get('/', getGameInfo);

module.exports = router;