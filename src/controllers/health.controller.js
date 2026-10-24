const pkg = require('../../package.json');
const healthService = require('../services/health.service');

async function getHealth(req, res, next) {
  try {
    const health = await healthService.getHealth();

    res.status(200).json({
      game: pkg.name,
      status: health.status,
      database: health.database,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getHealth,
};