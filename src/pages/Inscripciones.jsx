import React, { useState, useEffect } from 'react';
import { inscripcionesApi } from '../api/inscripcionesApi';
import { alumnosApi } from '../api/alumnosApi';
import { gruposApi } from '../api/gruposApi';
import { personalApi } from '../api/personalApi';
import { coreApi } from '../api/coreApi';
import {
  listarPeriodos,
  crearPeriodo,
  alternarEstadoPeriodo,
  actualizarPeriodo,
  eliminarPeriodo,
  obtenerPeriodoActivo,
  construirUrlInscripcionPublica,
} from '../api/periodosApi';
import { extraerMensajeError } from '../utils/errorUtils';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportUtils';
import { Modal } from '../components/Modal';
import { Plus, Search, Edit2, Trash2, RefreshCw, FileSpreadsheet, FileText, Download } from 'lucide-react';

const nombreGrado = (g) => g?.grado_detalle?.nombre_grado || (typeof g?.grado === 'string' ? g.grado : '');
const nombreSeccion = (g) => g?.seccion_detalle?.nombre_seccion || (typeof g?.seccion === 'string' ? g.seccion : '');
const nombrePeriodo = (g) => g?.periodo_detalle?.nombre_periodo || (typeof g?.periodo === 'string' ? g.periodo : '');

// Tallas de uniforme escolar (4 a 18) para camisa y pantalón.
const TALLAS_UNIFORME = ['4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18'];


