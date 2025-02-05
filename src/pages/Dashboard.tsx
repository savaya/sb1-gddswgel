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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    IconButton,
    Tooltip,
} from '@mui/material';
import { Upload, Send, Mail, Eye, X, AlertCircle, CheckCircle } from 'lucide-react';
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
    const [selectedBatch, setSelectedBatch] = useState<EmailBatch | null>(null);
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);

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

            if (!user?.role || user.role !== 'admin') {
                if (user?.hotel?._id) {
                    setSelectedHotel(user.hotel._id);
                }
            } else if (hotelData.length > 0) {
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
            await fetchEmailBatches();
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
            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target?.result;
                if (typeof text !== 'string') return;

                const emails = text
                    .split('\n')
                    .map((line) => line.split(',')[0].trim()) // Assume email is first column
                    .filter((email) => email && email.includes('@')); // Basic validation

                const { data } = await api.post('/api/reviews/send-requests', {
                    emails,
                    hotelId: selectedHotel,
                });

                setUploadResult(data.results);
                setEmailFile(null);
                await fetchEmailBatches();
            };

            reader.readAsText(emailFile);
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
                <Card sx={{ mb: 4 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Select Hotel</Typography>
                        </Box>
                        <FormControl fullWidth>
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
                                    Checkout Submissions
                                </Typography>

                                {isLoadingBatches ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                        <CircularProgress />
                                    </Box>
                                ) : emailBatches.length === 0 ? (
                                    <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                        No submissions available
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
                                                    <TableCell align="right">Actions</TableCell>
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
                                                            <Chip
                                                                size="small"
                                                                label={batch.status}
                                                                color={batch.status === 'completed' ? 'success' : 'error'}
                                                                icon={
                                                                    batch.status === 'completed' ? (
                                                                        <CheckCircle size={16} />
                                                                    ) : (
                                                                        <AlertCircle size={16} />
                                                                    )
                                                                }
                                                            />
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Tooltip title="View Details">
                                                                <IconButton size="small" onClick={() => setSelectedBatch(batch)}>
                                                                    <Eye size={18} />
                                                                </IconButton>
                                                            </Tooltip>
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
                                    Reviews Overview
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
                                                    <TableCell>Review Preview</TableCell>
                                                    <TableCell align="right">Actions</TableCell>
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
                                                        <TableCell>
                                                            {review.reviewText.length > 100
                                                                ? `${review.reviewText.substring(0, 100)}...`
                                                                : review.reviewText}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Tooltip title="View Full Review">
                                                                <IconButton size="small" onClick={() => setSelectedReview(review)}>
                                                                    <Eye size={18} />
                                                                </IconButton>
                                                            </Tooltip>
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
                </Grid>
            )}

            {/* Email Batch Details Dialog */}
            <Dialog open={!!selectedBatch} onClose={() => setSelectedBatch(null)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Checkout Submission Details</Typography>
                    <IconButton size="small" onClick={() => setSelectedBatch(null)} sx={{ color: 'text.secondary' }}>
                        <X size={20} />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {selectedBatch && (
                        <Box>
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Date/Time
                                    </Typography>
                                    <Typography variant="body1">
                                        {format(new Date(selectedBatch.createdAt), 'MMM d, yyyy HH:mm')}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Status
                                    </Typography>
                                    <Chip
                                        size="small"
                                        label={selectedBatch.status}
                                        color={selectedBatch.status === 'completed' ? 'success' : 'error'}
                                        icon={selectedBatch.status === 'completed' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                    />
                                </Grid>
                            </Grid>

                            <Typography variant="subtitle1" gutterBottom>
                                Email Details
                            </Typography>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Email</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Sent At</TableCell>
                                            <TableCell>Error</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {selectedBatch.emails.map((email, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{email.email}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        size="small"
                                                        label={email.status}
                                                        color={email.status === 'sent' ? 'success' : 'error'}
                                                    />
                                                </TableCell>
                                                <TableCell>{email.sentAt ? format(new Date(email.sentAt), 'HH:mm:ss') : '-'}</TableCell>
                                                <TableCell>{email.error || '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedBatch(null)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Review Details Dialog */}
            <Dialog open={!!selectedReview} onClose={() => setSelectedReview(null)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Review Details</Typography>
                    <IconButton size="small" onClick={() => setSelectedReview(null)} sx={{ color: 'text.secondary' }}>
                        <X size={20} />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {selectedReview && (
                        <Box>
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Guest
                                    </Typography>
                                    <Typography variant="body1">{selectedReview.guestName}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Date
                                    </Typography>
                                    <Typography variant="body1">{format(new Date(selectedReview.createdAt), 'MMM d, yyyy')}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Rating
                                    </Typography>
                                    <Rating value={selectedReview.rating} readOnly />
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Review
                                    </Typography>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            mt: 1,
                                            backgroundColor: 'background.default',
                                            whiteSpace: 'pre-wrap',
                                        }}
                                    >
                                        <Typography variant="body1">{selectedReview.reviewText}</Typography>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedReview(null)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Dashboard;
