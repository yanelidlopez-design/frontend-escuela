import axiosClient from './axiosClient';
import { initialAlumnos } from '../utils/mockData';

let localAlumnosStore = [...initialAlumnos];

export const alumnosApi = {
  getAll: async (params = {}) => {
    try {
      const response = await axiosClient.get('/academico/alumnos/', { params });
      return response.data.results || response.data;
    } catch (error) {
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
      return filtered;
    }
  },

  getById: async (id) => {
    try {
      const response = await axiosClient.get(`/academico/alumnos/${id}/`);
      return response.data;
    } catch (error) {
      return localAlumnosStore.find(a => a.id_alumno === Number(id));
    }
  },

  getBySeccion: async (grado, seccion, periodo = null) => {
    try {
      let url = `/academico/alumnos/por_seccion/?grado=${encodeURIComponent(grado)}&seccion=${encodeURIComponent(seccion)}`;
      if (periodo) url += `&periodo=${encodeURIComponent(periodo)}`;
      const response = await axiosClient.get(url);
      return response.data;
    } catch (error) {
      return localAlumnosStore.filter(a => a.grado === grado && a.seccion === seccion);
    }
  },

  create: async (data) => {
    try {
      const response = await axiosClient.post('/academico/alumnos/', data);
      return response.data;
    } catch (error) {
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
      localAlumnosStore = localAlumnosStore.filter(a => a.id_alumno !== Number(id));
      return true;
    }
  }
};
