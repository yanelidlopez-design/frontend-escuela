import axiosClient from './axiosClient';
import { downloadBlob } from './crudFactory';

// MIME types compartidos por los módulos que exportan reportes.
export const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const MIME_PDF = 'application/pdf';
export const MIME_CSV = 'text/csv;charset=utf-8';

const POLL_INTERVAL_MS = 1000;
const MAX_POLLS = 120; // ~2 minutos de tolerancia para reportes pesados

// El backend devuelve URLs absolutas bajo /api/... pero axiosClient ya tiene
// baseURL con /api/: se recorta el prefijo para evitar /api/api/...
const aRutaApi = (url) => (url?.startsWith('/api/') ? url.slice(4) : url);

const dormir = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Ejecuta una exportación (Misión 10): el endpoint responde 202 con
 * { reporte_id, url_estado, url_descarga }; se hace polling del estado
 * hasta 'Completado' y se descarga el archivo final.
 *
 * Compatible con respuestas síncronas: si el backend devuelve el archivo
 * directo (sin content-type JSON), se descarga sin polling.
 *
 * @param {Object} opciones
 * @param {string} opciones.endpoint - Ruta relativa al API (ej. '/academico/alumnos/exportar-alumnos-excel/')
 * @param {Object} [opciones.params] - Query params de filtros
 * @param {string} opciones.filename - Nombre del archivo a descargar
 * @param {string} opciones mimeType - MIME type del archivo
 * @param {Function} [opciones.onEstado] - Callback opcional con cada estado del reporte
 * @param {number} [opciones.pollIntervalMs] - Intervalo entre consultas de estado
 * @param {number} [opciones.maxPolls] - Intentos máximos de polling antes de timeout
 * @returns {Promise<boolean>} true si la descarga se disparó
 */
export const exportarReporte = async ({
  endpoint,
  params = {},
  filename,
  mimeType,
  onEstado = null,
  pollIntervalMs = POLL_INTERVAL_MS,
  maxPolls = MAX_POLLS,
}) => {
  const solicitud = await axiosClient.get(endpoint, { params, responseType: 'blob' });
  const contentType = solicitud.headers?.['content-type'] ?? '';

  // Compatibilidad: sin JSON en la respuesta, el archivo venía directo (modo síncrono).
  if (!contentType.includes('application/json')) {
    downloadBlob(solicitud.data, mimeType, filename);
    return true;
  }

  const encolado = JSON.parse(await solicitud.data.text());
  const urlEstado = aRutaApi(encolado.url_estado);
  const urlDescarga = aRutaApi(encolado.url_descarga);

  let completado = false;
  for (let intento = 0; intento < maxPolls && !completado; intento += 1) {
    await dormir(pollIntervalMs);
    const { data: estado } = await axiosClient.get(urlEstado);
    onEstado?.(estado);
    if (estado.estatus === 'Completado') {
      completado = true;
    } else if (estado.estatus === 'Error') {
      throw new Error(estado.detalle || 'La generación del reporte falló');
    }
  }

  if (!completado) {
    throw new Error('Tiempo agotado esperando la generación del reporte');
  }

  const descarga = await axiosClient.get(urlDescarga, { responseType: 'blob' });
  downloadBlob(descarga.data, mimeType, filename);
  return true;
};