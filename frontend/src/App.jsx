import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  Container, Typography, Paper, Box, Button, Alert, Chip,
  CircularProgress, Grid, Card, CardContent, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Select, FormControl,
  InputLabel, AppBar, Toolbar, Avatar, Menu, MenuItem as MuiMenuItem,
  Tabs, Tab
} from '@mui/material'
import WarningIcon from '@mui/icons-material/Warning'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import TimelineIcon from '@mui/icons-material/Timeline'
import ErrorIcon from '@mui/icons-material/Error'
import ApiIcon from '@mui/icons-material/Api'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import CriticalIcon from '@mui/icons-material/Whatshot'
import HighIcon from '@mui/icons-material/Error'
import MediumIcon from '@mui/icons-material/Warning'
import LowIcon from '@mui/icons-material/Info'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import ExitToAppIcon from '@mui/icons-material/ExitToApp'
import DashboardIcon from '@mui/icons-material/Dashboard'
import BarChartIcon from '@mui/icons-material/BarChart'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck'
import LockIcon from '@mui/icons-material/Lock'
import CrisisAlertIcon from '@mui/icons-material/CrisisAlert'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import SpeedIcon from '@mui/icons-material/Speed'
import CostImpactDashboard from './components/cost/CostImpactDashboard'

import { incidentApi, checkHealth, mockIncidents } from './services/api'
import { onAuthChange, signOutUser, getUserRole, hasPermission, getCurrentUser as authGetCurrentUser, UserRoles } from './services/authService'
import Login from './components/Login'
import IncidentDetail from './components/incident/IncidentDetail'
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard'

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function App() {
  const [backendStatus, setBackendStatus] = useState('checking')
  const [backendHealth, setBackendHealth] = useState(null)
  const [incidents, setIncidents] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    active: 0,
    resolved: 0
  })
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newIncident, setNewIncident] = useState({
    title: '',
    description: '',
    severity: 'medium',
    affected_services: [],
    reported_by: ''
  })
  const [user, setUser] = useState(null)
  const [loginOpen, setLoginOpen] = useState(true) // Start with login open
  const [userMenuAnchor, setUserMenuAnchor] = useState(null)
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [tabValue, setTabValue] = useState(0)
  const [authChecking, setAuthChecking] = useState(true) // Add this line

  // Check auth and initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setAuthChecking(true); // Start checking
        
        // Check if user is already logged in
        const currentUser = await authGetCurrentUser();
        
        if (currentUser) {
          setUser(currentUser);
          setNewIncident(prev => ({
            ...prev,
            reported_by: currentUser.email
          }));
          await checkBackendConnection();
          await loadIncidents();
          setLoginOpen(false);
        } else {
          // No user logged in
          setLoading(false);
          setLoginOpen(true);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        setLoading(false);
        setLoginOpen(true);
      } finally {
        setAuthChecking(false); // Done checking
      }
      
      // Setup auth listener for future changes
      const unsubscribe = onAuthChange((currentUser) => {
        if (currentUser) {
          setUser(currentUser);
          setLoginOpen(false);
          setNewIncident(prev => ({
            ...prev,
            reported_by: currentUser.email
          }));
          
          // Load data when user logs in
          if (!backendHealth) {
            checkBackendConnection();
            loadIncidents();
          }
        } else {
          // User logged out
          setUser(null);
          setLoginOpen(true);
          setNewIncident(prev => ({
            ...prev,
            reported_by: ''
          }));
        }
      });
      
      return unsubscribe;
    }

    initializeApp();
  }, [])

  // Setup real-time listener when backend is connected and user is logged in
  useEffect(() => {
    if (backendStatus === 'connected' && user) {
      const setupRealtimeListener = async () => {
        try {
          const { setupIncidentsListener } = await import('./services/realtimeService')
          
          // Clean up previous listener if exists
          if (window.unsubscribeIncidents) {
            window.unsubscribeIncidents();
          }
          
          // Setup new listener
          window.unsubscribeIncidents = setupIncidentsListener((realTimeIncidents) => {
            console.log('🔄 Real-time update received:', realTimeIncidents.length, 'incidents');
            setIncidents(realTimeIncidents);
            calculateStats(realTimeIncidents);
          });
          
          console.log('✅ Real-time listener activated');
        } catch (error) {
          console.error('Failed to load real-time service:', error);
        }
      }

      setupRealtimeListener()
    }

    // Cleanup function
    return () => {
      if (window.unsubscribeIncidents) {
        window.unsubscribeIncidents();
        console.log('🧹 Real-time listener cleaned up');
      }
    }
  }, [backendStatus, user])

  const checkBackendConnection = async () => {
    try {
      setLoading(true)
      const health = await checkHealth()
      setBackendHealth(health)
      setBackendStatus(health.firebase === 'connected' ? 'connected' : 'disconnected')
    } catch (error) {
      console.error('Backend connection failed:', error)
      setBackendStatus('disconnected')
    } finally {
      setLoading(false)
    }
  }

  const loadIncidents = async () => {
    try {
      const data = await incidentApi.getAll()
      setIncidents(data.length > 0 ? data : mockIncidents)
      calculateStats(data.length > 0 ? data : mockIncidents)
    } catch (error) {
      console.error('Failed to load incidents:', error)
      setIncidents(mockIncidents)
      calculateStats(mockIncidents)
    }
  }

  const calculateStats = (incidentList) => {
    const stats = {
      total: incidentList.length,
      critical: incidentList.filter(i => i.severity === 'critical').length,
      high: incidentList.filter(i => i.severity === 'high').length,
      medium: incidentList.filter(i => i.severity === 'medium').length,
      low: incidentList.filter(i => i.severity === 'low').length,
      active: incidentList.filter(i => i.status !== 'resolved').length,
      resolved: incidentList.filter(i => i.status === 'resolved').length,
    }
    setStats(stats)
  }

  const handleCreateIncident = async () => {
    if (!user) {
      setLoginOpen(true)
      return
    }

    const incidentData = {
      ...newIncident,
      reported_by: user.email
    }

    try {
      const created = await incidentApi.create(incidentData)
      setIncidents([created, ...incidents])
      calculateStats([created, ...incidents])
      setCreateDialogOpen(false)
      resetNewIncidentForm()
    } catch (error) {
      console.error('Failed to create incident:', error)
      // Fallback to mock data
      const mockIncident = {
        ...incidentData,
        id: `mock-${Date.now()}`,
        status: 'reported',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        impact_score: getImpactScore(incidentData.severity)
      }
      setIncidents([mockIncident, ...incidents])
      calculateStats([mockIncident, ...incidents])
      setCreateDialogOpen(false)
      resetNewIncidentForm()
    }
  }

  const resetNewIncidentForm = () => {
    setNewIncident({
      title: '',
      description: '',
      severity: 'medium',
      affected_services: [],
      reported_by: user ? user.email : ''
    })
  }

  const getImpactScore = (severity) => {
    const scores = {
      critical: 100,
      high: 75,
      medium: 50,
      low: 25
    }
    return scores[severity] || 0
  }

  const getStatusColor = () => {
    switch (backendStatus) {
      case 'connected': return 'success'
      case 'disconnected': return 'error'
      default: return 'warning'
    }
  }

  const getStatusIcon = () => {
    switch (backendStatus) {
      case 'connected': return <CheckCircleIcon />
      case 'disconnected': return <ErrorIcon />
      default: return <CircularProgress size={20} />
    }
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <CriticalIcon sx={{ color: '#d32f2f' }} />
      case 'high': return <HighIcon sx={{ color: '#ff9800' }} />
      case 'medium': return <MediumIcon sx={{ color: '#ffc107' }} />
      case 'low': return <LowIcon sx={{ color: '#2196f3' }} />
      default: return <WarningIcon />
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#d32f2f'
      case 'high': return '#ff9800'
      case 'medium': return '#ffc107'
      case 'low': return '#2196f3'
      default: return '#757575'
    }
  }

  const getStatusChip = (status) => {
    const colors = {
      reported: 'warning',
      investigating: 'info',
      identified: 'secondary',
      monitoring: 'primary',
      resolved: 'success'
    }
    return <Chip label={status.toUpperCase()} color={colors[status] || 'default'} size="small" />
  }

  const handleLoginSuccess = (userData) => {
    setUser(userData)
    setLoginOpen(false)
    setNewIncident(prev => ({
      ...prev,
      reported_by: userData.email
    }))
    // Load data after login
    checkBackendConnection()
    loadIncidents()
  }

  const handleLogout = async () => {
    await signOutUser()
    setUser(null)
    setUserMenuAnchor(null)
    resetNewIncidentForm()
    setLoginOpen(true)
  }

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget)
  }

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null)
  }

  const getUserInitials = () => {
    if (!user || !user.displayName) return '?'
    return user.displayName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const handleTabChange = (event, newValue) => {
    console.log('Tab changing from', tabValue, 'to', newValue)
    setTabValue(newValue)
  }

  const formatDate = (dateString) => {
  try {
    // Handle null, undefined, or empty values
    if (!dateString) {
      return {
        date: 'N/A',
        time: 'N/A'
      };
    }
    
    let date;
    
    // Check if it's a Firestore timestamp object (common with Firebase)
    if (dateString.toDate && typeof dateString.toDate === 'function') {
      date = dateString.toDate();
    }
    // Check if it's already a Date object
    else if (dateString instanceof Date) {
      date = dateString;
    }
    // Check if it's a number (timestamp)
    else if (typeof dateString === 'number') {
      date = new Date(dateString);
    }
    // Handle string date
    else {
      // Try to parse the date string
      const parsedDate = new Date(dateString);
      
      // If parsing failed, check for common Firebase/ISO formats
      if (isNaN(parsedDate.getTime())) {
        // Try removing timezone quirks
        const cleanString = dateString
          .replace(' GMT', '')
          .replace(' UTC', '')
          .replace('Z', '')
          .trim();
        
        date = new Date(cleanString);
        
        // If still invalid, try parsing as timestamp
        if (isNaN(date.getTime())) {
          const timestamp = Date.parse(dateString);
          if (!isNaN(timestamp)) {
            date = new Date(timestamp);
          } else {
            // Last resort: use current date
            console.warn('Invalid date format, using current date:', dateString);
            date = new Date();
          }
        }
      } else {
        date = parsedDate;
      }
    }
    
    // Check if we have a valid date
    if (isNaN(date.getTime())) {
      return {
        date: 'N/A',
        time: 'N/A'
      };
    }
    
    // Format the date
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return {
      date: 'N/A',
      time: 'N/A'
    };
  }
};

  const handleCreateClick = () => {
    if (!user) {
      setLoginOpen(true)
    } else {
      setCreateDialogOpen(true)
    }
  }

  // Protected content component - shows login prompt when no user
  const ProtectedContent = ({ children }) => {
    if (authChecking) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          p: 4 
        }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h6" color="text.secondary">
            Checking authentication...
          </Typography>
        </Box>
      );
    }
    
    if (!user) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          p: 4 
        }}>
          <LockIcon sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
          <Typography variant="h5" gutterBottom>
            🔐 Authentication Required
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500 }}>
            This incident management system contains sensitive data. 
            Please login to access the dashboard, incidents, analytics, and system status.
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            startIcon={<AccountCircleIcon />}
            onClick={() => setLoginOpen(true)}
            sx={{ mb: 2 }}
          >
            Login to Continue
          </Button>
          <Typography variant="body2" color="text.secondary">
            Demo accounts available. Contact security@company.com for access.
          </Typography>
        </Box>
      );
    }
    
    return children;
  };

  return (
    <>
      {/* App Bar - Always visible */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
            <WarningIcon color="primary" />
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              Incident Response
            </Typography>
          </Box>
          
          {user ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label={getUserRole(user).toUpperCase()}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <IconButton onClick={handleUserMenuOpen} sx={{ p: 0 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {getUserInitials()}
                  </Avatar>
                </IconButton>
              </Box>
              
              <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
              >
                <MuiMenuItem disabled>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {user.displayName || user.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.email}
                    </Typography>
                  </Box>
                </MuiMenuItem>
                <MuiMenuItem onClick={handleUserMenuClose}>
                  <AccountCircleIcon sx={{ mr: 1 }} fontSize="small" />
                  Profile
                </MuiMenuItem>
                <MuiMenuItem onClick={handleLogout}>
                  <ExitToAppIcon sx={{ mr: 1 }} fontSize="small" />
                  Logout
                </MuiMenuItem>
              </Menu>
            </>
          ) : (
            <Button 
              variant="outlined" 
              startIcon={<AccountCircleIcon />}
              onClick={() => setLoginOpen(true)}
            >
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 2 }}>
        {/* Header - Always visible */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" sx={{ 
            color: 'primary.main', 
            mb: 1
          }}>
            Incident Response Platform
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {user ? `Welcome, ${user.displayName || user.email}` : 'Real-time incident management system'}
          </Typography>
        </Box>

        {/* Tabs - Always visible */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} centered>
            <Tab label="Dashboard" icon={<DashboardIcon />} iconPosition="start" />
            <Tab label="Analytics" icon={<BarChartIcon />} iconPosition="start" />
            <Tab label="Cost Impact" icon={<AttachMoneyIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Main Content - Protected */}
        <ProtectedContent>
          {/* Connection Status Card - Only visible when logged in */}
          <Card sx={{ mb: 4, bgcolor: 'background.paper' }}>
            <CardContent>
              <Grid container alignItems="center" spacing={2}>
                <Grid size={{ xs: 12, md: 'auto' }}>
                  <ApiIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                </Grid>
                <Grid size={{ xs: 12, md: true }}>
                  <Typography variant="h6">System Status</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    {getStatusIcon()}
                    <Typography>
                      {backendStatus === 'connected' ? 'All systems operational' : 
                       backendStatus === 'disconnected' ? 'Connection issues detected' : 
                       'Checking system status...'}
                    </Typography>
                    <Chip 
                      label={backendStatus.toUpperCase()} 
                      color={getStatusColor()}
                      size="small"
                    />
                  </Box>
                  {backendHealth && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Backend: {backendHealth.status} | Firebase: {backendHealth.firebase} | 
                      User: {user ? 'Authenticated' : 'Guest'} | Incidents: {stats.total}
                    </Typography>
                  )}
                </Grid>
                <Grid size={{ xs: 12, md: 'auto' }}>
                  <Button 
                    variant="outlined" 
                    onClick={checkBackendConnection}
                    disabled={loading}
                    startIcon={<RefreshIcon />}
                  >
                    {loading ? 'Checking...' : 'Refresh'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </ProtectedContent>

        {/* Tab Content - All tabs protected */}
        <TabPanel value={tabValue} index={0}>
          <ProtectedContent>
            {/* Stats Cards - FIXED TO MATCH THEME */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 6, md: 3 }}>
                <Card sx={{ 
                  height: '100%', 
                  bgcolor: 'background.paper',
                  borderLeft: '4px solid #1976d2',
                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.1)'
                }}>
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="subtitle2" gutterBottom color="text.secondary">
                      Total Incidents
                    </Typography>
                    <Typography variant="h3" sx={{ color: 'primary.main', fontWeight: 600, mb: 1 }}>
                      {stats.total}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <SpeedIcon fontSize="small" color="primary" />
                      <Typography variant="caption" color="text.secondary">
                        All systems
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{ xs: 6, md: 3 }}>
                <Card sx={{ 
                  height: '100%', 
                  bgcolor: 'background.paper',
                  borderLeft: '4px solid #d32f2f',
                  boxShadow: '0 2px 8px rgba(211, 47, 47, 0.1)'
                }}>
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="subtitle2" gutterBottom color="error.main">
                      Critical
                    </Typography>
                    <Typography variant="h3" sx={{ color: 'error.main', fontWeight: 600, mb: 1 }}>
                      {stats.critical}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <CrisisAlertIcon fontSize="small" color="error" />
                      <Typography variant="caption" color="text.secondary">
                        High priority
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 6, md: 3 }}>
                <Card sx={{ 
                  height: '100%', 
                  bgcolor: 'background.paper',
                  borderLeft: '4px solid #ff9800',
                  boxShadow: '0 2px 8px rgba(255, 152, 0, 0.1)'
                }}>
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="subtitle2" gutterBottom color="warning.main">
                      Active
                    </Typography>
                    <Typography variant="h3" sx={{ color: 'warning.main', fontWeight: 600, mb: 1 }}>
                      {stats.active}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <FiberManualRecordIcon fontSize="small" color="warning" />
                      <Typography variant="caption" color="text.secondary">
                        In progress
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 6, md: 3 }}>
                <Card sx={{ 
                  height: '100%', 
                  bgcolor: 'background.paper',
                  borderLeft: '4px solid #4caf50',
                  boxShadow: '0 2px 8px rgba(76, 175, 80, 0.1)'
                }}>
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="subtitle2" gutterBottom color="success.main">
                      Resolved
                    </Typography>
                    <Typography variant="h3" sx={{ color: 'success.main', fontWeight: 600, mb: 1 }}>
                      {stats.resolved}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <CheckCircleIcon fontSize="small" color="success" />
                      <Typography variant="caption" color="text.secondary">
                        Completed
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Incident Table */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5">
                    Recent Incidents
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      variant="outlined" 
                      startIcon={<RefreshIcon />}
                      onClick={loadIncidents}
                    >
                      Refresh
                    </Button>
                    <Button 
                      variant="contained" 
                      startIcon={<AddIcon />}
                      onClick={handleCreateClick}
                      disabled={user && !hasPermission(user, UserRoles.RESPONDER)}
                    >
                      Create Incident
                    </Button>
                  </Box>
                </Box>

                {!user && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Please login to create incidents. Demo accounts available.
                  </Alert>
                )}

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Severity</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Services</TableCell>
                        <TableCell>Reported</TableCell>
                        <TableCell>Impact</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {incidents.map((incident) => {
                        const formattedDate = formatDate(incident.created_at)
                        return (
                          <TableRow 
                            key={incident.id}
                            onClick={() => setSelectedIncident(incident)}
                            sx={{ 
                              '&:hover': { backgroundColor: 'action.hover', cursor: 'pointer' },
                              borderLeft: `4px solid ${getSeverityColor(incident.severity)}`
                            }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getSeverityIcon(incident.severity)}
                                <Typography sx={{ textTransform: 'capitalize', fontWeight: 'bold' }}>
                                  {incident.severity}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {incident.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {incident.description.substring(0, 60)}...
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {getStatusChip(incident.status)}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {incident.affected_services?.map((service, idx) => (
                                  <Chip 
                                    key={idx}
                                    label={service}
                                    size="small"
                                    variant="outlined"
                                  />
                                ))}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {formattedDate.date}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formattedDate.time}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box sx={{ width: '100%', mr: 1 }}>
                                  <Box 
                                    sx={{ 
                                      height: 8,
                                      borderRadius: 4,
                                      backgroundColor: getSeverityColor(incident.severity),
                                      width: `${incident.impact_score || getImpactScore(incident.severity)}%`
                                    }}
                                  />
                                </Box>
                                <Typography variant="body2">
                                  {incident.impact_score || getImpactScore(incident.severity)}%
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* Footer */}
            <Box sx={{ mt: 6, textAlign: 'center', color: 'text.secondary' }}>
              <Typography variant="body2">
                Built with React + Material UI + FastAPI + Firebase
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                System: {backendStatus} | User: {user ? 'Authenticated' : 'Guest'} | 
                Incidents: {stats.total} total, {stats.active} active | 
                Last updated: {new Date().toLocaleTimeString()}
              </Typography>
            </Box>
          </ProtectedContent>
        </TabPanel>

        {/* Tab Content - Analytics */}
        <TabPanel value={tabValue} index={1}>
          <ProtectedContent>
            <AnalyticsDashboard incidents={incidents} stats={stats} />
            
            {/* Footer for Analytics Tab */}
            <Box sx={{ mt: 6, textAlign: 'center', color: 'text.secondary' }}>
              <Typography variant="body2">
                Built with React + Material UI + FastAPI + Firebase
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                System: {backendStatus} | User: {user ? 'Authenticated' : 'Guest'} | 
                Incidents: {stats.total} total, {stats.active} active | 
                Last updated: {new Date().toLocaleTimeString()}
              </Typography>
            </Box>
          </ProtectedContent>
        </TabPanel>

        {/* Tab Content - Cost Impact */}
        <TabPanel value={tabValue} index={2}>
          <ProtectedContent>
            <CostImpactDashboard incidents={incidents} />
            
            {/* Footer for Cost Impact Tab */}
            <Box sx={{ mt: 6, textAlign: 'center', color: 'text.secondary' }}>
              <Typography variant="body2">
                Built with React + Material UI + FastAPI + Firebase
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                System: {backendStatus} | User: {user ? 'Authenticated' : 'Guest'} | 
                Incidents: {stats.total} total, {stats.active} active | 
                Last updated: {new Date().toLocaleTimeString()}
              </Typography>
            </Box>
          </ProtectedContent>
        </TabPanel>
      </Container>

      {/* Create Incident Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Incident</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Incident Title"
              fullWidth
              value={newIncident.title}
              onChange={(e) => setNewIncident({...newIncident, title: e.target.value})}
              placeholder="e.g., Database Connection Timeout"
              required
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={newIncident.description}
              onChange={(e) => setNewIncident({...newIncident, description: e.target.value})}
              placeholder="Describe the incident in detail..."
              required
            />
            <FormControl fullWidth>
              <InputLabel>Severity</InputLabel>
              <Select
                value={newIncident.severity}
                label="Severity"
                onChange={(e) => setNewIncident({...newIncident, severity: e.target.value})}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Affected Services (comma-separated)"
              fullWidth
              value={newIncident.affected_services.join(', ')}
              onChange={(e) => setNewIncident({
                ...newIncident, 
                affected_services: e.target.value.split(',').map(s => s.trim()).filter(s => s)
              })}
              placeholder="e.g., auth-service, database, api-gateway"
            />
            {user && (
              <Typography variant="caption" color="text.secondary">
                Reported by: {user.email}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateIncident}
            disabled={!newIncident.title || !newIncident.description}
          >
            Create Incident
          </Button>
        </DialogActions>
      </Dialog>

      {/* Incident Detail Dialog */}
      <IncidentDetail
        incident={selectedIncident}
        open={!!selectedIncident}
        onClose={() => setSelectedIncident(null)}
        currentUser={user}
      />

      {/* Login Dialog - FIXED: Always provide onClose function */}
      <Login 
        open={loginOpen}
        onClose={() => {
          if (user) {
            setLoginOpen(false);
          }
          // If no user, don't close (dialog stays open)
        }}
        onLoginSuccess={handleLoginSuccess}
        canClose={!!user}
      />
    </>
  )
}

export default App