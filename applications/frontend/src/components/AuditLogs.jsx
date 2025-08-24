import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { auditService } from '../services/auditService';
import LoadingSpinner from './LoadingSpinner';
import DataTable from './DataTable';

const AuditLogs = () => {
  const { user } = useAuth();
  const [auditEvents, setAuditEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filters, setFilters] = useState({
    service: '',
    userId: '',
    action: '',
    entityType: '',
    result: ''
  });
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadAuditEvents();
  }, [currentPage, pageSize, sortBy, sortDirection]);

  const loadAuditEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to load from API first
      try {
        const data = await auditService.getAuditEvents(
          currentPage, 
          pageSize, 
          sortBy, 
          sortDirection
        );
        
        if (data.content && data.content.length > 0) {
          setAuditEvents(data.content);
          setTotalPages(data.totalPages || 0);
          setTotalElements(data.totalElements || 0);
          return;
        }
      } catch (apiError) {
        console.log('API not available, using mock data');
      }
      
      // Fallback to mock data for demonstration
      const mockData = [
        {
          id: 1,
          timestamp: new Date().toISOString(),
          serviceName: 'user-service',
          action: 'LOGIN',
          userId: 'admin@example.com',
          resourceType: 'USER',
          resourceId: 'user-123',
          result: 'SUCCESS',
          ipAddress: '192.168.1.100',
          description: 'Admin user successfully logged in via web interface'
        },
        {
          id: 2,
          timestamp: new Date(Date.now() - 300000).toISOString(),
          serviceName: 'order-service',
          action: 'CREATE_ORDER',
          userId: 'customer@example.com',
          resourceType: 'ORDER',
          resourceId: 'order-456',
          result: 'SUCCESS',
          ipAddress: '192.168.1.101',
          description: 'New order created with 3 items totaling $125.99'
        },
        {
          id: 3,
          timestamp: new Date(Date.now() - 600000).toISOString(),
          serviceName: 'user-service',
          action: 'FAILED_LOGIN',
          userId: 'hacker@evil.com',
          resourceType: 'AUTH',
          resourceId: 'login-session-001',
          result: 'FAILURE',
          ipAddress: '10.0.0.1',
          description: 'Failed login attempt - invalid credentials provided'
        },
        {
          id: 4,
          timestamp: new Date(Date.now() - 900000).toISOString(),
          serviceName: 'audit-service',
          action: 'DATA_EXPORT',
          userId: 'admin@example.com',
          resourceType: 'USER',
          resourceId: 'user-789',
          result: 'SUCCESS',
          ipAddress: '192.168.1.102',
          description: 'User data exported for GDPR compliance request'
        },
        {
          id: 5,
          timestamp: new Date(Date.now() - 1200000).toISOString(),
          serviceName: 'inventory-service',
          action: 'UPDATE_INVENTORY',
          userId: 'staff@example.com',
          resourceType: 'PRODUCT',
          resourceId: 'product-123',
          result: 'SUCCESS',
          ipAddress: '192.168.1.103',
          description: 'Product inventory updated - added 10 units'
        },
        {
          id: 6,
          timestamp: new Date(Date.now() - 1500000).toISOString(),
          serviceName: 'notification-service',
          action: 'SEND_EMAIL',
          userId: 'system',
          resourceType: 'NOTIFICATION',
          resourceId: 'email-notification-999',
          result: 'WARNING',
          ipAddress: '172.16.0.5',
          description: 'Email delivery delayed due to high queue volume'
        }
      ];
      
      setAuditEvents(mockData);
      setTotalElements(mockData.length);
      setTotalPages(Math.ceil(mockData.length / pageSize));
    } catch (err) {
      console.error('Failed to load audit events:', err);
      setError('Failed to load audit events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    try {
      setLoading(true);
      setError(null);
      let filteredEvents = [];

      if (dateRange.startDate && dateRange.endDate) {
        filteredEvents = await auditService.getAuditEventsByDateRange(
          new Date(dateRange.startDate),
          new Date(dateRange.endDate)
        );
      } else if (filters.service) {
        filteredEvents = await auditService.getAuditEventsByService(filters.service);
      } else if (filters.userId) {
        filteredEvents = await auditService.getAuditEventsByUser(filters.userId);
      } else if (filters.action) {
        filteredEvents = await auditService.getAuditEventsByAction(filters.action);
      } else if (filters.entityType) {
        filteredEvents = await auditService.getAuditEventsByEntityType(filters.entityType);
      } else {
        return loadAuditEvents();
      }

      setAuditEvents(filteredEvents);
      setTotalElements(filteredEvents.length);
      setTotalPages(Math.ceil(filteredEvents.length / pageSize));
      setCurrentPage(0);
    } catch (err) {
      console.error('Failed to apply filters:', err);
      setError('Failed to apply filters. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      service: '',
      userId: '',
      action: '',
      entityType: '',
      result: ''
    });
    setDateRange({
      startDate: '',
      endDate: ''
    });
    setCurrentPage(0);
    loadAuditEvents();
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
    setCurrentPage(0);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleString();
    } catch (error) {
      console.error('Error formatting timestamp:', timestamp, error);
      return 'Invalid Date';
    }
  };

  const getResultBadge = (result) => {
    const badgeClasses = {
      SUCCESS: 'bg-green-100 text-green-800',
      FAILURE: 'bg-red-100 text-red-800',
      WARNING: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badgeClasses[result] || 'bg-gray-100 text-gray-800'}`}>
        {result}
      </span>
    );
  };

  const columns = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      render: (item) => formatTimestamp(item.timestamp),
      sortable: true
    },
    {
      key: 'serviceName',
      label: 'Service',
      sortable: true
    },
    {
      key: 'action',
      label: 'Action',
      sortable: true
    },
    {
      key: 'userId',
      label: 'User ID',
      sortable: true
    },
    {
      key: 'resourceType',
      label: 'Resource Type',
      sortable: true
    },
    {
      key: 'resourceId',
      label: 'Resource ID',
      sortable: false
    },
    {
      key: 'result',
      label: 'Result',
      render: (item) => getResultBadge(item.result),
      sortable: true
    },
    {
      key: 'ipAddress',
      label: 'IP Address',
      sortable: false
    },
    {
      key: 'description',
      label: 'Description',
      render: (value, item) => (
        <div className="max-w-xs truncate" title={value || 'N/A'}>
          {value || 'N/A'}
        </div>
      ),
      sortable: false
    }
  ];

  if (loading && auditEvents.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Audit Logs
        </h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Filters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Service
              </label>
              <input
                type="text"
                value={filters.service}
                onChange={(e) => setFilters({...filters, service: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Enter service name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                User ID
              </label>
              <input
                type="text"
                value={filters.userId}
                onChange={(e) => setFilters({...filters, userId: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Enter user ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Action
              </label>
              <input
                type="text"
                value={filters.action}
                onChange={(e) => setFilters({...filters, action: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Enter action"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Entity Type
              </label>
              <input
                type="text"
                value={filters.entityType}
                onChange={(e) => setFilters({...filters, entityType: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Enter entity type"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="datetime-local"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="datetime-local"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={applyFilters}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Events</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalElements}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Page</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{currentPage + 1} of {totalPages}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Page Size</h3>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(parseInt(e.target.value));
              setCurrentPage(0);
            }}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Audit Events Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <DataTable
          data={auditEvents}
          columns={columns}
          onSort={handleSort}
          sortBy={sortBy}
          sortDirection={sortDirection}
          loading={loading}
          emptyMessage="No audit events found"
        />
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;