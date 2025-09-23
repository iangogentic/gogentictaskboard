# Project: GoGentic Portal

## Project Overview

Project management platform with glassmorphic UI and 70% complete autonomous agent system. Features task management, project organization, AI chat, and extensive agent infrastructure awaiting testing and activation.

## Current Goals

Activate and debug the existing agent system to enable:

1. Natural language task/project management via agent
2. Slack and Google Drive automations (tools already built)
3. Intelligent workflows and automation (infrastructure exists)
4. Testing and debugging the complete agent implementation

## Architecture Decisions

- Framework: Next.js 15.5.2 (App Router)
- State management: React Context + Prisma ORM
- Styling: Tailwind CSS + Glassmorphic UI design system
- Database: Neon PostgreSQL with pgvector extension
- AI: OpenAI GPT-4 (agent planner implemented), conversations working
- Authentication: NextAuth.js with JWT strategy
- Deployment: Vercel
- UI Theme: Dark gradient backgrounds with glass effects

## ACTUAL Implementation Status (2025-09-22 - Updated 16:32 PST)

### ✅ Working Features (Actually Used)

- **Authentication System**
  - Google OAuth login
  - Email/password login (Credentials provider)
  - Session management with NextAuth.js
  - User roles: admin, user

- **Project Management**
  - Basic CRUD for projects
  - Project listing and details
  - Public share links (token-based)
  - 9 projects in database

- **Task Management**
  - Create, update, delete tasks
  - Task status: TODO, IN_PROGRESS, COMPLETED
  - Quick task creation from home page
  - Tasks linked to projects

- **Glass UI Home Page**
  - `/glass-home` - Modern glassmorphic dashboard
  - Personalized greeting "Hello, [username]"
  - Today's tasks with click-to-project navigation
  - Projects overview section
  - Updates feed (minimal data)
  - Standard contrast mode (not high contrast)

- **AI Conversations**
  - `/api/conversations/*` - Chat with AI assistant
  - Conversation persistence per user
  - Message history stored in database
  - AgentSidePanel UI component
  - 3 conversations in database

### ✅ Agent System (Enhanced - Sep 23)

- **Agent System Architecture**
  - ✅ Core files operational (Sep 22):
    - `engine.ts` - Execution engine with error handling & retry logic
    - `memory.ts` - Memory system
    - `conversation.ts` - Conversation handling with history
    - `planner.ts` - GPT-4 planning
    - `service.ts` - Orchestration layer
    - `session-cleanup.ts` - Session management
    - `retry-utils.ts` - Retry logic
  - ✅ 33 tools registered in tool-registry
  - ✅ Task status values fixed: Todo, Doing, Review, Done
  - 🔄 **NEW: Conversational AI Mode (In Development)**
    - 3-phase conversation flow: Clarification → Proposal → Execution
    - Intent analysis before tool execution
    - User confirmation for all actions
    - Context-aware responses

- **Conversation Flow Architecture (NEW)**

  ```
  Phase 1: CLARIFYING → Gather user intent, ask questions
  Phase 2: PROPOSING → Present action plan for approval
  Phase 3: EXECUTING → Run approved actions only
  ```

- **Agent Capabilities**
  - Natural language understanding with clarification
  - Multi-turn conversations with context
  - Smart intent detection
  - Action confirmation before execution
  - Formatted, human-readable responses
  - Project/task management via conversation
  - Slack and Google Drive integrations

- **Completely Unused Systems (0 rows in DB)**
  - Time Tracking (TimeEntry: 0 rows)
  - Workflow Automation (Workflow, WorkflowExecution: 0 rows)
  - RAG/Documents (Document, Embedding: 0 rows)
  - Audit Logging (AuditLog: 0 rows)
  - Saved Views (SavedView: 0 rows)
  - Project Integrations (ProjectIntegration: 0 rows)

- **Minimal Usage**
  - Portfolio system (exists but barely used)
  - Deliverables (only 2 rows in database)
  - Updates/Activity (limited data)

### 📊 Database Reality Check (2025-09-22)

Tables with data:

- User: 12 users
- Project: 9 projects
- Task: 6 tasks
- Conversation: 3 conversations
- Message: 8 messages
- Session/Account: Auth data
- IntegrationCredential: 21 rows (OAuth tokens ready for agent use)

