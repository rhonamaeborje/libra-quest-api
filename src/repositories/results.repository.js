const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models/index');

async function findFinishedGamePlayers(since) {
  const sql = `
    SELECT 
      s.join_code AS session_code, 
      s.started_at, 
      s.ended_at, 
      u.school_id, 
      p.nickname, 
      p.total_stars AS score,
      (
        SELECT COUNT(*) FROM answers a 
        WHERE a.player_id = p.player_id
      ) = (
        SELECT COUNT(*) FROM questions q 
        WHERE q.set_id = s.set_id
      ) AS completed
    FROM game_sessions s
    JOIN players p ON p.session_id = s.session_id
    JOIN users u ON u.user_id = s.user_id
    WHERE s.status = 'CLOSED'
      AND (:since::timestamp IS NULL OR s.ended_at > :since::timestamp)
    ORDER BY s.ended_at DESC, p.total_stars DESC
  `;

  return sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: { since: since ? since.toISOString() : null },
  });
}

module.exports = {
  findFinishedGamePlayers,
};