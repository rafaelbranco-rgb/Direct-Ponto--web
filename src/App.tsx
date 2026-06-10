import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/auth';
import { Console } from './pages/Console';
import { Login } from './pages/Login';

function Rotas() {
  const { gestor } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={gestor ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={gestor ? <Console /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Rotas />
      </BrowserRouter>
    </AuthProvider>
  );
}
