# Complete End-to-End Deployment Guide: Windows Server 2025 + Docker Engine

## 🚨 Important Note
**Docker Desktop is NOT supported on Windows Server 2025**. This guide uses **Docker Engine** which is the correct solution for server environments.

## 📋 Overview
Complete deployment process: ZIP → Local Run → DB Schema → Testing → Docker Hub → Production

---

## 🔧 Phase 1: Windows Server 2025 Setup

### Prerequisites
- Windows Server 2025 (Standard/Datacenter)
- Administrator privileges
- 16GB+ RAM recommended
- 100GB+ free disk space
- Internet connectivity

### Step 1: Install Chocolatey Package Manager

**Open PowerShell as Administrator:**

```powershell
# Set execution policy
Set-ExecutionPolicy Bypass -Scope Process -Force

# Install Chocolatey
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Verify installation
choco --version
```

### Step 2: Install Required Software via Chocolatey

```powershell
# Install essential tools
choco install git -y
choco install 7zip -y
choco install docker-engine -y
choco install nodejs-lts -y
choco install postgresql15 -y

# Refresh environment variables
refreshenv
```

### Step 3: Enable Windows Container Features

```powershell
# Enable Containers feature
Enable-WindowsOptionalFeature -Online -FeatureName containers-DisposableClientVM -All -NoRestart

# Enable Hyper-V (if hardware supports it)
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All -NoRestart

# Restart required
Restart-Computer -Force
```

### Step 4: Configure Docker Engine

**After restart, configure Docker:**

```powershell
# Start Docker service
Start-Service docker
Set-Service docker -StartupType Automatic

# Add current user to docker-users group
Add-LocalGroupMember -Group "docker-users" -Member $env:USERNAME

# Create Docker daemon configuration
$dockerConfig = @{
    "data-root" = "C:\DockerData"
    "storage-driver" = "windowsfilter"
    "log-driver" = "json-file"
    "log-opts" = @{
        "max-size" = "10m"
        "max-file" = "3"
    }
}

$configPath = "C:\ProgramData\docker\config"
if (!(Test-Path $configPath)) {
    New-Item -ItemType Directory -Path $configPath -Force
}

$dockerConfig | ConvertTo-Json | Set-Content "$configPath\daemon.json"

# Restart Docker to apply configuration
Restart-Service docker

# Test Docker installation
docker version
docker run hello-world:nanoserver
```

---

## 📦 Phase 2: Application Download and Local Setup

### Step 1: Download Application ZIP

```powershell
# Create workspace directory
New-Item -ItemType Directory -Path "C:\ITOSM-Platform" -Force
Set-Location "C:\ITOSM-Platform"

# Download the application ZIP (replace URL with actual location)
# For GitHub releases:
Invoke-WebRequest -Uri "https://github.com/yourusername/itosm-platform/archive/refs/heads/main.zip" -OutFile "itosm-platform.zip"

# Extract ZIP file
Expand-Archive -Path "itosm-platform.zip" -DestinationPath "." -Force

# Navigate to extracted directory
Set-Location "itosm-platform-main"  # or whatever the extracted folder is named
```

### Step 2: Install Node.js Dependencies

```powershell
# Install application dependencies
npm install

# Verify installation
npm list --depth=0
```

### Step 3: Configure Environment Variables

```powershell
# Create production environment file
Copy-Item ".env.example" ".env"

# Edit the .env file with production values
# Use notepad or your preferred editor
notepad .env
```

**Example .env configuration:**
```env
# Database Configuration - Production
POSTGRES_DB=itosm_production
POSTGRES_USER=postgres
POSTGRES_PASSWORD=YourSecurePassword123!
APP_DB_USER=itosm_app
APP_DB_PASSWORD=AppUserPassword456!
DATABASE_URL=postgresql://itosm_app:AppUserPassword456!@localhost:5432/itosm_production

# Application Configuration
NODE_ENV=production
PORT=5000
SESSION_SECRET=your-super-secure-session-secret-64-characters-1234567890abcdef

# Object Storage (if needed)
DEFAULT_OBJECT_STORAGE_BUCKET_ID=
PRIVATE_OBJECT_DIR=.private
PUBLIC_OBJECT_SEARCH_PATHS=public
```

---

## 🗄️ Phase 3: Database Setup and Schema Creation

### Step 1: Configure PostgreSQL

