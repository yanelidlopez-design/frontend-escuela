import axiosClient from './axiosClient';
import { initialPersonal } from '../utils/mockData';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportUtils';

let localPersonalStore = [...initialPersonal];

// Columnas y datos para exportación en modo offline (fallback del cliente)
const filasPersonal = (lista) =>
  lista.map((p) => ({
    Cedula: p.cedula || '',
    Nombre: [p.primer_nombre, p.segundo_nombre, p.primer_apellido, p.segundo_apellido]
      .filter(Boolean)
      .join(' '),
    Categoria: p.categoria || p.especialidad || '',
    Correo: p.usuario_detalle?.email || p.email || '',
    Telefono: p.telefono || '',
  }));

const descargarBlob = (data, mime, filename) => {
  const url = window.URL.createObjectURL(new Blob([data], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

const filtrarLocal = (params = {}) => {
  let filtered = [...localPersonalStore];
  if (params.categoria) filtered = filtered.filter((p) => p.categoria === params.categoria);
  return filtered;
};

export const personalApi = {
  getAll: async (params = {}) => {
    try {
      const response = await axiosClient.get('/personal/personal/', { params });
      return response.data.results || response.data;
    } catch {
      console.warn('API /personal/personal/ fallback to local store');
      let filtered = [...localPersonalStore];
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(p =>
          `${p.primer_nombre || p.nombre || ''} ${p.primer_apellido || p.apellido || ''}`.toLowerCase().includes(q) ||
          (p.cedula || '').toLowerCase().includes(q) ||
          (p.cargo_departamento || p.cargo || '').toLowerCase().includes(q)
        );
      }
      // Filtro por categoría (ej. 'Profesor') también en modo offline
      if (params.categoria) {
        filtered = filtered.filter(p => p.categoria === params.categoria);
      }
      return filtered;
    }
  },

  getById: async (id) => {
    try {
      const response = await axiosClient.get(`/personal/personal/${id}/`);
      return response.data;
    } catch {
      return localPersonalStore.find(p => p.id === Number(id));
    }
  },

  create: async (data) => {
    try {
      const response = await axiosClient.post('/personal/personal/', data);
      return response.data;
    } catch (error) {
      // Si el backend respondió (400/500), el error es real: mostrarlo en la UI.
      if (error.response) throw error;
      const newItem = { id: Date.now(), ...data };
      localPersonalStore.unshift(newItem);
      return newItem;
    }
  },

  update: async (id, data) => {
    try {
      const response = await axiosClient.put(`/personal/personal/${id}/`, data);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const index = localPersonalStore.findIndex(p => p.id === Number(id));
      if (index !== -1) {
        localPersonalStore[index] = { ...localPersonalStore[index], ...data };
        return localPersonalStore[index];
      }
      throw error;
    }
  },

  delete: async (id) => {
    try {
      await axiosClient.delete(`/personal/personal/${id}/`);
      return true;
    } catch (error) {
      if (error.response) throw error;
      localPersonalStore = localPersonalStore.filter(p => p.id !== Number(id));
      return true;
    }
  },

  exportarExcel: async (params = {}) => {
    try {
      const response = await axiosClient.get('/personal/personal/exportar-excel/', {
        params,
        responseType: 'blob',
      });
      descargarBlob(response.data, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'listado_personal.xlsx');
    } catch {
      exportToExcel(filasPersonal(filtrarLocal(params)), 'listado_personal.xlsx', 'Personal');
    }
  },

  exportarPDF: async (params = {}) => {
    try {
      const response = await axiosClient.get('/personal/personal/exportar-pdf/', {
        params,
        responseType: 'blob',
      });
      descargarBlob(response.data, 'application/pdf', 'listado_personal.pdf');
    } catch {
      exportToPDF(filasPersonal(filtrarLocal(params)), 'Listado de Personal', 'listado_personal.pdf');
    }
  },

  exportarCSV: async (params = {}) => {
    try {
      const response = await axiosClient.get('/personal/personal/exportar-csv/', {
        params,
        responseType: 'blob',
      });
      descargarBlob(response.data, 'text/csv;charset=utf-8;', 'listado_personal.csv');
    } catch {
      exportToCSV(filasPersonal(filtrarLocal(params)), 'listado_personal.csv');
    }
  }
};
