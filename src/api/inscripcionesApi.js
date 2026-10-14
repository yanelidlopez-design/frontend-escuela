import { createCrudApi } from './crudFactory';
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

// La exportación de listados vive en la página (se genera en el cliente con
// exportUtils): los endpoints backend de exportación no existían y el 404
// quedaba silenciado por .catch(() => {}).
export const inscripcionesApi = {
  ...crudApi,
};
