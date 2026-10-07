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

// Migra o modelo antigo (study_sessions, com o assunto como texto solto) para tags + sessoes_estudo.
// Roda uma única vez: no fim a tabela antiga é renomeada (fica como backup) e nunca mais é lida.
async function migrateLegacySessions() {
  const { rows } = await db.execute(
    "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'study_sessions'"
  );
  if (rows.length === 0) return;

  await db.batch(
    [
      // 1) cada assunto distinto vira uma tag do usuário. O NOCASE + UNIQUE junta "react"/"React";
      //    o ORDER BY MIN(id) faz valer a grafia usada primeiro.
      `INSERT OR IGNORE INTO tags (nome, usuario_id)
         SELECT TRIM(technology), user_id FROM study_sessions
         WHERE TRIM(technology) <> ''
         GROUP BY user_id, TRIM(technology)
         ORDER BY MIN(id)`,
      // 2) cada estudo passa a apontar para a tag (JOIN pelo dono + nome). A nota automática
      //    "Estudo de X", que o app antigo gerava quando o campo ficava vazio, é descartada.
      `INSERT INTO sessoes_estudo (usuario_id, tag_id, data, horas, anotacao_livre, created_at)
         SELECT s.user_id, t.id, s.date, s.hours,
                CASE WHEN s.description = 'Estudo de ' || s.technology THEN NULL ELSE s.description END,
                s.created_at
         FROM study_sessions s
         JOIN tags t ON t.usuario_id = s.user_id AND t.nome = TRIM(s.technology)
         ORDER BY s.id`,
      "ALTER TABLE study_sessions RENAME TO study_sessions_legacy",
    ],
    "write"
  );
}

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
          // Dicionário de tags (folksonomia). Cada usuário tem o seu próprio.
          // COLLATE NOCASE + UNIQUE(usuario_id, nome): "java" e "Java" são a MESMA tag
          // para o mesmo usuário, o que impede o banco de fragmentar o heatmap.
          `CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL COLLATE NOCASE,
            usuario_id INTEGER NOT NULL,
            UNIQUE (usuario_id, nome),
            FOREIGN KEY (usuario_id) REFERENCES users(id)
          )`,
          // Uma linha por estudo. O assunto não é mais um texto solto: é o tag_id.
          // (usuario_id e horas foram adicionados porque o heatmap precisa do dono e da duração.)
          `CREATE TABLE IF NOT EXISTS sessoes_estudo (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            tag_id INTEGER NOT NULL,
            data DATE NOT NULL,
            horas REAL NOT NULL,
            anotacao_livre TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES users(id),
            FOREIGN KEY (tag_id) REFERENCES tags(id)
          )`,
          "CREATE INDEX IF NOT EXISTS idx_sessoes_usuario_data ON sessoes_estudo(usuario_id, data)",
          "CREATE INDEX IF NOT EXISTS idx_sessoes_tag ON sessoes_estudo(tag_id)",
        ],
        "write"
      )
      .then(migrateLegacySessions)
      .catch((err) => {
        ready = null; // tenta de novo na próxima requisição
        throw err;
      });
  }
  return ready;
}

module.exports = { db, init };