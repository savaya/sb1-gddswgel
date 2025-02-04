import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Rating,
  LinearProgress
} from '@mui/material';
import { Star, TrendingUp, Mail, MessageSquare } from 'lucide-react';
import { api } from '../lib/api';

interface AnalyticsData {
  totalReviews: number;
  averageRating: number;
  responseRate: number;
  ratingDistribution: Record<number, number>;
  recentTrend: number;
}

const ReviewAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data } = await api.get('/api/analytics');
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <Box sx={{ p: 4 }}>
      <Grid container spacing={4}>
        {/* Overview Cards */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MessageSquare size={24} style={{ marginRight: '8px' }} />
                <Typography variant="h6">Total Reviews</Typography>
              </Box>
              <Typography variant="h4">{analytics.totalReviews}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Star size={24} style={{ marginRight: '8px' }} />
                <Typography variant="h6">Average Rating</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h4" sx={{ mr: 1 }}>
                  {analytics.averageRating.toFixed(1)}
                </Typography>
                <Rating value={analytics.averageRating} readOnly precision={0.5} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Mail size={24} style={{ marginRight: '8px' }} />
                <Typography variant="h6">Response Rate</Typography>
              </Box>
              <Typography variant="h4">{analytics.responseRate.toFixed(1)}%</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp size={24} style={{ marginRight: '8px' }} />
                <Typography variant="h6">30-Day Trend</Typography>
              </Box>
              <Typography variant="h4" color={analytics.recentTrend >= 0 ? 'success.main' : 'error.main'}>
                {analytics.recentTrend >= 0 ? '+' : ''}{analytics.recentTrend.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Rating Distribution */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Rating Distribution</Typography>
              {[5, 4, 3, 2, 1].map(rating => {
                const count = analytics.ratingDistribution[rating] || 0;
                const percentage = (count / analytics.totalReviews) * 100;
                
                return (
                  <Box key={rating} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography sx={{ mr: 1 }}>{rating} stars</Typography>
                      <Typography color="text.secondary">
                        ({count} reviews)
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={percentage} 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReviewAnalytics;