'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('users', [
      {
        username: 'host01',
        password: 'password123',
      },
      {
        username: 'host02',
        password: 'password123',
      }
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', null, {});
  }
};