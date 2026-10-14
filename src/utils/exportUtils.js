
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';

/**
 * Exporta los datos recibidos a un archivo CSV.
 */
export const exportToCSV = (data, filename = 'reporte-asistencias.csv') => {
  if (!data || !data.length) return;

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Encabezados
  csvRows.push(headers.join(','));

  // Filas
  for (const row of data) {
    const values = headers.map((header) => {
      const escaped = ('' + (row[header] ?? '')).replace(/"/g, '""');
      return '"' + escaped + '"';
    });
    csvRows.push(values.join(','));
  }

  // BOM para UTF-8 (soporte acentos en Excel)
  const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exporta los datos recibidos a un archivo Excel (.xlsx).
 * Usa exceljs (registry oficial, mantenida) en lugar de la librería xlsx
 * de SheetJS, cuya única versión parcheada vive fuera de npm (Misión 11).
 */
export const exportToExcel = async (data, filename = 'reporte-asistencias.xlsx', sheetName = 'Asistencias') => {
  if (!data || !data.length) return;

  const headers = Object.keys(data[0]);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Encabezados en negrita
  worksheet.addRow(headers);
  worksheet.getRow(1).font = { bold: true };

  // Filas de datos
  for (const row of data) {
    worksheet.addRow(headers.map((header) => row[header]));
  }

  // Auto-ajuste razonable del ancho de columnas
  worksheet.columns.forEach((column, index) => {
    const header = headers[index];
    const maxWidth = data.reduce(
      (max, row) => Math.max(max, String(row[header] ?? '').length),
      header.length
    );
    column.width = Math.min(45, Math.max(10, maxWidth + 4));
  });

  // Generar buffer y descargar
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exporta los datos recibidos a un reporte PDF elegante.
 * Si `opts.soloPrincipales` es true, se exportan SOLO los datos básicos y
 * principales de cada fila (nombre, identificación, grado/sección, estado),
 * omitiendo campos de detalle, observaciones y demás columnas del listado.
 */
export const exportToPDF = (data, title = 'Reporte de Control de Asistencias', filename = 'reporte-asistencias.pdf', opts = {}) => {
  const { soloPrincipales = false } = opts;

  // Si soloPrincipales, se exportan SOLO los datos básicos y principales
  // de cada fila (nombre + campos de identificación, grado/sección y estado).
  // Se omiten detalle, observaciones y demás columnas del listado.
  let filaBase = data;
  if (soloPrincipales && Array.isArray(data)) {
    filaBase = data.map((fila) => ({
      ...(fila.N != null ? { 'N.º': fila.N } : {}),
      Nombre: fila.Alumno || fila.Nombre || fila.Cedula || '—',
      'Cédula/ID': (fila.Cedula || fila.id || ''),
      'Grado/Sección': [fila.Grado, fila.Seccion || fila.seccion].filter(Boolean).join(' - '),
      Turno: (fila.Turno || ''),
      Fecha: (fila.Fecha || ''),
      Estado: (fila.Estado || ''),
    }));
  }

  if (!filaBase || !filaBase.length) return;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const today = new Date().toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  // Cabecera institucional
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SISTEMA DE GESTIÓN ACADÉMICA', 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha de emisión: ${today}`, 130, 15);

  // Título del Reporte
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 35);

  // Las claves ORIGINALES se usan para leer los valores de cada fila; la
  // versión en mayúsculas solo sirve como encabezado visible. (Antes se
  // buscaba con la clave ya transformada y todo el cuerpo salía vacío.)
  const columnas = Object.keys(filaBase[0]);
  const headers = columnas.map((h) => h.toUpperCase().replace(/_/g, ' '));
  const body = filaBase.map((fila) => columnas.map((col) => fila[col] ?? ''));

  autoTable(doc, {
    startY: 42,
    head: [headers],
    body,
    theme: 'grid',
    headStyles: {
      fillColor: [2, 132, 199], // brand-500
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: 40,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { top: 40 },
  });

  // Pie de página
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Página ${i} de ${pageCount}`, 196, 285, { align: 'right' });
    doc.text('Documento generado automáticamente por el Sistema Académico', 14, 285);
  }

  doc.save(filename);
};
