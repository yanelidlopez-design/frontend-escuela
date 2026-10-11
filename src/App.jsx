import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Personal } from './pages/Personal';
import { Asistencias } from './pages/Asistencias';
import { Alumnos } from './pages/Alumnos';
import { Inscripciones } from './pages/Inscripciones';

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
      default:
        return <Personal />;
    }
  };

  const titles = {
    personal: 'Panel de Gestión de Personal',
    alumnos: 'Panel de Gestión de Alumnos',
    inscripciones: 'Gestión de Inscripciones',
    asistencias: 'Control de Asistencia por Grado y Sección',
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} title={titles[activeTab]}>
      {renderContent()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
