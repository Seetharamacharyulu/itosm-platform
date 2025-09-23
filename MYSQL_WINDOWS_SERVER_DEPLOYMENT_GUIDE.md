# Complete MySQL Windows Server Deployment Guide
## End-to-End ITOSM Platform with MySQL Database

---

## 🚨 Important Windows Server Compatibility Notes

**Windows Server 2000:** End of life since 2010, not secure for production use.
**Recommended:** Windows Server 2019/2022/2025 for modern security and MySQL compatibility.

This guide supports **Windows Server 2019, 2022, and 2025** with MySQL 8.0+ for optimal performance and security.

---

## 📋 Phase 1: Windows Server Environment Setup

### Prerequisites
- Windows Server 2019/2022/2025 (Standard/Datacenter/Core)
- Administrator privileges
- 8GB+ RAM (16GB recommended)
- 100GB+ free disk space
- Internet connectivity

### Step 1: Install Chocolatey Package Manager

**Open PowerShell as Administrator:**

```powershell
# Enable script execution
Set-ExecutionPolicy Bypass -Scope Process -Force

# Install Chocolatey
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Verify installation
choco --version
Write-Host "Chocolatey installed successfully!" -ForegroundColor Green
```

### Step 2: Install Required Software

```powershell
# Install essential tools and runtimes
choco install git -y
choco install 7zip -y
choco install nodejs-lts -y
choco install mysql -y
choco install mysql.workbench -y  # Optional: GUI management
choco install docker-desktop -y   # For containerization (optional)

# Refresh environment variables
refreshenv

# Verify installations
node --version
npm --version
mysql --version
```

---

## 🗄️ Phase 2: MySQL Database Setup

### Step 1: Configure MySQL Service

```powershell
# Start MySQL service
Start-Service MySQL80  # or MySQL57 depending on version
Set-Service MySQL80 -StartupType Automatic

# Verify MySQL is running
Get-Service MySQL80
```

### Step 2: Secure MySQL Installation

```powershell
# Connect to MySQL as root (default password may be blank)
mysql -u root -p

# Or if using MySQL Workbench, connect via GUI with:
# Host: localhost
# Port: 3306
# Username: root
```

**Execute these MySQL commands:**

```sql
-- Secure the root account
ALTER USER 'root'@'localhost' IDENTIFIED BY 'SecureRootPassword123!';

-- Create production database
CREATE DATABASE itosm_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create application user with specific privileges
CREATE USER 'itosm_admin'@'localhost' IDENTIFIED BY 'AdminPassword456!';
CREATE USER 'itosm_app'@'localhost' IDENTIFIED BY 'AppPassword789!';

-- Grant privileges
GRANT ALL PRIVILEGES ON itosm_production.* TO 'itosm_admin'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON itosm_production.* TO 'itosm_app'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Verify users
SELECT User, Host FROM mysql.user WHERE User LIKE 'itosm_%';

-- Exit MySQL
EXIT;
```

### Step 3: Verify Database Setup

```powershell
# Test admin user connection
mysql -u itosm_admin -p itosm_production

# Test app user connection  
mysql -u itosm_app -p itosm_production

# Show databases
SHOW DATABASES;
USE itosm_production;
SHOW TABLES;  # Should be empty initially
EXIT;
```

---

## 📦 Phase 3: Application Download and Setup

### Step 1: Download and Extract Application

```powershell
# Create application directory
New-Item -ItemType Directory -Path "C:\ITOSM-Platform" -Force
Set-Location "C:\ITOSM-Platform"

# Download application (replace URL with your source)
# Option 1: From ZIP file
Invoke-WebRequest -Uri "https://github.com/yourusername/itosm-platform/archive/main.zip" -OutFile "itosm.zip"
Expand-Archive -Path "itosm.zip" -DestinationPath "." -Force
Set-Location "itosm-platform-main"

# Option 2: From Git repository
git clone https://github.com/yourusername/itosm-platform.git
Set-Location "itosm-platform"
```

### Step 2: Install Dependencies

```powershell
# Install Node.js dependencies
npm install

# Install MySQL-specific dependencies (if not already included)
npm install mysql2 drizzle-orm

# Verify installation
npm list --depth=0
```

### Step 3: Configure Environment

```powershell
# Copy environment template
Copy-Item ".env.example" ".env"

# Edit environment file with production values
notepad .env
```

