PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS graph_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS graph_schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS graph_entities_v1 (id INTEGER PRIMARY KEY AUTOINCREMENT, uuid TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS graph_attributes_v1 (id INTEGER PRIMARY KEY AUTOINCREMENT, ident TEXT NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS graph_transactions_v1 (id INTEGER PRIMARY KEY AUTOINCREMENT, operation_uuid TEXT NOT NULL UNIQUE, fingerprint TEXT NOT NULL, revision INTEGER NOT NULL, source TEXT NOT NULL, metadata_json TEXT NOT NULL, committed_at INTEGER NOT NULL, report_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS graph_datoms_v1 (id INTEGER PRIMARY KEY AUTOINCREMENT, entity_id INTEGER NOT NULL REFERENCES graph_entities_v1(id), attribute_id INTEGER NOT NULL REFERENCES graph_attributes_v1(id), value_json TEXT NOT NULL, value_key TEXT NOT NULL, tx_id INTEGER NOT NULL REFERENCES graph_transactions_v1(id), added INTEGER NOT NULL CHECK (added IN (0, 1)));
CREATE TABLE IF NOT EXISTS graph_current_facts_v1 (entity_id INTEGER NOT NULL, attribute_id INTEGER NOT NULL, value_key TEXT NOT NULL, datom_id INTEGER NOT NULL REFERENCES graph_datoms_v1(id), PRIMARY KEY (entity_id, attribute_id, value_key));
CREATE INDEX IF NOT EXISTS graph_datoms_v1_tx ON graph_datoms_v1(tx_id);
CREATE INDEX IF NOT EXISTS graph_current_facts_v1_entity ON graph_current_facts_v1(entity_id);
