'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('questions', 'position', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    // Number the questions that already exist: 1, 2, 3 ... inside each set.
    await queryInterface.sequelize.query(`
      UPDATE questions q
      SET position = r.rn
      FROM (
        SELECT question_id,
               ROW_NUMBER() OVER (PARTITION BY set_id ORDER BY question_id) AS rn
        FROM questions
      ) r
      WHERE q.question_id = r.question_id
    `);

    // Two questions in one set can never share a position.
    await queryInterface.addConstraint('questions', {
      fields: ['set_id', 'position'],
      type: 'unique',
      name: 'questions_set_position_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('questions', 'questions_set_position_unique');
    await queryInterface.removeColumn('questions', 'position');
  },
};