**Edit .env file with these values:**

```env
# Database Configuration - MySQL Production
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=itosm_production
MYSQL_USER=itosm_admin
MYSQL_PASSWORD=AdminPassword456!
DATABASE_URL=mysql://itosm_admin:AdminPassword456!@localhost:3306/itosm_production

# Application Configuration
NODE_ENV=development
PORT=5000
SESSION_SECRET=your-super-secure-session-secret-must-be-at-least-32-characters-long

# Optional: Object Storage Configuration
DEFAULT_OBJECT_STORAGE_BUCKET_ID=
PRIVATE_OBJECT_DIR=.private
PUBLIC_OBJECT_SEARCH_PATHS=public
```

---

## 🏗️ Phase 4: Database Schema Creation

### Step 1: Run Database Migrations

```powershell
# Push schema to MySQL database
npm run db:push

# If you get errors, try force push
npm run db:push --force

# Verify tables were created
mysql -u itosm_admin -p itosm_production -e "SHOW TABLES;"
```

### Step 2: Insert Sample Data

Create sample data SQL file:

```powershell
# Create sample data insertion script
@"
-- Insert sample software catalog items
USE itosm_production;

INSERT INTO software_catalog (name, version) VALUES
('Microsoft Office 365', '2024'),
('Adobe Creative Suite', '2024'),
('Slack', '4.34.0'),
('Zoom', '5.15.0'),
('AutoCAD', '2024'),
('Visual Studio Code', '1.82.0'),
('TeamViewer', '15.44.0'),
('VPN Client', '3.4.0'),
('Google Chrome', 'Latest'),
('Mozilla Firefox', 'Latest');

-- Insert sample users (using simplified auth model)
INSERT INTO users (username, employee_id, is_admin, password) VALUES
('admin', 'ADMIN001', 1, 'AdminPass123!'),
('john.smith', 'EMP001', 0, NULL),
('sarah.johnson', 'EMP002', 0, NULL),
('mike.davis', 'EMP003', 0, NULL),
('lisa.wilson', 'EMP004', 0, NULL),
('david.brown', 'EMP005', 0, NULL);

-- Insert sample tickets
INSERT INTO tickets (ticket_id, user_id, request_type, software_id, description, status) VALUES
('TIC-001', 2, 'Installation', 1, 'Need Microsoft Office 365 installed on new laptop for accounting department', 'Start'),
('TIC-002', 3, 'License', 2, 'Requesting Adobe Creative Suite license for marketing team member', 'In Progress'),
('TIC-003', 4, 'Setup', 8, 'Employee working remotely needs VPN client configured', 'Start'),
('TIC-004', 5, 'Renewal', 5, 'Current AutoCAD license expires next month, need renewal', 'Pending'),
('TIC-005', 6, 'Installation', 4, 'Need Slack configured for new project team communication', 'Completed');

-- Insert sample ticket history
INSERT INTO ticket_history (ticket_id, status, notes) VALUES
(1, 'Start', 'Ticket created - Office installation request'),
(2, 'Start', 'Adobe license request submitted'),
(2, 'In Progress', 'Approved by manager, processing license'),
(3, 'Start', 'VPN setup request for remote employee'),
(4, 'Pending', 'License renewal request pending budget approval'),
(5, 'Start', 'Slack setup request'),
(5, 'Completed', 'Slack successfully configured and user trained');

-- Verify data insertion
SELECT 'Software Catalog' as TableName, COUNT(*) as RecordCount FROM software_catalog
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Tickets', COUNT(*) FROM tickets
UNION ALL
SELECT 'Ticket History', COUNT(*) FROM ticket_history;
"@ | Set-Content "sample-data.sql"

# Execute sample data insertion
mysql -u itosm_admin -p itosm_production < sample-data.sql

# Verify data was inserted
mysql -u itosm_admin -p itosm_production -e "SELECT COUNT(*) as 'Total Tickets' FROM tickets;"
mysql -u itosm_admin -p itosm_production -e "SELECT COUNT(*) as 'Total Software' FROM software_catalog;"
mysql -u itosm_admin -p itosm_production -e "SELECT COUNT(*) as 'Total Users' FROM users;"
```

---

## 🚀 Phase 5: Application Testing

### Step 1: Start the Application

