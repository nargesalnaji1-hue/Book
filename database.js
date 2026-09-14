import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDirectory = path.join(__dirname, '../data');
fs.mkdirSync(dataDirectory, { recursive: true });

export function createDatabase(filename = path.join(dataDirectory, 'books.db')) {
  const database = new Database(filename);
  database.pragma('foreign_keys = ON');
  database.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL CHECK (length(trim(title)) > 0),
      author TEXT NOT NULL CHECK (length(trim(author)) > 0),
      genre TEXT NOT NULL CHECK (length(trim(genre)) > 0),
      published_year INTEGER NOT NULL CHECK (published_year BETWEEN 0 AND 2100),
      available INTEGER NOT NULL DEFAULT 1 CHECK (available IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return database;
}

export const database = createDatabase();
