# simply-track

A desktop-first client/data tracking app for small, locally owned businesses. Runs fully offline — no internet or cloud service required after install.

## Core requirements

- **Offline-first desktop app.** Installable, runs standalone, no network dependency.
- **Login screen on launch.** Username/password auth, local only.
- **Dashboard** with:
  - Lookup/search across all stored data (any field, partial match, multiple results)
  - New entry creation
  - Intake form editor with custom, user-defined fields
  - Form template manager (save multiple form versions, pick one at intake time)
- **Database** that:
  - Allows duplicate/similar entries (e.g. repeat clients) without blocking
  - Returns all matching records on search, not just one
  - Supports full CRUD (create, read, update, delete) on every record
- **Clean, simple UI.** Minimal chrome, easy for non-technical users.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Desktop shell | **Electron** | Packages a JS/React app as a native, offline desktop install (Win/Mac/Linux) |
| Frontend | **React** | Component-driven UI for dashboard, dynamic forms, search results |
| Backend/runtime | **Node.js** | Runs inside Electron's main process; handles auth, DB access, file I/O |
| Database | **SQLite** | Single-file, zero-install local database — no background service for a non-technical user to manage. See [decisions](#decisions) below. |
| Containerization | **Docker** | Dev/CI only for now — not required on end-user machines |

## Decisions

Settled for now, revisit if requirements change:

1. **Database: SQLite, not PostgreSQL.** The audience is non-technical small-business owners installing a desktop app with no IT support. Postgres means either bundling a portable binary and managing a background process, or requiring Docker — both add moving parts that can fail silently on someone's machine with no one around to debug it. SQLite is a single file, ships embedded in Node via `better-sqlite3` (v13+, which uses Node-API — a prebuilt binary that works across Node and Electron versions with no rebuild step), needs no service to start/stop, and backup is just "copy the file." If we ever need multi-user/server mode (e.g. a shared office database), Postgres is the natural upgrade path then — not before.
2. **Auth model: local hashed-password table.** Username + password stored locally, hashed with bcrypt/argon2. No OS keychain integration for now — simplest, no OS-specific code.
3. **Custom fields storage: JSON column, not EAV.** A `data` JSON column on the entries table beats an EAV (`entry_id`/`field_name`/`field_value`) table — no sprawling joins, and each template's field shape stays self-contained. SQLite queries JSON via its built-in JSON1 functions (`json_extract`, etc.), same idea as Postgres `JSONB`, just without the native indexed type — we'll add generated columns or indexes on the specific fields we search often.

## Data model (draft)

- `users` — id, username, password_hash, created_at
- `form_templates` — id, name, field_schema (JSON), is_default, created_at, updated_at
- `entries` — id, template_id, data (JSON), created_by, created_at, updated_at
- Search runs against `entries.data` (via JSON1 functions) plus any indexed top-level fields (e.g. name, phone) common across templates.

This keeps templates flexible (each one defines its own set of custom fields) while entries stay in one searchable table regardless of which template created them.

## Feature roadmap

**Phase 1 — Foundation**
- Electron + React + Node project scaffold
- Local SQLite setup (`better-sqlite3`) + schema/migrations
- Login screen + local auth

**Phase 2 — Core data**
- Entries table + CRUD API (Node/Electron main process ↔ SQLite)
- Dashboard shell with navigation (Search, New Entry, Forms)
- Basic intake form (fixed fields) wired to create/save entries

**Phase 3 — Search**
- Search bar with any-field, partial-match lookup
- Results list showing all matching entries (including duplicates/repeat clients)
- Entry detail view with edit/delete

**Phase 4 — Custom fields & templates**
- Form builder UI (add/remove/reorder custom fields, set field types)
- Save/name form templates; set a default
- Template picker on new-entry creation

**Phase 5 — Polish**
- UI pass for clarity/simplicity
- Packaging/installers for target OS(es)
- Basic backup/export of the local database

## Getting started

- `npm install`
- `npm run dev` — starts the app.

Lifecycle scripts are disabled (see `.npmrc`) to dodge a known npm bug where any dependency containing a `binding.gyp` file gets an unwanted, and unnecessary, `node-gyp rebuild` forced on it during install (npm/cli#5234) — `better-sqlite3` ships working prebuilt binaries and doesn't need it. This also means Electron's own binary doesn't auto-download on `npm install`; the `dev`/`build`/`preview`/`start` scripts handle that themselves (`node node_modules/electron/install.js && ...`), so a plain `npm install` is still all you need before running any of them.

## Testing

- `npm test` — runs the full suite once. `npm run test:watch` — watch mode.
- Tests run under plain `vitest`/Node — no Electron runtime needed, since `better-sqlite3`'s prebuilt Node-API binary works the same way under both.
- Main-process tests (`src/main/**/*.test.js`) exercise the real SQLite database against a temp file per test, with `electron`'s `app.getPath` mocked to point at it.
- Renderer tests (`src/renderer/**/*.test.jsx`) use `@testing-library/react` in a jsdom environment (opted into per-file via a `// @vitest-environment jsdom` docblock), with `window.api` mocked.

## Contributing / workflow

- Commit early and often, using conventional commit messages (`type(scope): summary`) per the `commit-message` skill.
