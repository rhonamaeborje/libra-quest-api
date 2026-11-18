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
| API testing | Postman (collection with tests) |

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
| DB_NAME | libra_quest | Database name |
| DB_USER | postgres | Database user |
| DB_PASSWORD | your own password | Database password |
| HUB_API_KEY | dev-hub-key | The key the Library Game Hub sends to read results |
| JWT_SECRET | 64 random characters | Signs the login tokens. Never commit it |
| JWT_EXPIRES_IN | 1h | How long a login token lasts |
| CORS_ORIGINS | http://localhost:5173 | The web pages that may read the API's answers |

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
| GET | /question-sets | Host/Admin | 200 |
| POST | /question-sets | Host/Admin | 201 |
| GET | /question-sets/:id | Owner Host/Admin | 200 |
| PATCH | /question-sets/:id | Owner Host/Admin | 200 |
| DELETE | /question-sets/:id | Owner Host/Admin | 204 |
| POST | /sessions | Host/Admin | 201 |
| GET | /sessions/:code | Any logged-in account | 200 |
| PATCH | /sessions/:code | Host/Admin | 200 |
| POST | /sessions/:code/players | Any logged-in account | 201 or 200 |
| GET | /sessions/:code/players | Any logged-in account | 200 |

Errors always use one shape:

```
{ "error": { "code": "...", "message": "..." } }
```

Error codes used by the accounts part:

| Status | Code | When |
|---|---|---|
| 401 | INVALID_CREDENTIALS | Wrong password or unknown school ID (the same answer for both) |
| 401 | AUTH_REQUIRED | No token was sent |
| 401 | INVALID_TOKEN | The token is bad, changed or expired |
| 403 | FORBIDDEN | The role may not do this |
| 409 | SCHOOL_ID_TAKEN, USERNAME_TAKEN, EMAIL_TAKEN | The value is already used |
| 409 | CANNOT_CHANGE_OWN_ROLE | An admin tried to change their own role |

## What "Completed" Means in My Game

A player has completed a game when the player has answered every question in the selected question set, regardless of whether the answers were correct or incorrect.

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

## Testing with Postman

The collection is `postman/libra-quest-api.postman_collection.json`. It has four folders:

1. Log in (run this folder first): logs in a host, an admin and a player, and saves their tokens.
2. Accounts: register, duplicate values (409), weak passwords (400), the same 401 for a wrong password and an unknown school ID, and `/auth/me` with a good, missing, changed and made-up token.
3. Users and roles (admin): list accounts, promote and demote, an admin changing their own role (409), a player or host trying (403).
4. Guards on the Week 11 routes: the roles that may use `/question-sets` and `/sessions`.

Every request has tests (`pm.test`).

How to run it:

1. Start from a clean database:

```
npm run db:reset
npm run dev
```

2. In Postman, import the collection file.
3. Check that the collection variables are `baseUrl = http://localhost:3001/api/v1` and `demoPassword = Libra-Demo-2026`.
4. Right-click the collection, choose **Run collection**, and run it.

Expected result:

```
Tests passed: 101, failed: 0
```

The old Week 11 collection (it used the `X-Demo-User` header) is not used any more. It stays in the Git history.