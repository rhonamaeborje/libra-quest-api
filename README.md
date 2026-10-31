Libra Quest API

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

## Setup

```
git clone [repository-url]
cd [folder-name]
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
| DB_NAME | your_game_slug | Database name: your game slug, with underscores |
| DB_USER | postgres | Database user |
| DB_PASSWORD | (your own) | Database password. Never commit this. |
| HUB_API_KEY | dev-hub-key | Key the Library Game Hub sends to read results. The library gives the real one at deployment. |

## Endpoints (Hub Contract v1.2)

Base URL: `http://localhost:3001/api/v1`

| Method | Path | Purpose | Success |
|---|---|---|---|
| GET | /health | Is the API up and can it reach the database? | 200 (503 when the database is down) |
| GET | /game-info | Slug, name, group, developer, description, player limits, version | 200 |
| GET | /results | Finished games, every player, and the top 3. Needs the `X-Hub-Key` header. Optional `?since=` | 200 (401 without the key) |

## What "completed" means in my game

[One or two sentences: when does a player count as having completed a game? For example: "A player completed the game when they answered every question, even if some answers were wrong or timed out."]

## Tables

[List your tables, one line each, in the order of your migrations.]

## Database scripts

| Command | What it does |
|---|---|
| npm run db:migrate | Runs migrations that have not run yet |
| npm run db:migrate:status | Lists every migration as up or down |
| npm run db:seed | Loads the seed data |
| npm run db:check | Counts the rows in every table |
| npm run db:reset | Empties the database, rebuilds every table and reloads the seed data |
| npm run check | Runs the same automatic check that GitHub runs after every push |


## API endpoints (Week 11)

Base URL: `http://localhost:3001/api/v1`

| Verb | URL | Who may call it | Success |
|---|---|---|---|
| GET | /health | Anyone | 200 |
| GET | /game-info | Anyone | 200 |
| GET | /results | The library (X-Hub-Key header) | 200 |
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

Until Week 12, the caller is identified with the header `X-Demo-User: <school_id>`.

**Rule for "completed":** a player has completed a game when they have answered every question of that game's question set (built in Week 13).