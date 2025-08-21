import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import exportService from '../services/exportService';
import {
  Download,
  FileSpreadsheet,
  FileText,
  File,
  X,
  Calendar,
  Filter,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const ExportModal = ({ 
  isOpen, 
  onClose, 
  data = [], 
  columns = [], 
  filename = 'export',
  title = 'Export Data'
}) => {
  const { isDarkMode } = useTheme();
  const [exportFormat, setExportFormat] = useState('excel');
  const [exportFilename, setExportFilename] = useState(filename);
  const [includeFilters, setIncludeFilters] = useState(true);
  const [dateRange, setDateRange] = useState('all');
  const [selectedColumns, setSelectedColumns] = useState(
    columns.map(col => col.key)
  );
  const [loading, setLoading] = useState(false);

  const exportFormats = [
    {
      key: 'excel',
      name: 'Excel (.xlsx)',
      description: 'Spreadsheet format with formatting and formulas',
      icon: FileSpreadsheet,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      key: 'pdf',
      name: 'PDF (.pdf)',
      description: 'Portable document format for sharing and printing',
      icon: FileText,
      color: 'text-red-600 dark:text-red-400'
    },
    {
      key: 'csv',
      name: 'CSV (.csv)',
      description: 'Comma-separated values for data analysis',
      icon: File,
      color: 'text-blue-600 dark:text-blue-400'
    }
  ];

  const handleExport = async () => {
    if (!exportFilename.trim()) {
      toast.error('Please enter a filename');
      return;
    }

    if (selectedColumns.length === 0) {
      toast.error('Please select at least one column to export');
      return;
    }

    setLoading(true);

    try {
      // Filter data based on date range if applicable
      let filteredData = [...data];
      
      if (dateRange !== 'all' && data.length > 0) {
        const now = new Date();
        const cutoffDate = new Date();
        
        switch (dateRange) {
          case 'today':
            cutoffDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            cutoffDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            cutoffDate.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            cutoffDate.setFullYear(now.getFullYear() - 1);
            break;
          default:
            break;
        }

        if (dateRange !== 'all') {
          filteredData = data.filter(row => {
            // Look for date fields in the row
            const dateField = Object.keys(row).find(key => 
              key.toLowerCase().includes('date') || 
              key.toLowerCase().includes('created') ||
              key.toLowerCase().includes('updated')
            );
            
            if (dateField && row[dateField]) {
              const itemDate = new Date(row[dateField]);
              return itemDate >= cutoffDate;
            }
            return true;
          });
        }
      }

      // Filter columns based on selection
      const exportColumns = columns.filter(col => 
        selectedColumns.includes(col.key)
      );

      // Prepare export options
      const exportOptions = {
        title: title,
        filename: exportFilename.replace(/\.[^/.]+$/, ""), // Remove extension if provided
        columns: exportColumns,
        includeFilters
      };

      // Perform export based on format
      switch (exportFormat) {
        case 'excel':
          await exportService.exportToExcel(filteredData, exportOptions.filename, exportColumns);
          break;
        case 'pdf':
          await exportService.exportToPDF(filteredData, exportOptions.filename, exportColumns, {
            title: title,
            orientation: exportColumns.length > 4 ? 'landscape' : 'portrait'
          });
          break;
        case 'csv':
          await exportService.exportToCSV(filteredData, exportOptions.filename, exportColumns);
          break;
        default:
          throw new Error('Invalid export format');
      }

      toast.success(`Successfully exported ${filteredData.length} records to ${exportFormat.toUpperCase()}`);
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.message || 'Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleColumnToggle = (columnKey) => {
    setSelectedColumns(prev => 
      prev.includes(columnKey)
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  const selectAllColumns = () => {
    setSelectedColumns(columns.map(col => col.key));
  };

  const deselectAllColumns = () => {
    setSelectedColumns([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Download className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Export Data
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Export Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Export Format
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {exportFormats.map((format) => {
                  const IconComponent = format.icon;
                  return (
                    <button
                      key={format.key}
                      onClick={() => setExportFormat(format.key)}
                      className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                        exportFormat === format.key
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <IconComponent className={`h-6 w-6 ${format.color} mt-0.5`} />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {format.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {format.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filename */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filename
              </label>
              <input
                type="text"
                value={exportFilename}
                onChange={(e) => setExportFilename(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                placeholder="Enter filename..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Extension will be added automatically
              </p>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              >
                <option value="all">All records</option>
                <option value="today">Today</option>
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
                <option value="year">Last year</option>
              </select>
            </div>

            {/* Column Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Columns to Export
                </label>
                <div className="flex items-center space-x-2 text-xs">
                  <button
                    onClick={selectAllColumns}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    Select All
                  </button>
                  <span className="text-gray-400">|</span>
                  <button
                    onClick={deselectAllColumns}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                {columns.map((column) => (
                  <label
                    key={column.key}
                    className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded p-1 transition-colors duration-200"
                  >
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(column.key)}
                      onChange={() => handleColumnToggle(column.key)}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      {column.header}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {selectedColumns.length} of {columns.length} columns selected
              </p>
            </div>

            {/* Export Summary */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Export Summary
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Records: {data.length}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Columns: {selectedColumns.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning */}
            {data.length > 1000 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      Large Export Warning
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                      You're exporting {data.length} records. This may take a moment to process.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={loading || selectedColumns.length === 0 || !exportFilename.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Export {exportFormat.toUpperCase()}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;