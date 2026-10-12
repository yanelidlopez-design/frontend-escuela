import axiosClient from './axiosClient';
import { createCrudApi } from './crudFactory';
import { initialGrupos, initialInscripciones } from '../utils/mockData';

// Filtro personalizado para grupos
const customGruposFilter = (items, params) => {
  let filtered = [...items];
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
};

// Crear API CRUD estándar usando la factoría
const crudApi = createCrudApi('/academico/grupos/', initialGrupos, customGruposFilter);

// Métodos específicos de grupos
const customMethods = {
  // Alumnos activos de un grupo: GET /academico/grupos/:id/alumnos-activos/
  getAlumnosActivos: async (idGrupo) => {
    try {
      const response = await axiosClient.get(`/academico/grupos/${idGrupo}/alumnos-activos/`);
      return response.data;
    } catch {
      console.warn('API /academico/grupos/:id/alumnos-activos/ fallback to local store');
      const grupo = initialGrupos.find((g) => (g.id_grupo ?? g.id) === Number(idGrupo));
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
  }
};

// Exportar la API combinando CRUD estándar + métodos específicos
export const gruposApi = {
  ...crudApi,
  ...customMethods
};