Empty tables (14 total):

- AgentAnalytics, AgentSession, AuditLog
- Document, Embedding
- ProjectIntegration, SavedView
- ScheduledTask, TimeEntry, VerificationToken
- Workflow, WorkflowExecution

### 🚧 Agent Implementation Plan

#### Phase 1: Core Engine (Current Focus)

1. **Create `engine.ts`** - Execution engine for running agent plans
2. **Create `memory.ts`** - Context and memory management
3. **Fix `conversation.ts`** - Proper conversation handling
4. **Test basic tool execution** - Get one tool working end-to-end

#### Phase 2: Connect Existing Systems

1. **Link IntegrationCredentials** - Connect existing OAuth tokens to agent
2. **Enable project tools** - CRUD operations via natural language
3. **Enable task tools** - Task management via chat
4. **Test with real data** - Use existing projects/tasks

#### Phase 3: Advanced Features

1. **Slack integration** - Send messages, create summaries
2. **Google Drive** - Upload/download files
3. **Workflows** - Scheduled and recurring tasks
4. **RAG system** - Document search and knowledge base

#### Phase 4: Production UI

1. **Agent chat in main UI** - Replace test pages
2. **Plan approval flow** - User confirmation UI
3. **Workflow builder** - Visual workflow creation
4. **Analytics dashboard** - Agent usage metrics

## Implementation Progress Log

### 2025-09-22 Agent Implementation

#### Step 1: Update CLAUDE.md ✅

- Updated with accurate current state
- Removed false claims about working features
- Added clear implementation plan
- Reality: 60% of documented features are unused

#### Step 2: Verify Core Files ✅

- Discovered ALL agent files already exist:
  - engine.ts (10KB, created Sep 19)
  - memory.ts (8KB, created Sep 17)
  - conversation.ts (10KB, updated Sep 22)
  - planner.ts (8KB)
  - service.ts (8KB)
  - tool-registry.ts (17KB)
  - Plus 5 more supporting files
- Total: 11 agent system files implemented

#### Step 3: Test Agent System ✅

- Created test page at `/agent-test`
- Built UI for testing agent workflow:
  - Create session
  - Generate plan
  - Approve and execute
- Ready for testing with real requests

#### Step 4: System Verification ✅ (Sep 22, 2025)

- Verified all 11 agent files exist and are implemented
- Found TypeScript compilation issues (import paths)
- Confirmed agent never tested (0 rows in agent tables)
- Discovered system is 70% complete, not 0%

#### Step 5: Next Steps - Fix and Test

1. Fix TypeScript import path issues
2. Test agent at `/agent-test` page
3. Debug runtime errors
4. Connect IntegrationCredentials to agent context

- ⏳ Webhook system for external integrations

## File Structure Map

