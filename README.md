# Libra Quest API

Backend API for Libra Quest, a tournament game for the SorSU Bulan Campus library.
CS 313 Software Engineering 1, A.Y. 2026-2027.

- Developer: Rhona Mae Borje (rhonamaeborje), BSCS 3-2
- Group and game concept: Group 5

This is my own build of my group's game concept. Every commit in this repository was made by me, with Git, on my own computer or in my own Codespace.

## Tech stack

| Layer | Tool |
|---|---|
| Runtime | Node.js 22 LTS or newer |
| Web framework | Express 5 |
| Database | PostgreSQL 16 or newer |
| ORM and migrations | Sequelize 6 with sequelize-cli |
| Validation and logging | express-validator, morgan |
| API testing | Postman |

## Setup

```
git clone https://github.com/rhonamaeborje/libra-quest-api.git
cd libra-quest-api
npm install
```

Copy `.env.example` to `.env`, then put your own PostgreSQL password in `DB_PASSWORD`.

```
npm run db:create     (first time only)
npm run db:migrate
npm run db:seed
npm run db:check
npm run dev
```

## Environment variables

| Key | Example | Purpose |
|---|---|---|
| NODE_ENV | development | Which config block to use |
| PORT | 3001 | Port the API listens on (the library assigns the final port at deployment) |
| DB_HOST | 127.0.0.1 | PostgreSQL host |
| DB_PORT | 5432 | PostgreSQL port |
| DB_NAME | libra_quest | Database name |
| DB_USER | postgres | Database user |
| DB_PASSWORD | (your own) | Database password. Never commit this. |
| HUB_API_KEY | dev-hub-key | Key the Library Game Hub sends to read results. The library gives the real one at deployment. |

## API endpoints

Base URL: `http://localhost:3001/api/v1`

Until Week 12, the caller is identified with the header `X-Demo-User: <school_id>`.
This is a temporary stand-in and is not security.

| Verb | URL | Who may call it | Success |
|---|---|---|---|
| GET | /health | Anyone | 200 (503 when the database is down) |
| GET | /game-info | Anyone | 200 |
| GET | /results | The library (`X-Hub-Key` header) | 200 (401 without the key) |
| GET | /question-sets | A host (own sets) or an admin (all sets) | 200 |
| POST | /question-sets | A host or an admin | 201 |
| GET | /question-sets/{id} | The owner host or an admin | 200 |
| PATCH | /question-sets/{id} | The owner host or an admin | 200 |
| DELETE | /question-sets/{id} | The owner host or an admin | 204 |
| POST | /sessions | A host or an admin | 201 |
| GET | /sessions/{code} | Anyone | 200 |
| PATCH | /sessions/{code} | The host of that game or an admin | 200 |
| POST | /sessions/{code}/players | Any known account | 201 (new seat) / 200 (rejoin) |
| GET | /sessions/{code}/players | Anyone | 200 |

Errors always use one shape: `{ "error": { "code": "...", "message": "..." } }`.

## What "completed" means in my game

A player has completed a game when they have answered every question of that game's question set, even if some answers were wrong or timed out. Answering is built in Week 13.

## Tables

1. users
2. question_sets
3. game_sessions
4. questions
5. players
6. answers

## Database scripts

| Command | What it does |
|---|---|
| npm run db:migrate | Runs migrations that have not run yet |
| npm run db:migrate:status | Lists every migration as up or down |
| npm run db:seed | Loads the seed data |
| npm run db:check | Counts the rows in every table |
| npm run db:reset | Empties the database, rebuilds every table and reloads the seed data |
| npm run check | Runs the same automatic check that GitHub runs after every push |

## Testing with Postman

1. Run `npm run db:reset`, then `npm run dev`.
2. In Postman, import `postman/libra-quest-week11.postman_collection.json`.
3. Check the collection variables (`host`, `otherHost`, `player`, `player2`) match the seeded school IDs.
4. Click Run collection. Every test must pass.