# server

A REST API built with Axum, sqlx (Postgres), argon2, and JWT auth.

## Stack

- **Axum** + **Tokio** — HTTP server / async runtime
- **sqlx** — Postgres access via `query!`/`query_as!` only (compile-time
  checked against the real schema — no raw runtime-checked queries anywhere)
- **argon2** — password hashing
- **jsonwebtoken** — 15-minute access tokens
- **validator** — request payload validation
- **tower_governor** — in-memory per-IP rate limiting on `/login`

## Setup

1. Copy `.env.example` to `.env` and fill in real values:

   ```
   DATABASE_URL=postgres://user:password@host:5432/dbname
   JWT_SECRET=<a long random string, e.g. `openssl rand -hex 32`>
   PORT=8080
   ```

   `DATABASE_URL` needs to point at a real, reachable Postgres instance —
   this project targets a remote/managed Postgres (e.g. Supabase), not a
   local or dockerized one. Note that `sqlx::query!`/`query_as!` connect to
   this database **at compile time** too, to check your SQL against the
   real schema — the project won't build without a reachable database once
   any query-using code exists.

2. Install `sqlx-cli` (one-time, global) and run migrations:

   ```
   cargo install sqlx-cli --no-default-features --features rustls,postgres
   sqlx migrate run
   ```

3. Run the server:

   ```
   cargo run
   ```

   `GET /health` should return `200 OK`.

## Running tests

```
cargo test
```

Integration tests use the `#[sqlx::test]` macro: each test function gets
its own freshly migrated, isolated database, created and torn down
automatically against whatever `DATABASE_URL` points to — no Docker or
testcontainers needed. This does require the DB role in `DATABASE_URL` to
have `CREATEDB` privilege (most managed Postgres providers grant this to
the default role by default; check your provider's docs if `cargo test`
fails with a permissions error on database creation).

## API

| Method | Path       | Auth | Description                     |
|--------|------------|------|----------------------------------|
| GET    | `/health`  | no   | Liveness check                   |
| POST   | `/register`| no   | Create an account                |
| POST   | `/login`   | no   | Get a 15-minute access token (rate-limited) |
| GET    | `/me`      | yes  | Current user's profile           |
| POST   | `/notes`   | yes  | Create a note                    |
| GET    | `/notes`   | yes  | List your notes                  |
| GET    | `/notes/:id` | yes | Get one of your notes            |
| PUT    | `/notes/:id` | yes | Update one of your notes         |
| DELETE | `/notes/:id` | yes | Delete one of your notes         |

Protected routes take `Authorization: Bearer <access_token>`. All error
responses have the shape `{ "error": "message" }`.

## Project layout

```
src/
  main.rs           binary entry point — loads config, wires everything, serves
  lib.rs            library crate root (so integration tests can build the real router)
  config.rs         typed env-var loading
  db.rs             Postgres connection pool
  errors.rs         AppError — the one error type every handler returns
  auth/
    jwt.rs          access token issue/verify
    password.rs     argon2 hash/verify
  models/           DB row <-> API response types
  routes/           one file per resource
  middleware/
    auth_guard.rs   CurrentUser extractor (protects a route by being in its signature)
  extractors/
    valid_json.rs   JSON body extractor that also runs `validator` checks
migrations/         plain .sql files, applied with `sqlx migrate run`
tests/              integration tests against a real (ephemeral) database
```
