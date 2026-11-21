# SE2 handoff: building the Libra Quest frontend

## Connection

| Item | Value |
|---|---|
| Base URL (production) | https://libra-quest-rhonamae.onrender.com/api/v1 |
| Base URL (local) | http://localhost:3001/api/v1 |
| Contract | Hub Contract v1.3; Swagger UI at `/docs/`, `src/docs/openapi.yaml` |
| CORS | Browsers may only read answers for the origins listed in `CORS_ORIGINS`. Add your frontend's address (for example `http://localhost:5173` while developing, and the real address after publishing) to that setting in the Render dashboard, and redeploy. |
| Login | `POST /auth/login` returns a `token`. Keep it in memory or in `sessionStorage` and send `Authorization: Bearer <token>` on every protected request. It lasts 1 hour. On a 401 `INVALID_TOKEN`, remove the token and show the login screen again. Never put the token in a URL. |
| First request | The free server sleeps after 15 minutes without requests and takes about a minute to wake. Call `GET /health` when the app opens, show a "waking up" message, and retry until it answers `"database": "up"`. |

## Screens and the endpoints they use

| Screen | Endpoints |
|---|---|
| Register and log in | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Host: my question sets | `GET /question-sets` (`page`, `limit`, `sort`, `q`), `POST /question-sets`, `PATCH /question-sets/{id}`, `DELETE /question-sets/{id}` |
| Host: question editor | `GET /question-sets/{id}?include=questions`, `POST`, `PATCH` and `DELETE /question-sets/{id}/questions/{questionId}`, `PUT /question-sets/{id}/cover` |
| Host: start a game and show the code | `POST /sessions`, `GET /sessions/{code}/players` |
| Player: join a game | `POST /sessions/{code}/players` |
| Player: question screen with the timer | `GET /sessions/{code}/question`, `POST /sessions/{code}/answers` |
| Host: game control | `PATCH /sessions/{code}` (`RUNNING`, `current_position`, `CLOSED`) |
| Leaderboard | `GET /sessions/{code}/leaderboard` |
| Admin: accounts | `GET /users`, `PATCH /users/{id}/role` |

## Known limits and the SE2 backlog

1. The free Render plan: the server sleeps, the database expires 30 days after it was created, and uploaded covers disappear when it restarts. Move to a paid plan, or keep the covers in cloud storage.
2. There is no real-time push. The frontend must poll `GET /sessions/{code}/question` and the leaderboard, or the API must gain WebSockets or server-sent events.
3. A token lasts 1 hour and there is no refresh token, so the player has to log in again. Add refresh tokens.
4. Only multiple-choice questions exist (`type` is `multiple-choice`). My game design also lists true or false questions.
5. A set that a game has used is frozen. Add an endpoint that copies a set, so a host can fix a played set.
6. There is no password reset, e-mail check or limit on login attempts. Add them before a public launch.
7. Test coverage is about 64% of the lines. The first tests to add are for the cover upload and for the `/results` filters.