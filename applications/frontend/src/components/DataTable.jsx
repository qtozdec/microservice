import React, { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import ExportModal from './ExportModal';
import {
  ChevronUp,
  ChevronDown,
  Filter,
  Search,
  X,
  Download,
  RefreshCw,
  MoreVertical,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

const DataTable = ({
  data = [],
  columns = [],
  loading = false,
  searchable = true,
  filterable = true,
  sortable = true,
  pagination = true,
  pageSize = 10,
  onRowClick,
  onEdit,
  onDelete,
  onView,
  onExport,
  onRefresh,
  className = '',
  exportable = true,
  exportFilename = 'data-export',
  exportTitle = 'Data Export'
}) => {
  const { isDarkMode } = useTheme();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showExportModal, setShowExportModal] = useState(false);

  // Filter and search data
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(item =>
        columns.some(column => {
          const value = item[column.key];
          return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply column filters
    Object.entries(filters).forEach(([key, filterValue]) => {
      if (filterValue) {
        filtered = filtered.filter(item => {
          const value = item[key];
          if (typeof filterValue === 'string') {
            return value && value.toString().toLowerCase().includes(filterValue.toLowerCase());
          }
          return value === filterValue;
        });
      }
    });

    return filtered;
  }, [data, searchTerm, filters, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, pagination]);

  // Pagination info
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, sortedData.length);

  const handleSort = (key) => {
    if (!sortable) return;
    
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleSelectRow = (id) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map(row => row.id)));
    }
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronUp className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      : <ChevronDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
  };

  const renderFilterInput = (column) => {
    if (!column.filterable) return null;

    if (column.filterType === 'select' && column.filterOptions) {
      return (
        <select
          value={filters[column.key] || ''}
          onChange={(e) => handleFilter(column.key, e.target.value)}
          className="w-full text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All</option>
          {column.filterOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type="text"
        placeholder={`Filter ${column.header.toLowerCase()}...`}
        value={filters[column.key] || ''}
        onChange={(e) => handleFilter(column.key, e.target.value)}
        className="w-full text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
      />
    );
  };

  const renderCell = (row, column) => {
    if (column.render) {
      return column.render(row[column.key], row);
    }
    
    const value = row[column.key];
    if (column.type === 'date' && value) {
      return new Date(value).toLocaleDateString();
    }
    if (column.type === 'currency' && value) {
      return `$${Number(value).toFixed(2)}`;
    }
    
    return value || '-';
  };

  const ActionDropdown = ({ row }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
        >
          <MoreVertical className="h-4 w-4 text-gray-400" />
        </button>
        
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
              {onView && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(row);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </button>
              )}
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(row);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(row);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header with search and actions */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            {searchable && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>
            )}
            
            {(searchTerm || Object.keys(filters).some(key => filters[key])) && (
              <button
                onClick={clearFilters}
                className="flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {selectedRows.size > 0 && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedRows.size} selected
              </span>
            )}
            
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
            
            {(onExport || exportable) && (
              <button
                onClick={() => {
                  if (onExport) {
                    onExport(selectedRows.size > 0 ? Array.from(selectedRows) : null);
                  } else {
                    setShowExportModal(true);
                  }
                }}
                className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={paginatedData.length > 0 && selectedRows.size === paginatedData.length}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
              </th>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 text-left">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1">
                      {sortable && column.sortable !== false ? (
                        <button
                          onClick={() => handleSort(column.key)}
                          className="group flex items-center space-x-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                        >
                          <span>{column.header}</span>
                          {getSortIcon(column.key)}
                        </button>
                      ) : (
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {column.header}
                        </span>
                      )}
                    </div>
                    
                    {filterable && column.filterable !== false && (
                      <div className="w-full max-w-xs">
                        {renderFilterInput(column)}
                      </div>
                    )}
                  </div>
                </th>
              ))}
              {(onView || onEdit || onDelete) && (
                <th className="px-4 py-3 text-left">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={columns.length + 2} className="px-4 py-8 text-center">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin text-gray-400 mr-2" />
                    <span className="text-gray-500 dark:text-gray-400">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="px-4 py-8 text-center">
                  <span className="text-gray-500 dark:text-gray-400">
                    {filteredData.length === 0 && data.length > 0 
                      ? 'No results found. Try adjusting your filters.'
                      : 'No data available'
                    }
                  </span>
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(row.id)}
                      onChange={() => handleSelectRow(row.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {renderCell(row, column)}
                    </td>
                  ))}
                  {(onView || onEdit || onDelete) && (
                    <td className="px-4 py-3 text-sm">
                      <ActionDropdown row={row} />
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {startIndex} to {endIndex} of {sortedData.length} results
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Previous
              </button>
              
              <div className="flex items-center space-x-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = Math.max(1, currentPage - 2) + i;
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 text-sm rounded transition-colors duration-200 ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          data={sortedData}
          columns={columns}
          filename={exportFilename}
          title={exportTitle}
        />
      )}
    </div>
  );
};

export default DataTable;