# Build Stage
FROM node:18-alpine as builder

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Build both frontend and backend
RUN npm run build:all

# Production Stage
FROM node:18-alpine

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 5174

# Set production environment
ENV NODE_ENV=production

# Start command
CMD ["npm", "start"]