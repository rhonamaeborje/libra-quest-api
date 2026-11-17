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
| API testing | Postman |

## Setup

```
git clone https://github.com/rhonamaeborje/libra-quest-api.git
cd libra-quest-api
npm install
```

Copy `.env.example` to `.env`, then put your own PostgreSQL password in `DB_PASSWORD`.

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

## API Endpoints

Base URL:

```
http://localhost:3001/api/v1
```

Until Week 12, the caller is identified with:

```
Authorization: Bearer <token>
```

## Demo accounts

Password for every demo account: Libra-Demo-2026

| School ID | Username | Role |
|---|---|---|
| 12345678 | host01 | HOST |
| 87654321 | host02 | ADMIN |
| 55555555 | player01 | PLAYER |
| 44444444 | player02 | PLAYER |

This is a temporary stand-in and is not security.

| Verb | URL | Who may call it | Success |
|---|---|---|---|
| GET | /health | Anyone | 200 |
| GET | /game-info | Anyone | 200 |
| GET | /results | The library (`X-Hub-Key`) | 200 |
| GET | /question-sets | Host/Admin | 200 |
| POST | /question-sets | Host/Admin | 201 |
| GET | /question-sets/:id | Owner Host/Admin | 200 |
| PATCH | /question-sets/:id | Owner Host/Admin | 200 |
| DELETE | /question-sets/:id | Owner Host/Admin | 204 |
| POST | /sessions | Host/Admin | 201 |
| GET | /sessions/:code | Anyone | 200 |
| PATCH | /sessions/:code | Host/Admin | 200 |
| POST | /sessions/:code/players | Any known account | 201 or 200 |
| GET | /sessions/:code/players | Anyone | 200 |

Errors always use one shape:

```
{ "error": { "code": "...", "message": "..." } }
```

## What "Completed" Means in My Game

A player has completed a game when the player has answered every question in the selected question set, regardless of whether the answers were correct or incorrect.

## Tables

1. users
2. question_sets
3. game_sessions
4. questions
5. players
6. answers

## Module 1 - Question Sets

The collection covers the required test cases for:

- Create a question set (201)
- Validation failure (400)
- Invalid JSON (400)
- Missing user header (401)
- Wrong role (403)
- Read question sets (200)
- Read one question set (200)
- Question set not found (404)
- Invalid ID format (400)
- Update question set (200)
- Update by non-owner (403)
- Empty update request (400)
- Delete question set (204)

## Module 2 - Sessions and Joining

The collection covers the required test cases for:

- Host starts a session (201)
- Player attempts to start a session (403)
- Read a session (200)
- Invalid session code format (400)
- Session code not found (404)
- Player joins a session (201)
- Same player rejoins a session (200)
- Duplicate nickname (409)
- Nickname validation failure (400)
- Host starts the game (200)
- New player joins too late (409)
- Invalid status transition (409)

## Running the Tests

Start from a clean database:

```
npm run db:reset
npm run dev
```

Then:

1. Import the Week 11 Postman collection.
2. Verify the collection variables:
   - host = 12345678
   - otherHost = 87654321
   - player = 55555555
   - player2 = 44444444
3. Run the entire collection.

Expected result:

```
Passed: 57 Failed: 0
```

## Database Scripts

| Command | What it does |
|---|---|
| npm run db:migrate | Runs migrations that have not run yet |
| npm run db:migrate:status | Lists every migration as up or down |
| npm run db:seed | Loads the seed data |
| npm run db:check | Counts the rows in every table |
| npm run db:reset | Empties the database, rebuilds every table, and reloads the seed data |
| npm run db:check | Runs the same automatic check that GitHub runs after every push |

## Testing with Postman

1. Run:

```
npm run db:reset
npm run dev
```

2. Import:

```
postman/libra-quest-week11.postman_collection.json
```

3. Check the collection variables (`host`, `otherHost`, `player`, `player2`) match the seeded school IDs.

4. Run the collection.

Expected result:

```
Passed: 57 Failed: 0
```