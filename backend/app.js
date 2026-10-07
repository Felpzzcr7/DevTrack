const express = require("express");
const cors = require("cors");

const { init } = require("./database/db");
const authRoutes = require("./routes/authRoutes");
const studyRoutes = require("./routes/studyRoutes");

const app = express();

app.use(cors());
// 200kb: o padrão (100kb) é apertado para a foto de perfil, que chega como texto base64
app.use(express.json({ limit: "200kb" }));

app.get("/api/health", (req, res) => res.json({ ok: true }));

// garante que as tabelas existem antes de qualquer rota que use o banco
app.use("/api", async (req, res, next) => {
  try {
    await init();
    next();
  } catch (err) {
    console.error("Erro ao preparar o banco:", err);
    res.status(500).json({ error: "Não foi possível conectar ao banco de dados." });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/studies", studyRoutes);
app.use("/api", (req, res) => res.status(404).json({ error: "Rota não encontrada" }));

app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "O envio é grande demais." });
  }
  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor." });
});

module.exports = app;