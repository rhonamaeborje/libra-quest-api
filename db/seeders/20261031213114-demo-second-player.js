'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('users', [
      {
        username: 'player02',
        school_id: '44444444',
        full_name: 'Player Two',
        email: 'player02@example.com',
        role: 'PLAYER',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { school_id: '44444444' }, {});
  },
};