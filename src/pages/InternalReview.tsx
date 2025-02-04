import { useState } from 'react';
import { Box, Typography, TextField, Rating, Button, Snackbar, Alert, CircularProgress } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import { api } from '../lib/api'; // Import the api instance

interface ReviewData {
    guestName: string;
    email: string;
    stayDate: string;
    rating: number | null;
    reviewText: string;
    hotelId: string;
}

const InternalReview = () => {
    const [searchParams] = useSearchParams();
    const hotelId = searchParams.get('hotel');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [reviewData, setReviewData] = useState<ReviewData>({
        guestName: '',
        email: '',
        stayDate: '',
        rating: null,
        reviewText: '',
        hotelId: hotelId || '',
    });

    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);

        try {
            // Use the api instance instead of direct fetch
            const { data } = await api.post('/api/reviews/internal', reviewData);

            setNotification({
                open: true,
                message: 'Thank you for your feedback!',
                severity: 'success',
            });

            setTimeout(() => {
                window.close();
            }, 2000);
        } catch (error) {
            setNotification({
                open: true,
                message: 'Failed to submit review. Please try again.',
                severity: 'error',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: '#ffffff',
                py: 4,
                px: 2,
            }}
        >
            <Box sx={{ maxWidth: 600, mx: 'auto' }}>
                <Typography
                    variant="h4"
                    component="h1"
                    sx={{
                        color: '#202124',
                        fontWeight: 400,
                        mb: 4,
                        textAlign: 'center',
                    }}
                >
                    Share your experience
                </Typography>

                <form onSubmit={handleSubmit}>
                    <Box sx={{ mb: 4, textAlign: 'center' }}>
                        <Typography
                            component="legend"
                            sx={{
                                color: '#202124',
                                mb: 1,
                                fontWeight: 500,
                            }}
                        >
                            Overall rating
                        </Typography>
                        <Rating
                            name="rating"
                            value={reviewData.rating}
                            onChange={(_, newValue) => setReviewData({ ...reviewData, rating: newValue })}
                            icon={<Star fill="#1a73e8" />}
                            emptyIcon={<Star />}
                            size="large"
                            sx={{
                                '& .MuiRating-icon': {
                                    color: '#1a73e8',
                                },
                            }}
                        />
                    </Box>

                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Your Name"
                        value={reviewData.guestName}
                        onChange={(e) => setReviewData({ ...reviewData, guestName: e.target.value })}
                        disabled={isSubmitting}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    borderColor: '#dadce0',
                                },
                                '&:hover fieldset': {
                                    borderColor: '#1a73e8',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#1a73e8',
                                },
                            },
                            '& .MuiInputLabel-root': {
                                color: '#5f6368',
                                '&.Mui-focused': {
                                    color: '#1a73e8',
                                },
                            },
                            '& .MuiInputBase-input': {
                                color: '#202124',
                            },
                            mb: 3,
                        }}
                    />

                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Email Address"
                        type="email"
                        value={reviewData.email}
                        onChange={(e) => setReviewData({ ...reviewData, email: e.target.value })}
                        disabled={isSubmitting}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    borderColor: '#dadce0',
                                },
                                '&:hover fieldset': {
                                    borderColor: '#1a73e8',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#1a73e8',
                                },
                            },
                            '& .MuiInputLabel-root': {
                                color: '#5f6368',
                                '&.Mui-focused': {
                                    color: '#1a73e8',
                                },
                            },
                            '& .MuiInputBase-input': {
                                color: '#202124',
                            },
                            mb: 3,
                        }}
                    />

                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        type="date"
                        label="Date of Stay"
                        InputLabelProps={{ shrink: true }}
                        value={reviewData.stayDate}
                        onChange={(e) => setReviewData({ ...reviewData, stayDate: e.target.value })}
                        disabled={isSubmitting}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    borderColor: '#dadce0',
                                },
                                '&:hover fieldset': {
                                    borderColor: '#1a73e8',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#1a73e8',
                                },
                            },
                            '& .MuiInputLabel-root': {
                                color: '#5f6368',
                                '&.Mui-focused': {
                                    color: '#1a73e8',
                                },
                            },
                            '& .MuiInputBase-input': {
                                color: '#202124',
                            },
                            mb: 3,
                        }}
                    />

                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        multiline
                        rows={4}
                        label="Share details of your experience"
                        value={reviewData.reviewText}
                        onChange={(e) => setReviewData({ ...reviewData, reviewText: e.target.value })}
                        disabled={isSubmitting}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    borderColor: '#dadce0',
                                },
                                '&:hover fieldset': {
                                    borderColor: '#1a73e8',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#1a73e8',
                                },
                            },
                            '& .MuiInputLabel-root': {
                                color: '#5f6368',
                                '&.Mui-focused': {
                                    color: '#1a73e8',
                                },
                            },
                            '& .MuiInputBase-input': {
                                color: '#202124',
                            },
                            mb: 4,
                        }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button
                            onClick={() => window.close()}
                            disabled={isSubmitting}
                            sx={{
                                color: '#1a73e8',
                                '&:hover': {
                                    backgroundColor: 'rgba(26, 115, 232, 0.04)',
                                },
                                textTransform: 'none',
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isSubmitting}
                            sx={{
                                bgcolor: '#1a73e8',
                                color: '#fff',
                                '&:hover': {
                                    bgcolor: '#1557b0',
                                },
                                textTransform: 'none',
                                px: 4,
                                minWidth: 100,
                            }}
                        >
                            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Post'}
                        </Button>
                    </Box>
                </form>
            </Box>

            <Snackbar open={notification.open} autoHideDuration={6000} onClose={() => setNotification({ ...notification, open: false })}>
                <Alert severity={notification.severity} sx={{ width: '100%' }}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default InternalReview;
