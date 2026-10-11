import axiosClient from './axiosClient';
import { initialAlumnos } from '../utils/mockData';

let localAlumnosStore = [...initialAlumnos];

export const alumnosApi = {
  getAll: async (params = {}) => {
    try {
      const response = await axiosClient.get('/academico/alumnos/', { params });
      return response.data.results || response.data;
    } catch {
      console.warn('API /academico/alumnos/ fallback to local store');
      let filtered = [...localAlumnosStore];
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(a =>
          a.primer_nombre.toLowerCase().includes(q) ||
          a.primer_apellido.toLowerCase().includes(q) ||
          a.cedula_escolar.toLowerCase().includes(q) ||
          a.numero_documento_identidad.toLowerCase().includes(q)
        );
      }
      if (params.estatus_general) {
        filtered = filtered.filter(a => a.estatus_general === params.estatus_general);
      }
      // Filtro offline: en modo mock el id_grado/id_seccion equivalen al nombre.
      if (params.grado) {
        filtered = filtered.filter(a => a.grado === params.grado);
      }
      if (params.seccion) {
        filtered = filtered.filter(a => a.seccion === params.seccion);
      }
      return filtered;
    }
  },

  getById: async (id) => {
    try {
      const response = await axiosClient.get(`/academico/alumnos/${id}/`);
      return response.data;
    } catch {
      return localAlumnosStore.find(a => a.id_alumno === Number(id));
    }
  },

  getBySeccion: async (grado, seccion, periodo = null) => {
    try {
      let url = `/academico/alumnos/por_seccion/?grado=${encodeURIComponent(grado)}&seccion=${encodeURIComponent(seccion)}`;
      if (periodo) url += `&periodo=${encodeURIComponent(periodo)}`;
      const response = await axiosClient.get(url);
      return response.data;
    } catch {
      return localAlumnosStore.filter(a => a.grado === grado && a.seccion === seccion);
    }
  },

  create: async (data) => {
    try {
      const response = await axiosClient.post('/academico/alumnos/', data);
      return response.data;
    } catch (error) {
      // Si el backend respondió (400/500), el error es real: mostrarlo en la UI.
      if (error.response) throw error;
      // Fallback local solo cuando no hay conexión con el servidor.
      const newItem = { id_alumno: Date.now(), ...data };
      localAlumnosStore.unshift(newItem);
      return newItem;
    }
  },

  update: async (id, data) => {
    try {
      const response = await axiosClient.put(`/academico/alumnos/${id}/`, data);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const index = localAlumnosStore.findIndex(a => a.id_alumno === Number(id));
      if (index !== -1) {
        localAlumnosStore[index] = { ...localAlumnosStore[index], ...data };
        return localAlumnosStore[index];
      }
      throw error;
    }
  },

  delete: async (id) => {
    try {
      await axiosClient.delete(`/academico/alumnos/${id}/`);
      return true;
    } catch (error) {
      if (error.response) throw error;
      localAlumnosStore = localAlumnosStore.filter(a => a.id_alumno !== Number(id));
      return true;
    }
  },

  exportarExcel: async (params = {}) => {
    try {
      const response = await axiosClient.get('/academico/alumnos/exportar-alumnos-excel/', { params, responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'alumnos.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Error al exportar alumnos a Excel:', error);
      throw error;
    }
  },

  exportarPdf: async (params = {}) => {
    try {
      const response = await axiosClient.get('/academico/alumnos/exportar-alumnos-pdf/', { params, responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'alumnos.pdf';
      a.click();
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Error al exportar alumnos a PDF:', error);
      throw error;
    }
  },

  exportarCSV: async (params = {}) => {
    try {
      const response = await axiosClient.get('/academico/alumnos/exportar-alumnos-csv/', { params, responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'alumnos.csv';
      a.click();
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Error al exportar alumnos a CSV:', error);
      throw error;
    }
  }
};
