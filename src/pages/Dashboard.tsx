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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    SelectChangeEvent,
} from '@mui/material';
import { Upload, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import ReviewAnalytics from '../components/ReviewAnalytics';

interface EmailBatchResult {
    success: number;
    failed: number;
    batchId: string;
}

interface Hotel {
    _id: string;
    name: string;
}

const Dashboard = () => {
    const { user } = useAuth();
    const [selectedHotel, setSelectedHotel] = useState<string>('');
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [emailFile, setEmailFile] = useState<File | null>(null);
    const [openUploadDialog, setOpenUploadDialog] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<EmailBatchResult | null>(null);
    const [error, setError] = useState<string>('');
    const [emailInput, setEmailInput] = useState<string>('');
    const [isLoadingHotels, setIsLoadingHotels] = useState(true);

    useEffect(() => {
        fetchHotels();
    }, []);

    const fetchHotels = async () => {
        try {
            const { data } = await api.get('/api/hotels');
            setHotels(Array.isArray(data) ? data : []);
            // If we have hotels and no hotel is selected, select the first one
            if (data.length > 0 && !selectedHotel) {
                setSelectedHotel(data[0]._id);
            }
        } catch (error) {
            console.error('Error fetching hotels:', error);
            setError('Failed to fetch hotels');
        } finally {
            setIsLoadingHotels(false);
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
        } catch (error) {
            console.error('Error uploading file:', error);
            setError('Failed to process email list');
        } finally {
            setIsUploading(false);
        }
    };

    const handleEmailSubmit = async () => {
        if (!emailInput.trim() || !selectedHotel) return;

        setIsUploading(true);
        setError('');
        setUploadResult(null);

        try {
            const emails = emailInput.split(',').map((email) => email.trim());

            const { data } = await api.post('/api/reviews/send-requests', {
                emails,
                hotelId: selectedHotel,
            });

            setUploadResult(data.results);
            setEmailInput('');
        } catch (error) {
            console.error('Error sending emails:', error);
            setError('Failed to send review requests');
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
                                sx={{
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: !selectedHotel ? 'error.main' : undefined,
                                        borderWidth: !selectedHotel ? 2 : 1,
                                    },
                                }}
                            >
                                {hotels.map((hotel) => (
                                    <MenuItem key={hotel._id} value={hotel._id}>
                                        {hotel.name}
                                    </MenuItem>
                                ))}
                            </Select>
                            {!selectedHotel && (
                                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                                    Please select a hotel to continue
                                </Typography>
                            )}
                        </FormControl>
                    </CardContent>
                </Card>
            )}

            {selectedHotel && (
                <>
                    <Grid container spacing={4}>
                        <Grid item xs={12}>
                            <ReviewAnalytics />
                        </Grid>

                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Send Review Requests
                                    </Typography>

                                    <Box sx={{ mb: 4 }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Enter Email Addresses
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                            <TextField
                                                fullWidth
                                                placeholder="Enter email addresses separated by commas"
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
                    </Grid>
                </>
            )}

            <Dialog open={openUploadDialog} onClose={() => setOpenUploadDialog(false)}>
                <DialogTitle>Upload Email List</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Please upload a CSV file containing email addresses in the first column.
                    </Typography>
                    <Button variant="outlined" component="label" fullWidth>
                        Choose File
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
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            Selected file: {emailFile.name}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenUploadDialog(false)}>Cancel</Button>
                    <Button onClick={handleFileUpload} variant="contained" disabled={!emailFile || isUploading}>
                        Upload
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Dashboard;
