// Service Map Data - Shows dependencies between services

export const serviceNodes = [
  {
    id: 'load-balancer',
    type: 'input',
    position: { x: 250, y: 0 },
    data: { 
      label: 'Load Balancer', 
      status: 'healthy',
      type: 'infrastructure',
      incidents: 0,
      description: 'Routes traffic to backend services'
    }
  },
  {
    id: 'api-gateway',
    position: { x: 250, y: 100 },
    data: { 
      label: 'API Gateway', 
      status: 'healthy',
      type: 'gateway',
      incidents: 0,
      description: 'Main API entry point'
    }
  },
  {
    id: 'auth-service',
    position: { x: 100, y: 200 },
    data: { 
      label: 'Auth Service', 
      status: 'degraded',
      type: 'service',
      incidents: 2,
      description: 'User authentication & authorization'
    }
  },
  {
    id: 'user-service',
    position: { x: 250, y: 200 },
    data: { 
      label: 'User Service', 
      status: 'healthy',
      type: 'service',
      incidents: 0,
      description: 'User profile management'
    }
  },
  {
    id: 'payment-service',
    position: { x: 400, y: 200 },
    data: { 
      label: 'Payment Service', 
      status: 'critical',
      type: 'service',
      incidents: 3,
      description: 'Payment processing'
    }
  },
  {
    id: 'database-primary',
    position: { x: 175, y: 350 },
    data: { 
      label: 'Primary DB', 
      status: 'warning',
      type: 'database',
      incidents: 1,
      description: 'Primary PostgreSQL database'
    }
  },
  {
    id: 'database-replica',
    position: { x: 325, y: 350 },
    data: { 
      label: 'Replica DB', 
      status: 'healthy',
      type: 'database',
      incidents: 0,
      description: 'Read replica for analytics'
    }
  },
  {
    id: 'cache-redis',
    position: { x: 50, y: 350 },
    data: { 
      label: 'Redis Cache', 
      status: 'healthy',
      type: 'cache',
      incidents: 0,
      description: 'Session & data caching'
    }
  },
  {
    id: 'analytics-service',
    position: { x: 450, y: 350 },
    data: { 
      label: 'Analytics', 
      status: 'healthy',
      type: 'analytics',
      incidents: 0,
      description: 'Data analytics pipeline'
    }
  },
  {
    id: 'email-service',
    position: { x: 250, y: 450 },
    data: { 
      label: 'Email Service', 
      status: 'healthy',
      type: 'service',
      incidents: 0,
      description: 'Transactional emails'
    }
  },
  {
    id: 'cdn',
    type: 'output',
    position: { x: 450, y: 500 },
    data: { 
      label: 'CDN', 
      status: 'healthy',
      type: 'infrastructure',
      incidents: 0,
      description: 'Content Delivery Network'
    }
  },
  {
    id: 'monitoring',
    position: { x: 50, y: 500 },
    data: { 
      label: 'Monitoring', 
      status: 'healthy',
      type: 'monitoring',
      incidents: 0,
      description: 'System monitoring & alerts'
    }
  }
];

export const serviceEdges = [
  { id: 'e1-2', source: 'load-balancer', target: 'api-gateway' },
  { id: 'e2-3', source: 'api-gateway', target: 'auth-service' },
  { id: 'e2-4', source: 'api-gateway', target: 'user-service' },
  { id: 'e2-5', source: 'api-gateway', target: 'payment-service' },
  { id: 'e3-6', source: 'auth-service', target: 'database-primary' },
  { id: 'e4-6', source: 'user-service', target: 'database-primary' },
  { id: 'e5-6', source: 'payment-service', target: 'database-primary' },
  { id: 'e6-7', source: 'database-primary', target: 'database-replica' },
  { id: 'e3-8', source: 'auth-service', target: 'cache-redis' },
  { id: 'e7-9', source: 'database-replica', target: 'analytics-service' },
  { id: 'e4-10', source: 'user-service', target: 'email-service' },
  { id: 'e9-11', source: 'analytics-service', target: 'cdn' },
  { id: 'e6-12', source: 'database-primary', target: 'monitoring' },
];

export const getServiceStatus = (incidents) => {
  // Calculate service status based on incidents
  const serviceStatus = {};
  
  // Default all services to healthy
  serviceNodes.forEach(node => {
    serviceStatus[node.id] = 'healthy';
  });
  
  // Update based on incidents
  incidents?.forEach(incident => {
    incident.affected_services?.forEach(serviceName => {
      const serviceId = serviceName.toLowerCase().replace(/\s+/g, '-');
      if (serviceStatus[serviceId] !== undefined) {
        // Upgrade status based on incident severity
        const currentSeverity = getStatusSeverity(serviceStatus[serviceId]);
        const incidentSeverity = getSeverityValue(incident.severity);
        
        if (incidentSeverity > currentSeverity) {
          serviceStatus[serviceId] = getStatusFromSeverity(incident.severity);
        }
      }
    });
  });
  
  return serviceStatus;
};

const getStatusSeverity = (status) => {
  const severities = {
    'critical': 4,
    'degraded': 3,
    'warning': 2,
    'healthy': 1
  };
  return severities[status] || 1;
};

const getSeverityValue = (severity) => {
  const values = {
    'critical': 4,
    'high': 3,
    'medium': 2,
    'low': 1
  };
  return values[severity] || 1;
};

const getStatusFromSeverity = (severity) => {
  const mapping = {
    'critical': 'critical',
    'high': 'degraded',
    'medium': 'warning',
    'low': 'warning'
  };
  return mapping[severity] || 'healthy';
};

export const getAffectedServicesCount = (incidents) => {
  const affected = new Set();
  incidents?.forEach(incident => {
    incident.affected_services?.forEach(service => {
      affected.add(service.toLowerCase().replace(/\s+/g, '-'));
    });
  });
  return affected.size;
};