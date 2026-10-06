import React from 'react';
import { Users, GraduationCap, UserCheck, CalendarCheck, LogOut, BookOpen, User, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { logout } = useAuth();

  const menuItems = [
    { id: 'personal', label: 'Personal con Cargo', icon: Users, endpoint: '/api/v1/personal/' },
    { id: 'profesores', label: 'Profesores', icon: GraduationCap, endpoint: '/api/v1/profesores/' },
    { id: 'representantes', label: 'Representantes', icon: UserCheck, endpoint: '/api/v1/representantes/' },
    { id: 'alumnos', label: 'Alumnos', icon: User, endpoint: '/api/academico/alumnos/' },
    { id: 'inscripciones', label: 'Inscripciones', icon: ClipboardList, endpoint: '/api/academico/inscripciones/' },
    { id: 'asistencias', label: 'Control de Asistencias', icon: CalendarCheck, endpoint: '/api/v1/academico/asistencias/' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col justify-between border-r border-slate-800">
      <div>
        <div className="flex items-center space-x-3 p-6 border-b border-slate-800">
          <div className="p-2 bg-sky-600 rounded-lg text-white">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight">Académico Pro</h1>
            <p className="text-xs text-slate-400">Sistema de Gestión</p>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Módulos</p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
        >
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};
