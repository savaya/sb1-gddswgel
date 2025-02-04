import express from 'express';
import { config } from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import logger from './src/lib/logger.js';
import connectDB from './src/lib/db.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import authRoutes from './src/routes/auth.js';
import userRoutes from './src/routes/users.js';
import hotelRoutes from './src/routes/hotels.js';
import reviewRoutes from './src/routes/reviews.js';
import auth from './src/middleware/auth.js';

// Load environment variables
config();

const app = express();
const port = process.env.PORT || 3000;

// Get current directory - handle both ESM and CJS
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = process.env.NODE_ENV === 'production' ? path.join(__dirname, '..') : __dirname;

// Connect to MongoDB
connectDB();

// Security middleware
app.use(
    helmet({
        contentSecurityPolicy: false, // Disable CSP in development
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        crossOriginOpenerPolicy: { policy: 'same-origin' },
    }),
);

// CORS configuration
const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'https://admin.hotelreviewsystem.com'];

        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            logger.warn(`Blocked request from unauthorized origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600, // Increase preflight cache to 10 minutes
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(
    fileUpload({
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    } as fileUpload.Options),
);

// Set security headers for all responses
app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', auth, userRoutes);
app.use('/api/hotels', auth, hotelRoutes);
app.use('/api/reviews', reviewRoutes);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    // Serve static files from the React app
    const staticPath = path.join(rootDir, 'dist', 'client');
    logger.info(`Serving static files from: ${staticPath}`);

    app.use(
        express.static(staticPath, {
            maxAge: '1y',
            etag: true,
        }),
    );

    // Handle client-side routing - MUST be after API routes
    app.get('*', (_req, res) => {
        res.sendFile(path.join(staticPath, 'index.html'));
    });
}

// Error handling middleware - MUST be after all routes
app.use(errorHandler);

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', {
        promise,
        reason,
    });
    // Don't exit the process, just log it
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    // Don't exit the process, just log it
});

// Start server
app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
    logger.info(`CORS allowed origins in production: https://admin.hotelreviewsystem.com`);
});
