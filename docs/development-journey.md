# Development journey: Libra Quest API

Student: Rhona Mae Borje · Section: 3-2 · Group: Group 5

One entry per milestone, written the week you did it. Newest at the bottom.

## M1 · Accounts, passwords and tokens
- Dates worked: Nov 12 to Nov 17, 2026 · Time spent: [3 Hours per Day]
- Goal: Replace the Week 11 `X-Demo-User` header with real accounts: register, log in with a password, get a token, and have roles decide who may do what.
- What I built:
  - Migration `add-password-to-users` and the seeders `demo-passwords` and `demo-admin` (the demo admin is host02, school ID 87654321).
  - `src/security/password.js` (bcrypt) and `src/security/token.js` (JWT).
  - Validators `auth.validator.js` and `user.validator.js`, services `auth.service.js` and `user.service.js`, controllers and routes `auth.routes.js` and `user.routes.js`.
  - Endpoints: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `GET /users`, `PATCH /users/:id/role`.
  - A guard (`requireUser`) on the session read routes, which were open before.
  - One Postman collection, `postman/libra-quest-api.postman_collection.json`, with 4 folders, 38 requests and tests on every request. My latest run: 101 tests passed, 0 failed.
- Evidence: [pull request link] · f6b700c · 66d5fd1 · beff2ef
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

## M3 · Gameplay

## M4 · Automated tests and server preparation

## M5 · API documentation and deployment

## M6 · The SE1 portfolio and the release

## M7 · The Test Report