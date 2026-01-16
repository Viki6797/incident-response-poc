import axios from 'axios';

const API_BASE_URL = 'https://incident-response-backend-swhf.onrender.com';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Health check
export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    return { status: 'unhealthy', firebase: 'disconnected' };
  }
};

// Incident API
export const incidentApi = {
  // Get all incidents
  getAll: async (limit = 10) => {
    try {
      const response = await api.get(`/api/incidents?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
      return [];
    }
  },

  // Get incident by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/api/incidents/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch incident ${id}:`, error);
      return null;
    }
  },

  // Create new incident
  create: async (incidentData) => {
    try {
      const response = await api.post('/api/incidents', incidentData);
      return response.data;
    } catch (error) {
      console.error('Failed to create incident:', error);
      throw error;
    }
  },

  // Update incident
  update: async (id, updateData) => {
    try {
      const response = await api.put(`/api/incidents/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update incident ${id}:`, error);
      throw error;
    }
  },

  // Get incidents by severity
  getBySeverity: async (severity) => {
    try {
      const response = await api.get(`/api/incidents/severity/${severity}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch ${severity} incidents:`, error);
      return [];
    }
  },

  // Get incidents stats
  getStats: async () => {
    try {
      const incidents = await incidentApi.getAll(100);
      
      const stats = {
        total: incidents.length,
        critical: incidents.filter(i => i.severity === 'critical').length,
        high: incidents.filter(i => i.severity === 'high').length,
        medium: incidents.filter(i => i.severity === 'medium').length,
        low: incidents.filter(i => i.severity === 'low').length,
        active: incidents.filter(i => i.status !== 'resolved').length,
        resolved: incidents.filter(i => i.status === 'resolved').length,
      };
      
      return stats;
    } catch (error) {
      console.error('Failed to get incident stats:', error);
      return {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        active: 0,
        resolved: 0,
      };
    }
  }
};

// Mock data for development/demo
export const mockIncidents = [
  {
    id: '1',
    title: 'Database Connection Timeout',
    description: 'Primary database experiencing intermittent connection timeouts affecting user authentication.',
    severity: 'critical',
    status: 'investigating',
    affected_services: ['auth-service', 'user-profile', 'payment-processing'],
    reported_by: 'system-monitor',
    created_at: '2024-01-13T10:30:00Z',
    updated_at: '2024-01-13T11:15:00Z',
    assigned_to: 'dba-team',
    impact_score: 95,
  },
  {
    id: '2',
    title: 'API Response Latency',
    description: 'Increased response times in order processing API during peak hours.',
    severity: 'high',
    status: 'identified',
    affected_services: ['order-api', 'checkout-service'],
    reported_by: 'performance-monitor',
    created_at: '2024-01-13T09:00:00Z',
    updated_at: '2024-01-13T10:45:00Z',
    assigned_to: 'backend-team',
    impact_score: 75,
  },
  {
    id: '3',
    title: 'Frontend Dashboard Loading Issue',
    description: 'Some users reporting slow loading of analytics dashboard.',
    severity: 'medium',
    status: 'monitoring',
    affected_services: ['frontend-dashboard', 'analytics-service'],
    reported_by: 'user-feedback',
    created_at: '2024-01-12T14:20:00Z',
    updated_at: '2024-01-13T08:30:00Z',
    impact_score: 50,
  },
];

export default api;