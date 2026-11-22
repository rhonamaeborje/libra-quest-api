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
- Evidence: https://github.com/rhonamaeborje/libra-quest-api/pull/5 · 70bcbb9 · 61c6583 · d05749e. Check: lines I and J green.
- Problem I hit: the committed `question.js` model had `time_limit_sec` written twice, with `position` inside the first one. I found it with `git diff` before committing.
- How I solved it: I removed the second `time_limit_sec` and kept `position` next to it in one field list, ran `git diff` again to check that only the intended lines changed, and then committed.
- Decision I made and why:
  - The server measures the time from `question_started_at`. The answer request only carries `question_id` and `choice_index`. My Week 7 design sent `time_taken` from the client, but a client can edit anything it sends. The cost: a slow network counts against the player.
  - Stars: a correct answer earns 5 stars within 10 seconds, 3 stars within 20 seconds, and 1 star later but inside the question's time limit. A wrong answer, or one after the time limit, earns 0. The cost: the brackets are fixed seconds, so a question with a short time limit (5 seconds, for example) can only ever give 5 stars.
  - Players with the same total stars share a rank (1, 2, 2, 4). The cost: the leaderboard does not break ties by speed, so two players with the same stars are shown as equal even if one was faster overall.
  - The leaderboard needs a login, like the other session reads.
- Changes to my design set: The answer request no longer has `time_taken`. The endpoint table gained `GET /sessions/:code/question` and the `current_position` field on `PATCH /sessions/:code`. `game_sessions` gained `current_position` and `question_started_at`. `answers` gained a rule that a player has only one answer per question, and `players.total_stars` starts at 0.
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
- Evidence: https://github.com/rhonamaeborje/libra-quest-api/pull/6 · https://github.com/rhonamaeborje/libra-quest-api/pull/7 · 1c6624c · 2614b55 · e1f326c · d0943c1 · aa1caa8 (check runs green; local check: lines I, J, K and both L lines green)
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
- Dates worked: Nov 19 to Nov 21, 2026 · Time spent: 3 Hours per Day
- Goal: Document every endpoint so anyone can try the API in Swagger UI, put the API live on Render, and prove with a smoke test that the live server works.
- What I built:
  - `src/docs/openapi.yaml`: an OpenAPI 3 document with 26 operations, each with a summary, its parameters, request bodies and every response. It has schemas and the `bearerAuth` and `hubKey` security schemes.
  - `src/routes/docs.routes.js`, mounted in `src/routes/index.js` before `currentUser`, so the docs are public: Swagger UI at `/api/v1/docs/` and the document at `/api/v1/openapi.json`. I switched on `tests/api/docs.api.test.js`, which checks that at least 15 operations each have a summary and responses.
  - Deployment on Render from `render.yaml` (one free web service and one free PostgreSQL database, region Singapore): https://libra-quest-rhonamae.onrender.com/api/v1. The server starts with `npm run start:render`. The four secret values (`HUB_API_KEY`, `CORS_ORIGINS`, `ADMIN_SCHOOL_ID`, `ADMIN_PASSWORD`) were typed in the Render dashboard and are not in Git. `JWT_SECRET` is generated by Render.
  - A Postman environment "Render" and a collection "Libra Quest Live Smoke". It checks `/health` (database up), `/game-info`, `/results` without the Hub key (401), and then logs in as the admin, registers a host, promotes the host and plays a game on the live API. Result: 28 tests passed, 0 failed.
  - README: the `Live API:` line, the check badge, the link to Swagger UI, rows for `/openapi.json` and `/docs/` in the endpoint table, and a "Deploying to Render" section with the limits of the free plan.
- Evidence: https://github.com/rhonamaeborje/libra-quest-api/pull/8 · https://github.com/rhonamaeborje/libra-quest-api/pull/9 · 70af67b · 00e2158 (local check: lines M and N green; the live `/health` answers `"database": "up"`)
- Problem I hit:
  - On the first run of my Postman collection "Libra Quest Live Smoke" (environment "Render"), many tests failed. The admin login (S04) failed with 401 INVALID_CREDENTIALS, so the admin token stayed empty and every request after it (register the host, promote the host, play the game) failed too. One wrong value showed up as many failures.
  - After the README change, the GitHub Actions summary only listed lines A to G, but my own `npm run check` listed A to O. I did not know which one to trust.
- How I solved it:
  - The live admin is made by `scripts/create-admin.js` from the `ADMIN_SCHOOL_ID` and `ADMIN_PASSWORD` values that I typed in the Render dashboard. My Postman environment "Render" has its own `adminSchoolId` and `adminPassword`, and they did not match.
    I copied the exact values from my notes into the Postman environment (no spaces before or after), saved it, checked that "Render" was the selected environment, and ran the collection again. It passed 28 of 28.
  - For the scorecard:
    I read `check.yml`. It does not run the `scripts/ci-check.js` in my repository: on every push it downloads the official `ci-check.js` from the class template, and that file has a `CHECK_WEEK` setting that the instructor raises each week. So GitHub only shows the lines up to the week the instructor has switched on, and my local copy (the Week 12 to 18 kit) shows all of them.
  - I kept using `npm run check` as my own progress check, and I did not touch `check.yml` or `ci-check.js`, because changing them is not allowed.
  - Before I deployed I also looked at the live user list: it had only the accounts I made on the live server, with no demo accounts and no `password_hash`.
  - I used Claude to help me read the errors and to draft the README sections. I ran the smoke test and the check myself.
