import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Button, 
  Grid,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Rating,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse
} from '@mui/material';
import { Upload, Mail, AlertCircle, FileText, Eye, MessageSquare, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

interface EmailBatch {
  _id: string;
  createdAt: string;
  completedAt?: string;
  emailCount: number;
  sentCount: number;
  failedCount: number;
  status: 'pending' | 'completed' | 'failed';
  emails: Array<{
    email: string;
    status: 'pending' | 'sent' | 'failed';
    sentAt?: string;
    error?: string;
  }>;
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

interface Hotel {
  _id: string;
  name: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [emails, setEmails] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [emailBatches, setEmailBatches] = useState<EmailBatch[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<EmailBatch | null>(null);
  const [openEmailsDialog, setOpenEmailsDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string>('');
  const [notification, setNotification] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchHotels();
    }
    fetchData();
  }, [user, selectedHotel]);

  const fetchHotels = async () => {
    try {
      const { data } = await api.get('/api/hotels');
      setHotels(data);
    } catch (error) {
      console.error('Error fetching hotels:', error);
    }
  };

  const fetchData = async () => {
    try {
      const params = user?.role === 'admin' && selectedHotel 
        ? { hotelId: selectedHotel }
        : {};

      const [batchesResponse, reviewsResponse] = await Promise.all([
        api.get('/api/reviews/email-batches', { params }),
        api.get('/api/reviews', { params })
      ]);

      setEmailBatches(batchesResponse.data);
      setReviews(reviewsResponse.data.reviews);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const emailList = emails.split('\n').map(email => email.trim()).filter(Boolean);
      const payload = user?.role === 'admin' 
        ? { emails: emailList, hotelId: selectedHotel }
        : { emails: emailList };

      await api.post('/api/reviews/send-requests', payload);
      
      setNotification({
        open: true,
        message: 'Review requests sent successfully!',
        severity: 'success'
      });
      setEmails('');
      fetchData();
    } catch (error) {
      setNotification({
        open: true,
        message: 'Failed to send review requests',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv') {
      setNotification({
        open: true,
        message: 'Please upload a CSV file',
        severity: 'error'
      });
      return;
    }

    setFile(file);
    const formData = new FormData();
    formData.append('file', file);

    if (user?.role === 'admin' && selectedHotel) {
      formData.append('hotelId', selectedHotel);
    }

    try {
      await api.post('/api/reviews/upload-csv', formData);
      setNotification({
        open: true,
        message: 'CSV uploaded and processed successfully!',
        severity: 'success'
      });
      fetchData();
    } catch (error) {
      setNotification({
        open: true,
        message: 'Failed to upload CSV',
        severity: 'error'
      });
    }
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Welcome, {user?.username}
      </Typography>

      {user?.role === 'admin' && (
        <Box sx={{ mb: 4 }}>
          <FormControl fullWidth>
            <InputLabel>Select Hotel</InputLabel>
            <Select
              value={selectedHotel}
              label="Select Hotel"
              onChange={(e) => setSelectedHotel(e.target.value)}
            >
              <MenuItem value="">
                <em>Select a hotel</em>
              </MenuItem>
              {hotels.map((hotel) => (
                <MenuItem key={hotel._id} value={hotel._id}>
                  {hotel.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 4,
        '& button': {
          flex: 1,
          py: 3,
          borderRadius: 2,
          fontSize: '1.1rem',
          fontWeight: 500,
          transition: 'all 0.2s ease-in-out',
          border: '2px solid transparent',
          backgroundColor: 'background.paper',
          color: 'text.secondary',
          '&:hover': {
            backgroundColor: 'rgba(184, 134, 11, 0.1)',
            borderColor: '#B8860B',
          },
        },
      }}>
        <Button
          onClick={() => setActiveTab(0)}
          sx={{
            ...(activeTab === 0 && {
              backgroundColor: 'rgba(184, 134, 11, 0.1) !important',
              borderColor: '#B8860B !important',
              color: '#B8860B !important',
            })
          }}
          startIcon={<Mail size={24} />}
        >
          Email Requests
        </Button>
        <Button
          onClick={() => setActiveTab(1)}
          sx={{
            ...(activeTab === 1 && {
              backgroundColor: 'rgba(184, 134, 11, 0.1) !important',
              borderColor: '#B8860B !important',
              color: '#B8860B !important',
            })
          }}
          startIcon={<MessageSquare size={24} />}
        >
          Reviews
        </Button>
      </Box>

      {activeTab === 0 ? (
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Mail size={24} style={{ marginRight: '8px' }} />
                  <Typography variant="h6">Send Review Requests</Typography>
                </Box>
                <form onSubmit={handleEmailSubmit}>
                  <TextField
                    multiline
                    rows={4}
                    fullWidth
                    value={emails}
                    onChange={(e) => setEmails(e.target.value)}
                    placeholder="Enter email addresses (one per line)"
                    sx={{ mb: 2 }}
                    disabled={isSubmitting || (user?.role === 'admin' && !selectedHotel)}
                  />
                  <Button 
                    variant="contained" 
                    type="submit"
                    startIcon={<Mail />}
                    fullWidth
                    disabled={isSubmitting || (user?.role === 'admin' && !selectedHotel)}
                  >
                    Send Review Requests
                  </Button>
                </form>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Upload size={24} style={{ marginRight: '8px' }} />
                  <Typography variant="h6">Upload CSV</Typography>
                </Box>
                <Box sx={{ 
                  border: '2px dashed #ccc', 
                  borderRadius: 2, 
                  p: 3, 
                  textAlign: 'center',
                  mb: 2
                }}>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    id="csv-upload"
                    disabled={user?.role === 'admin' && !selectedHotel}
                  />
                  <label htmlFor="csv-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<Upload />}
                      disabled={user?.role === 'admin' && !selectedHotel}
                    >
                      Choose CSV File
                    </Button>
                  </label>
                  {file && (
                    <Typography sx={{ mt: 2 }}>
                      Selected: {file.name}
                    </Typography>
                  )}
                </Box>
                <Alert 
                  severity="info" 
                  icon={<AlertCircle />}
                  sx={{ mt: 2 }}
                >
                  CSV should contain a single column of email addresses
                </Alert>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <FileText size={24} style={{ marginRight: '8px' }} />
                  <Typography variant="h6">Email Batch History</Typography>
                </Box>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Total Emails</TableCell>
                        <TableCell>Sent</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {emailBatches.map((batch) => (
                        <TableRow key={batch._id}>
                          <TableCell>
                            {formatDateTime(batch.createdAt)}
                          </TableCell>
                          <TableCell>{batch.emailCount}</TableCell>
                          <TableCell>{batch.sentCount}</TableCell>
                          <TableCell>
                            <Alert 
                              severity={
                                batch.status === 'completed' ? 'success' : 
                                batch.status === 'failed' ? 'error' : 
                                'info'
                              }
                              sx={{ display: 'inline-flex' }}
                            >
                              {batch.status}
                            </Alert>
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="View Emails">
                              <IconButton
                                onClick={() => {
                                  setSelectedBatch(batch);
                                  setOpenEmailsDialog(true);
                                }}
                                sx={{ color: '#B8860B' }}
                              >
                                <Eye size={20} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <MessageSquare size={24} style={{ marginRight: '8px' }} />
                  <Typography variant="h6">Reviews</Typography>
                </Box>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Guest Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Stay Date</TableCell>
                        <TableCell>Rating</TableCell>
                        <TableCell>Submitted</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reviews.map((review) => (
                        <React.Fragment key={review._id}>
                          <TableRow
                            sx={{
                              '& > *': { borderBottom: 'unset' },
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: 'rgba(184, 134, 11, 0.05)',
                              },
                            }}
                            onClick={() => {
                              setSelectedReview(selectedReview === review._id ? null : review._id);
                            }}
                          >
                            <TableCell>{review.guestName}</TableCell>
                            <TableCell>{review.email}</TableCell>
                            <TableCell>
                              {new Date(review.stayDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Rating 
                                value={review.rating} 
                                readOnly 
                                size="small"
                                sx={{
                                  '& .MuiRating-iconFilled': {
                                    color: '#B8860B',
                                  },
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              {new Date(review.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedReview(selectedReview === review._id ? null : review._id);
                                }}
                                sx={{
                                  color: '#B8860B',
                                  transform: selectedReview === review._id ? 'rotate(180deg)' : 'none',
                                  transition: 'transform 0.2s ease-in-out',
                                }}
                              >
                                <ChevronDown size={20} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell
                              style={{ paddingBottom: 0, paddingTop: 0 }}
                              colSpan={6}
                            >
                              <Collapse in={selectedReview === review._id} timeout="auto" unmountOnExit>
                                <Box sx={{ 
                                  margin: 2,
                                  backgroundColor: 'rgba(184, 134, 11, 0.05)',
                                  borderRadius: 1,
                                  p: 3,
                                }}>
                                  <Typography variant="h6" gutterBottom component="div" sx={{ color: '#B8860B' }}>
                                    Review Details
                                  </Typography>
                                  <Typography
                                    sx={{
                                      whiteSpace: 'pre-wrap',
                                      color: 'text.secondary',
                                      lineHeight: 1.6,
                                    }}
                                  >
                                    {review.reviewText}
                                  </Typography>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Dialog
        open={openEmailsDialog}
        onClose={() => {
          setOpenEmailsDialog(false);
          setSelectedBatch(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Email Batch Details</DialogTitle>
        <DialogContent>
          {selectedBatch && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Created: {formatDateTime(selectedBatch.createdAt)}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Status: {selectedBatch.status}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Emails:
              </Typography>
              <Box sx={{ maxHeight: 300, overflowY: 'auto', mt: 2 }}>
                {selectedBatch.emails.map((entry, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      mb: 2,
                      p: 1,
                      borderRadius: 1,
                      backgroundColor: 'rgba(184, 134, 11, 0.05)',
                    }}
                  >
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {entry.email}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: entry.status === 'sent' ? 'success.main' : 
                               entry.status === 'failed' ? 'error.main' : 
                               'text.secondary'
                      }}
                    >
                      Status: {entry.status}
                      {entry.sentAt && ` • Sent: ${formatDateTime(entry.sentAt)}`}
                    </Typography>
                    {entry.error && (
                      <Typography variant="caption" color="error" sx={{ display: 'block' }}>
                        Error: {entry.error}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenEmailsDialog(false);
            setSelectedBatch(null);
          }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;