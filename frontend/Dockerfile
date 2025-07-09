# Multi-stage build for production

# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache git python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user
RUN addgroup -g 1001 -S nginx_user
RUN adduser -S nginx_user -u 1001

# Set permissions
RUN chown -R nginx_user:nginx_user /usr/share/nginx/html
RUN chown -R nginx_user:nginx_user /var/cache/nginx
RUN chown -R nginx_user:nginx_user /var/log/nginx
RUN chown -R nginx_user:nginx_user /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R nginx_user:nginx_user /var/run/nginx.pid

# Switch to non-root user
USER nginx_user

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]