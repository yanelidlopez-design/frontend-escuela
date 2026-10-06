import React, { useState, useEffect } from 'react';
import { inscripcionesApi } from '../api/inscripcionesApi';
import { alumnosApi } from '../api/alumnosApi';
import { gruposApi } from '../api/gruposApi';
import { representantesApi } from '../api/representantesApi';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { Plus, Search, Edit2, Trash2, BookOpen, RefreshCw, Calendar } from 'lucide-react';

export const Inscripciones = () => {
  const [inscripciones, setInscripciones] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [representantes, setRepresentantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    alumno: '',
    grupo: '',
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
      id_representante: ''
    }
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [inscripcionesData, alumnosData, gruposData, representantesData] = await Promise.all([
        inscripcionesApi.getAll({ search, estado_inscripcion: estadoFilter }),
        alumnosApi.getAll(),
        gruposApi.getAll(),
        representantesApi.getAll()
      ]);
      setInscripciones(inscripcionesData);
      setAlumnos(alumnosData);
      setGrupos(gruposData);
      setRepresentantes(representantesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, estadoFilter]);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        alumno: item.alumno_id || item.alumno,
        grupo: item.grupo_id || item.grupo,
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
          id_representante: ''
        }
      });
    } else {
      setEditingItem(null);
      setFormData({
        alumno: '',
        grupo: '',
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
          id_representante: ''
        }
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.crearNuevoAlumno) {
        // Primero crear el nuevo alumno
        const nuevoAlumno = await alumnosApi.create({
          ...formData.nuevoAlumno,
          fecha_inscripcion_inicial: formData.fecha_inscripcion,
          estatus_general: 'Activo'
        });
        
        // Luego crear la inscripción con el nuevo alumno
        const payload = {
          alumno: nuevoAlumno.id_alumno,
          grupo: formData.grupo,
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
      return `${grupo.grado?.nombre_grado || grupo.grado} '${grupo.seccion?.nombre_seccion || grupo.seccion}'`;
    }
    return 'Grupo no encontrado';
  };

  const getGrupoDetalle = (grupoId) => {
    const grupo = grupos.find(g => g.id_grupo === grupoId || g.id === grupoId);
    if (grupo) {
      return {
        grado: grupo.grado?.nombre_grado || grupo.grado,
        seccion: grupo.seccion?.nombre_seccion || grupo.seccion,
        periodo: grupo.periodo?.nombre_periodo || grupo.periodo
      };
    }
    return { grado: '-', seccion: '-', periodo: '-' };
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

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Gestión de Inscripciones</h3>
          <p className="text-xs text-slate-500 mt-1">Matrícula y proceso de inscripción académica (/api/academico/inscripciones/)</p>
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
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Alumno</th>
                <th className="px-6 py-4">Grupo Académico</th>
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
                        <div className="text-xs text-slate-400">{grupoDetalle.periodo}</div>
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
                      <option value="XS">XS</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
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
                      <option value="26">26</option>
                      <option value="28">28</option>
                      <option value="30">30</option>
                      <option value="32">32</option>
                      <option value="34">34</option>
                      <option value="36">36</option>
                      <option value="38">38</option>
                      <option value="40">40</option>
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
                </div>
              </div>

              <div className="border-b border-slate-200 pb-4">
                <h4 className="text-sm font-semibold text-slate-800 mb-3">👨‍👩‍👧 Representante Legal</h4>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Representante</label>
                  <select
                    value={formData.nuevoAlumno.id_representante}
                    onChange={(e) => setFormData({ ...formData, nuevoAlumno: { ...formData.nuevoAlumno, id_representante: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="">Seleccionar representante...</option>
                    {representantes.map((rep) => (
                      <option key={rep.id_representante} value={rep.id_representante}>
                        {rep.primer_nombre} {rep.primer_apellido} - {rep.cedula}
                      </option>
                    ))}
                  </select>
                </div>
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Grupo Académico</label>
            <select
              required
              value={formData.grupo}
              onChange={(e) => setFormData({ ...formData, grupo: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">Seleccionar grupo...</option>
              {grupos.map((grupo) => {
                const grado = grupo.grado?.nombre_grado || grupo.grado;
                const seccion = grupo.seccion?.nombre_seccion || grupo.seccion;
                const periodo = grupo.periodo?.nombre_periodo || grupo.periodo;
                return (
                  <option key={grupo.id_grupo} value={grupo.id_grupo}>
                    {grado} '{seccion}' - {periodo}
                  </option>
                );
              })}
            </select>
          </div>

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

          <div className="grid grid-cols-2 gap-4">
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
