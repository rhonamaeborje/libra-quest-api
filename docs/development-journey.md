# Development journey: Libra Quest API

Student: Rhona Mae Borje · Section: 3-2 · Group: Group 5

One entry per milestone, written the week you did it. Newest at the bottom.

## M1 · Accounts, passwords and tokens
- Dates worked: Nov 12 to Nov 17, 2026 · Time spent: about 3 hours per day
- Goal: Replace the Week 11 `X-Demo-User` header with real accounts: register, log in with a password, get a token, and have roles decide who may do what.
- What I built:
  - Migration `add-password-to-users` and the seeders `demo-passwords` and `demo-admin` (the demo admin is host02, school ID 87654321).
  - `src/security/password.js` (bcrypt) and `src/security/token.js` (JWT).
  - Validators `auth.validator.js` and `user.validator.js`, services `auth.service.js` and `user.service.js`, controllers and routes `auth.routes.js` and `user.routes.js`.
  - Endpoints: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `GET /users`, `PATCH /users/:id/role`.
  - A guard (`requireUser`) on the session read routes, which were open before.
  - One Postman collection, `postman/libra-quest-api.postman_collection.json`, with 4 folders, 38 requests and tests on every request. My latest run: 101 tests passed, 0 failed.
- Evidence: https://github.com/rhonamaeborje/libra-quest-api/pull/3 · 66d5fd1 · 6693840 · 5e56fef
- Problem I hit: `GET /auth/me` answered 401 "This token is not valid" even though login answered 200. Later, `POST /auth/register` answered 500 INTERNAL_ERROR, and the VS Code terminal showed: `null value in column "username" of relation "users" violates not-null constraint`.
- How I solved it:
  - The 401: the `Token` box in Postman held the `JWT_SECRET` text from my `.env` file, not the token that login gave me. I got a new token from `POST /auth/login` and pasted that. The token starts with `eyJ` and has two dots. The secret does not.
  - The 500: Postman hides the real reason, so I read the terminal. The `users` table has a required `username` column, but my `User` model, validator and register service did not know about it. I added `username` to all three.
  - I used Claude and Copilot to help me read these errors and to draft some of the code. I tested every change myself in Postman.
- Decision I made and why:
  - `username` is optional when registering. If it is missing, the service makes one from the school ID (`user_20249901`). I did this because the official GitHub check registers an account without a username. The cost: a generated username may be less friendly than one the player chooses.
  - The demo ADMIN comes from a seeder, so it exists after `npm run db:reset` and in the GitHub check. The cost: the demo admin only exists in local and check data. The live server will get its first admin another way (in Milestone 4, from environment variables).
  - `GET /sessions/:code` and `GET /sessions/:code/players` now need a login, because a game code can be guessed. The cost: a person who is not logged in can no longer look at a game.
- Changes to my design set: The endpoint table gained `/auth/register`, `/auth/login`, `/auth/me`, `/users` and `/users/:id/role`. `GET /sessions/:code` and `GET /sessions/:code/players` changed from "Anyone" to "Any logged-in account". The `users` table gained `password_hash`. The data dictionary needs one line for it.
- What I would explain to a classmate: 401 means "I do not know who you are" (no token, a bad token, or an expired token), and 403 means "I know who you are, but your role may not do this". A wrong password and an unknown school ID give the same 401 answer, so nobody can use the login form to find out which school IDs have accounts.

## M2 · The question bank
- Dates worked: Nov 18 to Nov 19, 2026 · Time spent: 3 Hours per Daay
- Goal: Let a host manage the questions inside a question set, with paged and searchable lists, and let a host add a cover picture, without ever changing a set that a game has already used.
- What I built:
  - Migration that adds `picture` to `question_sets` and `position` to `questions`, plus the model changes and the associations between question sets, questions and game sessions in `src/models/index.js`.
  - Paged list: `GET /question-sets?page=&limit=&sort=&order=&q=`. It answers `{ data, meta }`. `sort` may only be `set_id`, `title`, `subject` or `grade_level`, and `q` searches title and subject.
  - `GET /question-sets/:id?include=questions` loads the set and its questions in one query.
  - Questions inside a set (`question.validator.js`, `question.repository.js`, `question.service.js`, `question.controller.js`): `GET` and `POST /question-sets/:id/questions`, `PATCH` and `DELETE /question-sets/:id/questions/:questionId`. Only the owner or an admin may use them (403 for others). A set that a game has used answers 409 `SET_IN_USE`. Create, edit and delete run inside `sequelize.transaction`. The server sets `position` and closes the gaps after a delete.
  - Cover upload: `PUT /question-sets/:id/cover` (PNG or JPEG, at most 1 MB, file name chosen by the server). Wrong type answers 400 `INVALID_FILE_TYPE`, too big answers 413 `FILE_TOO_LARGE`. `src/app.js` now serves `/uploads` as static files.
  - Postman: a "Question bank" folder (QB01 to QB26) and the upload fixtures in `postman/fixtures/`. The collection now has 64 requests and 130 assertions. `npx newman run` on a fresh database: 0 failed.
