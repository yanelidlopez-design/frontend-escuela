import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Personal } from './pages/Personal';
import { Asistencias } from './pages/Asistencias';
import { Alumnos } from './pages/Alumnos';
import { Inscripciones } from './pages/Inscripciones';
import { Calificaciones } from './pages/Calificaciones';
import { CargaNotasDocente } from './pages/CargaNotasDocente';

function MainContent() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'personal':
        return <Personal />;
      case 'alumnos':
        return <Alumnos />;
      case 'inscripciones':
        return <Inscripciones />;
      case 'asistencias':
        return <Asistencias />;
      case 'calificaciones':
        return <Calificaciones />;
      default:
        return <Personal />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default function App() {
  // Si la URL trae un token de acceso externo, renderizamos directamente el
  // formulario de carga de notas (sin login ni layout de administrador),
  // igual que el enlace público de inscripción.
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  if (token) {
    return <CargaNotasDocente />;
  }

  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
