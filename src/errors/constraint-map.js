   module.exports = {
     uq_player_nickname: {
       status: 409,
       code: 'NICKNAME_TAKEN',
       message: 'That nickname is already used in this game.',
     },
     unique_player_per_session_user: {
       status: 409,
       code: 'ALREADY_SEATED',
       message: 'This account already has a seat in this game.',
     },
   };