export const Inscripciones = () => {
  const [inscripciones, setInscripciones] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linkPublico, setLinkPublico] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [loadingPeriodos, setLoadingPeriodos] = useState(false);
  const [editandoPeriodo, setEditandoPeriodo] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaFechaInicio, setNuevaFechaInicio] = useState('');
  const [nuevaFechaFin, setNuevaFechaFin] = useState('');
  const [creandoPeriodo, setCreandoPeriodo] = useState(false);
  const [nombreNuevoPeriodo, setNombreNuevoPeriodo] = useState('');
  const [fechaInicioNuevoPeriodo, setFechaInicioNuevoPeriodo] = useState('');
  const [fechaFinNuevoPeriodo, setFechaFinNuevoPeriodo] = useState('');
  const [guardandoPeriodo, setGuardandoPeriodo] = useState(false);
  // Lista completa de periodos (activos e inactivos) para que el admin vea
  // también los recién creados con el switch apagado.
  const [listaPeriodos, setListaPeriodos] = useState([]);
  // pk del periodo que se está editando en el formulario inline.
  const [periodoEditandoId, setPeriodoEditandoId] = useState(null);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [gradoFilter, setGradoFilter] = useState('');
  const [seccionFilter, setSeccionFilter] = useState('');
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    alumno: '',
    grupo: '',
    profesor_encargado: '',
    // eslint-disable-next-line react/purity -- valor inicial del form con la fecha de hoy (impuro solo en el primer render del estado)
    fecha_inscripcion: new Date().toISOString().split('T')[0],
    estado_inscripcion: 'Activa',
    monto_pago: '',
    referencia_bancaria: '',
    crearNuevoAlumno: false,
    nuevoAlumno: {
      primer_nombre: '',
      segundo_nombre: '',
      primer_apellido: '',
      segundo_apellido: '',
      tipo_documento_identidad: 'V',
      numero_documento_identidad: '',
      cedula_escolar: '',
      fecha_nacimiento: '',
      genero: 'Masculino',
      lugar_nacimiento: '',
      nacionalidad: 'Venezolana',
      grupo_sanguineo: 'O+',
      peso_kg: '',
      talla_cm: '',
      talla_camisa: '',
      talla_pantalon: '',
      talla_zapato: '',
      alergico_a: '',
      tratamiento_medico: '',
      condicion_fisica: '',
      discapacidad: false,
      tipo_discapacidad: '',
      carnet_patria_codigo: '',
      carnet_patria_serial: '',
      numero_cuenta: '',
      tipo_cuenta: '',
      banco: '',
      entidad_federal_nacimiento: '',
      municipio_nacimiento: '',
      parroquia_nacimiento: '',
      apoyo_escolar: false,
      vacunas_completas: false,
      estado_civil_padres: '',
      profesion_madre: '',
      profesion_padre: '',
      ingreso_familiar: '',
      tipo_vivienda: '',
      numero_hermanos: '',
      numero_en_el_planter: '',
      observaciones: '',
      direccion: { calle: '', ciudad: '', estado: '', referencia: '' },
      representante: { cedula: '', nombre: '', telefono: '' },
      parentesco: ''
    }
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [inscripcionesData, alumnosData, gruposData, profesoresData] = await Promise.all([
        inscripcionesApi.getAll({ search, estado_inscripcion: estadoFilter, grado: gradoFilter, seccion: seccionFilter }),
        alumnosApi.getAll(),
        gruposApi.getAll(),
        personalApi.getAll({ categoria: 'Profesor' })
      ]);
      setInscripciones(inscripcionesData);
      setAlumnos(alumnosData);
      setGrupos(gruposData);
      setProfesores(Array.isArray(profesoresData) ? profesoresData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* eslint-disable react/set-state-in-effect, react-hooks/exhaustive-deps -- cargar al cambiar filtros; loadData se redefine cada render a propósito */
  useEffect(() => {
    loadData();
  }, [search, estadoFilter, gradoFilter, seccionFilter]);
  /* eslint-enable react/set-state-in-effect, react-hooks/exhaustive-deps */

  // Catálogos de grados y secciones (una sola vez al montar) para filtros y exportación.
  /* eslint-disable react/set-state-in-effect -- catálogo estático al montar */
  useEffect(() => {
    const loadCatalogos = async () => {
      try {
        const [gradosData, seccionesData] = await Promise.all([
          coreApi.getGrados(),
          coreApi.getSecciones()
        ]);
        setGrados(Array.isArray(gradosData) ? gradosData : []);
        setSecciones(Array.isArray(seccionesData) ? seccionesData : []);
      } catch (err) {
        console.error('Error cargando grados/secciones:', err);
      }
    };
    loadCatalogos();
  }, []);
  /* eslint-enable react/set-state-in-effect */

  // Carga todos los periodos de inscripción, actualiza la lista completa y
  // deriva el periodo activo + link público. Se reutiliza tras crear/editar/
  // alternar para mantener la UI sincronizada con el backend.
  const recargarPeriodos = async () => {
    setLoadingPeriodos(true);
    try {
      const response = await listarPeriodos();
      const data = Array.isArray(response.data) ? response.data : [];
      setListaPeriodos(data);
      const activo = obtenerPeriodoActivo(data);
      if (activo?.token_acceso) {
        setLinkPublico(construirUrlInscripcionPublica(activo.token_acceso));
      } else {
        setLinkPublico('');
      }
    } catch (err) {
      console.error('Error cargando periodos de inscripción:', err);
    } finally {
      setLoadingPeriodos(false);
    }
  };

  // Carga los periodos al montar la página.
  /* eslint-disable react/set-state-in-effect, react-hooks/exhaustive-deps -- carga única al montar */
  useEffect(() => {
    recargarPeriodos();
  }, []);
  /* eslint-enable react/set-state-in-effect, react-hooks/exhaustive-deps */

  const copiarLinkPublico = async () => {
    if (!linkPublico) return;
    try {
      await navigator.clipboard.writeText(linkPublico);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (err) {
      console.error('No se pudo copiar el enlace:', err);
    }
  };

  const toggleEstadoPeriodo = async (id) => {
    const periodo = listaPeriodos.find((p) => p.id === id);
    if (!periodo) return;
    try {
      await alternarEstadoPeriodo(id, !periodo.activo_manual);
      await recargarPeriodos();
    } catch (err) {
      console.error('Error alternando estado del periodo:', err);
    }
  };

  const abrirEdicionPeriodo = (periodo) => {
    if (!periodo) return;
    // La API devuelve fechas ISO (ej: '2026-11-01T00:00:00-04:00'), pero
    // <input type="date"> solo acepta 'YYYY-MM-DD'. Se corta la parte de
    // tiempo conservando la fecha tal como la expresó el backend.
    setPeriodoEditandoId(periodo.id);
    setNuevoNombre(periodo.nombre || '');
    setNuevaFechaInicio(periodo.fecha_inicio ? periodo.fecha_inicio.split('T')[0] : '');
    setNuevaFechaFin(periodo.fecha_fin ? periodo.fecha_fin.split('T')[0] : '');
    setEditandoPeriodo(true);
    setCreandoPeriodo(false);
  };

  const guardarEdicionPeriodo = async () => {
    if (!periodoEditandoId) return;
    try {
      await actualizarPeriodo(periodoEditandoId, {
        nombre: nuevoNombre,
        fecha_inicio: nuevaFechaInicio,
        fecha_fin: nuevaFechaFin,
      });
      await recargarPeriodos();
      setEditandoPeriodo(false);
      setPeriodoEditandoId(null);
    } catch (err) {
      console.error('Error actualizando periodo:', err);
    }
  };

  const cancelarEdicionPeriodo = () => {
    setEditandoPeriodo(false);
    setPeriodoEditandoId(null);
  };

  const abrirCreacionPeriodo = () => {
    setNombreNuevoPeriodo('');
    setFechaInicioNuevoPeriodo('');
    setFechaFinNuevoPeriodo('');
    setCreandoPeriodo(true);
    // Cerrar el formulario de edición si estuviera abierto.
    setEditandoPeriodo(false);
    setPeriodoEditandoId(null);
  };

  const cancelarCreacionPeriodo = () => {
    setCreandoPeriodo(false);
  };

  const guardarCreacionPeriodo = async () => {
    if (!nombreNuevoPeriodo || !fechaInicioNuevoPeriodo || !fechaFinNuevoPeriodo) return;
    setGuardandoPeriodo(true);
    try {
      await crearPeriodo({
        nombre: nombreNuevoPeriodo,
        fecha_inicio: fechaInicioNuevoPeriodo,
        fecha_fin: fechaFinNuevoPeriodo,
        activo_manual: false,
      });
      // Recargar la lista completa: el periodo nuevo aparecerá en la tabla
      // con el switch apagado, listo para activarlo desde el botón.
      await recargarPeriodos();
      setCreandoPeriodo(false);
    } catch (err) {
      console.error('Error creando periodo:', err);
    } finally {
      setGuardandoPeriodo(false);
    }
  };

  const eliminarPeriodoConfirmado = async (periodo) => {
    if (!periodo) return;
    const mensaje = periodo.activo_manual
      ? `¿Eliminar el periodo "${periodo.nombre}"? Está ACTIVO: el enlace público dejará de funcionar.`
      : `¿Eliminar el periodo "${periodo.nombre}"? Esta acción no se puede deshacer.`;
    if (!window.confirm(mensaje)) return;
    try {
      await eliminarPeriodo(periodo.id);
      await recargarPeriodos();
    } catch (err) {
      console.error('Error eliminando periodo:', err);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        alumno: item.alumno_id || item.alumno,
        grupo: item.grupo_id || item.grupo,
        profesor_encargado: item.profesor_encargado || '',
        fecha_inscripcion: item.fecha_inscripcion ? item.fecha_inscripcion.split('T')[0] : new Date().toISOString().split('T')[0],
        estado_inscripcion: item.estado_inscripcion,
        monto_pago: item.monto_pago || '',
        referencia_bancaria: item.referencia_bancaria || '',
        crearNuevoAlumno: false,
        nuevoAlumno: {
          primer_nombre: '',
          segundo_nombre: '',
          primer_apellido: '',
          segundo_apellido: '',
          tipo_documento_identidad: 'V',
          numero_documento_identidad: '',
          cedula_escolar: '',
          fecha_nacimiento: '',
          genero: 'Masculino',
          lugar_nacimiento: '',
          nacionalidad: 'Venezolana',
          grupo_sanguineo: 'O+',
          peso_kg: '',
          talla_cm: '',
          talla_camisa: '',
          talla_pantalon: '',
          talla_zapato: '',
          alergico_a: '',
          tratamiento_medico: '',
          condicion_fisica: '',
          discapacidad: false,
          tipo_discapacidad: '',
          carnet_patria_codigo: '',
          carnet_patria_serial: '',
          numero_cuenta: '',
          tipo_cuenta: '',
          banco: '',
          entidad_federal_nacimiento: '',
          municipio_nacimiento: '',
          parroquia_nacimiento: '',
          apoyo_escolar: false,
          vacunas_completas: false,
          estado_civil_padres: '',
          profesion_madre: '',
          profesion_padre: '',
          ingreso_familiar: '',
          tipo_vivienda: '',
          numero_hermanos: '',
          numero_en_el_planter: '',
          observaciones: '',
          direccion: { calle: '', ciudad: '', estado: '', referencia: '' },
          representante: { cedula: '', nombre: '', telefono: '' },
          parentesco: ''
        }
      });
    } else {
      setEditingItem(null);
      setFormData({
        alumno: '',
        grupo: '',
        profesor_encargado: '',
        fecha_inscripcion: new Date().toISOString().split('T')[0],
        estado_inscripcion: 'Activa',
        monto_pago: '',
        referencia_bancaria: '',
        crearNuevoAlumno: false,
        nuevoAlumno: {
          primer_nombre: '',
          segundo_nombre: '',
          primer_apellido: '',
          segundo_apellido: '',
          tipo_documento_identidad: 'V',
          numero_documento_identidad: '',
          cedula_escolar: '',
          fecha_nacimiento: '',
          genero: 'Masculino',
          lugar_nacimiento: '',
          nacionalidad: 'Venezolana',
          grupo_sanguineo: 'O+',
          peso_kg: '',
          talla_cm: '',
          talla_camisa: '',
          talla_pantalon: '',
          talla_zapato: '',
          alergico_a: '',
          tratamiento_medico: '',
          condicion_fisica: '',
          discapacidad: false,
          tipo_discapacidad: '',
          carnet_patria_codigo: '',
          carnet_patria_serial: '',
          numero_cuenta: '',
          tipo_cuenta: '',
          banco: '',
          entidad_federal_nacimiento: '',
          municipio_nacimiento: '',
          parroquia_nacimiento: '',
          apoyo_escolar: false,
          vacunas_completas: false,
          estado_civil_padres: '',
          profesion_madre: '',
          profesion_padre: '',
          ingreso_familiar: '',
          tipo_vivienda: '',
          numero_hermanos: '',
          numero_en_el_planter: '',
          observaciones: '',
          direccion: { calle: '', ciudad: '', estado: '', referencia: '' },
          representante: { cedula: '', nombre: '', telefono: '' },
          parentesco: ''
        }
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.crearNuevoAlumno) {
        // Construir payload del alumno; representante y dirección viajan anidados (opcionales)
        const { representante, parentesco, direccion, ...camposAlumno } = formData.nuevoAlumno;
        const payloadAlumno = {
          ...camposAlumno,
          fecha_inscripcion_inicial: formData.fecha_inscripcion,
          estatus_general: 'Activo'
        };
        // Enteros opcionales: cadena vacía => null (DRF rechaza '' en campos Integer).
        if (payloadAlumno.numero_hermanos === '') payloadAlumno.numero_hermanos = null;
        if (payloadAlumno.numero_en_el_planter === '') payloadAlumno.numero_en_el_planter = null;
        if (direccion && direccion.calle && direccion.calle.trim()) {
          payloadAlumno.direccion = direccion;
        }
        if (representante && representante.cedula && representante.cedula.trim()) {
          payloadAlumno.representante = representante;
          payloadAlumno.parentesco = parentesco;
        }

        // Crear alumno: el backend crea representante + relación pivot de forma atómica
        const nuevoAlumno = await alumnosApi.create(payloadAlumno);
        
        // Luego crear la inscripción con el nuevo alumno
        const payload = {
          alumno: nuevoAlumno.id_alumno,
          grupo: formData.grupo,
          profesor_encargado: formData.profesor_encargado || null,
          fecha_inscripcion: formData.fecha_inscripcion ? `${formData.fecha_inscripcion}T09:00:00` : null,
          estado_inscripcion: formData.estado_inscripcion,
          monto_pago: formData.monto_pago,
          referencia_bancaria: formData.referencia_bancaria
        };
        
        await inscripcionesApi.create(payload);
      } else {
        // Usar alumno existente
        const payload = {
          alumno: formData.alumno,
          grupo: formData.grupo,
          profesor_encargado: formData.profesor_encargado || null,
          fecha_inscripcion: formData.fecha_inscripcion ? `${formData.fecha_inscripcion}T09:00:00` : null,
          estado_inscripcion: formData.estado_inscripcion,
          monto_pago: formData.monto_pago,
          referencia_bancaria: formData.referencia_bancaria
        };
        
        if (editingItem) {
          await inscripcionesApi.update(editingItem.id_inscripcion, payload);
        } else {
          await inscripcionesApi.create(payload);
        }
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert(`No se pudo guardar la inscripción: ${extraerMensajeError(err)}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar esta inscripción?')) {
      await inscripcionesApi.delete(id);
      loadData();
    }
  };

  const getAlumnoNombre = (alumnoId) => {
    const alumno = alumnos.find(a => a.id_alumno === alumnoId || a.id === alumnoId);
    if (alumno) {
      return `${alumno.primer_nombre} ${alumno.primer_apellido}`;
    }
    return 'Alumno no encontrado';
  };

  const getAlumnoCedula = (alumnoId) => {
    const alumno = alumnos.find(a => a.id_alumno === alumnoId || a.id === alumnoId);
    if (alumno) {
      return alumno.cedula_escolar;
    }
    return '-';
  };

  const getGrupoNombre = (grupoId) => {
    const grupo = grupos.find(g => g.id_grupo === grupoId || g.id === grupoId);
    if (grupo) {
      // Usa los *_detalle del serializer (nombres reales); nunca la FK numérica.
      const grado = nombreGrado(grupo).trim();
      const seccion = nombreSeccion(grupo).trim();
      if (grado && seccion) return `${grado}-${seccion}`;
      return (grado || seccion) || 'Grado-Sección no encontrado';
    }
    return 'Grado-Sección no encontrado';
  };

  const getGrupoDetalle = (grupoId) => {
    const grupo = grupos.find(g => g.id_grupo === grupoId || g.id === grupoId);
    if (grupo) {
      return {
        grado: nombreGrado(grupo),
        seccion: nombreSeccion(grupo),
        periodo: nombrePeriodo(grupo)
      };
    }
    return { grado: '-', seccion: '-', periodo: '-' };
  };

  // Nombre completo de un profesor a partir de su id (id_profesor del backend).
  const nombreProfesor = (profesorId) => {
    if (!profesorId) return '';
    const p = profesores.find(
      pr => (pr.id_profesor ?? pr.id) === profesorId
    );
    if (p) {
      return `${p.primer_nombre || ''} ${p.segundo_nombre || ''} ${p.primer_apellido || ''} ${p.segundo_apellido || ''}`.replace(/\s+/g, ' ').trim();
    }
    return '';
  };

  // Nombre completo del docente guía de un grupo.
  // Backend real -> grupo.profesor_guia_detalle; mock offline -> grupo.tutor.
  const getProfesorDelGrupo = (grupoId) => {
    const grupo = grupos.find(g => (g.id_grupo ?? g.id) === grupoId);
    if (!grupo) return '';
    const detalle = grupo.profesor_guia_detalle || grupo.profesor_director_detalle || null;
    if (detalle) {
      const idProf = detalle.id_profesor ?? detalle.id;
      return nombreProfesor(idProf) ||
        `${detalle.primer_nombre || ''} ${detalle.primer_apellido || ''}`.trim();
    }
    // Fallback offline: los grupos mock guardan el docente en 'tutor'
    if (grupo.tutor) return grupo.tutor;
    return '';
  };

  // Resuelve el ID del docente guía del grupo para preseleccionarlo en el formulario.
  // Intenta cruzarlo con el catálogo 'profesores' (por id o por nombre del tutor mock).
  const resolverProfesorIdDelGrupo = (grupoId) => {
    const grupo = grupos.find(g => (g.id_grupo ?? g.id) === grupoId);
    if (!grupo) return '';
    const detalle = grupo.profesor_guia_detalle || grupo.profesor_director_detalle || null;
    if (detalle) {
      const idProf = detalle.id_profesor ?? detalle.id;
      return idProf || '';
    }
    // Fallback offline: emparejar el nombre 'tutor' con el catálogo de profesores
    if (grupo.tutor) {
      const match = profesores.find(p => {
        const nombre = `${p.primer_nombre || ''} ${p.primer_apellido || ''}`.trim();
        return grupo.tutor.includes(nombre) || nombre.includes(grupo.tutor);
      });
      return match ? (match.id_profesor ?? match.id) : '';
    }
    return '';
  };

  const formatMonto = (monto) => {
    if (!monto) return '-';
    return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(monto);
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Activa':
        return 'bg-emerald-100 text-emerald-700';
      case 'Retirado':
        return 'bg-rose-100 text-rose-700';
      case 'Graduado':
        return 'bg-sky-100 text-sky-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  // --- Exportación del listado visible (cliente, respeta los filtros activos) ---
  // Los endpoints backend de exportación de inscripciones no existen (404
  // silencioso): se genera el archivo en el navegador con las mismas columnas
  // de la tabla, sobre la lista ya filtrada por el servidor.
  const filasExport = () =>
    inscripciones.map((item) => ({
      Alumno: getAlumnoNombre(item.alumno_id || item.alumno),
      Cedula: getAlumnoCedula(item.alumno_id || item.alumno),
      'Grado y Sección': getGrupoNombre(item.grupo_id || item.grupo),
      Periodo: getGrupoDetalle(item.grupo_id || item.grupo)?.periodo || '',
      'Fecha Inscripcion': item.fecha_inscripcion
        ? new Date(item.fecha_inscripcion).toLocaleDateString('es-VE')
        : '',
      Estado: item.estado_inscripcion || '',
      'Monto Pago': formatMonto(item.monto_pago),
      Referencia: item.referencia_bancaria || '',
    }));

  const exportarExcel = () => exportToExcel(filasExport(), 'inscripciones.xlsx', 'Inscripciones');
  const exportarPdf = () => exportToPDF(filasExport(), 'Listado de Inscripciones', 'inscripciones.pdf');
  const exportarCSV = () => exportToCSV(filasExport(), 'inscripciones.csv');

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Gestión de Inscripciones</h3>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            className="p-2.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            title="Recargar datos"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm px-4 py-2.5 rounded-xl shadow-md transition-all"
          >
            <Plus size={18} />
            <span>Nueva Inscripción</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center space-x-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre del alumno o cédula escolar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <select
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">Todos los estados</option>
          <option value="Activa">Activa</option>
          <option value="Retirado">Retirado</option>
          <option value="Graduado">Graduado</option>
        </select>
        <select
          value={gradoFilter}
          onChange={(e) => setGradoFilter(e.target.value)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">Todos los grados</option>
          {grados.map((g) => (
            <option key={g.id_grado} value={g.id_grado}>{g.nombre_grado}</option>
          ))}
        </select>
        <select
          value={seccionFilter}
          onChange={(e) => setSeccionFilter(e.target.value)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">Todas las secciones</option>
          {secciones.map((s) => (
            <option key={s.id_seccion} value={s.id_seccion}>{s.nombre_seccion}</option>
          ))}
        </select>
      </div>

      {/* Exportación (respeta los filtros activos: grados/secciones/estado/búsqueda) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="text-sm text-slate-500">
          <span className="font-semibold text-slate-700">Exportación:</span>
          <span className="ml-2 text-xs text-slate-400">
            {gradoFilter || seccionFilter || estadoFilter || search
              ? 'con los filtros seleccionados en la vista'
              : 'todas las inscripciones'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportarExcel}
            disabled={!inscripciones.length}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button
            type="button"
            onClick={exportarPdf}
            disabled={!inscripciones.length}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText size={16} /> PDF
          </button>
          <button
            type="button"
            onClick={exportarCSV}
            disabled={!inscripciones.length}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} /> CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Alumno</th>
                <th className="px-6 py-4">Grado y Sección</th>
                <th className="px-6 py-4">Fecha Inscripción</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Monto Pago</th>
                <th className="px-6 py-4">Referencia</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400">Cargando datos de inscripciones...</td>
                </tr>
              ) : inscripciones.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400">No se encontraron inscripciones registradas.</td>
                </tr>
              ) : (
                inscripciones.map((item) => {
                  const grupoDetalle = getGrupoDetalle(item.grupo_id || item.grupo);
                  return (
                    <tr key={item.id_inscripcion} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{getAlumnoNombre(item.alumno_id || item.alumno)}</div>
                        <div className="text-xs text-slate-400">C.E.: {getAlumnoCedula(item.alumno_id || item.alumno)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{getGrupoNombre(item.grupo_id || item.grupo)}</div>
                        {grupoDetalle.periodo && (
                          <div className="text-xs text-slate-400">Período {grupoDetalle.periodo}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {item.fecha_inscripcion ? new Date(item.fecha_inscripcion).toLocaleDateString('es-VE') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getEstadoColor(item.estado_inscripcion)}`}>
                          {item.estado_inscripcion}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {formatMonto(item.monto_pago)}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {item.referencia_bancaria || '-'}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id_inscripcion)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Inscripción' : 'Nueva Inscripción'}
        size="large"
      >
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {!editingItem && (
            <div className="flex items-center space-x-3 p-4 bg-sky-50 rounded-lg border border-sky-200">
              <input
                type="checkbox"
                id="crearNuevoAlumno"
                checked={formData.crearNuevoAlumno}
                onChange={(e) => setFormData({ ...formData, crearNuevoAlumno: e.target.checked })}
                className="w-5 h-5 text-sky-600 rounded"
              />
              <label htmlFor="crearNuevoAlumno" className="text-sm font-medium text-slate-800">
                Registrar nuevo alumno durante la inscripción
              </label>
            </div>
          )}

          {formData.crearNuevoAlumno && !editingItem ? (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <h4 className="text-sm font-semibold text-slate-800 mb-3">👤 Datos Personales del Alumno</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tipo Documento</label>
                    <select
                      required
                      value={formData.nuevoAlumno.tipo_documento_identidad}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, tipo_documento_identidad: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="V">V - Venezolano</option>
                      <option value="E">E - Extranjero</option>
                      <option value="P">P - Pasaporte</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Número Documento</label>
                    <input
                      type="text"
                      required
                      value={formData.nuevoAlumno.numero_documento_identidad}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, numero_documento_identidad: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Cédula Escolar</label>
                  <input
                    type="text"
                    required
                    value={formData.nuevoAlumno.cedula_escolar}
                    onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, cedula_escolar: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Primer Nombre</label>
                    <input
                      type="text"
                      required
                      value={formData.nuevoAlumno.primer_nombre}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, primer_nombre: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Segundo Nombre</label>
                    <input
                      type="text"
                      value={formData.nuevoAlumno.segundo_nombre}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, segundo_nombre: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Primer Apellido</label>
                    <input
                      type="text"
                      required
                      value={formData.nuevoAlumno.primer_apellido}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, primer_apellido: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Segundo Apellido</label>
                    <input
                      type="text"
                      value={formData.nuevoAlumno.segundo_apellido}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, segundo_apellido: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Fecha Nacimiento</label>
                    <input
                      type="date"
                      required
                      value={formData.nuevoAlumno.fecha_nacimiento}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, fecha_nacimiento: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Género</label>
                    <select
                      value={formData.nuevoAlumno.genero}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, genero: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Lugar Nacimiento</label>
                    <input
                      type="text"
                      value={formData.nuevoAlumno.lugar_nacimiento}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, lugar_nacimiento: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Nacionalidad</label>
                    <input
                      type="text"
                      value={formData.nuevoAlumno.nacionalidad}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, nacionalidad: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Estado Nacimiento</label>
                    <input
                      type="text"
                      value={formData.nuevoAlumno.entidad_federal_nacimiento}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, entidad_federal_nacimiento: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="ej. Miranda"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Municipio Nacimiento</label>
                    <input
                      type="text"
                      value={formData.nuevoAlumno.municipio_nacimiento}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, municipio_nacimiento: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="ej. Sucre"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Parroquia Nacimiento</label>
                    <input
                      type="text"
                      value={formData.nuevoAlumno.parroquia_nacimiento}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, parroquia_nacimiento: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="ej. Petare"
                    />
                  </div>
                </div>
              </div>

              <div className="border-b border-slate-200 pb-4">
                <h4 className="text-sm font-semibold text-slate-800 mb-3">📏 Medidas y Datos Médicos</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Grupo Sanguíneo</label>
                    <select
                      value={formData.nuevoAlumno.grupo_sanguineo}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, grupo_sanguineo: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Peso (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.nuevoAlumno.peso_kg}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, peso_kg: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Talla (cm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.nuevoAlumno.talla_cm}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, talla_cm: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Talla Camisa</label>
                    <select
                      value={formData.nuevoAlumno.talla_camisa}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, talla_camisa: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="">Seleccionar...</option>
                      {TALLAS_UNIFORME.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Talla Pantalón</label>
                    <select
                      value={formData.nuevoAlumno.talla_pantalon}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, talla_pantalon: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="">Seleccionar...</option>
                      {TALLAS_UNIFORME.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Talla Zapato</label>
                    <input
                      type="number"
                      min="20"
                      max="50"
                      value={formData.nuevoAlumno.talla_zapato}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, talla_zapato: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="Ej: 35"
                    />
                  </div>
                </div>

                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Alergias</label>
                    <textarea
                      value={formData.nuevoAlumno.alergico_a}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, alergico_a: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      rows="2"
                      placeholder="Describa cualquier alergia conocida..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tratamiento Médico</label>
                    <textarea
                      value={formData.nuevoAlumno.tratamiento_medico}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, tratamiento_medico: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      rows="2"
                      placeholder="Describa tratamientos médicos actuales..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Condición Física</label>
                      <textarea
                        value={formData.nuevoAlumno.condicion_fisica}
                        onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, condicion_fisica: e.target.value } })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        rows="2"
                        placeholder="Condición física del alumno..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">¿Tiene Discapacidad?</label>
                      <div className="flex items-center space-x-4 mt-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="discapacidad"
                            checked={formData.nuevoAlumno.discapacidad === true}
                            onChange={() => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, discapacidad: true } })}
                            className="mr-2"
                          />
                          Sí
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="discapacidad"
                            checked={formData.nuevoAlumno.discapacidad === false}
                            onChange={() => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, discapacidad: false } })}
                            className="mr-2"
                          />
                          No
                        </label>
                      </div>
                    </div>
                  </div>
                  {formData.nuevoAlumno.discapacidad && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tipo de Discapacidad</label>
                      <textarea
                        value={formData.nuevoAlumno.tipo_discapacidad}
                        onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, tipo_discapacidad: e.target.value } })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        rows="2"
                        placeholder="Describa el tipo de discapacidad..."
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">¿Recibe Apoyo Escolar?</label>
                      <div className="flex items-center space-x-4 mt-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="apoyo_escolar"
                            checked={formData.nuevoAlumno.apoyo_escolar === true}
                            onChange={() => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, apoyo_escolar: true } })}
                            className="mr-2"
                          />
                          Sí
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="apoyo_escolar"
                            checked={formData.nuevoAlumno.apoyo_escolar === false}
                            onChange={() => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, apoyo_escolar: false } })}
                            className="mr-2"
                          />
                          No
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">¿Vacunas Completas?</label>
                      <div className="flex items-center space-x-4 mt-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="vacunas_completas"
                            checked={formData.nuevoAlumno.vacunas_completas === true}
                            onChange={() => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, vacunas_completas: true } })}
                            className="mr-2"
                          />
                          Sí
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="vacunas_completas"
                            checked={formData.nuevoAlumno.vacunas_completas === false}
                            onChange={() => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, vacunas_completas: false } })}
                            className="mr-2"
                          />
                          No
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-b border-slate-200 pb-4">
                <h4 className="text-sm font-semibold text-slate-800 mb-3">🏠 Dirección de Residencia</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Calle / Dirección</label>
                    <input
                      type="text"
                      value={formData.nuevoAlumno.direccion.calle}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, direccion: { ...formData.nuevoAlumno.direccion, calle: e.target.value } } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="ej. Urb. Los Rosales, Casa #12"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Ciudad / Municipio</label>
                      <input
                        type="text"
                        value={formData.nuevoAlumno.direccion.ciudad}
                        onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, direccion: { ...formData.nuevoAlumno.direccion, ciudad: e.target.value } } })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        placeholder="ej. Caracas"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Estado</label>
                      <input
                        type="text"
                        value={formData.nuevoAlumno.direccion.estado}
                        onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, direccion: { ...formData.nuevoAlumno.direccion, estado: e.target.value } } })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        placeholder="ej. Miranda"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Referencia</label>
                    <input
                      type="text"
                      value={formData.nuevoAlumno.direccion.referencia}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, direccion: { ...formData.nuevoAlumno.direccion, referencia: e.target.value } } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="ej. Portón negro, frente a la plaza"
                    />
                  </div>
                </div>
              </div>

              <div className="border-b border-slate-200 pb-4">
                <h4 className="text-sm font-semibold text-slate-800 mb-3">🪪 Carnet de la Patria</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Código</label>
                    <input
                      type="text"
                      value={formData.nuevoAlumno.carnet_patria_codigo}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, carnet_patria_codigo: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="ej. 1234567890123456"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Serial</label>
                    <input
                      type="text"
                      value={formData.nuevoAlumno.carnet_patria_serial}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, carnet_patria_serial: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="ej. ABC123456"
                    />
                  </div>
                </div>
              </div>

              <div className="border-b border-slate-200 pb-4">
                <h4 className="text-sm font-semibold text-slate-800 mb-3">💳 Registros Financieros</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">N° de Cuenta</label>
                    <input
                      type="text"
                      value={formData.nuevoAlumno.numero_cuenta}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, numero_cuenta: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="ej. 01340123456789012345"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tipo de Cuenta</label>
                    <select
                      value={formData.nuevoAlumno.tipo_cuenta}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, tipo_cuenta: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Ahorro">Ahorro</option>
                      <option value="Corriente">Corriente</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Banco</label>
                    <input
                      type="text"
                      value={formData.nuevoAlumno.banco}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, banco: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="ej. Banco de Venezuela"
                    />
                  </div>
                </div>
              </div>

              <div className="border-b border-slate-200 pb-4">
                <h4 className="text-sm font-semibold text-slate-800 mb-3">👨‍👩‍👧 Datos Familiares</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Estado Civil Padres</label>
                    <select
                      value={formData.nuevoAlumno.estado_civil_padres}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, estado_civil_padres: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Casados">Casados</option>
                      <option value="Divorciados">Divorciados</option>
                      <option value="Separados">Separados</option>
                      <option value="Viudos">Viudos</option>
                      <option value="Solteros">Solteros</option>
                      <option value="Unión libre">Unión libre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tipo de Vivienda</label>
                    <select
                      value={formData.nuevoAlumno.tipo_vivienda}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, tipo_vivienda: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Propia">Propia</option>
                      <option value="Alquilada">Alquilada</option>
                      <option value="De familiares">De familiares</option>
                      <option value="Cedida">Cedida</option>
                      <option value="Otra">Otra</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Profesión de la Madre</label>
                    <input
                      type="text"
                      value={formData.nuevoAlumno.profesion_madre}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, profesion_madre: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="ej. Enfermera"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Profesión del Padre</label>
                    <input
                      type="text"
                      value={formData.nuevoAlumno.profesion_padre}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, profesion_padre: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="ej. Chofer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">N° de Hermanos</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.nuevoAlumno.numero_hermanos}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, numero_hermanos: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="ej. 2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">N° de Hermanos en el Plantel</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.nuevoAlumno.numero_en_el_planter}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, numero_en_el_planter: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="ej. 1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Ingreso Familiar (Bs.)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.nuevoAlumno.ingreso_familiar}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, ingreso_familiar: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="ej. 15000"
                    />
                  </div>
                </div>
              </div>

              <div className="border-b border-slate-200 pb-4">
                <h4 className="text-sm font-semibold text-slate-800 mb-3">👨‍👩‍👧 Datos del Representante Legal</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Cédula</label>
                    <input
                      type="text"
                      required
                      value={formData.nuevoAlumno.representante.cedula}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, representante: { ...formData.nuevoAlumno.representante, cedula: e.target.value } } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="ej. V-12345678"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Teléfono</label>
                    <input
                      type="tel"
                      required
                      value={formData.nuevoAlumno.representante.telefono}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, representante: { ...formData.nuevoAlumno.representante, telefono: e.target.value } } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="ej. 04121234567"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      required
                      value={formData.nuevoAlumno.representante.nombre}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, representante: { ...formData.nuevoAlumno.representante, nombre: e.target.value } } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="ej. Pedro Pérez"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Parentesco</label>
                    <select
                      required
                      value={formData.nuevoAlumno.parentesco}
                      onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, parentesco: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="">Seleccionar parentesco...</option>
                      <option value="Padre">Padre</option>
                      <option value="Madre">Madre</option>
                      <option value="Abuelo/a">Abuelo/a</option>
                      <option value="Tío/a">Tío/a</option>
                      <option value="Tutor Legal">Tutor Legal</option>
                      <option value="Hermano/a">Hermano/a</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-b border-slate-200 pb-4">
                <h4 className="text-sm font-semibold text-slate-800 mb-3">🗒️ Observaciones</h4>
                <textarea
                  value={formData.nuevoAlumno.observaciones}
                  onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, observaciones: e.target.value } })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  rows="3"
                  placeholder="Notas u observaciones generales del alumno..."
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Alumno</label>
              <select
                required
                value={formData.alumno}
                onChange={(e) => setFormData({ ...formData, alumno: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Seleccionar alumno...</option>
                {alumnos.map((alumno) => (
                  <option key={alumno.id_alumno} value={alumno.id_alumno}>
                    {alumno.primer_nombre} {alumno.primer_apellido} - {alumno.cedula_escolar}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">🏫 Grado, Sección y Docente Encargado</h4>
            <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Grado y Sección</label>
            <select
              required
              value={formData.grupo}
              onChange={(e) => {
                const grupoId = e.target.value;
                const profId = resolverProfesorIdDelGrupo(grupoId);
                setFormData({
                  ...formData,
                  grupo: grupoId,
                  profesor_encargado: profId || formData.profesor_encargado || ''
                });
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">Seleccionar grado y sección...</option>
              {grupos.map((grupo) => {
                // Normaliza el id: backend real usa id_grupo; mock offline usa id.
                const grupoId = grupo.id_grupo ?? grupo.id;
                const grado = nombreGrado(grupo);
                const seccion = nombreSeccion(grupo);
                return (
                  <option key={grupoId} value={grupoId}>
                    {grado} - Sección {seccion}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Profesor Encargado
            </label>
            {/* Derivado automáticamente del grupo seleccionado (docente guía de la sección).
                En modo offline se resuelve cruzando con el catálogo de personal filtrado por 'Profesor'. */}
            <select
              required
              value={formData.profesor_encargado || ''}
              onChange={(e) => setFormData({ ...formData, profesor_encargado: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-500"
              disabled={!formData.grupo}
            >
              <option value="">
                {formData.grupo ? 'Seleccionar profesor...' : 'Primero seleccione un grado y sección...'}
              </option>
              {profesores.map((profesor) => (
                <option key={profesor.id_profesor ?? profesor.id} value={profesor.id_profesor ?? profesor.id}>
                  {`${profesor.primer_nombre || ''} ${profesor.segundo_nombre || ''} ${profesor.primer_apellido || ''} ${profesor.segundo_apellido || ''}`.replace(/\s+/g, ' ').trim()}
                  {profesor.especialidad ? ` — ${profesor.especialidad}` : ''}
                </option>
              ))}
            </select>
            {formData.grupo && getProfesorDelGrupo(formData.grupo) && (
              <p className="mt-1 text-xs text-slate-500">
                Docente guía de esta sección: <span className="font-medium text-slate-700">{getProfesorDelGrupo(formData.grupo)}</span>
              </p>
            )}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">📝 Detalles de la Inscripción</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Fecha Inscripción</label>
              <input
                type="date"
                required
                value={formData.fecha_inscripcion}
                onChange={(e) => setFormData({ ...formData, fecha_inscripcion: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Estado</label>
              <select
                required
                value={formData.estado_inscripcion}
                onChange={(e) => setFormData({ ...formData, estado_inscripcion: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="Activa">Activa</option>
                <option value="Retirado">Retirado</option>
                <option value="Graduado">Graduado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Monto Pago</label>
              <input
                type="number"
                step="0.01"
                value={formData.monto_pago}
                onChange={(e) => setFormData({ ...formData, monto_pago: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Referencia Bancaria</label>
              <input
                type="text"
                value={formData.referencia_bancaria}
                onChange={(e) => setFormData({ ...formData, referencia_bancaria: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="BOD-2024-XXX"
              />
            </div>
          </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg text-sm"
            >
              Guardar
            </button>
          </div>
        </form>
      </Modal>

      {/* === Link de inscripción pública ======================================== */}
      <section className="mt-8 border border-slate-200 rounded-xl p-4 bg-slate-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              🔗 Inscripción Pública
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Compartí este enlace con los representantes para que se inscriban
              sin necesidad de usuario en la plataforma.
            </p>
          </div>
          <button
            onClick={abrirCreacionPeriodo}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg"
          >
            + Crear nuevo periodo
          </button>
        </div>

        {/* Enlace del periodo activo (si lo hay) */}
        {loadingPeriodos ? (
          <p className="mt-3 text-xs text-slate-500 animate-pulse">Cargando…</p>
        ) : linkPublico ? (
          <div className="mt-3 flex items-center gap-2">
            <input
              type="text"
              value={linkPublico}
              readOnly
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <button
              onClick={copiarLinkPublico}
              disabled={copiado}
              className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs rounded-lg disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {copiado ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-600">
            No hay un periodo de inscripción activo. Creá uno y activálo para generar el enlace público.
          </p>
        )}

        {/* Lista de TODOS los periodos (activos e inactivos) para que el
            admin vea también los recién creados con el switch apagado. */}
        {listaPeriodos.length > 0 && (
          <ul className="mt-4 pt-3 border-t border-slate-200 space-y-2">
            {listaPeriodos.map((periodo) => (
              <li
                key={periodo.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 bg-white border border-slate-200 rounded-lg p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{periodo.nombre}</p>
                  <p className="text-xs text-slate-500">
                    {periodo.fecha_inicio ? periodo.fecha_inicio.split('T')[0] : '—'} →{' '}
                    {periodo.fecha_fin ? periodo.fecha_fin.split('T')[0] : '—'}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-md text-xs font-medium self-start sm:self-auto ${
                    periodo.activo_manual
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {periodo.activo_manual ? 'Activo' : 'Inactivo'}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleEstadoPeriodo(periodo.id)}
                    className="px-2 py-1 text-xs border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100"
                  >
                    {periodo.activo_manual ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => abrirEdicionPeriodo(periodo)}
                    className="px-2 py-1 text-xs bg-sky-50 border border-sky-200 rounded-lg text-sky-700 hover:bg-sky-100"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => eliminarPeriodoConfirmado(periodo)}
                    className="px-2 py-1 text-xs bg-red-50 border border-red-200 rounded-lg text-red-600 hover:bg-red-100"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Formulario de edición de fechas */}
        {editandoPeriodo && (
              <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Nombre del periodo
                  </label>
                  <input
                    type="text"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Fecha inicio
                  </label>
                  <input
                    type="date"
                    value={nuevaFechaInicio}
                    onChange={(e) => setNuevaFechaInicio(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Fecha fin
                  </label>
                  <input
                    type="date"
                    value={nuevaFechaFin}
                    onChange={(e) => setNuevaFechaFin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div className="col-span-1 sm:col-span-3 flex gap-2">
                  <button
                    onClick={guardarEdicionPeriodo}
                    className="flex-1 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm rounded-lg"
                  >
                    Guardar cambios
                  </button>
                  <button
                    onClick={cancelarEdicionPeriodo}
                    className="px-3 py-2 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
        )}

        {/* Formulario de creación de nuevo periodo */}
        {creandoPeriodo && (
          <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Nombre del nuevo periodo
              </label>
              <input
                type="text"
                value={nombreNuevoPeriodo}
                onChange={(e) => setNombreNuevoPeriodo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Fecha inicio
              </label>
              <input
                type="date"
                value={fechaInicioNuevoPeriodo}
                onChange={(e) => setFechaInicioNuevoPeriodo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Fecha fin
              </label>
              <input
                type="date"
                value={fechaFinNuevoPeriodo}
                onChange={(e) => setFechaFinNuevoPeriodo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div className="col-span-1 sm:col-span-3 flex gap-2">
              <button
                onClick={guardarCreacionPeriodo}
                disabled={guardandoPeriodo}
                className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg disabled:bg-emerald-400 disabled:cursor-not-allowed"
              >
                {guardandoPeriodo ? 'Guardando…' : 'Crear periodo'}
              </button>
              <button
                onClick={cancelarCreacionPeriodo}
                className="px-3 py-2 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>

    </div>
  );
};
