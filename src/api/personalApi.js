import axiosClient from './axiosClient';
import { initialPersonal } from '../utils/mockData';

let localPersonalStore = [...initialPersonal];

export const personalApi = {
  getAll: async (params = {}) => {
    try {
      const response = await axiosClient.get('/personal/personal/', { params });
      return response.data.results || response.data;
    } catch (error) {
      console.warn('API /personal/personal/ fallback to local store');
      let filtered = [...localPersonalStore];
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(p =>
          p.nombre.toLowerCase().includes(q) ||
          p.apellido.toLowerCase().includes(q) ||
          p.cedula.toLowerCase().includes(q) ||
          p.cargo.toLowerCase().includes(q)
        );
      }
      return filtered;
    }
  },

  getById: async (id) => {
    try {
      const response = await axiosClient.get(`/personal/personal/${id}/`);
      return response.data;
    } catch (error) {
      return localPersonalStore.find(p => p.id === Number(id));
    }
  },

  create: async (data) => {
    try {
      const response = await axiosClient.post('/personal/personal/', data);
      return response.data;
    } catch (error) {
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
      localPersonalStore = localPersonalStore.filter(p => p.id !== Number(id));
      return true;
    }
  }
};
