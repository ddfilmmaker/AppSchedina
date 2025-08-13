# Schedina - Sports Prediction League App

## Overview

Schedina is a full-stack web application for creating and managing sports prediction leagues. Users can create private leagues, invite friends with unique codes, and compete by predicting match results across multiple matchdays. The app features user authentication, real-time leaderboards, countdown timers for prediction deadlines, and special tournament betting functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18 with TypeScript**: Single-page application using functional components and hooks
- **Wouter**: Lightweight client-side routing instead of React Router
- **TanStack Query**: Server state management, caching, and data fetching
- **Radix UI + Tailwind CSS**: Component library with shadcn/ui design system for consistent, accessible UI
- **Vite**: Build tool and development server with hot module replacement

### Backend Architecture
- **Express.js**: RESTful API server with TypeScript
- **Session-based Authentication**: Express sessions with PostgreSQL storage using connect-pg-simple
- **Password Security**: bcryptjs for password hashing
- **Database Layer**: Drizzle ORM with PostgreSQL database for type-safe database operations
- **Error Handling**: Centralized error middleware with proper HTTP status codes

### Database Design
- **PostgreSQL with Drizzle ORM**: Type-safe database schema and queries
- **Core Entities**:
  - Users (authentication, nicknames, admin roles)
  - Leagues (private groups with unique join codes)
  - League Members (many-to-many relationship)
  - Matchdays (prediction periods with deadlines)
  - Matches (individual games within matchdays)
  - Picks (user predictions for match outcomes)
  - Special Tournaments (additional betting opportunities)
- **UUID Primary Keys**: Using PostgreSQL's gen_random_uuid() for all entities

### Authentication & Authorization
- **Session-based Auth**: Server-side sessions stored in PostgreSQL
- **Role-based Access**: Admin users can create leagues and manage matchdays
- **Protected Routes**: Client-side route protection based on authentication state
- **League Access Control**: Users must join leagues via unique codes

### Data Flow & State Management
- **TanStack Query**: Centralized API state with automatic caching and invalidation
- **Optimistic Updates**: Immediate UI feedback for user interactions
- **Real-time Features**: Countdown timers for prediction deadlines
- **Form Validation**: Zod schemas shared between client and server

### Mobile-First Design
- **Responsive Layout**: Mobile-optimized with bottom navigation
- **Touch-friendly Interface**: Large touch targets and swipe gestures
- **Progressive Enhancement**: Works without JavaScript for core functionality

## External Dependencies

### Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting (@neondatabase/serverless)
- **PostgreSQL**: Primary database with UUID extensions

### UI & Styling
- **Radix UI**: Headless component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **shadcn/ui**: Pre-built component system

### Development Tools
- **Vite**: Build tool and dev server
- **TypeScript**: Type safety across the stack
- **Drizzle Kit**: Database migrations and schema management
- **ESBuild**: Production bundling for server code

### Authentication & Security
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store
- **bcryptjs**: Password hashing

### Data Management
- **TanStack React Query**: Server state management
- **Zod**: Runtime type validation and schema parsing
- **date-fns**: Date manipulation and formatting

### Replit Integration
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Development tooling integration