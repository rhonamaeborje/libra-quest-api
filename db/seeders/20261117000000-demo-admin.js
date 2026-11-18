'use strict';

// Makes host02 (87654321) the demo ADMIN. Running it twice changes nothing.
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkUpdate(
      'users',
      { role: 'ADMIN' },
      { school_id: '87654321' }
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkUpdate(
      'users',
      { role: 'HOST' },
      { school_id: '87654321' }
    );
  },
};