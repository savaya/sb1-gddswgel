import React from 'react';
import { Box, Container } from '@mui/material';
import Navbar from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1A1A1A 0%, #242424 100%)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '100%',
          background: 'url(https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2670&q=80) center/cover no-repeat fixed',
          opacity: 0.1,
          pointerEvents: 'none',
        },
      }}
    >
      <Navbar />
      <Container 
        component="main" 
        sx={{ 
          flex: 1, 
          py: 6,
          px: { xs: 2, sm: 4, md: 6 },
          maxWidth: { xl: '1400px !important' },
          position: 'relative',
          zIndex: 1,
        }}
      >
        {children}
      </Container>
    </Box>
  );
};

export default Layout;