```
/
├── app/                          # Next.js App Router
│   ├── _components/             # Shared components
│   │   └── WhoAmI.tsx          # User identity component
│   ├── activity/               # Activity feed
│   ├── dashboard/              # Main dashboard
│   ├── login/                  # Authentication
│   ├── register/               # User registration
│   ├── my-work/                # Personal task view
│   ├── portfolio/              # Portfolio management
│   ├── projects/               # Project management
│   │   ├── [id]/              # Project details
│   │   │   └── edit/          # Project editing
│   │   ├── new/               # New project
│   │   └── new-from-template/ # Template-based creation
│   ├── reports/                # Reporting dashboard
│   ├── share/                  # Public share pages
│   ├── team/                   # Team management
│   ├── test-agent/             # Agent testing UI
│   ├── test-autonomous/        # Autonomous agent testing
│   ├── users/                  # User management
│   └── api/                    # API routes (57 total)
│       ├── admin/              # Admin endpoints (4)
│       ├── agent/              # Agent endpoints (9)
│       ├── auth/               # Auth endpoints (4)
│       ├── google/             # Drive endpoints (7)
│       ├── portfolios/         # Portfolio endpoints
│       ├── projects/           # Project endpoints
│       ├── rag/                # RAG endpoints (2)
│       ├── slack/              # Slack endpoints (6)
│       ├── tasks/              # Task endpoints (3)
│       └── [others]            # Additional endpoints
├── components/                  # UI components
│   ├── ui/                     # shadcn/ui components
│   └── [custom components]     # Project-specific components
├── lib/                        # Core library code
│   ├── agent/                 # Agent system (11 files, 70% complete)
│   │   ├── tools/            # Tool implementations (10 files, all exist)
│   │   │   ├── ai-tools.ts
│   │   │   ├── drive-tools.ts
│   │   │   ├── project-tools.ts
│   │   │   ├── rag-tools.ts
│   │   │   ├── search-tools.ts
│   │   │   ├── slack-tools.ts
│   │   │   ├── task-tools.ts
│   │   │   ├── update-tools.ts
│   │   │   └── workflow-tools.ts
│   │   ├── engine.ts         # Execution engine (exists)
│   │   ├── planner.ts        # GPT-4 planning (exists)
│   │   ├── memory.ts         # Memory system (exists)
│   │   ├── conversation.ts   # Chat handling (exists)
│   │   ├── service.ts        # Agent orchestration
│   │   ├── tool-registry.ts  # Central tool registration (33 tools)
│   │   └── [5 more files]    # Supporting infrastructure
│   ├── rag/                  # RAG system
│   ├── slack.ts              # Slack service singleton
│   ├── google-drive.ts       # Drive service singleton
│   ├── embeddings.ts         # Embedding service
│   ├── auth.ts               # Authentication utilities
│   └── prisma.ts             # Database client
├── prisma/                    # Database schema
│   └── schema.prisma         # Complete schema definition
└── fix-*.js                  # Database fix scripts
```

## Pages Directory (23 pages)

| Page             | Route                         | Purpose                 |
| ---------------- | ----------------------------- | ----------------------- |
| Dashboard        | `/dashboard`                  | Main dashboard view     |
| Activity         | `/activity`                   | Activity feed           |
| Reports          | `/reports`                    | Analytics and reporting |
| Team             | `/team`                       | Team management         |
| Projects List    | `/projects`                   | All projects view       |
| Project Detail   | `/projects/[id]`              | Single project view     |
| Project Edit     | `/projects/[id]/edit`         | Edit project            |
| New Project      | `/projects/new`               | Create project          |
| Project Template | `/projects/new-from-template` | Template creation       |
| Portfolio        | `/portfolio/[key]`            | Portfolio view          |
| Users            | `/users`                      | User management         |
| New User         | `/users/new`                  | Create user             |
| Share            | `/share/[token]`              | Public share view       |
| Test Agent       | `/test-agent`                 | Agent testing interface |
| Test Autonomous  | `/test-autonomous`            | Autonomous testing      |

## API Endpoints (57 total)

### Agent APIs (9 endpoints)

| Endpoint                   | Method     | Purpose                   |
| -------------------------- | ---------- | ------------------------- |
| `/api/agent/chat`          | POST       | Standard chat interaction |
| `/api/agent/chat-v2`       | POST       | Enhanced chat v2          |
| `/api/agent/execute`       | POST       | Execute agent actions     |
| `/api/agent/plan`          | POST       | Generate action plans     |
| `/api/agent/approve`       | POST       | Approve agent actions     |
| `/api/agent/autonomous`    | POST       | Autonomous mode           |
| `/api/agent/hybrid`        | POST       | Hybrid execution mode     |
| `/api/agent/sessions`      | GET/POST   | Session management        |
| `/api/agent/sessions/[id]` | GET/DELETE | Individual session        |

### Slack APIs (6 endpoints)

| Endpoint                   | Method | Purpose              |
| -------------------------- | ------ | -------------------- |
| `/api/slack/auth`          | POST   | OAuth authentication |
| `/api/slack/channels`      | GET    | List channels        |
| `/api/slack/webhook`       | POST   | Webhook handler      |
| `/api/slack/test`          | GET    | Test integration     |
| `/api/slack/link-project`  | POST   | Link to project      |
| `/api/slack/daily-summary` | POST   | Daily summaries      |

### Google Drive APIs (7 endpoints)

