# ---------- Build Stage ----------
FROM node:22-alpine AS builder

WORKDIR /app

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build standalone production application
RUN npm run build

# ---------- Runtime Stage ----------
FROM node:22-alpine

WORKDIR /app

# Production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup -S app && adduser -S app -G app

# Copy standalone build
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public

# Switch to non-root user
USER app

# Application port
EXPOSE 3000

# Start Next.js
CMD ["node", "server.js"]