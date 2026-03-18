const db = require("../database/db");
const bcrypt = require("bcrypt");

exports.register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

        db.run(query, [name, email, hashedPassword], function (err) {
            if (err) {
                return res.status(500).json({ message: "Erro ao registrar usuário", error: err.message });
            }

            res.status(201).json({ message: "Usuário registrado com sucesso", userId: this.lastID });

        });
    } catch (error) {
        res.status(500).json({ message: "Erro ao registrar usuário", error: error.message });
    }   
};

const jwt = require("jsonwebtoken");

exports.login = (req, res) => {
  const { email, password } = req.body;

  const query = `
    SELECT * FROM users WHERE email = ?
  `;

  db.get(query, [email], async (err, user) => {

    if (err) {
      return res.status(500).json({ error: "Erro no servidor" });
    }

    if (!user) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    const senhaValida = await bcrypt.compare(password, user.password);

    if (!senhaValida) {
      return res.status(401).json({ error: "Senha inválida" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      "segredo_super_secreto",
      { expiresIn: "30d" }
    );

    res.json({
      message: "Login realizado com sucesso",
      token,
      name: user.name
    });

  });
};