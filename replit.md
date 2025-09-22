# Overview

This is a full-stack IT ticketing system built as the foundation (Phase 1) of a larger Unified IT Operations and Service Management platform. The application follows a microservices architecture approach and provides core ticketing functionality including user authentication, ticket creation, status management, and administrative oversight.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **UI Library**: Radix UI components with shadcn/ui styling system for consistent design
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack React Query for server state and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form processing

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for full-stack type safety
- **API Design**: RESTful endpoints following standard HTTP conventions
- **Validation**: Zod schemas shared between client and server for consistent validation
- **Build System**: Vite for development and esbuild for production builds

## Data Layer
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL with Neon serverless hosting
- **Schema Management**: Drizzle migrations for version control of database structure
- **Connection Pooling**: Neon serverless connection pooling for efficient resource usage

## Authentication & Authorization
- **Authentication Model**: Simple credential validation using Employee ID and Username
- **Session Management**: Client-side localStorage for user session persistence
- **Role-Based Access**: Admin flag for differentiated permissions and interface access
- **No Complex Auth**: Deliberately simplified for Phase 1, avoiding JWT/OAuth complexity

## Application Structure
- **Monorepo Design**: Single repository with organized separation of concerns
- **Shared Types**: Common TypeScript interfaces and Zod schemas in `/shared` directory
- **Route Organization**: Modular API routes with dedicated handlers for different resources
- **Component Architecture**: Reusable UI components with props-based customization

## Core Features
- **Ticket Management**: Full CRUD operations for IT service requests
- **Status Tracking**: Workflow management with status transitions and history
- **User Dashboard**: Personalized view of user's tickets and statistics
- **Admin Dashboard**: System-wide ticket oversight with filtering and management tools
- **Software Catalog**: Predefined software options for ticket categorization

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Database URL**: Environment-based configuration for different deployment stages

## Development Tools
- **Vite**: Fast development server with hot module replacement
- **ESBuild**: Production build bundling for server-side code
- **TypeScript Compiler**: Type checking and compilation across the entire stack

## UI Component Libraries
- **Radix UI**: Headless, accessible component primitives for complex interactions
- **Lucide React**: Icon library providing consistent iconography
- **Tailwind CSS**: Utility-first CSS framework with design system integration

## Runtime Dependencies
- **TanStack React Query**: Server state management with caching and background updates
- **React Hook Form**: Performant form handling with minimal re-renders
- **Date-fns**: Date manipulation and formatting utilities
- **Wouter**: Lightweight routing solution for single-page application navigation

## Development Environment
- **Replit Integration**: Development environment plugins for error handling and debugging
- **PostCSS**: CSS processing with Tailwind integration
- **WebSocket Support**: For Neon database connections in serverless environment