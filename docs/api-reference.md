# API reference: Libra Quest API 1.0.0

Generated from `src/docs/openapi.yaml` by `npm run docs:api`. Base URL: `/api/v1`. Try every endpoint in Swagger UI at `/api/v1/docs/`.

Every error answers `{ "error": { "code": "...", "message": "..." } }`. "Login" means the header `Authorization: Bearer <token>`.

## Hub Contract

| Method | Path | What it does | Needs | Answers |
|---|---|---|---|---|
| GET | `/health` | Is the API up, and can it reach the database? | nothing | 200, 503 |
| GET | `/game-info` | What the Hub shows about this game | nothing | 200 |
| GET | `/results` | Finished games, every player, and the podium (rule 7) | X-Hub-Key | 200, 400, 401 |

## Accounts

| Method | Path | What it does | Needs | Answers |
|---|---|---|---|---|
| POST | `/auth/register` | Create a PLAYER account | nothing | 201, 400, 409 |
| POST | `/auth/login` | School ID and password in, a token out | nothing | 200, 400, 401 |
| GET | `/auth/me` | The account of the token | login | 200, 401 |

## Users

| Method | Path | What it does | Needs | Answers |
|---|---|---|---|---|
| GET | `/users` | List the accounts (admin only) | login | 200, 401, 403 |
| PATCH | `/users/{id}/role` | Change the role of an account (admin only) | login | 200, 400, 401, 403, 404, 409 |

## Question sets

| Method | Path | What it does | Needs | Answers |
|---|---|---|---|---|
| GET | `/question-sets` | List question sets (a host sees their own, an admin sees all) | login | 200, 400, 401, 403 |
| POST | `/question-sets` | Create a question set | login | 201, 400, 401, 403 |
| GET | `/question-sets/{id}` | Read one question set (owner or admin) | login | 200, 400, 401, 403, 404 |
| PATCH | `/question-sets/{id}` | Change a question set (owner or admin) | login | 200, 400, 401, 403, 404 |
| DELETE | `/question-sets/{id}` | Delete a question set (owner or admin) | login | 204, 400, 401, 403, 404, 409 |
| PUT | `/question-sets/{id}/cover` | Upload the cover picture of a set (owner or admin) | login | 200, 400, 401, 403, 404, 413 |

## Questions

| Method | Path | What it does | Needs | Answers |
|---|---|---|---|---|
| GET | `/question-sets/{id}/questions` | List the questions of a set (owner or admin) | login | 200, 400, 401, 403, 404 |
| POST | `/question-sets/{id}/questions` | Add a question to a set (owner or admin) | login | 201, 400, 401, 403, 404, 409 |
| PATCH | `/question-sets/{id}/questions/{questionId}` | Change a question (owner or admin) | login | 200, 400, 401, 403, 404, 409 |
| DELETE | `/question-sets/{id}/questions/{questionId}` | Delete a question (owner or admin) | login | 204, 400, 401, 403, 404, 409 |

## Sessions

| Method | Path | What it does | Needs | Answers |
|---|---|---|---|---|
| POST | `/sessions` | Open a game for a question set (host or admin) | login | 201, 400, 401, 403, 404 |
| GET | `/sessions/{code}` | Read a game by its join code (any logged-in account) | login | 200, 400, 401, 404 |
| PATCH | `/sessions/{code}` | Start, advance or close a game (host or admin) | login | 200, 400, 401, 403, 404, 409 |
| GET | `/sessions/{code}/players` | List the players of a game (any logged-in account) | login | 200, 400, 401, 404 |
| POST | `/sessions/{code}/players` | Join a game with a nickname (any logged-in account) | login | 200, 201, 400, 401, 404, 409 |

## Gameplay

| Method | Path | What it does | Needs | Answers |
|---|---|---|---|---|
| GET | `/sessions/{code}/question` | The question that is open now (a player in the game, or its host) | login | 200, 400, 401, 403, 404, 409 |
| POST | `/sessions/{code}/answers` | Answer the open question (a player in the game) | login | 201, 400, 401, 403, 404, 409 |
| GET | `/sessions/{code}/leaderboard` | The leaderboard of a game (any logged-in account) | login | 200, 400, 401, 404 |

