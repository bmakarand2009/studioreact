# Docker Environment Variables Setup

## Overview

This project supports both **build-time** and **runtime** environment variables for Docker deployments.

## Environment Variables from .env File

The following variables are configured:

```bash
# API Configuration
VITE_API_URL=https://api.wajooba.me

# Development Mode Flag
VITE_IS_DEV_MODE=true

# Dev Mode Tenant Name
VITE_DEV_TENANT_NAME=marksampletest

# App Configuration
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_SENTRY=false
VITE_DISABLE_DOMAIN_CHECK=false

# Optional External Services
# VITE_GA_ID=
# VITE_SENTRY_DSN=
```

## How It Works

### Build-Time Variables (VITE_*)
- **When:** Set during `docker build` or `docker-compose build`
- **How:** Passed as build arguments to Dockerfile
- **Result:** Embedded into the built JavaScript bundle by Vite
- **Access:** Available via `import.meta.env.VITE_*`

### Runtime Variables
- **When:** Set when container starts (`docker run` or `docker-compose up`)
- **How:** Passed as environment variables to running container
- **Result:** Available as `process.env.*` at runtime
- **Access:** Available via `process.env.*` (both with and without VITE_ prefix)

## Priority Order

The `getEnvVar()` function checks variables in this order:

1. `process.env.[KEY]` - Runtime Docker variables (without VITE_ prefix)
2. `process.env.VITE_[KEY]` - Runtime Docker variables (with VITE_ prefix)
3. `import.meta.env.VITE_[KEY]` - Build-time variables (embedded by Vite)

## Usage Examples

### Using docker-compose.yml (Recommended)

The `docker-compose.yml` automatically:
- Loads variables from `.env` file
- Passes them as build arguments (for build-time embedding)
- Sets them as runtime environment variables

```bash
# Build and run
docker-compose up -d

# Rebuild with new variables
docker-compose build --no-cache
docker-compose up -d
```

### Using Docker CLI

**Build with build-time variables:**
```bash
docker build \
  --build-arg VITE_API_URL=https://api.wajooba.me \
  --build-arg VITE_IS_DEV_MODE=true \
  --build-arg VITE_DEV_TENANT_NAME=marksampletest \
  -t studioreact-app .
```

**Run with runtime variables:**
```bash
docker run -d \
  -p 5173:5173 \
  -e VITE_API_URL=https://api.wajooba.me \
  -e API_URL=https://api.wajooba.me \
  -e WAJOOBA_API_KEY=your_key \
  studioreact-app
```

## Overriding Variables

### For Different Environments

**Development:**
```bash
# Use .env.development
docker-compose --env-file .env.development up -d
```

**Production:**
```bash
# Use .env.production
docker-compose --env-file .env.production up -d
```

### At Runtime (without rebuild)

You can override variables at runtime without rebuilding:

```bash
# Override API URL at runtime
docker run -d \
  -p 5173:5173 \
  -e API_URL=https://api.production.com \
  -e VITE_API_URL=https://api.production.com \
  studioreact-app
```

## Railway Deployment

For Railway, set environment variables in the Railway dashboard:

**Build-time variables (with VITE_ prefix):**
- `VITE_API_URL`
- `VITE_IS_DEV_MODE`
- `VITE_DEV_TENANT_NAME`
- etc.

**Runtime variables (without VITE_ prefix - optional):**
- `API_URL`
- `WAJOOBA_API_KEY`
- etc.

Railway will:
1. Use VITE_* variables during build
2. Make all variables available at runtime as `process.env.*`

## Testing Environment Variables

### Check build-time variables (in built bundle)
```bash
# Build and check dist files
docker-compose build
docker run --rm studioreact-app cat /app/dist/assets/*.js | grep -i "api.wajooba"
```

### Check runtime variables (in container)
```bash
# Check environment variables in running container
docker exec studioreact-app env | grep VITE

# Check process.env availability
docker exec studioreact-app node -e "console.log(process.env)"
```

### Verify in browser console
```javascript
// Check import.meta.env (build-time)
console.log(import.meta.env.VITE_API_URL);

// Check process.env (runtime) - if available
console.log(process.env?.API_URL || process.env?.VITE_API_URL);
```

## Best Practices

1. **Sensitive data:** Use runtime variables (without VITE_ prefix) for secrets
2. **Public config:** Use build-time variables (with VITE_ prefix) for public config
3. **Default values:** Always provide defaults in docker-compose.yml
4. **Environment files:** Use `.env.[mode]` files for different environments
5. **Never commit secrets:** Add `.env.local` to `.gitignore`

## Troubleshooting

### Variables not working at runtime
- Ensure variables are set in `docker-compose.yml` environment section
- Check that `process.env` is available (may need polyfill for browser)
- Verify variables are loaded: `docker exec container-name env`

### Variables not embedded at build time
- Ensure variables are passed as build args
- Rebuild without cache: `docker-compose build --no-cache`
- Check build logs for variable values

### Variables missing in browser
- Build-time variables are embedded - check `import.meta.env`
- Runtime variables need `process.env` polyfill for browser
- Use `getEnvVar()` helper function which handles both