- Decision I made and why:
  - There is no seed data on the live server, so the first admin comes from `ADMIN_SCHOOL_ID` and `ADMIN_PASSWORD`. My demo password would open accounts on a public API. The cost: the live database starts empty, so I must register the host and the players by hand before I can test a game.
  - The docs routes are public (mounted before `currentUser`), so anyone can read them and use **Authorize** in Swagger UI. The cost: the list of endpoints is visible to strangers, but every protected endpoint still needs a token.
  - I chose Render's free plan because it needs no credit card. The cost: the service sleeps after 15 minutes and takes about a minute to wake, the free database expires after 30 days, and there is no permanent disk, so uploaded cover pictures disappear when the service restarts.
- Render database: created on Nov 18, 2026, expires on December 18, 2026. After that the live data is lost and I must create a new database.
- Changes to my design set: The endpoint table gained `GET /openapi.json` and `GET /docs/`. The deployment diagram changes from "Library Server" to Render (a web service and a managed PostgreSQL database).
- What I would explain to a classmate: OpenAPI describes every path and verb with its parameters, request body and every response it can give, and Swagger UI turns that file into a page where anyone can click **Authorize** and try an endpoint. If the document and the API disagree, the document is the one that is wrong, which is why a test reads it.

## M6 · The SE1 portfolio and the release
- Dates worked: Nov 20 to Nov 21, 2026 · Time spent: 3 Hours per Day
- Goal: Finish the written portfolio that lets another student (SE2) understand, run and extend my API without me, and publish a tagged release `v1.0.0`.
- What I built:
  - `docs/technical-spec.md`: the architecture, the layers, the security choices, the game rules, the testing (59 tests, 64.31% of lines) and a decisions table with the cost of each choice.
  - `docs/data-dictionary.md`: every table and every column with one plain sentence each. `docs/api-reference.md`, `docs/user-guide.md` and `docs/se2-handoff.md`.
  - The six diagrams in `docs/diagrams/`: `use-case.png`, `class.png`, `sequence.png`, `activity.png`, `erd.png` and `architecture.png`, drawn to match the system as built (for example `users.username`, `game_sessions.current_position` and `questions.position`).
  - `CHANGELOG.md` with real entries, newest first, version 1.0.0 (the same as `package.json`).
  - README: the "Documentation (SE1 portfolio)" table that links every document, and the latest test result (59 tests in 9 suites, 64.31% of lines).
  - Removed the leftover debug `console.log` from `src/middlewares/current-user.js`.
  - A release: tag `v1.0.0` and a GitHub Release with the changelog entry.
- Evidence: https://github.com/rhonamaeborje/libra-quest-api/pull/10 · 94e625c · 1aa1498 · c7b18dd · 218be70 (check runs green; local check: lines K to O green)
- Problem I hit:
  - In Swagger UI, **Authorize** answered 401 on every endpoint. I had pasted my school ID, then the sample token from the docs, and then I logged out by mistake.
  - Line O of my local check kept failing because `CHANGELOG.md` and the docs still had the kit's bracket placeholders.
- How I solved it:
  - A token only comes from `POST /auth/login`. I ran **Try it out** and **Execute** on that endpoint, copied the real token from the Server response (it starts with `eyJ` and has two dots), and pasted only that into **Authorize**. After that the protected endpoints answered 200.
  - I searched the whole project for the kit's bracket placeholders and replaced every placeholder in my own files. The other hits (`scripts/ci-check.js`, `scripts/make-data-dictionary.js` and `docs/kit-notes/`) belong to the kit, so I did not touch them.
  - I do not run `npm run docs:dictionary` again, because it would overwrite the table sentences that I wrote by hand.
  - I used Claude to help me draft the documents and to draw the diagrams from my code and database. I checked each fact against my own code, my migrations and my test run.
- Decision I made and why:
  - I wrote the data dictionary by hand, with a sentence for every table and column. The cost: when the database changes, I must update the dictionary myself.
  - The documents state their numbers (59 tests, 64.31% of lines, 26 operations) and the date when the free database expires, so a reader can check them. The cost: those numbers go stale when the code changes, so they need a review at every release.
  - One release, `v1.0.0`, tagged on `main` after the pull request is merged and the whole check is green. The cost: any later fix needs a new version and a new changelog entry.
- Changes to my design set: The ERD and the data dictionary now match the migrations exactly. The deployment diagram shows Render (a web service and a managed PostgreSQL database) instead of "Library Server".
- What I would explain to a classmate: Documentation is a promise about the code. The data dictionary and the diagrams are checked against the real migrations, so SE2 can trust them, and the changelog and the tag tell them exactly which version of the API they are reading.

## M7 · The Test Report