import { useQuery as useReactQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

// Base API URL
const API_URL = import.meta.env.VITE_API_URL;

// Create an axios instance with default config
// Create an axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // ✅ Ensures cookies are sent with requests
  });
  
  export const useQuery = (endpoint, options = {}) => {
    return useReactQuery({
      queryKey: [endpoint, options.params],
      queryFn: async () => {
        const response = await api.get(endpoint, {
          params: options.params,
        });
        return response.data;
      },
      ...options,
    });
  };
  
  export const useMutate = (endpoint, method = 'post', options = {}) => {
    return useMutation({
      mutationFn: async (data) => {
        const response = await api[method](endpoint, data);
        return response.data;
      },
      ...options,
    });
  };
  