| Endpoint              | Method   | Purpose           |
| --------------------- | -------- | ----------------- |
| `/api/google/auth`    | GET/POST | OAuth flow        |
| `/api/google/files`   | GET/POST | File operations   |
| `/api/google/folders` | POST     | Folder management |
| `/api/google/share`   | POST     | Share files       |
| `/api/google/search`  | GET      | Search files      |
| `/api/google/quota`   | GET      | Check quota       |
| `/api/google/test`    | GET      | Test connection   |

### Project & Task APIs

| Endpoint                              | Method         | Purpose         |
| ------------------------------------- | -------------- | --------------- |
| `/api/projects`                       | GET/POST       | Project CRUD    |
| `/api/projects/[id]`                  | GET/PUT/DELETE | Single project  |
| `/api/projects/[id]/archive`          | POST           | Archive project |
| `/api/projects/[id]/regenerate-token` | POST           | New share token |
| `/api/tasks`                          | GET/POST       | Task CRUD       |
| `/api/tasks/[id]`                     | GET/PUT/DELETE | Single task     |
| `/api/tasks/bulk`                     | POST           | Bulk operations |

### Additional APIs

| Category     | Count | Key Endpoints                                                |
| ------------ | ----- | ------------------------------------------------------------ |
| Admin        | 4     | account-audit, account-fix, sessions/clear, fix-integrations |
| Auth         | 4     | register, [...nextauth], \_debug, \_cookiecheck              |
| RAG          | 2     | search, sync                                                 |
| Time Entries | 2     | CRUD operations                                              |
| Users        | 2     | User management                                              |
| Portfolio    | 2     | Portfolio operations                                         |
| Others       | 10+   | deliverables, updates, saved-views, health, etc.             |

## Agent Tool Registry (~21 working tools)

### Tool Categories

- **Project Tools** (4): CRUD operations for projects
- **Task Tools** (4): Task management operations
- **Update Tools** (2): Project updates
- **Analytics Tools** (2): Metrics and analytics
- **Slack Tools** (5): Messaging, channels, summaries
- **Drive Tools** (8): File operations, sharing
- **RAG Tools** (3): Document sync, search, indexing
- **Workflow Tools** (5): Automation workflows
- **AI Tools**: LLM interactions
- **Search Tools**: Cross-platform search

## Database Schema

### Core Models

- **User**: Authentication and profile
- **Portfolio**: Project grouping with color coding
- **Project**: Core project entity with health tracking
- **Task**: Task management with time estimates
- **TimeEntry**: Time tracking records
- **ProjectMember**: Team assignments
- **SavedView**: Custom view preferences

### Integration Models

- **IntegrationCredential**: Store OAuth tokens (CRITICAL for agent access)
- **Document**: RAG document storage
- **Embedding**: Vector embeddings with pgvector
- **Workflow**: Automation workflows
- **WorkflowExecution**: Execution logs
- **ScheduledTask**: Cron-based scheduling

### Communication Models

- **Update**: Project updates
- **Conversation**: Chat sessions
- **Message**: Individual messages
- **Notification**: User notifications
- **AuditLog**: System audit trail

## Component Registry

| Component      | Location                          | Purpose                    |
| -------------- | --------------------------------- | -------------------------- |
| WhoAmI         | `/app/_components/WhoAmI.tsx`     | User identity display      |
| My Work Client | `/app/my-work/my-work-client.tsx` | Task dashboard client      |
| UI Components  | `/components/ui/*`                | 15+ shadcn/ui components   |
| Agent Chat     | Various test pages                | Agent interaction UI       |
| Project Cards  | Project pages                     | Project display components |

## Commands

```bash
# Development
npm run dev                     # Start dev server
npm run build                   # Production build
npm run lint                    # Run ESLint
npm run typecheck              # TypeScript checking
npm test                       # Run tests

# Database
npx prisma studio              # Open Prisma Studio
npx prisma migrate dev         # Run migrations
npx prisma generate            # Generate client

# Fix Scripts
node fix-slack-integration.js      # Fix local integrations
node fix-slack-integration-prod.js # Fix production integrations
```

## Environment Variables

### Core Database

- `DATABASE_URL` - Neon PostgreSQL connection
- `DIRECT_URL` - Neon direct connection (for migrations)