- Evidence: https://github.com/rhonamaeborje/libra-quest-api/pull/4 · 0e7ee22 · d1ddaf7 · f08aa02 · 57bd6f0 (check run #37: everything passed, 27 checks)
- Problem I hit: In the Postman Runner, QB07 failed with `expected undefined to deeply equal 1`, and QB23 failed the same way. The new question had no `position` in the answer.
- How I solved it:
  - The migration had added the column to the database, but my `Question` model did not list `position`, so Sequelize neither saved nor returned it. I added `position` to `src/models/question.js` and ran the folder again. QB07 and QB23 passed.
  - Other Postman failures were not API bugs. An empty `{{setId}}` or `{{usedSetId}}` made the URL wrong (404), so I ran the requests that save those variables first and reset the database before each full run.
  - My Postman version had no Export button. I added the Question bank folder to the exported collection file with a small Node script that Claude helped me write, then ran `newman` myself to check it. I built and ran every request in Postman before that, and I can explain each one.
- Decision I made and why:
  - Choices stay in one JSON array with a single `correct_index`, so "exactly one correct answer" means one number that points inside the array. Sending a list of answers (`correct_indexes`) is a 400. The cost: a choice has no id of its own, so an answer can only store the position of the choice, not a link to it.
  - A set that any game session has used is frozen (409), not copied. The cost: a host cannot fix a typo in a set that was already played, and has to make a new set.
  - `sort` is checked against a fixed list. Column names cannot be sent to the database as parameters, so the list stops a client from sorting by `password_hash` or injecting SQL through the URL. The cost: every new sortable column must be added to the list by hand.
- Changes to my design set: The endpoint table gained `GET` and `POST /question-sets/:id/questions`, `PATCH` and `DELETE /question-sets/:id/questions/:questionId`, and `PUT /question-sets/:id/cover`. `GET /question-sets` now answers `{ data, meta }` instead of a plain list and accepts `page`, `limit`, `sort`, `order` and `q`. `GET /question-sets/:id` accepts `?include=questions`. The ERD and data dictionary gained `question_sets.picture` and `questions.position`.
- What I would explain to a classmate: A transaction saves a group of changes all together or not at all. When I add or delete a question, the question and the positions of its neighbours change in one transaction, so a failure halfway can never leave two questions with the same position or a gap.

## M3 · Gameplay
- Dates worked: Nov 18 to Nov 19, 2026 · Time spent: 4 Hours per Day
- Goal: Let a host run a game: start it, move through the questions one at a time, let players answer against the clock, and show who is winning.
- What I built:
  - Migration that adds `current_position` and `question_started_at` to `game_sessions`, and a rule that a player has one answer per question and starts with zero stars.
  - `gameplay.service.js` (`starsFor`, `currentQuestion`, `submitAnswer`, `leaderboard`), `gameplay.repository.js` and `gameplay.controller.js`.
  - Routes: `GET /sessions/:code/question`, `POST /sessions/:code/answers`, `GET /sessions/:code/leaderboard`, and `PATCH /sessions/:code` now accepts `current_position` (only the next question; 409 `NOT_NEXT_QUESTION`, and 409 `NO_MORE_QUESTIONS` after the last).
  - `/results` now uses the real join code and my "completed" rule: a player completed the game when they answered every question in the set.
  - Postman folder "Play a whole game" (PG01 to PG26). The whole collection now has 90 requests and 162 tests.
- Evidence: [pull request link] · [two or three commit hashes from git log --oneline]. Check: lines I and J green.
- Problem I hit: [for example: the committed `question.js` model had `time_limit_sec` written twice, with `position` inside the first one. I found it with `git diff` before committing.]
- How I solved it: [what you did, in your own words]
- Decision I made and why:
  - The server measures the time from `question_started_at`. The answer request only carries `question_id` and `choice_index`. My Week 7 design sent `time_taken` from the client, but a client can edit anything it sends. The cost: a slow network counts against the player.
  - Stars: [write your rule, for example 5, 3 or 1 star by how fast a correct answer comes, and 0 for a wrong or late answer]. The cost: [for example, the brackets are fixed fractions of the time limit].
  - Ties on the leaderboard are broken by lower total response time, as in my game design.
  - The leaderboard needs a login, like the other session reads.
- Changes to my design set: The answer request no longer has `time_taken`. The endpoint table gained `GET /sessions/:code/question` and the `current_position` field on `PATCH /sessions/:code`. [Add anything else you changed.] Players, answers and sessions gained [name the columns you added].
- AI tools: I used Claude to help with the gameplay design, the Postman folder generated into the collection file (my Postman has no Export), and error reading. I ran and tested every request myself.
- What I would explain to a classmate: The server decides time and score, never the client. Anything a client sends can be edited, so the answer request carries only which question and which choice, and the server works out the stars from its own clock.

