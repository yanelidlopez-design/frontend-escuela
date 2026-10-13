import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportarReporte } from '../api/exportaciones';
import axiosClient from '../api/axiosClient';
import { downloadBlob } from '../api/crudFactory';

vi.mock('../api/axiosClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

// Se sustituye solo downloadBlob; el resto de la factoría se mantiene real.
vi.mock('../api/crudFactory', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, downloadBlob: vi.fn() };
});

// Fake de Blob-JSON: exportaciones llama a .text() para leer el payload 202.
const blobJson = (objeto) => ({ text: async () => JSON.stringify(objeto) });

const ENCOLADO = {
  reporte_id: 'abc123',
  estatus: 'Procesando',
  url_estado: '/api/academico/exports/abc123/',
  url_descarga: '/api/academico/exports/abc123/descarga/',
};

describe('exportarReporte (flujo asíncrono Misión 10)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hace polling hasta Completado y descarga el archivo', async () => {
    axiosClient.get
      // 1) Solicitud de exportación → 202 con payload JSON
      .mockResolvedValueOnce({
        data: blobJson(ENCOLADO),
        headers: { 'content-type': 'application/json' },
      })
      // 2) Poll 1 → Procesando
      .mockResolvedValueOnce({ data: { ...ENCOLADO } })
      // 3) Poll 2 → Completado
      .mockResolvedValueOnce({ data: { ...ENCOLADO, estatus: 'Completado', tamanio_bytes: 10 } })
      // 4) Descarga
      .mockResolvedValueOnce({ data: 'bytes-del-archivo' });

    const onEstado = vi.fn();
    const resultado = await exportarReporte({
      endpoint: '/academico/alumnos/exportar-alumnos-excel/',
      params: { grado: 1 },
      filename: 'alumnos.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      onEstado,
      pollIntervalMs: 1,
    });

    expect(resultado).toBe(true);
    // Solicitud inicial con los filtros
    expect(axiosClient.get).toHaveBeenNthCalledWith(
      1,
      '/academico/alumnos/exportar-alumnos-excel/',
      { params: { grado: 1 }, responseType: 'blob' }
    );
    // Polling sin prefijo /api/ duplicado (baseURL ya lo incluye)
    expect(axiosClient.get).toHaveBeenNthCalledWith(2, '/academico/exports/abc123/');
    expect(axiosClient.get).toHaveBeenNthCalledWith(3, '/academico/exports/abc123/');
    // Descarga final
    expect(axiosClient.get).toHaveBeenNthCalledWith(
      4,
      '/academico/exports/abc123/descarga/',
      { responseType: 'blob' }
    );
    expect(downloadBlob).toHaveBeenCalledWith(
      'bytes-del-archivo',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'alumnos.xlsx'
    );
    expect(onEstado).toHaveBeenCalledTimes(2);
  });

  it('descarga directa (respuesta no-JSON, compat síncrona) sin polling', async () => {
    axiosClient.get.mockResolvedValueOnce({
      data: 'archivo-directo',
      headers: { 'content-type': 'application/pdf' },
    });

    const resultado = await exportarReporte({
      endpoint: '/academico/inscripciones/exportar-inscripciones-pdf/',
      filename: 'inscripciones.pdf',
      mimeType: 'application/pdf',
      pollIntervalMs: 1,
    });

    expect(resultado).toBe(true);
    expect(axiosClient.get).toHaveBeenCalledTimes(1);
    expect(downloadBlob).toHaveBeenCalledWith('archivo-directo', 'application/pdf', 'inscripciones.pdf');
  });

  it('lanza error con el detalle del backend cuando el estado es Error', async () => {
    axiosClient.get
      .mockResolvedValueOnce({
        data: blobJson(ENCOLADO),
        headers: { 'content-type': 'application/json' },
      })
      .mockResolvedValueOnce({
        data: { ...ENCOLADO, estatus: 'Error', detalle: 'Falta ReportLab' },
      });

    await expect(
      exportarReporte({
        endpoint: '/academico/alumnos/exportar-alumnos-pdf/',
        filename: 'alumnos.pdf',
        mimeType: 'application/pdf',
        pollIntervalMs: 1,
      })
    ).rejects.toThrow('Falta ReportLab');
    expect(downloadBlob).not.toHaveBeenCalled();
  });

  it('lanza error de timeout al agotar los intentos de polling', async () => {
    axiosClient.get.mockImplementation(async (url) => {
      if (url.includes('exportar-alumnos-excel')) {
        return { data: blobJson(ENCOLADO), headers: { 'content-type': 'application/json' } };
      }
      return { data: { ...ENCOLADO } }; // siempre Procesando
    });

    await expect(
      exportarReporte({
        endpoint: '/academico/alumnos/exportar-alumnos-excel/',
        filename: 'alumnos.xlsx',
        mimeType: 'application/xlsx',
        pollIntervalMs: 1,
        maxPolls: 3,
      })
    ).rejects.toThrow('Tiempo agotado');
    expect(downloadBlob).not.toHaveBeenCalled();
  });
});
