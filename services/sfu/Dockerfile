# ─── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# mediasoup requires native build tools
RUN apk add --no-cache python3 py3-pip make gcc g++

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ─── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

# Install only runtime dependencies (no build tools needed)
RUN apk add --no-cache dumb-init

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S leeway -u 1001

USER leeway

ENV NODE_ENV=production
ENV HTTP_PORT=3000
ENV LOG_LEVEL=warn

EXPOSE 3000
# RTP/RTCP port range
EXPOSE 40000-49999/udp

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD node -e "require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode===200?0:1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
