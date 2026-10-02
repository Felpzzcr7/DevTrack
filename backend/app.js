const express = require("express");
const cors = require("cors");

const { init } = require("./database/db");
const authRoutes = require("./routes/authRoutes");
const studyRoutes = require("./routes/studyRoutes");

const app = express();

app.use(cors());
app.use(express.json());

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
  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor." });
});

module.exports = app;