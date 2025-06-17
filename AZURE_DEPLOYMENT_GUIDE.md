# Deployment Guide: Next.js + Node.js Website on Azure App Service with Docker

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Backend Preparation](#backend-preparation)
4. [Frontend Preparation](#frontend-preparation)
5. [Azure Container Registry (ACR)](#azure-container-registry-acr)
6. [Azure App Service: Multi-Container Setup](#azure-app-service-multi-container-setup)
7. [Testing and Verification](#testing-and-verification)
8. [CI/CD Recommendation](#cicd-recommendation)
9. [Appendix: Full File Listings](#appendix-full-file-listings)

---

## 1. Overview

This document describes how to package a Next.js + Node.js application into two Docker images (frontend + backend), push them to Azure Container Registry (ACR), and deploy them together on Azure App Service:

**Frontend**
- Built with Next.js (static export), then served by nginx on port 80
- nginx proxies any request under `/api/v1/*` to `http://127.0.0.1:7000/api/v1/*` (backend sidecar)
- nginx proxies Socket.io connections to `http://127.0.0.1:7000/socket.io/*`

**Backend**
- A Node/Express API that listens on `0.0.0.0:7000` and connects to MongoDB
- Includes Socket.io for real-time communication
- Includes a CORS policy allowing the App Service domain

On Azure App Service, we configure:
1. **Primary container** = Frontend image (nginx + Next.js build) exposed on port 80
2. **Sidecar container** = Backend image (Node/Express) listening on port 7000 internally

---

## 2. Prerequisites

Before beginning, ensure you have the following:

1. **Azure subscription** with appropriate rights to create resources (ACR, App Service)
2. **Azure CLI** installed locally (version 2.20+)
3. **Docker** installed locally (for building images)
4. **GitHub repository** containing your Next.js + Node.js codebase with:
   - `/client` (Next.js frontend code, plus Dockerfile and nginx.conf)
   - `/server` (Node/Express backend code, plus Dockerfile)
5. **MongoDB connection string** (e.g., Atlas URI) ready to supply as an environment variable

---

## 3. Backend Preparation

### 3.1. Bind Express to 0.0.0.0

✅ **Already Fixed**: Your `server/index.js` now binds to `0.0.0.0:7000`:

```javascript
const PORT = process.env.PORT || 7000;
server.listen(PORT, '0.0.0.0', () => 
  console.log(`Server is running on http://0.0.0.0:${PORT}`)
);
```

### 3.2. CORS Configuration

✅ **Already Fixed**: Your `server/app.js` now includes proper CORS configuration:

```javascript
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173", 
  "https://your-app-name.azurewebsites.net", // Replace with your actual domain
  process.env.FRONTEND_URL
].filter(Boolean);
```

**Important**: Update `your-app-name.azurewebsites.net` with your actual Azure App Service domain.

### 3.3. Backend Dockerfile

✅ **Created**: `server/Dockerfile` is ready for production deployment.

---

## 4. Frontend Preparation

### 4.1. Next.js Configuration Updates

✅ **Already Fixed**: Your `client/next.config.mjs` now includes:

- Static export configuration for nginx deployment
- Environment variables for API and Socket URLs
- Dynamic API rewrites for development/production

### 4.2. Utility Functions Updated

✅ **Already Fixed**: Your `client/lib/utils.ts` now uses environment variables:

```typescript
export function getApiBaseUrl(): string {
  return process.env.API_URL || '/api/v1';
}

export function getSocketUrl(): string {
  return process.env.SOCKET_URL || '';
}
```

### 4.3. Component Updates

✅ **Already Fixed**: Your React components now use the utility functions instead of hardcoded localhost URLs.

### 4.4. nginx Configuration

✅ **Created**: `client/nginx.conf` proxies API calls and Socket.io connections to the backend sidecar.

### 4.5. Frontend Dockerfile

✅ **Created**: `client/Dockerfile` builds Next.js static export and serves via nginx.

---

## 5. Azure Container Registry (ACR)

### 5.1. Create an ACR Instance

1. **Log in to Azure CLI**:
   ```bash
   az login
   ```

2. **Create a resource group** (if you don't have one):
   ```bash
   az group create \
     --name myResourceGroup \
     --location eastus
   ```

3. **Create the ACR**:
   ```bash
   az acr create \
     --resource-group myResourceGroup \
     --name jyotishconnect \
     --sku Basic \
     --admin-enabled true
   ```

4. **Verify**:
   ```bash
   az acr show --name jyotishconnect --resource-group myResourceGroup --query loginServer --output table
   ```

### 5.2. Authenticate and Push Docker Images

1. **Log in to ACR**:
   ```bash
   az acr login --name jyotishconnect
   ```

2. **Build and Push Backend Image**:
   ```bash
   cd server
   docker build -t jyotishconnect.azurecr.io/backend:latest .
   docker push jyotishconnect.azurecr.io/backend:latest
   ```

3. **Build and Push Frontend Image**:
   ```bash
   cd ../client
   docker build -t jyotishconnect.azurecr.io/frontend:latest .
   docker push jyotishconnect.azurecr.io/frontend:latest
   ```

---

## 6. Azure App Service: Multi-Container Setup

### 6.1. Create a Web App for Containers

1. In Azure Portal: **+ Create a resource** → **Web App**
2. **Configure Basics**:
   - **Name**: `jyotishconnect-app` (or choose a unique name)
   - **Publish**: Docker Container
   - **Operating System**: Linux
   - **Region**: (choose your preferred region)
   - **Plan**: B1 or higher

3. **Docker Configuration**:
   - **Image Source**: Azure Container Registry
   - **Registry**: jyotishconnect
   - **Image and Tag**: frontend:latest
   - **Port**: 80

### 6.2. Add the Backend Sidecar Container

1. Go to your App Service → **Container settings**
2. **Add Sidecar Container**:
   - **Name**: backend
   - **Image Source**: Azure Container Registry
   - **Registry**: jyotishconnect
   - **Image and Tag**: backend:latest
   - **Port**: 7000

### 6.3. Environment Variables & Application Settings

Add these environment variables in **Configuration** → **Application settings**:

| Key | Value |
|-----|-------|
| `MONGODB_URL` | Your MongoDB connection string |
| `NODE_ENV` | production |
| `FRONTEND_URL` | https://jyotishconnect-app.azurewebsites.net |
| `JWT_SECRET` | Your JWT secret key |
| `SESSION_SECRET` | Your session secret key |

---

## 7. Testing and Verification

### 7.1. Verify Frontend Loads
1. Navigate to: `https://jyotishconnect-app.azurewebsites.net`
2. Check that the Next.js application loads correctly
3. Open Developer Tools → Network tab to verify static assets load

### 7.2. Verify API Calls
1. Perform actions that trigger API requests
2. In DevTools → Network, check for successful `/api/v1/*` requests
3. Verify CORS headers are properly set

### 7.3. Verify Socket.io Connections
1. Test real-time features (chat, notifications)
2. Check for successful WebSocket connections in DevTools → Network → WS

### 7.4. Verify Backend Logs
1. Go to Azure Portal → App Service → **Log stream**
2. Check for proper server startup messages
3. Monitor for any errors or connection issues

---

## 8. CI/CD Recommendation

Create a GitHub Actions workflow in `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure App Service

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Login to Azure
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}
    
    - name: Login to ACR
      run: az acr login --name jyotishconnect
    
    - name: Build and push backend
      run: |
        cd server
        docker build -t jyotishconnect.azurecr.io/backend:${{ github.sha }} .
        docker push jyotishconnect.azurecr.io/backend:${{ github.sha }}
    
    - name: Build and push frontend  
      run: |
        cd client
        docker build -t jyotishconnect.azurecr.io/frontend:${{ github.sha }} .
        docker push jyotishconnect.azurecr.io/frontend:${{ github.sha }}
    
    - name: Deploy to App Service
      run: |
        az webapp config container set \
          --name jyotishconnect-app \
          --resource-group myResourceGroup \
          --docker-custom-image-name jyotishconnect.azurecr.io/frontend:${{ github.sha }}
        
        az webapp restart --name jyotishconnect-app --resource-group myResourceGroup
```

---

## 9. Appendix: Full File Listings

### 9.1. `/server/Dockerfile`
```dockerfile
# =========================
# Backend Dockerfile  
# =========================
FROM node:18-alpine

# 1. Create and set working directory
WORKDIR /usr/src/app

# 2. Copy package.json and package-lock.json for dependency installation
COPY package*.json ./

# 3. Install only production dependencies
RUN npm ci --only=production

# 4. Copy all backend source code
COPY . .

# 5. Expose port 7000 (updated to match your current setup)
EXPOSE 7000

# 6. Healthcheck (optional but recommended)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:7000', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# 7. Start the application
CMD ["node", "index.js"]
```

### 9.2. `/client/nginx.conf`
```nginx
# ================================
# File: nginx.conf
# ================================
worker_processes 1;
events { worker_connections 1024; }

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    keepalive_timeout  65;

    server {
        listen       80;
        server_name  _;

        root   /usr/share/nginx/html;
        index  index.html;

        # ─── SERVE STATIC FILES OR FALLBACK TO INDEX.HTML ───
        location / {
            try_files $uri $uri/ /index.html;
        }

        # ─── SERVE NEXT.JS STATIC ASSETS ───
        location /_next/static/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # ─── PROXY /API CALLS TO BACKEND SIDECAR ─── 
        location /api/v1/ {
            proxy_pass         http://127.0.0.1:7000/api/v1/;
            proxy_http_version 1.1;
            proxy_set_header   Upgrade $http_upgrade;
            proxy_set_header   Connection "upgrade";
            proxy_set_header   Host $host;
            proxy_set_header   X-Real-IP $remote_addr;
            proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header   X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # ─── PROXY SOCKET.IO CALLS TO BACKEND SIDECAR ───
        location /socket.io/ {
            proxy_pass         http://127.0.0.1:7000/socket.io/;
            proxy_http_version 1.1;
            proxy_set_header   Upgrade $http_upgrade;
            proxy_set_header   Connection "upgrade";
            proxy_set_header   Host $host;
            proxy_set_header   X-Real-IP $remote_addr;
            proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header   X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

### 9.3. `/client/Dockerfile`
```dockerfile
# ============================
# Frontend Dockerfile (Next.js)
# ============================

########################################
# STAGE 1: BUILD WITH NODE + NEXT.JS
########################################
FROM node:18-alpine AS builder
WORKDIR /app

# 1) Copy package.json / package-lock.json and install dependencies
COPY package*.json ./
RUN npm ci

# 2) Copy all frontend source code
COPY . .

# 3) Set environment variables for production build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV API_URL=/api/v1
ENV SOCKET_URL=

# 4) Run Next.js build → outputs to /app/out
RUN npm run build

########################################
# STAGE 2: SERVE VIA NGINX
########################################
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# 1) Copy built files from stage 1 (Next.js static export)
COPY --from=builder /app/out ./

# 2) Copy custom nginx.conf into /etc/nginx
COPY nginx.conf /etc/nginx/nginx.conf

# 3) Expose port 80 (nginx default)
EXPOSE 80

# 4) Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

---

## Important Notes

1. **Replace placeholders**: Update `your-app-name.azurewebsites.net` with your actual Azure App Service domain
2. **Environment variables**: Ensure all required environment variables are set in Azure App Service
3. **MongoDB connection**: Make sure your MongoDB allows connections from Azure
4. **CORS origins**: Update the CORS configuration in `server/app.js` with your production domain
5. **Socket.io fallback**: If WebSocket connections fail, Socket.io will fall back to HTTP polling

Your Next.js application is now ready for deployment on Azure App Service! 🚀 