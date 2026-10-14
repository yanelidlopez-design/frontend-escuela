import React, { useState } from 'react';
import { useAlumnos } from '../hooks/useAlumnos';
import { extraerMensajeError } from '../utils/errorUtils';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportUtils';
import { Plus, Search, Edit2, Trash2, RefreshCw, FileText } from 'lucide-react';

// Tallas de uniforme escolar infantiles (4 a 12) para camisa y pantalón.
const TALLAS_UNIFORME = ['4', '5', '6', '7', '8', '9', '10', '11', '12'];

export const Alumnos = () => {
  // Toda la lógica de estado, filtros, catálogos y HTTP vive en el hook (Misión 9)
  const {
    alumnos, loading, error, clearError,
    grado, setGrado,
    seccion, setSeccion,
    search, setSearch,
    estatusFilter, setEstatusFilter,
    grados, secciones, grupos, profesores,
    fetchAlumnos, handleCreate, handleUpdate, handleDelete,
  } = useAlumnos();

  // Estado puramente visual del modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
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
    fecha_inscripcion_inicial: '',
    estatus_general: 'Activo',
    id_profesor_encargado: '',
    id_grupo: '',
    carnet_patria_codigo: '',
    carnet_patria_serial: '',
    numero_cuenta: '',
    tipo_cuenta: '',
    banco: '',
    direccion: { calle: '', ciudad: '', estado: '', referencia: '' },
    representante: { cedula: '', nombre: '', telefono: '' },
    parentesco: ''
  });

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      // Precarga del representante desde la API (alumno.representante / alumno.parentesco)
      const rep = item.representante || null;
      // Precarga de la dirección desde el payload del serializer (direccion o direccion_detalle)
      const dir = item.direccion || item.direccion_detalle || null;
      setFormData({
        ...item,
        id_profesor_encargado: item.id_profesor_encargado ?? '',
        id_grupo: item.grupo_inscripcion_id ?? '',
        carnet_patria_codigo: item.carnet_patria_codigo || '',
        carnet_patria_serial: item.carnet_patria_serial || '',
        numero_cuenta: item.numero_cuenta || '',
        tipo_cuenta: item.tipo_cuenta || '',
        banco: item.banco || '',
        direccion: {
          calle: (dir && dir.calle) || '',
          ciudad: (dir && dir.ciudad) || '',
          estado: (dir && dir.estado) || '',
          referencia: (dir && dir.referencia) || ''
        },
        representante: {
          cedula: (rep && rep.cedula) || '',
          nombre: (rep && rep.nombre) || '',
          telefono: (rep && rep.telefono) || ''
        },
        parentesco: item.parentesco || ''
      });
    } else {
      setEditingItem(null);
      setFormData({
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
        fecha_inscripcion_inicial: new Date().toISOString().split('T')[0],
        estatus_general: 'Activo',
        id_profesor_encargado: '',
        id_grupo: '',
        carnet_patria_codigo: '',
        carnet_patria_serial: '',
        numero_cuenta: '',
        tipo_cuenta: '',
        banco: '',
        direccion: { calle: '', ciudad: '', estado: '', referencia: '' },
        representante: { cedula: '', nombre: '', telefono: '' },
        parentesco: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // El representante y la dirección viajan anidados junto a los campos del alumno en la raíz
      const { representante, parentesco, direccion, ...camposAlumno } = formData;
      const payload = { ...camposAlumno };
      // Select vacío => sin profesor asignado (null); el backend espera el id numérico.
      payload.id_profesor_encargado = payload.id_profesor_encargado
        ? Number(payload.id_profesor_encargado)
        : null;
      // Grupo vacío => null (el backend no toca la inscripción activa si es null).
      payload.id_grupo = payload.id_grupo ? Number(payload.id_grupo) : null;
      // Dirección anidada solo si la calle tiene contenido (evita direcciones vacías).
      if (direccion && direccion.calle && direccion.calle.trim()) {
        payload.direccion = direccion;
      }
      if (representante && representante.cedula && representante.cedula.trim()) {
        payload.representante = representante;
        payload.parentesco = parentesco;
      }
      if (editingItem) {
        await handleUpdate(editingItem.id_alumno, payload);
      } else {
        await handleCreate(payload);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(`No se pudo guardar el alumno: ${extraerMensajeError(err)}`);
    }
  };

  // La confirmación es UI de la vista; la llamada HTTP y la recarga viven en el hook
  const confirmarEliminar = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este registro de alumno?')) {
      try {
        await handleDelete(id);
      } catch (err) {
        console.error(err);
        alert(`No se pudo eliminar el alumno: ${extraerMensajeError(err)}`);
      }
    }
  };

  const getNombreCompleto = (alumno) => {
    return `${alumno.primer_nombre} ${alumno.segundo_nombre || ''} ${alumno.primer_apellido} ${alumno.segundo_apellido || ''}`.trim();
  };

  const getRepresentanteNombre = (item) => {
    return (item && item.representante && item.representante.nombre) || 'Sin asignar';
  };

  // Profesor encargado (Docente Guía) del alumno.
  // 1) Backend real: el serializer ya envía item.profesor_encargado (grupo -> profesor_director).
  // 2) Fallback offline: cruce local por grado+sección contra el catálogo de grupos (campo 'tutor').
  const getProfesorEncargado = (item) => {
    if (item && item.profesor_encargado) return item.profesor_encargado;

    const grado = item?.grado_actual;
    const seccion = item?.seccion_actual;
    if (grado && seccion && grupos.length) {
      const nombreG = (g) => g?.grado_detalle?.nombre_grado || g?.grado || '';
      const nombreS = (g) => g?.seccion_detalle?.nombre_seccion || g?.seccion || '';
      const grupo = grupos.find(
        (g) => nombreG(g) === grado && nombreS(g) === seccion
      );
      if (grupo) {
        const detalle = grupo.profesor_guia_detalle || grupo.profesor_director_detalle;
        if (detalle) {
          return `${detalle.primer_nombre || ''} ${detalle.primer_apellido || ''}`.trim();
        }
        if (grupo.tutor) return grupo.tutor;
      }
    }
    return 'Sin asignar';
  };

  // --- Exportación del listado visible (cliente, respeta los filtros activos) ---
  // Los endpoints backend de exportación de alumnos no existen (404 silencioso):
  // se genera el archivo en el navegador con las mismas columnas de la tabla.
  const filasExport = () =>
    alumnos.map((item) => ({
      Cedula: [item.tipo_documento_identidad, item.numero_documento_identidad].filter(Boolean).join('-'),
      'Cedula Escolar': item.cedula_escolar || '',
      Nombre: getNombreCompleto(item),
      'Fecha Nacimiento': item.fecha_nacimiento || '',
      Genero: item.genero || '',
      Representante: getRepresentanteNombre(item),
      Estatus: item.estatus_general || '',
      'Profesor Encargado': getProfesorEncargado(item),
    }));

  const exportarExcel = () => exportToExcel(filasExport(), 'alumnos.xlsx', 'Alumnos');
  const exportarPdf = () => exportToPDF(filasExport(), 'Listado de Alumnos', 'alumnos.pdf');
  const exportarCSV = () => exportToCSV(filasExport(), 'alumnos.csv');

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Registro de Alumnos</h3>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchAlumnos}
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
            <span>Nuevo Alumno</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center space-x-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula o cédula escolar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <select
          value={estatusFilter}
          onChange={(e) => setEstatusFilter(e.target.value)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">Todos los estatus</option>
          <option value="Activo">Activo</option>
          <option value="Retirado">Retirado</option>
          <option value="Egresado">Egresado</option>
        </select>
      </div>

      {/* Filtros por Grado y Sección */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="form-group">
          <label htmlFor="alumno-filter-grado">Grado</label>
          <select
            id="alumno-filter-grado"
            className="form-select"
            value={grado}
            onChange={(e) => setGrado(e.target.value)}
          >
            <option value="">Todos los Grados</option>
            {grados.map((g) => <option key={g.id_grado} value={g.id_grado}>{g.nombre_grado || 'Grado sin nombre'}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="alumno-filter-seccion">Sección</label>
          <select
            id="alumno-filter-seccion"
            className="form-select"
            value={seccion}
            onChange={(e) => setSeccion(e.target.value)}
          >
            <option value="">Todas</option>
            {secciones.map((s) => <option key={s.id_seccion} value={s.id_seccion}>{s.nombre_seccion || 'Sección sin nombre'}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={exportarExcel}
            disabled={!alumnos.length}
          >
            <FileText size={18} /> Exportar a Excel
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={exportarPdf}
            disabled={!alumnos.length}
          >
            <FileText size={18} /> Exportar a PDF
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={exportarCSV}
            disabled={!alumnos.length}
          >
            <FileText size={18} /> Exportar a CSV
          </button>
        </div>
      </div>
        
      {/* Banner de error global (provisto por useAlumnos) */}
      {error && (
        <div className="flex items-start justify-between gap-2 p-4 rounded-xl text-sm font-medium bg-rose-50 border border-rose-200 text-rose-700">
          <span>⚠ {error}</span>
          <button type="button" onClick={clearError} className="text-rose-400 hover:text-rose-700" title="Descartar">
            ✕
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Cédula / C.E.</th>
                <th className="px-6 py-4">Nombre Completo</th>
                <th className="px-6 py-4">Fecha Nac.</th>
                <th className="px-6 py-4">Género</th>
                <th className="px-6 py-4">Representante</th>
                <th className="px-6 py-4">Estatus</th>
                <th className="px-6 py-4">Profesor Encargado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-400">Cargando datos de alumnos...</td>
                </tr>
              ) : alumnos.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-400">No se encontraron alumnos registrados.</td>
                </tr>
              ) : (
                alumnos.map((item) => (
                  <tr key={item.id_alumno} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono font-medium text-slate-900">{item.tipo_documento_identidad}-{item.numero_documento_identidad}</div>
                      <div className="text-xs text-slate-400">C.E.: {item.cedula_escolar}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{getNombreCompleto(item)}</td>
                    <td className="px-6 py-4">{item.fecha_nacimiento}</td>
                    <td className="px-6 py-4">{item.genero}</td>
                    <td className="px-6 py-4 text-xs">{getRepresentanteNombre(item)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.estatus_general} />
                    </td>
                    <td className="px-6 py-4">{getProfesorEncargado(item)}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenModal(item)}
                        className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => confirmarEliminar(item.id_alumno)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Alumno' : 'Registrar Nuevo Alumno'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tipo Documento</label>
              <select
                value={formData.tipo_documento_identidad}
                onChange={(e) => setFormData({ ...formData, tipo_documento_identidad: e.target.value })}
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
                value={formData.numero_documento_identidad}
                onChange={(e) => setFormData({ ...formData, numero_documento_identidad: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Cédula Escolar</label>
            <input
              type="text"
              required
              value={formData.cedula_escolar}
              onChange={(e) => setFormData({ ...formData, cedula_escolar: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Primer Nombre</label>
              <input
                type="text"
                required
                value={formData.primer_nombre}
                onChange={(e) => setFormData({ ...formData, primer_nombre: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Segundo Nombre</label>
              <input
                type="text"
                value={formData.segundo_nombre}
                onChange={(e) => setFormData({ ...formData, segundo_nombre: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Primer Apellido</label>
              <input
                type="text"
                required
                value={formData.primer_apellido}
                onChange={(e) => setFormData({ ...formData, primer_apellido: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Segundo Apellido</label>
              <input
                type="text"
                value={formData.segundo_apellido}
                onChange={(e) => setFormData({ ...formData, segundo_apellido: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Fecha Nacimiento</label>
              <input
                type="date"
                required
                value={formData.fecha_nacimiento}
                onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Género</label>
              <select
                value={formData.genero}
                onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Lugar Nacimiento</label>
              <input
                type="text"
                value={formData.lugar_nacimiento}
                onChange={(e) => setFormData({ ...formData, lugar_nacimiento: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Nacionalidad</label>
              <input
                type="text"
                value={formData.nacionalidad}
                onChange={(e) => setFormData({ ...formData, nacionalidad: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Grupo Sanguíneo</label>
              <select
                value={formData.grupo_sanguineo}
                onChange={(e) => setFormData({ ...formData, grupo_sanguineo: e.target.value })}
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
                value={formData.peso_kg}
                onChange={(e) => setFormData({ ...formData, peso_kg: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Talla (cm)</label>
              <input
                type="number"
                step="0.5"
                value={formData.talla_cm}
                onChange={(e) => setFormData({ ...formData, talla_cm: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">📏 Medidas de Uniforme</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Talla Camisa</label>
                <select
                  value={formData.talla_camisa}
                  onChange={(e) => setFormData({ ...formData, talla_camisa: e.target.value })}
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
                  value={formData.talla_pantalon}
                  onChange={(e) => setFormData({ ...formData, talla_pantalon: e.target.value })}
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
                  value={formData.talla_zapato}
                  onChange={(e) => setFormData({ ...formData, talla_zapato: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  placeholder="Ej: 35"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">🏥 Datos Médicos</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Alergias</label>
                <textarea
                  value={formData.alergico_a}
                  onChange={(e) => setFormData({ ...formData, alergico_a: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  rows="2"
                  placeholder="Describa cualquier alergia conocida..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tratamiento Médico</label>
                <textarea
                  value={formData.tratamiento_medico}
                  onChange={(e) => setFormData({ ...formData, tratamiento_medico: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  rows="2"
                  placeholder="Describa tratamientos médicos actuales..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Condición Física</label>
                  <textarea
                    value={formData.condicion_fisica}
                    onChange={(e) => setFormData({ ...formData, condicion_fisica: e.target.value })}
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
                        checked={formData.discapacidad === true}
                        onChange={() => setFormData({ ...formData, discapacidad: true })}
                        className="mr-2"
                      />
                      Sí
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="discapacidad"
                        checked={formData.discapacidad === false}
                        onChange={() => setFormData({ ...formData, discapacidad: false })}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>
              </div>
              {formData.discapacidad && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tipo de Discapacidad</label>
                  <textarea
                    value={formData.tipo_discapacidad}
                    onChange={(e) => setFormData({ ...formData, tipo_discapacidad: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    rows="2"
                    placeholder="Describa el tipo de discapacidad..."
                  />
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">🏠 Dirección de Residencia</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Calle / Dirección</label>
                <input
                  type="text"
                  value={formData.direccion.calle}
                  onChange={(e) => setFormData({ ...formData, direccion: { ...formData.direccion, calle: e.target.value } })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  placeholder="ej. Urb. Los Rosales, Casa #12"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Ciudad / Municipio</label>
                  <input
                    type="text"
                    value={formData.direccion.ciudad}
                    onChange={(e) => setFormData({ ...formData, direccion: { ...formData.direccion, ciudad: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    placeholder="ej. Caracas"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Estado</label>
                  <input
                    type="text"
                    value={formData.direccion.estado}
                    onChange={(e) => setFormData({ ...formData, direccion: { ...formData.direccion, estado: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    placeholder="ej. Miranda"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Referencia</label>
                <input
                  type="text"
                  value={formData.direccion.referencia}
                  onChange={(e) => setFormData({ ...formData, direccion: { ...formData.direccion, referencia: e.target.value } })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  placeholder="ej. Portón negro, frente a la plaza"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">🪪 Carnet de la Patria</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Código</label>
                <input
                  type="text"
                  value={formData.carnet_patria_codigo}
                  onChange={(e) => setFormData({ ...formData, carnet_patria_codigo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  placeholder="ej. 1234567890123456"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Serial</label>
                <input
                  type="text"
                  value={formData.carnet_patria_serial}
                  onChange={(e) => setFormData({ ...formData, carnet_patria_serial: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  placeholder="ej. ABC123456"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">💳 Registros Financieros</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">N° de Cuenta</label>
                <input
                  type="text"
                  value={formData.numero_cuenta}
                  onChange={(e) => setFormData({ ...formData, numero_cuenta: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  placeholder="ej. 01340123456789012345"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tipo de Cuenta</label>
                <select
                  value={formData.tipo_cuenta}
                  onChange={(e) => setFormData({ ...formData, tipo_cuenta: e.target.value })}
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
                  value={formData.banco}
                  onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  placeholder="ej. Banco de Venezuela"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">🎓 Asignación Académica</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Grupo Académico</label>
                <select
                  value={formData.id_grupo ?? ''}
                  onChange={(e) => {
                    const gid = e.target.value;
                    // Autocompletar el profesor del grupo (docente guía) si el grupo tiene director.
                    const grupoSel = grupos.find((g) => String(g.id_grupo ?? g.id) === gid);
                    const profId =
                      grupoSel?.profesor_director ??
                      grupoSel?.profesor_guia_detalle?.id_profesor ??
                      '';
                    setFormData({
                      ...formData,
                      id_grupo: gid,
                      id_profesor_encargado: profId || formData.id_profesor_encargado || '',
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="">Sin asignar</option>
                  {grupos.map((g) => {
                    const gid = g.id_grupo ?? g.id;
                    const grado = g?.grado_detalle?.nombre_grado || g?.grado || '';
                    const seccion = g?.seccion_detalle?.nombre_seccion || g?.seccion || '';
                    const turno = g?.turno_detalle?.nombre_turno || g?.turno || '';
                    return (
                      <option key={gid} value={gid}>
                        {grado} - Secc. {seccion}{turno ? ` (${turno})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Profesor Encargado (Docente Guía)</label>
                <select
                  value={formData.id_profesor_encargado ?? ''}
                  onChange={(e) => setFormData({ ...formData, id_profesor_encargado: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="">Sin asignar</option>
                  {profesores.map((p) => {
                    const pid = p.id_profesor ?? p.id;
                    return (
                      <option key={pid} value={pid}>
                        {[p.primer_nombre, p.primer_apellido].filter(Boolean).join(' ')}
                        {p.categoria ? ` — ${p.categoria}` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Fecha Inscripción</label>
              <input
                type="date"
                value={formData.fecha_inscripcion_inicial}
                onChange={(e) => setFormData({ ...formData, fecha_inscripcion_inicial: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Estatus General</label>
              <select
                value={formData.estatus_general}
                onChange={(e) => setFormData({ ...formData, estatus_general: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="Activo">Activo</option>
                <option value="Retirado">Retirado</option>
                <option value="Egresado">Egresado</option>
              </select>
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
                  value={formData.representante.cedula}
                  onChange={(e) => setFormData({ ...formData, representante: { ...formData.representante, cedula: e.target.value } })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="ej. V-12345678"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Teléfono</label>
                <input
                  type="tel"
                  required
                  value={formData.representante.telefono}
                  onChange={(e) => setFormData({ ...formData, representante: { ...formData.representante, telefono: e.target.value } })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="ej. 04121234567"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={formData.representante.nombre}
                  onChange={(e) => setFormData({ ...formData, representante: { ...formData.representante, nombre: e.target.value } })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="ej. Pedro Pérez"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Parentesco</label>
                <select
                  required
                  value={formData.parentesco}
                  onChange={(e) => setFormData({ ...formData, parentesco: e.target.value })}
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
    </div>
  );
};
