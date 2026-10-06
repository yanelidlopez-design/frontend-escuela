import axiosClient from './axiosClient';
import { initialAsistencias } from '../utils/mockData';

let localAsistenciasStore = [...initialAsistencias];

export const asistenciasApi = {
  getAll: async (params = {}) => {
    try {
      const response = await axiosClient.get('/academico/asistencias/', { params });
      return response.data.results || response.data;
    } catch (error) {
      console.warn('API /academico/asistencias/ fallback to local store');
      let filtered = [...localAsistenciasStore];

      if (params.fecha) {
        filtered = filtered.filter(a => a.fecha === params.fecha);
      }
      if (params.estado && params.estado !== 'Todos') {
        filtered = filtered.filter(a => a.estado === params.estado);
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(a =>
          a.profesor_nombre.toLowerCase().includes(q) ||
          a.materia.toLowerCase().includes(q) ||
          a.seccion.toLowerCase().includes(q)
        );
      }
      return filtered;
    }
  },

  getById: async (id) => {
    try {
      const response = await axiosClient.get(`/academico/asistencias/${id}/`);
      return response.data;
    } catch (error) {
      return localAsistenciasStore.find(a => a.id === Number(id));
    }
  },

  create: async (data) => {
    try {
      const response = await axiosClient.post('/academico/asistencias/', data);
      return response.data;
    } catch (error) {
      const newItem = { id: Date.now(), ...data };
      localAsistenciasStore.unshift(newItem);
      return newItem;
    }
  },

  update: async (id, data) => {
    try {
      const response = await axiosClient.put(`/academico/asistencias/${id}/`, data);
      return response.data;
    } catch (error) {
      const index = localAsistenciasStore.findIndex(a => a.id === Number(id));
      if (index !== -1) {
        localAsistenciasStore[index] = { ...localAsistenciasStore[index], ...data };
        return localAsistenciasStore[index];
      }
      throw error;
    }
  },

  delete: async (id) => {
    try {
      await axiosClient.delete(`/academico/asistencias/${id}/`);
      return true;
    } catch (error) {
      localAsistenciasStore = localAsistenciasStore.filter(a => a.id !== Number(id));
      return true;
    }
  }
};
