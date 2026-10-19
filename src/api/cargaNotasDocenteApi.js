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
 * Envía el lote de calificaciones literales (PL/L/PM/EP/I + informe descriptivo).
 * Cuerpo: { id_grupo_academico, calificaciones: [{ id_alumno, nota_literal, informe_descriptivo }] }
 */
export const guardarCalificacionesExterna = async (token, payload) => {
  const response = await axiosClient.post(
    `${EXTERNAL_BASE}/cargar-externa/`,
    payload,
    { params: { token } }
  );
  return response.data;
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