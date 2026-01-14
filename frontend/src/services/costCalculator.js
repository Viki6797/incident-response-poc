// Cost Impact Calculator Service
// Calculates business impact of incidents in real dollars

export const calculateIncidentCost = (incident, hourlyRevenue = 10000) => {
  if (!incident || !incident.created_at) return 0;
  
  const created = new Date(incident.created_at);
  const now = new Date();
  const durationHours = (now - created) / (1000 * 60 * 60);
  
  // Base cost based on severity
  const severityMultipliers = {
    critical: 1.5,
    high: 1.2,
    medium: 1.0,
    low: 0.5
  };
  
  const multiplier = severityMultipliers[incident.severity] || 1.0;
  
  // Calculate cost
  const baseCost = durationHours * hourlyRevenue * multiplier;
  
  // Add affected services penalty
  const servicePenalty = incident.affected_services?.length * 500 || 0;
  
  return Math.round(baseCost + servicePenalty);
};

export const calculateTotalImpact = (incidents, hourlyRevenue = 10000) => {
  if (!incidents || incidents.length === 0) return { total: 0, perMinute: 0 };
  
  let totalCost = 0;
  let activeIncidents = 0;
  
  incidents.forEach(incident => {
    if (incident.status !== 'resolved') {
      const cost = calculateIncidentCost(incident, hourlyRevenue);
      totalCost += cost;
      activeIncidents++;
    }
  });
  
  const perMinute = activeIncidents > 0 ? Math.round((totalCost / 60) / activeIncidents) : 0;
  
  return {
    total: Math.round(totalCost),
    perMinute,
    activeIncidents,
    hourlyRevenue
  };
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const getSeverityCostImpact = (incidents) => {
  const impact = {
    critical: { count: 0, cost: 0 },
    high: { count: 0, cost: 0 },
    medium: { count: 0, cost: 0 },
    low: { count: 0, cost: 0 }
  };
  
  incidents?.forEach(incident => {
    if (incident.status !== 'resolved' && impact[incident.severity]) {
      impact[incident.severity].count++;
      impact[incident.severity].cost += calculateIncidentCost(incident);
    }
  });
  
  return impact;
};