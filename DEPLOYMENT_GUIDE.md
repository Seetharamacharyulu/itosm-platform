# ITOSM Platform Docker Deployment Guide

## Complete Step-by-Step Docker Deployment for Beginners

This guide will walk you through deploying the ITOSM Platform using Docker Desktop on Windows and pushing to Docker Hub.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Local Development](#local-development)
4. [Production Deployment](#production-deployment)
5. [Docker Hub Deployment](#docker-hub-deployment)
6. [Troubleshooting](#troubleshooting)
7. [Maintenance](#maintenance)

---

## Prerequisites

### Required Software
1. **Docker Desktop for Windows**
   - Download from: https://www.docker.com/products/docker-desktop
   - Minimum requirements: Windows 10 64-bit Pro, Enterprise, or Education
   - Enable WSL 2 backend during installation

2. **Git for Windows**
   - Download from: https://git-scm.com/download/win

3. **Text Editor**
   - VS Code (recommended): https://code.visualstudio.com/
   - Or any text editor of your choice

### Docker Hub Account
1. Create account at: https://hub.docker.com/
2. Choose your username (you'll need this for image naming)
3. Verify your email address

---

## Initial Setup

### Step 1: Install Docker Desktop

1. **Download and Install:**
   ```
   1. Download Docker Desktop from official website
   2. Run the installer as Administrator
   3. Follow installation wizard
   4. Restart computer when prompted
   ```

2. **Verify Installation:**
   ```cmd
   docker --version
   docker-compose --version
   ```

3. **Start Docker Desktop:**
   - Look for Docker icon in system tray
   - Wait for "Docker Desktop is running" message

### Step 2: Download the Application

You have several options to get the application files:

**Option A: Clone from Repository (if available)**
```cmd
git clone <repository-url>
cd itosm-platform
```

**Option B: Download ZIP File**
1. Download the application ZIP file
2. Extract to your desired folder (e.g., `C:\Projects\itosm-platform`)
3. Open Command Prompt in that folder

### Step 3: Project Structure

Your project should have this structure:
```
itosm-platform/
├── client/                 # React frontend
├── server/                 # Node.js backend
├── shared/                 # Shared TypeScript types
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Multi-service setup
├── .dockerignore          # Files to ignore in Docker
├── nginx.conf             # Nginx configuration
├── .env.example           # Environment template
└── package.json           # Dependencies
```

---

## Local Development

### Step 1: Environment Configuration

1. **Copy Environment Template:**
   ```cmd
   copy .env.example .env
   ```

2. **Edit `.env` file** with your settings:
   ```env
   # Database Configuration
   POSTGRES_DB=itosm_db
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your_secure_password
   
   # Application Configuration
   NODE_ENV=development
   PORT=5000
   SESSION_SECRET=your_session_secret_here
   ```

### Step 2: Build and Run Locally

1. **Build the Application:**
   ```cmd
   docker-compose build
   ```

2. **Start All Services:**
   ```cmd
   docker-compose up -d
   ```

3. **View Running Containers:**
   ```cmd
   docker-compose ps
   ```

4. **Access the Application:**
   - Open browser: http://localhost:5000
   - **First-time Setup:** Create secure admin account on first access

### Step 3: Development Commands

**View Logs:**
```cmd
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f itosm_app
```

**Stop Services:**
```cmd
docker-compose down
```

**Rebuild After Changes:**
```cmd
docker-compose up --build
```

---

## Production Deployment

### Step 1: Production Environment Setup

1. **Create Production Environment File:**
   ```cmd
   copy .env .env.production
   ```

2. **Update Production Settings:**
   ```env
   NODE_ENV=production
   POSTGRES_PASSWORD=very_secure_production_password
   SESSION_SECRET=ultra_secure_session_secret_256_bit
   DOMAIN=your-domain.com
   ```

### Step 2: Production Build

1. **Build for Production:**
   ```cmd
   docker-compose -f docker-compose.yml build --no-cache
   ```

2. **Run with Production Profile:**
   ```cmd
   docker-compose --profile production up -d
   ```

### Step 3: SSL Configuration (Optional)

1. **Obtain SSL Certificates:**
   - Use Let's Encrypt: https://letsencrypt.org/
   - Or purchase from certificate authority

2. **Place Certificates:**
   ```
   Create ssl/ folder:
   ssl/
   ├── cert.pem
   └── key.pem
   ```

3. **Update nginx.conf** to enable HTTPS section

---

## Docker Hub Deployment

### Step 1: Prepare Your Image

1. **Login to Docker Hub:**
   ```cmd
   docker login
   ```
   Enter your Docker Hub username and password.

2. **Build Tagged Image:**
   ```cmd
   docker build -t yourusername/itosm-platform:latest .
   ```
   Replace `yourusername` with your actual Docker Hub username.

3. **Tag with Version:**
   ```cmd
   docker tag yourusername/itosm-platform:latest yourusername/itosm-platform:1.0
   ```

### Step 2: Push to Docker Hub

1. **Push Latest Version:**
   ```cmd
   docker push yourusername/itosm-platform:latest
   ```

2. **Push Specific Version:**
   ```cmd
   docker push yourusername/itosm-platform:1.0
   ```

3. **Verify Upload:**
   - Go to https://hub.docker.com/
   - Check your repositories
   - Your image should appear with the tags you pushed

### Step 3: Create Deployment Repository

1. **Create New Repository on Docker Hub:**
   - Repository name: `itosm-platform`
   - Description: "IT Operations and Service Management Platform"
   - Visibility: Public (or Private with paid plan)

2. **Update README on Docker Hub:**
   Add deployment instructions for users

### Step 4: Deploy from Docker Hub

Anyone can now deploy your application:

```cmd
# Pull your image
docker pull yourusername/itosm-platform:latest

# Create docker-compose.yml for deployment
version: '3.8'
services:
  database:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: itosm_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    
  app:
    image: yourusername/itosm-platform:latest
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgresql://postgres:secure_password@database:5432/itosm_db
    depends_on:
      - database

volumes:
  postgres_data:

# Run the application
docker-compose up -d
```

---

## Automated Deployment with GitHub Actions

### Step 1: Create GitHub Workflow

Create `.github/workflows/docker-build.yml`:

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Login to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKERHUB_USERNAME }}
        password: ${{ secrets.DOCKERHUB_TOKEN }}
    
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: |
          yourusername/itosm-platform:latest
          yourusername/itosm-platform:${{ github.sha }}
```

### Step 2: Setup GitHub Secrets

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Add secrets:
   - `DOCKERHUB_USERNAME`: Your Docker Hub username
   - `DOCKERHUB_TOKEN`: Docker Hub access token

---

## Troubleshooting

### Common Issues

**1. Docker Desktop Not Starting**
```cmd
# Check if Hyper-V is enabled (Windows Pro/Enterprise)
# Or ensure WSL 2 is properly installed (Windows Home)

# Restart Docker Desktop
# Windows: Right-click Docker icon → Restart
```

**2. Port Already in Use**
```cmd
# Check what's using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID)
taskkill /PID <process_id> /F

# Or change port in docker-compose.yml
ports:
  - "5001:5000"  # Use port 5001 instead
```

**3. Database Connection Issues**
```cmd
# Check if database is running
docker-compose ps

# View database logs
docker-compose logs database

# Reset database
docker-compose down -v
docker-compose up -d
```

**4. Build Failures**
```cmd
# Clear Docker cache
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache
```

**5. Permission Issues (Windows)**
```cmd
# Run Command Prompt as Administrator
# Ensure Docker Desktop has proper permissions
```

### Debugging Commands

```cmd
# Check Docker system status
docker system info

# View all containers
docker ps -a

# Enter running container
docker exec -it itosm_application bash

# View container logs
docker logs itosm_application

# Check Docker disk usage
docker system df
```

---

## Maintenance

### Regular Tasks

**1. Update Images:**
```cmd
# Pull latest images
docker-compose pull

# Restart with new images
docker-compose up -d
```

**2. Database Backup:**
```cmd
# Create backup
docker-compose exec database pg_dump -U postgres itosm_db > backup_$(date +%Y%m%d).sql

# Restore backup
docker-compose exec -T database psql -U postgres itosm_db < backup_20250120.sql
```

**3. Clean Up:**
```cmd
# Remove unused containers, networks, images
docker system prune

# Remove unused volumes (careful!)
docker volume prune
```

**4. Monitor Resources:**
```cmd
# Check resource usage
docker stats

# Check logs size
docker system df
```

### Security Updates

1. **Regular Updates:**
   - Update base images monthly
   - Monitor security advisories
   - Update dependencies regularly

2. **Backup Strategy:**
   - Daily database backups
   - Weekly full system backups
   - Test restore procedures monthly

### Performance Optimization

1. **Resource Limits:**
   ```yaml
   # Add to docker-compose.yml
   deploy:
     resources:
       limits:
         cpus: '0.50'
         memory: 512M
   ```

2. **Scaling:**
   ```cmd
   # Scale application instances
   docker-compose up --scale itosm_app=3
   ```

---

## Next Steps

1. **Setup Monitoring:**
   - Add Prometheus and Grafana
   - Configure log aggregation
   - Set up alerting

2. **Implement CI/CD:**
   - Automated testing
   - Staging environment
   - Blue-green deployments

3. **Security Hardening:**
   - Implement rate limiting
   - Add Web Application Firewall
   - Regular security scans

4. **Backup Automation:**
   - Automated daily backups
   - Off-site backup storage
   - Disaster recovery plan

---

This guide provides everything needed to deploy the ITOSM Platform using Docker. For additional support, consult the API documentation and feature guides.