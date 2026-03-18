import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // ferramenta que permite mudar de página"
  const navigate = useNavigate();

  // falar com o backend
  const handleLogin = async (e) => {
    e.preventDefault(); 
    
    try {
      const response = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // guarda o token no navegador
        localStorage.setItem('token', data.token);

        localStorage.setItem ('userName', data.name)
        
        navigate('/aprendizado');
      } else {
        
        alert("Erro: " + data.error);
      }
    } catch (error) {
      alert("Erro ao conectar com o servidor.");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-zinc-900">
      <div className="w-full max-w-md rounded-lg bg-zinc-800 p-8 shadow-lg">
        <h2 className="mb-6 text-center text-3xl font-bold text-white">
          Dev<span className="text-purple-400">Track</span>
        </h2>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm text-zinc-400">E-mail</label>
            <input
              type="email"
              placeholder="seu@email.com"
              className="w-full rounded bg-zinc-700 p-3 text-white outline-none focus:ring-2 focus:ring-purple-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-400">Senha</label>
            <input
              type="password"
              placeholder="******"
              className="w-full rounded bg-zinc-700 p-3 text-white outline-none focus:ring-2 focus:ring-purple-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="mt-4 rounded bg-purple-600 p-3 font-bold text-white transition hover:bg-purple-500"
          >
            Entrar
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Não tem uma conta?{' '}
          <Link to="/register" className="text-purple-400 hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}