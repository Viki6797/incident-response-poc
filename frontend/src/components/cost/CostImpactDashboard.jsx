import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Slider,
  Button,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TimelineIcon from '@mui/icons-material/Timeline';
import SavingsIcon from '@mui/icons-material/Savings';
import CrisisAlertIcon from '@mui/icons-material/CrisisAlert';
import InfoIcon from '@mui/icons-material/Info';
import RefreshIcon from '@mui/icons-material/Refresh';

const CostImpactDashboard = ({ incidents = [] }) => {
  const [hourlyRevenue, setHourlyRevenue] = useState(10000);
  const [impact, setImpact] = useState({ total: 0, perMinute: 0, activeIncidents: 0 });
  const [severityImpact, setSeverityImpact] = useState({
    critical: { count: 0, cost: 0 },
    high: { count: 0, cost: 0 },
    medium: { count: 0, cost: 0 },
    low: { count: 0, cost: 0 }
  });
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Severity multipliers for cost calculation
  const severityMultipliers = {
    critical: 1.5,
    high: 1.2,
    medium: 1.0,
    low: 0.5
  };

  // Helper function to safely format currency
  const formatCurrency = (amount) => {
    // Handle NaN, undefined, or null
    if (isNaN(amount) || amount === null || amount === undefined) {
      return '$0';
    }
    
    // Convert to number if it's a string
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Check if conversion failed
    if (isNaN(numAmount)) {
      return '$0';
    }
    
    // Format as currency
    return `$${numAmount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  // Calculate impact based on incidents
  const calculateTotalImpact = (incidents, hourlyRate) => {
    try {
      // Validate inputs
      if (!Array.isArray(incidents) || !incidents.length) {
        return { total: 0, perMinute: 0, activeIncidents: 0 };
      }

      const hourlyRateNum = parseFloat(hourlyRate);
      if (isNaN(hourlyRateNum) || hourlyRateNum <= 0) {
        return { total: 0, perMinute: 0, activeIncidents: 0 };
      }

      // Filter active incidents
      const activeIncidents = incidents.filter(incident => 
        incident && 
        incident.status && 
        incident.status.toLowerCase() !== 'resolved'
      );

      if (activeIncidents.length === 0) {
        return { total: 0, perMinute: 0, activeIncidents: 0 };
      }

      let totalCost = 0;

      // Calculate cost for each active incident
      activeIncidents.forEach(incident => {
        try {
          // Parse created_at date safely
          const createdAt = incident.created_at ? new Date(incident.created_at) : new Date();
          if (isNaN(createdAt.getTime())) {
            console.warn('Invalid date for incident:', incident.id);
            return;
          }

          const now = new Date();
          const durationInMinutes = Math.max(0, (now - createdAt) / (1000 * 60));
          
          // Get severity multiplier
          const severity = (incident.severity || 'medium').toLowerCase();
          const multiplier = severityMultipliers[severity] || 1.0;
          
          // Calculate cost
          const incidentCost = (durationInMinutes / 60) * hourlyRateNum * multiplier;
          totalCost += incidentCost;
        } catch (err) {
          console.warn('Error calculating cost for incident:', incident.id, err);
        }
      });

      // Calculate per minute cost
      const costPerMinute = hourlyRateNum / 60;

      return {
        total: Math.round(totalCost),
        perMinute: Math.round(costPerMinute),
        activeIncidents: activeIncidents.length
      };
    } catch (error) {
      console.error('Error in calculateTotalImpact:', error);
      return { total: 0, perMinute: 0, activeIncidents: 0 };
    }
  };

  // Calculate cost by severity
  const getSeverityCostImpact = (incidents, hourlyRate = hourlyRevenue) => {
    const result = {
      critical: { count: 0, cost: 0 },
      high: { count: 0, cost: 0 },
      medium: { count: 0, cost: 0 },
      low: { count: 0, cost: 0 }
    };

    if (!Array.isArray(incidents) || incidents.length === 0) {
      return result;
    }

    const activeIncidents = incidents.filter(incident => 
      incident && 
      incident.status && 
      incident.status.toLowerCase() !== 'resolved'
    );

    activeIncidents.forEach(incident => {
      try {
        const severity = (incident.severity || 'medium').toLowerCase();
        
        // Skip if severity not in our list
        if (!result[severity]) {
          console.warn('Unknown severity:', severity, 'in incident:', incident.id);
          return;
        }

        // Count incident
        result[severity].count += 1;

        // Calculate cost
        const createdAt = incident.created_at ? new Date(incident.created_at) : new Date();
        if (isNaN(createdAt.getTime())) {
          return;
        }

        const now = new Date();
        const durationInMinutes = Math.max(0, (now - createdAt) / (1000 * 60));
        const multiplier = severityMultipliers[severity] || 1.0;
        const incidentCost = (durationInMinutes / 60) * hourlyRate * multiplier;
        
        result[severity].cost += Math.round(incidentCost);
      } catch (err) {
        console.warn('Error processing incident for severity impact:', incident.id, err);
      }
    });

    return result;
  };

  useEffect(() => {
    updateCosts();
    // Update costs every minute
    const interval = setInterval(updateCosts, 60000);
    return () => clearInterval(interval);
  }, [incidents, hourlyRevenue]);

  const updateCosts = () => {
    try {
      const newImpact = calculateTotalImpact(incidents, hourlyRevenue);
      const newSeverityImpact = getSeverityCostImpact(incidents, hourlyRevenue);
      
      // Debug logging
      console.log('Calculated Impact:', newImpact);
      console.log('Severity Impact:', newSeverityImpact);
      
      setImpact(newImpact);
      setSeverityImpact(newSeverityImpact);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error updating costs:', error);
      // Set safe defaults
      setImpact({ total: 0, perMinute: 0, activeIncidents: 0 });
      setSeverityImpact({
        critical: { count: 0, cost: 0 },
        high: { count: 0, cost: 0 },
        medium: { count: 0, cost: 0 },
        low: { count: 0, cost: 0 }
      });
    }
  };

  const handleRevenueChange = (event, newValue) => {
    setHourlyRevenue(newValue);
  };

  // FIXED: Updated severity colors for better contrast
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#d32f2f'; // Red
      case 'high': return '#ff9800'; // Orange
      case 'medium': return '#f57c00'; // Darker orange for better contrast (was #ffeb3b)
      case 'low': return '#2196f3'; // Blue
      default: return '#757575'; // Grey
    }
  };

  // FIXED: Function to get text color based on background for proper contrast
  const getSeverityTextColor = (severity) => {
    switch (severity) {
      case 'critical': return '#ffffff'; // White text on red
      case 'high': return '#000000'; // Black text on orange
      case 'medium': return '#000000'; // Black text on darker orange
      case 'low': return '#ffffff'; // White text on blue
      default: return '#ffffff'; // White text on grey
    }
  };

  const formatDuration = (minutes) => {
    if (isNaN(minutes) || minutes < 0) return '0m';
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const calculatePotentialSavings = () => {
    // Assume 30% reduction in resolution time with better processes
    const totalCost = impact.total || 0;
    const potentialReduction = totalCost * 0.3;
    return Math.round(potentialReduction);
  };

  return (
    <Box sx={{ mt: 3, color: 'text.primary' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary' }}>
          <AttachMoneyIcon color="primary" /> Business Impact Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
          <IconButton size="small" onClick={updateCosts}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Revenue Configuration */}
      <Card sx={{ mb: 4, bgcolor: 'background.paper' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <SavingsIcon color="info" />
            <Typography variant="subtitle1" sx={{ fontWeight: 500, color: 'text.primary' }}>
              Configure Business Impact
            </Typography>
            <Tooltip title="Adjust based on your organization's estimated hourly revenue impact during outages">
              <InfoIcon fontSize="small" color="action" />
            </Tooltip>
          </Box>
          
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box>
                <Typography gutterBottom color="text.primary">
                  Estimated hourly revenue impact: {formatCurrency(hourlyRevenue)}
                </Typography>
                <Slider
                  value={hourlyRevenue}
                  onChange={handleRevenueChange}
                  min={1000}
                  max={100000}
                  step={1000}
                  marks={[
                    { value: 1000, label: '$1K' },
                    { value: 25000, label: '$25K' },
                    { value: 50000, label: '$50K' },
                    { value: 100000, label: '$100K' }
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => formatCurrency(value)}
                  sx={{ maxWidth: 600 }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Adjust based on your organization's size and revenue impact during outages.
                Higher values show greater business impact of incidents.
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Main Impact Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', borderLeft: '4px solid #d32f2f', bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Current Incident Cost
              </Typography>
              <Typography variant="h3" component="div" color="error.main">
                {formatCurrency(impact.total)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <CrisisAlertIcon fontSize="small" color="error" />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  {impact.activeIncidents || 0} active incidents
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(100, (impact.total / 100000) * 100)} 
                color="error"
                sx={{ mt: 2, height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', borderLeft: '4px solid #ff9800', bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Cost Per Minute
              </Typography>
              <Typography variant="h3" component="div" color="warning.main">
                {formatCurrency(impact.perMinute)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TimelineIcon fontSize="small" color="warning" />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  Every minute counts
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Based on {formatCurrency(hourlyRevenue)}/hour revenue impact
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', borderLeft: '4px solid #4caf50', bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Potential Savings
              </Typography>
              <Typography variant="h3" component="div" color="success.main">
                {formatCurrency(calculatePotentialSavings())}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon fontSize="small" color="success" />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  With 30% faster resolution
                </Typography>
              </Box>
              <Button 
                variant="outlined" 
                size="small" 
                sx={{ mt: 2 }}
                onClick={() => setHourlyRevenue(5000)}
              >
                See Conservative Estimate
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Severity Breakdown */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary' }}>
              <CrisisAlertIcon /> Cost Breakdown by Severity
            </Typography>
            
            <Grid container spacing={2}>
              {['critical', 'high', 'medium', 'low'].map((severity) => (
                <Grid item xs={12} md={3} key={severity}>
                  <Box sx={{ 
                    p: 2, 
                    borderLeft: `4px solid ${getSeverityColor(severity)}`, 
                    bgcolor: 'background.default'
                  }}>
                    <Typography variant="subtitle2" sx={{ textTransform: 'capitalize', color: getSeverityColor(severity) }}>
                      {severity} Incidents
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 600, my: 1, color: 'text.primary' }}>
                      {formatCurrency(severityImpact[severity].cost)}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        {severityImpact[severity].count} active
                      </Typography>
                      {severityImpact[severity].count > 0 && (
                        <Typography variant="body2" color="text.secondary">
                          ~{formatCurrency(Math.round(severityImpact[severity].cost / severityImpact[severity].count))} each
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Cost Timeline Simulation - FIXED SECTION */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: 'background.paper' }}>
        <Typography variant="h6" gutterBottom color="text.primary">
          Cost Accumulation Simulation
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          This shows how costs accumulate over time for active incidents:
        </Typography>
        
        <Grid container spacing={2}>
          {incidents
            ?.filter(incident => 
              incident && 
              incident.status && 
              incident.status.toLowerCase() !== 'resolved'
            )
            .slice(0, 3)
            .map((incident) => {
              if (!incident) return null;
              
              const created = incident.created_at ? new Date(incident.created_at) : new Date();
              const now = new Date();
              const minutes = isNaN(created.getTime()) ? 0 : Math.round((now - created) / (1000 * 60));
              const severity = (incident.severity || 'medium').toLowerCase();
              const multiplier = severityMultipliers[severity] || 1.0;
              const cost = Math.round((minutes / 60) * hourlyRevenue * multiplier);
              const severityColor = getSeverityColor(severity);
              const textColor = getSeverityTextColor(severity);
              
              return (
                <Grid item xs={12} key={incident.id || Math.random()}>
                  <Box sx={{ 
                    p: 2, 
                    borderLeft: `4px solid ${severityColor}`, 
                    bgcolor: 'background.default',
                    borderRadius: 1
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>
                        {incident.title || 'Untitled Incident'}
                      </Typography>
                      <Chip 
                        label={severity.toUpperCase()} 
                        size="small"
                        sx={{ 
                          bgcolor: severityColor, 
                          color: textColor,
                          fontWeight: 'bold',
                          fontSize: '0.75rem',
                          // Add text shadow for additional contrast on light backgrounds
                          textShadow: severity === 'medium' || severity === 'high' ? '0 1px 1px rgba(255,255,255,0.5)' : 'none'
                        }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Duration: {formatDuration(minutes)} • Cost: {formatCurrency(cost)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        +{formatCurrency(Math.round(hourlyRevenue * multiplier / 60))}/min
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(100, (minutes / 480) * 100)} // 8-hour scale
                      sx={{ 
                        mt: 1, 
                        height: 6, 
                        borderRadius: 3,
                        backgroundColor: `${severityColor}20`,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: severityColor
                        }
                      }}
                    />
                  </Box>
                </Grid>
              );
            })}
        </Grid>
      </Paper>

      {/* ROI Calculator */}
      <Card sx={{ bgcolor: 'background.paper' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary' }}>
            <TrendingUpIcon color="success" /> ROI Calculator
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom color="text.primary">
                  With This Platform
                </Typography>
                <ul style={{ paddingLeft: '20px', color: 'text.secondary' }}>
                  <li><Typography variant="body2" color="text.secondary">30% faster incident resolution</Typography></li>
                  <li><Typography variant="body2" color="text.secondary">50% reduction in communication overhead</Typography></li>
                  <li><Typography variant="body2" color="text.secondary">90% faster stakeholder updates</Typography></li>
                  <li><Typography variant="body2" color="text.secondary">Automated reporting saves 10 hours/week</Typography></li>
                </ul>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom color="success.main">
                  Estimated Annual Savings
                </Typography>
                <Typography variant="h4" color="success.main" sx={{ my: 2 }}>
                  {formatCurrency((impact.total || 0) * 12 * 0.3)}*
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  *Based on current incident costs projected annually with 30% improvement
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Divider sx={{ my: 4 }} />

      {/* Footer Note */}
      <Typography variant="body2" color="text.secondary" align="center">
        💡 <strong>Tip for clients:</strong> Use this dashboard to justify incident response investments.
        Show executives the real business impact of downtime.
      </Typography>
    </Box>
  );
};

export default CostImpactDashboard;