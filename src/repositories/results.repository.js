const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');

async function findFinishedGamePlayers(since) {
  let sql = `
    SELECT
      '123456' AS session_code,
      gs.started_at,
      gs.ended_at,
      u.school_id,
      p.nickname,
      p.total_stars AS score,
      TRUE AS completed
    FROM game_sessions gs
    JOIN players p
      ON p.session_id = gs.session_id
    JOIN users u
      ON u.user_id = p.user_id
    WHERE gs.status = 'CLOSED'
  `;

  if (since) {
    sql += `
      AND gs.ended_at > :since
    `;
  }

  sql += `
    ORDER BY gs.ended_at DESC, p.total_stars DESC
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