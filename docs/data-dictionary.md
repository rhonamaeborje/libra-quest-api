# Data dictionary

Generated from the database by `npm run docs:dictionary` on 2026-11-21, then described by hand.

### `answers`

| Column | Type | Null | Default | Keys and rules | Description |
|---|---|---|---|---|---|
| `answer_id` | integer | no | auto number | ; PK | [Your description] |
| `player_id` | integer | no |  | FK REFERENCES players(player_id) ON DELETE CASCADE; UNIQUE (unique_answer_per_player_question);  | [Your description] |
| `question_id` | integer | no |  | FK REFERENCES questions(question_id) ON DELETE CASCADE; UNIQUE (unique_answer_per_player_question);  | [Your description] |
| `choice_index` | integer | no |  |  | [Your description] |
| `time_taken` | double precision | no |  |  | [Your description] |
| `correct` | boolean | no |  |  | [Your description] |
| `stars_earned` | integer | no | `0` |  | [Your description] |

### `game_sessions`

| Column | Type | Null | Default | Keys and rules | Description |
|---|---|---|---|---|---|
| `session_id` | integer | no | auto number | ; PK | [Your description] |
| `user_id` | integer | no |  | ; FK REFERENCES users(user_id) ON DELETE CASCADE | [Your description] |
| `set_id` | integer | no |  | ; FK REFERENCES question_sets(set_id) ON DELETE CASCADE | [Your description] |
| `join_code` | character varying(6) | no |  | ; UNIQUE (game_sessions_join_code_key) | [Your description] |
| `status` | character varying(20) | no |  |  | [Your description] |
| `started_at` | timestamp with time zone | yes |  |  | [Your description] |
| `ended_at` | timestamp with time zone | yes |  |  | [Your description] |
| `current_position` | integer | yes |  |  | [Your description] |
| `question_started_at` | timestamp with time zone | yes |  |  | [Your description] |

### `players`

| Column | Type | Null | Default | Keys and rules | Description |
|---|---|---|---|---|---|
| `player_id` | integer | no | auto number | ; PK | [Your description] |
| `session_id` | integer | no |  | UNIQUE (uq_player_nickname); ; FK REFERENCES game_sessions(session_id) ON UPDATE CASCADE ON DELETE CASCADE; UNIQUE (unique_player_per_session_user) | [Your description] |
| `user_id` | integer | yes |  | UNIQUE (unique_player_per_session_user) | [Your description] |
| `nickname` | character varying(255) | no |  | UNIQUE (uq_player_nickname);  | [Your description] |
| `total_stars` | integer | no | `0` |  | [Your description] |
| `createdAt` | timestamp with time zone | yes |  |  | [Your description] |
| `updatedAt` | timestamp with time zone | yes |  |  | [Your description] |

### `question_sets`

| Column | Type | Null | Default | Keys and rules | Description |
|---|---|---|---|---|---|
| `set_id` | integer | no | auto number | ; PK | [Your description] |
| `title` | character varying(80) | no |  |  | [Your description] |
| `description` | text | yes |  |  | [Your description] |
| `subject` | character varying(50) | no |  |  | [Your description] |
| `grade_level` | character varying(20) | no |  |  | [Your description] |
| `user_id` | integer | no | `1` | ; FK REFERENCES users(user_id) ON DELETE CASCADE | [Your description] |
| `picture` | character varying(255) | yes |  |  | [Your description] |

### `questions`

| Column | Type | Null | Default | Keys and rules | Description |
|---|---|---|---|---|---|
| `question_id` | integer | no | auto number | ; PK | [Your description] |
| `set_id` | integer | no |  | UNIQUE (questions_set_position_unique); ; FK REFERENCES question_sets(set_id) ON DELETE CASCADE | [Your description] |
| `question_text` | text | no |  |  | [Your description] |
| `type` | character varying(20) | no |  |  | [Your description] |
| `choices` | json | no |  |  | [Your description] |
| `correct_index` | integer | no |  |  | [Your description] |
| `time_limit_sec` | integer | no |  |  | [Your description] |
| `position` | integer | yes |  | UNIQUE (questions_set_position_unique) | [Your description] |

### `users`

| Column | Type | Null | Default | Keys and rules | Description |
|---|---|---|---|---|---|
| `user_id` | integer | no | auto number | ; PK | [Your description] |
| `username` | character varying(255) | no |  |  | [Your description] |
| `school_id` | character varying(255) | no |  |  | [Your description] |
| `full_name` | character varying(255) | yes |  |  | [Your description] |
| `email` | character varying(255) | yes |  |  | [Your description] |
| `role` | character varying(255) | yes |  |  | [Your description] |
| `createdAt` | timestamp with time zone | no |  |  | [Your description] |
| `updatedAt` | timestamp with time zone | no |  |  | [Your description] |
| `password_hash` | character varying(60) | yes |  |  | [Your description] |

