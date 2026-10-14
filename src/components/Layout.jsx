import React from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const Layout = ({ activeTab, setActiveTab, children }) => {
  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Navbar fija superior: logo + pestañas de módulos + cerrar sesión */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex flex-1 min-h-0">
        {/* Sidebar discreta: datos de sesión */}
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};
