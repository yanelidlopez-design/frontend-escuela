import axiosClient from './axiosClient';

/**
 * CRUD Factory - Genera una API CRUD estándar con fallback a local store
 * @param {string} basePath - Ruta base del endpoint (ej: '/academico/alumnos/')
 * @param {Array} initialStore - Datos iniciales para fallback offline (opcional)
 * @param {Function} customFilter - Función personalizada de filtrado offline (opcional)
 * @returns {Object} Objeto con métodos CRUD estándar
 */
export const createCrudApi = (basePath, initialStore = [], customFilter = null) => {
  let localStore = [...initialStore];

  return {
    /**
     * Obtiene todos los registros con soporte de filtros
     * @param {Object} params - Parámetros de consulta
     * @returns {Promise<Array>} Lista de registros
     */
    getAll: async (params = {}) => {
      try {
        const response = await axiosClient.get(basePath, { params });
        return response.data.results || response.data;
      } catch {
        console.warn(`API ${basePath} fallback to local store`);
        let filtered = [...localStore];

        // Búsqueda genérica si existe parámetro search
        if (params.search) {
          const q = params.search.toLowerCase();
          filtered = filtered.filter(item => {
            // Busca en todos los campos de texto del objeto
            return Object.values(item).some(value =>
              String(value).toLowerCase().includes(q)
            );
          });
        }

        // Aplicar filtro personalizado si se proporciona
        if (customFilter) {
          filtered = customFilter(filtered, params);
        }

        return filtered;
      }
    },

    /**
     * Obtiene un registro por ID
     * @param {number|string} id - ID del registro
     * @returns {Promise<Object>} Registro encontrado
     */
    getById: async (id) => {
      try {
        const response = await axiosClient.get(`${basePath}${id}/`);
        return response.data;
      } catch {
        console.warn(`API ${basePath}${id}/ fallback to local store`);
        return localStore.find(item => item.id === Number(id) || item.id_alumno === Number(id));
      }
    },

    /**
     * Crea un nuevo registro
     * @param {Object} data - Datos del nuevo registro
     * @returns {Promise<Object>} Registro creado
     */
    create: async (data) => {
      try {
        const response = await axiosClient.post(basePath, data);
        return response.data;
      } catch (error) {
        // Si el backend respondió (400/500), el error es real: mostrarlo en la UI
        if (error.response) throw error;
        // Fallback local solo cuando no hay conexión con el servidor
        const newItem = { id: Date.now(), ...data };
        localStore.unshift(newItem);
        return newItem;
      }
    },

    /**
     * Actualiza un registro existente
     * @param {number|string} id - ID del registro
     * @param {Object} data - Datos actualizados
     * @returns {Promise<Object>} Registro actualizado
     */
    update: async (id, data) => {
      try {
        const response = await axiosClient.put(`${basePath}${id}/`, data);
        return response.data;
      } catch (error) {
        if (error.response) throw error;
        const index = localStore.findIndex(
          item => item.id === Number(id) || item.id_alumno === Number(id)
        );
        if (index !== -1) {
          localStore[index] = { ...localStore[index], ...data };
          return localStore[index];
        }
        throw error;
      }
    },

    /**
     * Elimina un registro
     * @param {number|string} id - ID del registro
     * @returns {Promise<boolean>} True si se eliminó correctamente
     */
    delete: async (id) => {
      try {
        await axiosClient.delete(`${basePath}${id}/`);
        return true;
      } catch (error) {
        if (error.response) throw error;
        localStore = localStore.filter(
          item => item.id !== Number(id) && item.id_alumno !== Number(id)
        );
        return true;
      }
    }
  };
};

/**
 * Helper para descargar archivos blob (Excel, PDF, CSV)
 * @param {Blob} data - Datos del archivo
 * @param {string} mimeType - Tipo MIME del archivo
 * @param {string} filename - Nombre del archivo
 */
export const downloadBlob = (data, mimeType, filename) => {
  const url = window.URL.createObjectURL(new Blob([data], { type: mimeType }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};
