import axiosClient from './axiosClient';
import { createCrudApi, downloadBlob } from './crudFactory';
import { initialInscripciones } from '../utils/mockData';

// Filtro personalizado para inscripciones
const customInscripcionesFilter = (items, params) => {
  let filtered = [...items];
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
};

// Crear API CRUD estándar usando la factoría
const crudApi = createCrudApi('/academico/inscripciones/', initialInscripciones, customInscripcionesFilter);

// Métodos específicos de inscripciones con exportación
const customMethods = {
  exportarExcel: async (params = {}) => {
    try {
      const response = await axiosClient.get('/academico/inscripciones/exportar-inscripciones-excel/', { params, responseType: 'blob' });
      downloadBlob(response.data, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'inscripciones.xlsx');
      return true;
    } catch (error) {
      console.error('Error al exportar inscripciones a Excel:', error);
      throw error;
    }
  },

  exportarPdf: async (params = {}) => {
    try {
      const response = await axiosClient.get('/academico/inscripciones/exportar-inscripciones-pdf/', { params, responseType: 'blob' });
      downloadBlob(response.data, 'application/pdf', 'inscripciones.pdf');
      return true;
    } catch (error) {
      console.error('Error al exportar inscripciones a PDF:', error);
      throw error;
    }
  },

  exportarCSV: async (params = {}) => {
    try {
      const response = await axiosClient.get('/academico/inscripciones/exportar-inscripciones-csv/', { params, responseType: 'blob' });
      downloadBlob(response.data, 'text/csv;charset=utf-8', 'inscripciones.csv');
      return true;
    } catch (error) {
      console.error('Error al exportar inscripciones a CSV:', error);
      throw error;
    }
  }
};

// Exportar la API combinando CRUD estándar + métodos específicos
export const inscripcionesApi = {
  ...crudApi,
  ...customMethods
};
