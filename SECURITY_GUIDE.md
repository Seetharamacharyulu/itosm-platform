# 🔐 ITOSM Platform Security Guide

## Critical Security Requirements for Production

**⚠️ FAILURE TO FOLLOW THESE REQUIREMENTS WILL RESULT IN SERIOUS SECURITY VULNERABILITIES**

This document outlines mandatory security configurations that must be implemented before deploying the ITOSM Platform to production.

## 🚨 Pre-Deployment Security Checklist

### Required Actions (NO EXCEPTIONS):

- [ ] **Strong Database Credentials**: 32+ character passwords with mixed case, numbers, symbols
- [ ] **Random Session Secrets**: 64+ character random strings (never use examples)
- [ ] **Database Access Restricted**: No public port mapping (5432) in production
- [ ] **HTTPS Enabled**: SSL certificates configured and enforced
- [ ] **Default Passwords Changed**: All admin accounts updated with strong passwords
- [ ] **Environment Variables Secured**: No sensitive data in docker-compose.yml
- [ ] **Resource Limits Applied**: Container resource limits configured
- [ ] **Health Checks Working**: Database connectivity properly monitored

## 🔑 Secret Generation

### Database Password
Generate a strong database password:

**Windows:**
```powershell
# Generate 32-character secure password
-join ((65..90) + (97..122) + (48..57) + (33,35,36,37,38,42,43,45,61,63,64) | Get-Random -Count 32 | % {[char]$_})
```

**Linux/Mac:**
```bash
# Generate 32-character secure password
openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
```

### Session Secret
Generate a 64-character session secret:

**Windows:**
```powershell
# Generate 64-character hex string
-join ((1..64) | ForEach {'{0:X}' -f (Get-Random -Max 16)})
```

**Linux/Mac:**
```bash
# Generate 64-character hex string
openssl rand -hex 32
```

## 🛡️ Secure Environment Configuration

### Development Environment (.env)
```env
# Database Configuration - DEVELOPMENT ONLY
POSTGRES_DB=itosm_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=dev_password_min_32_chars_123456789
DATABASE_URL=postgresql://postgres:dev_password_min_32_chars_123456789@database:5432/itosm_db

# Application Configuration - DEVELOPMENT ONLY
NODE_ENV=development
PORT=5000
SESSION_SECRET=development_session_secret_64_characters_1234567890abcdef
```

### Production Environment (.env.production)
```env
# Database Configuration - PRODUCTION
POSTGRES_DB=itosm_production
POSTGRES_USER=postgres
POSTGRES_PASSWORD=REPLACE_WITH_POSTGRES_ADMIN_PASSWORD
APP_DB_USER=itosm_app
APP_DB_PASSWORD=REPLACE_WITH_APP_USER_PASSWORD
DATABASE_URL=postgresql://itosm_app:REPLACE_WITH_APP_USER_PASSWORD@database:5432/itosm_production

# Application Configuration - PRODUCTION
NODE_ENV=production
PORT=5000
SESSION_SECRET=REPLACE_WITH_GENERATED_64_CHAR_HEX_STRING

# Domain Configuration
DOMAIN=your-production-domain.com
```

## 🚫 Docker Compose Security Fixes

### ❌ INSECURE Configuration (DO NOT USE):
```yaml
services:
  database:
    ports:
      - "5432:5432"  # EXPOSES DATABASE TO INTERNET!
    environment:
      POSTGRES_PASSWORD: secure_password  # WEAK DEFAULT!
```

### ✅ SECURE Configuration (USE THIS):
```yaml
services:
  database:
    # NO port mapping - database only accessible via Docker network
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}  # From secure .env file
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

## 🌐 HTTPS/SSL Configuration

### SSL Certificate Setup

1. **Obtain SSL Certificates:**
   ```bash
   # Using Let's Encrypt (free)
   certbot certonly --standalone -d your-domain.com
   
   # Or purchase from CA (recommended for production)
   ```

2. **Configure Nginx for HTTPS:**
   
   Update `nginx.conf`:
   ```nginx
   server {
       listen 443 ssl http2;
       server_name your-domain.com;
       
       ssl_certificate /etc/nginx/ssl/cert.pem;
       ssl_certificate_key /etc/nginx/ssl/key.pem;
       ssl_protocols TLSv1.2 TLSv1.3;
       
       # Security headers
       add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
       add_header X-Frame-Options "SAMEORIGIN" always;
       add_header X-Content-Type-Options "nosniff" always;
   }
   ```

3. **Update Docker Compose:**
   ```yaml
   nginx:
     volumes:
       - ./ssl:/etc/nginx/ssl:ro
     ports:
       - "80:80"
       - "443:443"
   ```

## 🔒 Database Security

### PostgreSQL Hardening

1. **Connection Security:**
   - Database only accessible via Docker internal network
   - No public port exposure (remove 5432:5432 mapping)
   - Use strong authentication credentials

2. **Data Protection:**
   - Enable regular automated backups
   - Encrypt sensitive data in application layer
   - Use connection pooling for efficiency

3. **Access Control:**
   - Limit database user permissions
   - Use application-specific database user (not postgres)
   - Implement audit logging

### Example Secure Database User:
```sql
-- Connect as postgres superuser
CREATE USER itosm_app WITH PASSWORD 'generated_32_char_password';
CREATE DATABASE itosm_production OWNER itosm_app;
GRANT ALL PRIVILEGES ON DATABASE itosm_production TO itosm_app;
```

## 🛠️ Application Security

### Container Security

1. **Runtime Security:**
   ```dockerfile
   # Run as non-root user
   USER nodejs
   
   # Read-only root filesystem (optional)
   # docker run --read-only
   
   # Drop capabilities
   # docker run --cap-drop=ALL
   ```

2. **Resource Limits:**
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '1.0'
         memory: 1G
       reservations:
         cpus: '0.5'
         memory: 512M
   ```

### Input Validation
- All user inputs validated with Zod schemas
- File upload restrictions by type and size
- SQL injection prevention via parameterized queries
- XSS protection through output encoding

## 🚨 Security Monitoring

### Health Checks
- Database connectivity monitoring
- Application health endpoints
- Resource usage monitoring
- Log analysis for security events

### Backup Strategy
```bash
# Daily database backup
docker-compose exec database pg_dump -U postgres itosm_production > backup_$(date +%Y%m%d).sql

# Encrypted backup storage
gpg --symmetric --cipher-algo AES256 backup_$(date +%Y%m%d).sql
```

## 🔴 Emergency Response

### If Security Breach Detected:

1. **Immediate Actions:**
   - Stop all services: `docker-compose down`
   - Change all passwords and secrets
   - Revoke and regenerate SSL certificates
   - Check logs for unauthorized access

2. **Recovery Steps:**
   - Restore from clean backup
   - Update all security configurations
   - Implement additional monitoring
   - Conduct security audit

## 📝 Compliance Notes

### Data Protection:
- User data encrypted in transit (HTTPS)
- Database access restricted to application
- Session cookies secured with httpOnly and secure flags
- No sensitive data in logs or error messages

### Access Control:
- Role-based access (user vs admin)
- Session timeout configuration
- Failed login attempt monitoring
- Audit trail for administrative actions

---

## ⚡ Quick Security Verification

After deployment, verify security:

```bash
# Check no database port exposed
nmap -p 5432 your-server-ip  # Should show "filtered" or "closed"

# Verify HTTPS
curl -I https://your-domain.com  # Should return 200 with security headers

# Test health endpoint
curl https://your-domain.com/api/health  # Should return healthy status
```

---

**Remember: Security is not optional. These configurations are mandatory for any production deployment of the ITOSM Platform.**