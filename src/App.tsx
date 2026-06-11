import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/auth';
import { ThemeProvider } from './context/theme';
import { Console } from './pages/Console';
import { Login } from './pages/Login';

function Rotas() {
  const { gestor, carregando } = useAuth();
  if (carregando) {
    return (
      <div className="flex h-full items-center justify-center text-ink-dim">
        <span className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-brand" />
      </div>
    );
  }
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
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Rotas />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
