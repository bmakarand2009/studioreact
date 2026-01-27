# Docker Access Guide

## Quick Start

### 1. Build and Run with Docker Compose (Recommended)

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

**Access the app at:** `http://localhost:5173`

### 2. Build and Run with Docker CLI

```bash
# Build the image
docker build -t studioreact-app .

# Run the container
docker run -d \
  --name studioreact-app \
  -p 5173:5173 \
  -e VITE_API_URL=https://api.wajooba.me \
  -e WAJOOBA_API_KEY=your_key_here \
  studioreact-app

# View logs
docker logs -f studioreact-app

# Stop the container
docker stop studioreact-app
docker rm studioreact-app
```

**Access the app at:** `http://localhost:5173`

## Accessing from Different Hosts

### Local Machine
- **URL:** `http://localhost:5173`
- Works automatically when running Docker locally

### Network Access (Same Network)
- **URL:** `http://<docker-host-ip>:5173`
- Example: `http://192.168.1.16:5173`
- Make sure Docker host firewall allows port 5173

### Remote Access
1. **Find your Docker host IP:**
   ```bash
   # On Linux/Mac
   hostname -I
   
   # On Windows
   ipconfig
   ```

2. **Access from remote machine:**
   - URL: `http://<docker-host-ip>:5173`
   - Ensure firewall rules allow port 5173

### Using Different Ports

If port 5173 is already in use, map to a different host port:

```bash
# Map container port 5173 to host port 8080
docker run -d \
  --name studioreact-app \
  -p 8080:5173 \
  studioreact-app
```

Then access at: `http://localhost:8080`

Or in `docker-compose.yml`:
```yaml
ports:
  - "8080:5173"  # Host:Container
```

## Environment Variables

### Setting Environment Variables

**Option 1: docker-compose.yml**
```yaml
environment:
  - VITE_API_URL=https://api.wajooba.me
  - WAJOOBA_API_KEY=your_key
```

**Option 2: .env file**
Create `.env` file:
```
VITE_API_URL=https://api.wajooba.me
WAJOOBA_API_KEY=your_key
```

Then in `docker-compose.yml`:
```yaml
env_file:
  - .env
```

**Option 3: Docker run command**
```bash
docker run -d \
  -p 5173:5173 \
  -e WAJOOBA_API_KEY=your_key \
  -e VITE_API_URL=https://api.wajooba.me \
  studioreact-app
```

### Runtime vs Build-time Variables

The app supports both:
- **Runtime:** `process.env.WAJOOBA_API_KEY` (set in Docker)
- **Build-time:** `process.env.VITE_WAJOOBA_API_KEY` (set during build)

Priority order:
1. `process.env.WAJOOBA_API_KEY`
2. `process.env.VITE_WAJOOBA_API_KEY`
3. `import.meta.env.VITE_WAJOOBA_API_KEY` (build-time)

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 5173
# Linux/Mac
lsof -i :5173

# Windows
netstat -ano | findstr :5173

# Kill the process or use a different port
```

### Container Won't Start
```bash
# Check logs
docker logs studioreact-app

# Check if container is running
docker ps -a

# Restart container
docker restart studioreact-app
```

### Can't Access from Network
1. Check firewall settings
2. Verify port mapping: `docker ps` should show `0.0.0.0:5173->5173/tcp`
3. Ensure Docker is listening on `0.0.0.0` (not just `127.0.0.1`)

### Environment Variables Not Working
```bash
# Verify environment variables in container
docker exec studioreact-app env | grep VITE

# Check if process.env is available
docker exec studioreact-app node -e "console.log(process.env)"
```

## Production Deployment

For production, consider:
1. Using a reverse proxy (nginx, traefik)
2. Setting up SSL/TLS certificates
3. Using environment-specific configurations
4. Implementing health checks

Example with nginx:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
