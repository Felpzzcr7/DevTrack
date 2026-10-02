const { db } = require("../database/db");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

exports.createStudy = async (req, res) => {
  const { technology, description, date } = req.body;
  const hours = Number(req.body.hours);
  const userId = req.user.id;

  if (!technology || !String(technology).trim() || req.body.hours === undefined || !date) {
    return res.status(400).json({ error: "Tecnologia, horas e data são obrigatórios!" });
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
    const result = await db.execute({
      sql: `INSERT INTO study_sessions (user_id, technology, hours, description, date)
            VALUES (?, ?, ?, ?, ?)`,
      args: [userId, String(technology).trim().slice(0, 60), hours, description ?? null, date],
    });

    res.status(201).json({
      message: "Estudo registrado com sucesso! 🔥",
      alert: warningMessage,
      studyId: Number(result.lastInsertRowid),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao salvar o estudo no banco." });
  }
};

exports.getStudies = async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT * FROM study_sessions WHERE user_id = ? ORDER BY date DESC, id DESC`,
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
      sql: `DELETE FROM study_sessions WHERE id = ? AND user_id = ?`,
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
      sql: `SELECT date, hours, technology FROM study_sessions WHERE user_id = ? ORDER BY date DESC`,
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