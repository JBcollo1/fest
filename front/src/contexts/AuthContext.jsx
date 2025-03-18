import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext({
  user: null,
  loading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  fetchCurrentUser: async () => {},
  fetchAllUsers: async () => [],
  fetchAllOrganizers: async () => [],
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
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`, {
        withCredentials: true,
      });
      return response.data.data;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  };

  const fetchAllOrganizers = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/organizers`, {
        withCredentials: true,
      });
      return response.data.data;
    } catch (error) {
      console.error("Error fetching organizers:", error);
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
    fetchAllOrganizers
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);