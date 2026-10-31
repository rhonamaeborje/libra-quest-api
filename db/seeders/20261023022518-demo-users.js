'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('users', [
      {
        username: 'host01',
        school_id: '12345678',
        full_name: 'Host User',
        email: 'host01@example.com',
        role: 'HOST',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: 'host02',
        school_id: '87654321',
        full_name: 'Second Host',
        email: 'host02@example.com',
        role: 'HOST',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: 'player01',
        school_id: '55555555',
        full_name: 'Player User',
        email: 'player01@example.com',
        role: 'PLAYER',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};