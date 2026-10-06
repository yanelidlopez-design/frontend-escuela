import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { gruposApi } from '../api/gruposApi';
import { asistenciasApi } from '../api/asistenciasApi';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportUtils';
import {
  Calendar,
  FileSpreadsheet,
  FileText,
  Download,
  RefreshCw,
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

// Estados válidos de asistencia: P (Presente), A (Ausente), J (Justificado)
const ESTADOS = [
  {
    valor: 'P',
    etiqueta: 'Presente',
    activo: 'bg-emerald-500 text-white border-emerald-500',
    inactivo: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  },
  {
    valor: 'A',
    etiqueta: 'Ausente',
    activo: 'bg-rose-500 text-white border-rose-500',
    inactivo: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
  },
  {
    valor: 'J',
    etiqueta: 'Justificado',
    activo: 'bg-sky-500 text-white border-sky-500',
    inactivo: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
  },
];

const ETIQUETAS_ESTADO = { P: 'Presente', A: 'Ausente', J: 'Justificado' };

// --- Normalización de grupos: backend real (FK + *_detalle) vs mock ---
const nombreGrado = (g) =>
  g?.grado_detalle?.nombre_grado || (typeof g?.grado === 'string' ? g.grado : '');
const nombreSeccion = (g) =>
  g?.seccion_detalle?.nombre_seccion || (typeof g?.seccion === 'string' ? g.seccion : '');
const nombreTurno = (g) =>
  g?.turno_detalle?.nombre_turno || (typeof g?.turno === 'string' ? g.turno : '');
const idGrupo = (g) => g?.id_grupo ?? g?.id;

const nombreAlumno = (al) =>
  [al.primer_nombre, al.segundo_nombre, al.primer_apellido, al.segundo_apellido]
    .filter(Boolean)
    .join(' ') ||
  al.nombre_completo ||
  `Alumno ${al.id_alumno}`;

const hoyISO = () => new Date().toISOString().split('T')[0];

export const Asistencias = () => {
  // --- Selectores: Grado, Sección, Turno y Fecha ---
  const [grupos, setGrupos] = useState([]);
  const [gradoSel, setGradoSel] = useState('');
  const [seccionSel, setSeccionSel] = useState('');
  const [turnoSel, setTurnoSel] = useState('');
  const [fecha, setFecha] = useState(hoyISO());

  // --- Pasar lista ---
  const [grupoActivo, setGrupoActivo] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
  const [previas, setPrevias] = useState({}); // id_alumno -> registro existente en backend
  const [marcas, setMarcas] = useState({}); // id_alumno -> { estado, observaciones }

  const [cargandoGrupos, setCargandoGrupos] = useState(true);
  const [cargandoAlumnos, setCargandoAlumnos] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null); // { tipo: 'ok' | 'error', texto }

  // Opciones únicas derivadas de /api/academico/grupos/
  const opcionesGrado = useMemo(() => [...new Set(grupos.map(nombreGrado).filter(Boolean))], [grupos]);
  const opcionesSeccion = useMemo(() => [...new Set(grupos.map(nombreSeccion).filter(Boolean))], [grupos]);
  const opcionesTurno = useMemo(() => [...new Set(grupos.map(nombreTurno).filter(Boolean))], [grupos]);

  // Carga inicial de grupos académicos
  useEffect(() => {
    (async () => {
      setCargandoGrupos(true);
      try {
        const data = await gruposApi.getAll();
        setGrupos(data || []);
        if (data && data.length) {
          setGradoSel((prev) => prev || nombreGrado(data[0]));
          setSeccionSel((prev) => prev || nombreSeccion(data[0]));
          setTurnoSel((prev) => prev || nombreTurno(data[0]));
        }
      } catch (err) {
        console.error(err);
        setMensaje({ tipo: 'error', texto: 'No se pudieron cargar los grupos académicos.' });
      } finally {
        setCargandoGrupos(false);
      }
    })();
  }, []);

  // Resolver el grupo que coincide con Grado + Sección + Turno seleccionados
  useEffect(() => {
    const grupo = grupos.find(
      (g) =>
        nombreGrado(g) === gradoSel &&
        nombreSeccion(g) === seccionSel &&
        (turnoSel === '' || nombreTurno(g) === turnoSel)
    );
    setGrupoActivo(grupo || null);
  }, [grupos, gradoSel, seccionSel, turnoSel]);

  // Cargar alumnos activos del grupo + asistencias ya registradas en la fecha
  const cargarListado = useCallback(async () => {
    if (!grupoActivo || !fecha) {
      setAlumnos([]);
      setPrevias({});
      setMarcas({});
      return;
    }
    setCargandoAlumnos(true);
    setMensaje(null);
    try {
      const gid = idGrupo(grupoActivo);
      const [listaAlumnos, registros] = await Promise.all([
        gruposApi.getAlumnosActivos(gid),
        asistenciasApi.getAll({ fecha, grupo: gid }),
      ]);
      const mapaPrevias = {};
      (registros || []).forEach((r) => {
        if (r.alumno != null) mapaPrevias[r.alumno] = r;
      });
      const iniciales = {};
      (listaAlumnos || []).forEach((al) => {
        const previo = mapaPrevias[al.id_alumno];
        iniciales[al.id_alumno] = {
          estado: previo?.estado || 'P',
          observaciones: previo?.observaciones || '',
        };
      });
      setAlumnos(listaAlumnos || []);
      setPrevias(mapaPrevias);
      setMarcas(iniciales);
    } catch (err) {
      console.error(err);
      setMensaje({ tipo: 'error', texto: 'No se pudo cargar la lista de alumnos del grupo.' });
    } finally {
      setCargandoAlumnos(false);
    }
  }, [grupoActivo, fecha]);

  useEffect(() => {
    cargarListado();
  }, [grupoActivo, fecha, cargarListado]);

  // Resumen en vivo del pase de lista
  const resumen = useMemo(() => {
    let p = 0;
    let a = 0;
    let j = 0;
    alumnos.forEach((al) => {
      const e = marcas[al.id_alumno]?.estado;
      if (e === 'P') p++;
      else if (e === 'A') a++;
      else if (e === 'J') j++;
    });
    return { total: alumnos.length, p, a, j };
  }, [alumnos, marcas]);

  const marcar = (idAlumno, campo, valor) =>
    setMarcas((m) => ({
      ...m,
      [idAlumno]: { ...(m[idAlumno] || { estado: 'P', observaciones: '' }), [campo]: valor },
    }));

  // Atajo: pasar lista completa de una vez
  const marcarTodos = (estado) => {
    setMarcas((m) => {
      const copia = { ...m };
      alumnos.forEach((al) => {
        copia[al.id_alumno] = { ...(copia[al.id_alumno] || { observaciones: '' }), estado };
      });
      return copia;
    });
  };

  // Guardar lote -> PUT a registros existentes + POST a nuevos en /api/academico/asistencias/
  const handleGuardar = async () => {
    if (!grupoActivo || alumnos.length === 0) return;
    setGuardando(true);
    setMensaje(null);
    const gid = idGrupo(grupoActivo);
    let creadas = 0;
    let actualizadas = 0;
    const errores = [];

    await Promise.all(
      alumnos.map(async (al) => {
        const marca = marcas[al.id_alumno];
        if (!marca) return;
        const payload = {
          fecha,
          alumno: al.id_alumno,
          grupo: gid,
          estado: marca.estado,
          observaciones: marca.observaciones || '',
        };
        try {
          const previo = previas[al.id_alumno];
          if (previo?.id_asistencia) {
            await asistenciasApi.update(previo.id_asistencia, payload);
            actualizadas++;
          } else {
            await asistenciasApi.create(payload);
            creadas++;
          }
        } catch (err) {
          console.error(err);
          errores.push(nombreAlumno(al));
        }
      })
    );

    setGuardando(false);

    if (errores.length > 0) {
      setMensaje({
        tipo: 'error',
        texto: `No se pudieron guardar ${errores.length} registro(s): ${errores.join(', ')}`,
      });
    } else {
      setMensaje({
        tipo: 'ok',
        texto: `Asistencia guardada: ${creadas} nueva(s), ${actualizadas} actualizada(s) — ${fecha}`,
      });
      await cargarListado();
    }
  };

  // --- Exportación del listado actual ---
  const filasExport = () =>
    alumnos.map((al, i) => ({
      N: i + 1,
      Alumno: nombreAlumno(al),
      Cedula: al.cedula_escolar || al.numero_documento_identidad || '',
      Grado: nombreGrado(grupoActivo),
      Seccion: nombreSeccion(grupoActivo),
      Turno: nombreTurno(grupoActivo),
      Fecha: fecha,
      Estado: ETIQUETAS_ESTADO[marcas[al.id_alumno]?.estado] || '',
      Observaciones: marcas[al.id_alumno]?.observaciones || '',
    }));

  const nombreGrupo =
    grupoActivo && gradoSel && seccionSel ? `${gradoSel} - Sección ${seccionSel}` : 'grupo no seleccionado';

  const claseSelect =
    'w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500';
  const claseExport =
    'inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50';

  return (
    <div className="space-y-6">
      {/* Header + Exportación */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Control de Asistencia de Alumnos</h3>
          <p className="text-xs text-slate-500 mt-1">
            Pase de lista por Grado, Sección, Turno y Fecha — fuente: /api/academico/grupos/
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportToCSV(filasExport(), `asistencias_${gradoSel || 'grupo'}_${fecha}.csv`)}
            className={claseExport}
          >
            <Download size={14} /> CSV
          </button>
          <button
            onClick={() => exportToExcel(filasExport(), `asistencias_${gradoSel || 'grupo'}_${fecha}.xlsx`)}
            className={claseExport}
          >
            <FileSpreadsheet size={14} /> Excel
          </button>
          <button
            onClick={() =>
              exportToPDF(
                filasExport(),
                `Control de Asistencia ${nombreGrupo} — ${fecha}`,
                `asistencias_${gradoSel || 'grupo'}_${fecha}.pdf`
              )
            }
            className={claseExport}
          >
            <FileText size={14} /> PDF
          </button>
          <button onClick={cargarListado} disabled={cargandoAlumnos} className={`${claseExport} disabled:opacity-50`}>
            <RefreshCw size={14} className={cargandoAlumnos ? 'animate-spin' : ''} /> Recargar
          </button>
        </div>
      </div>

      {/* Selectores: Grado, Sección, Turno y Fecha */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Grado</label>
            <select
              value={gradoSel}
              onChange={(e) => setGradoSel(e.target.value)}
              disabled={cargandoGrupos}
              className={claseSelect}
            >
              {opcionesGrado.length === 0 && <option value="">Sin grados disponibles</option>}
              {opcionesGrado.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Sección</label>
            <select
              value={seccionSel}
              onChange={(e) => setSeccionSel(e.target.value)}
              disabled={cargandoGrupos}
              className={claseSelect}
            >
              {opcionesSeccion.length === 0 && <option value="">Sin secciones disponibles</option>}
              {opcionesSeccion.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Turno</label>
            <select
              value={turnoSel}
              onChange={(e) => setTurnoSel(e.target.value)}
              disabled={cargandoGrupos}
              className={claseSelect}
            >
              {opcionesTurno.length === 0 && <option value="">Todos</option>}
              {opcionesTurno.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Fecha</label>
            <div className="relative">
              <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mensajes de resultado */}
      {mensaje && (
        <div
          className={`flex items-start gap-2 p-4 rounded-xl text-sm font-medium ${
            mensaje.tipo === 'ok'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-rose-50 border border-rose-200 text-rose-700'
          }`}
        >
          {mensaje.tipo === 'ok' ? (
            <CheckCircle2 size={16} className="mt-0.5" />
          ) : (
            <AlertCircle size={16} className="mt-0.5" />
          )}
          <span>{mensaje.texto}</span>
        </div>
      )}

      {/* Pase de lista: resumen + atajos + guardado */}
      {grupoActivo && alumnos.length > 0 && !cargandoAlumnos && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl shadow-sm">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-200">
            <span className="inline-flex items-center gap-1.5 font-semibold text-white">
              <ClipboardCheck size={16} /> {nombreGrupo}
            </span>
            <span className="text-slate-400">|</span>
            <span>
              Total: <strong className="text-white">{resumen.total}</strong>
            </span>
            <span className="text-emerald-400">
              P: <strong>{resumen.p}</strong>
            </span>
            <span className="text-rose-400">
              A: <strong>{resumen.a}</strong>
            </span>
            <span className="text-sky-400">
              J: <strong>{resumen.j}</strong>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 mr-1">Marcar todos:</span>
            {ESTADOS.map((est) => (
              <button
                key={`todos-${est.valor}`}
                onClick={() => marcarTodos(est.valor)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-600 text-slate-300 hover:bg-slate-800"
                title={`Marcar a todos como ${est.etiqueta}`}
              >
                {est.valor}
              </button>
            ))}
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 ml-2"
            >
              {guardando ? (
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <ClipboardCheck size={16} />
              )}
              Guardar asistencia
            </button>
          </div>
        </div>
      )}

      {/* Tabla de alumnos del grupo */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {cargandoGrupos || cargandoAlumnos ? (
          <div className="p-10 text-center text-sm text-slate-500">
            <span className="inline-block w-5 h-5 border-2 border-slate-300 border-t-sky-600 rounded-full animate-spin align-middle mr-2" />
            Cargando listado de alumnos...
          </div>
        ) : !grupoActivo ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Seleccione un <strong>Grado</strong>, <strong>Sección</strong> y <strong>Turno</strong> con grupo académico
            disponible para pasar lista.
          </div>
        ) : alumnos.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No hay alumnos con inscripción activa en <strong>{nombreGrupo}</strong>.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-semibold w-12">#</th>
                  <th className="px-4 py-3 font-semibold">Alumno</th>
                  <th className="px-4 py-3 font-semibold w-40">Cédula</th>
                  <th className="px-4 py-3 font-semibold w-64 text-center">Estado (P / A / J)</th>
                  <th className="px-4 py-3 font-semibold">Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alumnos.map((al, idx) => {
                  const marca = marcas[al.id_alumno] || { estado: 'P', observaciones: '' };
                  const yaRegistrado = Boolean(previas[al.id_alumno]);
                  return (
                    <tr key={al.id_alumno} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 text-slate-400 font-medium">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {nombreAlumno(al)}
                        {yaRegistrado && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                            ya registrado
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {al.cedula_escolar || al.numero_documento_identidad || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {ESTADOS.map((est) => (
                            <button
                              key={`${al.id_alumno}-${est.valor}`}
                              type="button"
                              onClick={() => marcar(al.id_alumno, 'estado', est.valor)}
                              title={est.etiqueta}
                              className={`w-11 h-9 rounded-lg border text-xs font-bold transition-colors ${
                                marca.estado === est.valor ? est.activo : est.inactivo
                              }`}
                            >
                              {est.valor}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={marca.observaciones}
                          onChange={(e) => marcar(al.id_alumno, 'observaciones', e.target.value)}
                          placeholder="Opcional..."
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};




