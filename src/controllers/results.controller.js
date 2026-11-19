const gameInfo = require('../config/game-info');
const resultsService = require('../services/results.service');

async function getResults(req, res, next) {
  try {
    const { since } = req.query;

    if (since !== undefined && Number.isNaN(Date.parse(since))) {
      return res.status(400).json({
        error: {
          code: 'INVALID_SINCE',
          message: 'since must be a date and time',
        },
      });
    }

    const results = await resultsService.listFinishedGames(
      since ? new Date(since) : null
    );

    return res.status(200).json({
      game: gameInfo.slug,
      developer: gameInfo.developer,
      generated_at: new Date().toISOString(),
      results,
    });
  } catch (error) {
    // Unexpected errors go to the shared error handler: one error format,
    // no stack trace sent to the client.
    return next(error);
  }
}

module.exports = {
  getResults,
};