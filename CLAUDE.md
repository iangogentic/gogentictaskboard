# Project: GoGentic Portal

## Project Overview

AI-powered project management platform with autonomous agent capabilities for automating tasks, managing integrations, and providing intelligent assistance to development teams. Features portfolio management, time tracking, public sharing, and comprehensive workflow automation.

## Architecture Decisions

- Framework: Next.js 15.5.2 (App Router)
- State management: React Context + Prisma ORM
- Styling: Tailwind CSS + shadcn/ui components
- Database: Neon PostgreSQL with pgvector extension
- AI: OpenAI GPT-4 for agent, text-embedding-3-small for RAG
- Testing: Jest + React Testing Library
- Error Tracking: Sentry integration
- Authentication: NextAuth.js with JWT strategy
- Deployment: Vercel

## Implementation Status

### Completed Features

- ✅ **User Authentication & Authorization**
  - Location: `/app/api/auth/*`, `/lib/auth.ts`
  - NextAuth.js with OAuth providers
  - Custom registration endpoint
  - Debug and health check endpoints

- ✅ **Project Management System**
  - Location: `/app/projects/*`, `/app/api/projects/*`
  - Features: CRUD, templates, archiving, token regeneration
  - Public sharing via tokens (`/app/share/[token]`)
  - Project editing and creation from templates

- ✅ **Portfolio Management**
  - Location: `/app/portfolio/*`, `/app/api/portfolios/*`
  - Portfolio-based project organization
  - Custom portfolio views and filtering
  - Integration with project health metrics

- ✅ **Task Management**
  - Location: `/app/api/tasks/*`
  - Bulk operations support
  - Task assignment and tracking
  - Integration with time entries

- ✅ **Time Tracking System**
  - Location: `/app/api/time-entries/*`
  - TimeEntry model with user association
  - CRUD operations for time logging
  - Integration with task management

- ✅ **AI Agent System (33 tools)**
  - Location: `/lib/agent/*`
  - Multiple agent modes: chat, autonomous, hybrid, chat-v2
  - Session management and plan approval
  - Tool registry with RBAC and mutation flags

- ✅ **Slack Integration**
  - Location: `/lib/slack.ts`, `/lib/agent/tools/slack-tools.ts`
  - OAuth authentication flow
  - Channel management and webhook support
  - Daily summary automation
  - Project linking capabilities

- ✅ **Google Drive Integration**
  - Location: `/lib/google-drive.ts`, `/lib/agent/tools/drive-tools.ts`
  - Full OAuth2 flow implementation
  - File/folder operations (upload, download, share, search)
  - Quota management
  - Test endpoints for verification

- ✅ **RAG System**
  - Location: `/lib/rag/*`, `/app/api/rag/*`
  - Document ingestion with embeddings
  - Semantic search capabilities
  - Sync and indexing operations

- ✅ **Workflow Automation**
  - Location: `/lib/agent/tools/workflow-tools.ts`
  - Workflow creation and execution
  - Scheduling system (`/app/api/scheduler/tick`)
  - Template management

- ✅ **Activity Feed & Reporting**
  - Location: `/app/activity`, `/app/reports`
  - Real-time activity tracking
  - Custom reporting views

### In Progress

- 🔄 RAG system optimization
  - Current: Basic document ingestion working
  - TODO: Improve chunking strategy, add metadata extraction

- 🔄 Workflow UI
  - Backend complete, UI needs implementation

### Planned

- ⏳ Mobile application
- ⏳ Advanced analytics dashboard
- ⏳ Real-time collaboration features
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
│   ├── agent/                 # Agent system
│   │   ├── tools/            # Tool implementations (10 files)
│   │   │   ├── ai-tools.ts
│   │   │   ├── drive-tools.ts
│   │   │   ├── project-tools.ts
│   │   │   ├── rag-tools.ts
│   │   │   ├── search-tools.ts
│   │   │   ├── slack-tools.ts
│   │   │   ├── task-tools.ts
│   │   │   ├── update-tools.ts
│   │   │   └── workflow-tools.ts
│   │   ├── service.ts        # Agent orchestration
│   │   └── tool-registry.ts  # Central tool registration
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

## Pages Directory (24 pages)

| Page             | Route                         | Purpose                 |
| ---------------- | ----------------------------- | ----------------------- |
| Dashboard        | `/dashboard`                  | Main dashboard view     |
| Activity         | `/activity`                   | Activity feed           |
| Reports          | `/reports`                    | Analytics and reporting |
| Team             | `/team`                       | Team management         |
| My Work          | `/my-work`                    | Personal task dashboard |
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

## Agent Tool Registry (33 tools)

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

## Recent Changes (2025-09-20)

- Added 33 new agent tools (Slack, Drive, RAG, Workflow integrations)
- Fixed IntegrationCredential records for all 16 production users
- Created test endpoints for Slack and Drive verification
- Resolved compilation errors in tool definitions
- Documented actual project structure (57 API routes, 24 pages)
- Updated CLAUDE.md to reflect true project state
- Added Credentials provider for email/password authentication
- Created Claude test account for automated testing
- Enabled email/password login alongside Google OAuth
