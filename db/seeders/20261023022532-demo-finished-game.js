'use strict';

module.exports = {
  async up(queryInterface) {
    const db = queryInterface.sequelize;

    await queryInterface.bulkInsert('question_sets', [
      {
        title: 'Library Basics',
        description: 'Introductory library quiz',
        subject: 'Library',
        grade_level: 'College',
      },
    ]);

    const [sets] = await db.query(
      "SELECT set_id FROM question_sets WHERE title = 'Library Basics'"
    );

    const [users] = await db.query(
      "SELECT user_id FROM users LIMIT 1"
    );

    await queryInterface.bulkInsert('game_sessions', [
      {
        user_id: users[0].user_id,
        set_id: sets[0].set_id,
        join_code: '123456',
        status: 'CLOSED',
      },
    ]);

    const [sessions] = await db.query(
      "SELECT session_id FROM game_sessions WHERE join_code = '123456'"
    );

    await queryInterface.bulkInsert('questions', [
      {
        set_id: sets[0].set_id,
        question_text: 'How many books can a student borrow?',
        type: 'multiple-choice',
        choices: JSON.stringify(['1', '3', '5', '10']),
        correct_index: 2,
        time_limit_sec: 30,
      },
      {
        set_id: sets[0].set_id,
        question_text: 'What section contains reference materials?',
        type: 'multiple-choice',
        choices: JSON.stringify(['Reference', 'Fiction', 'Archives', 'IT']),
        correct_index: 0,
        time_limit_sec: 30,
      },
    ]);

    await queryInterface.bulkInsert('players', [
      { session_id: sessions[0].session_id, user_id: 1, nickname: 'PlayerOne', total_stars: 5 },
      { session_id: sessions[0].session_id, user_id: 2, nickname: 'PlayerTwo', total_stars: 4 },
      { session_id: sessions[0].session_id, user_id: 3, nickname: 'PlayerThree', total_stars: 3 },
    ]);

    const [players] = await db.query(
      "SELECT player_id FROM players ORDER BY player_id ASC"
    );

    const [questions] = await db.query(
      "SELECT question_id FROM questions ORDER BY question_id ASC"
    );

    // All 3 players answer ALL questions so they are marked as completed
    await queryInterface.bulkInsert('answers', [
      { player_id: players[0].player_id, question_id: questions[0].question_id, choice_index: 2, time_taken: 12.5, correct: true, stars_earned: 3 },
      { player_id: players[0].player_id, question_id: questions[1].question_id, choice_index: 0, time_taken: 10.0, correct: true, stars_earned: 2 },
      
      { player_id: players[1].player_id, question_id: questions[0].question_id, choice_index: 1, time_taken: 17.0, correct: false, stars_earned: 0 },
      { player_id: players[1].player_id, question_id: questions[1].question_id, choice_index: 0, time_taken: 11.0, correct: true, stars_earned: 4 },

      { player_id: players[2].player_id, question_id: questions[0].question_id, choice_index: 2, time_taken: 10.1, correct: true, stars_earned: 3 },
      { player_id: players[2].player_id, question_id: questions[1].question_id, choice_index: 0, time_taken: 9.5, correct: true, stars_earned: 0 },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('answers', null, {});
    await queryInterface.bulkDelete('players', null, {});
    await queryInterface.bulkDelete('questions', null, {});
    await queryInterface.bulkDelete('game_sessions', null, {});
    await queryInterface.bulkDelete('question_sets', null, {});
  },
};