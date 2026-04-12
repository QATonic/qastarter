# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for building)
RUN npm ci

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 qastarter

# Copy built files and package manifests from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server/templates ./server/templates
COPY --from=builder /app/package*.json ./

# Install ONLY production dependencies (H9 fix — no devDependencies in prod image)
RUN npm ci --omit=dev && npm cache clean --force

# Create logs and data directories
RUN mkdir -p logs server/data && chown -R qastarter:nodejs logs server/data

# Set environment variables
ENV NODE_ENV=production
ENV LOG_FILE=true

# Expose default port (Easypanel may override PORT at runtime)
EXPOSE 5000

# Switch to non-root user
USER qastarter

# No Docker HEALTHCHECK — Easypanel handles health at the proxy level.
# A broken HEALTHCHECK causes Docker to restart healthy containers.

# Start the application
CMD ["node", "dist/index.js"]
