# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a PoliceRP management system built with FastAPI backend and React frontend. The system manages citizen passports, fines, and emergency status for a roleplay server, with Discord OAuth2 authentication and SP-Worlds integration.

## Architecture

### Backend (FastAPI)
- **Location**: `backend/app/`
- **Framework**: FastAPI with SQLAlchemy ORM
- **Database**: PostgreSQL
- **Authentication**: Discord OAuth2 + JWT tokens
- **External APIs**: Discord API for role checking, SP-Worlds API for Minecraft nicknames
- **Background Services**: Automated role synchronization service

### Frontend (React)
- **Location**: `frontend/src/`
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router v6
- **Forms**: React Hook Form
- **UI Components**: Headless UI, Lucide React icons

### Key Components
- **Models**: Database models in `backend/app/models/` (User, Passport, Fine, Log)
- **API Routes**: REST endpoints in `backend/app/api/v1/`
- **CRUD Operations**: Database operations in `backend/app/crud/`
- **Schemas**: Pydantic models in `backend/app/schemas/`
- **Services**: Business logic in `backend/app/services/`
- **External Clients**: Discord and SP-Worlds API clients in `backend/app/clients/`

## Development Commands

### Docker Operations (Primary)
```bash
# Start all services
make up

# Build and start services
make build

# Stop all services
make down

# View logs
make logs
make logs-backend
make logs-frontend
make logs-db

# Connect to containers
make shell-backend
make shell-frontend
make shell-db

# Status and monitoring
make status
```

### Backend Development
```bash
# Install dependencies (in backend/)
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Database migrations
alembic upgrade head
alembic revision --autogenerate -m "description"

# Code quality
black .
isort .
flake8 .
mypy .

# Run tests
pytest
pytest tests/test_api.py -v
```

### Frontend Development
```bash
# Install dependencies (in frontend/)
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

## Configuration

### Environment Variables
- **Backend**: Configure in `backend/.env` (development) or `backend/.env.docker` (production)
- **Frontend**: Build-time configuration in `frontend/.env`

### Key Settings
- **Discord OAuth**: Client ID, secret, guild ID, role IDs
- **SP-Worlds**: Map ID and token for Minecraft integration
- **Database**: PostgreSQL connection string
- **JWT**: Secret key and token expiration
- **Role Checking**: Interval for Discord role synchronization

## Database Schema

### Core Models
- **User**: Discord-authenticated users with roles (admin/police)
- **Passport**: Citizen data (name, nickname, age, gender, city, emergency status)
- **Fine**: Traffic violations and penalties
- **Log**: System activity logging

### Key Relationships
- User → Passport (one-to-many): Users can create multiple passports
- Passport → Fine (one-to-many): Passports can have multiple fines
- All models have audit fields (created_at, updated_at)

## Authentication Flow

1. User clicks login → redirected to Discord OAuth
2. Discord callback → extract user info and guild roles
3. Check if user has required roles (admin/police)
4. Generate JWT token with role permissions
5. Frontend stores token and makes authenticated requests

## Role-Based Access

- **Admin**: Full access + user management
- **Police**: Passport and fine management
- **Unauthenticated**: Only login endpoint

## API Structure

All API routes are prefixed with `/api/v1/`:
- `/auth/` - Authentication endpoints
- `/users/` - User management (admin only)
- `/passports/` - Passport CRUD operations
- `/fines/` - Fine management
- `/logs/` - System activity logs
- `/roles/` - Role management utilities

## Development Notes

### Testing
- Backend tests in `backend/tests/`
- Use `pytest` for backend testing
- Frontend testing not currently configured

### Deployment
- Production deployment via Docker Compose
- Health checks configured for all services
- Logs stored in `./logs/` directory

### External Dependencies
- Discord API for authentication and role checking
- SP-Worlds API for Minecraft nickname validation
- PostgreSQL for data persistence
- Redis for caching and background tasks (optional)

## Current Branch Context

Working on `discord` branch (diverged from `main`). Recent commits focus on Discord role integration and UI styling improvements.