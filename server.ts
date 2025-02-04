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
const port = process.env.PORT || 5174;

// Get current directory - handle both ESM and CJS
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = process.env.NODE_ENV === 'production' ? path.join(__dirname, '..') : __dirname;

// Connect to MongoDB
connectDB();

// Security middleware
app.use(
    helmet({
        contentSecurityPolicy: false, // Disable CSP in development
    }),
);

app.use(
    cors({
        origin: ['https://admin.hotelreviewsystem.com', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
        credentials: true,
    }),
);

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(
    fileUpload({
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    } as fileUpload.Options),
);

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

    app.use(express.static(staticPath));

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
});
