// Applied on every app startup. All statements are idempotent (IF NOT EXISTS)
// so this doubles as our migration runner for now. If the schema outgrows
// this simple approach, introduce a versioned migrations table/runner then.
export const schema = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS form_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  field_schema TEXT NOT NULL,      -- JSON array of field definitions
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER REFERENCES form_templates(id),
  data TEXT NOT NULL,              -- JSON object of field values for this entry
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_entries_template_id ON entries(template_id);
CREATE INDEX IF NOT EXISTS idx_entries_created_by ON entries(created_by);
`
