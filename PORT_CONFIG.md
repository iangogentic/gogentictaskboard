# GOGENTIC Portal - Port Configuration

## IMPORTANT: Always use port 3002 for local development

**Port 3002 is whitelisted in Google OAuth configuration**, allowing Google login to work properly in development.

## Quick Start

```bash
# Start the development server on port 3002
npx next dev -p 3002

# Or using npm script
npm run dev -- --port 3002
```

## Configuration Requirements

1. **.env file** must contain:

   ```
   NEXTAUTH_URL="http://localhost:3002"
   ```

2. **Google OAuth** is configured to accept:
   - `http://localhost:3002` as an authorized JavaScript origin
   - `http://localhost:3002/api/auth/callback/google` as an authorized redirect URI

## Why Port 3002?

- **Google OAuth Whitelist**: This port is specifically whitelisted in the Google Cloud Console for this project
- **Avoids Conflicts**: Less commonly used than 3000, 3001, 8080, etc.
- **Consistent Development**: All team members should use the same port to avoid configuration issues

## Troubleshooting

If you encounter authentication issues:

1. Verify `.env` has `NEXTAUTH_URL="http://localhost:3002"`
2. Ensure no other process is using port 3002
3. Clear browser cookies for localhost
4. Restart the development server

## Notes

- Production uses different configuration (handled automatically by Vercel)
- Never commit changes to NEXTAUTH_URL that use a different port
- This configuration is essential for the Operations Agent panel to work with authentication
