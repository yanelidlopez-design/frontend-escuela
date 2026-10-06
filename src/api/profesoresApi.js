import axiosClient from './axiosClient';
import { initialProfesores } from '../utils/mockData';

let localProfesoresStore = [...initialProfesores];

export const profesoresApi = {
  getAll: async (params = {}) => {
    try {
      const response = await axiosClient.get('/personal/personal-con-cargos/', { params });
      return response.data.results || response.data;
    } catch (error) {
      console.warn('API /personal/personal-con-cargos/ fallback to local store');
      let filtered = [...localProfesoresStore];
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(p =>
          p.nombre.toLowerCase().includes(q) ||
          p.apellido.toLowerCase().includes(q) ||
          p.cedula.toLowerCase().includes(q) ||
          p.especialidad.toLowerCase().includes(q)
        );
      }
      return filtered;
    }
  },

  getById: async (id) => {
    try {
      const response = await axiosClient.get(`/personal/personal-con-cargos/${id}/`);
      return response.data;
    } catch (error) {
      return localProfesoresStore.find(p => p.id === Number(id));
    }
  },

  create: async (data) => {
    try {
      const response = await axiosClient.post('/personal/personal-con-cargos/', data);
      return response.data;
    } catch (error) {
      const newItem = { id: Date.now(), ...data };
      localProfesoresStore.unshift(newItem);
      return newItem;
    }
  },

  update: async (id, data) => {
    try {
      const response = await axiosClient.put(`/personal/personal-con-cargos/${id}/`, data);
      return response.data;
    } catch (error) {
      const index = localProfesoresStore.findIndex(p => p.id === Number(id));
      if (index !== -1) {
        localProfesoresStore[index] = { ...localProfesoresStore[index], ...data };
        return localProfesoresStore[index];
      }
      throw error;
    }
  },

  delete: async (id) => {
    try {
      await axiosClient.delete(`/personal/personal-con-cargos/${id}/`);
      return true;
    } catch (error) {
      localProfesoresStore = localProfesoresStore.filter(p => p.id !== Number(id));
      return true;
    }
  }
};
