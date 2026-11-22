# Data dictionary

Generated from the database by `npm run docs:dictionary` on 2026-11-21, then described by hand.

### `answers`

One answer that one player gave to one question in a game. The server fills every column.

| Column | Type | Null | Default | Keys and rules | Description |
|---|---|---|---|---|---|
| `answer_id` | integer | no | auto number | ; PK | Unique number of the answer, given by the database. |
| `player_id` | integer | no |  | FK REFERENCES players(player_id) ON DELETE CASCADE; UNIQUE (unique_answer_per_player_question);  | The player (seat) that gave the answer. Together with question_id it is unique, so a player has one answer per question. Deleting the player deletes the answer. |
| `question_id` | integer | no |  | FK REFERENCES questions(question_id) ON DELETE CASCADE; UNIQUE (unique_answer_per_player_question);  | The question that was answered. Together with player_id it is unique. Deleting the question deletes its answers. |
| `choice_index` | integer | no |  |  | The position of the choice the player picked, counting from 0 for the first choice. |
| `time_taken` | double precision | no |  |  | Seconds between the moment the question opened (question_started_at) and the moment the server received the answer. The server measures it, never the client. |
| `correct` | boolean | no |  |  | True when the answer earned at least one star, which means it was correct and inside the time limit. A correct answer that arrives late is stored as false. |
| `stars_earned` | integer | no | `0` |  | Stars the server gave for this answer: 5, 3 or 1 for a correct answer by its speed, and 0 for a wrong or late answer. |

### `game_sessions`

One game that a host opens for a question set. Players join it with its six-digit join code.

| Column | Type | Null | Default | Keys and rules | Description |
|---|---|---|---|---|---|
| `session_id` | integer | no | auto number | ; PK | Unique number of the game, given by the database. |
| `user_id` | integer | no |  | ; FK REFERENCES users(user_id) ON DELETE CASCADE | The host who opened the game. Deleting the host deletes the game. |
| `set_id` | integer | no |  | ; FK REFERENCES question_sets(set_id) ON DELETE CASCADE | The question set the game plays. Once a game has used a set, the set is frozen. |
| `join_code` | character varying(6) | no |  | ; UNIQUE (game_sessions_join_code_key) | The six-digit code players type to join. It does not start with 0 and it is unique. |
| `status` | character varying(20) | no |  |  | Where the game is: it waits for players after it is created, it is RUNNING while the questions are played and it is CLOSED once the host ends it. |
| `started_at` | timestamp with time zone | yes |  |  | When the host started the game. Empty until then. |
| `ended_at` | timestamp with time zone | yes |  |  | When the host closed the game. Empty until then. The Library Game Hub reads it as the end time of the game in GET /results. |
| `current_position` | integer | yes |  |  | The position of the question that is open now. Empty until the game starts, and it can only move to the next position. |
| `question_started_at` | timestamp with time zone | yes |  |  | The server's clock reading at the moment the current question opened. The time of every answer is measured from it. |

### `players`

One seat in one game: an account that joined a game with a nickname, and the stars it collected.

| Column | Type | Null | Default | Keys and rules | Description |
|---|---|---|---|---|---|
| `player_id` | integer | no | auto number | ; PK | Unique number of the seat, given by the database. |
| `session_id` | integer | no |  | UNIQUE (uq_player_nickname); ; FK REFERENCES game_sessions(session_id) ON UPDATE CASCADE ON DELETE CASCADE; UNIQUE (unique_player_per_session_user) | The game the player joined. Together with nickname it is unique, so two players of a game never share a nickname, and together with user_id it is unique, so an account has one seat per game. Deleting the game deletes its players. |
| `user_id` | integer | yes |  | UNIQUE (unique_player_per_session_user) | The account that owns the seat. A second join by the same account in the same game returns the same seat. |
| `nickname` | character varying(255) | no |  | UNIQUE (uq_player_nickname);  | The name shown on the leaderboard. It is unique inside one game, and the API accepts 2 to 24 characters. |
| `total_stars` | integer | no | `0` |  | The sum of the stars_earned of the player's answers. It starts at 0 and grows each time an answer is saved. |
| `createdAt` | timestamp with time zone | yes |  |  | When the seat was created, filled in by Sequelize. |
| `updatedAt` | timestamp with time zone | yes |  |  | When the seat last changed, filled in by Sequelize. |

