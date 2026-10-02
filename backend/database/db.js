const sqlite3 = require("sqlite3").verbose();
const { DB_PATH } = require("../config");

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("Erro ao conectar ao banco:", err.message);
  } else {
    console.log("Conectado ao SQLite em", DB_PATH);
  }
});

db.serialize(() => {
  // WAL = melhor desempenho e menos risco de corrupção; foreign_keys liga as FKs
  db.run("PRAGMA journal_mode = WAL");
  db.run("PRAGMA foreign_keys = ON");

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS study_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      technology TEXT NOT NULL,
      hours REAL NOT NULL,
      description TEXT,
      date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run("CREATE INDEX IF NOT EXISTS idx_study_user_date ON study_sessions(user_id, date)");
});

module.exports = db;
