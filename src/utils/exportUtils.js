import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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
      return `"${escaped}"`;
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
};

/**
 * Exporta los datos recibidos a un archivo Excel (.xlsx).
 */
export const exportToExcel = (data, filename = 'reporte-asistencias.xlsx', sheetName = 'Asistencias') => {
  if (!data || !data.length) return;

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generar buffer y descargar
  XLSX.writeFile(workbook, filename);
};

/**
 * Exporta los datos recibidos a un reporte PDF elegante.
 */
export const exportToPDF = (data, title = 'Reporte de Control de Asistencias', filename = 'reporte-asistencias.pdf') => {
  if (!data || !data.length) return;

  const doc = new jsPDF();
  const today = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

  const headers = Object.keys(data[0]).map((h) => h.toUpperCase().replace('_', ' '));
  const body = data.map((row) => Object.values(row));

  autoTable(doc, {
    startY: 42,
    head: [headers],
    body: body,
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
