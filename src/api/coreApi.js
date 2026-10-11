import axiosClient from './axiosClient';
import { initialGrupos } from '../utils/mockData';

// Lista canónica de grados del plantel para el fallback offline.
// Incluye explícitamente los niveles de Preescolar / Educación Inicial.
const GRADOS_BASE = [
  { id_grado: 'Inicial 1', nombre_grado: 'Inicial 1', id_nivel: 'Preescolar', orden: 1 },
  { id_grado: 'Inicial 2', nombre_grado: 'Inicial 2', id_nivel: 'Preescolar', orden: 2 },
  { id_grado: 'Inicial 3', nombre_grado: 'Inicial 3', id_nivel: 'Preescolar', orden: 3 },
  { id_grado: '1er Grado', nombre_grado: '1er Grado', id_nivel: 'Primaria', orden: 4 },
  { id_grado: '2do Grado', nombre_grado: '2do Grado', id_nivel: 'Primaria', orden: 5 },
  { id_grado: '3er Grado', nombre_grado: '3er Grado', id_nivel: 'Primaria', orden: 6 },
  { id_grado: '4to Grado', nombre_grado: '4to Grado', id_nivel: 'Primaria', orden: 7 },
  { id_grado: '5to Grado', nombre_grado: '5to Grado', id_nivel: 'Primaria', orden: 8 },
  { id_grado: '6to Grado', nombre_grado: '6to Grado', id_nivel: 'Primaria', orden: 9 },
];

// Deriva las secciones únicas desde los grupos mock (modo offline).
// En offline el "id" es el propio nombre para que el filtrado por texto funcione.
function seccionesDesdeMock() {
  const vistos = new Map();
  for (const g of initialGrupos) {
    if (g.seccion && !vistos.has(g.seccion)) {
      vistos.set(g.seccion, { id_seccion: g.seccion, nombre_seccion: g.seccion });
    }
  }
  return [...vistos.values()];
}

// Catálogo de grados offline: siempre incluye Inicial 1/2/3 + grados definidos en los grupos.
function gradosDesdeMock() {
  const vistos = new Map();
  for (const g of GRADOS_BASE) {
    vistos.set(g.id_grado, g);
  }
  for (const g of initialGrupos) {
    if (g.grado && !vistos.has(g.grado)) {
      vistos.set(g.grado, { id_grado: g.grado, nombre_grado: g.grado, id_nivel: g.nivel, orden: 99 });
    }
  }
  return [...vistos.values()];
}

export const coreApi = {
  // GET /api/core/grados/ -> [{ id_grado, id_nivel, nombre_grado, orden }]
  getGrados: async () => {
    try {
      const response = await axiosClient.get('/core/grados/');
      return response.data.results || response.data;
    } catch {
      console.warn('API /core/grados/ fallback a mock');
      return gradosDesdeMock();
    }
  },

  // GET /api/core/secciones/ -> [{ id_seccion, nombre_seccion }]
  getSecciones: async () => {
    try {
      const response = await axiosClient.get('/core/secciones/');
      return response.data.results || response.data;
    } catch {
      console.warn('API /core/secciones/ fallback a mock');
      return seccionesDesdeMock();
    }
  }
};
