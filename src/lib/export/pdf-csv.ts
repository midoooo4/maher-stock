import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToCSV(filename: string, rows: Record<string, unknown>[], headers: { key: string; label: string }[]) {
  if (!rows || rows.length === 0) return;

  const headerLine = headers.map(h => `"${h.label.replace(/"/g, '""')}"`).join(';');
  const dataLines = rows.map(row => {
    return headers.map(h => {
      const val = row[h.key];
      const strVal = val === null || val === undefined ? '' : String(val);
      return `"${strVal.replace(/"/g, '""')}"`;
    }).join(';');
  });

  const csvContent = '\uFEFF' + [headerLine, ...dataLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF(params: {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number)[][];
  generatedBy?: string;
  totals?: { label: string; value: string };
}) {
  const { title, subtitle, headers, rows, generatedBy, totals } = params;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Header Branding Complexe Maher
  doc.setFillColor(21, 25, 54); // #151936 Navy
  doc.rect(0, 0, 210, 24, 'F');

  doc.setFontSize(14);
  doc.setTextColor(233, 155, 57); // #E99B39 Orange
  doc.setFont('helvetica', 'bold');
  doc.text('COMPLEXE MAHER – RESTAURANT ET PISCINE', 14, 11);

  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.text('MAHER STOCK - Gestion intelligente de l\'économat', 14, 18);

  // Document Title & Metadata
  doc.setFontSize(16);
  doc.setTextColor(21, 25, 54);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 36);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  if (subtitle) {
    doc.text(subtitle, 14, 42);
  }

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Édité le : ${currentDate}`, 140, 36);
  if (generatedBy) {
    doc.text(`Par : ${generatedBy}`, 140, 42);
  }

  // Draw separator line
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 46, 196, 46);

  // Table
  autoTable(doc, {
    startY: 50,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [21, 25, 54],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // Totals block if provided
  if (totals) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = (doc as any).lastAutoTable?.finalY || 150;
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(120, finalY + 8, 76, 14, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(21, 25, 54);
    doc.text(`${totals.label} : ${totals.value}`, 124, finalY + 17);
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Complexe Maher Stock - Document officiel d'exploitation - Page ${i} / ${pageCount}`,
      14,
      287
    );
  }

  doc.save(`${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`);
}