### Authentication

- `NEXTAUTH_URL` - Authentication base URL
- `NEXTAUTH_SECRET` - NextAuth encryption secret

### AI & Embeddings

- `OPENAI_API_KEY` - OpenAI API access
- `OPENAI_ORG_ID` - OpenAI organization

### Slack Integration

- `SLACK_BOT_TOKEN` - Bot authentication token
- `SLACK_BOT_USER_ID` - Bot user identifier
- `SLACK_TEAM_ID` - Workspace identifier
- `SLACK_CLIENT_ID` - OAuth client ID
- `SLACK_CLIENT_SECRET` - OAuth client secret

### Google Integration

- `GOOGLE_CLIENT_ID` - OAuth2 client ID
- `GOOGLE_CLIENT_SECRET` - OAuth2 client secret
- `GOOGLE_REDIRECT_URI` - OAuth callback URL

### Admin & Monitoring

- `ADMIN_FIX_TOKEN` - Admin endpoint authentication
- `SENTRY_DSN` - Error tracking
- `SENTRY_AUTH_TOKEN` - Sentry authentication

## IMPORTANT RULES FOR CLAUDE

1. **ALWAYS update this file** after making significant changes
2. **CHECK IntegrationCredential records** before assuming integrations work - agent requires these DB records
3. **USE existing patterns** - check existing code before creating new components
4. **TRACK all agent tool changes** in tool-registry.ts - tools must be registered
5. **MAINTAIN context** by reading this file first in every session
6. **RUN lint and typecheck** before committing any changes
7. **NEVER commit secrets** - always use environment variables
8. **TEST integrations** using test endpoints (/api/test-slack, /api/google/test)
9. **VERIFY database state** using Prisma Studio for debugging
10. **USE fix scripts** when IntegrationCredential records are missing

## Knowledge Graph Relationships

- Agent tools → Service singletons (SlackService, GoogleDriveService)
- IntegrationCredential records → Agent tool availability
- Tool registry → Agent capabilities
- Projects → Tasks, Updates, Documents, TimeEntries
- Documents → Embeddings (RAG system)
- Portfolio → Projects (grouping)
- User → ProjectMember → Project (team structure)
- Workflow → WorkflowExecution (automation)

## Critical Integration Details

### Agent Integration Requirements

1. Tool must be defined in `/lib/agent/tools/[category]-tools.ts`
2. Tool must be imported and registered in `tool-registry.ts`
3. User must have IntegrationCredential record for scoped tools
4. Environment variables must be set in Vercel/local
5. OAuth flow must be completed for user-specific tokens

### Known Issues & Solutions

**Problem**: Agent reports "I don't have access to Slack/Drive"

- **Root Cause**: Missing IntegrationCredential records in database
- **Solution**: Run fix scripts or use `/api/admin/fix-integrations` endpoint
- **Verification**: Check `/api/test-slack` or `/api/google/test` endpoints

**Problem**: Agent tools not recognized

- **Root Cause**: Tools not registered in tool-registry.ts
- **Solution**: Import tool collection and add to registerTools() call
- **Verification**: Check tool count in agent response

**Problem**: OAuth tokens expired

- **Root Cause**: Tokens need refresh
- **Solution**: Re-authenticate via `/api/slack/auth` or `/api/google/auth`
- **Verification**: Test with respective test endpoints

## Testing Infrastructure

- **Test Pages**: `/test-agent`, `/test-autonomous` for UI testing
- **Test Endpoints**: `/api/test-slack`, `/api/google/test` for integration testing
- **Error Testing**: `/test-error` for Sentry integration
- **Health Checks**: `/api/health`, `/api/probe/db`, `/api/probe/whoami`
- **Debug Endpoints**: `/api/auth/_debug`, `/api/auth/_cookiecheck`

## Claude Test Account

For automated testing and verification, a dedicated test account has been created:

- **Email**: `claude.test@gogentic.ai`
- **Password**: `claude-test-2025`
- **User ID**: `claude_test_user_2025`
- **Features**: Full access to Slack and Drive integrations
- **Purpose**: Enables Claude to test production deployment via Playwright MCP

### Testing Workflow with Playwright

