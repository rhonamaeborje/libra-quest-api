Libra Quest API
Backend API for Libra Quest, a tournament game for the SorSU Bulan Campus library. CS 313 Software Engineering 1, A.Y. 2026-2027.

Developer: Rhona Mae Borje (rhonamaeborje), BSCS 3-2
Group and game concept: Group 5
This is my own build of my group's game concept. Every commit in this repository was made by me, with Git, on my own computer or in my own Codespace.

Tech stack
Layer	Tool
Runtime	Node.js 22 LTS or newer
Web framework	Express 5
Database	PostgreSQL 16 or newer
ORM and migrations	Sequelize 6 with sequelize-cli
Validation and logging	express-validator, morgan
API testing	Postman
Setup
git clone https://github.com/rhonamaeborje/libra-quest-api.git
cd libra-quest-api
npm install
Copy .env.example to .env, then put your own PostgreSQL password in DB_PASSWORD.

npm run db:create
npm run db:migrate
npm run db:seed
npm run db:check
npm run dev
Environment variables
Key	Example	Purpose
NODE_ENV	development	Which config block to use
PORT	3001	Port the API listens on
DB_HOST	127.0.0.1	PostgreSQL host
DB_PORT	5432	PostgreSQL port
DB_NAME	libra_quest	Database name
DB_USER	postgres	Database user
DB_PASSWORD	your_password	Database password
HUB_API_KEY	dev-hub-key	Library Game Hub key
API Endpoints
Base URL:

http://localhost:3001/api/v1
Until Week 12, the caller is identified with:

X-Demo-User: <school_id>
This is only for the laboratory activities.

Verb	URL	Who may call it	Success
GET	/health	Anyone	200
GET	/game-info	Anyone	200
GET	/results	Library Hub	200
GET	/question-sets	Host/Admin	200
POST	/question-sets	Host/Admin	201
GET	/question-sets/:id	Host/Admin	200
PATCH	/question-sets/:id	Host/Admin	200
DELETE	/question-sets/:id	Host/Admin	204
POST	/sessions	Host/Admin	201
GET	/sessions/:code	Anyone	200
PATCH	/sessions/:code	Host/Admin	200
POST	/sessions/:code/players	Any known account	201 / 200
GET	/sessions/:code/players	Anyone	200
Errors always use one shape:

{
  "error": {
    "code": "...",
    "message": "..."
  }
}
What "completed" means in my game
A player has completed a game when the player has answered every question in the selected question set, regardless of whether answers were correct or incorrect.

Tables
users
question_sets
game_sessions
questions
players
answers
Module 1 - Question Sets
The collection covers the required test cases for:

Create a question set (201)
Validation failure (400)
Invalid JSON (400)
Missing user header (401)
Wrong role (403)
Read question sets (200)
Read one question set (200)
Question set not found (404)
Invalid id format (400)
Update question set (200)
Update by non-owner (403)
Empty update request (400)
Delete question set (204)
Module 2 - Sessions and Joining
The collection covers the required test cases for:

Host starts a session (201)
Player attempts to start a session (403)
Read a session (200)
Invalid session code format (400)
Session code not found (404)
Player joins a session (201)
Same player rejoins a session (200)
Duplicate nickname (409)
Nickname validation failure (400)
Host starts the game (200)
New player joins too late (409)
Invalid status transition (409)
Running the Tests
Start from a clean database:

npm run db:reset
npm run dev
Then:

Import the Week 11 Postman collection.
Verify the collection variables:
host = 12345678
otherHost = 87654321
player = 55555555
player2 = 44444444
Run the entire collection.
Expected result:

Passed: 57
Failed: 0
Database Scripts
Command	What it does
npm run db:migrate	Runs pending migrations
npm run db:migrate:status	Shows migration status
npm run db:seed	Loads seed data
npm run db:check	Counts table rows
npm run db:reset	Rebuilds database and reseeds
npm run check	Runs the same automatic check as GitHub
Testing with Postman
Run:
npm run db:reset
npm run dev
Import:
postman/libra-quest-week11.postman_collection.json
Verify collection variables.

Run the collection.

Expected result:

Passed: 57
Failed: 0