import { createCrudApi } from './crudFactory';
import { initialRepresentantes } from '../utils/mockData';

// Filtro personalizado para representantes (busca en nombre, apellido, cedula, representados)
const customRepresentantesFilter = (items, params) => {
  let filtered = [...items];
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
};

// Crear API CRUD estándar usando la factoría
const crudApi = createCrudApi('/personal/representantes/', initialRepresentantes, customRepresentantesFilter);

// Exportar la API CRUD estándar
export const representantesApi = crudApi;
