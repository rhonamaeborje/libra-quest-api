'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('users', [
      {
        username: 'host01',
        password: 'password123',
        school_id: 'SCH-001',
      },
      {
        username: 'host02',
        password: 'password123',
        school_id: 'SCH-002',
      }
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', null, {});
  }
};