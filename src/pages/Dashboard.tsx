import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Alert,
    CircularProgress,
    SelectChangeEvent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Rating,
} from '@mui/material';
import { Upload, Send, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { format } from 'date-fns';

interface EmailBatchResult {
    success: number;
    failed: number;
    batchId: string;
}

interface Hotel {
    _id: string;
    name: string;
}

interface EmailBatch {
    _id: string;
    createdAt: string;
    emailCount: number;
    sentCount: number;
    failedCount: number;
    status: string;
    emails: {
        email: string;
        status: string;
        sentAt?: string;
        error?: string;
    }[];
}

interface Review {
    _id: string;
    guestName: string;
    email: string;
    stayDate: string;
    rating: number;
    reviewText: string;
    createdAt: string;
}

const Dashboard = () => {
    const { user } = useAuth();
    const [selectedHotel, setSelectedHotel] = useState<string>('');
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [emailFile, setEmailFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<EmailBatchResult | null>(null);
    const [error, setError] = useState<string>('');
    const [emailInput, setEmailInput] = useState<string>('');
    const [isLoadingHotels, setIsLoadingHotels] = useState(true);
    const [emailBatches, setEmailBatches] = useState<EmailBatch[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoadingBatches, setIsLoadingBatches] = useState(false);
    const [isLoadingReviews, setIsLoadingReviews] = useState(false);

    useEffect(() => {
        fetchHotels();
    }, []);

    useEffect(() => {
        if (selectedHotel) {
            fetchEmailBatches();
            fetchReviews();
        }
    }, [selectedHotel]);

    const fetchHotels = async () => {
        try {
            const { data } = await api.get('/api/hotels');
            const hotelData = Array.isArray(data) ? data : [];
            setHotels(hotelData);

            // If user is not admin, use their assigned hotel
            if (!user?.role || user.role !== 'admin') {
                if (user?.hotel?._id) {
                    setSelectedHotel(user.hotel._id);
                }
            } else if (hotelData.length > 0) {
                // For admin, select first hotel if none selected
                setSelectedHotel(hotelData[0]._id);
            }
        } catch (error) {
            console.error('Error fetching hotels:', error);
            setError('Failed to fetch hotels');
        } finally {
            setIsLoadingHotels(false);
        }
    };

    const fetchEmailBatches = async () => {
        if (!selectedHotel) return;

        setIsLoadingBatches(true);
        try {
            const { data } = await api.get(`/api/reviews/email-batches?hotelId=${selectedHotel}`);
            setEmailBatches(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching email batches:', error);
            setError('Failed to fetch email history');
        } finally {
            setIsLoadingBatches(false);
        }
    };

    const fetchReviews = async () => {
        if (!selectedHotel) return;

        setIsLoadingReviews(true);
        try {
            const { data } = await api.get(`/api/reviews?hotelId=${selectedHotel}`);
            setReviews(Array.isArray(data.reviews) ? data.reviews : []);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            setError('Failed to fetch reviews');
        } finally {
            setIsLoadingReviews(false);
        }
    };

    const handleEmailSubmit = async () => {
        if (!emailInput.trim() || !selectedHotel) return;

        setIsUploading(true);
        setError('');
        setUploadResult(null);

        try {
            const emails = emailInput
                .split('\n')
                .map((email) => email.trim())
                .filter(Boolean);

            const { data } = await api.post('/api/reviews/send-requests', {
                emails,
                hotelId: selectedHotel,
            });

            setUploadResult(data.results);
            setEmailInput('');
            await fetchEmailBatches(); // Refresh the email batches list
        } catch (error) {
            console.error('Error sending emails:', error);
            setError('Failed to send review requests');
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileUpload = async () => {
        if (!emailFile || !selectedHotel) return;

        setIsUploading(true);
        setError('');
        setUploadResult(null);

        try {
            const formData = new FormData();
            formData.append('file', emailFile);
            formData.append('hotelId', selectedHotel);

            const { data } = await api.post('/api/reviews/send-requests', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setUploadResult(data.results);
            setEmailFile(null);
            await fetchEmailBatches(); // Refresh the email batches list
        } catch (error) {
            console.error('Error uploading file:', error);
            setError('Failed to process email list');
        } finally {
            setIsUploading(false);
        }
    };

    if (isLoadingHotels) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 4 }}>
                Dashboard
            </Typography>

            {user?.role === 'admin' && (
                <Card sx={{ mb: 4, borderColor: !selectedHotel ? 'error.main' : 'transparent' }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ color: !selectedHotel ? 'error.main' : 'inherit' }}>
                                Select Hotel
                            </Typography>
                        </Box>
                        <FormControl fullWidth error={!selectedHotel}>
                            <InputLabel>Hotel</InputLabel>
                            <Select
                                value={selectedHotel}
                                label="Hotel"
                                onChange={(e: SelectChangeEvent<string>) => setSelectedHotel(e.target.value)}
                            >
                                {hotels.map((hotel) => (
                                    <MenuItem key={hotel._id} value={hotel._id}>
                                        {hotel.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </CardContent>
                </Card>
            )}

            {selectedHotel && (
                <Grid container spacing={4}>
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Send Review Requests
                                </Typography>

                                <Box sx={{ mb: 4 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Enter Email Addresses (one per line)
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={4}
                                            placeholder="Enter email addresses (one per line)"
                                            value={emailInput}
                                            onChange={(e) => setEmailInput(e.target.value)}
                                            disabled={isUploading}
                                        />
                                        <Button
                                            variant="contained"
                                            onClick={handleEmailSubmit}
                                            disabled={!emailInput.trim() || isUploading}
                                            startIcon={<Send />}
                                        >
                                            Send
                                        </Button>
                                    </Box>
                                </Box>

                                <Typography variant="subtitle2" gutterBottom>
                                    Or Upload CSV File
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Button variant="outlined" component="label" disabled={isUploading} startIcon={<Upload />}>
                                        Upload CSV
                                        <input
                                            type="file"
                                            hidden
                                            accept=".csv"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) setEmailFile(file);
                                            }}
                                        />
                                    </Button>
                                    {emailFile && (
                                        <Button variant="contained" onClick={handleFileUpload} disabled={isUploading}>
                                            Process File
                                        </Button>
                                    )}
                                </Box>

                                {emailFile && (
                                    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                                        Selected file: {emailFile.name}
                                    </Typography>
                                )}

                                {isUploading && (
                                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <CircularProgress size={20} />
                                        <Typography>Processing...</Typography>
                                    </Box>
                                )}

                                {error && (
                                    <Alert severity="error" sx={{ mt: 2 }}>
                                        {error}
                                    </Alert>
                                )}

                                {uploadResult && (
                                    <Alert severity="success" sx={{ mt: 2 }}>
                                        Successfully sent {uploadResult.success} review requests
                                        {uploadResult.failed > 0 && ` (${uploadResult.failed} failed)`}
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Mail size={24} />
                                    Email History
                                </Typography>

                                {isLoadingBatches ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                        <CircularProgress />
                                    </Box>
                                ) : emailBatches.length === 0 ? (
                                    <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                        No email history available
                                    </Typography>
                                ) : (
                                    <TableContainer component={Paper} sx={{ mt: 2 }}>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Date/Time</TableCell>
                                                    <TableCell>Total Emails</TableCell>
                                                    <TableCell>Sent</TableCell>
                                                    <TableCell>Failed</TableCell>
                                                    <TableCell>Status</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {emailBatches.map((batch) => (
                                                    <TableRow key={batch._id}>
                                                        <TableCell>{format(new Date(batch.createdAt), 'MMM d, yyyy HH:mm')}</TableCell>
                                                        <TableCell>{batch.emailCount}</TableCell>
                                                        <TableCell>{batch.sentCount}</TableCell>
                                                        <TableCell>{batch.failedCount}</TableCell>
                                                        <TableCell>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    color: batch.status === 'completed' ? 'success.main' : 'error.main',
                                                                }}
                                                            >
                                                                {batch.status}
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Reviews
                                </Typography>

                                {isLoadingReviews ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                        <CircularProgress />
                                    </Box>
                                ) : reviews.length === 0 ? (
                                    <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                        No reviews available
                                    </Typography>
                                ) : (
                                    <TableContainer component={Paper} sx={{ mt: 2 }}>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Date</TableCell>
                                                    <TableCell>Guest</TableCell>
                                                    <TableCell>Rating</TableCell>
                                                    <TableCell>Review</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {reviews.map((review) => (
                                                    <TableRow key={review._id}>
                                                        <TableCell>{format(new Date(review.createdAt), 'MMM d, yyyy')}</TableCell>
                                                        <TableCell>{review.guestName}</TableCell>
                                                        <TableCell>
                                                            <Rating value={review.rating} readOnly size="small" />
                                                        </TableCell>
                                                        <TableCell>{review.reviewText}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default Dashboard;
