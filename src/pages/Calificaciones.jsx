import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  listarPeriodosCalificacion,
  alternarPeriodoCalificacion,
  nombreLapso,
  construirUrlCargaDocente,
} from '../api/periodosCalificacionApi';
import { extraerMensajeError } from '../utils/errorUtils';

/**
 * Gestión de Calificaciones (notas cualitativas PL, L, PM, EP, I).
 *
 * Sección 1: Periodos de Calificación (lapsos Diciembre/Abril/Julio) con el
 * switch manual que abre/cierra la URL externa de carga docente (activo_manual).
 * Sección 2: enlace público de carga docente externa con botón para copiarlo
 * (mismo patrón estético que el módulo de Inscripciones).
 */
export const Calificaciones = () => {
  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiado, setCopiado] = useState(false);
  // id del periodo que se está alternando (deshabilita su switch durante el PATCH).
  const [alternandoId, setAlternandoId] = useState(null);
  // URL pública de carga docente derivada del lapso activo.
  const [urlDocente, setUrlDocente] = useState('');

  // Carga los periodos y deriva la URL externa del lapso activo. Se reutiliza
  // tras alternar un switch para mantener la UI sincronizada con el backend.
  const recargarPeriodos = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await listarPeriodosCalificacion();
      const data = Array.isArray(response.data) ? response.data : [];
      setPeriodos(data);
      const activo = data.find((p) => p.activo_manual === true && p.token_acceso);
      setUrlDocente(activo ? construirUrlCargaDocente(activo.token_acceso) : '');
    } catch (err) {
      console.error('Error cargando periodos de calificación:', err);
      setError(extraerMensajeError(err));
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial al montar la vista.
  useEffect(() => {
    recargarPeriodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carga única al montar
  }, []);

  // Abre/cierra la URL externa del docente para un lapso (PATCH activo_manual).
  const alternarSwitch = async (periodo) => {
    setAlternandoId(periodo.id);
    setError('');
    try {
      await alternarPeriodoCalificacion(periodo);
      await recargarPeriodos();
    } catch (err) {
      console.error('Error alternando el periodo de calificación:', err);
      setError(extraerMensajeError(err));
    } finally {
      setAlternandoId(null);
    }
  };

  const copiarUrl = async () => {
    if (!urlDocente) return;
    try {
      await navigator.clipboard.writeText(urlDocente);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (err) {
      console.error('No se pudo copiar el enlace:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Gestión de Calificaciones</h3>
          <p className="text-xs text-slate-500 mt-1">
            Periodos de carga de notas y enlace externo para docentes.
          </p>
        </div>
        <button
          onClick={recargarPeriodos}
          disabled={loading}
          className="p-2.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Recargar datos"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Mensaje de error (auditoría de la API) */}
      {error && (
        <div className="border border-rose-200 bg-rose-50 text-rose-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* === Periodos de Calificación (lapsos) ============================== */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          📅 Periodos de Calificación
        </h3>
        <p className="text-xs text-slate-600 mt-1">
          Activa o desactiva la URL externa de carga de notas por lapso. El docente
          solo puede enviar notas cuando el lapso está abierto y dentro de la fecha límite.
        </p>

        {loading ? (
          <p className="mt-3 text-xs text-slate-500 animate-pulse">Cargando…</p>
        ) : periodos.length === 0 ? (
          <p className="mt-3 text-xs text-slate-600">
            No hay periodos de calificación registrados en el backend.
          </p>
        ) : (
          <ul className="mt-4 pt-3 border-t border-slate-200 space-y-2">
            {periodos.map((periodo) => (
              <li
                key={periodo.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white border border-slate-200 rounded-lg p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    Lapso {periodo.numero_periodo} · {nombreLapso(periodo.numero_periodo)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Fecha límite:{' '}
                    {periodo.fecha_limite ? periodo.fecha_limite.split('T')[0] : '—'}
                  </p>
                </div>

                <span
                  className={`px-2 py-1 rounded-md text-xs font-medium self-start sm:self-auto ${
                    periodo.activo_manual
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {periodo.activo_manual ? 'URL Abierta' : 'URL Cerrada'}
                </span>

                {/* Switch manual de apertura/cierre de la URL del docente */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!!periodo.activo_manual}
                    aria-label={`URL externa del lapso ${periodo.numero_periodo}`}
                    onClick={() => alternarSwitch(periodo)}
                    disabled={alternandoId === periodo.id}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      periodo.activo_manual ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        periodo.activo_manual ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-xs text-slate-500">
                    {alternandoId === periodo.id
                      ? 'Guardando…'
                      : periodo.activo_manual
                        ? 'Activa'
                        : 'Inactiva'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* === URL de carga docente externa ================================== */}
      <section className="border border-slate-200 rounded-xl p-4 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          🔗 Carga Docente Externa
        </h3>
        <p className="text-xs text-slate-600 mt-1">
          Compartí este enlace con los docentes para que carguen las notas
          (PL, L, PM, EP, I) desde su equipo sin necesidad de usuario en la plataforma.
        </p>

        {loading ? (
          <p className="mt-3 text-xs text-slate-500 animate-pulse">Cargando…</p>
        ) : urlDocente ? (
          <div className="mt-3 flex items-center gap-2">
            <input
              type="text"
              value={urlDocente}
              readOnly
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <button
              onClick={copiarUrl}
              disabled={copiado}
              className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs rounded-lg disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {copiado ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-600">
            No hay ningún lapso con la URL abierta. Activá el switch de un periodo
            para generar el enlace de carga docente.
          </p>
        )}
      </section>
    </div>
  );
};