```powershell
# Start application in development mode
npm run dev

# Application should start on http://localhost:5000
Write-Host "Application starting..." -ForegroundColor Yellow
Write-Host "Access the application at: http://localhost:5000" -ForegroundColor Green
```

### Step 2: Comprehensive API Testing

Create comprehensive testing script:

```powershell
# Create PowerShell API testing script
@"
Write-Host "=== ITOSM Platform API Testing Suite ===" -ForegroundColor Cyan
Write-Host ""

# Base URL for API
`$baseUrl = "http://localhost:5000"

# Function to test API endpoint
function Test-ApiEndpoint {
    param(
        [string]`$Endpoint,
        [string]`$Method = "GET",
        [hashtable]`$Headers = @{},
        [string]`$Body = `$null,
        [string]`$Description
    )
    
    Write-Host "Testing: `$Description" -ForegroundColor Yellow
    Write-Host "Endpoint: `$Method `$Endpoint" -ForegroundColor White
    
    try {
        `$params = @{
            Uri = "`$baseUrl`$Endpoint"
            Method = `$Method
            Headers = `$Headers
        }
        
        if (`$Body) {
            `$params.Body = `$Body
            `$params.ContentType = "application/json"
        }
        
        `$response = Invoke-RestMethod @params
        Write-Host "✓ SUCCESS" -ForegroundColor Green
        
        if (`$response -is [System.Array]) {
            Write-Host "  Response: Found `$(`$response.Count) items" -ForegroundColor White
        } elseif (`$response -is [PSCustomObject]) {
            Write-Host "  Response: `$(`$response | ConvertTo-Json -Depth 1)" -ForegroundColor White
        } else {
            Write-Host "  Response: `$response" -ForegroundColor White
        }
        return `$true
    }
    catch {
        Write-Host "✗ FAILED" -ForegroundColor Red
        Write-Host "  Error: `$(`$_.Exception.Message)" -ForegroundColor Red
        return `$false
    }
    finally {
        Write-Host ""
    }
}

# Test 1: Health Check
Test-ApiEndpoint -Endpoint "/api/health" -Description "Health Check Endpoint"

# Test 2: Software Catalog (No Auth Required)
Test-ApiEndpoint -Endpoint "/api/software" -Description "Software Catalog List"

# Test 3: User Authentication Headers
`$userHeaders = @{
    'x-user-id' = '2'
    'x-username' = 'john.smith'
    'x-is-admin' = 'false'
}

Test-ApiEndpoint -Endpoint "/api/tickets" -Headers `$userHeaders -Description "User Tickets List"

# Test 4: Admin Authentication Headers
`$adminHeaders = @{
    'x-user-id' = '1'
    'x-username' = 'admin'
    'x-is-admin' = 'true'
}

Test-ApiEndpoint -Endpoint "/api/tickets" -Headers `$adminHeaders -Description "Admin All Tickets List"

# Test 5: Create New Ticket
`$newTicket = @{
    requestType = "Installation"
    softwareId = 6
    description = "Need Visual Studio Code installed for development work"
} | ConvertTo-Json

Test-ApiEndpoint -Endpoint "/api/tickets" -Method "POST" -Headers `$userHeaders -Body `$newTicket -Description "Create New Ticket"

# Test 6: User Login (Employee ID + Username)
`$userLogin = @{
    employeeId = "EMP001"
    username = "john.smith"
} | ConvertTo-Json

Test-ApiEndpoint -Endpoint "/api/auth/login" -Method "POST" -Body `$userLogin -Description "User Login (Employee ID + Username)"

# Test 7: Admin Login (Username + Password)
`$adminLogin = @{
    username = "admin"
    password = "AdminPass123!"
} | ConvertTo-Json

Test-ApiEndpoint -Endpoint "/api/auth/admin-login" -Method "POST" -Body `$adminLogin -Description "Admin Login (Username + Password)"

Write-Host "=== API Testing Complete ===" -ForegroundColor Cyan
"@ | Set-Content "test-api.ps1"

# Run comprehensive API tests
powershell -ExecutionPolicy Bypass -File "test-api.ps1"
```

### Step 3: Frontend Testing

```powershell
# Open web browser for manual testing
Start-Process "http://localhost:5000"

Write-Host ""
Write-Host "=== Frontend Testing Checklist ===" -ForegroundColor Cyan
Write-Host "1. User Authentication:" -ForegroundColor Yellow
Write-Host "   - Employee ID: EMP001" -ForegroundColor White
Write-Host "   - Username: john.smith" -ForegroundColor White
Write-Host ""
Write-Host "2. Admin Authentication:" -ForegroundColor Yellow
Write-Host "   - Username: admin" -ForegroundColor White
Write-Host "   - Password: AdminPass123!" -ForegroundColor White
Write-Host ""
Write-Host "3. Test Features:" -ForegroundColor Yellow
Write-Host "   - Create new tickets" -ForegroundColor White
Write-Host "   - View ticket lists" -ForegroundColor White
Write-Host "   - Software catalog browsing" -ForegroundColor White
Write-Host "   - Admin ticket management" -ForegroundColor White
Write-Host ""
Write-Host "4. Database Validation:" -ForegroundColor Yellow
Write-Host "   - Check ticket creation in MySQL" -ForegroundColor White
Write-Host "   - Verify user sessions" -ForegroundColor White
Write-Host "   - Test data persistence" -ForegroundColor White
```

---

## 🐳 Phase 6: Docker Containerization (Optional)

### Step 1: Create Docker MySQL Setup

```powershell
# Create docker-compose for local MySQL
@"
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    container_name: itosm-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: SecureRootPassword123!
      MYSQL_DATABASE: itosm_production
      MYSQL_USER: itosm_admin
      MYSQL_PASSWORD: AdminPassword456!
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./sample-data.sql:/docker-entrypoint-initdb.d/sample-data.sql
    command: --default-authentication-plugin=mysql_native_password

  app:
    build: .
    container_name: itosm-app
    restart: always
    environment:
      DATABASE_URL: mysql://itosm_admin:AdminPassword456!@mysql:3306/itosm_production
      NODE_ENV: production
      PORT: 5000
      SESSION_SECRET: your-super-secure-session-secret-must-be-at-least-32-characters-long
    ports:
      - "5000:5000"
    depends_on:
      - mysql
    volumes:
      - uploads_data:/app/uploads

volumes:
  mysql_data:
  uploads_data:
"@ | Set-Content "docker-compose.yml"
```

### Step 2: Build and Run Containers

```powershell
# Build and start containers
docker-compose up -d

# Check container status
docker-compose ps

# View logs
docker-compose logs app
docker-compose logs mysql

# Test containerized application
Start-Sleep -Seconds 30
Invoke-RestMethod -Uri "http://localhost:5000/api/health"
```

---

## 🔍 Phase 7: Database Validation and Monitoring

### Step 1: Database Health Checks

```powershell
# Create database monitoring script
@"
Write-Host "=== MySQL Database Health Check ===" -ForegroundColor Cyan

# Test database connectivity
try {
    `$result = mysql -u itosm_admin -p'AdminPassword456!' itosm_production -e "SELECT 'Database Connected Successfully' AS Status;"
    Write-Host "✓ Database Connection: SUCCESS" -ForegroundColor Green
} catch {
    Write-Host "✗ Database Connection: FAILED" -ForegroundColor Red
}

# Check table structure
Write-Host ""
Write-Host "Database Tables:" -ForegroundColor Yellow
mysql -u itosm_admin -p'AdminPassword456!' itosm_production -e "SHOW TABLES;"

# Check record counts
Write-Host ""
Write-Host "Record Counts:" -ForegroundColor Yellow
mysql -u itosm_admin -p'AdminPassword456!' itosm_production -e "
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'software_catalog', COUNT(*) FROM software_catalog  
UNION ALL
SELECT 'tickets', COUNT(*) FROM tickets
UNION ALL
SELECT 'ticket_history', COUNT(*) FROM ticket_history;"

# Check recent tickets
Write-Host ""
Write-Host "Recent Tickets:" -ForegroundColor Yellow
mysql -u itosm_admin -p'AdminPassword456!' itosm_production -e "
SELECT t.ticket_id, u.username, t.request_type, s.name as software, t.status, t.created_at
FROM tickets t
JOIN users u ON t.user_id = u.id
JOIN software_catalog s ON t.software_id = s.id
ORDER BY t.created_at DESC
LIMIT 5;"

Write-Host ""
Write-Host "=== Database Health Check Complete ===" -ForegroundColor Cyan
"@ | Set-Content "check-database.ps1"

# Run database health check
powershell -ExecutionPolicy Bypass -File "check-database.ps1"
```

### Step 2: Performance Monitoring

```powershell
# Create performance monitoring script
@"
Write-Host "=== System Performance Monitor ===" -ForegroundColor Cyan

# Check MySQL process
`$mysqlProcess = Get-Process mysql* -ErrorAction SilentlyContinue
if (`$mysqlProcess) {
    Write-Host "✓ MySQL Service: RUNNING" -ForegroundColor Green
    Write-Host "  PID: `$(`$mysqlProcess.Id)" -ForegroundColor White
    Write-Host "  Memory: `$([math]::Round(`$mysqlProcess.WorkingSet64 / 1MB, 2)) MB" -ForegroundColor White
} else {
    Write-Host "✗ MySQL Service: NOT RUNNING" -ForegroundColor Red
}

