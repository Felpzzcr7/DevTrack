import {useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpenText, User, Settings, LogOut, Flame, History } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName')|| 'Dev'

  const[ stats,  setStats]= useState({
    streak: 0,
    totalHours: 0, 
    maxRecord: 0, 
    topLanguage: "nenhuma"


  });


  useEffect(()=>{
    const fetchStats = async ()=>{
      try{
        const token= localStorage.getItem('token')

        const response = await fetch("http://localhost:3000/studies/stats", {
          headers : {
            "Authorization": `Bearer ${token}`
          }
        })
        if(response.ok){
          const data= await response.json ()

          setStats({
            streak: data.currentStreak|| 0,
            totalHours: data.totalHours|| 0, 
            maxRecord: data.maxRecord || 0, 
           topLanguage: data.topLanguage || "nenhuma"

          })
        }
      } catch(error) {
        console.error("Erro ao buscar as estatísticas:", error);
      }
    }
    fetchStats()
  },  [])


  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/'); // Volta para o login
  };

  return (
    // O container principal 
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
        {/* barra lateral */}
      <aside className="w-64 bg-zinc-950 p-8 flex flex-col justify-between border-r border-zinc-800">
        <div>
          {/* Título do App */}
          <h1 className="text-xl font-bold mb-12 text-center text-zinc-300">
            Dev<span className="text-purple-400">Track</span>
          </h1>

          <nav className="space-y-6">
            
            <button 
              onClick={() => navigate('/aprendizado')}
              className="flex items-center gap-4 text-xl font-bold italic text-zinc-400 hover:text-white transition w-full text-left"
            >
              <div className="w-7 h-7 rounded-full border-2 border-zinc-600 flex items-center justify-center bg-black">
                <BookOpenText size={16} className="text-zinc-500" />
              </div>
              APRENDIZADO
            </button>

              <button 
            onClick={() => navigate('/historico')}
            className="flex items-center gap-4 text-xl font-bold italic text-zinc-400 hover:text-white transition w-full text-left"
            >
            <div className="w-7 h-7 rounded-full border-2 border-zinc-600 flex items-center justify-center bg-black">
                <History size={16} className="text-zinc-500" />
            </div>
            HISTÓRICO
            </button>

            <button className="flex items-center gap-4 text-xl font-bold italic text-white transition w-full text-left">
              <div className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center bg-black">
                <User size={16} className="text-white" />
              </div>
              <span className="text-purple-400 font-bold underline">PERFIL</span>
            </button>
          </nav>
        </div>

        {/* CONFIGURAÇÕES e Botão de Sair */}
        <div className="border-t border-zinc-800 pt-6 space-y-4">
          {/* CONFIGURAÇÕES */}
          <button className="flex items-center gap-4 text-lg font-bold italic text-zinc-400 hover:text-white transition w-full text-left">
            <div className="w-6 h-6 rounded-full border-2 border-zinc-600 flex items-center justify-center bg-black">
              <Settings size={14} className="text-zinc-600" />
            </div>
            CONFIGURAÇÕES
          </button>

          {/* botao sair */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold py-3 rounded hover:bg-zinc-200 transition"
          >
            <LogOut size={16} />
            SAIR DO APP
          </button>
        </div>
      </aside>


      <main className="flex-1 p-12 overflow-y-auto bg-black [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col items-center gap-10">
          <div className="text-center flex flex-col items-center">
            
            <div className="relative h-70 w-70">
              <Flame 
                className="w-full h-full text-orange-500 animate-pulse" 
                strokeWidth={1} 
              />
              <div className="absolute inset-0 flex items-center justify-center transform translate-y-15">
                <p className="text-7xl font-black text-white tracking-tighter">
                  {stats.streak}
                </p>
              </div>
            </div>
            <p className="text-xs text-orange-400 uppercase font-bold tracking-widest mt-3">
              Dias de Ofensiva 🔥
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl">
            {/* Horas Total */}
            <div className="bg-zinc-900 p-8 rounded-xl border border-zinc-800 text-center shadow-lg">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Horas Total</h4>
              <p className="text-4xl font-extrabold text-white">{stats.totalHours}</p>
            </div>
            {/* Recorde */}
            <div className="bg-zinc-900 p-8 rounded-xl border border-zinc-800 text-center shadow-lg">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Recorde Máximo em um dia</h4>
              <p className="text-4xl font-extrabold text-white">{stats.maxRecord}</p>
            </div>
            {/* Linguagem Mais Usada*/}
            <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 text-center md:col-span-2 shadow-lg">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Linguagem mais usada</h4>
              <p className="text-2xl font-bold text-purple-400">{stats.topLanguage}</p>
            </div>
          </div>


          {/* 3. ÁREA DO GRÁFICO */}
          <div className="w-full max-w-4xl h-96 bg-zinc-900 rounded-2xl border-2 border-dashed border-zinc-800 flex items-center justify-center mt-6">
            <p className="text-5xl font-black uppercase tracking-widest text-zinc-700">Grafico</p>
          </div>

        </div>
      </main>

      
      <aside className="w-100 bg-zinc-950 p-8 flex flex-col items-center border-l border-zinc-800 overflow-y-auto">
        
        {/* Foto do Avatar */}
        <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-zinc-700 shadow-lg mb-6 mt-4">
          <img 
            src={`https://api.dicebear.com/8.x/notionists/svg?seed=${userName}`}
            alt="Avatar"
            className="w-full h-full object-cover bg-zinc-800"
          />
        </div>

        {/* Nome do Usuário */}
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-10 text-white">
          {userName}
        </h2>

        {/* Caixa de Skills */}
        <div className="w-full bg-black p-6 rounded-xl border border-zinc-800 mb-8 shadow-inner">
          <h4 className="text-sm font-bold text-zinc-500 mb-4 flex items-center gap-2 uppercase tracking-widest">
            Skills 💻
          </h4>
          
          {/* Ícones de Skills */}
          <div className="flex flex-wrap gap-4 text-3xl justify-center">
            <span title="Python" className="hover:scale-110 cursor-pointer transition">🐍</span> 
            <span title="HTML5" className="hover:scale-110 cursor-pointer transition">🟧</span> 
            <span title="CSS3" className="hover:scale-110 cursor-pointer transition">🟦</span> 
            <span title="JavaScript" className="hover:scale-110 cursor-pointer transition">🟨</span> 
            <span title="React" className="hover:scale-110 cursor-pointer transition">⚛️</span>
            <span title="Node.js" className="hover:scale-110 cursor-pointer transition">🟩</span>
          </div>
        </div>
      </aside>

    </div> 
  );
}