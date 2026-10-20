/**
 * Cliente de API para el Formulario Público de Carga de Notas por URL Externa
 * (E.B Creación San José - docentes sin sesión JWT).
 *
 * Endpoints públicos (AllowAny, autenticados por token en query params):
 *   POST /api/academico/calificaciones/cargar-externa/?token=...
 *   POST /api/academico/calificaciones/cargar-criterios-externa/?token=...
 *   POST /api/academico/calificaciones/prosecucion-final/  (requiere JWT en prod;
 *     se conserva aquí por si se expone públicamente en el futuro).
 */

import axiosClient from './axiosClient';

const EXTERNAL_BASE = '/api/academico/calificaciones';

/**
 * Valida un token de acceso intentando leer la configuración del periodo.
 * El backend expone la misma URL por GET para consultar el lapso asociado.
 */
export const validarTokenExterno = async (token) => {
  const response = await axiosClient.get(`${EXTERNAL_BASE}/cargar-externa/`, {
    params: { token },
  });
  return response.data;
};

/**
 * Base URL pública para endpoints sin sesión JWT (enlaces externos de docentes).
 * Se prefiere VITE_PUBLIC_API_BASE_URL (accesible desde la red local) con
 * fallback a VITE_API_BASE_URL para entornos de desarrollo local.
 */
const PUBLIC_BASE =
  import.meta.env?.VITE_PUBLIC_API_BASE_URL ||
  import.meta.env?.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000/api/';

/**
 * Helper de retraso basado en promesas simples para backoff exponencial.
 * @param {number} ms - Milisegundos a esperar antes de resolver.
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Códigos de estado HTTP de servidor que justifican reintento automático
 * (pasarelas de red y sobrecarga transitoria del backend).
 */
const CODIGOS_REINTENTABLES = [502, 503, 504];

/**
 * Número máximo de reintentos automáticos ante errores de red transitorios.
 */
const MAX_REINTENTOS = 3;

/**
 * Tiempos de espera (ms) entre reintentos, en orden exponencial:
 * 1.º reintento: 1500ms, 2.º: 3000ms, 3.º: 6000ms.
 */
const TIEMPOS_ESPERA_MS = [1500, 3000, 6000];

/**
 * Determina si un error de Axios es reintenable automáticamente.
 * Se considera reintenable ante fallo de red puro o errores de pasarela
 * del servidor (502, 503, 504).
 * @param {Error} error - Error capturado de Axios.
 * @returns {boolean}
 */
const esErrorReintenable = (error) => {
  if (error?.message === 'Network Error') return true;
  if (error?.response && CODIGOS_REINTENTABLES.includes(error.response.status)) {
    return true;
  }
  return false;
};

/**
 * Obtiene los datos precargados del formulario público a partir del token.
 * GET /api/academico/calificaciones/cargar-criterios-externa/?token=...
 * Devuelve: { success, numero_periodo, grupo: { id, grado, seccion },
 *   criterios: [...], alumnos: [...] }
 */
export const obtenerDatosFormularioExterno = async (token) => {
  const response = await axiosClient.get(
    `${PUBLIC_BASE}academico/calificaciones/cargar-criterios-externa/`,
    { params: { token } }
  );
  return response.data;
};

/**
 * Envía el lote de calificaciones literales (PL/L/PM/EP/I + informe descriptivo).
 * Incluye reintentos automáticos con backoff exponencial ante errores de red
 * transitorios (Network Error, 502, 503, 504).
 *
 * Cuerpo: { id_grupo_academico, calificaciones: [{ id_alumno, nota_literal, informe_descriptivo }] }
 *
 * @param {string} token - Token de acceso del periodo de calificación.
 * @param {Object} payload - Datos del lote de calificaciones a guardar.
 * @returns {Promise<Object>} Respuesta del backend con el resultado del guardado.
 * @throws {Error} Propaga el error tras agotar los 3 reintentos permitidos.
 */
export const guardarCalificacionesExterna = async (token, payload) => {
  let ultimoError;

  // Intento inicial + hasta MAX_REINTENTOS reintentos automáticos.
  for (let intento = 0; intento <= MAX_REINTENTOS; intento += 1) {
    try {
      const response = await axiosClient.post(
        `${EXTERNAL_BASE}/cargar-externa/`,
        payload,
        { params: { token } }
      );
      return response.data;
    } catch (error) {
      ultimoError = error;

      // Si el error no es reintenable o se agotaron los reintentos, propagar.
      if (!esErrorReintenable(error) || intento === MAX_REINTENTOS) {
        throw error;
      }

      // Backoff exponencial antes del siguiente reintento.
      await delay(TIEMPOS_ESPERA_MS[intento]);
    }
  }

  // Salvaguardia: nunca debería alcanzarse, pero se lanza el último error por seguridad.
  throw ultimoError;
};

/**
 * Envía el lote de criterios cualitativos por sección.
 * Cuerpo: { id_grupo_academico, alumnos_evaluaciones: [{ id_alumno, evaluaciones: [{ id_criterio, indicador, sugerencias }] }] }
 */
export const guardarCriteriosExterna = async (token, payload) => {
  const response = await axiosClient.post(
    `${EXTERNAL_BASE}/cargar-criterios-externa/`,
    payload,
    { params: { token } }
  );
  return response.data;
};

/**
 * Registra el veredicto anual de prosecución (literal A-E + grado de promoción).
 * Cuerpo: { alumno, periodo_escolar, literal_final, promovido_al_grado }
 */
export const registrarProcescionFinal = async (token, payload) => {
  const response = await axiosClient.post(
    `${EXTERNAL_BASE}/prosecucion-final/`,
    payload,
    { params: { token } }
  );
  return response.data;
};