Project Tracker
A full-stack project and task management application for managing projects, employees, tasks, progress, team assignments, and weekly planning with role-based access control.

Overview
Project Tracker provides a centralized dashboard for tracking project progress and managing project teams. The application supports three user roles:

ADMIN — full system access and administration.

MANAGER — manages projects, teams, tasks, and weekly planning.

TEAM_MEMBER — works with assigned projects/tasks and has restricted management access.

The project was developed as a full-stack application with a React/TypeScript frontend and FastAPI backend.

Technology Stack
Frontend
React

TypeScript

Vite

Tailwind CSS

shadcn/ui

lucide-react

React Router

Backend
Python

FastAPI

SQLAlchemy

Pydantic

Alembic

Database
PostgreSQL

Quality & Testing
pytest

Ruff

Alembic migration checks

Frontend production build verification

Application Architecture
Frontend (React + TypeScript)
        |
        | REST API
        v
Backend (FastAPI)
        |
        +-- API / Routes
        +-- Services
        +-- CRUD
        +-- Schemas
        +-- Permissions
        |
        v
PostgreSQL
        ^
        |
    Alembic
The backend follows a layered structure so API routing, business logic, database access, validation, and authorization remain separated.

Core Features
1. Authentication
Implemented the authentication flow with:

Sign In

Sign Up

Password handling

JWT-based authentication

Token validation

Token expiration validation

Role-based authentication

Protected application routes

Logout

Profile / user information

Authentication and authorization were tested across ADMIN, MANAGER, and TEAM_MEMBER roles.

2. Dashboard
The main dashboard provides an overview of project activity.

Implemented:

Total Projects summary

Delayed Projects summary

Project status visualization

Completed / In Progress / Delayed status tracking

Project table

Project search/filtering

Project progress information

Project start/delivery information

Project navigation

The UI was designed to be desktop-friendly and consistent across application pages.

3. Project Management
Implemented project management functionality including:

Project creation

Project viewing

Project updates

Project status

Project description

Project start/delivery information

Project progress

Project members

Role-based project access

Project progress is connected to task activity and status handling.

4. Employee Management
Implemented employee lifecycle management:

Employee creation

Employee listing

Employee details

Employee updates

Employee deletion/deactivation

Employee reactivation/rehire handling

Profile information

Role-aware employee visibility

Team assignment

Employee access was reviewed extensively for authorization and IDOR issues.

5. Team Management
Managers can manage members assigned to their projects.

Implemented:

Add Team Members

Remove Team Members

View project members

Role-based team access

Team member assignment validation

Project-based employee visibility

The team management flow was updated to avoid unsafe delete-and-recreate behaviour when saving unchanged membership.

6. Task Management
Implemented task management including:

Create task

View task

Update task

Delete task

Task status

Task priority

Task assignment

Project association

Task filtering

Task access based on project membership

TEAM_MEMBER users can create tasks, but their tasks are restricted to self-assignment. ADMIN and MANAGER users retain broader project-member assignment capabilities.

Task statuses include:

Not Started

In Progress

Completed

Delayed

7. Weekly Planner
The Weekly Planner is the latest major feature implemented.

It provides a weekly view of tasks assigned to employees and is integrated with the existing dashboard layout.

Planner fields
Task

Employee

Status

Remarks

Week Start

Created By

Created/Updated timestamps

Planner statuses
Not Started

In Progress

Completed

Delayed

Planner permissions
Role	Access
ADMIN	Full access
MANAGER	Full access
TEAM_MEMBER	View only
TEAM_MEMBER users are isolated to their own planner tasks.

Weekly Planner functionality
Implemented:

Weekly task listing

Create planner task

View planner task

Update planner task

Delete planner task

Search

Status filtering

Employee filtering

Week navigation

Role-based permissions

Backend validation

Frontend/backend API integration

The Weekly Planner backend includes:

Database model

Pydantic schemas

Service layer

API routes

PostgreSQL/Alembic migration

Role-based access control

Automated tests

Common Navigation
The application uses a common layout and navigation system across the main pages.

Navigation includes:

Dashboard

Employees

Weekly Planner

Profile

Logout

The Weekly Planner was integrated into the same common Layout rather than maintaining a separate page header/navigation structure.

Role-Based Access Control
Authorization was implemented and reviewed throughout the application.

ADMIN
Full application access

Manage users and employees

Manage projects

Manage teams

Manage tasks

Manage Weekly Planner

Administrative operations

MANAGER
Manage owned projects

Manage project teams

Manage project tasks

Assign tasks to project members

Full Weekly Planner access

Access restricted according to project ownership and membership rules

TEAM_MEMBER
View permitted projects/tasks

Create tasks assigned to themselves

Cannot assign tasks to other users

View Weekly Planner entries permitted to them

Restricted management operations

Authorization was tested against IDOR and privilege-escalation scenarios.

Security & Authorization Work
A significant part of the project involved security hardening and PR review fixes.

Work included:

Employee IDOR protection

