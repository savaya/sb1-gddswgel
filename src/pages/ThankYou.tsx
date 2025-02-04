import { useEffect } from 'react';
import { Box, Container, Typography } from '@mui/material';
import { Heart } from 'lucide-react';

const ThankYou = () => {
  useEffect(() => {
    // Close window after 2 seconds
    const timer = setTimeout(() => {
      window.close();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          textAlign: 'center',
        }}
      >
        <Heart size={64} color="#1a73e8" />
        
        <Typography variant="h3" component="h1" gutterBottom sx={{ mt: 4 }}>
          Thank You!
        </Typography>
        
        <Typography variant="h6" color="text.secondary" paragraph>
          We appreciate you taking the time to share your feedback with us.
        </Typography>
      </Box>
    </Container>
  );
};

export default ThankYou;