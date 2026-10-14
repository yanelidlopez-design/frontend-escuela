import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// jsPDF no es constructible en entornos Node/CommonJS (solo en el navegador),
// así que se sustituye por un doble con las mismas primitivas que usa
// exportToPDF (rect, text, internal.getNumberOfPages, save, ...).
vi.mock('jspdf', () => {
  class FakeJsPDF {
    constructor() {
      this.internal = { getNumberOfPages: () => 1 };
      this.guardado = null;
    }
    setFillColor() {}
    rect() {}
    setTextColor() {}
    setFontSize() {}
    setFont() {}
    text() {}
    setPage() {}
    save(nombre) {
      this.guardado = nombre;
    }
  }
  return { default: FakeJsPDF };
});

// Se captura la llamada a autoTable para validar encabezados y cuerpo.
vi.mock('jspdf-autotable', () => ({ default: vi.fn() }));

import autoTable from 'jspdf-autotable';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';

describe('exportToPDF', () => {
  beforeEach(() => {
    autoTable.mockClear();
  });

  it('escribe las celdas del cuerpo con los valores originales (regresión: claves en mayúsculas)', () => {
    exportToPDF(
      [
        { Nombre: 'Ana Pérez', Grado: '5°', Estado: 'Presente' },
        { Nombre: 'Luis Gómez', Grado: '6°', Estado: 'Ausente' },
      ],
      'Listado de Prueba',
      'listado.pdf'
    );

    expect(autoTable).toHaveBeenCalledTimes(1);
    const opciones = autoTable.mock.calls[0][1];
    // Los encabezados se muestran en mayúsculas...
    expect(opciones.head).toEqual([['NOMBRE', 'GRADO', 'ESTADO']]);
    // ...pero el cuerpo debe leerse con las claves originales (antes salía vacío).
    expect(opciones.body).toEqual([
      ['Ana Pérez', '5°', 'Presente'],
      ['Luis Gómez', '6°', 'Ausente'],
    ]);
  });

  it('con soloPrincipales exporta solo las columnas principales de asistencia', () => {
    exportToPDF(
      [
        {
          N: 1,
          Alumno: 'Ana Pérez',
          Cedula: 'V-123456',
          Grado: '5°',
          Seccion: 'A',
          Turno: 'Mañana',
          Fecha: '2026-10-14',
          Estado: 'Presente',
          Observaciones: 'Detalle que no debe exportarse',
        },
      ],
      'Control de Asistencia',
      'asistencias.pdf',
      { soloPrincipales: true }
    );

    expect(autoTable).toHaveBeenCalledTimes(1);
    const opciones = autoTable.mock.calls[0][1];
    expect(opciones.head).toEqual([
      ['N.º', 'NOMBRE', 'CÉDULA/ID', 'GRADO/SECCIÓN', 'TURNO', 'FECHA', 'ESTADO'],
    ]);
    expect(opciones.body).toEqual([
      [1, 'Ana Pérez', 'V-123456', '5° - A', 'Mañana', '2026-10-14', 'Presente'],
    ]);
    expect(JSON.stringify(opciones.body)).not.toContain('Detalle que no debe exportarse');
  });

  it('no genera documento cuando no hay filas', () => {
    exportToPDF([], 'Listado Vacío', 'vacio.pdf');
    expect(autoTable).not.toHaveBeenCalled();
  });
});

describe('exportToCSV', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:prueba');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('descarga un blob CSV con BOM UTF-8 y los encabezados', async () => {
    exportToCSV([{ Nombre: 'Ana Pérez', Estado: 'Presente' }], 'alumnos.csv');

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    const blob = URL.createObjectURL.mock.calls[0][0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toContain('text/csv');

    const texto = await blob.text();
    // Blob.text() decodifica UTF-8 y descarta el BOM: se valida en bytes crudos.
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect([bytes[0], bytes[1], bytes[2]]).toEqual([0xef, 0xbb, 0xbf]);
    expect(texto).toContain('Nombre');
    expect(texto).toContain('Ana Pérez');
  });

  it('no descarga nada cuando la lista está vacía', () => {
    exportToCSV([], 'vacio.csv');
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});

