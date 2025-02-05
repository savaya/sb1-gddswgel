import axios from 'axios';
import { config } from './config.js';

// Create axios instance with base configuration
export const api = axios.create({
    baseURL:
        process.env.NODE_ENV === 'production'
            ? window.location.origin // Use the same origin in production
            : config.apiUrl,
    timeout: 30000, // Increase timeout to 30 seconds
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
        if (error.code === 'ECONNABORTED') {
            throw new Error('Request timed out. Please try again.');
        }
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            if (!window.location.pathname.includes('/review')) {
                window.location.href = '/login';
            }
        }
        throw error;
    },
);
