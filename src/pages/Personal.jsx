import React, { useState, useEffect } from 'react';
import { personalApi } from '../api/personalApi';
import { extraerMensajeError } from '../utils/errorUtils';
import { Modal } from '../components/Modal';
import { Plus, Search, Edit2, Trash2, RefreshCw } from 'lucide-react';

export const Personal = () => {
  const [personal, setPersonal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoria, setCategoria] = useState('');
  const [exportando, setExportando] = useState(null);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Categorías válidas (deben coincidir con Profesores.CATEGORIA_CHOICES del backend)
  const CATEGORIAS = [
    'Integral',
    'Profesor',
    'Obrero',
    'Cocinera',
    'Administrativo',
    'Director (Directivo)',
    'Sub-Director (Directivo)',
    'Coordinador (Directivo)',
  ];

  const formVacio = {
    cedula: '',
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    categoria: 'Profesor',
    email: '',
    telefono: '',
  };

  const [formData, setFormData] = useState(formVacio);

  const loadData = async (categoria = '') => {
    setLoading(true);
    try {
      const data = await personalApi.getAll({ search, categoria });
      setPersonal(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* eslint-disable react/set-state-in-effect, react-hooks/exhaustive-deps -- cargar al cambiar filtros; loadData se redefine cada render a propósito */
  useEffect(() => {
    loadData(categoria);
  }, [search, categoria]);
  /* eslint-enable react/set-state-in-effect, react-hooks/exhaustive-deps */

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        cedula: item.cedula || '',
        primer_nombre: item.primer_nombre || '',
        segundo_nombre: item.segundo_nombre || '',
        primer_apellido: item.primer_apellido || '',
        segundo_apellido: item.segundo_apellido || '',
        categoria: item.categoria || item.especialidad || 'Profesor',
        email: item.usuario_detalle?.email || item.email || '',
        telefono: item.telefono || '',
      });
    } else {
      setEditingItem(null);
      setFormData(formVacio);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        // La PK del backend es id_profesor (no existe 'id')
        await personalApi.update(editingItem.id_profesor ?? editingItem.id, formData);
      } else {
        await personalApi.create(formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert(`No se pudo guardar el registro: ${extraerMensajeError(err)}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este registro de personal?')) {
      try {
        await personalApi.delete(id);
        loadData();
      } catch (err) {
        console.error(err);
        alert('No se pudo eliminar el registro.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado del contenido: título a la izquierda, controles a la derecha en una sola línea */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Personal Administrativo y Obreros</h2>
          <p className="text-xs text-slate-500 mt-1">Gestión de roles y cargos de personal (/api/v1/personal/)</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por cédula, nombre, apellido o cargo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-72 pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Filtro por categoría */}
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Todas las categorías</option>
            {CATEGORIAS.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Recargar */}
          <button
            onClick={loadData}
            className="p-2.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors self-start sm:self-auto"
            title="Recargar datos"
          >
            <RefreshCw size={18} />
          </button>

          {/* Acción principal */}
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-md transition-all"
          >
            <Plus size={18} />
            <span>Nuevo Personal</span>
          </button>
        </div>
      </div>

      {/* Tabla de datos profesional (tema oscuro, scroll horizontal) */}
      <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-xl shadow-sm">
          <table className="w-full text-left text-sm text-slate-300">
            <thead>
              <tr>
                <th className="px-6 py-3.5 bg-slate-800/50 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Cédula</th>
                <th className="px-6 py-3.5 bg-slate-800/50 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Personal</th>
                <th className="px-6 py-3.5 bg-slate-800/50 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-3.5 bg-slate-800/50 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Contacto</th>
                <th className="px-6 py-3.5 bg-slate-800/50 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-slate-500">Cargando datos del personal...</td>
                </tr>
              ) : personal.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-slate-500">No se encontraron registros de personal.</td>
                </tr>
              ) : (
                personal.map((item) => (
                  <tr key={item.id_profesor ?? item.id} className="hover:bg-slate-800/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-slate-100">{item.cedula}</td>
                    <td className="px-6 py-4 font-medium text-slate-100">
                      {[item.primer_nombre, item.segundo_nombre, item.primer_apellido, item.segundo_apellido].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/30">
                        {item.categoria || item.especialidad || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="text-slate-300">{item.usuario_detalle?.email || item.email || '—'}</div>
                      <div className="text-slate-500">{item.telefono || '—'}</div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenModal(item)}
                        className="p-1.5 text-slate-500 hover:text-sky-400 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id_profesor ?? item.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
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

      {/* Exportation Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="text-sm text-slate-500">
          <span className="font-semibold text-slate-700">Exportación por categoría:</span>
          <span className="ml-2 text-xs text-slate-400">
            {categoria ? `API: /personal/personal-con-cargos/?categoria=${encodeURIComponent(categoria)}` : 'API: /personal/personal-con-cargos/'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={async () => {
              setExportando('excel');
              try {
                await personalApi.exportarExcel({ categoria });
              } catch (err) {
                console.error('Error al exportar Excel:', err);
              } finally {
                setExportando(null);
              }
            }}
            disabled={exportando === 'excel'}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-wait"
          >
            {exportando === 'excel' ? 'Generando...' : 'Excel'}
          </button>
          <button
            onClick={async () => {
              setExportando('pdf');
              try {
                await personalApi.exportarPDF({ categoria });
              } catch (err) {
                console.error('Error al exportar PDF:', err);
              } finally {
                setExportando(null);
              }
            }}
            disabled={exportando === 'pdf'}
            className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-wait"
          >
            {exportando === 'pdf' ? 'Generando...' : 'PDF'}
          </button>
          <button
            onClick={async () => {
              setExportando('csv');
              try {
                await personalApi.exportarCSV({ categoria });
              } catch (err) {
                console.error('Error al exportar CSV:', err);
              } finally {
                setExportando(null);
              }
            }}
            disabled={exportando === 'csv'}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-wait"
          >
            {exportando === 'csv' ? 'Generando...' : 'CSV'}
          </button>
        </div>
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Personal' : 'Registrar Nuevo Personal'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Cédula</label>
              <input
                type="text"
                required
                value={formData.cedula}
                onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Categoría</label>
              <select
                required
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
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
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email (usuario)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Teléfono</label>
              <input
                type="text"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
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
