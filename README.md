# Gogentic Portal

A lightweight, fast internal project management portal for Gogentic with shared workspace capabilities and client status sharing.

## 🚀 Features

### Core Functionality
- **Shared Workspace**: Everyone inside Gogentic can see and edit everything
- **Client Status Links**: Read-only status pages for clients (no login required)
- **Branch-Based Defaults**: Smart PM and developer presets based on branch selection
- **Drag-and-Drop Kanban**: Real-time task management with automatic activity logging
- **Auto-Activity Tracking**: Automatic updates when project status, PM, dates, or tasks change

### Business Rules
- **Cortex Branch** → Default PM: Aakansha
- **Solutions Branch** → Default PM: Matthew
- **Fisher Branch** → Default PM: Ian, Default Devs: [Mia, Luke]

## 📁 Project Structure

```
gogentic-portal-real/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── my-work/           # Personal task view
│   ├── projects/          # Project management
│   └── share/             # Client share pages
├── components/            # React components
├── lib/                   # Utilities and database
├── prisma/                # Database schema and migrations
└── public/                # Static assets
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5 with Turbopack
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS
- **Drag & Drop**: @dnd-kit
- **Icons**: Lucide React
- **Date Handling**: date-fns

## 📦 Installation

1. **Clone the repository**
```bash
cd Desktop/gogentic-portal-real
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up the database**
```bash
npx prisma migrate dev
npx prisma db seed
```

4. **Start the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🗂️ Database Schema

### Models
- **User**: Team members (id, name, email, avatar)
- **Project**: Projects with branch, PM, developers, client info, status, and dates
- **Task**: Tasks with status (Todo/Doing/Review/Done), assignee, due date
- **Update**: Activity feed entries
- **Deliverable**: Optional deliverables tracking

### Seeded Data
- 6 users: Ian, Aakansha, Matthew, Sarah, Mia, Luke
- 3 sample projects across different branches
- 15 tasks distributed across status columns
- 8 activity updates

## 🎯 Key Features

### 1. Projects Home
- Table view with all projects
- Filters: Branch, Status, PM, Developer, Client
- Global search functionality
- Quick access to project details

### 2. Project Detail
Three tabs:
- **Overview**: Project info, team, timeline, client share link
- **Tasks**: Drag-and-drop Kanban board with inline task creation
- **Activity**: Auto-generated and manual updates

### 3. My Work
- Personal task view filtered by current user
- Tasks organized by status columns
- Quick navigation to parent projects
- Task count summary

### 4. Client Share Page
- Public read-only view at `/share/[token]`
- No authentication required
- Shows project status, progress, team, and recent updates
- Progress visualization with task counts

## 🔄 Workflow

### Creating a Project
1. Click "New Project" button
2. Select branch (auto-fills PM and developers)
3. Fill in project details
4. Project created with unique client share token

### Managing Tasks
1. Navigate to project's Tasks tab
2. Click "+" in any column to add task
3. Drag tasks between columns to update status
4. Status changes auto-generate activity updates

### Sharing with Clients
1. Go to project Overview tab
2. Copy the client share link
3. Send to client for read-only access
4. Regenerate token if needed for security

## 🔐 User Context

The app includes a mock authentication system:
- Switch users via dropdown in header
- User selection persists in localStorage
- My Work page updates based on selected user
- All actions attributed to current user

## 🎨 UI Components

### Reusable Components
- `ProjectsTable`: Filterable project list
- `TaskBoard`: Drag-and-drop Kanban
- `SortableTask`: Draggable task cards
- `UserSwitcher`: User selection dropdown
- `LayoutWrapper`: Global layout with navigation

### Utility Functions
- `getStatusColor()`: Consistent status badge colors
- `getBranchColor()`: Branch-specific styling
- `cn()`: Tailwind class merging

## 📝 API Routes

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `POST /api/projects/[id]/regenerate-token` - New client token

### Tasks
- `POST /api/tasks` - Create new task
- `PATCH /api/tasks/[id]` - Update task (status, assignee, etc.)

### Updates
- `POST /api/updates` - Create manual update

### Users
- `GET /api/users` - List all users

## 🚦 Acceptance Criteria ✅

All requirements have been met:

1. **Branch defaults work** - Selecting branch auto-fills PM and developers
2. **Drag-and-drop updates** - Task status changes create activity logs
3. **Client links functional** - Copy/regenerate tokens for read-only access
4. **Filters operational** - All filtering and search on Projects Home
5. **My Work personalized** - Shows only current user's tasks
6. **Auto-activity tracking** - Status and assignment changes logged
7. **Seed data loaded** - Three projects with realistic data

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Run database migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

# Open Prisma Studio
npx prisma studio

# Build for production
npm run build
```

## 📊 Performance

- Fast initial load with Turbopack
- Optimistic UI updates for drag-and-drop
- Server Components for data fetching
- Client Components only where needed
- SQLite for zero-latency local development

## 🎯 Non-Goals (Kept Simple)

As requested, the following were NOT implemented:
- Real authentication/roles/permissions
- Budgets/invoicing
- Slack/GitHub integrations
- Email notifications
- WebSocket real-time updates

## 🚀 Deployment to Vercel

**IMPORTANT**: SQLite doesn't work on Vercel's serverless environment. You need to use a cloud PostgreSQL database.

### Quick Setup with Supabase (Free)

1. **Create a Supabase account** at https://supabase.com
2. **Create a new project** (takes ~2 minutes to provision)
3. **Get your database URL**:
   - Go to Settings → Database
   - Copy the "Transaction" connection string
   - It looks like: `postgresql://postgres:[password]@[host]:6543/postgres?sslmode=require`

4. **Update your local project**:
   ```bash
   # Update schema.prisma
   # Change provider from "sqlite" to "postgresql"
   ```

5. **Add to Vercel Environment Variables**:
   - Go to your Vercel project settings
   - Navigate to Environment Variables
   - Add `DATABASE_URL` with your Supabase connection string

6. **Push schema to Supabase**:
   ```bash
   npx prisma db push
   ```

7. **Seed the database** (optional):
   ```bash
   npm run seed
   ```

8. **Redeploy to Vercel**:
   ```bash
   vercel --prod
   ```

### Alternative: Neon (Also Free)
- Sign up at https://neon.tech
- Create a project and copy the connection string
- Follow the same steps as above

### Alternative: Vercel Postgres
- In Vercel dashboard, go to Storage tab
- Create a Postgres database
- It will automatically add the DATABASE_URL to your project

## 📄 License

Internal Gogentic project - not for public distribution.

---

Built with ❤️ for Gogentic's internal team collaboration needs.
// Force redeploy
