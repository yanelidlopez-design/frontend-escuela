import { useState, useEffect, useCallback } from 'react';
import { alumnosApi } from '../api/alumnosApi';
import { coreApi } from '../api/coreApi';
import { gruposApi } from '../api/gruposApi';
import { personalApi } from '../api/personalApi';
import { extraerMensajeError } from '../utils/errorUtils';

/**
 * Custom hook del módulo de Alumnos.
 * Centraliza: lista, filtros, catálogos, loading, errores y las
 * operaciones CRUD (sobre la factoría CRUD de la Misión 6) + exportaciones.
 * El componente solo consume estado y callbacks (es puramente visual).
 */
export const useAlumnos = () => {
  // Lista y estados de carga/error
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros de búsqueda
  const [grado, setGrado] = useState('');
  const [seccion, setSeccion] = useState('');
  const [search, setSearch] = useState('');
  const [estatusFilter, setEstatusFilter] = useState('');

  // Catálogos (grados, secciones, grupos y personal) para los selects
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [profesores, setProfesores] = useState([]);

  // Carga la lista de alumnos con los filtros activos del backend
  const fetchAlumnos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await alumnosApi.getAll({
        search,
        estatus_general: estatusFilter,
        grado,
        seccion,
      });
      setAlumnos(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(extraerMensajeError(err));
    } finally {
      setLoading(false);
    }
  }, [search, estatusFilter, grado, seccion]);

  // Carga inicial de catálogos (una sola vez al montar el componente)
  useEffect(() => {
    const loadOpciones = async () => {
      try {
        const [gradosData, seccionesData, gruposData, profesoresData] = await Promise.all([
          coreApi.getGrados(),
          coreApi.getSecciones(),
          gruposApi.getAll(),
          personalApi.getAll({}),
        ]);
        setGrados(Array.isArray(gradosData) ? gradosData : []);
        setSecciones(Array.isArray(seccionesData) ? seccionesData : []);
        setGrupos(Array.isArray(gruposData) ? gruposData : []);
        setProfesores(Array.isArray(profesoresData) ? profesoresData : []);
      } catch (err) {
        console.error(err);
      }
    };
    loadOpciones();
  }, []);

  // Recarga la lista cuando cambian los filtros (fetchAlumnos se redefine por sus deps)
  /* eslint-disable react/set-state-in-effect, react-hooks/exhaustive-deps -- patrón intencional: recargar al cambiar filtros */
  useEffect(() => {
    fetchAlumnos();
  }, [fetchAlumnos]);
  /* eslint-enable react/set-state-in-effect, react-hooks/exhaustive-deps */

  // ---------- Operaciones CRUD (usan la factoría createCrudApi) ----------
  // En error: guardan el mensaje en `error` y re-lanzan para que la vista muestre su alert.

  const handleCreate = useCallback(async (payload) => {
    try {
      await alumnosApi.create(payload);
      setError(null);
      await fetchAlumnos();
    } catch (err) {
      setError(extraerMensajeError(err));
      throw err;
    }
  }, [fetchAlumnos]);

  const handleUpdate = useCallback(async (id, payload) => {
    try {
      await alumnosApi.update(id, payload);
      setError(null);
      await fetchAlumnos();
    } catch (err) {
      setError(extraerMensajeError(err));
      throw err;
    }
  }, [fetchAlumnos]);

  const handleDelete = useCallback(async (id) => {
    try {
      await alumnosApi.delete(id);
      setError(null);
      await fetchAlumnos();
    } catch (err) {
      setError(extraerMensajeError(err));
      throw err;
    }
  }, [fetchAlumnos]);

  // ---------- Exportaciones (respetan los filtros activos) ----------
  const exportarExcel = useCallback(
    () => alumnosApi.exportarExcel({ grado, seccion, estado: estatusFilter }).catch(() => {}),
    [grado, seccion, estatusFilter]
  );
  const exportarPdf = useCallback(
    () => alumnosApi.exportarPdf({ grado, seccion, estado: estatusFilter }).catch(() => {}),
    [grado, seccion, estatusFilter]
  );
  const exportarCSV = useCallback(
    () => alumnosApi.exportarCSV({ grado, seccion, estado: estatusFilter }).catch(() => {}),
    [grado, seccion, estatusFilter]
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    // Estado
    alumnos,
    loading,
    error,
    // Filtros
    grado,
    setGrado,
    seccion,
    setSeccion,
    search,
    setSearch,
    estatusFilter,
    setEstatusFilter,
    // Catálogos
    grados,
    secciones,
    grupos,
    profesores,
    // Acciones
    fetchAlumnos,
    handleCreate,
    handleUpdate,
    handleDelete,
    clearError,
    // Exportaciones
    exportarExcel,
    exportarPdf,
    exportarCSV,
  };
};
