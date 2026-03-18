import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Login from './pages/Login'; 
import Register from './pages/Register'; 
import Aprendizado from './pages/aprendizado';
import Profile from './pages/Profile';  
import Historico from './pages/Historico';  



function App() {
  return (
    //  mapa geral
    <BrowserRouter>
      <Routes>
        {/* se URL for apenas "/", mostre a tela de Login */}
        <Route path="/" element={<Login />} />
        
        {/* se URL for "/register", mostre a tela de Cadastro */}
        <Route path="/register" element={<Register />} />

        {/* rota perfil */}
        <Route path= "perfil" element= {<Profile/>}/>

        {/* rota aprendizado */}
        <Route path="/aprendizado" element={<Aprendizado />} />

        {/* rota do historico */}
        <Route path= "/historico" element= {<Historico/>}/>
        
      </Routes>
    </BrowserRouter>
  )
}

export default App;