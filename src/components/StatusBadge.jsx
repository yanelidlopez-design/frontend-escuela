import React from 'react';

export const StatusBadge = ({ status }) => {
  let colorClasses = 'bg-gray-100 text-gray-800 border-gray-200';

  const normalized = (status || '').toString().toLowerCase();

  if (['activo', 'presente', 'aprobado'].includes(normalized)) {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (['vacaciones', 'pendiente'].includes(normalized)) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (['inactivo', 'ausente', 'rechazado'].includes(normalized)) {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (['justificado', 'permiso'].includes(normalized)) {
    colorClasses = 'bg-sky-50 text-sky-700 border-sky-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
      {status}
    </span>
  );
};
