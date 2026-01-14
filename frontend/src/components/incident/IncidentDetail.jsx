import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Chip,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Paper,
  LinearProgress,
  IconButton,
  Tooltip,
  Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AssignmentIcon from '@mui/icons-material/Assignment';
import UpdateIcon from '@mui/icons-material/Update';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import TimelineIcon from '@mui/icons-material/Timeline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';

import { getTeamMembers, assignIncident, updateIncidentStatus, addIncidentNote, getIncidentTimeline } from '../../services/teamService';

const IncidentDetail = ({ incident, open, onClose, currentUser }) => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState(incident?.assigned_to || '');
  const [selectedStatus, setSelectedStatus] = useState(incident?.status || 'reported');
  const [note, setNote] = useState('');
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (incident) {
      loadTeamMembers();
      loadTimeline();
      setSelectedAssignee(incident.assigned_to || '');
      setSelectedStatus(incident.status || 'reported');
    }
  }, [incident]);

  const loadTeamMembers = () => {
    const members = getTeamMembers();
    setTeamMembers(members);
  };

  const loadTimeline = async () => {
    if (incident?.id) {
      const timelineData = await getIncidentTimeline(incident.id);
      
      // Add incident creation as first event if not already there
      const creationEvent = {
        id: 'creation',
        timestamp: incident.created_at,
        event_type: 'created',
        title: 'Incident Created',
        description: `Incident reported by ${incident.reported_by}`,
        user_id: incident.reported_by
      };
      
      setTimeline([creationEvent, ...timelineData]);
    }
  };

  const handleAssign = async () => {
    if (!selectedAssignee || !incident?.id) return;
    
    setLoading(true);
    const result = await assignIncident(incident.id, selectedAssignee);
    setLoading(false);
    
    if (result.success) {
      onClose();
    }
  };

  const handleStatusUpdate = async () => {
    if (!incident?.id) return;
    
    setLoading(true);
    const result = await updateIncidentStatus(incident.id, selectedStatus, note);
    setLoading(false);
    
    if (result.success) {
      onClose();
    }
  };

  const handleAddNote = async () => {
    if (!note.trim() || !incident?.id || !currentUser) return;
    
    setLoading(true);
    
    // Create new timeline entry immediately (optimistic update)
    const newNote = {
      id: `temp-${Date.now()}`,
      timestamp: new Date().toISOString(),
      event_type: 'note',
      title: 'Note Added',
      description: note,
      user_id: currentUser.email
    };
    
    // Add to timeline immediately
    setTimeline([newNote, ...timeline]);
    
    // Clear input
    setNote('');
    
    // Try to save to backend
    const result = await addIncidentNote(incident.id, note, currentUser.email);
    
    if (result.success) {
      // Replace temp ID with real ID
      setTimeline(prev => prev.map(item => 
        item.id === newNote.id ? { ...item, id: `note-${Date.now()}` } : item
      ));
    } else {
      // Remove if failed
      setTimeline(prev => prev.filter(item => item.id !== newNote.id));
      alert('Failed to save note');
    }
    
    setLoading(false);
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <ErrorIcon sx={{ color: '#d32f2f' }} />;
      case 'high': return <WarningIcon sx={{ color: '#ff9800' }} />;
      case 'medium': return <WarningIcon sx={{ color: '#ffeb3b' }} />;
      case 'low': return <InfoIcon sx={{ color: '#2196f3' }} />;
      default: return <InfoIcon />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#d32f2f';
      case 'high': return '#ff9800';
      case 'medium': return '#ffeb3b';
      case 'low': return '#2196f3';
      default: return '#757575';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'success';
      case 'investigating': return 'info';
      case 'identified': return 'warning';
      case 'monitoring': return 'primary';
      default: return 'default';
    }
  };

  if (!incident) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getSeverityIcon(incident.severity)}
            <Typography variant="h6">{incident.title}</Typography>
            <Chip 
              label={incident.severity.toUpperCase()} 
              size="small"
              sx={{ 
                backgroundColor: getSeverityColor(incident.severity),
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Left Column - Incident Details */}
          <Grid item xs={12} md={8}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Description
              </Typography>
              <Typography variant="body1" paragraph>
                {incident.description}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Affected Services
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {incident.affected_services.map((service, index) => (
                  <Chip key={index} label={service} variant="outlined" />
                ))}
              </Box>
            </Box>

            {/* Timeline */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimelineIcon /> Timeline
              </Typography>
              <List dense>
                {timeline.map((event) => (
                  <ListItem key={event.id} alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                        {event.user_id?.charAt(0).toUpperCase() || 'U'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {event.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(event.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                      secondary={event.description}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>

            {/* Add Note */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                <NoteAddIcon /> Add Note
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add investigation notes, updates, or observations..."
                disabled={loading}
              />
              <Button
                variant="outlined"
                startIcon={<NoteAddIcon />}
                onClick={handleAddNote}
                disabled={!note.trim() || loading}
                sx={{ mt: 1 }}
              >
                Add Note
              </Button>
            </Box>
          </Grid>

          {/* Right Column - Actions & Team */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssignmentIcon /> Assign To
              </Typography>
              
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Team Member</InputLabel>
                <Select
                  value={selectedAssignee}
                  label="Team Member"
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {teamMembers.map((member) => (
                    <MenuItem key={member.id} value={member.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ 
                          bgcolor: member.avatarColor, 
                          width: 24, 
                          height: 24,
                          fontSize: '0.8rem'
                        }}>
                          {member.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">{member.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {member.role} • {member.status}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Button
                fullWidth
                variant="contained"
                startIcon={<AssignmentIcon />}
                onClick={handleAssign}
                disabled={!selectedAssignee || loading}
              >
                Assign Incident
              </Button>
            </Paper>

            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                <UpdateIcon /> Update Status
              </Typography>
              
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedStatus}
                  label="Status"
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <MenuItem value="reported">Reported</MenuItem>
                  <MenuItem value="investigating">Investigating</MenuItem>
                  <MenuItem value="identified">Identified</MenuItem>
                  <MenuItem value="monitoring">Monitoring</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                </Select>
              </FormControl>
              
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<CheckCircleIcon />}
                onClick={handleStatusUpdate}
                disabled={loading}
              >
                Update Status
              </Button>
            </Paper>

            {/* Incident Info */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Incident Information
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Current Status
                </Typography>
                <Chip 
                  label={incident.status.toUpperCase()} 
                  color={getStatusColor(incident.status)}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Impact Score
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={incident.impact_score} 
                      sx={{ 
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: `${getSeverityColor(incident.severity)}20`
                      }}
                    />
                  </Box>
                  <Typography variant="body2">{incident.impact_score}%</Typography>
                </Box>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Reported By
                </Typography>
                <Typography variant="body2">{incident.reported_by}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body2">
                  {new Date(incident.created_at).toLocaleString()}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body2">
                  {new Date(incident.updated_at).toLocaleString()}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default IncidentDetail;