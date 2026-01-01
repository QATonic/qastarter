# Build stage
FROM node:18-alpine AS builder

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
FROM node:18-alpine AS runner

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 qastarter

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server/templates ./server/templates
COPY --from=builder /app/package.json ./package.json

# Create logs directory
RUN mkdir -p logs && chown -R qastarter:nodejs logs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV LOG_FILE=true

# Expose port
EXPOSE 5000

# Switch to non-root user
USER qastarter

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:${PORT:-5000}/api/v1/metadata || exit 1

# Start the application
CMD ["node", "dist/index.js"]
