# Libra Quest API

Backend API for Libra Quest, a tournament game for the SorSU Bulan Campus library. CS 313 Software Engineering 1, A.Y. 2026-2027.

- Developer: Rhona Mae Borje (rhonamaeborje), BSCS 3-2
- Group and game concept: Group 5

This is my own build of my group's game concept. Every commit in this repository was made by me, with Git, on my own computer or in my own Codespace.

## Tech Stack

| Layer | Tool |
|---|---|
| Runtime | Node.js 22 LTS or newer |
| Web framework | Express 5 |
| Database | PostgreSQL 16 or newer |
| ORM and migrations | Sequelize 6 with sequelize-cli |
| Validation and logging | express-validator, morgan |
| Accounts and security | bcryptjs (password hashes), jsonwebtoken (login tokens), cors, helmet |
| File upload | multer |
| API testing | Postman (collection with tests), newman |
| Automated tests | Jest (unit tests with jest.mock), supertest (HTTP tests) |

## Setup

```
git clone https://github.com/rhonamaeborje/libra-quest-api.git
cd libra-quest-api
npm install
```

Copy `.env.example` to `.env`, then put your own PostgreSQL password in `DB_PASSWORD` and your own secret in `JWT_SECRET`.

Make a secret with:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then:

```
npm run db:create
npm run db:migrate
npm run db:seed
npm run db:check
npm run dev
```

## Environment Variables

