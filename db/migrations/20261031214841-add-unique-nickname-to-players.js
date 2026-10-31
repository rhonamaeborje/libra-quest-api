   'use strict';

   module.exports = {
     async up(queryInterface) {
       await queryInterface.addConstraint('players', {
         type: 'unique',
         name: 'uq_player_nickname',
         fields: ['session_id', 'nickname'],
       });
     },

     async down(queryInterface) {
       await queryInterface.removeConstraint('players', 'uq_player_nickname');
     },
   };