import { auth } from './firebaseConfig';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';

// User roles
export const UserRoles = {
  ADMIN: 'admin',
  RESPONDER: 'responder',
  VIEWER: 'viewer'
};

// Default demo users (for development)
export const demoUsers = [
  {
    email: 'admin@incident.com',
    password: 'admin123',
    name: 'System Admin',
    role: UserRoles.ADMIN
  },
  {
    email: 'engineer@incident.com', 
    password: 'engineer123',
    name: 'Senior Engineer',
    role: UserRoles.RESPONDER
  },
  {
    email: 'viewer@incident.com',
    password: 'viewer123',
    name: 'Operations Viewer',
    role: UserRoles.VIEWER
  }
];

// Sign up new user
export const signUp = async (email, password, name) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Sign up error:', error);
    return { success: false, error: error.message };
  }
};

// Sign in existing user
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: error.message };
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return { success: false, error: error.message };
  }
};

// Get current user
// Add this to authService.js:
export const getCurrentUser = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

// Listen to auth state changes
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Get user role (simplified - in production this would come from Firestore)
export const getUserRole = (user) => {
  if (!user) return UserRoles.VIEWER;
  
  // Check email for role (demo only)
  const email = user.email;
  if (email.includes('admin')) return UserRoles.ADMIN;
  if (email.includes('engineer')) return UserRoles.RESPONDER;
  return UserRoles.VIEWER;
};

// Check if user has permission
export const hasPermission = (user, requiredRole) => {
  const userRole = getUserRole(user);
  const roleHierarchy = {
    [UserRoles.VIEWER]: 0,
    [UserRoles.RESPONDER]: 1,
    [UserRoles.ADMIN]: 2
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};