**IMPORTANT**: Always test like a real user would and monitor console logs for errors during testing.

```javascript
// 1. Navigate to login page
await browser_navigate("https://gogentic-portal-real.vercel.app/login");

// 2. Fill in credentials using form fields
await browser_fill_form([
  { name: "Email", type: "textbox", value: "claude.test@gogentic.ai" },
  { name: "Password", type: "textbox", value: "claude-test-2025" },
]);

// 3. Click sign in button
await browser_click("Sign in button");

// 4. Check console for errors after each action
await browser_console_messages(); // Monitor for any errors

// 5. Verify successful navigation to dashboard
// Expected URL: https://gogentic-portal-real.vercel.app/dashboard
```

### Testing Best Practices

1. **Always check console logs**: Use `browser_console_messages()` to catch JavaScript errors, API failures, and authentication issues
2. **Test user flows**: Navigate through the application as a real user would
3. **Monitor network requests**: Check for failed API calls or 401/403 errors
4. **Verify page transitions**: Ensure successful navigation after login
5. **Common errors to watch for**:
   - `Failed to fetch users: SyntaxError` - API endpoint issues
   - `Failed to load navigation data` - Authentication or session problems
   - `401 Unauthorized` - Auth token issues
   - `TypeError` or `ReferenceError` - JavaScript execution errors

### Debugging Authentication Issues

When login fails, check:

1. Console errors immediately after clicking sign in
2. Network tab for failed `/api/auth/callback/credentials` requests
3. Verify the user exists in Neon database via MCP
4. Check if credentials provider is enabled in production
5. Ensure auth.ts and auth.config.ts are properly configured

## UI Migration: Glassmorphic Design System (2025-09-20)

### Overview

Implementing a modern glassmorphic UI across ALL pages. The glass-home page and AI agent panel have been completed as reference implementations. Now migrating all remaining pages to match this aesthetic.

### ✅ Completed Components

1. **Glass-Home Page** (`/glass-home`)
   - Full glassmorphic dashboard with glass cards
   - Gradient backgrounds with blur effects
   - Minimal, clean typography

2. **AI Agent Panel** (`components/AgentSidePanel.tsx`)
   - Ultra-minimal glass pane design
   - Subtle white/[0.03] opacity levels
   - Icon-only quick actions
   - Beautiful message bubbles with truncation

### Design System Standards

#### Glass Effects

```css
/* Primary glass panel */
bg-white/[0.02] backdrop-blur-xl border-white/5

/* Secondary glass panel */
bg-white/[0.05] backdrop-blur-lg border-white/10

/* Hover states */
hover:bg-white/[0.08] hover:border-white/15

/* Text hierarchy */
text-white/90  /* Primary text */
text-white/70  /* Secondary text */
text-white/50  /* Tertiary text */
text-white/30  /* Placeholder/disabled */
```

#### Component Patterns

- **Cards**: Rounded-2xl with glass effect
- **Buttons**: Minimal with subtle hover states
- **Inputs**: bg-white/[0.03] with clean borders
- **Navigation**: Transparent with backdrop blur
- **Modals**: Centered glass panels with overlay

### 🎯 Full Site Glass Migration Plan

#### Priority Order (by user visibility & impact)

##### **Wave 1: Core User Journey** (Highest Priority)

1. **Login Page** (`/login`)
   - Glass card for login form
   - Animated gradient background
   - Minimal input fields
   - Social login buttons with glass effect

2. **Dashboard** (`/dashboard`)
   - Convert all cards to glass panels
   - Add gradient mesh background
   - Minimize text, use icons more
   - Glass navigation bar

3. **Projects List** (`/projects`)
   - Glass project cards with hover effects
   - Floating action buttons
   - Minimal grid layout
   - Search bar with glass effect

4. **My Work** (`/my-work`)
   - Glass task cards
   - Clean Kanban board style
   - Minimal status badges
   - Time tracking with glass panels

##### **Wave 2: Project Management**

5. **Project Detail** (`/projects/[id]`)
   - Glass tabs for sections
   - Minimal content cards
   - Clean task list
   - Glass update feed

6. **New Project** (`/projects/new`)
   - Multi-step glass form
   - Minimal field styling
   - Progress indicator
   - Template selection cards

