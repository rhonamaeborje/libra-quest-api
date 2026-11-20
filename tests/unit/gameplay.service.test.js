// UNIT tests for the gameplay rules. No database and no clock needed for the
// scoring rule; the repositories are replaced with jest.mock, so every test
// runs in milliseconds and we can check what the service did NOT call.
jest.mock('../../src/services/session.service', () => ({ findOrFail: jest.fn() }));
jest.mock('../../src/repositories/session.repository', () => ({ countQuestions: jest.fn() }));
jest.mock('../../src/repositories/player.repository', () => ({
  findSeat: jest.fn(),
  findAllBySession: jest.fn(),
}));
jest.mock('../../src/repositories/gameplay.repository', () => ({
  findQuestionAt: jest.fn(),
  findAnswer: jest.fn(),
  saveAnswerAndAddStars: jest.fn(),
}));

const sessionService = require('../../src/services/session.service');
const playerRepository = require('../../src/repositories/player.repository');
const gameplayRepository = require('../../src/repositories/gameplay.repository');
const gameplay = require('../../src/services/gameplay.service');

const QUESTION = {
  question_id: 3,
  position: 1,
  choices: ['A', 'B', 'C', 'D'],
  correct_index: 1,
  time_limit_sec: 30,
};
const USER = { user_id: 10, role: 'PLAYER' };

beforeEach(() => jest.resetAllMocks());

describe('starsFor (the scoring rule, edge values)', () => {
  test('a correct answer at 0 ms earns the full 5 stars', () => {
    expect(gameplay.starsFor(QUESTION, true, 0)).toBe(5);
  });

  test('a correct answer at exactly 10 s still earns 5 stars', () => {
    expect(gameplay.starsFor(QUESTION, true, 10000)).toBe(5);
  });

  test('1 ms after 10 s drops to 3 stars', () => {
    expect(gameplay.starsFor(QUESTION, true, 10001)).toBe(3);
  });

  test('a correct answer at exactly 20 s still earns 3 stars', () => {
    expect(gameplay.starsFor(QUESTION, true, 20000)).toBe(3);
  });

  test('1 ms after 20 s drops to 1 star', () => {
    expect(gameplay.starsFor(QUESTION, true, 20001)).toBe(1);
  });

  test('a correct answer at exactly the time limit earns 1 star', () => {
    expect(gameplay.starsFor(QUESTION, true, 30000)).toBe(1);
  });

  test('a correct answer 1 ms after the limit earns 0 stars', () => {
    expect(gameplay.starsFor(QUESTION, true, 30001)).toBe(0);
  });

  test('a wrong answer earns 0 stars, even at 0 ms', () => {
    expect(gameplay.starsFor(QUESTION, false, 0)).toBe(0);
  });
});

describe('submitAnswer (the answer rules)', () => {
  // Builds a game that is running, with a seated player and the current question.
  function arrange(overrides = {}) {
    const game = {
      session: {
        session_id: 1,
        set_id: 5,
        status: 'RUNNING',
        current_position: 1,
        question_started_at: new Date(Date.now() - 4000),
        ...overrides.session,
      },
      seat: 'seat' in overrides
        ? overrides.seat
        : { player_id: 7, total_stars: 5, reload: jest.fn() },
      answered: overrides.answered || null,
    };
    sessionService.findOrFail.mockResolvedValue(game.session);
    playerRepository.findSeat.mockResolvedValue(game.seat);
    gameplayRepository.findQuestionAt.mockResolvedValue(QUESTION);
    gameplayRepository.findAnswer.mockResolvedValue(game.answered);
    gameplayRepository.saveAnswerAndAddStars.mockResolvedValue({});
    return game;
  }

  test('a game that is not running refuses the answer with 409', async () => {
    arrange({ session: { status: 'OPEN' } });
    await expect(gameplay.submitAnswer('123456', { question_id: 3, choice_index: 1 }, USER))
      .rejects.toMatchObject({ status: 409, code: 'SESSION_NOT_RUNNING' });
    expect(gameplayRepository.saveAnswerAndAddStars).not.toHaveBeenCalled();
  });

  test('a caller with no seat is refused with 403 and nothing is saved', async () => {
    arrange({ seat: null });
    await expect(gameplay.submitAnswer('123456', { question_id: 3, choice_index: 1 }, USER))
      .rejects.toMatchObject({ status: 403 });
    expect(gameplayRepository.saveAnswerAndAddStars).not.toHaveBeenCalled();
  });

  test('an answer to a question that is not the current one is refused with 409', async () => {
    arrange();
    await expect(gameplay.submitAnswer('123456', { question_id: 99, choice_index: 1 }, USER))
      .rejects.toMatchObject({ status: 409, code: 'NOT_CURRENT_QUESTION' });
    expect(gameplayRepository.saveAnswerAndAddStars).not.toHaveBeenCalled();
  });

  test('a choice outside the list is refused with 400', async () => {
    arrange();
    await expect(gameplay.submitAnswer('123456', { question_id: 3, choice_index: 4 }, USER))
      .rejects.toMatchObject({ status: 400, code: 'INVALID_CHOICE' });
    expect(gameplayRepository.saveAnswerAndAddStars).not.toHaveBeenCalled();
  });

  test('a second answer to the same question is refused with 409', async () => {
    arrange({ answered: { answer_id: 1 } });
    await expect(gameplay.submitAnswer('123456', { question_id: 3, choice_index: 1 }, USER))
      .rejects.toMatchObject({ status: 409, code: 'ALREADY_ANSWERED' });
    expect(gameplayRepository.saveAnswerAndAddStars).not.toHaveBeenCalled();
  });

  test('a correct answer after about 4 s saves 5 stars', async () => {
    arrange();
    const result = await gameplay.submitAnswer('123456', { question_id: 3, choice_index: 1 }, USER);
    expect(result).toMatchObject({ correct: true, stars_earned: 5, late: false });
    expect(gameplayRepository.saveAnswerAndAddStars).toHaveBeenCalledTimes(1);
    expect(gameplayRepository.saveAnswerAndAddStars.mock.calls[0][0]).toMatchObject({
      player_id: 7,
      question_id: 3,
      stars_earned: 5,
    });
  });

  test('an answer after the time limit earns 0 stars and is marked late', async () => {
    arrange({ session: { question_started_at: new Date(Date.now() - 40000) } });
    const result = await gameplay.submitAnswer('123456', { question_id: 3, choice_index: 1 }, USER);
    expect(result).toMatchObject({ correct: false, stars_earned: 0, late: true });
  });
});

describe('leaderboard (shared ranks)', () => {
  const player = (id, nickname, total_stars) => ({ player_id: id, nickname, total_stars });

  beforeEach(() => {
    sessionService.findOrFail.mockResolvedValue({ session_id: 1 });
    playerRepository.findAllBySession.mockResolvedValue([
      player(1, 'Ana', 3),
      player(2, 'Rina', 9),
      player(3, 'Dale', 5),
      player(4, 'Pao', 5),
    ]);
  });

  test('equal scores share a rank and the next rank skips: 1, 2, 2, 4', async () => {
    const board = await gameplay.leaderboard('123456', 10);
    expect(board.map((row) => [row.nickname, row.rank])).toEqual([
      ['Rina', 1], ['Dale', 2], ['Pao', 2], ['Ana', 4],
    ]);
  });

  test('the limit cuts the list after ranking', async () => {
    const board = await gameplay.leaderboard('123456', 2);
    expect(board).toHaveLength(2);
    expect(board[0].nickname).toBe('Rina');
  });
});
