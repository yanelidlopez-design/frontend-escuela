import axiosClient from './axiosClient';
import { createCrudApi, downloadBlob } from './crudFactory';
import { initialAlumnos } from '../utils/mockData';

// Filtro personalizado para alumnos (busca en nombre, apellido, cedula, documento)
const customAlumnosFilter = (items, params) => {
  let filtered = [...items];
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
};

// Crear API CRUD estándar usando la factoría
const crudApi = createCrudApi('/academico/alumnos/', initialAlumnos, customAlumnosFilter);

// Métodos específicos de alumnos que no están en la factoría
const customMethods = {
  getBySeccion: async (grado, seccion, periodo = null) => {
    try {
      let url = `/academico/alumnos/por_seccion/?grado=${encodeURIComponent(grado)}&seccion=${encodeURIComponent(seccion)}`;
      if (periodo) url += `&periodo=${encodeURIComponent(periodo)}`;
      const response = await axiosClient.get(url);
      return response.data;
    } catch {
      return initialAlumnos.filter(a => a.grado === grado && a.seccion === seccion);
    }
  },

  exportarExcel: async (params = {}) => {
    try {
      const response = await axiosClient.get('/academico/alumnos/exportar-alumnos-excel/', { params, responseType: 'blob' });
      downloadBlob(response.data, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'alumnos.xlsx');
      return true;
    } catch (error) {
      console.error('Error al exportar alumnos a Excel:', error);
      throw error;
    }
  },

  exportarPdf: async (params = {}) => {
    try {
      const response = await axiosClient.get('/academico/alumnos/exportar-alumnos-pdf/', { params, responseType: 'blob' });
      downloadBlob(response.data, 'application/pdf', 'alumnos.pdf');
      return true;
    } catch (error) {
      console.error('Error al exportar alumnos a PDF:', error);
      throw error;
    }
  },

  exportarCSV: async (params = {}) => {
    try {
      const response = await axiosClient.get('/academico/alumnos/exportar-alumnos-csv/', { params, responseType: 'blob' });
      downloadBlob(response.data, 'text/csv;charset=utf-8', 'alumnos.csv');
      return true;
    } catch (error) {
      console.error('Error al exportar alumnos a CSV:', error);
      throw error;
    }
  }
};

// Exportar la API combinando CRUD estándar + métodos específicos
export const alumnosApi = {
  ...crudApi,
  ...customMethods
};
