import axiosClient from './axiosClient';
import { initialRepresentantes } from '../utils/mockData';

let localRepresentantesStore = [...initialRepresentantes];

export const representantesApi = {
  getAll: async (params = {}) => {
    try {
      const response = await axiosClient.get('/personal/representantes/', { params });
      return response.data.results || response.data;
    } catch (error) {
      console.warn('API /personal/representantes/ fallback to local store');
      let filtered = [...localRepresentantesStore];
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(p =>
          p.nombre.toLowerCase().includes(q) ||
          p.apellido.toLowerCase().includes(q) ||
          p.cedula.toLowerCase().includes(q) ||
          p.representados.toLowerCase().includes(q)
        );
      }
      return filtered;
    }
  },

  getById: async (id) => {
    try {
      const response = await axiosClient.get(`/personal/representantes/${id}/`);
      return response.data;
    } catch (error) {
      return localRepresentantesStore.find(p => p.id === Number(id));
    }
  },

  create: async (data) => {
    try {
      const response = await axiosClient.post('/personal/representantes/', data);
      return response.data;
    } catch (error) {
      const newItem = { id: Date.now(), ...data };
      localRepresentantesStore.unshift(newItem);
      return newItem;
    }
  },

  update: async (id, data) => {
    try {
      const response = await axiosClient.put(`/personal/representantes/${id}/`, data);
      return response.data;
    } catch (error) {
      const index = localRepresentantesStore.findIndex(p => p.id === Number(id));
      if (index !== -1) {
        localRepresentantesStore[index] = { ...localRepresentantesStore[index], ...data };
        return localRepresentantesStore[index];
      }
      throw error;
    }
  },

  delete: async (id) => {
    try {
      await axiosClient.delete(`/personal/representantes/${id}/`);
      return true;
    } catch (error) {
      localRepresentantesStore = localRepresentantesStore.filter(p => p.id !== Number(id));
      return true;
    }
  }
};