# Check Node.js process
`$nodeProcess = Get-Process node* -ErrorAction SilentlyContinue
if (`$nodeProcess) {
    Write-Host "✓ Node.js Application: RUNNING" -ForegroundColor Green
    Write-Host "  PID: `$(`$nodeProcess.Id)" -ForegroundColor White
    Write-Host "  Memory: `$([math]::Round(`$nodeProcess.WorkingSet64 / 1MB, 2)) MB" -ForegroundColor White
} else {
    Write-Host "✗ Node.js Application: NOT RUNNING" -ForegroundColor Red
}

# Check port availability
`$port5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if (`$port5000) {
    Write-Host "✓ Application Port 5000: ACTIVE" -ForegroundColor Green
} else {
    Write-Host "✗ Application Port 5000: NOT ACTIVE" -ForegroundColor Red
}

`$port3306 = Get-NetTCPConnection -LocalPort 3306 -ErrorAction SilentlyContinue
if (`$port3306) {
    Write-Host "✓ MySQL Port 3306: ACTIVE" -ForegroundColor Green
} else {
    Write-Host "✗ MySQL Port 3306: NOT ACTIVE" -ForegroundColor Red
}

# System resources
`$cpu = Get-Counter "\\Processor(_Total)\\% Processor Time" -SampleInterval 1 -MaxSamples 1
`$memory = Get-CimInstance Win32_OperatingSystem
`$memoryUsed = [math]::Round(((`$memory.TotalVisibleMemorySize - `$memory.FreePhysicalMemory) / `$memory.TotalVisibleMemorySize) * 100, 2)

