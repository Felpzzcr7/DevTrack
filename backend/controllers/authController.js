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

// ---------- Perfil: foto e bio ----------

const MAX_BIO_LENGTH = 280;
const MAX_AVATAR_LENGTH = 150000; // caracteres do data URL (~110 KB); o app envia ~20-40 KB

// Só imagens raster. SVG fica de fora de propósito: pode carregar script.
const AVATAR_RE = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

// Confere os primeiros bytes do arquivo ("assinatura"), para o conteúdo bater com o tipo declarado
function matchesSignature(type, base64) {
  const head = Buffer.from(base64.slice(0, 24), "base64");
  if (type === "jpeg") return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  if (type === "png") return head.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  // webp: "RIFF" .... "WEBP"
  return head.toString("ascii", 0, 4) === "RIFF" && head.toString("ascii", 8, 12) === "WEBP";
}

// Dados públicos do perfil do usuário logado
exports.getMe = async (req, res) => {
  try {
    const { rows } = await db.execute({
      sql: "SELECT id, name, bio, avatar FROM users WHERE id = ?",
      args: [req.user.id],
    });
    if (!rows[0]) return res.status(404).json({ error: "Usuário não encontrado." });
    res.json({ id: Number(rows[0].id), name: rows[0].name, bio: rows[0].bio, avatar: rows[0].avatar });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar o perfil." });
  }
};

exports.updateBio = async (req, res) => {
  const bio = String(req.body.bio ?? "").replace(/\r\n/g, "\n").trim();

  if (Array.from(bio).length > MAX_BIO_LENGTH) {
    return res.status(400).json({ error: `A bio pode ter no máximo ${MAX_BIO_LENGTH} caracteres.` });
  }

  try {
    await db.execute({ sql: "UPDATE users SET bio = ? WHERE id = ?", args: [bio || null, req.user.id] });
    res.json({ bio: bio || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao salvar a bio." });
  }
};

exports.updateAvatar = async (req, res) => {
  const avatar = String(req.body.avatar ?? "");

  if (avatar.length > MAX_AVATAR_LENGTH) {
    return res.status(413).json({ error: "A foto é muito grande. Tente outra imagem." });
  }
  const match = AVATAR_RE.exec(avatar);
  if (!match || !matchesSignature(match[1], match[2])) {
    return res.status(400).json({ error: "Imagem inválida. Use uma foto JPG, PNG ou WebP." });
  }

  try {
    await db.execute({ sql: "UPDATE users SET avatar = ? WHERE id = ?", args: [avatar, req.user.id] });
    res.json({ avatar });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao salvar a foto." });
  }
};

exports.deleteAvatar = async (req, res) => {
  try {
    await db.execute({ sql: "UPDATE users SET avatar = NULL WHERE id = ?", args: [req.user.id] });
    res.json({ avatar: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao remover a foto." });
  }
};
