import axiosClient from './axiosClient';
import { initialInscripciones } from '../utils/mockData';

let localInscripcionesStore = [...initialInscripciones];

export const inscripcionesApi = {
  getAll: async (params = {}) => {
    try {
      const response = await axiosClient.get('/academico/inscripciones/', { params });
      return response.data.results || response.data;
    } catch {
      console.warn('API /academico/inscripciones/ fallback to local store');
      let filtered = [...localInscripcionesStore];
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(i =>
          i.alumno_nombre?.toLowerCase().includes(q) ||
          i.alumno_cedula?.toLowerCase().includes(q) ||
          i.estado_inscripcion?.toLowerCase().includes(q)
        );
      }
      if (params.estado_inscripcion) {
        filtered = filtered.filter(i => i.estado_inscripcion === params.estado_inscripcion);
      }
      return filtered;
    }
  },

  getById: async (id) => {
    try {
      const response = await axiosClient.get(`/academico/inscripciones/${id}/`);
      return response.data;
    } catch {
      return localInscripcionesStore.find(i => i.id_inscripcion === Number(id));
    }
  },

  create: async (data) => {
    try {
      const response = await axiosClient.post('/academico/inscripciones/', data);
      return response.data;
    } catch {
      const newItem = { id_inscripcion: Date.now(), ...data };
      localInscripcionesStore.unshift(newItem);
      return newItem;
    }
  },

  update: async (id, data) => {
    try {
      const response = await axiosClient.put(`/academico/inscripciones/${id}/`, data);
      return response.data;
    } catch (error) {
      const index = localInscripcionesStore.findIndex(i => i.id_inscripcion === Number(id));
      if (index !== -1) {
        localInscripcionesStore[index] = { ...localInscripcionesStore[index], ...data };
        return localInscripcionesStore[index];
      }
      throw error;
    }
  },

  delete: async (id) => {
    try {
      await axiosClient.delete(`/academico/inscripciones/${id}/`);
      return true;
    } catch {
      localInscripcionesStore = localInscripcionesStore.filter(i => i.id_inscripcion !== Number(id));
      return true;
    }
  },

  exportarExcel: async (params = {}) => {
    try {
      const response = await axiosClient.get('/academico/inscripciones/exportar-inscripciones-excel/', { params, responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'inscripciones.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Error al exportar inscripciones a Excel:', error);
      throw error;
    }
  },

  exportarPdf: async (params = {}) => {
    try {
      const response = await axiosClient.get('/academico/inscripciones/exportar-inscripciones-pdf/', { params, responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'inscripciones.pdf';
      a.click();
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Error al exportar inscripciones a PDF:', error);
      throw error;
    }
  },

  exportarCSV: async (params = {}) => {
    try {
      const response = await axiosClient.get('/academico/inscripciones/exportar-inscripciones-csv/', { params, responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'inscripciones.csv';
      a.click();
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Error al exportar inscripciones a CSV:', error);
      throw error;
    }
  }
};
