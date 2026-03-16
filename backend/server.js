const express = require("express");
const cors = require("cors");

require("./database/db");

const authRoutes = require("./routes/authRoutes");
const studyRoutes = require("./routes/studyRoutes");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/studies", studyRoutes);


app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

