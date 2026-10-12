import { useState, useEffect, useMemo, useCallback } from 'react';
import { gruposApi } from '../api/gruposApi';
import { asistenciasApi } from '../api/asistenciasApi';

// --- Normalización de grupos: backend real (FK + *_detalle) vs mock ---
export const nombreGrado = (g) =>
  g?.grado_detalle?.nombre_grado || (typeof g?.grado === 'string' ? g.grado : '');
export const nombreSeccion = (g) =>
  g?.seccion_detalle?.nombre_seccion || (typeof g?.seccion === 'string' ? g.seccion : '');
export const nombreTurno = (g) =>
  g?.turno_detalle?.nombre_turno || (typeof g?.turno === 'string' ? g.turno : '');
const idGrupo = (g) => g?.id_grupo ?? g?.id;

export const nombreAlumno = (al) =>
  [al.primer_nombre, al.segundo_nombre, al.primer_apellido, al.segundo_apellido]
    .filter(Boolean)
    .join(' ') ||
  al.nombre_completo ||
  `Alumno ${al.id_alumno}`;

const hoyISO = () => new Date().toISOString().split('T')[0];

/**
 * Custom hook del módulo de Asistencias.
 * Centraliza: selectores (Grado/Sección/Turno/Fecha), catálogo de grupos,
 * listado de alumnos del grupo, marcas de pase de lista, estados de
 * carga/guardado/mensajes y el guardado masivo por lote (Promise.all)
 * contra /api/academico/asistencias/. La vista solo maneja UI de fila.
 */
export const useAsistencias = () => {
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

  // --- Estados de carga / guardado / mensajes ---
  const [cargandoGrupos, setCargandoGrupos] = useState(true);
  const [cargandoAlumnos, setCargandoAlumnos] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null); // { tipo: 'ok' | 'error', texto }

  // Opciones únicas derivadas de /api/academico/grupos/
  const opcionesGrado = useMemo(() => [...new Set(grupos.map(nombreGrado).filter(Boolean))], [grupos]);
  const opcionesSeccion = useMemo(() => [...new Set(grupos.map(nombreSeccion).filter(Boolean))], [grupos]);
  const opcionesTurno = useMemo(() => [...new Set(grupos.map(nombreTurno).filter(Boolean))], [grupos]);

  // Carga inicial de grupos académicos (catálogo al montar)
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
    // eslint-disable-next-line react/set-state-in-effect -- deriva el grupo activo desde los filtros Grado+Sección+Turno
    setGrupoActivo(grupo || null);
  }, [grupos, gradoSel, seccionSel, turnoSel]);

  // Cargar alumnos activos del grupo + asistencias ya registradas en la fecha
  const fetchAsistencias = useCallback(async () => {
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

  // Sincronizar el listado cuando cambian el grupo o la fecha
  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect -- sincroniza el listado con el grupo y la fecha seleccionados
    fetchAsistencias();
  }, [grupoActivo, fecha, fetchAsistencias]);

  // Guardar lote -> PUT a registros existentes + POST a nuevos en /api/academico/asistencias/
  const handleGuardarAsistencias = useCallback(async () => {
    if (!grupoActivo || alumnos.length === 0) return;
    setGuardando(true);
    setMensaje(null);

    try {
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
        await fetchAsistencias();
      }
    } catch (err) {
      console.error(err);
      setMensaje({
        tipo: 'error',
        texto: 'Ocurrió un error al procesar el lote de asistencias',
      });
    } finally {
      setGuardando(false);
    }
  }, [grupoActivo, alumnos, marcas, previas, fecha, fetchAsistencias]);

  // Descartar el mensaje de estado actual (ok o error)
  const clearError = useCallback(() => setMensaje(null), []);

  return {
    // Selectores
    gradoSel,
    setGradoSel,
    seccionSel,
    setSeccionSel,
    turnoSel,
    setTurnoSel,
    fecha,
    setFecha,
    grupos,
    grupoActivo,
    // Catálogo derivado para los <select>
    opcionesGrado,
    opcionesSeccion,
    opcionesTurno,
    // Listado de pasaje de lista
    alumnos,
    previas,
    marcas,
    setMarcas,
    // Estados de carga / guardado / mensaje
    cargandoGrupos,
    cargandoAlumnos,
    guardando,
    mensaje,
    // Acciones
    fetchAsistencias,
    handleGuardarAsistencias,
    clearError,
  };
};

