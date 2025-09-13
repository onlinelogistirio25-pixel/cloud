const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data.db');

async function openDb() {
  const db = await open({ filename: DB_PATH, driver: sqlite3.Database });
  return db;
}

async function initDb() {
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
  const db = await openDb();
  await db.exec(`
    CREATE TABLE clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      name TEXT,
      password_hash TEXT
    );

    CREATE TABLE files (
  id TEXT PRIMARY KEY,
  client_id INTEGER,
  original_name TEXT,
  storage_name TEXT,
  size INTEGER,
  mime TEXT,
  upload_date INTEGER,
  use_s3 INTEGER DEFAULT 0,
  FOREIGN KEY(client_id) REFERENCES clients(id)
    );
  `);

  const salt = await bcrypt.genSalt(10);
  const p1 = await bcrypt.hash('demo2024', salt);
  const p2 = await bcrypt.hash('client2024', salt);
  await db.run('INSERT INTO clients (code, name, password_hash) VALUES (?, ?, ?)', 'DEMO123', 'Γιάννης Παπαδόπουλος', p1);
  await db.run('INSERT INTO clients (code, name, password_hash) VALUES (?, ?, ?)', 'CLIENT456', 'Μαρία Κωνσταντίνου', p2);
  await db.close();
}

module.exports = { openDb, initDb };
