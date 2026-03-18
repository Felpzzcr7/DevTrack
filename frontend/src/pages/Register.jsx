import { useState } from 'react';

// Importa o componente Link que substitui a tag <a> normal do HTML
import { Link } from 'react-router-dom';

export default function Register() {

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
   try {
    const response = await fetch("http://localhost:3000/auth/register", {
      method: "POST", 
      headers:{
        "Content-Type": "application/json", },
        body: JSON.stringify({
          name: name,
          email: email,
          password: password
        }),
      });
      const data = await response.json();

    
      if (response.ok) {
        alert("Conta criada com sucesso");
     
        setName('');
        setEmail('');
        setPassword('');
      } else {
        alert("Erro: " + data.error);
      }
    } catch (error) {
      alert("Erro ao conectar com o servidor");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-zinc-900">
      <div className="w-full max-w-md rounded-lg bg-zinc-800 p-8 shadow-lg">
        
        <h2 className="mb-6 text-center text-3xl font-bold text-white">
          Criar <span className="text-purple-400">Conta</span>
        </h2>

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          
          {/* Campo Nome*/}
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Nome</label>
            <input
              type="text"
              placeholder="seu nome"
              className="w-full rounded bg-zinc-700 p-3 text-white outline-none focus:ring-2 focus:ring-purple-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

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
            Cadastrar
          </button>
        </form>

        {/* O Link para voltar para o Login */}
        <p className="mt-6 text-center text-sm text-zinc-400">
          Já tem uma conta?{' '}
          <Link to="/" className="text-purple-400 hover:underline">
            Faça login
          </Link>
        </p>

      </div>
    </div>
  );
}