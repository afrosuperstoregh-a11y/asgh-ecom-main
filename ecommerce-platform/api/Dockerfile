# =======================================
# Multi-stage Dockerfile for Node.js API
# Optimized for both development and production environments
# =======================================

# =======================================
# Base image with security updates
# =======================================
FROM node:20-alpine AS base

# Install security updates and required packages
RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache \
    openssl \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Create app directory with proper permissions
RUN mkdir -p /app && chown -R node:node /app
WORKDIR /app

# =======================================
# Dependencies stage
# =======================================
FROM base AS deps

# Copy package files for dependency installation
COPY --chown=node:node package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --only=production --no-audit --prefer-offline && \
    npm audit fix --audit-level=moderate || true

# =======================================
# Development stage
# =======================================
FROM base AS development

# Install development dependencies
RUN npm install -g nodemon

# Copy package files for dependency installation
COPY --chown=node:node package.json package-lock.json* ./

# Install all dependencies including devDependencies
RUN npm install --no-audit --prefer-offline

# Copy application code
COPY --chown=node:node . .

# Generate Prisma client
RUN npx prisma generate

# Expose development port
EXPOSE 3001

# Use non-root user
USER node

# Start development server
CMD ["npm", "run", "dev"]

# =======================================
# Builder stage for production
# =======================================
FROM base AS builder

# Copy installed dependencies
COPY --from=deps --chown=node:node /app/node_modules ./node_modules

# Copy application code
COPY --chown=node:node . .

# Set build environment
ENV NODE_ENV=production

# Generate Prisma client
RUN npx prisma generate

# Build the application if needed
RUN if [ -f "tsconfig.json" ]; then npm run build; fi

# Prune dev dependencies
RUN npm prune --production

# =======================================
# Production runner stage
# =======================================
FROM base AS production

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV NODE_OPTIONS=--max_old_space_size=4096

# Copy necessary files from builder
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/prisma ./prisma

# Use non-root user
USER node

# Expose the application port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start the application
CMD ["node", "dist/main"]

# =======================================
# Test stage (optional)
# =======================================
FROM base AS test

# Copy installed dependencies
COPY --from=deps --chown=node:node /app/node_modules ./node_modules

# Copy application code
COPY --chown=node:node . .

# Run tests
CMD ["npm", "test"]
