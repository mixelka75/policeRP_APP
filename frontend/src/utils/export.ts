// src/utils/export.ts
import { ExportOptions } from '@/components/modals/ExportModal';

export const exportToCSV = (data: any[], filename: string, options: ExportOptions) => {
  const selectedData = data.map(row => {
    const filteredRow: any = {};
    options.fields.forEach(field => {
      filteredRow[field] = row[field];
    });
    return filteredRow;
  });

  const headers = options.fields.join(',');
  const csvContent = selectedData.map(row =>
    options.fields.map(field => {
      const value = row[field];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  ).join('\n');

  const csv = `${headers}\n${csvContent}`;
  downloadFile(csv, `${filename}.csv`, 'text/csv');
};

export const exportToJSON = (data: any[], filename: string, options: ExportOptions) => {
  const selectedData = data.map(row => {
    const filteredRow: any = {};
    options.fields.forEach(field => {
      filteredRow[field] = row[field];
    });
    return filteredRow;
  });

  const json = JSON.stringify(selectedData, null, 2);
  downloadFile(json, `${filename}.json`, 'application/json');
};

export const exportToExcel = (data: any[], filename: string, options: ExportOptions) => {
  // Для полноценного Excel экспорта нужна библиотека типа xlsx
  // Здесь показан простой пример с CSV форматом
  const selectedData = data.map(row => {
    const filteredRow: any = {};
    options.fields.forEach(field => {
      filteredRow[field] = row[field];
    });
    return filteredRow;
  });

  // Создаем HTML таблицу для Excel
  const headers = options.fields.map(field => `<th>${field}</th>`).join('');
  const rows = selectedData.map(row => {
    const cells = options.fields.map(field => `<td>${row[field] || ''}</td>`).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  const html = `
    <table>
      <thead><tr>${headers}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  downloadFile(html, `${filename}.xls`, 'application/vnd.ms-excel');
};

export const exportToPDF = (data: any[], filename: string, options: ExportOptions) => {
  // Для PDF экспорта нужна библиотека типа jsPDF
  // Здесь показан простой пример с HTML
  const selectedData = data.map(row => {
    const filteredRow: any = {};
    options.fields.forEach(field => {
      filteredRow[field] = row[field];
    });
    return filteredRow;
  });

  const headers = options.fields.map(field => `<th style="border: 1px solid #ccc; padding: 8px;">${field}</th>`).join('');
  const rows = selectedData.map(row => {
    const cells = options.fields.map(field =>
      `<td style="border: 1px solid #ccc; padding: 8px;">${row[field] || ''}</td>`
    ).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  const html = `
    <html>
      <head>
        <title>${filename}</title>
        <style>
          body { font-family: Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>${filename}</h1>
        <table>
          <thead><tr>${headers}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `;

  // Открываем в новом окне для печати в PDF
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }
};

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const handleExport = (
  data: any[],
  filename: string,
  options: ExportOptions
) => {
  // Применяем фильтры по дате
  let filteredData = data;

  if (options.dateRange.start || options.dateRange.end) {
    filteredData = data.filter(item => {
      const itemDate = new Date(item.created_at);
      const start = options.dateRange.start ? new Date(options.dateRange.start) : null;
      const end = options.dateRange.end ? new Date(options.dateRange.end) : null;

      if (start && itemDate < start) return false;
      if (end && itemDate > end) return false;
      return true;
    });
  }

  // Применяем дополнительные фильтры
  if (options.filters.minAmount !== undefined) {
    filteredData = filteredData.filter(item =>
      item.amount >= options.filters.minAmount!
    );
  }

  if (options.filters.maxAmount !== undefined) {
    filteredData = filteredData.filter(item =>
      item.amount <= options.filters.maxAmount!
    );
  }

  if (!options.filters.includeInactive) {
    filteredData = filteredData.filter(item => item.is_active !== false);
  }

  // Экспортируем в выбранном формате
  switch (options.format) {
    case 'csv':
      exportToCSV(filteredData, filename, options);
      break;
    case 'json':
      exportToJSON(filteredData, filename, options);
      break;
    case 'excel':
      exportToExcel(filteredData, filename, options);
      break;
    case 'pdf':
      exportToPDF(filteredData, filename, options);
      break;
    default:
      exportToCSV(filteredData, filename, options);
  }
};