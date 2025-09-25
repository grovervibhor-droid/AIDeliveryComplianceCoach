# Multi-stage Docker build for AI Delivery Compliance Coach

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
COPY public/ ./public/
RUN npm run build

# Stage 2: Setup backend
FROM node:18-alpine AS backend-setup
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./

# Stage 3: Production image
FROM node:18-alpine AS production
WORKDIR /app

# Install serve to host React build
RUN npm install -g serve

# Copy backend
COPY --from=backend-setup /app/backend ./backend
WORKDIR /app/backend

# Copy frontend build
COPY --from=frontend-build /app/build ./public

# Create startup script
RUN echo '#!/bin/sh\n\
echo "Starting AI Delivery Compliance Coach..."\n\
echo "Starting backend server..."\n\
node server.js &\n\
BACKEND_PID=$!\n\
echo "Backend PID: $BACKEND_PID"\n\
echo "Starting frontend server..."\n\
cd /app/backend/public\n\
serve -s . -l 3000 &\n\
FRONTEND_PID=$!\n\
echo "Frontend PID: $FRONTEND_PID"\n\
echo "Both services started successfully"\n\
wait $BACKEND_PID $FRONTEND_PID' > /app/start.sh

RUN chmod +x /app/start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Expose ports
EXPOSE 3000 5000

# Set environment
ENV NODE_ENV=production

# Start application
CMD ["/app/start.sh"]