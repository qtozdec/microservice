import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

class ExportService {
  /**
   * Export data to Excel format
   * @param {Array} data - Array of objects to export
   * @param {String} filename - Name of the file (without extension)
   * @param {Array} columns - Column configuration (optional)
   */
  exportToExcel(data, filename = 'export', columns = null) {
    try {
      // If columns are specified, filter and format the data
      let exportData = data;
      
      if (columns && columns.length > 0) {
        exportData = data.map(row => {
          const filteredRow = {};
          columns.forEach(col => {
            if (col.exportKey || col.key) {
              const key = col.exportKey || col.key;
              const header = col.exportHeader || col.header;
              
              let value = row[key];
              
              // Handle different data types
              if (col.type === 'date' && value) {
                value = new Date(value).toLocaleDateString();
              } else if (col.type === 'currency' && value) {
                value = `$${Number(value).toFixed(2)}`;
              } else if (col.render && typeof col.render === 'function') {
                // For complex renders, try to extract plain text
                const rendered = col.render(value, row);
                if (typeof rendered === 'string') {
                  value = rendered;
                } else if (rendered && rendered.props && rendered.props.children) {
                  // Try to extract text from React elements
                  value = this.extractTextFromReactElement(rendered);
                }
              }
              
              filteredRow[header] = value || '';
            }
          });
          return filteredRow;
        });
      }

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Auto-size columns
      const colWidths = [];
      if (exportData.length > 0) {
        Object.keys(exportData[0]).forEach((key, index) => {
          const maxLength = Math.max(
            key.length,
            ...exportData.map(row => String(row[key] || '').length)
          );
          colWidths[index] = { wch: Math.min(maxLength + 2, 50) };
        });
        ws['!cols'] = colWidths;
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Data');

      // Generate and download file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      this.downloadFile(excelBuffer, `${filename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      
      return true;
    } catch (error) {
      console.error('Excel export error:', error);
      throw new Error('Failed to export to Excel');
    }
  }

  /**
   * Export data to PDF format
   * @param {Array} data - Array of objects to export
   * @param {String} filename - Name of the file (without extension)
   * @param {Array} columns - Column configuration (optional)
   * @param {Object} options - PDF options
   */
  exportToPDF(data, filename = 'export', columns = null, options = {}) {
    try {
      const doc = new jsPDF({
        orientation: options.orientation || 'landscape',
        unit: 'mm',
        format: options.format || 'a4'
      });

      // Set title
      const title = options.title || 'Data Export';
      doc.setFontSize(16);
      doc.text(title, 14, 22);

      // Add export date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

      // Prepare table data
      let tableColumns = [];
      let tableData = [];

      if (columns && columns.length > 0) {
        // Use specified columns
        tableColumns = columns
          .filter(col => col.exportable !== false)
          .map(col => col.exportHeader || col.header);

        tableData = data.map(row => {
          return columns
            .filter(col => col.exportable !== false)
            .map(col => {
              const key = col.exportKey || col.key;
              let value = row[key];

              // Handle different data types
              if (col.type === 'date' && value) {
                return new Date(value).toLocaleDateString();
              } else if (col.type === 'currency' && value) {
                return `$${Number(value).toFixed(2)}`;
              } else if (col.render && typeof col.render === 'function') {
                // For complex renders, try to extract plain text
                const rendered = col.render(value, row);
                if (typeof rendered === 'string') {
                  return rendered;
                } else if (rendered && rendered.props && rendered.props.children) {
                  // Try to extract text from React elements
                  return this.extractTextFromReactElement(rendered);
                }
              }

              return String(value || '');
            });
        });
      } else {
        // Use all data keys
        if (data.length > 0) {
          tableColumns = Object.keys(data[0]);
          tableData = data.map(row => tableColumns.map(col => String(row[col] || '')));
        }
      }

      // Add table to PDF
      doc.autoTable({
        head: [tableColumns],
        body: tableData,
        startY: 35,
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [59, 130, 246], // Blue color
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // Light gray
        },
        margin: { top: 35, left: 14, right: 14, bottom: 20 },
        didDrawPage: (data) => {
          // Add page numbers
          const pageNumber = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.text(
            `Page ${data.pageNumber} of ${pageNumber}`,
            data.settings.margin.left,
            doc.internal.pageSize.height - 10
          );
        }
      });

      // Save the PDF
      doc.save(`${filename}.pdf`);
      
      return true;
    } catch (error) {
      console.error('PDF export error:', error);
      throw new Error('Failed to export to PDF');
    }
  }

