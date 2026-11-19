const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');

// Finished (CLOSED) games with one row per player.
// A player is "completed" when they answered every question of the game's set.
async function findFinishedGamePlayers(since) {
  const sql = `
    SELECT
      gs.join_code AS session_code,
      gs.started_at,
      gs.ended_at,
      u.school_id,
      p.nickname,
      p.total_stars AS score,
      (
        (SELECT COUNT(*) FROM questions q WHERE q.set_id = gs.set_id) > 0
        AND (SELECT COUNT(*) FROM answers a WHERE a.player_id = p.player_id)
          = (SELECT COUNT(*) FROM questions q WHERE q.set_id = gs.set_id)
      ) AS completed
    FROM game_sessions gs
    JOIN players p ON p.session_id = gs.session_id
    JOIN users u ON u.user_id = p.user_id
    WHERE gs.status = 'CLOSED'
      AND gs.ended_at IS NOT NULL
      ${since ? 'AND gs.ended_at > :since' : ''}
    ORDER BY gs.ended_at DESC, p.total_stars DESC
  `;

  return sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: since ? { since: since.toISOString() } : {},
  });
}

module.exports = {
  findFinishedGamePlayers,
};