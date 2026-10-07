const { db } = require("../database/db");

/*
 * MODELO DE DADOS E JUNÇÃO (base do Heatmap)
 *
 *   tags(id, nome, usuario_id)                       -> dicionário de assuntos de cada usuário
 *   sessoes_estudo(id, usuario_id, tag_id, data,     -> um estudo; o assunto é só uma referência (tag_id)
 *                  horas, anotacao_livre)
 *
 * Toda leitura faz:  sessoes_estudo s  JOIN  tags t ON t.id = s.tag_id
 * O nome do assunto vem SEMPRE de tags.nome (uma única linha por assunto), e não de um texto
 * digitado a cada estudo. Assim "java", "Java " e "JAVA" viram a mesma tag, e o agrupamento
 * (por dia no heatmap, por tecnologia no perfil) soma tudo no mesmo balde.
 * As consultas devolvem os apelidos (date, hours, technology, description) que o frontend já usa.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_TAG_LENGTH = 60;
const MAX_NOTE_LENGTH = 2000;

// "YYYY-MM-DD" de hoje no fuso do Brasil (UTC-3). Só é usado se o app não enviar a data local.
const brazilToday = () => {
  const d = new Date();
  d.setHours(d.getHours() - 3);
  return d.toISOString().split("T")[0];
};

// Soma/subtrai dias de uma string "YYYY-MM-DD" sem depender do fuso do servidor
const addDays = (dateStr, delta) => {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().split("T")[0];
};

// Remove espaços das pontas e colapsa espaços repetidos: "  Node   JS " -> "Node JS"
const normalizeTagName = (value) => String(value ?? "").trim().replace(/\s+/g, " ");

/*
 * Descobre a tag do estudo (sempre isolada por usuário):
 *   - veio tagId: confere que a tag pertence a este usuário (nunca confia no id do cliente);
 *   - veio tagName: procura pelo nome (sem diferenciar maiúsculas); se não existir, cria.
 * Devolve { id, nome, criada } ou null se o tagId for inválido.
 */
async function findOrCreateTag(userId, { tagId, tagName }) {
  const hasId = tagId !== undefined && tagId !== null && tagId !== "";

  if (hasId) {
    const { rows } = await db.execute({
      sql: "SELECT id, nome FROM tags WHERE id = ? AND usuario_id = ?",
      args: [tagId, userId],
    });
    return rows[0] ? { id: Number(rows[0].id), nome: rows[0].nome, criada: false } : null;
  }

  const findByName = async () => {
    const { rows } = await db.execute({
      sql: "SELECT id, nome FROM tags WHERE usuario_id = ? AND nome = ?", // nome é NOCASE
      args: [userId, tagName],
    });
    return rows[0];
  };

  let row = await findByName();
  if (row) return { id: Number(row.id), nome: row.nome, criada: false };

  // Não existe: INSERT na tabela tags primeiro. OR IGNORE + novo SELECT é seguro contra duas
  // requisições simultâneas criando a mesma tag (a UNIQUE barra a segunda e reaproveitamos a primeira).
  await db.execute({
    sql: "INSERT OR IGNORE INTO tags (nome, usuario_id) VALUES (?, ?)",
    args: [tagName, userId],
  });
  row = await findByName();
  return { id: Number(row.id), nome: row.nome, criada: true };
}

