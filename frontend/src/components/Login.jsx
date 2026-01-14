import React, { useState, useEffect } from 'react'; // Added useEffect import
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Typography,
  Divider
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { signIn, signUp, demoUsers } from '../services/authService';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

function Login({ open, onClose, onLoginSuccess, canClose = true }) {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  // Signup form state
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });

  // Add this useEffect to reset loading state when dialog opens
  useEffect(() => {
    if (open) {
      setLoading(false);
      setError('');
    }
  }, [open]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError('');
  };

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    setError('');
    
    const result = await signIn(loginData.email, loginData.password);
    
    if (result.success) {
      onLoginSuccess(result.user);
      onClose();
    } else {
      setError(result.error || 'Login failed');
    }
    
    setLoading(false);
  };

  const handleSignup = async () => {
    if (!signupData.email || !signupData.password || !signupData.name) {
      setError('Please fill all fields');
      return;
    }
    
    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (signupData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    
    const result = await signUp(signupData.email, signupData.password, signupData.name);
    
    if (result.success) {
      onLoginSuccess(result.user);
      onClose();
    } else {
      setError(result.error || 'Signup failed');
    }
    
    setLoading(false);
  };

  const handleDemoLogin = async (user) => {
    setLoading(true);
    setError('');
    
    const result = await signIn(user.email, user.password);
    
    if (result.success) {
      onLoginSuccess(result.user);
      onClose();
    } else {
      setError('Demo login failed. Try signing up first.');
    }
    
    setLoading(false);
  };

  return (
    <Dialog 
      open={open} 
      onClose={canClose ? onClose : undefined}
      maxWidth="xs" 
      fullWidth
      disableEscapeKeyDown={!canClose}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <LockIcon color="primary" />
          <Typography variant="h6">Incident Response Platform</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Authentication Required
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} centered>
            <Tab label="Login" icon={<LockIcon />} iconPosition="start" />
            <Tab label="Sign Up" icon={<PersonAddIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        <TabPanel value={tabValue} index={0}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={loginData.email}
            onChange={(e) => setLoginData({...loginData, email: e.target.value})}
            margin="normal"
            disabled={loading}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={loginData.password}
            onChange={(e) => setLoginData({...loginData, password: e.target.value})}
            margin="normal"
            disabled={loading}
          />
          
          <Button
            fullWidth
            variant="contained"
            onClick={handleLogin}
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Login'}
          </Button>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TextField
            fullWidth
            label="Full Name"
            value={signupData.name}
            onChange={(e) => setSignupData({...signupData, name: e.target.value})}
            margin="normal"
            disabled={loading}
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={signupData.email}
            onChange={(e) => setSignupData({...signupData, email: e.target.value})}
            margin="normal"
            disabled={loading}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={signupData.password}
            onChange={(e) => setSignupData({...signupData, password: e.target.value})}
            margin="normal"
            disabled={loading}
          />
          <TextField
            fullWidth
            label="Confirm Password"
            type="password"
            value={signupData.confirmPassword}
            onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
            margin="normal"
            disabled={loading}
          />
          
          <Button
            fullWidth
            variant="contained"
            onClick={handleSignup}
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign Up'}
          </Button>
        </TabPanel>

        <Divider sx={{ my: 2 }}>or</Divider>

        <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
          Try demo accounts:
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {demoUsers.map((user, index) => (
            <Button
              key={index}
              variant="outlined"
              size="small"
              onClick={() => handleDemoLogin(user)}
              disabled={loading}
              sx={{ justifyContent: 'flex-start' }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Typography variant="body2">{user.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {user.email} • {user.role}
                </Typography>
              </Box>
            </Button>
          ))}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Secure authentication powered by Firebase
        </Typography>
      </DialogActions>
    </Dialog>
  );
}

export default Login;