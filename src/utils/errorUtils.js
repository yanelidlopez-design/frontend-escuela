/**
 * Extrae un mensaje legible del error de una petición fallida.
 * Soporta: JSON del backend (excepciones de dominio y DRF), errores de red y fallos generales.
 */
export const extraerMensajeError = (err) => {
  const raw = err?.response?.data;

  if (raw && typeof raw === 'object') {
    // Prioridad 1: Clave explícita de excepciones de dominio de la capa de servicios del backend
    if (raw.error) return String(raw.error).trim();

    // Prioridad 2: Clave nativa de excepciones de Django REST Framework (JWT, Permisos, etc.)
    if (raw.detail) return String(raw.detail).trim();

    // Prioridad 3: Filtrar booleanos estructurales (como success: false) y concatenar solo strings/números
    const valores = Object.values(raw).filter(val => typeof val === 'string' || typeof val === 'number');
    const msg = valores.flat().join(' ');
    if (msg) return msg.trim();
  }

  // Fallback ante caídas de servidor o errores de red puros
  if (err?.message === 'Network Error') {
    return 'No se pudo establecer conexión con el servidor escolar. Verifique su acceso a internet.';
  }

  return err?.message || 'Ha ocurrido un error inesperado en la solicitud.';
};