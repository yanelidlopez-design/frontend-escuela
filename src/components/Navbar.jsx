import React from 'react';
import { User, FileText, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ title }) => {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
          <Globe size={12} className="text-emerald-500" /> API: http://127.0.0.1:8001
        </p>
      </div>

      <div className="flex items-center space-x-4">
        <a
          href="http://127.0.0.1:8001/swagger/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1.5 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-300 transition-colors"
        >
          <FileText size={14} />
          <span>Swagger UI</span>
        </a>

        <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
          <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-sm border border-sky-200">
            {user?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800">{user?.username || 'Usuario Admin'}</p>
            <p className="text-[10px] text-slate-500">{user?.role || 'Administrador'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
