'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // One answer per player per question. A second answer is refused by the database itself.
    await queryInterface.addConstraint('answers', {
      fields: ['player_id', 'question_id'],
      type: 'unique',
      name: 'unique_answer_per_player_question',
    });

    // total_stars must never be empty, because empty + 5 stays empty in SQL.
    await queryInterface.sequelize.query(
      'UPDATE players SET total_stars = 0 WHERE total_stars IS NULL'
    );
    await queryInterface.changeColumn('players', 'total_stars', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('players', 'total_stars', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.removeConstraint('answers', 'unique_answer_per_player_question');
  },
};