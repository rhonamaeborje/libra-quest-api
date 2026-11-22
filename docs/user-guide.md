# User guide: Libra Quest API

How each kind of user works with the API. Base URL: https://libra-quest-rhonamae.onrender.com/api/v1. Every endpoint can be tried in Swagger UI at `/docs/`: click **Authorize**, paste a login token, and use **Try it out**. The free server sleeps when nobody uses it, so open `/health` first and wait up to a minute.

## Players

1. Create an account with `POST /auth/register` and your `school_id` (8 digits, or 4 digits, a dash and 4 digits), `full_name`, `email` and `password` (8 to 72 characters with a letter and a number). You may also send a `username`; if you leave it out, the server makes one. The answer is 201 and your role is always PLAYER. A used school ID, username or email answers 409 (`SCHOOL_ID_TAKEN`, `USERNAME_TAKEN`, `EMAIL_TAKEN`), and a weak password answers 400 (`VALIDATION_FAILED`).
2. Log in with `POST /auth/login`. Keep the `token` from the answer and send it in the header `Authorization: Bearer <token>` on every request. It lasts 1 hour. A wrong password or an unknown school ID answers 401 `INVALID_CREDENTIALS`; an old or changed token answers 401 `INVALID_TOKEN`, and you log in again.
3. Join a game with `POST /sessions/{code}/players` and a `nickname` of 2 to 24 characters, using the six-digit code the host shows. The answer is 201. If you join again with the same account, the answer is 200 with your same seat. A game code that does not exist answers 404, and a nickname already taken, or a game that has already started, answers 409.
4. Play. Read the open question with `GET /sessions/{code}/question` (it never shows the correct answer) and answer with `POST /sessions/{code}/answers` and `{ "question_id": ..., "choice_index": ... }`, where the first choice is 0. Send only these two fields: the server measures your time and decides your stars. A correct answer within 10 seconds earns 5 stars, within 20 seconds 3 stars, and later (inside the time limit) 1 star. A wrong or late answer earns 0. You can answer each question once; a second try answers 409 `ALREADY_ANSWERED`. The other refusals are: the game is not running (409 `SESSION_NOT_RUNNING`), you have no seat in that game (403 `FORBIDDEN`), the question is not the open one (409 `NOT_CURRENT_QUESTION`), and a choice that does not exist (400 `INVALID_CHOICE`).
5. Watch the standings with `GET /sessions/{code}/leaderboard` (add `limit` to see only the top players). Players are ranked by total stars, and players with the same total share a rank.

A player has completed a game when they have answered every question in the question set, whether the answers were right or wrong.

## Hosts

1. Prepare the content. An admin must first change your account's role to HOST. Then create a set with `POST /question-sets` (`title`, `subject`, `grade_level`, and an optional `description`) and add questions with `POST /question-sets/{id}/questions`: a `question_text`, 2 to 4 `choices` and exactly one `correct_index` (the number of the right choice, starting at 0). An optional picture goes to `PUT /question-sets/{id}/cover` (PNG or JPEG, at most 1 MB). Only the owner of a set can change it (403 for another host), and a set that a game has used is frozen (409 `QUESTION_SET_IN_USE`). `GET /question-sets` lists your sets, with `page`, `limit`, `sort` and `q`.
2. Start a game with `POST /sessions` and `{ "set_id": ... }`. The answer has the six-digit join code: show it to the players. When they have joined (`GET /sessions/{code}/players` lists them), send `PATCH /sessions/{code}` with `{ "status": "RUNNING" }`. The first question opens. A set with no questions cannot start (409 `SET_HAS_NO_QUESTIONS`).
3. Run the game to the end. Send `PATCH /sessions/{code}` with `{ "current_position": 2 }` to open the next question; you can only ask for the next one (409 `NOT_NEXT_QUESTION`), and after the last question another request answers 409 `NO_MORE_QUESTIONS`. Finish with `{ "status": "CLOSED" }`, and show the final `GET /sessions/{code}/leaderboard`.

## Admins

An admin lists the accounts with `GET /users` and changes a role with `PATCH /users/{id}/role` and `{ "role": "HOST" }` (PLAYER, HOST or ADMIN). An admin cannot change their own role (409 `CANNOT_CHANGE_OWN_ROLE`), and a player or host who tries gets 403. On a new server there are no accounts, so the first admin is created at startup from the settings `ADMIN_SCHOOL_ID` and `ADMIN_PASSWORD`. If that admin already exists, nothing changes, so changing the password setting later does not change a stored password.

## The Library Game Hub

The Hub reads the finished games with `GET /results` and the header `X-Hub-Key`. `GET /results?since=<ISO date and time>` returns only the games that ended after that moment. Each game lists its join code, its players with a flag that says whether each one completed the game, and the podium. Without the key the answer is 401 `HUB_KEY_REQUIRED`, and a `since` that is not a date answers 400 `INVALID_SINCE`.

## When something goes wrong

Every error has one shape: `{ "error": { "code": "...", "message": "..." } }`. Read the `code`, because the message is for people. The codes you are most likely to meet:

| Status | Code | What to do |
|---|---|---|
| 400 | `VALIDATION_FAILED` | A field is missing or breaks a rule. The message says which one. |
| 400 | `INVALID_CHOICE`, `CORRECT_INDEX_OUT_OF_RANGE` | The choice or the correct answer is not one of the choices. |
| 401 | `AUTH_REQUIRED`, `INVALID_TOKEN` | Log in again and send the new token. |
| 401 | `INVALID_CREDENTIALS` | Check the school ID and the password. |
| 403 | `FORBIDDEN` | Your role may not do this, the set belongs to another host, or you have no seat in that game. |
| 404 | `QUESTION_SET_NOT_FOUND`, `QUESTION_NOT_FOUND`, `SESSION_NOT_FOUND` | Check the id or the game code. |
| 409 | `QUESTION_SET_IN_USE`, `NOT_NEXT_QUESTION`, `NO_MORE_QUESTIONS` | The set is frozen, or the host asked for the wrong question. |
| 409 | `SESSION_NOT_RUNNING`, `NOT_CURRENT_QUESTION`, `ALREADY_ANSWERED` | The game is not running, the question is not the open one, or you already answered it. |
| 413 | `FILE_TOO_LARGE` | The cover is over 1 MB. |
| 504 or no answer | none | The free server is asleep. Wait a minute and open `/health`. |