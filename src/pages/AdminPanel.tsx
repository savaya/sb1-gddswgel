import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  DialogContentText,
  SelectChangeEvent
} from '@mui/material';
import { UserPlus, Users, Hotel, Trash2, Edit } from 'lucide-react';
import { api } from '../lib/api';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  hotel?: string;
  lastLogin: string;
}

interface HotelData {
  _id: string;
  name: string;
  googleReviewLink?: string;
}

interface EmailBatch {
  _id: string;
  emails: string[];
  createdAt: string;
  status: 'pending' | 'completed' | 'failed';
}

interface NewUser {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  hotel: string;
}

const AdminPanel = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [hotels, setHotels] = useState<HotelData[]>([]);
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [openHotelDialog, setOpenHotelDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'user' | 'hotel', id: string } | null>(null);
  const [openEmailsDialog, setOpenEmailsDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<EmailBatch | null>(null);
  
  const [newUser, setNewUser] = useState<NewUser>({
    username: '',
    email: '',
    password: '',
    role: 'user',
    hotel: ''
  });
  
  const [newHotel, setNewHotel] = useState({
    name: '',
    googleReviewLink: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchHotels();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/api/users');
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchHotels = async () => {
    try {
      const { data } = await api.get('/api/hotels');
      setHotels(data);
    } catch (error) {
      console.error('Error fetching hotels:', error);
    }
  };

  const handleCreateUser = async () => {
    try {
      await api.post('/api/users', newUser);
      setOpenUserDialog(false);
      fetchUsers();
      setNewUser({
        username: '',
        email: '',
        password: '',
        role: 'user',
        hotel: ''
      });
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleCreateHotel = async () => {
    try {
      await api.post('/api/hotels', newHotel);
      setOpenHotelDialog(false);
      fetchHotels();
      setNewHotel({
        name: '',
        googleReviewLink: ''
      });
    } catch (error) {
      console.error('Error creating hotel:', error);
    }
  };

  const handleEditUser = async () => {
    if (!editingUser?.id) return;
    
    try {
      await api.patch(`/api/users/${editingUser.id}`, {
        email: editingUser.email,
        role: editingUser.role,
        hotel: editingUser.hotel
      });
      setOpenEditDialog(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === 'user') {
        await api.delete(`/api/users/${deleteTarget.id}`);
        fetchUsers();
      } else {
        await api.delete(`/api/hotels/${deleteTarget.id}`);
        fetchHotels();
      }
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setOpenDeleteDialog(false);
      setDeleteTarget(null);
    }
  };

  const handleRoleChange = (event: SelectChangeEvent<'admin' | 'user'>, target: 'new' | 'edit') => {
    const role = event.target.value as 'admin' | 'user';
    if (target === 'new') {
      setNewUser(prev => ({ ...prev, role }));
    } else if (editingUser) {
      setEditingUser({ ...editingUser, role });
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
        Admin Dashboard
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Users size={24} style={{ marginRight: '8px' }} />
                <Typography variant="h6">Total Users</Typography>
              </Box>
              <Typography variant="h4">{users.length}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Hotel size={24} style={{ marginRight: '8px' }} />
                <Typography variant="h6">Total Hotels</Typography>
              </Box>
              <Typography variant="h4">{hotels.length}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Hotels</Typography>
                <Button
                  variant="contained"
                  startIcon={<Hotel />}
                  onClick={() => setOpenHotelDialog(true)}
                >
                  Add Hotel
                </Button>
              </Box>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Review Link</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {hotels.map((hotel) => (
                      <TableRow key={hotel._id}>
                        <TableCell>{hotel.name}</TableCell>
                        <TableCell>{hotel.googleReviewLink || 'Not set'}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Delete">
                            <IconButton
                              color="error"
                              onClick={() => {
                                setDeleteTarget({ type: 'hotel', id: hotel._id });
                                setOpenDeleteDialog(true);
                              }}
                            >
                              <Trash2 size={18} />
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

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">User Management</Typography>
                <Button
                  variant="contained"
                  startIcon={<UserPlus />}
                  onClick={() => setOpenUserDialog(true)}
                >
                  Add User
                </Button>
              </Box>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Username</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Hotel</TableCell>
                      <TableCell>Last Login</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>
                          {hotels.find(h => h._id === user.hotel)?.name || 'N/A'}
                        </TableCell>
                        <TableCell>{formatDateTime(user.lastLogin)}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit">
                            <IconButton
                              onClick={() => {
                                setEditingUser(user);
                                setOpenEditDialog(true);
                              }}
                            >
                              <Edit size={18} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              color="error"
                              onClick={() => {
                                setDeleteTarget({ type: 'user', id: user.id });
                                setOpenDeleteDialog(true);
                              }}
                            >
                              <Trash2 size={18} />
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

      {/* Create User Dialog */}
      <Dialog open={openUserDialog} onClose={() => setOpenUserDialog(false)}>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Username"
            fullWidth
            value={newUser.username}
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Role</InputLabel>
            <Select
              value={newUser.role}
              label="Role"
              onChange={(e) => handleRoleChange(e, 'new')}
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Hotel</InputLabel>
            <Select
              value={newUser.hotel}
              label="Hotel"
              onChange={(e) => setNewUser({ ...newUser, hotel: e.target.value })}
            >
              <MenuItem value="">None</MenuItem>
              {hotels.map((hotel) => (
                <MenuItem key={hotel._id} value={hotel._id}>
                  {hotel.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUserDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateUser} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={openEditDialog && !!editingUser} onClose={() => {
        setOpenEditDialog(false);
        setEditingUser(null);
      }}>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          {editingUser && (
            <>
              <TextField
                margin="dense"
                label="Email"
                type="email"
                fullWidth
                value={editingUser.email}
                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
              />
              <FormControl fullWidth margin="dense">
                <InputLabel>Role</InputLabel>
                <Select
                  value={editingUser.role}
                  label="Role"
                  onChange={(e) => handleRoleChange(e, 'edit')}
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel>Hotel</InputLabel>
                <Select
                  value={editingUser.hotel || ''}
                  label="Hotel"
                  onChange={(e) => setEditingUser({ ...editingUser, hotel: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  {hotels.map((hotel) => (
                    <MenuItem key={hotel._id} value={hotel._id}>
                      {hotel.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenEditDialog(false);
            setEditingUser(null);
          }}>Cancel</Button>
          <Button onClick={handleEditUser} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Create Hotel Dialog */}
      <Dialog open={openHotelDialog} onClose={() => setOpenHotelDialog(false)}>
        <DialogTitle>Create New Hotel</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Hotel Name"
            fullWidth
            value={newHotel.name}
            onChange={(e) => setNewHotel({ ...newHotel, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Google Review Link"
            fullWidth
            value={newHotel.googleReviewLink}
            onChange={(e) => setNewHotel({ ...newHotel, googleReviewLink: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHotelDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateHotel} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => {
        setOpenDeleteDialog(false);
        setDeleteTarget(null);
      }}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this {deleteTarget?.type}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDeleteDialog(false);
            setDeleteTarget(null);
          }}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Emails Dialog */}
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
                {selectedBatch.emails.map((email, index) => (
                  <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                    {email}
                  </Typography>
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
    </Box>
  );
};

export default AdminPanel;