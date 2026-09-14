PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS graph_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS entities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE TABLE IF NOT EXISTS attributes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ident TEXT NOT NULL UNIQUE,
  value_type TEXT NOT NULL,
  cardinality TEXT NOT NULL CHECK (cardinality IN ('one', 'many')),
  indexed INTEGER NOT NULL DEFAULT 0,
  unique_value INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation_uuid TEXT NOT NULL,
  committed_at INTEGER NOT NULL,
  source TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS datoms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  e INTEGER NOT NULL,
  a INTEGER NOT NULL,
  value_type TEXT NOT NULL,
  value_text TEXT,
  value_number REAL,
  value_integer INTEGER,
  value_entity INTEGER,
  tx INTEGER NOT NULL,
  added INTEGER NOT NULL CHECK (added IN (0,1)),
  FOREIGN KEY (e) REFERENCES entities(id),
  FOREIGN KEY (a) REFERENCES attributes(id),
  FOREIGN KEY (value_entity) REFERENCES entities(id),
  FOREIGN KEY (tx) REFERENCES transactions(id)
);

CREATE INDEX IF NOT EXISTS datoms_ea ON datoms(e, a);
CREATE INDEX IF NOT EXISTS datoms_av_text ON datoms(a, value_text);
CREATE INDEX IF NOT EXISTS datoms_av_number ON datoms(a, value_number);
CREATE INDEX IF NOT EXISTS datoms_av_entity ON datoms(a, value_entity);
CREATE INDEX IF NOT EXISTS datoms_tx ON datoms(tx);

CREATE TABLE IF NOT EXISTS current_one (
  e INTEGER NOT NULL,
  a INTEGER NOT NULL,
  datom_id INTEGER NOT NULL,
  PRIMARY KEY (e, a),
  FOREIGN KEY (datom_id) REFERENCES datoms(id)
);

CREATE TABLE IF NOT EXISTS current_many (
  e INTEGER NOT NULL,
  a INTEGER NOT NULL,
  value_key TEXT NOT NULL,
  datom_id INTEGER NOT NULL,
  PRIMARY KEY (e, a, value_key),
  FOREIGN KEY (datom_id) REFERENCES datoms(id)
);
