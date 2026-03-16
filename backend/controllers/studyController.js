const db = require("../database/db");


exports.createStudy = (req, res) => {
  const { technology, hours, description, date } = req.body;
  const userId = req.user.id; 

 
  if (!technology || hours === undefined || !date) {
    return res.status(400).json({ error: "Tecnologia, horas e data são obrigatórios!" });
  }

 

  
  if (hours <= 0) {
    return res.status(400).json({ 
      error: "Tempo inválido.", 
      message: "Você não pode registrar tempo negativo ou zerado. Tente novamente!" 
    });
  }

  
  if (hours > 16) {
    return res.status(400).json({ 
      error: "Limite de horas excedido.", 
      message: "Mais de 16 horas em um único dia? Ninguém estuda mais do que isso de forma produtiva. Lembre-se: esta é uma plataforma de uso pessoal. Se você inventar números, está apenas se autossabotando. Jogue limpo com você mesmo!" 
    });
  }

  
  let warningMessage = null;
  if (hours >= 8) {
    warningMessage = "Uau, que maratona! Mas cuidado com o burnout. Consistência vale mais que exaustão. Seja honesto com seu processo!";
  }

  

 
  const query = `
    INSERT INTO study_sessions (user_id, technology, hours, description, date)
    VALUES (?, ?, ?, ?, ?)
  `;

 
  db.run(query, [userId, technology, hours, description, date], function (err) {
    if (err) {
      return res.status(500).json({ error: "Erro ao salvar o estudo no banco." });
    }

    res.status(201).json({
      message: "Estudo registrado com sucesso! 🔥",
      alert: warningMessage, 
      studyId: this.lastID
    });
  });
};

exports.getStudies = (req, res) => {
  
  const userId = req.user.id;

 
  const query = `
    SELECT * FROM study_sessions 
    WHERE user_id = ? 
    ORDER BY date DESC
  `;


  db.all(query, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Erro ao buscar o histórico de estudos." });
    }

   
    res.json(rows);
  });
}; 

// Função para deletar um estudo
exports.deleteStudy = (req, res) => {
  // Pega o ID do estudo 
  const studyId = req.params.id;
  
  // Pega o ID do usuário logado
  const userId = req.user.id;

  // segurança: Deleta o estudo X, desde que o dono seja o Y
  const query = `
    DELETE FROM study_sessions 
    WHERE id = ? AND user_id = ?
  `;

  //  Executa a exclusão
  db.run(query, [studyId, userId], function (err) {
    if (err) {
      return res.status(500).json({ error: "Erro ao tentar deletar o estudo." });
    }

   
    // Se for 0, significa que o estudo não existe ou não pertence a esse usuário.
    if (this.changes === 0) {
      return res.status(404).json({ error: "Estudo não encontrado ou você não tem permissão para apagá-lo." });
    }

    // deu certo!
    res.json({ message: "Estudo deletado com sucesso!" });
  });
};


// gerar as estatísticas do Dashboard
exports.getDashboardStats = (req, res) => {
  const userId = req.user.id;

  // Pega todas as sessões de estudo da mais recente para a mais antiga
  const query = `
    SELECT date, hours FROM study_sessions 
    WHERE user_id = ? 
    ORDER BY date DESC
  `;

  db.all(query, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Erro ao calcular estatísticas." });
    }

    let totalHours = 0;
    let hoursToday = 0;

      // Cria a data atual e recua 3 horas para alinhar com o fuso do Brasil 
    const hoje = new Date();
    hoje.setHours(hoje.getHours() - 3);

    // Pega a data local no formato "YYYY-MM-DD"
    const todayStr = hoje.toISOString().split('T')[0];

    // Array para guardar datas únicas
    const uniqueDates = [];

    // loop nos estudos para calcular as horas e pegar  datas
    rows.forEach(row => {
      totalHours += row.hours; // Soma todas as horas da vida do usuário
      
      if (row.date === todayStr) {
        hoursToday += row.hours; // Soma as horas estudadas hoje
      }

      // Se a data não está na lista de datas únicas,adiciona
      if (!uniqueDates.includes(row.date)) {
        uniqueDates.push(row.date);
      }
    });

    // ALGORITMO DO STREAK
    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(checkDate.getHours() - 3); // Alinhafuso horário da ofensiva

    // Loop infinito(para quando a ofensiva quebrar)
    while (true) {
      // Transforma a data que esta checando no formato "YYYY-MM-DD"
      const checkDateStr = checkDate.toISOString().split('T')[0];

      // Se essa data estiver na lista de dias estudados...
      if (uniqueDates.includes(checkDateStr)) {
        streak++; // Aumenta a ofensiva
        // Volta um dia para checar o dia anterior
        checkDate.setDate(checkDate.getDate() - 1); 
      } else {
        if (streak === 0 && checkDateStr === todayStr) {
          // Volta um dia e tenta de novo 
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break; 
        }
      }
    }

    //  Devolvem o pacote de dados pronto pro Dashboard do React
    res.json({
      totalHours: totalHours,
      hoursToday: hoursToday,
      currentStreak: streak,
      totalDaysStudied: uniqueDates.length
    });
  });
};