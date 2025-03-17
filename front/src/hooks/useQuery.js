import { useQuery as useReactQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

// Base API URL
const API_URL = import.meta.env.VITE_API_URL;

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_URL,
});

export const useQuery = (endpoint, options = {}) => {
  const { token } = useAuth();
  
  return useReactQuery({
    queryKey: [endpoint, options.params],
    queryFn: async () => {
      const response = await api.get(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: options.params,
      });
      return response.data;
    },
    ...options,
  });
};

export const useMutate = (endpoint, method = 'post', options = {}) => {
  const { token } = useAuth();
  
  return useMutation({
    mutationFn: async (data) => {
      const response = await api[method](endpoint, data, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    },
    ...options,
  });
}; 