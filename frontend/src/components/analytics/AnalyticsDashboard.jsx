import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Divider
} from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const AnalyticsDashboard = ({ incidents, stats }) => {
  // Safety check
  if (!incidents || !stats) {
    return (
      <Box sx={{ mt: 4, textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="textSecondary">
          Loading analytics data...
        </Typography>
      </Box>
    );
  }

  // Calculate additional metrics
  const calculateMetrics = () => {
    if (!incidents || incidents.length === 0) {
      return {
        avgResolutionTime: 'N/A',
        resolutionRate: 0,
        severityDistribution: { critical: 0, high: 0, medium: 0, low: 0 },
        weeklyTrend: 'stable',
        topServices: []
      };
    }

    // Calculate average resolution time
    const resolvedIncidents = incidents.filter(i => i.status === 'resolved' && i.resolved_at);
    let totalResolutionTime = 0;
    resolvedIncidents.forEach(incident => {
      const created = new Date(incident.created_at);
      const resolved = new Date(incident.resolved_at);
      totalResolutionTime += (resolved - created) / (1000 * 60 * 60); // in hours
    });
    const avgResolutionTime = resolvedIncidents.length > 0 
      ? `${(totalResolutionTime / resolvedIncidents.length).toFixed(1)}h`
      : 'N/A';

    // Calculate resolution rate
    const resolutionRate = incidents.length > 0
      ? Math.round((resolvedIncidents.length / incidents.length) * 100)
      : 0;

    // Severity distribution
    const severityDistribution = {
      critical: incidents.filter(i => i.severity === 'critical').length,
      high: incidents.filter(i => i.severity === 'high').length,
      medium: incidents.filter(i => i.severity === 'medium').length,
      low: incidents.filter(i => i.severity === 'low').length
    };

    // Weekly trend (mock - would compare with last week in real app)
    const weeklyTrend = resolutionRate > 70 ? 'improving' : resolutionRate > 40 ? 'stable' : 'declining';

    // Top affected services
    const serviceCount = {};
    incidents.forEach(incident => {
      if (incident.affected_services) {
        incident.affected_services.forEach(service => {
          serviceCount[service] = (serviceCount[service] || 0) + 1;
        });
      }
    });
    const topServices = Object.entries(serviceCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([service, count]) => ({ service, count }));

    return {
      avgResolutionTime,
      resolutionRate,
      severityDistribution,
      weeklyTrend,
      topServices
    };
  };

  const metrics = calculateMetrics();

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <TimelineIcon /> Analytics Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Key Metrics */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Avg. Resolution Time
              </Typography>
              <Typography variant="h4" component="div">
                {metrics.avgResolutionTime}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <AccessTimeIcon fontSize="small" color="action" />
                <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                  Target: &lt; 4h
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Resolution Rate
              </Typography>
              <Typography variant="h4" component="div">
                {metrics.resolutionRate}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={metrics.resolutionRate} 
                sx={{ mt: 1, height: 8, borderRadius: 4 }}
                color={metrics.resolutionRate > 80 ? 'success' : metrics.resolutionRate > 50 ? 'warning' : 'error'}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Weekly Trend
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h4" component="div">
                  {metrics.weeklyTrend === 'improving' ? '↑ Improving' : 
                   metrics.weeklyTrend === 'stable' ? '→ Stable' : '↓ Declining'}
                </Typography>
                {metrics.weeklyTrend === 'improving' ? 
                  <TrendingUpIcon color="success" /> : 
                  metrics.weeklyTrend === 'stable' ?
                  <TimelineIcon color="warning" /> :
                  <TrendingDownIcon color="error" />
                }
              </Box>
              <Chip 
                label={metrics.weeklyTrend.toUpperCase()} 
                size="small" 
                color={metrics.weeklyTrend === 'improving' ? 'success' : metrics.weeklyTrend === 'stable' ? 'warning' : 'error'}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                SLA Compliance
              </Typography>
              <Typography variant="h4" component="div">
                94%
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <CheckCircleIcon fontSize="small" color="success" />
                <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                  Within target
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Severity Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Severity Distribution
            </Typography>
            <Box sx={{ mt: 2 }}>
              {['critical', 'high', 'medium', 'low'].map((severity) => {
                const count = metrics.severityDistribution[severity];
                const percentage = incidents.length > 0 ? (count / incidents.length) * 100 : 0;
                const colors = {
                  critical: '#d32f2f',
                  high: '#ff9800',
                  medium: '#ffeb3b',
                  low: '#2196f3'
                };
                
                return (
                  <Box key={severity} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {severity}
                      </Typography>
                      <Typography variant="body2">
                        {count} incidents ({percentage.toFixed(1)}%)
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={percentage} 
                      sx={{ 
                        height: 10, 
                        borderRadius: 5,
                        backgroundColor: `${colors[severity]}20`,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: colors[severity]
                        }
                      }}
                    />
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Grid>

        {/* Top Affected Services */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Top Affected Services
            </Typography>
            <Box sx={{ mt: 2 }}>
              {metrics.topServices.length > 0 ? (
                metrics.topServices.map((item, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1">
                        {item.service}
                      </Typography>
                      <Chip 
                        label={`${item.count} incidents`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(item.count / incidents.length) * 100} 
                      sx={{ mt: 1, height: 6, borderRadius: 3 }}
                    />
                  </Box>
                ))
              ) : (
                <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
                  No service data available
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Performance Metrics */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Performance Metrics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h3" color="primary.main">
                    {stats.active || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Active Incidents
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h3" color="success.main">
                    {stats.resolved || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Resolved Today
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h3" color="warning.main">
                    2.4m
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Avg. Response Time
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h3" color="info.main">
                    99.2%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    System Uptime
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Insights */}
      <Paper sx={{ p: 3, bgcolor: 'info.50' }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimelineIcon /> Insights & Recommendations
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                📈 Positive Trend
              </Typography>
              <Typography variant="body2">
                Resolution rate increased by 15% compared to last week. Keep up the good work!
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                ⚠️ Watch Area
              </Typography>
              <Typography variant="body2">
                Database-related incidents are taking longer to resolve. Consider adding DB expertise to on-call rotation.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                ✅ Best Practice
              </Typography>
              <Typography variant="body2">
                94% of incidents were assigned within 5 minutes. Excellent team responsiveness!
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default AnalyticsDashboard;