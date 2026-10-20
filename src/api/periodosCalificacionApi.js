import axiosClient from './axiosClient';

const BASE_PATH = '/academico/periodos-calificacion/';

/**
 * Lista los periodos (lapsos) de calificación (GET protegido con JWT).
 * Devuelve objetos con: id, numero_periodo, fecha_limite, activo_manual, token_acceso.
 */
export const listarPeriodosCalificacion = () => axiosClient.get(BASE_PATH);

/**
 * Actualiza un periodo de calificación (PATCH protegido con JWT).
 * @param {number|string} id - pk del periodo
 * @param {object} data - p. ej. { activo_manual: true } o { fecha_limite: '...' }
 */
export const actualizarPeriodoCalificacion = (id, data) =>
  axiosClient.patch(`${BASE_PATH}${id}/`, data);

/**
 * Alterna el switch manual de apertura/cierre de la URL externa del docente.
 * El backend valida el token y que el periodo esté abierto antes de recibir notas.
 * @param {object} periodo - objeto completo del periodo (usa id y activo_manual)
 */
export const alternarPeriodoCalificacion = (periodo) =>
  actualizarPeriodoCalificacion(periodo.id, { activo_manual: !periodo.activo_manual });

/**
 * Nombre legible del lapso según el número de periodo del backend.
 * 1=Diciembre, 2=Abril, 3=Julio (choices de PeriodoCalificacion).
 * @param {number} numeroPeriodo
 */
export const nombreLapso = (numeroPeriodo) =>
  ({ 1: 'Diciembre', 2: 'Abril', 3: 'Julio' })[numeroPeriodo] || `Lapso ${numeroPeriodo}`;

/**
 * Construye la URL pública de carga masiva de notas para el docente externo.
 * Mismas prioridades de base URL que construirUrlInscripcionPublica:
 *   1. argumento `baseUrl`
 *   2. VITE_PUBLIC_API_BASE_URL (la que ven los docentes desde su equipo)
 *   3. VITE_API_BASE_URL (la del panel admin)
 *   4. http://127.0.0.1:8000/api/ por defecto
 *
 * @param {string} tokenAcceso - token_acceso del periodo de calificación
 * @param {string} baseUrl - opcional, sobrescribe la base del backend
 */
export const construirUrlCargaDocente = (tokenAcceso, baseUrl) => {
  const backendBase =
    baseUrl ||
    import.meta.env?.VITE_PUBLIC_API_BASE_URL ||
    import.meta.env?.VITE_API_BASE_URL ||
    'http://127.0.0.1:8000/api/';
  // Quita el '/api/' final si lo tiene, para armar la URL pública completa.
  const baseSinApi = backendBase.replace(/\/api\/?$/, '');
  return `${baseSinApi}/api/academico/calificaciones/cargar-externa/?token=${encodeURIComponent(tokenAcceso)}`;
};

/**
 * Crea un nuevo periodo de calificación (POST protegido con JWT).
 * El axiosClient adjunta automáticamente el Bearer token desde localStorage
 * y gestiona la renovación automática en caso de 401.
 * @param {object} datosPeriodo - p. ej. { numero_periodo, fecha_limite, activo_manual }
 */
export const crearPeriodoCalificacion = async (datosPeriodo) => {
  const respuesta = await axiosClient.post(BASE_PATH, datosPeriodo);
  return respuesta.data;
};

/**
 * Descarga el informe descriptivo de lapso en PDF (stream binario protegido por JWT).
 * Configura estrictamente responseType: 'blob' para recibir los bytes del archivo.
 * @param {number|string} alumnoId - pk del alumno
 * @param {number|string} periodoId - pk del periodo de calificación (1=Diciembre, 2=Abril, 3=Julio)
 */
export const descargarInformeLapsoPdf = (alumnoId, periodoId) =>
  axiosClient.get(`/academico/calificaciones/informe-lapso-pdf/${alumnoId}/${periodoId}/`, {
    responseType: 'blob',
  });

/**
 * Descarga la constancia de prosecución final en PDF (stream binario protegido por JWT).
 * Configura estrictamente responseType: 'blob' para recibir los bytes del archivo.
 * @param {number|string} alumnoId - pk del alumno
 */
export const descargarConstanciaProsecucionPdf = (alumnoId) =>
  axiosClient.get(`/academico/calificaciones/prosecucion-final-pdf/${alumnoId}/`, {
    responseType: 'blob',
  });