  /**
   * Export data to CSV format
   * @param {Array} data - Array of objects to export
   * @param {String} filename - Name of the file (without extension)
   * @param {Array} columns - Column configuration (optional)
   */
  exportToCSV(data, filename = 'export', columns = null) {
    try {
      let csvContent = '';
      let exportData = data;

      if (columns && columns.length > 0) {
        // Add headers
        const headers = columns
          .filter(col => col.exportable !== false)
          .map(col => col.exportHeader || col.header);
        csvContent += headers.join(',') + '\n';

        // Add data rows
        exportData.forEach(row => {
          const rowData = columns
            .filter(col => col.exportable !== false)
            .map(col => {
              const key = col.exportKey || col.key;
              let value = row[key];

              // Handle different data types
              if (col.type === 'date' && value) {
                value = new Date(value).toLocaleDateString();
              } else if (col.type === 'currency' && value) {
                value = `$${Number(value).toFixed(2)}`;
              } else if (col.render && typeof col.render === 'function') {
                // For complex renders, try to extract plain text
                const rendered = col.render(value, row);
                if (typeof rendered === 'string') {
                  value = rendered;
                } else {
                  value = this.extractTextFromReactElement(rendered);
                }
              }

              // Escape commas and quotes in CSV
              value = String(value || '');
              if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                value = `"${value.replace(/"/g, '""')}"`;
              }

              return value;
            });
          csvContent += rowData.join(',') + '\n';
        });
      } else {
        // Use all data keys
        if (exportData.length > 0) {
          const headers = Object.keys(exportData[0]);
          csvContent += headers.join(',') + '\n';

          exportData.forEach(row => {
            const rowData = headers.map(header => {
              let value = String(row[header] || '');
              if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                value = `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            });
            csvContent += rowData.join(',') + '\n';
          });
        }
      }

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      this.downloadBlob(blob, `${filename}.csv`);
      
      return true;
    } catch (error) {
      console.error('CSV export error:', error);
      throw new Error('Failed to export to CSV');
    }
  }

  /**
   * Extract text content from React elements
   * @param {Object} element - React element
   * @returns {String} - Extracted text
   */
  extractTextFromReactElement(element) {
    if (typeof element === 'string' || typeof element === 'number') {
      return String(element);
    }

    if (element && element.props) {
      if (typeof element.props.children === 'string') {
        return element.props.children;
      }
      
      if (Array.isArray(element.props.children)) {
        return element.props.children
          .map(child => this.extractTextFromReactElement(child))
          .join(' ');
      }
      
      if (element.props.children) {
        return this.extractTextFromReactElement(element.props.children);
      }
    }

    return '';
  }

  /**
   * Download file from array buffer
   * @param {ArrayBuffer} buffer - File buffer
   * @param {String} filename - File name
   * @param {String} mimeType - MIME type
   */
  downloadFile(buffer, filename, mimeType) {
    const blob = new Blob([buffer], { type: mimeType });
    this.downloadBlob(blob, filename);
  }

  /**
   * Download blob as file
   * @param {Blob} blob - File blob
   * @param {String} filename - File name
   */
  downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Show export options modal
   * @param {Array} data - Data to export
   * @param {Array} columns - Column configuration
   * @param {String} defaultFilename - Default filename
   * @returns {Promise} - Promise that resolves when export is complete
   */
  showExportDialog(data, columns, defaultFilename = 'export') {
    return new Promise((resolve, reject) => {
      // This would typically show a modal, but for now we'll provide the options directly
      const exportOptions = {
        excel: () => this.exportToExcel(data, defaultFilename, columns),
        pdf: () => this.exportToPDF(data, defaultFilename, columns),
        csv: () => this.exportToCSV(data, defaultFilename, columns)
      };
      
      resolve(exportOptions);
    });
  }
}

const exportService = new ExportService();
export default exportService;