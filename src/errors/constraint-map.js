// A database rule was broken -> what the client should hear.
// The key on the left is the constraint name from my database.

module.exports = {
  // Two players in the same game cannot use the same nickname.
  uq_player_nickname: {
    status: 409,
    code: 'NICKNAME_TAKEN',
    message: 'Someone in this room already picked that nickname. Try another one.',
  },

  // One account can only have one seat in the same game.
  unique_player_per_session_user: {
    status: 409,
    code: 'ALREADY_SEATED',
    message: 'This account already has a seat in this game.',
  },

  // A question set that a game used cannot be deleted.
  game_sessions_set_id_fkey: {
    status: 409,
    code: 'QUESTION_SET_IN_USE',
    message: 'This question set was already used in a game, so it cannot be deleted.',
  },
};