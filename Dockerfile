# Build Stage
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production Stage
FROM node:18-alpine
WORKDIR /app

# Copy build files and package files
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm install --omit=dev

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]