## M4 · Automated tests and server preparation
- Dates worked: Nov 19, 2026 (server preparation on `feature/deploy-prep`, then tests on `feature/tests`) · Time spent: 2 Hours for server preparation, 2 Hours for the tests
- Goal: Make the API safe and ready to run on a real server (Render), rehearse the production start on my computer, and add automated tests (Jest and supertest) so every rule is checked without Postman.
- What I built:
  - `src/app.js`: `trust proxy`, `helmet` (with `crossOriginResourcePolicy: cross-origin` so uploaded pictures can load from a frontend), and a `cors` allow list that reads `CORS_ORIGINS`. Check line L is green for both cases: a listed origin is allowed and an unlisted one is refused.
  - `src/config/env.js` and `src/config/database.js`: when `DATABASE_URL` is set, the host, port, name, user and password come from it, so the five `DB_` keys are no longer required. `DB_SSL=true` turns on SSL. When `NODE_ENV` is `test`, the database name becomes `<DB_NAME>_test`, so tests can never touch my real data.
  - `package.json`: the scripts `start:render` (run the migrations, create the first admin, start the server; no seeders on the server), `test` and `test:coverage`, and the `jest` settings.
  - `render.yaml`: named the web service and the database. No secret values are written in the file.
  - `scripts/create-admin.js`: creates the first ADMIN from `ADMIN_SCHOOL_ID` and `ADMIN_PASSWORD`.
  - Production rehearsal on my computer: an empty database (`libra_quest_rehearsal`), `DATABASE_URL`, `NODE_ENV=production` and the admin variables. The migrations ran, the admin was created, `/health` answered 200 with `"database": "up"`, and the admin logged in and got a token.
  - Unit tests with `jest.mock` (`tests/unit/`): `gameplay.service.test.js` checks `starsFor` at its edges (0 ms, 10 s, 1 ms after 10 s, 20 s, 1 ms after 20 s, the limit, 1 ms after the limit, a wrong answer), the answer rules (game not running, no seat, wrong question, bad choice, second answer, and that nothing is saved when a rule refuses) and the shared ranks on the leaderboard. `auth.service.test.js` checks that a wrong password and an unknown school ID throw the same error.
  - HTTP tests with supertest (`tests/api/`): `auth.api.test.js`, `users.api.test.js`, `question-sets.api.test.js` and `sessions.api.test.js`. They check the status and `error.code`, and they run on the test database.
  - README: a "How to run the tests" section, the new environment variables and the scripts.
  - Result: `npm test` passes with 56 tests in 8 suites. `npm run test:coverage` shows 62.84% of lines. Check line K is green.
- Evidence: https://github.com/rhonamaeborje/libra-quest-api/pull/6 · [tests pull request link] · 1c6624c · 2614b55 · e1f326c · d0943c1 · aa1caa8 · [hash of a test commit] · [hash of a test commit] (check runs green; local check: lines I, J, K and both L lines green)
- Problem I hit:
  - In the rehearsal, `npm run start:render` stopped before the API started. The terminal said `create-admin failed: notNull Violation: User.username cannot be null`. The migrations had all run, but the admin was not created.
  - When I started the tests, `git switch -c feature/tests` said the branch already existed, and I still had an uncommitted `package.json`.
  - While writing the README I saw that its stars table said "thirds of the time limit", but my `starsFor` uses fixed limits of 10 s and 20 s.
- How I solved it:
  - The `users` table has a required `username` column. My register code makes a username from the school ID when none is sent, but the kit's `create-admin.js` did not, so the database refused the admin. I added `username: user_` plus the digits of the school ID to the `defaults` in `create-admin.js`, the same rule as register. I ran `npm run start:render` again and the admin was created.
  - I put my change aside with `git stash`, switched to the existing branch, brought it up to date with `git merge main`, and put my change back with `git stash pop`.
  - The code is the truth, so I changed the README table to match it: 5 stars within 10 s, 3 within 20 s, 1 later but inside the limit.
  - I used Claude to help me read the errors and to draft the unit and HTTP tests. I ran every test myself and I can explain what each one checks.
- Decision I made and why:
  - The first admin's username is `user_` plus the school ID digits, the same rule as register, so both kinds of account are built one way. The cost: the admin's username is easy to guess, so the admin's safety depends on a strong password.
  - There are no seeders on the server. My demo password would open accounts on a public API, so the first admin comes from environment variables instead. The cost: the live database starts empty, and I must create the host and the players by hand when I test it.
  - Only the origins in `CORS_ORIGINS` may read the API's answers from a browser. The cost: every new frontend address must be added to that setting.
  - The unit tests replace the repositories with `jest.mock`, so they run in milliseconds and I can check that a refused answer saved nothing. The cost: a mock can drift from the real repository, which is why the HTTP tests also exist.
  - The HTTP tests use the `_test` database, rebuilt before every run. The cost: a run takes about 30 seconds, mostly because every login uses bcrypt.
  - I replaced the kit's `DEMO_PASSWORD` in `tests/setup/helpers.js` with my own demo password, because the kit's value was the AklatArena example's.
- Changes to my design set: none.
- What I would explain to a classmate: CORS only tells a browser which web pages may read the API's answers. curl and Postman ignore it, so it does not protect `/results`; the Hub key does. Coverage shows which lines ran during the tests, not that they are correct: 62.84% means 62.84% of the lines ran.

## M5 · API documentation and deployment

## M6 · The SE1 portfolio and the release

## M7 · The Test Report