| Key | Example | Purpose |
|---|---|---|
| NODE_ENV | development | Which config block to use |
| PORT | 3001 | Port the API listens on (the library assigns the final port at deployment) |
| DB_HOST | 127.0.0.1 | PostgreSQL host |
| DB_PORT | 5432 | PostgreSQL port |
| DB_NAME | libra_quest | Database name (tests use `<DB_NAME>_test`) |
| DB_USER | postgres | Database user |
| DB_PASSWORD | your own password | Database password |
| DATABASE_URL | postgres://user:password@host:5432/name | Optional. On a server, one address replaces the five `DB_` keys |
| DB_SSL | true | Optional. Set to `true` when the database needs SSL (Render's external address) |
| HUB_API_KEY | dev-hub-key | The key the Library Game Hub sends to read results |
| JWT_SECRET | 64 random characters | Signs the login tokens. Never commit it |
| JWT_EXPIRES_IN | 1h | How long a login token lasts |
| CORS_ORIGINS | http://localhost:5173 | The web pages that may read the API's answers |
| ADMIN_SCHOOL_ID | your admin's school ID | Server only. `scripts/create-admin.js` makes the first ADMIN from it |
| ADMIN_PASSWORD | at least 12 characters | Server only. The first admin's password. Never commit it |

## Demo accounts

Password for every demo account: `Libra-Demo-2026`

| School ID | Username | Role |
|---|---|---|
| 12345678 | host01 | HOST |
| 87654321 | host02 | ADMIN |
| 55555555 | player01 | PLAYER |
| 44444444 | player02 | PLAYER |

These accounts exist only in the local seed data. They are never loaded on the live server.

## API Endpoints

Base URL:

```
http://localhost:3001/api/v1
```

### How to log in

1. Send `POST /auth/login` with your school ID and password.
2. The answer has a `token`.
3. Send the token in the header of every protected request:

```
Authorization: Bearer <token>
```

A token lasts 1 hour (`JWT_EXPIRES_IN`). After that, log in again.

- **401**: the API does not know who you are (no token, a bad token, or an expired token).
- **403**: the API knows who you are, but your role may not do this.

### Endpoints

| Verb | URL | Who may call it | Success |
|---|---|---|---|
| GET | /health | Anyone | 200 |
| GET | /game-info | Anyone | 200 |
| GET | /results | The library (`X-Hub-Key`) | 200 |
| POST | /auth/register | Anyone (the new account is always a PLAYER) | 201 |
| POST | /auth/login | Anyone | 200 |
| GET | /auth/me | Any logged-in account | 200 |
| GET | /users | Admin | 200 |
| PATCH | /users/:id/role | Admin (not for their own account) | 200 |
| GET | /question-sets | Host/Admin (a host sees their own sets, an admin sees all) | 200 |
| POST | /question-sets | Host/Admin | 201 |
| GET | /question-sets/:id | Owner Host/Admin (`?include=questions` adds the questions) | 200 |
| PATCH | /question-sets/:id | Owner Host/Admin | 200 |
| DELETE | /question-sets/:id | Owner Host/Admin | 204 |
| PUT | /question-sets/:id/cover | Owner Host/Admin | 200 |
| GET | /question-sets/:id/questions | Owner Host/Admin | 200 |
| POST | /question-sets/:id/questions | Owner Host/Admin | 201 |
| PATCH | /question-sets/:id/questions/:questionId | Owner Host/Admin | 200 |
| DELETE | /question-sets/:id/questions/:questionId | Owner Host/Admin | 204 |
| POST | /sessions | Host/Admin | 201 |
| GET | /sessions/:code | Any logged-in account | 200 |
| PATCH | /sessions/:code | Host/Admin (start, next question with `current_position`, close) | 200 |
| POST | /sessions/:code/players | Any logged-in account | 201 or 200 |
| GET | /sessions/:code/players | Any logged-in account | 200 |
| GET | /sessions/:code/question | A player seated in the game (never shows the correct answer) | 200 |
| POST | /sessions/:code/answers | A player seated in the game | 201 |
| GET | /sessions/:code/leaderboard | Any logged-in account | 200 |

Errors always use one shape:

```
{ "error": { "code": "...", "message": "..." } }
```

### Lists: paging, search and sorting

`GET /question-sets` answers `{ "data": [...], "meta": { "page", "limit", "total", "pages" } }`. An empty list is still 200.

| Query | Default | Rule |
|---|---|---|
| page | 1 | A whole number from 1 |
| limit | 10 | A whole number from 1 to 50 |
| sort | set_id | One of `set_id`, `title`, `subject`, `grade_level` (anything else is 400) |
| order | asc | `asc` or `desc` |
| q | none | Searches title and subject, up to 100 characters |

### Question bank rules

- Only the owner of a set (or an admin) may read or change its questions. Anyone else gets 403.
- A set that a game has already used is frozen: adding, editing or deleting a question answers 409 `SET_IN_USE`.
- A question has 2 to 4 choices and exactly one correct answer, sent as one number `correct_index` that points inside `choices` (the first choice is 0).
- The server sets each question's `position` (1, 2, 3 ...) and closes the gaps after a delete. A client cannot choose it.
- A question is saved together with its position in one database transaction.

Question body:

| Field | Rule |
|---|---|
| question_text | Required for a new question, 3 to 500 characters |
| choices | Required for a new question, a list of 2 to 4 texts of 1 to 100 characters |
| correct_index | Required for a new question, a whole number that points to one of the choices |
| type | Optional, `multiple-choice` |
| time_limit_sec | Optional, 5 to 120, default 30 |

### Cover picture

`PUT /question-sets/:id/cover` takes one picture in a multipart form field named `cover`.

- Only PNG or JPEG, at most 1 MB.
- The server chooses the file name. The answer has `picture`, for example `/uploads/covers/set-5-<random>.png`, and the file is served from that address.
- Uploaded pictures stay in `uploads/covers/` and are not committed to Git.

### Playing a game

1. The host creates a game with `POST /sessions` (`{ "set_id": ... }`). The answer has a 6-digit join code. Players join with `POST /sessions/:code/players` and a nickname.
2. The host sends `PATCH /sessions/:code` with `{ "status": "RUNNING" }`. The first question opens and the server starts its clock (`question_started_at`).
3. A player reads the open question with `GET /sessions/:code/question`. The answer never contains `correct_index`.
4. A player answers with `POST /sessions/:code/answers` and `{ "question_id": ..., "choice_index": ... }`. The request does not carry the time: the server measures it from `question_started_at`, so a client cannot change it. The answer says whether the choice was correct and how many stars it earned.
5. The host moves on with `PATCH /sessions/:code` and `{ "current_position": n }`. Only the next question is allowed (409 `NOT_NEXT_QUESTION`). After the last question, asking for another one is 409 `NO_MORE_QUESTIONS`.
6. The host closes the game with `{ "status": "CLOSED" }`. The library reads the finished game at `GET /results`.

Rules the server checks, in this order, when a player answers:

1. The game must be running (409).
2. The caller must be a player in that game (403).
3. The question must be the one that is open now (409).
4. The choice must be a valid choice of that question (400).
5. A player has one answer per question. A second answer is 409.

Stars (the server decides, never the client):

| When a correct answer arrives | Stars |
|---|---|
| Within 10 seconds | 5 |
| Within 20 seconds | 3 |
| Later, but inside the question's time limit | 1 |
| A wrong answer, or one after the time limit | 0 |

Example: with a 30 second limit, a correct answer at 8 seconds earns 5 stars, at 15 seconds earns 3 stars and at 25 seconds earns 1 star. A correct answer at 31 seconds earns 0.

The leaderboard (`GET /sessions/:code/leaderboard`) ranks players by total stars, highest first. Players with the same total stars share a rank (1, 2, 2, 4).

### Error codes

| Status | Code | When |
|---|---|---|
| 400 | VALIDATION_FAILED | A field is missing or breaks a rule (the answer lists which one) |
| 400 | INVALID_FILE_TYPE | The cover is not a PNG or JPEG |
| 400 | COVER_REQUIRED, INVALID_UPLOAD | No picture, or more than one, in the form field `cover` |
| 401 | INVALID_CREDENTIALS | Wrong password or unknown school ID (the same answer for both) |
| 401 | AUTH_REQUIRED | No token was sent |
| 401 | INVALID_TOKEN | The token is bad, changed or expired |
| 403 | FORBIDDEN | The role may not do this, the set belongs to another host, or the caller is not a player in the game |
| 404 | QUESTION_SET_NOT_FOUND, QUESTION_NOT_FOUND | No such set, or no such question in that set |
| 409 | SCHOOL_ID_TAKEN, USERNAME_TAKEN, EMAIL_TAKEN | The value is already used |
| 409 | CANNOT_CHANGE_OWN_ROLE | An admin tried to change their own role |
| 409 | SET_IN_USE | The set was used by a game, so its questions can no longer change |
| 409 | NOT_NEXT_QUESTION | The host asked for a question that is not the next one |
| 409 | NO_MORE_QUESTIONS | The host asked for a question after the last one |
| 413 | FILE_TOO_LARGE | The cover is bigger than 1 MB |

## What "Completed" Means in My Game

A player has completed a game when the player has answered every question in the selected question set, regardless of whether the answers were correct or incorrect. `GET /results` marks such a player as completed.

## Tables

1. users
2. question_sets
3. game_sessions
4. questions
5. players
6. answers

## Database Scripts

| Command | What it does |
|---|---|
| npm run db:migrate | Runs migrations that have not run yet |
| npm run db:migrate:status | Lists every migration as up or down |
| npm run db:seed | Loads the seed data (including the demo passwords and the demo admin) |
| npm run db:check | Counts the rows in every table |
| npm run db:reset | Empties the database, rebuilds every table, and reloads the seed data |
| npm run check | Runs the same automatic check that GitHub runs after every push |
| npm test | Runs all the Jest tests (unit and HTTP) |
| npm run test:coverage | Runs the tests and writes the coverage report to `coverage/index.html` |
| npm run start:render | Server start: runs the migrations, creates the first admin, starts the API |

## How to run the tests

The tests use Jest and supertest. PostgreSQL must be running and `.env` must be filled in.

1. Install once: `npm install`
2. Run all tests: `npm test`
3. Run them with the coverage report: `npm run test:coverage`

The tests never touch your own data. Jest sets `NODE_ENV=test`, so the API uses the database `<DB_NAME>_test` (for example `libra_quest_test`). Before every run, `tests/setup/global-setup.js` rebuilds that database from the migrations and the seeders.

- `tests/unit/` has the unit tests. They use `jest.mock` instead of the database, for the scoring rule (`starsFor`), the answer rules, the leaderboard ranks and the login rules.
- `tests/api/` has the HTTP tests. Each file sends real requests through the whole app for one module: accounts, users, question sets and sessions.

Latest result: 56 tests passing in 8 suites, 62.84% of lines covered.

## Testing with Postman

The collection is `postman/libra-quest-api.postman_collection.json`. It has six folders and every request has tests (`pm.test`):

1. **Log in (run this folder first)**: logs in a host, an admin and a player, and saves their tokens.
2. **Accounts**: register, duplicate values (409), weak passwords (400), the same 401 for a wrong password and an unknown school ID, and `/auth/me` with a good, missing, changed and made-up token.
3. **Users and roles (admin)**: list accounts, promote and demote, an admin changing their own role (409), a player or host trying (403).
4. **Guards on the Week 11 routes**: the roles that may use `/question-sets` and `/sessions`.
5. **Question bank (QB01 to QB26)**: paging, empty search, bad sort and limit (400), nested questions with the transaction and position rules, one correct answer only (400), include (200), a player and a second host (403), a missing set (404), a set used by a game (409), edit and delete, and the cover upload (good picture, wrong type 400, too big 413). The upload files are in `postman/fixtures/`.
6. **Play a whole game (PG01 to PG26)**: the host makes a set with two questions and starts a game, two players join, and each answers every question. It also checks an answer before the start (409), a second answer (409), someone outside the game (403), the wrong question (409), a bad choice (400), skipping a question (409), moving past the last question (409), the leaderboard, and `/results` with the Hub key listing the game that was played.

How to run it:

1. Start from a clean database:

```
npm run db:reset
npm run dev
```

2. In Postman, import the collection file.
3. Check that the collection variables are `baseUrl = http://localhost:3001/api/v1`, `demoPassword = Libra-Demo-2026` and `hubKey = dev-hub-key`.
4. Right-click the collection, choose **Run collection**, and run it. Do not send requests by hand in between, and run `npm run db:reset` again before every full run.

From the terminal (run it from the project folder, so the upload files are found):

```
npx newman run postman/libra-quest-api.postman_collection.json
```

Expected result:

```
requests: 90   assertions: 162   failed: 0
```

The old Week 11 collection (it used the `X-Demo-User` header) is not used any more. It stays in the Git history.