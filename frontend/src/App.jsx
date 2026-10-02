import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Aprendizado from './pages/aprendizado'
import Profile from './pages/Profile'
import Historico from './pages/Historico'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* telas que exigem login (menu lateral / barra inferior) */}
        <Route element={<Layout />}>
          <Route path="/aprendizado" element={<Aprendizado />} />
          <Route path="/historico" element={<Historico />} />
          <Route path="/perfil" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
