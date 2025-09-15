# 🚀 Quick Steps to Get Your Google OAuth Credentials

## Step 1: Open Google Cloud Console

Click this link: [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)

## Step 2: Find Your OAuth Client

Look for the OAuth 2.0 Client that has:

- **Name**: Something like "Web client" or "GOGENTIC Portal"
- **Authorized origins**: Contains `http://localhost:3002`

## Step 3: Click on the Client Name

This will open the client details page

## Step 4: Copy These Two Values:

1. **Client ID** - Looks like: `123456789-abcdef.apps.googleusercontent.com`
2. **Client secret** - Looks like: `GOCSPX-xxxxxxxxxx`

## Step 5: Paste Them Here

Open `.env.local` in this folder and replace the placeholders:

```env
AUTH_GOOGLE_ID="PASTE_YOUR_CLIENT_ID_HERE"
AUTH_GOOGLE_SECRET="PASTE_YOUR_CLIENT_SECRET_HERE"
```

## Step 6: Save and Restart

1. Save the `.env.local` file
2. Stop the server (Ctrl+C)
3. Run: `npx next dev -p 3002`

---

**That's it!** The login should work now at http://localhost:3002

⚠️ **Can't find the credentials?** You might need to create a new OAuth 2.0 Client ID in Google Cloud Console with these settings:

- Application type: Web application
- Authorized JavaScript origins: `http://localhost:3002`
- Authorized redirect URIs: `http://localhost:3002/api/auth/callback/google`
