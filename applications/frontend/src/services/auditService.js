import axios from 'axios';

const AUDIT_API_URL = '/audit';

// Create audit-specific API instance
const auditApi = axios.create({
  baseURL: AUDIT_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Set auth token interceptor
auditApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auditService = {
  // Get paginated audit events
  getAuditEvents: async (page = 0, size = 20, sortBy = 'timestamp', sortDir = 'desc') => {
    const response = await auditApi.get('/events', {
      params: { page, size, sortBy, sortDir }
    });
    return response.data;
  },

  // Get audit event by ID
  getAuditEventById: async (id) => {
    const response = await auditApi.get(`/${id}`);
    return response.data;
  },

  // Get audit events by service
  getAuditEventsByService: async (service) => {
    const response = await auditApi.get(`/service/${service}`);
    return response.data;
  },

  // Get audit events by user
  getAuditEventsByUser: async (userId) => {
    const response = await auditApi.get(`/user/${userId}`);
    return response.data;
  },

  // Get audit events by entity type
  getAuditEventsByEntityType: async (entityType) => {
    const response = await auditApi.get(`/entity-type/${entityType}`);
    return response.data;
  },

  // Get audit events by action
  getAuditEventsByAction: async (action) => {
    const response = await auditApi.get(`/action/${action}`);
    return response.data;
  },

  // Get audit events by date range
  getAuditEventsByDateRange: async (startDate, endDate) => {
    const response = await auditApi.get('/date-range', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
    return response.data;
  },

  // Get failed operations
  getFailedOperations: async () => {
    const response = await auditApi.get('/failed-operations');
    return response.data;
  },

  // Get audit event count
  getAuditEventCount: async () => {
    const response = await auditApi.get('/count');
    return response.data;
  },

  // Get audit event count by service
  getAuditEventCountByService: async (service) => {
    const response = await auditApi.get(`/count/service/${service}`);
    return response.data;
  },

  // Create audit event
  createAuditEvent: async (auditEventData) => {
    const response = await auditApi.post('/events', auditEventData);
    return response.data;
  },

  // Log security event
  logSecurityEvent: async (action, entityType, entityId, userId, details) => {
    const response = await auditApi.post('/log/security', {
      action,
      entityType, 
      entityId,
      userId,
      details
    });
    return response.data;
  },

  // Log data access
  logDataAccess: async (entityType, entityId, userId, action) => {
    const response = await auditApi.post('/log/data-access', {
      entityType,
      entityId,
      userId,
      action
    });
    return response.data;
  },

  // Log compliance event
  logComplianceEvent: async (regulation, action, entityType, entityId, userId, details) => {
    const response = await auditApi.post('/log/compliance', {
      regulation,
      action,
      entityType,
      entityId,
      userId,
      details
    });
    return response.data;
  }
};

export default auditService;