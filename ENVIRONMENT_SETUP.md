# Environment Variables Setup (Standard Vite Way)

## Overview

This project uses **Vite's standard environment file mechanism**. This is the recommended approach and works seamlessly with Railway, Docker, and other deployment platforms.

## How Vite Environment Files Work

Vite automatically loads environment files based on the **mode**:

1. **`.env`** - Loaded in all cases (base configuration)
2. **`.env.local`** - Loaded in all cases, ignored by git (local overrides)
3. **`.env.[mode]`** - Loaded only in specified mode (e.g., `.env.development`)
4. **`.env.[mode].local`** - Loaded only in specified mode, ignored by git

### Mode Determination

- **Development**: `vite dev` (default mode: `development`)
- **Production**: `vite build` (default mode: `production`)
- **Custom**: `vite build --mode staging` (uses `staging` mode)

## Environment Files

### `.env.development`
Used when running `npm run dev` or `npm run build:dev`
- API URL: `https://api.wajooba.me`
- Dev mode enabled
- Debug features on

### `.env.staging`
Used when running `npm run build:staging`
- API URL: `https://api.wajooba.xyz`
- Production-like settings
- Analytics enabled

### `.env.production`
Used when running `npm run build` or `npm run build:production`
- API URL: `https://api.onwajooba.com`
- Production settings
- Analytics and Sentry enabled

## Usage in Code

Environment variables are accessed via `import.meta.env`:

```typescript
// Direct access
const apiUrl = import.meta.env.VITE_API_URL;

// Using the helper function (recommended)
import { getEnvVar } from '@/config/environment';
const apiUrl = getEnvVar('VITE_API_URL', 'https://api.wajooba.me');
```

## Railway Deployment (Docker Containers)

### Standard Approach - No Extra Steps Needed!

Railway automatically handles environment variables during Docker builds. Here's how it works:

1. **Set environment variables in Railway** with `VITE_` prefix:
   - Go to Railway dashboard → Your service → Variables tab
   - Add variables like:
     - `VITE_API_URL=https://api.onwajooba.com`
     - `VITE_ENABLE_ANALYTICS=true`
     - `VITE_ENABLE_SENTRY=true`
     - `VITE_SENTRY_DSN=your-sentry-dsn`
     - etc.

2. **Set the build command** (in Railway service settings):
   - Production: `npm run build` or `npm run build:production`
   - Staging: `npm run build:staging`
   - Development: `npm run build:dev`

3. **Set the start command** (in Railway service settings):
   - `npm run preview` or `npm start`
   - Or use a static file server like `npx serve dist`

4. **That's it!** Railway automatically:
   - Provides environment variables during the Docker build process
   - Vite reads them during `npm run build` and embeds them into the bundle
   - No runtime injection needed - everything is baked in at build time

### How Railway Docker Build Works

```
Railway Build Process:
1. Railway starts Docker container
2. Railway provides environment variables (from Variables tab)
3. Runs: npm install
4. Runs: npm run build (Vite reads env vars here)
5. Vite embeds env vars into JavaScript bundle
6. Builds static files in dist/
7. Runs: npm run preview (serves the built files)
```

**Important**: Environment variables must be set in Railway **before** the build runs. Railway exposes them as environment variables during the build process, and Vite automatically picks them up.

### Build Commands

- **Production**: `npm run build` or `npm run build:production`
- **Staging**: `npm run build:staging`
- **Development**: `npm run build:dev`

## Important Notes

### Variable Naming
- **All variables must be prefixed with `VITE_`** to be exposed to client code
- Variables without `VITE_` prefix are not accessible in the browser

### Build-Time vs Runtime
- Vite embeds environment variables **at build time**
- Variables are **not** available at runtime (they're baked into the bundle)
- To change variables, you need to rebuild

### Railway Best Practices

1. **Set variables before building**: Ensure all `VITE_*` variables are set in Railway before deployment
2. **Use the correct mode**: Set build command with `--mode` flag if needed
3. **Check build logs**: Railway build logs will show which variables were used

## Available Environment Variables

All variables must be prefixed with `VITE_`:

- `VITE_API_URL` - API base URL
- `VITE_IS_DEV_MODE` - Development mode flag (`true`/`false`)
- `VITE_DEV_TENANT_NAME` - Dev tenant name
- `VITE_APP_VERSION` - Application version
- `VITE_ENABLE_ANALYTICS` - Enable analytics (`true`/`false`)
- `VITE_ENABLE_MOCK_DATA` - Enable mock data (`true`/`false`)
- `VITE_ENABLE_SENTRY` - Enable Sentry (`true`/`false`)
- `VITE_DISABLE_DOMAIN_CHECK` - Disable domain check (`true`/`false`)
- `VITE_GA_ID` - Google Analytics ID (optional)
- `VITE_SENTRY_DSN` - Sentry DSN (optional)

## Troubleshooting

### Variables not appearing

1. **Check prefix**: Variables must start with `VITE_`
2. **Check Railway Variables tab**: Ensure variables are set at service level
3. **Check build logs**: Railway should show variables being used
4. **Redeploy**: After adding variables, trigger a new deployment

### Wrong environment values

1. **Check mode**: Verify the build command uses the correct `--mode` flag
2. **Check file**: Ensure `.env.[mode]` file exists for your mode
3. **Check priority**: `.env.local` overrides `.env`, `.env.[mode].local` overrides `.env.[mode]`

## Example Railway Setup

### Railway Service Configuration

**Build Command:**
```bash
npm run build
```
or for explicit production mode:
```bash
npm run build:production
```

**Start Command:**
```bash
npm run preview
```

**Environment Variables** (set in Railway Variables tab):
```
VITE_API_URL=https://api.onwajooba.com
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_SENTRY=true
VITE_SENTRY_DSN=your-sentry-dsn
VITE_IS_DEV_MODE=false
```

### Step-by-Step Railway Setup

1. **Create/Select Service** in Railway dashboard
2. **Connect Repository** (GitHub/GitLab/etc.)
3. **Go to Variables Tab** → Add all `VITE_*` variables
4. **Go to Settings Tab** → Set:
   - Build Command: `npm run build`
   - Start Command: `npm run preview`
5. **Deploy** → Railway will:
   - Build Docker container
   - Provide env vars during build
   - Vite embeds them automatically
   - Serve the built application

### No Extra Steps Required!

Unlike some deployment setups, Railway with Docker containers **does not require**:
- ❌ Runtime environment injection scripts
- ❌ Custom Dockerfile modifications for env vars
- ❌ Post-build scripts
- ❌ HTML template replacement

Railway automatically provides environment variables during the build, and Vite's standard mechanism handles everything. This is the **standard Vite way** and works reliably with Railway's Docker containers.
