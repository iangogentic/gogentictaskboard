# Slack Daily Project Updates Setup Guide

## Overview

This feature sends daily Slack DMs to team members with their active projects, requesting status updates.

## Setup Options

### Option 1: GitHub Actions (RECOMMENDED - FREE)

1. **Add GitHub Secrets:**
   Go to your repo Settings > Secrets and variables > Actions, then add:
   - `APP_URL`: Your production URL (e.g., `https://gogentic-portal-real.vercel.app`)
   - `CRON_SECRET`: Same value as your `.env` CRON_SECRET

2. **Enable the workflow:**
   The workflow file is already created at `.github/workflows/daily-slack-updates.yml`

3. **Test it:**
   - Go to Actions tab in GitHub
   - Find "Daily Slack Project Updates"
   - Click "Run workflow" to test manually

### Option 2: External Cron Service (FREE)

**Using cron-job.org:**

1. Sign up at https://cron-job.org
2. Create a new cron job:
   - URL: `https://your-app.vercel.app/api/cron/daily-project-updates`
   - Schedule: Daily at 9 AM
   - Method: GET
   - Headers: `Authorization: Bearer YOUR_CRON_SECRET`

**Using EasyCron:**

1. Sign up at https://www.easycron.com
2. Add new cron job with same settings as above

### Option 3: Manual Trigger

Create a bookmark or script:

```bash
curl https://your-app.vercel.app/api/cron/daily-project-updates \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Option 4: Upgrade Vercel ($20/month)

1. Go to https://vercel.com/pricing
2. Upgrade to Pro
3. Re-add the cron configuration to `vercel.json`:

```json
"crons": [
  {
    "path": "/api/cron/daily-project-updates",
    "schedule": "0 9 * * *"
  }
]
```

## How It Works

1. **Daily at 9 AM**: The cron job triggers
2. **Finds Active Projects**: Queries for "In Progress", "Not Started", and "Blocked" projects
3. **Sends Slack DMs**: Each user gets a DM with:
   - List of their active projects
   - Clickable links to each project
   - Visual status indicators (🟢🟡🔴) based on last update time
   - Quick "Update" buttons

## Troubleshooting

### Users Not Receiving DMs

1. **Check Slack Integration:**

   ```bash
   node scripts/quick-fix-slack-ids.js
   ```

2. **Verify User Has Slack ID:**
   Check in Prisma Studio that `IntegrationCredential` has `slackUserId` in metadata

3. **Re-authenticate:**
   User should disconnect and reconnect Slack in Settings > Integrations

### No Active Projects Found

- Projects must have status: "In Progress", "Not Started", or "Blocked"
- User must be either the PM (`pmId`) or a ProjectMember

## API Endpoints

- **Manual trigger**: `POST /api/slack/daily-project-updates`
  - Body: `{ userId: "user_id", isScheduled: false }`

- **Cron endpoint**: `GET /api/cron/daily-project-updates`
  - Sends to all users with Slack integration
  - Requires auth header or CRON_SECRET

## Cost Comparison

| Option         | Cost   | Reliability | Setup Time |
| -------------- | ------ | ----------- | ---------- |
| GitHub Actions | FREE   | ⭐⭐⭐⭐⭐  | 5 min      |
| cron-job.org   | FREE   | ⭐⭐⭐⭐    | 5 min      |
| Manual         | FREE   | ⭐⭐        | 1 min      |
| Vercel Pro     | $20/mo | ⭐⭐⭐⭐⭐  | 1 min      |

## Recommendation

**Use GitHub Actions** - It's free, reliable, and already integrated with your repository.
