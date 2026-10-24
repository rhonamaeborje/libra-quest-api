const express = require('express');
const router = express.Router();

const { getResults } = require('../controllers/results.controller');
const hubKey = require('../middlewares/hub-key');

router.get('/', hubKey, getResults);

module.exports = router;