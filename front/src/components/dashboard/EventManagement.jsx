import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, 
  Typography, 
  Paper, 
  Button, 
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Box
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check user role
    const checkUserRole = async () => {
      try {
        const response = await axios.get('/api/users/me', { withCredentials: true });
        const user = response.data;
        
        // Check if user has admin role
        const isadmin = user.roles && user.roles.some(role => role.name === 'admin');
        
        if (!isadmin) {
          // Redirect non-admin users
          navigate('/dashboard');
          return;
        }
        
        setUserRole('admin');
        fetchEvents();
      } catch (err) {
        setError('Authentication error. Please log in again.');
        navigate('/login');
      }
    };

    checkUserRole();
  }, [navigate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/events', { withCredentials: true });
      setEvents(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch events');
      setLoading(false);
    }
  };

  const handleCreateEvent = () => {
    navigate('/dashboard/events/create');
  };

  const handleEditEvent = (eventId) => {
    navigate(`/dashboard/events/edit/${eventId}`);
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await axios.delete(`/api/events/${eventId}`, { withCredentials: true });
        // Update events list
        setEvents(events.filter(event => event.id !== eventId));
      } catch (err) {
        setError('Failed to delete event');
      }
    }
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Event Management
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />} 
          onClick={handleCreateEvent}
          sx={{ mb: 3 }}
        >
          Create New Event
        </Button>
        
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Organizer</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.length > 0 ? (
                events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.title}</TableCell>
                    <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                    <TableCell>{event.organizer ? event.organizer.name : 'N/A'}</TableCell>
                    <TableCell>{event.status}</TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => handleEditEvent(event.id)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteEvent(event.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">No events found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
};

export default EventManagement; 