7. **Edit Project** (`/projects/[id]/edit`)
   - Glass form panels
   - Auto-save indicator
   - Minimal buttons

##### **Wave 3: Team & Analytics**

8. **Team Page** (`/team`)
   - Glass member cards
   - Minimal avatars
   - Role badges with glass
   - Activity timeline

9. **Reports** (`/reports`)
   - Glass chart containers
   - Minimal data tables
   - KPI cards with gradients
   - Filter panels

10. **Activity Feed** (`/activity`)
    - Glass timeline cards
    - Minimal timestamps
    - Icon-based actions

##### **Wave 4: Admin & Settings**

11. **Users Management** (`/users`)
    - Glass table design
    - Minimal row actions
    - Search/filter panel

12. **Portfolio View** (`/portfolio/[key]`)
    - Glass portfolio cards
    - Color-coded with transparency
    - Minimal project grid

##### **Wave 5: Public & Testing**

13. **Share Page** (`/share/[token]`)
    - Public-facing glass design
    - Read-only glass panels
    - Minimal branding

14. **Register** (`/register`)
    - Glass onboarding flow
    - Step indicators
    - Welcome animation

### Glass Component Library

Create reusable components in `/components/glass/`:

```typescript
// Core Components Needed
-GlassCard.tsx - // Base glass container
  GlassButton.tsx - // Minimal buttons
  GlassInput.tsx - // Form inputs
  GlassModal.tsx - // Overlay dialogs
  GlassNav.tsx - // Navigation bar
  GlassTable.tsx - // Data tables
  GlassTab.tsx - // Tab navigation
  GlassSelect.tsx - // Dropdowns
  GlassAvatar.tsx - // User avatars
  GlassChart.tsx - // Chart containers
  GlassBadge.tsx - // Status badges
  GlassTooltip.tsx; // Hover tooltips
```

### Migration Rules

1. **Remove all solid backgrounds** → Replace with glass effect
2. **Reduce opacity of all text** → Use white/70, white/50, white/30
3. **Minimize borders** → Use white/5 or white/10 max
4. **Add backdrop blur to everything** → backdrop-blur-xl standard
5. **Replace shadows with glow** → Use colored shadows sparingly
6. **Reduce padding/spacing** → Tighter, more minimal layout
7. **Icon-first design** → Replace text labels with icons where possible
8. **Truncate long text** → Show less, focus on essential info
9. **Animate on interaction** → Subtle hover/click effects
10. **Gradient accents only** → Use gradients for emphasis, not backgrounds

#### Phase 2: Route Structure

Use Next.js route groups to separate old and new UI:

```
app/
├── (classic)/          # Current UI (keep intact)
│   ├── dashboard/      # Existing dashboard
│   ├── projects/       # Existing projects pages
│   └── ...
├── (modern)/           # New glassmorphic UI
│   ├── page.tsx        # New landing page
│   ├── layout.tsx      # Glass layout wrapper
│   └── dashboard/      # New dashboard design
```

#### Phase 3: Theme System Implementation

```typescript
// lib/themes/constants.ts
export const THEMES = {
  AURORA: { a: "rgba(120,119,198,.9)", b: "rgba(0,179,255,.6)" },
  NEON_MINT: { a: "rgba(16,185,129,.9)", b: "rgba(34,211,238,.6)" },
  SUNSET: { a: "rgba(251,146,60,.9)", b: "rgba(239,68,68,.6)" },
  ORCHID: { a: "rgba(168,85,247,.9)", b: "rgba(236,72,153,.6)" },
};
```

#### Phase 4: Feature Flags

Add to `.env.local`:

```
NEXT_PUBLIC_NEW_UI=false  # Set to true to enable new UI
```

### Migration Checklist

- [ ] Install Framer Motion
- [ ] Create glass component library
- [ ] Setup theme provider and context
- [ ] Implement new landing page at `app/(modern)/page.tsx`
- [ ] Create glass layout wrapper
- [ ] Add theme persistence (localStorage + database)
- [ ] Migrate dashboard to new design
- [ ] Setup feature flag system
- [ ] Test with Playwright (both UI versions)
- [ ] Performance testing for blur effects
- [ ] Gradual rollout to other pages