Project-based employee visibility

Role-based employee filtering

Protection of ADMIN/MANAGER records from lower roles

Last-admin protection

Safe user activation/deactivation

Employee deletion safeguards

Employee rehire access isolation

JWT exp and sub validation

CI signing-key handling

Audit logging

Project/team assignment authorization

Task access based on current project membership

Protection against stale project/task access

PII exposure review

API response-model validation

Employee rehire isolation
The employee lifecycle was specifically hardened so that a newly created employee using the same email as a previously deleted employee does not unintentionally inherit:

Previous project memberships

Previous task assignments

Previous access rights

Regression tests were added for this scenario.

Audit Logging
Audit logging was added for important employee/project membership operations and reviewed during security hardening.

The logging work included:

Employee assignment/removal events

Employee lifecycle events

Rehire/tombstone operations

PII review in log messages

Duplicate log removal

Structured logging configuration

Appropriate logging levels

Frontend UI/UX Work
The frontend was progressively refined to provide a consistent application experience.

Major UI work included:

Get Started landing page

Sign In / Sign Up pages

Dashboard

Project table

Project details

Employee management

Team management

Profile UI

Role-aware UI

Task creation/editing

Weekly Planner

Common navigation/layout

Responsive/desktop-friendly spacing

Status badges and visual indicators

Search and filtering interfaces

The interface uses Tailwind CSS, shadcn/ui components, and lucide-react icons.

Project Status & Task Status
Project and task status handling was aligned so that task activity can contribute to project progress and status.

Current task/planner status terminology:

Not Started

In Progress

Completed

Delayed

The UI uses consistent status presentation across Dashboard, Projects, Tasks, and Weekly Planner.

Database & Migrations
The database layer uses SQLAlchemy with PostgreSQL.

Alembic is used for schema migrations.

Database work included:

User model

Employee model

Project model

ProjectEmployee relationship

Task model

WeeklyPlanner model

Migration management

Model registration for Alembic autogeneration

Migration-chain verification

Special attention was given to ensuring all SQLAlchemy models are registered with Base.metadata so Alembic autogeneration can correctly detect schema changes.

Testing
Testing was performed throughout backend development and PR review.

Coverage included:

Authentication

User management

Employee management

Employee deletion/reactivation

Employee rehire

Project access

Project employee assignment

Task creation

Task assignment

Task permissions

Weekly Planner CRUD

Weekly Planner filtering

Role-based access

Authorization/IDOR scenarios

Regression cases

Legacy/orphan data handling

The Weekly Planner implementation was verified with the full backend test suite, with 68 tests passing at the completion stage.

Code Quality & CI
The project uses Ruff for Python linting and formatting.

Quality checks included:

Ruff linting

Ruff formatting

pytest

Frontend production builds

Alembic migration verification

CI configuration fixes

CI-related issues addressed during development included:

Ruff rule configuration

Import ordering

Formatting

Test failures

CI JWT configuration

Logging configuration

Major Development Milestones
Initial Application
Created React + TypeScript frontend

Configured Vite

Added Tailwind CSS

Configured shadcn/ui

Implemented authentication pages

Added routing

Built initial dashboard

Project & Employee Management
Added project dashboard

Added project table

Added employee management

Added team management

Added project/employee relationships

Added task management

Added role-based access

Security Hardening
Fixed IDOR vulnerabilities

Hardened employee visibility

Fixed last-admin protection

Secured task/project access

Improved JWT validation

Added audit logging

Fixed employee lifecycle and rehire isolation

Added security regression tests

Weekly Planner
Designed planner UI

Integrated common application layout

Added role-based planner access

Built backend model/schema/service/API

Added PostgreSQL migration

Implemented CRUD

Added filtering/search/week navigation

Integrated frontend with live APIs

Added comprehensive tests

Verified build, linting, migrations, and test suite

Committed and pushed the implementation

Current State
The application currently provides an integrated project-management workflow covering:

Authentication → Dashboard → Projects → Employees → Teams → Tasks → Weekly Planner

The Weekly Planner is integrated with the existing application architecture and uses the same authentication, authorization, database, API, and UI patterns as the rest of the system.

Development Verification
Before merging major changes, the project was verified through:

ruff check .
ruff format .
pytest
npm run build
alembic upgrade head
The exact commands may vary slightly depending on the local environment and repository configuration.

Project Structure
A simplified structure is:

Project Tracker/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── crud/
│   │   ├── database/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   ├── alembic/
│   ├── tests/
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
Summary
Project Tracker evolved from an initial project dashboard into a full-stack project and workforce management application.

The completed scope includes:

Authentication and authorization

Role-based access control

Project management

Employee lifecycle management

Team management

Task management

Project progress tracking

Dashboard reporting

Security hardening

Audit logging

Automated testing

Database migrations

Weekly Planner

Frontend/backend integration

CI and code-quality validation

The system is structured to support continued development while keeping authorization, employee/project relationships, task access, and weekly planning within a consistent application architecture.

