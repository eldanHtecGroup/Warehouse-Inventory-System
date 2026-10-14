import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import config from '../config/index.js';

if (config.dbPath !== ':memory:') {
  fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
}

const db = new Database(config.dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(fs.readFileSync(path.join(import.meta.dirname, 'schema.sql'), 'utf8'));

// SQL expression producing the same ISO-8601 timestamp format as the column defaults
export const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

export default db;
