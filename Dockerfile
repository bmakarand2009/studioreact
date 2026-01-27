# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Accept build-time environment variables (for Vite build-time embedding)
# These are optional - defaults are provided
ARG VITE_API_URL=https://api.wajooba.me
ARG VITE_IS_DEV_MODE=true
ARG VITE_DEV_TENANT_NAME=marksampletest
ARG VITE_APP_VERSION=1.0.0
ARG VITE_ENABLE_ANALYTICS=false
ARG VITE_ENABLE_MOCK_DATA=false
ARG VITE_ENABLE_SENTRY=false
ARG VITE_DISABLE_DOMAIN_CHECK=false
ARG VITE_GA_ID=
ARG VITE_SENTRY_DSN=
ARG VITE_WAJOOBA_API_KEY=

# Set as environment variables for build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_IS_DEV_MODE=$VITE_IS_DEV_MODE
ENV VITE_DEV_TENANT_NAME=$VITE_DEV_TENANT_NAME
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV VITE_ENABLE_ANALYTICS=$VITE_ENABLE_ANALYTICS
ENV VITE_ENABLE_MOCK_DATA=$VITE_ENABLE_MOCK_DATA
ENV VITE_ENABLE_SENTRY=$VITE_ENABLE_SENTRY
ENV VITE_DISABLE_DOMAIN_CHECK=$VITE_DISABLE_DOMAIN_CHECK
ENV VITE_GA_ID=$VITE_GA_ID
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ENV VITE_WAJOOBA_API_KEY=$VITE_WAJOOBA_API_KEY

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/index.html ./index.html

# Expose port 5173
EXPOSE 5173

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5173

# Start the preview server
CMD ["npm", "run", "preview"]
