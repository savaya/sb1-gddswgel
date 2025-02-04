# Build Stage
FROM node:18-alpine as builder

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Clean any existing dist directory
RUN npm run clean

# Build both frontend and backend
RUN npm run build:all

# Production Stage
FROM node:18-alpine

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built files from builder stage
# Frontend build
COPY --from=builder /app/dist/client ./dist/client
# Backend build
COPY --from=builder /app/dist/server.js ./dist/
COPY --from=builder /app/dist/src ./dist/src

# Expose port
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Start command
CMD ["npm", "run", "start:prod"]