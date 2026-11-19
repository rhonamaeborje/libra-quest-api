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

## M4 · Automated tests and server preparation

## M5 · API documentation and deployment

## M6 · The SE1 portfolio and the release

## M7 · The Test Report