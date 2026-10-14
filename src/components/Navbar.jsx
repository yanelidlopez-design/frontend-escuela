import React from 'react';
import { Users, CalendarCheck, ClipboardList, User, BookOpen, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MODULOS = [
  { id: 'personal', label: 'Personal', icon: Users },
  { id: 'alumnos', label: 'Alumnos', icon: User },
  { id: 'inscripciones', label: 'Inscripciones', icon: ClipboardList },
  { id: 'asistencias', label: 'Asistencias', icon: CalendarCheck },
];

export const Navbar = ({ activeTab, setActiveTab }) => {
  const { logout } = useAuth();

  return (
    <header className="w-full bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-y-3 sticky top-0 z-40">
      {/* Logo / Marca */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="p-2 bg-sky-600 rounded-lg text-white">
          <BookOpen size={20} />
        </div>
        <div className="leading-tight">
          <h1 className="font-bold text-white text-sm">Académico Pro</h1>
          <p className="text-[11px] text-slate-400">Sistema de Gestión</p>
        </div>
      </div>

      {/* Módulos (pestañas horizontales) */}
      <nav className="flex flex-wrap items-center gap-2 justify-center">
        {MODULOS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Cerrar sesión (extremo derecho, tono rojo suave) */}
      <button
        onClick={logout}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all shrink-0"
        title="Cerrar sesión"
      >
        <LogOut size={16} />
        <span className="hidden sm:inline">Cerrar Sesión</span>
      </button>
    </header>
  );
};
