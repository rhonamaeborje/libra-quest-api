const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');

async function findFinishedGamePlayers(since) {
  const sql = `
    SELECT
      '123456' AS session_code,
      gs.started_at,
      gs.ended_at,
      u.school_id,
      u.username AS nickname,
      p.score,
      (p.completed_at IS NOT NULL) AS completed
    FROM game_sessions gs
    JOIN players p
      ON p.game_session_id = gs.id
    JOIN users u
      ON u.user_id = p.user_id
    WHERE gs.status = 'CLOSED'
      AND (
        CAST(:since AS timestamptz) IS NULL
        OR gs.ended_at > CAST(:since AS timestamptz)
      )
    ORDER BY gs.ended_at DESC
  `;

  return sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: {
      since: since ? since.toISOString() : null,
    },
  });
}

module.exports = {
  findFinishedGamePlayers,
};