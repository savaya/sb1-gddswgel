import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Hotel, LogOut, LayoutDashboard, Settings, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="sticky">
      <Container maxWidth="xl">
        <Toolbar sx={{ py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: 'primary.main',
                textDecoration: 'none',
                '&:hover': {
                  opacity: 0.85,
                },
              }}
              component={RouterLink}
              to="/"
            >
              <Hotel size={28} style={{ color: '#B8860B' }} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #DAA520 0%, #B8860B 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '0.5px',
                }}
              >
                Hotel Review System
              </Typography>
            </Box>
          </Box>
          
          {user ? (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                color="inherit"
                component={RouterLink}
                to="/dashboard"
                startIcon={<LayoutDashboard size={18} />}
                sx={{
                  color: 'text.primary',
                  '&:hover': { 
                    backgroundColor: 'rgba(184, 134, 11, 0.1)',
                    color: '#DAA520',
                  },
                }}
              >
                Dashboard
              </Button>
              
              {user.role === 'admin' && (
                <Button
                  color="inherit"
                  component={RouterLink}
                  to="/admin"
                  startIcon={<Settings size={18} />}
                  sx={{
                    color: 'text.primary',
                    '&:hover': { 
                      backgroundColor: 'rgba(184, 134, 11, 0.1)',
                      color: '#DAA520',
                    },
                  }}
                >
                  Admin
                </Button>
              )}

              <Button
                color="inherit"
                component={RouterLink}
                to="/profile"
                startIcon={<User size={18} />}
                sx={{
                  color: 'text.primary',
                  '&:hover': { 
                    backgroundColor: 'rgba(184, 134, 11, 0.1)',
                    color: '#DAA520',
                  },
                }}
              >
                Profile
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleLogout}
                startIcon={<LogOut size={18} />}
                sx={{
                  borderColor: '#B8860B',
                  color: '#B8860B',
                  '&:hover': {
                    borderColor: '#DAA520',
                    color: '#DAA520',
                    backgroundColor: 'rgba(184, 134, 11, 0.1)',
                  },
                }}
              >
                Logout
              </Button>
            </Box>
          ) : (
            <Button
              variant="contained"
              component={RouterLink}
              to="/login"
              sx={{
                background: 'linear-gradient(135deg, #B8860B 0%, #DAA520 100%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(135deg, #8B6914 0%, #B8860B 100%)',
                },
              }}
            >
              Login
            </Button>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;