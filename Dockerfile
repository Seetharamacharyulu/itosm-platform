# syntax=docker/dockerfile:1

# ===========================================
# Multi-Stage Docker Build for ITOSM Platform
# ===========================================

# ===================
# Stage 1: Base Setup
# ===================
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# ===================
# Stage 2: Dependencies
# ===================
FROM base AS dependencies
COPY package*.json ./
RUN npm ci --include=dev
USER nodejs

# ===================
# Stage 3: Build Frontend and Backend
# ===================
FROM dependencies AS build
COPY --chown=nodejs:nodejs . .
RUN npm run build

# ===================
# Stage 4: Production Dependencies
# ===================
FROM base AS production-deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ===================
# Stage 5: Migration Runtime (includes dev dependencies)
# ===================
FROM dependencies AS migrations
# Copy all source files needed for migrations
COPY --chown=nodejs:nodejs . .
RUN npm run build

# Create migration script
RUN echo '#!/bin/sh\necho "Running database migrations..."\nnpm run db:push\necho "Migrations completed successfully"' > /app/migrate.sh && \
    chmod +x /app/migrate.sh

# ===================
# Stage 6: Production Runtime
# ===================
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# Copy production dependencies
COPY --from=production-deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --from=build --chown=nodejs:nodejs /app/client/dist ./client/dist
COPY --from=build --chown=nodejs:nodejs /app/package.json ./

# Copy necessary runtime files
COPY --chown=nodejs:nodejs server ./server
COPY --chown=nodejs:nodejs shared ./shared
COPY --chown=nodejs:nodejs drizzle.config.ts ./
COPY --chown=nodejs:nodejs tsconfig.json ./

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "const http=require('http');const options={host:'localhost',port:5000,path:'/api/health',timeout:2000};const req=http.request(options,(res)=>{if(res.statusCode===200){process.exit(0)}else{process.exit(1)}});req.on('error',()=>{process.exit(1)});req.end();"

# Create startup script to start app (migrations handled by separate service)
RUN echo '#!/bin/sh\necho "Starting application..."\nexec node dist/index.js' > /app/start.sh && \
    chmod +x /app/start.sh

# Start application with migrations
ENTRYPOINT ["dumb-init", "--"]
CMD ["/app/start.sh"]