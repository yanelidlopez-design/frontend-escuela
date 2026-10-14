import React from 'react';
import { FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://127.0.0.1:8001';

/**
 * Sidebar compacta de estado e información:
 * conexión a la API, Swagger UI y datos de la sesión (usuario + rol).
 * No ocupa espacio de trabajo: es discreta y solo visible en pantallas grandes.
 */
export const Sidebar = () => {
  const { user } = useAuth();

  return (
    <aside className="hidden lg:flex w-56 shrink-0 flex-col gap-4 border-r border-slate-200 bg-white p-4 overflow-y-auto">
      {/* Estado de la API */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Estado</p>
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-medium">API Activa</span>
        </div>
        <p className="mt-2 font-mono text-[11px] text-slate-500 break-all">{API_BASE}</p>
      </div>

      {/* Swagger UI */}
      <a
        href={`${API_BASE}/swagger/`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <FileText size={14} />
        <span>Swagger UI</span>
      </a>

      {/* Sesión: usuario y rol */}
      <div className="mt-auto rounded-xl border border-slate-200 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Sesión</p>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 shrink-0 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-sm border border-sky-200">
            {user?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-800">{user?.username || 'Usuario Admin'}</p>
            <span className="mt-0.5 inline-flex rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 border border-sky-200">
              {user?.role || 'Administrador'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
