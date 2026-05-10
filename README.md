# Team Task Manager

A production-ready full-stack task management app for creating projects, managing team members, assigning tasks, and tracking delivery progress with Admin and Member role-based access control.


## Live Demo
https://teamtaskmanager-production-d5f9.up.railway.app/login?next=%2Fdashboard

## Features

- Email/password signup, login, logout
- Admin/Member account type selection on signup and login
- Password hashing with `bcrypt`
- Admin and Member role-based access control in both UI and API routes
- Workspace isolation so each admin has their own team ecosystem
- Email-based member invitations with automatic workspace/project joining on signup
- Project CRUD for admins
- Project membership management for admins
- Task creation, assignment, filtering, status tracking, and deletion
- Member-only views for joined projects and assigned tasks
- Dashboard analytics for task status counts, overdue work, recent tasks, and project statistics
- Zod validation for all API request bodies
- Prisma relationships and cascading behavior
- Railway-ready PostgreSQL deployment

## Tech Stack

- Next.js App Router
- TypeScript
- PostgreSQL
- Prisma ORM
- Tailwind CSS
- Custom JWT cookie authentication with `jose`
- `bcrypt` password hashing
- `zod` request validation
- Clean Tailwind dashboard components


## Screenshots

### Login  
![Login](./images/Login.png)

### Admin Dashboard 
![Admin Dashboard](./images/AdminDashboard.png)

### Admin Projects 
![Admin Projects](./images/AdminProjects.png)

### Admin Project
![Member Project](./images/ProductLaunchProjectAdmin.png)

### Admin New Task
![Admin New Task](./images/AdminNewTask.png)

### Admin Tasks 
![Admin Tasks](./images/AdminTasks.png)

### Member Dashboard
![Member Dashboard](./images/MemberDashboard.png)

### Member Projects
![Member Projects](./images/MemberProjects.png)

### Member Tasks
![Member Tasks](./images/MemberTasks.png)

## Demo Video

## Demo Credentials

Seeded users are optional demo data only:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@example.com` | `Admin123!` |
| Member | `member@example.com` | `Member123!` |
| Member | `alex@example.com` | `Alex123!` |

Signup and login both include an Admin/Member selector. New Admin signups create a fresh workspace. New Member signups join an admin workspace through a pending invite or by entering the workspace admin's email. Admins can view workspace users on the Profile screen and then add members to projects or assign tasks.


## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Start a local PostgreSQL database. Create a database named `team_task_manager` or update `DATABASE_URL` to match your database.

3. Create a `.env` file and set these environment variables:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/team_task_manager?schema=public"
AUTH_SECRET="replace-with-a-long-random-secret"
APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
RESEND_API_KEY=""
INVITE_EMAIL_FROM="Team Task Manager <onboarding@resend.dev>"
```

`RESEND_API_KEY` and `INVITE_EMAIL_FROM` are optional for local development. Without them, invitations are saved and the invite link is logged in the server console. Configure them in production to send real emails.

4. Create database tables:

```bash
npm run prisma:dev
```

5. Optional: seed demo data:

```bash
npm run prisma:seed
```

6. Start the app:

```bash
npm run dev
```


## Supabase Database Setup

If you use Supabase instead of local PostgreSQL:

1. Copy the Supabase Session Pooler connection string into `.env` as `DATABASE_URL`.
2. Keep `?schema=public` at the end of the URL.
3. Apply the committed migrations:

```bash
npm run prisma:migrate
```

4. Start the app:

```bash
npm run dev
```

Use `npm run prisma:dev` only for a local development database. Hosted databases such as Supabase should use `npm run prisma:migrate`.

## Scripts

```bash
npm run dev              # Start local development server
npm run build            # Prisma generate + production build
npm run start            # Start production server
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript checks
npm run prisma:generate  # Generate Prisma client
npm run prisma:dev       # Create local development migration
npm run prisma:migrate   # Apply migrations in deploy environments
npm run prisma:seed      # Seed demo data
```

## API Routes

Auth:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Users:

- `GET /api/users` - Admin only

Projects:

- `GET /api/projects` - Admin sees all, members see joined projects
- `POST /api/projects` - Admin only
- `GET /api/projects/:id` - Admin or project member
- `PATCH /api/projects/:id` - Admin only
- `DELETE /api/projects/:id` - Admin only

Project members:

- `GET /api/projects/:id/members` - Admin or project member
- `POST /api/projects/:id/members` - Admin only; accepts an existing workspace `userId` or a new member `email`
- `DELETE /api/projects/:id/members/:userId` - Admin only

Tasks:

- `GET /api/tasks?status=&projectId=&overdue=` - Admin sees all, members see assigned tasks
- `POST /api/tasks` - Admin only
- `GET /api/tasks/:id` - Admin or assigned member
- `PATCH /api/tasks/:id` - Admin can update all fields; members can update status only on their own tasks
- `DELETE /api/tasks/:id` - Admin only

Dashboard:

- `GET /api/dashboard` - Role-filtered project/task analytics

## RBAC Summary

Admins can:

- Create their own isolated workspace by signing up as Admin
- View workspace users on the Profile screen
- Create, edit, and delete projects
- Invite project members by email
- Add and remove project members inside their workspace
- Create, edit, delete, and assign tasks
- Change any task status
- View all projects, tasks, users, and dashboard analytics

Members can:

- Join an admin workspace by signing up as Member with either an invite or the admin's email address
- View only projects they belong to
- View only tasks assigned to them
- Update only the status of their own assigned tasks
- View role-filtered dashboard analytics

Members cannot create projects, manage team members, assign tasks, update task details beyond status, or delete tasks. These rules are enforced by API handlers, not just hidden UI controls. Admins and members are also scoped to a single workspace, so one admin cannot see another admin's projects or users.

## Railway Deployment

1. Push this project to GitHub.
2. Create a new Railway project from the GitHub repository.
3. Add a Railway PostgreSQL service.
4. Set variables on the web service:

```bash
DATABASE_URL="${{Postgres.DATABASE_URL}}"
AUTH_SECRET="generate-a-long-random-secret"
APP_URL="https://your-railway-domain.up.railway.app"
NEXT_PUBLIC_APP_URL="https://your-railway-domain.up.railway.app"
RESEND_API_KEY="your-resend-api-key"
INVITE_EMAIL_FROM="Team Task Manager <onboarding@your-domain.com>"
```

5. Railway build command:

```bash
npm run build
```

6. Railway start command:

```bash
npm run start
```

7. Apply migrations after the database is connected:

```bash
npm run prisma:migrate
```

8. Seed demo data once, only when desired:

```bash
npm run prisma:seed
```

Do not run seed automatically on every deploy because it resets demo data.


## Future Enhancements

- A user may belongs to one workspace at a time.
- Email verification or password reset flow.
- Real invitation email delivery should not require Resend environment variables.
- The UI should use a drag-and-drop Kanban board.
