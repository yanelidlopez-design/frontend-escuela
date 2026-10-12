import axiosClient from './axiosClient';
import { createCrudApi, downloadBlob } from './crudFactory';
import { initialPersonal } from '../utils/mockData';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportUtils';

// Columnas y datos para exportación en modo offline (fallback del cliente)
const filasPersonal = (lista) =>
  lista.map((p) => ({
    Cedula: p.cedula || '',
    Nombre: [p.primer_nombre, p.segundo_nombre, p.primer_apellido, p.segundo_apellido]
      .filter(Boolean)
      .join(' '),
    Categoria: p.categoria || p.especialidad || '',
    Correo: p.usuario_detalle?.email || p.email || '',
    Telefono: p.telefono || '',
  }));

const filtrarLocal = (params = {}) => {
  let filtered = [...initialPersonal];
  if (params.categoria) filtered = filtered.filter((p) => p.categoria === params.categoria);
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(p =>
      `${p.primer_nombre || p.nombre || ''} ${p.primer_apellido || p.apellido || ''}`.toLowerCase().includes(q) ||
      (p.cedula || '').toLowerCase().includes(q) ||
      (p.cargo_departamento || p.cargo || '').toLowerCase().includes(q)
    );
  }
  return filtered;
};

// Filtro personalizado para personal
const customPersonalFilter = (items, params) => {
  let filtered = [...items];
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(p =>
      `${p.primer_nombre || p.nombre || ''} ${p.primer_apellido || p.apellido || ''}`.toLowerCase().includes(q) ||
      (p.cedula || '').toLowerCase().includes(q) ||
      (p.cargo_departamento || p.cargo || '').toLowerCase().includes(q)
    );
  }
  if (params.categoria) {
    filtered = filtered.filter(p => p.categoria === params.categoria);
  }
  return filtered;
};

// Crear API CRUD estándar usando la factoría
const crudApi = createCrudApi('/personal/personal/', initialPersonal, customPersonalFilter);

// Métodos específicos de personal con exportación
const customMethods = {
  exportarExcel: async (params = {}) => {
    try {
      const response = await axiosClient.get('/personal/personal/exportar-excel/', {
        params,
        responseType: 'blob',
      });
      downloadBlob(response.data, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'listado_personal.xlsx');
    } catch {
      exportToExcel(filasPersonal(filtrarLocal(params)), 'listado_personal.xlsx', 'Personal');
    }
  },

  exportarPDF: async (params = {}) => {
    try {
      const response = await axiosClient.get('/personal/personal/exportar-pdf/', {
        params,
        responseType: 'blob',
      });
      downloadBlob(response.data, 'application/pdf', 'listado_personal.pdf');
    } catch {
      exportToPDF(filasPersonal(filtrarLocal(params)), 'Listado de Personal', 'listado_personal.pdf');
    }
  },

  exportarCSV: async (params = {}) => {
    try {
      const response = await axiosClient.get('/personal/personal/exportar-csv/', {
        params,
        responseType: 'blob',
      });
      downloadBlob(response.data, 'text/csv;charset=utf-8', 'listado_personal.csv');
    } catch {
      exportToCSV(filasPersonal(filtrarLocal(params)), 'listado_personal.csv');
    }
  }
};

// Exportar la API combinando CRUD estándar + métodos específicos
export const personalApi = {
  ...crudApi,
  ...customMethods
};
