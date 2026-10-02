const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");

const { PORT } = require("./config");
require("./database/db");

const authRoutes = require("./routes/authRoutes");
const studyRoutes = require("./routes/studyRoutes");

const app = express();

app.use(cors()); // necessário só no desenvolvimento; em produção front e API ficam na mesma origem
app.use(express.json());

// ---------- API (tudo sob /api) ----------
app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/studies", studyRoutes);
app.use("/api", (req, res) => res.status(404).json({ error: "Rota não encontrada" }));

// ---------- Frontend (build do Vite) ----------
// Se existir frontend/dist, o próprio Express entrega o app: um único serviço para fazer deploy.
const distDir = process.env.FRONTEND_DIST || path.join(__dirname, "..", "frontend", "dist");

if (fs.existsSync(path.join(distDir, "index.html"))) {
  app.use(
    express.static(distDir, {
      setHeaders(res, filePath) {
        const base = path.basename(filePath);
        if (base === "index.html" || base === "sw.js") {
          res.setHeader("Cache-Control", "no-cache"); // sempre checar versão nova do app
        } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable"); // arquivos com hash no nome
        }
      },
    })
  );

  // qualquer rota do React (/historico, /perfil...) devolve o index.html
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.join(distDir, "index.html"));
  });
} else {
  console.log("frontend/dist não encontrado: rodando só a API (use o Vite em modo dev).");
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`DevTrack rodando em http://localhost:${PORT}`);
});
