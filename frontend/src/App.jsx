import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login              from './pages/Login';
import Register           from './pages/Register';
import Razas              from './pages/Razas';
import Animales           from './pages/Animales';
import NuevoAnimal        from './pages/NuevoAnimal';
import EditarAnimal       from './pages/EditarAnimal';
import FichaAnimal        from './pages/FichaAnimal';
import TrabajoDeMangas    from './pages/TrabajoDeMangas';
import Dashboard          from './pages/Dashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function Private({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Públicas */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Razas */}
          <Route path="/razas" element={<Private><Razas /></Private>} />

          {/* Animales — el orden importa: /nuevo antes de /:id/animales */}
          <Route path="/razas/:id/animales/nuevo" element={<Private><NuevoAnimal /></Private>} />
          <Route path="/razas/:id/animales"       element={<Private><Animales /></Private>} />

          {/* Ficha y edición */}
          <Route path="/animales/:id"        element={<Private><FichaAnimal /></Private>} />
          <Route path="/animales/:id/editar" element={<Private><EditarAnimal /></Private>} />

          {/* Trabajo de Mangas */}
          <Route path="/trabajo-mangas" element={<Private><TrabajoDeMangas /></Private>} />

          {/* Dashboard */}
          <Route path="/"  element={<Private><Dashboard /></Private>} />
          <Route path="*"  element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
            maxWidth: 380,
          },
          success: { iconTheme: { primary: 'var(--color-success)', secondary: '#fff' } },
          error:   { iconTheme: { primary: 'var(--color-error)',   secondary: '#fff' } },
        }}
      />
    </QueryClientProvider>
  );
}
