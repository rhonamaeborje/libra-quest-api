# Changelog

All notable changes, newest first.

## [1.0.0] (Weeks 15 to 16): SE1 portfolio and first release
- Added the OpenAPI 3 spec (26 operations) and served it as Swagger UI at `/docs`.
- Added Jest and supertest tests: 59 tests in 9 suites (23 unit, 36 HTTP), 64.31% of lines covered.
- Added the GitHub Actions "CS 313 check" and made lines A to N pass.
- Deployed the API to Render with `render.yaml` and the `start:render` script (migrate, create the admin, start the server).
- Wrote the technical spec, data dictionary, API reference, user guide and SE2 hand-off.
- Added the six diagrams: use case, class, sequence, activity, ERD and architecture.
- Updated the README with the test instructions, the live API link and the deploy steps.


## [0.4.0] (Week 14): Automated tests
- Added unit tests for the star rules (5, 3, 1 or 0 stars by speed), the answer rules and the leaderboard ranks.
- Added unit tests for login: a wrong password and an unknown school ID give the same 401 error.
- Added HTTP tests for auth, users, question sets and sessions.
- Added the `npm test` and `npm run test:coverage` scripts and the test database setup.

## [0.3.0] (Week 13): Gameplay
- Added game sessions with a join code, and players who join with a nickname.
- Added answering with server-side timing from `question_started_at`.
- Added the stars rule: 5 stars within 10 seconds, 3 within 20 seconds, 1 later within the limit, 0 for a wrong or late answer.
- Added the leaderboard, where equal scores share a rank (1, 2, 2, 4).
- Added the `/results` endpoint for the Library Game Hub, protected by `X-Hub-Key`.

## [0.2.0] (Week 12): Accounts and question sets
- Added registration, login with a JWT token, and role checks for player, host and admin.
- Added the `scripts/create-admin.js` script, which now also fills `username`.
- Added question sets and questions, with validators, services and repositories.
- Added the migrations and seeders for the database.

## 0.1.0 (Weeks 10 to 11): foundation
- Set up the Express 5 project with routes, controllers, services, repositories and models.
- Added the `/health` and `/game-info` endpoints and one error format: `{ error: { code, message } }`.
- Added helmet, CORS with an allow list, request logging and the `.env` settings.
- Connected Sequelize to PostgreSQL.