```powershell
# Start PostgreSQL service
Start-Service postgresql-x64-15
Set-Service postgresql-x64-15 -StartupType Automatic

# Create PostgreSQL superuser password
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -c "ALTER USER postgres PASSWORD 'YourSecurePassword123!';"
```

### Step 2: Create Database and Application User

```powershell
# Connect to PostgreSQL and create database
& "C:\Program Files\PostgreSQL\15\bin\createdb.exe" -U postgres itosm_production

# Create SQL script for user setup
@"
-- Create application user with least privileges
DO `$`$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'itosm_app') THEN
        CREATE ROLE itosm_app WITH LOGIN PASSWORD 'AppUserPassword456!';
    END IF;
END
`$`$;

-- Secure the database and public schema
REVOKE CONNECT ON DATABASE itosm_production FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

-- Grant minimal required permissions for application
GRANT CONNECT ON DATABASE itosm_production TO itosm_app;
GRANT USAGE ON SCHEMA public TO itosm_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO itosm_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO itosm_app;

-- Grant permissions on future tables and sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO itosm_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO itosm_app;
"@ | Set-Content "setup-db-user.sql"

# Execute the SQL script
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d itosm_production -f "setup-db-user.sql"
```

### Step 3: Run Database Migrations

```powershell
# Run Drizzle migrations to create schema
npm run db:push

# Verify tables were created
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d itosm_production -c "\dt"
```

### Step 4: Insert Sample Data

Create sample data insertion script:

```powershell
# Create sample data SQL script
@"
-- Insert sample software categories
INSERT INTO software (id, name, category, description, version, license_type, support_level, installation_guide) VALUES
('uuid-generate-v4()', 'Microsoft Office 365', 'Productivity', 'Complete office suite with Word, Excel, PowerPoint, and Outlook', '2024', 'Commercial', 'Enterprise', 'Managed through Microsoft 365 Admin Center'),
('uuid-generate-v4()', 'Adobe Creative Suite', 'Design', 'Professional creative software including Photoshop, Illustrator, and InDesign', '2024', 'Commercial', 'Professional', 'Download from Adobe Creative Cloud'),
('uuid-generate-v4()', 'Slack', 'Communication', 'Team collaboration and messaging platform', '4.34.0', 'Freemium', 'Standard', 'Download from official website or app store'),
('uuid-generate-v4()', 'Zoom', 'Communication', 'Video conferencing and virtual meeting software', '5.15.0', 'Freemium', 'Standard', 'Download from zoom.us and create account'),
('uuid-generate-v4()', 'AutoCAD', 'Engineering', 'Computer-aided design software for 2D and 3D design', '2024', 'Commercial', 'Professional', 'License required from Autodesk'),
('uuid-generate-v4()', 'Visual Studio Code', 'Development', 'Lightweight but powerful source code editor', '1.82.0', 'Free', 'Community', 'Download from code.visualstudio.com'),
('uuid-generate-v4()', 'TeamViewer', 'Remote Access', 'Remote desktop access and support software', '15.44.0', 'Freemium', 'Professional', 'Download from teamviewer.com'),
('uuid-generate-v4()', 'VPN Client', 'Security', 'Corporate VPN client for secure remote access', '3.4.0', 'Commercial', 'Enterprise', 'Contact IT department for installation package');

-- Insert demo users (using header-based auth)
-- Note: The application uses header-based authentication
-- Users are identified by Employee ID and Username passed via headers

-- Insert sample tickets
INSERT INTO tickets (id, title, description, priority, status, software_requested, requester_employee_id, requester_username, created_at, updated_at) VALUES
('uuid-generate-v4()', 'Microsoft Office Installation Request', 'Need Microsoft Office 365 installed on new laptop for accounting department', 'medium', 'open', 'Microsoft Office 365', 'EMP001', 'john.smith', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('uuid-generate-v4()', 'Adobe Creative Suite Access', 'Requesting Adobe Creative Suite license for marketing team member', 'high', 'in_progress', 'Adobe Creative Suite', 'EMP002', 'sarah.johnson', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('uuid-generate-v4()', 'VPN Setup Required', 'Employee working remotely needs VPN client configured', 'high', 'open', 'VPN Client', 'EMP003', 'mike.davis', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('uuid-generate-v4()', 'AutoCAD License Renewal', 'Current AutoCAD license expires next month, need renewal', 'medium', 'pending', 'AutoCAD', 'EMP004', 'lisa.wilson', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('uuid-generate-v4()', 'Slack Integration Setup', 'Need Slack configured for new project team communication', 'low', 'resolved', 'Slack', 'EMP005', 'david.brown', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
"@ | Set-Content "sample-data.sql"

# Insert sample data
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d itosm_production -f "sample-data.sql"

# Verify data insertion
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d itosm_production -c "SELECT COUNT(*) FROM software;"
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d itosm_production -c "SELECT COUNT(*) FROM tickets;"
```