exports.createStudy = async (req, res) => {
  const userId = req.user.id;
  const { tagId, date } = req.body;
  const tagName = normalizeTagName(req.body.tagName);
  const anotacao = String(req.body.anotacao ?? "").trim().slice(0, MAX_NOTE_LENGTH) || null;
  // o tempo é guardado em horas (decimal), mas sempre alinhado a minutos inteiros
  const hours = Math.round(Number(req.body.hours) * 60) / 60;

  if ((!tagId && !tagName) || req.body.hours === undefined || !date) {
    return res.status(400).json({ error: "Tag, tempo e data são obrigatórios!" });
  }

  if (tagName.length > MAX_TAG_LENGTH) {
    return res.status(400).json({ error: `A tag pode ter no máximo ${MAX_TAG_LENGTH} caracteres.` });
  }

  if (!DATE_RE.test(date)) {
    return res.status(400).json({ error: "Data inválida." });
  }

  if (!Number.isFinite(hours) || hours <= 0) {
    return res.status(400).json({
      error: "Tempo inválido.",
      message: "Você não pode registrar tempo negativo ou zerado. Tente novamente!",
    });
  }

  if (hours > 16) {
    return res.status(400).json({
      error: "Limite de horas excedido.",
      message:
        "Mais de 16 horas em um único dia? Ninguém estuda mais do que isso de forma produtiva. Lembre-se: esta é uma plataforma de uso pessoal. Se você inventar números, está apenas se autossabotando. Jogue limpo com você mesmo!",
    });
  }

  let warningMessage = null;
  if (hours >= 8) {
    warningMessage =
      "Uau, que maratona! Mas cuidado com o burnout. Consistência vale mais que exaustão. Seja honesto com seu processo!";
  }

  try {
    // As validações vêm antes de tocar no banco, para um estudo recusado não deixar tag órfã.
    // 1) acha (ou cria) a tag  ->  2) grava o estudo apontando para o tag_id.
    const tag = await findOrCreateTag(userId, { tagId, tagName });
    if (!tag) {
      return res.status(400).json({ error: "Tag inválida." });
    }

    const result = await db.execute({
      sql: `INSERT INTO sessoes_estudo (usuario_id, tag_id, data, horas, anotacao_livre)
            VALUES (?, ?, ?, ?, ?)`,
      args: [userId, tag.id, date, hours, anotacao],
    });

    res.status(201).json({
      message: "Estudo registrado com sucesso! 🔥",
      alert: warningMessage,
      studyId: Number(result.lastInsertRowid),
      tag,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao salvar o estudo no banco." });
  }
};

// Lista as tags do usuário (alimenta as opções do react-select), das mais usadas para as menos.
exports.getTags = async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT t.id, t.nome, COUNT(s.id) AS usos
            FROM tags t
            LEFT JOIN sessoes_estudo s ON s.tag_id = t.id
            WHERE t.usuario_id = ?
            GROUP BY t.id
            ORDER BY usos DESC, t.nome ASC`,
      args: [req.user.id],
    });
    res.json(result.rows.map((row) => ({ ...row })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar as tags." });
  }
};

exports.getStudies = async (req, res) => {
  try {
    const result = await db.execute({
      // JOIN: cada estudo traz o nome oficial da sua tag (alimenta o heatmap e o histórico)
      sql: `SELECT s.id, s.data AS date, s.horas AS hours, s.anotacao_livre AS description,
                   t.id AS tagId, t.nome AS technology
            FROM sessoes_estudo s
            JOIN tags t ON t.id = s.tag_id
            WHERE s.usuario_id = ?
            ORDER BY s.data DESC, s.id DESC`,
      args: [req.user.id],
    });
    res.json(result.rows.map((row) => ({ ...row })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar o histórico de estudos." });
  }
};

exports.deleteStudy = async (req, res) => {
  try {
    // segurança: só apaga se o estudo pertencer ao usuário logado
    const result = await db.execute({
      sql: `DELETE FROM sessoes_estudo WHERE id = ? AND usuario_id = ?`,
      args: [req.params.id, req.user.id],
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Estudo não encontrado ou você não tem permissão para apagá-lo." });
    }
    res.json({ message: "Estudo deletado com sucesso!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao tentar deletar o estudo." });
  }
};

exports.getDashboardStats = async (req, res) => {
  // O app envia a data local do aparelho (?today=YYYY-MM-DD), assim a ofensiva
  // funciona em qualquer fuso horário. Sem isso, usa o horário do Brasil.
  const todayStr = DATE_RE.test(req.query.today || "") ? req.query.today : brazilToday();

  let rows;
  try {
    const result = await db.execute({
      // Mesma junção: as horas de cada dia (heatmap) e de cada assunto (topLanguage) são somadas
      // sobre tags.nome, então variações de grafia já não existem a essa altura.
      sql: `SELECT s.data AS date, s.horas AS hours, t.nome AS technology
            FROM sessoes_estudo s
            JOIN tags t ON t.id = s.tag_id
            WHERE s.usuario_id = ?
            ORDER BY s.data DESC`,
      args: [req.user.id],
    });
    rows = result.rows;
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao calcular estatísticas." });
  }

  let totalHours = 0;
  let hoursToday = 0;
  const hoursPerDay = {};
  const techCount = {};

  rows.forEach((row) => {
    totalHours += row.hours;
    if (row.date === todayStr) hoursToday += row.hours;
    hoursPerDay[row.date] = (hoursPerDay[row.date] || 0) + row.hours;
    if (row.technology) {
      techCount[row.technology] = (techCount[row.technology] || 0) + row.hours;
    }
  });

  const studiedDays = new Set(Object.keys(hoursPerDay));
  const dailyTotals = Object.values(hoursPerDay);
  const maxRecord = dailyTotals.length > 0 ? Math.max(...dailyTotals) : 0;

  let topLanguage = "Nenhuma";
  let maxTechHours = 0;
  for (const [tech, hours] of Object.entries(techCount)) {
    if (hours > maxTechHours) {
      maxTechHours = hours;
      topLanguage = tech;
    }
  }

  // Ofensiva: conta dias seguidos até hoje. Se hoje ainda não teve estudo,
  // começa a contar de ontem (a ofensiva só quebra quando um dia inteiro passa em branco).
  let streak = 0;
  let cursor = studiedDays.has(todayStr) ? todayStr : addDays(todayStr, -1);
  while (studiedDays.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }

  res.json({
    totalHours,
    hoursToday,
    currentStreak: streak,
    totalDaysStudied: studiedDays.size,
    maxRecord,
    topLanguage,
  });
};