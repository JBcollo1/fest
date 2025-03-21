import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext({
  user: null,
  loading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  fetchUserData: async () => {},
  fetchAllUsers: () => Promise.resolve([]),
  fetchAllOrganizers: () => Promise.resolve([]),
  fetchOrganizerEvents: () => Promise.resolve([]),
  fetchEventById: () => Promise.resolve(null),
  fetchOrganizerById: () => fetchOrganizerById(),
  createEvent: () => Promise.resolve({}),
  updateEvent: () => Promise.resolve({}),
  deleteEvent: () => Promise.resolve({}),
  fetchEventTicketSales: () => Promise.resolve([]),
  fetchEventPayments: () => Promise.resolve([]),
  fetchEventCategories: () => Promise.resolve([]),
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user data when the component mounts
  useEffect(() => {
    // Only try to fetch user data if we're not already loading
    if (loading) {
      fetchUserData();
    }
  }, []); // Empty dependency array means this runs once on mount

  const fetchUserData = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/users/me`,
        {
          withCredentials: true, 
          headers: { "Accept": "application/json" }
        }
      );
      
      // Check if we got a successful response with data
      if (response.data && response.data.data) {
        console.log("User data retrieved" );
        setUser(response.data.data);
      } else {
        console.warn("No user data found in response:", response.data);
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      
      // Check if we got a 401 Unauthorized, which means we're not logged in
      if (error.response && error.response.status === 401) {
        console.log("User is not authenticated");
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/login`,
        { email, password },
        { withCredentials: true }
      );
      
      // After login, fetch the user data
      await fetchUserData();
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      setLoading(false);
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };
  const fetchOrganizerById = async (organizerId) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/organizers/${organizerId}`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching organizer:', error);
      throw error;
    }
  };
  const logout = async () => {
    try {
      setLoading(true);
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/logout`,
        {},
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setLoading(false);
      // Optionally redirect to login page after logout
      navigate('/login');
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/users`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  };

  const fetchAllOrganizers = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/organizers`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching organizers:', error);
      throw error;
    }
  };

  // Fetch events for the logged-in organizer or all events for admin
  const fetchOrganizerEvents = async () => {
    try {
      // Check if the user is an admin
      const isAdmin = user?.roles?.includes("Admin");
      
      if (isAdmin) {
        // Admins can see all events
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/events`,
          { withCredentials: true }
        );
        return response.data;
      } else {
        // For organizers, show only their events
        const organizer = await fetchOrganizerProfile();
        if (!organizer || !organizer.id) {
          throw new Error("User is not an organizer");
        }

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/events?organizer_id=${organizer.id}`,
          { withCredentials: true }
        );
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  };

  // Fetch a single event by ID
  const fetchEventById = async (eventId) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/events/${eventId}`,
        { withCredentials: true }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
  };

  // Create a new event
  const createEvent = async (eventData) => {
    try {
      // If admin is creating an event on behalf of an organizer, use the selected organizer ID
      // Otherwise, for organizers, the backend will use their own organizer ID
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/events`,
        eventData,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  // Update an existing event
  const updateEvent = async (eventId, eventData) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/events/${eventId}`,
        eventData,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  };

  // Delete an event
  const deleteEvent = async (eventId) => {
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/events/${eventId}`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  };

  // Fetch the organizer profile for the current user
  const fetchOrganizerProfile = async () => {
    if (!user) return null;
    
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/users/${user.id}/organizer`,
        { withCredentials: true }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching organizer profile:', error);
      // Not an error if user is not an organizer
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  };

  const fetchEventTicketSales = async (eventId, timeRange) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/events/${eventId}/ticket-sales?range=${timeRange}`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching ticket sales:', error);
      throw error;
    }
  };

  const fetchEventPayments = async (eventId, timeRange) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/events/${eventId}/payments?range=${timeRange}`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  };

  const fetchEventCategories = async (eventId) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/events/${eventId}/categories`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    fetchUserData,
    fetchAllUsers,
    fetchAllOrganizers,
    fetchOrganizerEvents,
    fetchOrganizerById,
    fetchEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    fetchEventTicketSales,
    fetchEventPayments,
    fetchEventCategories,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);