---

## 🚀 Phase 4: Local Application Testing

### Step 1: Start the Application

```powershell
# Start the application in development mode first
npm run dev

# The application should be available at http://localhost:5000
```

### Step 2: API Endpoint Testing

Create PowerShell test script:

```powershell
# Create API testing script
@"
# API Testing Script for ITOSM Platform

# Test health endpoint
Write-Host "Testing Health Endpoint..." -ForegroundColor Green
try {
    `$response = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET
    Write-Host "Health Check: " -NoNewline
    Write-Host "PASSED" -ForegroundColor Green
    Write-Host "Response: `$(`$response | ConvertTo-Json)"
} catch {
    Write-Host "Health Check: " -NoNewline
    Write-Host "FAILED" -ForegroundColor Red
    Write-Host "Error: `$(`$_.Exception.Message)"
}

Write-Host ""

# Test software list endpoint
Write-Host "Testing Software List Endpoint..." -ForegroundColor Green
try {
    `$headers = @{
        'x-user-id' = 'EMP001'
        'x-username' = 'john.smith'
        'x-is-admin' = 'false'
    }
    `$response = Invoke-RestMethod -Uri "http://localhost:5000/api/software" -Method GET -Headers `$headers
    Write-Host "Software List: " -NoNewline
    Write-Host "PASSED" -ForegroundColor Green
    Write-Host "Found `$(`$response.Count) software items"
} catch {
    Write-Host "Software List: " -NoNewline
    Write-Host "FAILED" -ForegroundColor Red
    Write-Host "Error: `$(`$_.Exception.Message)"
}

Write-Host ""

# Test tickets list endpoint
Write-Host "Testing Tickets List Endpoint..." -ForegroundColor Green
try {
    `$headers = @{
        'x-user-id' = 'EMP001'
        'x-username' = 'john.smith'
        'x-is-admin' = 'false'
    }
    `$response = Invoke-RestMethod -Uri "http://localhost:5000/api/tickets" -Method GET -Headers `$headers
    Write-Host "Tickets List: " -NoNewline
    Write-Host "PASSED" -ForegroundColor Green
    Write-Host "Found `$(`$response.Count) tickets"
} catch {
    Write-Host "Tickets List: " -NoNewline
    Write-Host "FAILED" -ForegroundColor Red
    Write-Host "Error: `$(`$_.Exception.Message)"
}

Write-Host ""

# Test ticket creation
Write-Host "Testing Ticket Creation..." -ForegroundColor Green
try {
    `$headers = @{
        'x-user-id' = 'EMP006'
        'x-username' = 'test.user'
        'x-is-admin' = 'false'
        'Content-Type' = 'application/json'
    }
    `$body = @{
        title = "Test Ticket from PowerShell"
        description = "This is a test ticket created via API testing"
        priority = "medium"
        software_requested = "Visual Studio Code"
    } | ConvertTo-Json
    
    `$response = Invoke-RestMethod -Uri "http://localhost:5000/api/tickets" -Method POST -Headers `$headers -Body `$body
    Write-Host "Ticket Creation: " -NoNewline
    Write-Host "PASSED" -ForegroundColor Green
    Write-Host "Created ticket ID: `$(`$response.id)"
} catch {
    Write-Host "Ticket Creation: " -NoNewline
    Write-Host "FAILED" -ForegroundColor Red
    Write-Host "Error: `$(`$_.Exception.Message)"
}

Write-Host ""
Write-Host "API Testing Complete!" -ForegroundColor Cyan
"@ | Set-Content "test-api.ps1"

# Run API tests
powershell -ExecutionPolicy Bypass -File "test-api.ps1"
```

### Step 3: Web Interface Testing

```powershell
# Open web browser to test the interface
Start-Process "http://localhost:5000"

Write-Host "Web interface should be available at http://localhost:5000" -ForegroundColor Green
Write-Host "Test the following functionality:" -ForegroundColor Yellow
Write-Host "1. Authentication (use employee ID and username)" -ForegroundColor White
Write-Host "2. Create a new ticket" -ForegroundColor White
Write-Host "3. View tickets list" -ForegroundColor White
Write-Host "4. Admin functions (if testing admin account)" -ForegroundColor White
```

---

## 🐳 Phase 5: Docker Containerization

### Step 1: Build Docker Image

```powershell
# Stop the development server first
# Press Ctrl+C in the development server terminal

# Build the Docker image
docker build -t itosm-platform:latest -f Dockerfile .

# Verify the image was built
docker images | Select-String "itosm-platform"
```

### Step 2: Test Docker Container Locally

```powershell
# Create a Docker network for the application
docker network create itosm-network

# Run PostgreSQL container
docker run -d `
  --name itosm-postgres `
  --network itosm-network `
  -e POSTGRES_DB=itosm_production `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=YourSecurePassword123! `
  -p 5432:5432 `
  postgres:15-alpine

# Wait for PostgreSQL to be ready
Start-Sleep -Seconds 30

# Run database setup in the container
docker exec itosm-postgres psql -U postgres -d itosm_production -c "
DO `$`$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'itosm_app') THEN
        CREATE ROLE itosm_app WITH LOGIN PASSWORD 'AppUserPassword456!';
    END IF;
END
`$`$;
REVOKE CONNECT ON DATABASE itosm_production FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT CONNECT ON DATABASE itosm_production TO itosm_app;
GRANT USAGE ON SCHEMA public TO itosm_app;
"

# Run the application container
docker run -d `
  --name itosm-app `
  --network itosm-network `
  -e NODE_ENV=production `
  -e DATABASE_URL="postgresql://itosm_app:AppUserPassword456!@itosm-postgres:5432/itosm_production" `
  -e PORT=5000 `
  -e SESSION_SECRET="your-super-secure-session-secret-64-characters-1234567890abcdef" `
  -p 5000:5000 `
  itosm-platform:latest

# Check container logs
docker logs itosm-app

# Test the containerized application
Start-Sleep -Seconds 10
Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET
```

---

## 📤 Phase 6: Docker Hub Deployment

### Step 1: Create Docker Hub Repository

1. Go to [hub.docker.com](https://hub.docker.com)
2. Sign in or create an account
3. Click "Create Repository"
4. Repository name: `itosm-platform`
5. Set visibility (Public or Private)
6. Click "Create"

### Step 2: Tag and Push Image

```powershell
# Login to Docker Hub
docker login
# Enter your Docker Hub username and password

# Tag the image for Docker Hub
docker tag itosm-platform:latest yourdockerhubusername/itosm-platform:latest
docker tag itosm-platform:latest yourdockerhubusername/itosm-platform:v1.0.0

# Push to Docker Hub
docker push yourdockerhubusername/itosm-platform:latest
docker push yourdockerhubusername/itosm-platform:v1.0.0

Write-Host "Image successfully pushed to Docker Hub!" -ForegroundColor Green
```

---

## 🏭 Phase 7: Production Deployment (Pull-Only)

### Step 1: Clean Production Environment Setup

```powershell
# Stop and remove any existing containers
docker stop itosm-app itosm-postgres 2>$null
docker rm itosm-app itosm-postgres 2>$null

# Create production directory
New-Item -ItemType Directory -Path "C:\Production\ITOSM" -Force
Set-Location "C:\Production\ITOSM"
```

### Step 2: Create Production Docker Compose

```powershell
# Create production docker-compose.yml
@"
version: '3.8'

services:
  database:
    image: postgres:15-alpine
    container_name: itosm_database_prod
    restart: always
    environment:
      POSTGRES_DB: itosm_production
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: YourSecurePassword123!
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - itosm_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d itosm_production"]
      interval: 30s
      timeout: 10s
      retries: 5

  migrations:
    image: yourdockerhubusername/itosm-platform:latest
    container_name: itosm_migrations_prod
    restart: "no"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:YourSecurePassword123!@database:5432/itosm_production
    depends_on:
      database:
        condition: service_healthy
    command: ["sh", "-c", "npm run db:push && echo 'Migrations completed'"]
    networks:
      - itosm_network

  app:
    image: yourdockerhubusername/itosm-platform:latest
    container_name: itosm_app_prod
    restart: always
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://itosm_app:AppUserPassword456!@database:5432/itosm_production
      PORT: 5000
      SESSION_SECRET: your-super-secure-session-secret-64-characters-1234567890abcdef
    ports:
      - "5000:5000"
    depends_on:
      database:
        condition: service_healthy
      migrations:
        condition: service_completed_successfully
    networks:
      - itosm_network
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:5000/api/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  itosm_network:
    driver: bridge

volumes:
  postgres_data:
    driver: local
"@ | Set-Content "docker-compose.yml"
```

### Step 3: Create Database Initialization Script

```powershell
# Create init script for database user
@"
#!/bin/bash
set -e

# Wait for PostgreSQL to be ready
until pg_isready -h database -U postgres; do
  echo "Waiting for PostgreSQL to be ready..."
  sleep 2
done

# Create application user
echo "Creating application database user..."
PGPASSWORD="`$POSTGRES_PASSWORD" psql -h database -U postgres -d "`$POSTGRES_DB" <<-EOSQL
    DO `$`$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'itosm_app') THEN
            CREATE ROLE itosm_app WITH LOGIN PASSWORD 'AppUserPassword456!';
        END IF;
    END
    `$`$;

    REVOKE CONNECT ON DATABASE `$POSTGRES_DB FROM PUBLIC;
    REVOKE CREATE ON SCHEMA public FROM PUBLIC;
    
    GRANT CONNECT ON DATABASE `$POSTGRES_DB TO itosm_app;
    GRANT USAGE ON SCHEMA public TO itosm_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO itosm_app;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO itosm_app;
    
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO itosm_app;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO itosm_app;
EOSQL

echo "Database user setup completed"
"@ | Set-Content "init-db-user.sh"
```

### Step 4: Deploy Production Environment

```powershell
# Pull latest images
docker-compose pull

# Start production environment
docker-compose up -d

# Wait for services to be ready
Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

# Check service health
docker-compose ps

# Insert sample data into production
docker exec itosm_database_prod psql -U postgres -d itosm_production -f - <<'EOF'
-- Insert sample software if not exists
INSERT INTO software (id, name, category, description, version, license_type, support_level, installation_guide) 
SELECT uuid_generate_v4(), 'Microsoft Office 365', 'Productivity', 'Complete office suite', '2024', 'Commercial', 'Enterprise', 'Managed installation'
WHERE NOT EXISTS (SELECT 1 FROM software WHERE name = 'Microsoft Office 365');

-- Add more sample data as needed
EOF

Write-Host "Production deployment completed!" -ForegroundColor Green
Write-Host "Application available at: http://localhost:5000" -ForegroundColor Cyan
```

---

## 🔍 Phase 8: Verification and Monitoring

### Step 1: Comprehensive Testing

```powershell
# Create comprehensive test script
@"
Write-Host "=== PRODUCTION VERIFICATION TESTS ===" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "`n1. Health Check..." -ForegroundColor Yellow
try {
    `$health = Invoke-RestMethod -Uri "http://localhost:5000/api/health"
    Write-Host "   ✓ Health check passed" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Health check failed: `$(`$_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Database Connection
Write-Host "`n2. Database Connection..." -ForegroundColor Yellow
try {
    `$dbTest = docker exec itosm_database_prod psql -U postgres -d itosm_production -c "SELECT version();" -t
    Write-Host "   ✓ Database connection successful" -ForegroundColor Green
    Write-Host "   PostgreSQL Version: `$(`$dbTest.Trim())" -ForegroundColor White
} catch {
    Write-Host "   ✗ Database connection failed" -ForegroundColor Red
}

# Test 3: API Endpoints
Write-Host "`n3. API Endpoints..." -ForegroundColor Yellow
`$headers = @{
    'x-user-id' = 'EMP001'
    'x-username' = 'test.user'
    'x-is-admin' = 'false'
}

try {
    `$software = Invoke-RestMethod -Uri "http://localhost:5000/api/software" -Headers `$headers
    Write-Host "   ✓ Software API working - Found `$(`$software.Count) items" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Software API failed" -ForegroundColor Red
}

try {
    `$tickets = Invoke-RestMethod -Uri "http://localhost:5000/api/tickets" -Headers `$headers
    Write-Host "   ✓ Tickets API working - Found `$(`$tickets.Count) items" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Tickets API failed" -ForegroundColor Red
}

# Test 4: Container Health
Write-Host "`n4. Container Health..." -ForegroundColor Yellow
`$containers = docker-compose ps --format "table {{.Name}}\t{{.State}}\t{{.Status}}"
Write-Host `$containers

Write-Host "`n=== VERIFICATION COMPLETE ===" -ForegroundColor Cyan
"@ | Set-Content "verify-production.ps1"

# Run verification tests
powershell -ExecutionPolicy Bypass -File "verify-production.ps1"
```

### Step 2: Setup Monitoring and Logs

```powershell
# Create log monitoring script
@"
Write-Host "=== MONITORING SETUP ===" -ForegroundColor Cyan

# Create logs directory
New-Item -ItemType Directory -Path "logs" -Force

# Function to collect logs
function Collect-Logs {
    `$timestamp = Get-Date -Format "yyyy-MM-dd-HH-mm-ss"
    
    Write-Host "Collecting application logs..." -ForegroundColor Yellow
    docker logs itosm_app_prod > "logs/app-`$timestamp.log" 2>&1
    
    Write-Host "Collecting database logs..." -ForegroundColor Yellow
    docker logs itosm_database_prod > "logs/database-`$timestamp.log" 2>&1
    
    Write-Host "Logs saved to logs/ directory" -ForegroundColor Green
}

# Collect initial logs
Collect-Logs

# Create monitoring task
Write-Host "`nSetting up monitoring task..." -ForegroundColor Yellow
`$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File `"`$PWD\collect-logs.ps1`""
`$trigger = New-ScheduledTaskTrigger -Daily -At 2AM
`$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
`$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount

try {
    Register-ScheduledTask -TaskName "ITOSM-LogCollection" -Action `$action -Trigger `$trigger -Settings `$settings -Principal `$principal -Force
    Write-Host "   ✓ Daily log collection task created" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Failed to create scheduled task: `$(`$_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== MONITORING SETUP COMPLETE ===" -ForegroundColor Cyan
"@ | Set-Content "setup-monitoring.ps1"

# Run monitoring setup
powershell -ExecutionPolicy Bypass -File "setup-monitoring.ps1"
```

---

## 📚 Summary and Maintenance

### ✅ Deployment Checklist

- [x] Windows Server 2025 configured with Chocolatey and Docker Engine
- [x] PostgreSQL database with proper user privileges
- [x] Application tested locally and containerized
- [x] Docker image pushed to Docker Hub
- [x] Production environment deployed with docker-compose
- [x] Sample data inserted and verified
- [x] API endpoints tested and working
- [x] Monitoring and logging configured

### 🔧 Maintenance Commands

```powershell
# Update application from Docker Hub
cd C:\Production\ITOSM
docker-compose pull
docker-compose up -d

# Backup database
docker exec itosm_database_prod pg_dump -U postgres itosm_production > "backup-$(Get-Date -Format 'yyyy-MM-dd').sql"

# View logs
docker-compose logs -f app
docker-compose logs -f database

# Check service status
docker-compose ps
docker stats

# Restart services
docker-compose restart app
docker-compose restart database
```

### 🚨 Troubleshooting

**Common Issues:**

1. **Docker service won't start:**
   ```powershell
   Restart-Service docker
   Get-EventLog -LogName Application -Source Docker -Newest 10
   ```

2. **Database connection failed:**
   ```powershell
   docker exec itosm_database_prod pg_isready -U postgres
   docker logs itosm_database_prod
   ```

3. **Application won't start:**
   ```powershell
   docker logs itosm_app_prod
   docker exec itosm_app_prod npm run health-check
   ```

4. **Port conflicts:**
   ```powershell
   netstat -an | Select-String ":5000"
   Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess
   ```

### 🔐 Security Notes

- Change all default passwords in production
- Use strong, unique passwords for database users
- Consider using Windows Firewall to restrict access
- Regularly update Docker images for security patches
- Monitor logs for suspicious activity
- Implement backup procedures for data protection

---

## 🎯 Next Steps

1. **SSL/HTTPS Setup:** Configure SSL certificates for secure access
2. **Load Balancing:** Add nginx for load balancing and SSL termination
3. **Backup Strategy:** Implement automated database backups
4. **Monitoring:** Add comprehensive monitoring with alerts
5. **CI/CD Pipeline:** Automate deployments with GitHub Actions
6. **High Availability:** Configure multiple app instances

Your ITOSM Platform is now successfully deployed on Windows Server 2025 and ready for production use!