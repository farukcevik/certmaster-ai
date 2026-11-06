# Database

The database is `certmaster.db` under Electron's `app.getPath('userData')`. SQLite runs with foreign keys, WAL journaling, and a five-second busy timeout.

## Core entities

- `certification_providers`, `certifications`, `categories`
- `questions`, `question_options`, `question_images`, `tags`, `question_tags`
- `question_translations`, `terminology_dictionary`
- `exam_sessions`, `exam_session_questions`, `question_attempts`, `bookmarks`
- `translation_jobs`, `import_jobs`, `application_settings`

Original question text/options are independent from translations. Correctness belongs only to original option rows. Translations map by immutable option ID.

## Migrations

`schema_migrations` records monotonically increasing migrations. A migration is applied inside a transaction at startup. Add future migrations to `electron/database/migrations.ts`; never modify an already released migration.

## Backup and restore

Before backup, WAL is checkpointed and truncated. The database file is copied and hashed with SHA-256. Restore first opens the candidate read-only, runs `PRAGMA integrity_check`, and verifies the expected application schema. Only then does it replace the active database.

API credentials are encrypted with the source operating system account's secure storage. A backup moved to another machine may contain an unreadable encrypted credential; the user should enter cloud keys again.