Write-Host ""
Write-Host "System Resources:" -ForegroundColor Yellow
Write-Host "  CPU Usage: `$([math]::Round(`$cpu.CounterSamples[0].CookedValue, 2))%" -ForegroundColor White
Write-Host "  Memory Usage: `$memoryUsed%" -ForegroundColor White

Write-Host ""
Write-Host "=== Performance Monitor Complete ===" -ForegroundColor Cyan
"@ | Set-Content "monitor-performance.ps1"

# Run performance monitoring
powershell -ExecutionPolicy Bypass -File "monitor-performance.ps1"
```

---

## 🔧 Phase 8: Troubleshooting and Maintenance

### Common Issues and Solutions

#### 1. MySQL Connection Failed

```powershell
# Check MySQL service status
Get-Service MySQL80

# Restart MySQL service
Restart-Service MySQL80

# Check MySQL error log
Get-Content "C:\ProgramData\MySQL\MySQL Server 8.0\Data\*.err" | Select-Object -Last 20

# Test connection manually
mysql -u root -p -e "SELECT VERSION();"
```

#### 2. Application Won't Start

```powershell
# Check Node.js installation
node --version
npm --version

# Check application dependencies
npm install

# Check for port conflicts
netstat -an | Select-String ":5000"

# Start in debug mode
npm run dev
```

#### 3. Database Schema Issues

```powershell
# Reset database schema
mysql -u itosm_admin -p itosm_production -e "DROP DATABASE itosm_production;"
mysql -u itosm_admin -p -e "CREATE DATABASE itosm_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Recreate schema
npm run db:push --force

# Reload sample data
mysql -u itosm_admin -p itosm_production < sample-data.sql
```

#### 4. Permission Issues

```powershell
# Check MySQL user privileges
mysql -u root -p -e "SHOW GRANTS FOR 'itosm_admin'@'localhost';"
mysql -u root -p -e "SHOW GRANTS FOR 'itosm_app'@'localhost';"

