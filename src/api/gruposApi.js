import axiosClient from './axiosClient';
import { initialGrupos, initialInscripciones } from '../utils/mockData';

let localGruposStore = [...initialGrupos];

export const gruposApi = {
  getAll: async (params = {}) => {
    try {
      const response = await axiosClient.get('/academico/grupos/', { params });
      return response.data.results || response.data;
    } catch {
      console.warn('API /academico/grupos/ fallback to local store');
      let filtered = [...localGruposStore];
      if (params.periodo) {
        filtered = filtered.filter(g => g.periodo === params.periodo);
      }
      if (params.grado) {
        filtered = filtered.filter(g => g.grado === params.grado);
      }
      if (params.seccion) {
        filtered = filtered.filter(g => g.seccion === params.seccion);
      }
      return filtered;
    }
  },

  // Alumnos activos de un grupo: GET /academico/grupos/:id/alumnos-activos/
  getAlumnosActivos: async (idGrupo) => {
    try {
      const response = await axiosClient.get(`/academico/grupos/${idGrupo}/alumnos-activos/`);
      return response.data;
    } catch {
      console.warn('API /academico/grupos/:id/alumnos-activos/ fallback to local store');
      const grupo = localGruposStore.find((g) => (g.id_grupo ?? g.id) === Number(idGrupo));
      return initialInscripciones
        .filter(
          (i) =>
            i.estado_inscripcion === 'Activa' &&
            grupo &&
            i.grado === grupo.grado &&
            i.seccion === grupo.seccion
        )
        .map((i) => ({
          id_alumno: i.alumno_id,
          nombre_completo: i.alumno_nombre,
          cedula_escolar: i.alumno_cedula,
        }));
    }
  },

  getById: async (id) => {
    try {
      const response = await axiosClient.get(`/academico/grupos/${id}/`);
      return response.data;
    } catch {
      return localGruposStore.find(g => g.id_grupo === Number(id));
    }
  },

  create: async (data) => {
    try {
      const response = await axiosClient.post('/academico/grupos/', data);
      return response.data;
    } catch {
      const newItem = { id_grupo: Date.now(), ...data };
      localGruposStore.unshift(newItem);
      return newItem;
    }
  },

  update: async (id, data) => {
    try {
      const response = await axiosClient.put(`/academico/grupos/${id}/`, data);
      return response.data;
    } catch (error) {
      const index = localGruposStore.findIndex(g => g.id_grupo === Number(id));
      if (index !== -1) {
        localGruposStore[index] = { ...localGruposStore[index], ...data };
        return localGruposStore[index];
      }
      throw error;
    }
  },

  delete: async (id) => {
    try {
      await axiosClient.delete(`/academico/grupos/${id}/`);
      return true;
    } catch {
      localGruposStore = localGruposStore.filter(g => g.id_grupo !== Number(id));
      return true;
    }
  }
};
