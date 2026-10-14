import React from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Sidebar compacta con los datos de la sesión (usuario + rol).
 * No ocupa espacio de trabajo: es discreta y solo visible en pantallas grandes.
 */
export const Sidebar = () => {
  const { user } = useAuth();

  return (
    <aside className="hidden lg:flex w-56 shrink-0 flex-col gap-4 border-r border-slate-200 bg-white p-4 overflow-y-auto">
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
