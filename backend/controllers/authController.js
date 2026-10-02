const { db } = require("../database/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");

exports.register = async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "A senha precisa ter pelo menos 6 caracteres" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.execute({
      sql: "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      args: [name, email, hashedPassword],
    });

    res.status(201).json({
      message: "Usuário registrado com sucesso",
      userId: Number(result.lastInsertRowid),
    });
  } catch (err) {
    if (String(err.message).includes("UNIQUE")) {
      return res.status(409).json({ error: "Esse e-mail já está cadastrado" });
    }
    console.error(err);
    res.status(500).json({ error: "Erro ao registrar usuário" });
  }
};

exports.login = async (req, res) => {
  const email = String(req.body.email || "").trim();
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.status(400).json({ error: "Informe e-mail e senha" });
  }

  try {
    const result = await db.execute({
      sql: "SELECT * FROM users WHERE lower(email) = lower(?)",
      args: [email],
    });
    const user = result.rows[0];

    // mesma mensagem nos dois casos, para não revelar quais e-mails existem
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "E-mail ou senha incorretos" });
    }

    const token = jwt.sign({ id: Number(user.id), email: user.email }, JWT_SECRET, { expiresIn: "30d" });

    res.json({ message: "Login realizado com sucesso", token, name: user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
};