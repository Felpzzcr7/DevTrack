const path = require("path");

const remoteUrl = process.env.TURSO_DATABASE_URL;

// Produção (Turso): cliente "web", que usa só fetch e não depende de módulo nativo.
// Desenvolvimento (sem variáveis): um arquivo SQLite local.
const { createClient } = remoteUrl ? require("@libsql/client/web") : require("@libsql/client");

function localFileUrl() {
  const rel = path.relative(process.cwd(), path.join(__dirname, "devtrack.db"));
  return "file:" + rel.split(path.sep).join("/");
}

const db = createClient(
  remoteUrl
    ? { url: remoteUrl.replace(/^libsql:\/\//, "https://"), authToken: process.env.TURSO_AUTH_TOKEN }
    : { url: localFileUrl() }
);

// Cria as tabelas se ainda não existirem. Roda uma vez por "partida" do servidor.
let ready = null;
function init() {
  if (!ready) {
    ready = db
      .batch(
        [
          `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`,
          `CREATE TABLE IF NOT EXISTS study_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            technology TEXT NOT NULL,
            hours REAL NOT NULL,
            description TEXT,
            date DATE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )`,
          "CREATE INDEX IF NOT EXISTS idx_study_user_date ON study_sessions(user_id, date)",
        ],
        "write"
      )
      .catch((err) => {
        ready = null; // tenta de novo na próxima requisição
        throw err;
      });
  }
  return ready;
}

module.exports = { db, init };