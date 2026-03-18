import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpenText, User, Settings, LogOut, CodeXml, Clock3, AlignLeft, BarChart3, History } from 'lucide-react';

export default function Aprendizado() {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'Dev';

  const [technology, setTechnology] = useState('');
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);


  const [weeklyHours, setWeeklyHours] = useState([0, 0, 0, 0, 0, 0, 0]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch("http://localhost:3000/studies", {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
          const estudos = await response.json();
          processarDadosDoGrafico(estudos);
        }
      } catch (error) {
        console.error("Erro ao carregar gráfico:", error);
      }
    };

    fetchChartData();
  }, []);


  const processarDadosDoGrafico = (estudos) => {
    const horasPorDia = [0, 0, 0, 0, 0, 0, 0]; 
    const hoje = new Date();

    estudos.forEach(estudo => {
      const dataEstudo = new Date(estudo.date + 'T00:00:00');
      const diffDias = Math.floor((hoje - dataEstudo) / (1000 * 60 * 60 * 24));

  
      if (diffDias >= 0 && diffDias < 7) {
        let diaSemana = dataEstudo.getDay(); 
        let indiceAjustado = diaSemana === 0 ? 6 : diaSemana - 1;
        horasPorDia[indiceAjustado] += estudo.hours;
      }
    });

    setWeeklyHours(horasPorDia);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!technology || !hours) return alert("Preencha os campos!");

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch("http://localhost:3000/studies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          technology,
          hours: parseFloat(hours),
          date: new Date().toISOString().split('T')[0],
          description: description || `Estudo de ${technology}`
        }),
      });

      if (response.ok) {
        alert("Estudo registrado!");
        window.location.reload(); 
      }
    } catch (error) {
      alert("Erro na conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      
      {/* BARRA LATERAL */}
      <aside className="w-64 bg-zinc-950 p-8 flex flex-col justify-between border-r border-zinc-800 z-10">
        <div>
          <h1 className="text-xl font-bold mb-12 text-center text-zinc-300">
            Dev<span className="text-purple-400">Track</span>
          </h1>
          <nav className="space-y-6">
            <button className="flex items-center gap-4 text-xl font-bold italic text-white transition w-full text-left">
              <div className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center bg-black">
                <BookOpenText size={16} />
              </div>
              APRENDIZADO
            </button>
            <button onClick={() => navigate('/historico')} className="flex items-center gap-4 text-xl font-bold italic text-zinc-400 hover:text-white transition w-full text-left">
              <div className="w-7 h-7 rounded-full border-2 border-zinc-600 flex items-center justify-center bg-black">
                <History size={16} className="text-zinc-500" />
              </div>
              HISTÓRICO
            </button>
            <button onClick={() => navigate('/perfil')} className="flex items-center gap-4 text-xl font-bold italic text-zinc-400 hover:text-white transition w-full text-left">
              <div className="w-7 h-7 rounded-full border-2 border-zinc-600 flex items-center justify-center bg-black">
                <User size={16} className="text-zinc-500" />
              </div>
              PERFIL
            </button>
          </nav>
        </div>
       <div className="border-t border-zinc-800 pt-6 space-y-4">

            <button className="flex items-center gap-4 text-lg font-bold italic text-zinc-400 hover:text-white transition w-full text-left">
            <div className="w-6 h-6 rounded-full border-2 border-zinc-600 flex items-center justify-center bg-black">
              <Settings size={14} className="text-zinc-600" />
            </div>
            CONFIGURAÇÕES
          </button>

          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold py-3 rounded hover:bg-zinc-200 transition">
            <LogOut size={16} /> SAIR DO APP
          </button>
        </div>
      </aside>

      {/* CONTEÚDO */}
      <main className="flex-1 p-10 overflow-y-auto bg-black relative">
        
        {/* GRÁFICO DINÂMICO */}
        <div className="absolute top-10 right-10 w-64 bg-zinc-900 rounded-xl border border-zinc-800 p-5 shadow-2xl hidden lg:block">
          <div className="flex items-center gap-2 mb-4 justify-center">
            <BarChart3 size={16} className="text-zinc-400"/>
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-300">Horas na Semana</h3>
          </div>
          
          <div className="h-24 flex items-end justify-between gap-2 px-1">
            {weeklyHours.map((h, i) => (
              <div 
                key={i} 
                className={`w-full rounded-t-sm relative transition-all duration-500 ${h > 0 ? 'bg-purple-500' : 'bg-zinc-800'}`}
                style={{ height: `${Math.min((h / 16) * 100, 100)}%` }} 
              >
                {h > 0 && <span className="absolute -top-4 left-0 w-full text-center text-[8px] text-zinc-400">{h}h</span>}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[9px] text-zinc-500 font-bold mt-2 px-1 uppercase">
            <span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span><span>D</span>
          </div>
        </div>

        <div className="h-full flex flex-col items-center justify-center pt-24 pb-10">
          <div className="w-full max-w-2xl flex flex-col gap-8">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white text-center">
              O que aprendeu hoje, {userName}?
            </h2>

            <form onSubmit={handleSubmit} className="w-full bg-zinc-900 p-8 rounded-2xl border border-zinc-800 shadow-xl space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <CodeXml size={14} /> Linguagem
                  </label>
                  <input type="text" placeholder="Ex: Java" className="bg-black rounded-lg p-3 border border-zinc-700 text-white outline-none focus:ring-2 focus:ring-purple-500" value={technology} onChange={(e) => setTechnology(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock3 size={14} /> Horas
                  </label>
                  <input type="number" step="0.1" placeholder="Ex: 2" className="bg-black rounded-lg p-3 border border-zinc-700 text-white outline-none focus:ring-2 focus:ring-purple-500" value={hours} onChange={(e) => setHours(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <AlignLeft size={14} /> Descrição
                </label>
                <textarea rows="3" placeholder="Como foram seus estudos? Descreva brevemente..." className="bg-black rounded-lg p-4 border border-zinc-700 text-sm text-white outline-none focus:ring-2 focus:ring-purple-500 resize-none" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white font-bold py-4 rounded-lg text-lg hover:bg-purple-500 transition disabled:opacity-50">
                {loading ? "Registrando..." : "REGISTRAR ESTUDO 🔥"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div> 
  );
}