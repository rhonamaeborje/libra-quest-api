'use strict';

// Gives every question without a position its number (1, 2, 3 ...) inside its set.
// It only touches rows where position is empty, so running it twice changes nothing.
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE questions q
      SET position = r.rn
      FROM (
        SELECT question_id,
               ROW_NUMBER() OVER (PARTITION BY set_id ORDER BY question_id) AS rn
        FROM questions
      ) r
      WHERE q.question_id = r.question_id
        AND q.position IS NULL
    `);
  },

  async down() {
    // nothing to undo
  },
};