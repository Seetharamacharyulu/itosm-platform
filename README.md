# 🚀 ITOSM Platform - IT Operations and Service Management

[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://hub.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green?logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)](https://www.postgresql.org/)

A comprehensive IT Operations and Service Management platform built with modern web technologies, featuring advanced authentication, ticket management, and administrative tools.

## 🎯 Overview

The ITOSM Platform is a full-stack application designed to streamline IT service requests and administrative operations. It provides a user-friendly interface for employees to submit tickets and a powerful admin dashboard for managing the entire IT service workflow.

### ✨ Key Features

- 🔐 **Dual Authentication System** - Separate login methods for users and administrators
- 🎫 **Advanced Ticket Management** - Complete lifecycle management with status tracking
- 📊 **Dynamic Software Catalog** - Database-driven software management with CSV upload
- 💼 **Administrative Dashboard** - Comprehensive admin tools with analytics
- 📎 **File Attachment System** - Cloud-based file uploads and management
- 📱 **Responsive Design** - Works seamlessly across all devices
- 🛡️ **Enterprise Security** - Multi-layer security with best practices
- 🐳 **Docker Ready** - Complete containerization for easy deployment

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Express API    │    │   PostgreSQL    │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────►│ Object Storage  │◄─────────────┘
                        │   (GCS/Local)   │
                        └─────────────────┘
```

### 🛠️ Technology Stack

**Frontend:**
- React 18.3 with TypeScript
- Radix UI + shadcn/ui components
- Tailwind CSS for styling
- TanStack React Query for state management
- Wouter for routing

**Backend:**
- Node.js 20 with Express.js
- TypeScript for type safety
- Drizzle ORM with PostgreSQL
- Object storage integration
- Session-based authentication

**Infrastructure:**
- Docker & Docker Compose
- Nginx reverse proxy
- PostgreSQL 16
- Google Cloud Storage (optional)

## 🚀 Quick Start

### Prerequisites

- Docker Desktop installed
- Git (optional)
- Docker Hub account (for deployment)

### Option 1: Download ZIP File

1. **Download the application files** to your local machine
2. **Extract to your desired folder** (e.g., `C:\Projects\itosm-platform`)
3. **Open terminal** in the project directory

### Option 2: Clone Repository (if available)

```bash
git clone <repository-url>
cd itosm-platform
```

### Local Development Setup

1. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

2. **Start with Docker:**
   ```bash
   docker-compose up --build
   ```

3. **Access the Application:**
   - Open browser: http://localhost:5000
   - **First-time Setup:** Create admin account on first access

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [🔧 Deployment Guide](DEPLOYMENT_GUIDE.md) | Complete Docker deployment instructions |
| [🔐 Security Guide](SECURITY_GUIDE.md) | **CRITICAL** - Production security requirements |
| [📚 API Documentation](API_DOCUMENTATION.md) | REST API endpoints and usage |
| [⭐ Features Guide](FEATURES_DOCUMENTATION.md) | Comprehensive feature overview |
| [👤 User Guide](USER_GUIDE.md) | End-user instructions |

## 🐳 Docker Hub Deployment

### Push to Docker Hub

1. **Login to Docker Hub:**
   ```bash
   docker login
   ```

2. **Build and Tag:**
   ```bash
   docker build -t yourusername/itosm-platform:latest .
   docker build -t yourusername/itosm-platform:1.0 .
   ```

3. **Push Images:**
   ```bash
   docker push yourusername/itosm-platform:latest
   docker push yourusername/itosm-platform:1.0
   ```

### Deploy from Docker Hub

```bash
# Pull and run
docker pull yourusername/itosm-platform:latest

# Use provided docker-compose.yml
docker-compose up -d
```

## 🏢 Production Deployment

### Simple Production Setup

⚠️ **SECURITY FIRST**: Read the [Security Guide](SECURITY_GUIDE.md) before production deployment!

```bash
# Copy environment template
cp .env.example .env.production

# CRITICAL: Update with strong passwords (see Security Guide)
nano .env.production

# Deploy with PRODUCTION configuration (HTTPS required)
docker-compose -f docker-compose.production.yml up -d
```

### Advanced Production Features

- **SSL/HTTPS Support** - Nginx with SSL certificates
- **Load Balancing** - Multiple application instances
- **Database Backups** - Automated PostgreSQL backups
- **Monitoring** - Health checks and logging
- **Security Headers** - Production security configuration

## 👥 User Roles

### Standard Users
- **Login:** Employee ID + Username
- **Capabilities:**
  - Create and manage personal tickets
  - Upload file attachments
  - Track ticket status and history
  - View personal analytics

### Administrators
- **Login:** Username + Password
- **Capabilities:**
  - All user capabilities
  - Manage all system tickets
  - Upload software catalogs via CSV
  - Access administrative dashboard
  - View system-wide analytics
  - Modify ticket statuses

## 📊 Feature Highlights

### Ticket Management
- **Request Types:** Software Installation, Hardware Replacement, Network Issues, etc.
- **Status Tracking:** Pending → In Progress → Resolved workflow
- **File Attachments:** Multi-file upload with cloud storage
- **Search & Filter:** Advanced filtering and search capabilities

### Administrative Tools
- **CSV Upload:** Bulk software catalog management
- **Analytics Dashboard:** System-wide reporting and metrics
- **User Management:** Complete user oversight
- **Export Functions:** Data export to CSV

### Security Features
- **Dual Authentication:** Separate security models for users/admins
- **Session Management:** Secure server-side sessions
- **Input Validation:** Comprehensive data validation
- **File Security:** Secure file upload and storage

## 🛡️ Security Considerations

- **Non-root containers** for enhanced security
- **Input sanitization** prevents XSS and injection attacks
- **Rate limiting** protects against abuse
- **Secure headers** implemented via Nginx
- **Environment-based configuration** for secrets management

## 📈 Performance Features

- **Multi-stage Docker builds** for optimized images
- **Database connection pooling** for efficiency
- **Nginx caching** for static assets
- **Lazy loading** for improved frontend performance
- **Health checks** for container monitoring

## 🔧 Development

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run check
```

### Database Management

```bash
# Push database schema
npm run db:push

# Access database
docker-compose exec database psql -U postgres itosm_db
```

## 📦 Project Structure

```
itosm-platform/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── lib/           # Utilities and configurations
│   │   └── hooks/         # Custom React hooks
├── server/                # Node.js backend application
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Database operations
│   └── index.ts           # Application entry point
├── shared/                # Shared TypeScript types
│   └── schema.ts          # Database and validation schemas
├── docs/                  # Documentation files
├── Dockerfile            # Container configuration
├── docker-compose.yml    # Multi-service setup
└── nginx.conf            # Reverse proxy configuration
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Troubleshooting

- **Port conflicts:** Check if port 5000 is already in use
- **Docker issues:** Ensure Docker Desktop is running
- **Database problems:** Verify PostgreSQL container is healthy
- **Build failures:** Clear Docker cache with `docker system prune`

### Common Commands

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Clean rebuild
docker-compose down && docker-compose up --build

# Database backup
docker-compose exec database pg_dump -U postgres itosm_db > backup.sql
```

### Getting Help

1. Check the [Deployment Guide](DEPLOYMENT_GUIDE.md) for detailed instructions
2. Review [API Documentation](API_DOCUMENTATION.md) for integration help
3. Consult [Features Documentation](FEATURES_DOCUMENTATION.md) for feature usage
4. Check Docker logs for error messages

## 🎉 Acknowledgments

- Built with modern web technologies
- Inspired by enterprise IT service management best practices
- Designed for scalability and maintainability
- Optimized for developer experience

---

**Ready to streamline your IT operations?** Get started with the [Deployment Guide](DEPLOYMENT_GUIDE.md) and deploy your ITOSM Platform today! 🚀