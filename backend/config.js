const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Onde o arquivo do SQLite fica. Em produção, aponte para um disco/volume
// persistente (ex.: DB_PATH=/data/devtrack.db), senão os dados somem a cada deploy.
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "database", "devtrack.db");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

// Segredo do JWT: usa a variável JWT_SECRET se existir. Se não existir,
// gera um segredo aleatório e guarda ao lado do banco (sobrevive a reinícios).
function loadJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;

  const file = path.join(path.dirname(DB_PATH), ".jwt_secret");
  if (fs.existsSync(file)) return fs.readFileSync(file, "utf8").trim();

  const secret = crypto.randomBytes(48).toString("hex");
  fs.writeFileSync(file, secret, { mode: 0o600 });
  console.warn("JWT_SECRET não definido: gerei um segredo em", file);
  return secret;
}

module.exports = {
  PORT: process.env.PORT || 3000,
  DB_PATH,
  JWT_SECRET: loadJwtSecret(),
};
