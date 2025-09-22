# ITOSM Platform API Documentation

## Overview

The ITOSM (IT Operations and Service Management) Platform provides a comprehensive REST API for managing IT service requests, user authentication, software catalogs, and administrative functions.

**Base URL:** `http://localhost:5000/api`  
**Content-Type:** `application/json`  
**Authentication:** Session-based authentication with cookies

## Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [Ticket Management](#ticket-management)
3. [Software Catalog](#software-catalog)
4. [User Management](#user-management)
5. [Statistics](#statistics)
6. [File Attachments](#file-attachments)
7. [Admin Functions](#admin-functions)
8. [Error Responses](#error-responses)

---

## Authentication Endpoints

### User Login
**POST** `/api/auth/login`

Authenticate users with Employee ID and Username.

**Request Body:**
```json
{
  "employeeId": "string",
  "username": "string"
}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "employeeId": "EMP001",
    "username": "john.doe",
    "isAdmin": false
  }
}
```

### Admin Login
**POST** `/api/auth/admin-login`

Authenticate administrators with Username and Password.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "isAdmin": true
  }
}
```

### Logout
**POST** `/api/auth/logout`

Invalidate current session.

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

## Ticket Management

### Create Ticket
**POST** `/api/tickets`

Create a new IT service request ticket.

**Headers:** `Authentication required`

**Request Body:**
```json
{
  "requestType": "Software Installation",
  "softwareId": "123",
  "description": "Need Microsoft Office installed on my workstation",
  "priority": "Medium"
}
```

**Response (201):**
```json
{
  "id": 1,
  "ticketId": "INC-2025-0001",
  "userId": 1,
  "requestType": "Software Installation",
  "softwareId": 123,
  "description": "Need Microsoft Office installed on my workstation",
  "priority": "Medium",
  "status": "Pending",
  "createdAt": "2025-01-20T10:30:00Z"
}
```

### Get All Tickets
**GET** `/api/tickets`

Retrieve all tickets (admin) or user's tickets.

**Headers:** `Authentication required`

**Query Parameters:**
- `status` (optional): Filter by status
- `type` (optional): Filter by request type
- `userId` (optional, admin only): Filter by user ID

**Response (200):**
```json
[
  {
    "id": 1,
    "ticketId": "INC-2025-0001",
    "userId": 1,
    "username": "john.doe",
    "requestType": "Software Installation",
    "software": {
      "id": 123,
      "name": "Microsoft Office",
      "version": "2021"
    },
    "description": "Need Microsoft Office installed",
    "priority": "Medium",
    "status": "Pending",
    "createdAt": "2025-01-20T10:30:00Z",
    "updatedAt": "2025-01-20T10:30:00Z"
  }
]
```

### Get Ticket by ID
**GET** `/api/tickets/:id`

Retrieve specific ticket details.

**Headers:** `Authentication required`

**Response (200):**
```json
{
  "id": 1,
  "ticketId": "INC-2025-0001",
  "userId": 1,
  "username": "john.doe",
  "requestType": "Software Installation",
  "software": {
    "id": 123,
    "name": "Microsoft Office",
    "version": "2021"
  },
  "description": "Need Microsoft Office installed on my workstation",
  "priority": "Medium",
  "status": "Pending",
  "createdAt": "2025-01-20T10:30:00Z",
  "updatedAt": "2025-01-20T10:30:00Z"
}
```

### Update Ticket Status
**PATCH** `/api/tickets/:id/status`

Update ticket status (admin only).

**Headers:** `Authentication required (Admin)`

**Request Body:**
```json
{
  "status": "In Progress",
  "notes": "Started working on the installation"
}
```

**Response (200):**
```json
{
  "id": 1,
  "status": "In Progress",
  "updatedAt": "2025-01-20T11:30:00Z"
}
```

### Get Ticket History
**GET** `/api/tickets/:id/history`

Retrieve ticket status change history.

**Response (200):**
```json
[
  {
    "id": 1,
    "ticketId": 1,
    "status": "Pending",
    "notes": "Ticket created",
    "createdAt": "2025-01-20T10:30:00Z"
  },
  {
    "id": 2,
    "ticketId": 1,
    "status": "In Progress",
    "notes": "Started working on the installation",
    "createdAt": "2025-01-20T11:30:00Z"
  }
]
```

---

## Software Catalog

### Get All Software
**GET** `/api/software`

Retrieve all available software options.

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Microsoft Office",
    "version": "2021"
  },
  {
    "id": 2,
    "name": "Adobe Photoshop",
    "version": "2023"
  }
]
```

### Upload Software CSV (Admin)
**POST** `/api/admin/software/upload-csv`

Upload CSV file to bulk add software to catalog.

**Headers:** `Authentication required (Admin)`

**Request Body:**
```json
{
  "csvData": [
    {
      "name": "Visual Studio Code",
      "version": "Latest"
    },
    {
      "name": "Slack",
      "version": "Latest"
    }
  ]
}
```

**Response (200):**
```json
{
  "message": "Successfully added 2 software items",
  "addedSoftware": [
    {
      "id": 3,
      "name": "Visual Studio Code",
      "version": "Latest"
    },
    {
      "id": 4,
      "name": "Slack",
      "version": "Latest"
    }
  ]
}
```

### Download Sample CSV (Admin)
**GET** `/api/admin/software/sample-csv`

Download a sample CSV template for software import.

**Headers:** `Authentication required (Admin)`

**Response:** CSV file download with headers:
```csv
name,version
"Microsoft Office","2021"
"Adobe Photoshop","2023"
```

---

## Statistics

### Get Dashboard Statistics
**GET** `/api/stats`

Retrieve ticket statistics for dashboard.

**Query Parameters:**
- `userId` (optional): Get stats for specific user

**Response (200):**
```json
{
  "total": 150,
  "pending": 25,
  "inProgress": 45,
  "resolved": 80,
  "byType": {
    "Software Installation": 60,
    "Hardware Replacement": 30,
    "Network Issue": 25,
    "License Activation": 20,
    "System Maintenance": 10,
    "User Access": 5
  },
  "recentActivity": [
    {
      "ticketId": "INC-2025-0150",
      "action": "created",
      "timestamp": "2025-01-20T10:30:00Z"
    }
  ]
}
```

---

## File Attachments

### Upload Attachment
**POST** `/api/tickets/:id/attachments`

Upload file attachment to a ticket.

**Headers:** `Authentication required`

**Request Body:** `multipart/form-data`
```json
{
  "fileName": "screenshot.png",
  "fileSize": 1024576,
  "fileType": "image/png",
  "objectPath": "/uploads/screenshot.png"
}
```

**Response (201):**
```json
{
  "id": 1,
  "ticketId": 1,
  "fileName": "screenshot.png",
  "fileSize": 1024576,
  "fileType": "image/png",
  "objectPath": "/uploads/screenshot.png",
  "uploadedAt": "2025-01-20T10:30:00Z"
}
```

### Get Ticket Attachments
**GET** `/api/tickets/:id/attachments`

Get all attachments for a ticket.

**Headers:** `Authentication required`

**Response (200):**
```json
[
  {
    "id": 1,
    "fileName": "screenshot.png",
    "fileSize": 1024576,
    "fileType": "image/png",
    "objectPath": "/uploads/screenshot.png",
    "uploadedAt": "2025-01-20T10:30:00Z"
  }
]
```

### Delete Attachment
**DELETE** `/api/tickets/:ticketId/attachments/:attachmentId`

Delete a specific attachment.

**Headers:** `Authentication required`

**Response (204):** No content

---

## Object Storage

### Get Upload URL
**POST** `/api/objects/upload`

Get a presigned URL for file upload to object storage.

**Headers:** `Authentication required`

**Response (200):**
```json
{
  "uploadURL": "https://storage.googleapis.com/bucket/path?signature=...",
  "objectPath": "/uploads/unique-filename.ext"
}
```

---

## Health Check

### Application Health
**GET** `/api/health`

Check application health status.

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T10:30:00Z",
  "database": "connected",
  "version": "1.0.0"
}
```

---

## Error Responses

### Standard Error Format
All API errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details (optional)"
  }
}
```

### Common HTTP Status Codes

- **200 OK** - Request successful
- **201 Created** - Resource created successfully
- **204 No Content** - Request successful, no response body
- **400 Bad Request** - Invalid request data
- **401 Unauthorized** - Authentication required
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **409 Conflict** - Resource conflict
- **422 Unprocessable Entity** - Validation error
- **500 Internal Server Error** - Server error

### Authentication Errors

```json
{
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "Please log in to access this resource"
  }
}
```

### Validation Errors

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "description": "Description must be at least 10 characters"
    }
  }
}
```

---

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **General API**: 10 requests per second
- **Authentication**: 5 requests per minute
- **File uploads**: 50MB maximum file size

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 8
X-RateLimit-Reset: 1642684800
```

---

## Request Types Available

1. **Software Installation** - Request installation of software applications
2. **License Activation** - Activate or renew software licenses
3. **Hardware Replacement** - Request hardware repairs or replacements
4. **Network Issue** - Report connectivity or network problems
5. **System Maintenance** - Schedule system updates or maintenance
6. **User Access** - Request access permissions or account management

---

## Pagination

For endpoints that return large datasets, pagination is supported:

**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 20, max: 100) - Items per page

**Response Headers:**
```
X-Total-Count: 150
X-Page: 1
X-Page-Size: 20
X-Total-Pages: 8
```

---

## Webhooks (Future Feature)

The API supports webhooks for real-time notifications:

**Supported Events:**
- `ticket.created`
- `ticket.updated` 
- `ticket.status_changed`
- `ticket.assigned`

**Webhook Payload:**
```json
{
  "event": "ticket.created",
  "timestamp": "2025-01-20T10:30:00Z",
  "data": {
    "ticket": { /* ticket object */ }
  }
}
```

---

This API documentation covers all available endpoints in the ITOSM Platform. For technical support or questions, please contact the development team.