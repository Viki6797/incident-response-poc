import { db } from './firebaseConfig';
import { collection, doc, setDoc, getDoc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';

// Team members data
export const teamMembers = [
  {
    id: 'admin',
    email: 'admin@incident.com',
    name: 'System Admin',
    role: 'admin',
    avatarColor: '#1a237e',
    skills: ['Incident Management', 'System Architecture', 'Security'],
    status: 'available'
  },
  {
    id: 'engineer',
    email: 'engineer@incident.com',
    name: 'Senior Engineer',
    role: 'engineer',
    avatarColor: '#d32f2f',
    skills: ['Backend', 'Database', 'API'],
    status: 'available'
  },
  {
    id: 'viewer',
    email: 'viewer@incident.com',
    name: 'Operations Viewer',
    role: 'viewer',
    avatarColor: '#388e3c',
    skills: ['Monitoring', 'Reporting', 'Documentation'],
    status: 'available'
  },
  {
    id: 'dba',
    email: 'dba@incident.com',
    name: 'Database Admin',
    role: 'engineer',
    avatarColor: '#f57c00',
    skills: ['Database', 'Performance', 'Backup'],
    status: 'available'
  },
  {
    id: 'devops',
    email: 'devops@incident.com',
    name: 'DevOps Engineer',
    role: 'engineer',
    avatarColor: '#7b1fa2',
    skills: ['Infrastructure', 'CI/CD', 'Monitoring'],
    status: 'busy'
  },
  {
    id: 'support',
    email: 'support@incident.com',
    name: 'Support Lead',
    role: 'viewer',
    avatarColor: '#0288d1',
    skills: ['Customer Support', 'Communication', 'Documentation'],
    status: 'available'
  }
];

// Get all team members
export const getTeamMembers = () => {
  return teamMembers;
};

// Get team member by email
export const getTeamMemberByEmail = (email) => {
  return teamMembers.find(member => member.email === email) || null;
};

// Assign incident to team member
export const assignIncident = async (incidentId, teamMemberId) => {
  try {
    const incidentRef = doc(db, 'incidents', incidentId);
    await updateDoc(incidentRef, {
      assigned_to: teamMemberId,
      updated_at: new Date().toISOString()
    });
    
    // Add to timeline
    const timelineRef = doc(collection(db, `incidents/${incidentId}/timeline`));
    await setDoc(timelineRef, {
      id: timelineRef.id,
      timestamp: new Date().toISOString(),
      event_type: 'assignment',
      title: 'Incident Assigned',
      description: `Assigned to ${teamMemberId}`,
      user_id: 'system',
      metadata: { teamMemberId }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to assign incident:', error);
    return { success: false, error: error.message };
  }
};

// Update incident status
export const updateIncidentStatus = async (incidentId, status, notes = '') => {
  try {
    const incidentRef = doc(db, 'incidents', incidentId);
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };
    
    if (notes) {
      updateData.resolution_notes = notes;
    }
    
    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }
    
    await updateDoc(incidentRef, updateData);
    
    // Add to timeline
    const timelineRef = doc(collection(db, `incidents/${incidentId}/timeline`));
    await setDoc(timelineRef, {
      id: timelineRef.id,
      timestamp: new Date().toISOString(),
      event_type: 'status_change',
      title: `Status Updated to ${status}`,
      description: notes || `Status changed to ${status}`,
      user_id: 'system',
      metadata: { status, notes }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to update incident status:', error);
    return { success: false, error: error.message };
  }
};

// Add note to incident
export const addIncidentNote = async (incidentId, note, userId) => {
  try {
    const timelineRef = doc(collection(db, `incidents/${incidentId}/timeline`));
    await setDoc(timelineRef, {
      id: timelineRef.id,
      timestamp: new Date().toISOString(),
      event_type: 'note',
      title: 'Note Added',
      description: note,
      user_id: userId,
      metadata: { note }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to add note:', error);
    return { success: false, error: error.message };
  }
};

// Get incident timeline
export const getIncidentTimeline = async (incidentId) => {
  try {
    // In a real app, this would query Firestore
    // For now, return mock timeline
    return [
      {
        id: '1',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        event_type: 'created',
        title: 'Incident Created',
        description: 'Incident reported by system',
        user_id: 'system'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        event_type: 'status_change',
        title: 'Status Updated',
        description: 'Status changed to investigating',
        user_id: 'admin'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        event_type: 'note',
        title: 'Investigation Note',
        description: 'Checking database connection logs',
        user_id: 'engineer'
      }
    ];
  } catch (error) {
    console.error('Failed to get timeline:', error);
    return [];
  }
};

// Real-time team status listener
export const setupTeamStatusListener = (callback) => {
  try {
    // In a real app, this would listen to Firestore
    // For now, simulate real-time updates
    const interval = setInterval(() => {
      callback(teamMembers);
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  } catch (error) {
    console.error('Failed to setup team listener:', error);
    return () => {};
  }
};