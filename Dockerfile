# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (production + dev for tsc)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and compile
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser  -u 1001 -S appuser -G appgroup

# Install production deps only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled output
COPY --from=builder /app/dist ./dist

# Create uploads directory
RUN mkdir -p uploads && chown appuser:appgroup uploads

# Switch to non-root user
USER appuser

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["node", "dist/server.js"]