# Reset user privileges
mysql -u root -p -e "
GRANT ALL PRIVILEGES ON itosm_production.* TO 'itosm_admin'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON itosm_production.* TO 'itosm_app'@'localhost';
FLUSH PRIVILEGES;"
```

### Maintenance Commands

```powershell
# Daily backup script
@"
# Create backup directory
New-Item -ItemType Directory -Path "C:\ITOSM-Backups" -Force

# Create timestamped backup
`$timestamp = Get-Date -Format "yyyy-MM-dd-HH-mm-ss"
`$backupFile = "C:\ITOSM-Backups\itosm_backup_`$timestamp.sql"

# Backup database
mysqldump -u itosm_admin -p'AdminPassword456!' itosm_production > `$backupFile

Write-Host "Database backed up to: `$backupFile" -ForegroundColor Green

# Keep only last 7 days of backups
Get-ChildItem "C:\ITOSM-Backups\*.sql" | Where-Object CreationTime -lt (Get-Date).AddDays(-7) | Remove-Item
"@ | Set-Content "backup-database.ps1"

# Weekly cleanup script
@"
# Clean application logs
Get-ChildItem "C:\ITOSM-Platform\logs\*.log" | Where-Object CreationTime -lt (Get-Date).AddDays(-30) | Remove-Item

# Clean temporary files
Remove-Item "C:\ITOSM-Platform\tmp\*" -Force -Recurse -ErrorAction SilentlyContinue

# Optimize MySQL tables
mysql -u itosm_admin -p'AdminPassword456!' itosm_production -e "
OPTIMIZE TABLE users, software_catalog, tickets, ticket_history, ticket_attachments;"

Write-Host "System cleanup completed" -ForegroundColor Green
"@ | Set-Content "cleanup-system.ps1"
```

---

## 📊 Summary and Production Checklist

### ✅ Deployment Verification Checklist

- [x] **Windows Server Environment**
  - [x] Chocolatey package manager installed
  - [x] Node.js and npm working
  - [x] Git available for version control

- [x] **MySQL Database**
  - [x] MySQL 8.0+ installed and running
  - [x] Database `itosm_production` created
  - [x] Users `itosm_admin` and `itosm_app` configured
  - [x] Sample data loaded successfully

- [x] **Application Setup**
  - [x] Dependencies installed via npm
  - [x] Environment variables configured
  - [x] Database schema migrated
  - [x] Application starts without errors

- [x] **API Testing**
  - [x] Health endpoint responding
  - [x] Authentication working (both user and admin)
  - [x] CRUD operations functional
  - [x] Database persistence verified

- [x] **Frontend Testing**
  - [x] Web interface accessible
  - [x] User login working
  - [x] Admin login working
  - [x] Ticket creation/management functional

### 🔐 Security Recommendations

1. **Change Default Passwords**
   ```powershell
   # Generate strong passwords
   [System.Web.Security.Membership]::GeneratePassword(32, 8)
   ```

2. **Enable Windows Firewall**
   ```powershell
   # Allow only necessary ports
   New-NetFirewallRule -DisplayName "MySQL" -Direction Inbound -Protocol TCP -LocalPort 3306 -Action Allow
   New-NetFirewallRule -DisplayName "ITOSM App" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
   ```

3. **Regular Backups**
   ```powershell
   # Schedule daily backups
   $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\ITOSM-Platform\backup-database.ps1"
   $trigger = New-ScheduledTaskTrigger -Daily -At 2AM
   Register-ScheduledTask -TaskName "ITOSM-Daily-Backup" -Action $action -Trigger $trigger
   ```

### 🚀 Production Deployment Notes

**Fast Development Setup (5-10 minutes):**
1. Run Chocolatey installation script
2. Install MySQL and configure users
3. Download and extract application
4. Run `npm install && npm run db:push`
5. Load sample data and start application

**Reliable Production Setup (30-60 minutes):**
1. Complete Windows Server hardening
2. Install and secure MySQL with custom configuration
3. Set up automated backups and monitoring
4. Configure Windows services for auto-start
5. Implement comprehensive logging and alerting

Your ITOSM Platform is now successfully deployed on Windows Server with MySQL database, complete with sample data and comprehensive testing procedures!