import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpenText, User, Settings, LogOut, History, CalendarDays, Clock3 } from 'lucide-react';


export default function Historico() {
  const navigate = useNavigate();
  const [estudos, setEstudos] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  // O Assistente que busca o seu histórico quando a tela abre
  useEffect(() => {
    const fetchHistorico = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch("http://localhost:3000/studies", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setEstudos(data); // Guarda a lista de estudos na memória
        }
      } catch (error) {
        console.error("Erro ao buscar histórico:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistorico();
  }, []);

  // Função para formatar a data do banco (YYYY-MM-DD) para o padrão BR (DD/MM/YYYY)
  const formatarData = (dataString) => {
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">

      {/* ================= BARRA LATERAL ================= */}
      <aside className="w-64 bg-zinc-950 p-8 flex flex-col justify-between border-r border-zinc-800 z-10">
        <div>
          <h1 className="text-xl font-bold mb-12 text-center text-zinc-300">
            Dev<span className="text-purple-400">Track</span>
          </h1>

          <nav className="space-y-6">
            <button 
                onClick={() => navigate('/aprendizado')}
                className="flex items-center gap-4 text-xl font-bold italic text-zinc-400 hover:text-white transition w-full text-left">
              <div className="w-7 h-7 rounded-full border-2 border-zinc-600 flex items-center justify-center bg-black">
                <BookOpenText size={16} className="text-zinc-500" />
              </div>
              APRENDIZADO
            </button>

            {/* NOVO BOTÃO: HISTÓRICO (Ativo nesta tela) */}
            <button className="flex items-center gap-4 text-xl font-bold italic text-white transition w-full text-left">
              <div className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center bg-black">
                <History size={16} className="text-white" />
              </div>
              HISTÓRICO
            </button>

            <button 
                onClick={() => navigate('/perfil')}
                className="flex items-center gap-4 text-xl font-bold italic text-zinc-400 hover:text-white transition w-full text-left">
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

      {/* ================= CONTEÚDO PRINCIPAL ================= */}
      <main className="flex-1 p-10 overflow-y-auto bg-black relative [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        
        <div className="max-w-4xl mt-12 mx-auto flex flex-col gap-8">
          <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">
            Seu Histórico de Estudos
          </h2>

          {loading ? (
            <p className="text-zinc-500 italic">Buscando seus registros...</p>
          ) : estudos.length === 0 ? (
            <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 text-center">
                <p className="text-zinc-400 text-lg">Você ainda não registrou nenhum estudo. Bora codar!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Mapeando a lista de estudos e criando um "Card" para cada um */}
              {estudos.map((estudo) => (
                <div key={estudo.id} className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 hover:border-purple-500/50 transition group flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    <div className="flex flex-col gap-2 flex-1">
                        <div className="flex items-center gap-3">
                            <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                {estudo.technology}
                            </span>
                            <span className="text-zinc-400 text-sm flex items-center gap-1">
                                <CalendarDays size={14}/> {formatarData(estudo.date)}
                            </span>
                        </div>
                        {/* A descrição que adicionamos no passo anterior! */}
                        <p className="text-zinc-300 mt-2">{estudo.description}</p>
                    </div>

                    <div className="flex items-center gap-2 text-2xl font-black text-white bg-black px-4 py-2 rounded-lg border border-zinc-800">
                        <Clock3 size={20} className="text-purple-400"/>
                        {estudo.hours}h
                    </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div> 
  );
}