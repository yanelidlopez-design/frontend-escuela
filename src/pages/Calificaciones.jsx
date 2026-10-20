import React, { useState, useEffect } from 'react';
import { RefreshCw, Plus, FileText, Printer } from 'lucide-react';
import {
  listarPeriodosCalificacion,
  alternarPeriodoCalificacion,
  nombreLapso,
  construirUrlCargaDocente,
  crearPeriodoCalificacion,
  descargarInformeLapsoPdf,
  descargarConstanciaProsecucionPdf,
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

  // Modal de creación de periodo de calificación.
  const [mostrarModal, setMostrarModal] = useState(false);
  const [creandoPeriodo, setCreandoPeriodo] = useState(false);
  const [numeroPeriodo, setNumeroPeriodo] = useState('1');
  const [fechaLimite, setFechaLimite] = useState('');
  const [activoManual, setActivoManual] = useState(true);
  const [errorModal, setErrorModal] = useState('');

  // Alumnos del grupo seleccionado (datos de referencia para la demo del módulo;
  // en producción se poblaría desde el endpoint de inscripción/alumnos del grupo).
  const [alumnos] = useState([
    { id: 1, cedula: 'V-12345678', nombres: 'María Elena', apellidos: 'González Rojas', grado: '3er', seccion: 'A' },
    { id: 2, cedula: 'V-87654321', nombres: 'Carlos Andrés', apellidos: 'Pérez Méndez', grado: '3er', seccion: 'A' },
    { id: 3, cedula: 'V-11223344', nombres: 'Sofía Isabel', apellidos: 'Ramírez Torres', grado: '3er', seccion: 'B' },
  ]);
  // Estado individual de descarga por botón: clave `${alumnoId}-${periodoId}` para lapsos,
  // clave `${alumnoId}` para la constancia de prosecución.
  const [descargandoLapso, setDescargandoLapso] = useState({});
  const [descargandoProsecucion, setDescargandoProsecucion] = useState({});

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

  // Crea un nuevo periodo de calificación desde el modal.
  const guardarCrearPeriodo = async () => {
    if (!numeroPeriodo || !fechaLimite) return;
    setCreandoPeriodo(true);
    setErrorModal('');
    try {
      await crearPeriodoCalificacion({
        numero_periodo: parseInt(numeroPeriodo, 10),
        fecha_limite: fechaLimite,
        activo_manual: activoManual,
      });
      setMostrarModal(false);
      setNumeroPeriodo('1');
      setFechaLimite('');
      setActivoManual(true);
      setErrorModal('');
      await recargarPeriodos();
    } catch (err) {
      console.error('Error creando periodo de calificación:', err);
      // Interceptar error 400 (periodo duplicado) y mostrarlo dentro del modal.
      if (err.response?.status === 400) {
        setErrorModal(extraerMensajeError(err) || 'Ya existe un periodo con ese número de lapso.');
      } else {
        setErrorModal(extraerMensajeError(err) || 'No se pudo crear el periodo de calificación.');
      }
    } finally {
      setCreandoPeriodo(false);
    }
  };

  /* ========================================================================
   * DESCARGA DE PDFs (flujos de datos binarios / Blobs)
   * ======================================================================== */

  // Descarga un archivo binario (PDF) recibido del backend en el navegador del
  // usuario: crea un Blob con los bytes, genera una URL temporal, inyecta un
  // <a> oculto, dispara el click para forzar la descarga y libera la memoria.
  const descargarPDF = (data, nombreArchivo) => {
    const blob = new Blob([data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreArchivo;
    enlace.style.display = 'none';
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    window.URL.revokeObjectURL(url);
  };

  // Descarga el informe descriptivo de un lapso dado (Diciembre=1, Abril=2, Julio=3).
  const manejarDescargaInformeLapso = async (alumno, periodoId) => {
    const clave = `${alumno.id}-${periodoId}`;
    setDescargandoLapso((prev) => ({ ...prev, [clave]: true }));
    try {
      const respuesta = await descargarInformeLapsoPdf(alumno.id, periodoId);
      const cedula = (alumno.cedula || alumno.documento || 'sin-cedula').replace(/\s+/g, '_');
      const nombreArchivo = `Informe_Descriptivo_Lapso_${periodoId}_${cedula}.pdf`;
      descargarPDF(respuesta.data, nombreArchivo);
    } catch (err) {
      const msg = extraerMensajeError(err);
      alert(msg || 'No se pudo descargar el informe del lapso. Verificá tu conexión o sesión.');
    } finally {
      setDescargandoLapso((prev) => {
        const siguiente = { ...prev };
        delete siguiente[clave];
        return siguiente;
      });
    }
  };

  // Descarga la constancia de prosecución final del alumno.
  const manejarDescargaConstanciaProsecucion = async (alumno) => {
    const clave = `${alumno.id}`;
    setDescargandoProsecucion((prev) => ({ ...prev, [clave]: true }));
    try {
      const respuesta = await descargarConstanciaProsecucionPdf(alumno.id);
      const cedula = (alumno.cedula || alumno.documento || 'sin-cedula').replace(/\s+/g, '_');
      const nombreArchivo = `Constancia_Prosucion_${cedula}.pdf`;
      descargarPDF(respuesta.data, nombreArchivo);
    } catch (err) {
      const msg = extraerMensajeError(err);
      alert(msg || 'No se pudo descargar la constancia de prosecución. Verificá tu conexión o sesión.');
    } finally {
      setDescargandoProsecucion((prev) => {
        const siguiente = { ...prev };
        delete siguiente[clave];
        return siguiente;
      });
    }
  };

  // Periodo actualmente activo (para decidir cuándo mostrar el botón de prosecución).
  const periodoActivo = periodos.find((p) => p.activo_manual === true);

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
        {periodos.length === 0 && (
          <button
            onClick={() => setMostrarModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            <span>+ Crear nuevo periodo</span>
          </button>
        )}
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

      {/* === Alumnos del Grupo y Documentos de Evaluación ==================== */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">
          👨‍🎓 Alumnos del Grupo y Documentos de Evaluación
        </h3>
        <p className="text-xs text-slate-600 mb-4">
          Descargá los PDFs oficiales de cada estudiante. Los informes de lapso
          corresponden a Diciembre (1) y Abril (2); la constancia de prosecución
          se habilita en el cierre anual (Lapso 3 / Julio).
        </p>

        {alumnos.length === 0 ? (
          <p className="text-xs text-slate-500">No hay alumnos inscritos en este grupo.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {alumnos.map((alumno) => (
              <div
                key={alumno.id}
                className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium text-slate-900 leading-tight">
                      {alumno.nombres} {alumno.apellidos}
                    </p>
                    <p className="text-xs text-slate-500">
                      Cédula: {alumno.cedula}
                    </p>
                  </div>
                  <span
                    className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded"
                  >
                    {alumno.grado} {alumno.seccion}
                  </span>
                </div>

                <div className="flex-1 space-y-2">
                  <h4 className="text-xs font-semibold text-slate-600 uppercase mb-1">
                    Documentos de Evaluación
                  </h4>

                  {/* Informes de lapso (Trimestrales 1 y 2) */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => manejarDescargaInformeLapso(alumno, 1)}
                      disabled={descargandoLapso[`${alumno.id}-1`]}
                      className="flex flex-col items-center gap-1 px-2 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title={`Informe ${nombreLapso(1)}`}
                    >
                      <FileText size={14} />
                      <span>{nombreLapso(1)}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => manejarDescargaInformeLapso(alumno, 2)}
                      disabled={descargandoLapso[`${alumno.id}-2`]}
                      className="flex flex-col items-center gap-1 px-2 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title={`Informe ${nombreLapso(2)}`}
                    >
                      <FileText size={14} />
                      <span>{nombreLapso(2)}</span>
                    </button>
                  </div>

                  {/* Cierre de año / Lapso 3: informe cualitativo + constancia de prosecución */}
                  {periodoActivo?.numero_periodo === 3 && (
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => manejarDescargaInformeLapso(alumno, 3)}
                        disabled={descargandoLapso[`${alumno.id}-3`]}
                        className="flex flex-col items-center gap-1 px-2 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title={`Informe ${nombreLapso(3)}`}
                      >
                        <FileText size={14} />
                        <span>{nombreLapso(3)}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => manejarDescargaConstanciaProsecucion(alumno)}
                        disabled={descargandoProsecucion[`${alumno.id}`]}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg disabled:bg-emerald-200 disabled:text-emerald-400 disabled:cursor-not-allowed transition-colors"
                        title="Imprimir Constancia de Prosecución"
                      >
                        <Printer size={14} />
                        <span>Constancia de Prosecución</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
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

      {/* Modal flotante: crear nuevo periodo de calificación */}
      {mostrarModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setMostrarModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-100 animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Crear nuevo periodo de calificación</h3>
              <button
                onClick={() => setMostrarModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                guardarCrearPeriodo();
              }}
              className="space-y-4 p-4"
            >
              {/* Banner de error (periodo duplicado u otros) */}
              {errorModal && (
                <div className="border border-rose-200 bg-rose-50 text-rose-700 text-sm rounded-xl px-4 py-3">
                  {errorModal}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Nº de Periodo (Lapso)
                </label>
                <select
                  value={numeroPeriodo}
                  onChange={(e) => setNumeroPeriodo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="1">Primer Lapso (Cierre Diciembre)</option>
                  <option value="2">Segundo Lapso (Cierre Abril)</option>
                  <option value="3">Tercer Lapso (Cierre Julio)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Fecha y hora límite de carga
                </label>
                <input
                  type="datetime-local"
                  required
                  value={fechaLimite}
                  onChange={(e) => setFechaLimite(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={activoManual}
                  onChange={(e) => setActivoManual(e.target.checked)}
                  className="rounded bg-slate-100 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label className="text-xs text-slate-600">
                  Abrir URL de carga docente desde el inicio
                </label>
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMostrarModal(false);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creandoPeriodo}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creandoPeriodo ? 'Guardando…' : 'Crear periodo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};