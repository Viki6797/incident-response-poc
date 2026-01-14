import { db } from './firebaseConfig';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

// Real-time incident listener
export const setupIncidentsListener = (callback) => {
  try {
    const incidentsRef = collection(db, 'incidents');
    const q = query(incidentsRef, orderBy('created_at', 'desc'), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const incidents = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        incidents.push({
          id: doc.id,
          ...data,
          // Handle timestamps - they might already be strings
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString(),
        });
      });
      
      console.log('📡 Real-time update:', incidents.length, 'incidents');
      callback(incidents);
    }, (error) => {
      console.error('Real-time listener error:', error);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Failed to setup real-time listener:', error);
    return () => {}; // Return empty unsubscribe function
  }
};

// Real-time stats listener
export const setupStatsListener = (callback) => {
  return setupIncidentsListener((incidents) => {
    const stats = {
      total: incidents.length,
      critical: incidents.filter(i => i.severity === 'critical').length,
      high: incidents.filter(i => i.severity === 'high').length,
      medium: incidents.filter(i => i.severity === 'medium').length,
      low: incidents.filter(i => i.severity === 'low').length,
      active: incidents.filter(i => i.status !== 'resolved').length,
      resolved: incidents.filter(i => i.status === 'resolved').length,
    };
    
    callback(stats);
  });
};