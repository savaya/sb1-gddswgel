// api.ts
import axios from 'axios';
import { config } from './config.js'; // Added .js extension

export const api = axios.create({
    baseURL: process.env.NODE_ENV === 'production' ? window.location.origin : config.apiUrl,
    timeout: 30000, // Increased timeout to 30 seconds
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor for debugging
api.interceptors.request.use(
    (config) => {
        console.log('API Request:', {
            url: config.url,
            method: config.method,
            data: config.data,
        });
        return config;
    },
    (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
    },
);

// Add response interceptor for debugging
api.interceptors.response.use(
    (response) => {
        console.log('API Response:', response.data);
        return response;
    },
    (error) => {
        console.error('API Response Error:', error.response || error);

        // Handle 401 responses
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            if (!window.location.pathname.includes('/review')) {
                window.location.href = '/login';
            }
        }

        const message = error.response?.data?.error || error.message;
        error.message = message;
        throw error;
    },
);
