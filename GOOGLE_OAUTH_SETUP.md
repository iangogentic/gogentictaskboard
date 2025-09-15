# Google OAuth Setup Instructions

## IMPORTANT: You need to add your Google OAuth credentials to `.env.local`

### Steps to get your Google OAuth credentials:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Select or Create a Project**
   - Use your existing project or create a new one

3. **Enable Google+ API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

4. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"

5. **Configure OAuth Client**
   - Name: "GOGENTIC Portal Development"

   **Authorized JavaScript origins:**
   - `http://localhost:3002`

   **Authorized redirect URIs:**
   - `http://localhost:3002/api/auth/callback/google`

6. **Copy Your Credentials**
   - Copy the "Client ID" and "Client Secret"

7. **Update `.env.local`**
   ```env
   AUTH_GOOGLE_ID="your-client-id-here.apps.googleusercontent.com"
   AUTH_GOOGLE_SECRET="your-client-secret-here"
   ```

## Your Current Google OAuth Settings

Based on what you shared, you already have these configured in Google Cloud Console:

✅ **Authorized JavaScript origins:**

- `http://localhost:3002`
- `https://gogentictaskboard.vercel.app`

✅ **Authorized redirect URIs:**

- `http://localhost:3002/api/auth/callback/google`
- `https://gogentictaskboard.vercel.app/api/auth/callback/google`
- `https://gogentic-portal-real.vercel.app/api/auth/callback/google`

## What's Missing?

**You need to add the Client ID and Client Secret to your `.env.local` file!**

The app is looking for:

- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`

But these are not defined in your environment variables.

## Quick Fix:

1. Get your Client ID and Secret from Google Cloud Console
2. Edit `.env.local` and replace the placeholders:
   ```env
   AUTH_GOOGLE_ID="your-actual-client-id.apps.googleusercontent.com"
   AUTH_GOOGLE_SECRET="your-actual-client-secret"
   ```
3. Restart the development server

That's it! The OAuth should work after adding these credentials.