### `question_sets`

A named set of questions that a host builds. A game plays one set.

| Column | Type | Null | Default | Keys and rules | Description |
|---|---|---|---|---|---|
| `set_id` | integer | no | auto number | ; PK | Unique number of the set, given by the database. |
| `title` | character varying(80) | no |  |  | The name of the set. The column holds up to 80 characters. |
| `description` | text | yes |  |  | An optional longer text about the set. |
| `subject` | character varying(50) | no |  |  | The topic of the set, for example Library skills. The column holds up to 50 characters. |
| `grade_level` | character varying(20) | no |  |  | Who the set is for, for example College. The column holds up to 20 characters. |
| `user_id` | integer | no | `1` | ; FK REFERENCES users(user_id) ON DELETE CASCADE | The host who owns the set, taken from the login token. Only this host or an admin can read or change its questions. Deleting the host deletes the set. |
| `picture` | character varying(255) | yes |  |  | The address of the cover picture, for example /uploads/covers/set-1-abc.png. Empty until a cover is uploaded. |

### `questions`

One multiple-choice question inside a question set.

| Column | Type | Null | Default | Keys and rules | Description |
|---|---|---|---|---|---|
| `question_id` | integer | no | auto number | ; PK | Unique number of the question, given by the database. |
| `set_id` | integer | no |  | UNIQUE (questions_set_position_unique); ; FK REFERENCES question_sets(set_id) ON DELETE CASCADE | The set the question belongs to. Together with position it is unique, so two questions of a set never share a position. Deleting the set deletes its questions. |
| `question_text` | text | no |  |  | The text the player reads. The API accepts 3 to 500 characters. |
| `type` | character varying(20) | no |  |  | The kind of question. Only multiple-choice is used. |
| `choices` | json | no |  |  | A list of 2 to 4 answer texts. The first choice is at position 0. |
| `correct_index` | integer | no |  |  | The position of the one correct choice inside choices. The API never sends it to a player. |
| `time_limit_sec` | integer | no |  |  | How many seconds players have to answer. The API accepts 5 to 120, and the default is 30. |
| `position` | integer | yes |  | UNIQUE (questions_set_position_unique) | The order of the question in its set (1, 2, 3 and so on). The server sets it and closes the gaps after a delete. |

### `users`

An account: a player, a host or an admin.

| Column | Type | Null | Default | Keys and rules | Description |
|---|---|---|---|---|---|
| `user_id` | integer | no | auto number | ; PK | Unique number of the account, given by the database. |
| `username` | character varying(255) | no |  |  | A short unique name for the account. When registration sends none, the server makes one from the school ID, for example user_20249901. |
| `school_id` | character varying(255) | no |  |  | The school ID used to log in, and it is unique. It is 8 digits, or 4 digits, a dash and 4 digits. |
| `full_name` | character varying(255) | yes |  |  | The person's full name. The API accepts 2 to 100 characters. |
| `email` | character varying(255) | yes |  |  | The person's email address, and it is unique. |
| `role` | character varying(255) | yes |  |  | What the account may do: PLAYER, HOST or ADMIN. Registration always gives PLAYER, and only an admin can change it. |
| `createdAt` | timestamp with time zone | no |  |  | When the account was created, filled in by Sequelize. |
| `updatedAt` | timestamp with time zone | no |  |  | When the account last changed, filled in by Sequelize. |
| `password_hash` | character varying(60) | yes |  |  | The bcrypt hash of the password, always 60 characters. The plain password is never stored, and the model hides this column so the API never returns it. It is empty for an account that has no password. |