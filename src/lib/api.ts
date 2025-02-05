import axios from 'axios';
import { config } from './config.js';

// Create axios instance with base configuration
export const api = axios.create({
    baseURL: process.env.NODE_ENV === 'production' ? window.location.origin : config.apiUrl,
    timeout: 10000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Handle 401 responses
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            if (!window.location.pathname.includes('/review')) {
                window.location.href = '/login';
            }
        }

        // Enhance error message
        const message = error.response?.data?.error || error.message;
        error.message = message;
        throw error;
    },
);