### Component Migration Map

| Current Component | New Glass Component | Status   |
| ----------------- | ------------------- | -------- |
| Card              | GlassCard           | To build |
| Badge             | Badge (glass)       | To build |
| Button            | GlassButton         | To build |
| Navigation        | TopBar (glass)      | To build |
| Sidebar           | Glass sidebar       | To build |

### API Endpoints (New)

- `POST /api/user/preferences` - Save theme preference
- `GET /api/user/preferences` - Get user theme settings

### Database Changes

```sql
-- Add user preferences table (non-breaking)
CREATE TABLE "UserPreferences" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id"),
  "theme" TEXT DEFAULT 'AURORA',
  "clarityMode" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Testing Strategy

1. Keep existing Playwright tests for classic UI
2. Create parallel tests for modern UI
3. Test theme switching and persistence
4. Verify no performance regression
5. Check accessibility with both clarity modes

### Rollback Plan

- Feature flags allow instant rollback
- No database migrations that break existing schema
- Keep both UI versions until fully validated
- Monitor performance metrics during rollout

### Performance Considerations

- Lazy load glass components
- Optimize blur effects for mobile
- Use CSS containment for glass cards
- Monitor Core Web Vitals
- Consider reduced motion preferences

### Key Files to Create/Modify

1. `components/glass/*` - New component library
2. `app/(modern)/layout.tsx` - Glass layout wrapper
3. `app/(modern)/page.tsx` - New landing page
4. `lib/themes/provider.tsx` - Theme context
5. `tailwind.config.js` - Add glass utilities
6. `middleware.ts` - Route to correct UI version

### IMPORTANT NOTES FOR IMPLEMENTATION

- DO NOT modify existing pages in `app/` directly
- Use route groups to separate UI versions
- All new components go in `components/glass/`
- Test both UIs work simultaneously
- Preserve all existing functionality
- Use the mockup at `C:\Users\ianig\Desktop\ui for portal\gogentic_portal_landing_page_draft_ui.jsx` as reference

## Recent Changes (2025-09-21)

### UI Migration to Glassmorphic Design - ACTIVE

**✅ Completed Components:**

- **GlassLayout** - Global wrapper with dark animated gradient background
- **glass-home page** - Fully migrated dashboard with glass cards
- **AgentSidePanel** - Replaced old AgentChatContainer globally
- **Glass Component Library:**
  - GlassCard, GlassButton, GlassInput, GlassNav
  - Badge, ProgressRing, AnimatedBackground
  - ThemeMenu, GlassTopBar

**🔄 Current Implementation Strategy (Option A - Progressive Enhancement):**

- Enhancing existing components with glass mode support
- No duplicate code, preserving existing functionality
- Components detect GlassLayout wrapper and adapt styling

**📋 Migration Status:**
| Page/Component | Status | Notes |
|----------------|--------|-------|
| glass-home | ✅ Complete | Full glass UI with dark background |
| GlassLayout | ✅ Complete | Dark animated gradient, wraps all pages |
| AI Panel | ✅ Complete | AgentSidePanel with toggle button |
| Projects List | ⏳ Pending | Needs glass styling |
| Project Detail | 🔄 In Progress | Creating GlassTabs, updating TaskBoard |
| Dashboard | ⏳ Pending | Classic dashboard still in use |
| Team/Reports/Activity | ⏳ Pending | Still using old UI |

**🎯 Current Task:**
Implementing glass mode for Project Detail page by:

1. Creating reusable GlassTabs component
2. Adding glass mode to TaskBoardWithBulk
3. Updating ProjectDetail to support glass styling

### Previous Changes (2025-09-20)

- Added 33 new agent tools (Slack, Drive, RAG, Workflow integrations)
- Fixed IntegrationCredential records for all 16 production users
- Created test endpoints for Slack and Drive verification
- Resolved compilation errors in tool definitions
- Documented actual project structure (57 API routes, 24 pages)
- Updated CLAUDE.md to reflect true project state
- Added Credentials provider for email/password authentication
- Created Claude test account for automated testing
- Enabled email/password login alongside Google OAuth
