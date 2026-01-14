import { auth } from './src/services/firebaseConfig';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

const demoUsers = [
  {
    email: 'admin@incident.com',
    password: 'admin123',
    name: 'System Admin'
  },
  {
    email: 'engineer@incident.com', 
    password: 'engineer123',
    name: 'Senior Engineer'
  },
  {
    email: 'viewer@incident.com',
    password: 'viewer123',
    name: 'Operations Viewer'
  }
];

async function createUsers() {
  console.log('Creating demo users...');
  
  for (const user of demoUsers) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
      await updateProfile(userCredential.user, { displayName: user.name });
      console.log(`✅ Created: ${user.name} (${user.email})`);
    } catch (error) {
      console.log(`⚠️ ${user.email}: ${error.message}`);
    }
  }
  
  console.log('Done!');
}

createUsers();