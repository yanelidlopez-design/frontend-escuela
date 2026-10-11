/**
 * Extrae un mensaje legible del error de una petición fallida.
 * Soporta: JSON del backend, página HTML de Django (DEBUG) y errores de red.
 */
export const extraerMensajeError = (err) => {
  const raw = err?.response?.data;
  if (typeof raw === 'string') {
    // Django debug HTML: intentar "Exception Value" y luego <title>
    const valor = raw.match(/Exception Value:?\s*<\/th>\s*<td><pre>([\s\S]*?)<\/pre>/);
    if (valor) return valor[1].trim();
    const titulo = raw.match(/<title>([\s\S]*?)<\/title>/);
    if (titulo) return titulo[1].replace(/\s+/g, ' ').trim();
    return `HTTP ${err.response.status}`;
  }
  if (raw && typeof raw === 'object') {
    const msg = Object.values(raw).flat().join(' ');
    if (msg) return msg;
  }
  return err?.message || 'Error desconocido';
};