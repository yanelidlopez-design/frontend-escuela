import axiosClient from './axiosClient';

const BASE_PATH = '/academico/periodos/';

/**
 * Lista los periodos de inscripción (GET protegido con JWT).
 * Devuelve objetos con: id, nombre, fecha_inicio, fecha_fin, activo_manual, token_acceso.
 */
export const listarPeriodos = () => axiosClient.get(BASE_PATH);

/**
 * Alterna el estado manual de un periodo (PATCH protegido con JWT).
 * @param {number|string} id - pk del periodo
 * @param {boolean} activo_manual - nuevo estado del switch
 */
export const alternarEstadoPeriodo = (id, activo_manual) =>
  axiosClient.patch(`${BASE_PATH}${id}/alternar-estado/`, { activo_manual });

/**
 * Crea un nuevo periodo de inscripción (POST protegido con JWT).
 * @param {object} data - { nombre, fecha_inicio, fecha_fin, activo_manual }
 */
export const crearPeriodo = (data) => axiosClient.post(BASE_PATH, data);

/**
 * Actualiza nombre y fechas de un periodo (PATCH protegido con JWT).
 * @param {number|string} id - pk del periodo
 * @param {object} data - { nombre, fecha_inicio, fecha_fin }
 */
export const actualizarPeriodo = (id, data) =>
  axiosClient.patch(`${BASE_PATH}${id}/`, data);

/**
 * Elimina un periodo de inscripción (DELETE protegido con JWT).
 * @param {number|string} id - pk del periodo
 */
export const eliminarPeriodo = (id) => axiosClient.delete(`${BASE_PATH}${id}/`);

/**
 * Devuelve el periodo cuyo switch activo_manual esté en true, o null si no hay ninguno.
 */
export const obtenerPeriodoActivo = (periodos) =>
  (periodos || []).find((p) => p.activo_manual === true) || null;

/**
 * Construye la URL pública de inscripción externa a partir del token_acceso.
 *
 * Prioridad de base URL:
 *   1. argumento `baseUrl`
 *   2. variable de entorno VITE_PUBLIC_API_BASE_URL (la que ven los celulares/
 *      equipos externos, p. ej. http://192.168.1.8:8000/api/)
 *   3. VITE_API_BASE_URL (la del panel admin)
 *   4. http://127.0.0.1:8000/api/ por defecto
 *
 * @param {string} tokenAcceso - token del periodo activo
 * @param {string} baseUrl - opcional, sobrescribe la base del backend
 */
export const construirUrlInscripcionPublica = (tokenAcceso, baseUrl) => {
  const backendBase =
    baseUrl ||
    import.meta.env?.VITE_PUBLIC_API_BASE_URL ||
    import.meta.env?.VITE_API_BASE_URL ||
    'http://127.0.0.1:8000/api/';
  // Quita el '/api/' final si lo tiene, para armar la URL pública completa.
  const baseSinApi = backendBase.replace(/\/api\/?$/, '');
  return `${baseSinApi}/api/academico/inscripcion-externa/?token=${encodeURIComponent(tokenAcceso)}`;
};
