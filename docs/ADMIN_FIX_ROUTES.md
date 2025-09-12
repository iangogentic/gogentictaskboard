# Admin Fix Routes Documentation

These endpoints are protected and only available when:
- `AUTH_DEBUG=true` 
- Request includes header `X-ADMIN-KEY: ${ADMIN_FIX_TOKEN}`

## 1. Clear All Sessions

**Endpoint:** `POST /api/admin/sessions/clear`

Deletes all sessions from the database, forcing all users to re-authenticate.

```bash
curl -s -X POST https://gogentic-portal-real.vercel.app/api/admin/sessions/clear \
  -H "X-ADMIN-KEY: YOUR_ADMIN_FIX_TOKEN"
```

**Response:**
```json
{
  "deleted": 5,
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

## 2. Audit Google OAuth Accounts

**Endpoint:** `GET /api/admin/account-audit`

Lists all Google OAuth accounts and their linked users.

```bash
curl -s https://gogentic-portal-real.vercel.app/api/admin/account-audit \
  -H "X-ADMIN-KEY: YOUR_ADMIN_FIX_TOKEN" | jq .
```

**Response:**
```json
{
  "google_accounts": [
    {
      "account_id": "abc123",
      "user_id": "user123",
      "email": "user@example.com",
      "name": "User Name",
      "providerAccountId": "1234567890"
    }
  ],
  "total": 6,
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

## 3. Fix OAuth Account Linking

**Endpoint:** `POST /api/admin/account-fix`

Deletes a specific OAuth account link (use when an account is incorrectly linked).

```bash
curl -s -X POST https://gogentic-portal-real.vercel.app/api/admin/account-fix \
  -H "X-ADMIN-KEY: YOUR_ADMIN_FIX_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"accountId": "ACCOUNT_ID_TO_DELETE"}'
```

**Response:**
```json
{
  "deleted": 1,
  "account_id": "abc123",
  "user_email": "user@example.com",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

## Usage Flow

1. **Set environment variables in Vercel:**
   ```
   AUTH_DEBUG=true
   ADMIN_FIX_TOKEN=<generate-long-random-token>
   ```

2. **Clear all sessions:**
   ```bash
   export ADMIN_TOKEN="your-token-here"
   curl -X POST https://gogentic-portal-real.vercel.app/api/admin/sessions/clear \
     -H "X-ADMIN-KEY: $ADMIN_TOKEN"
   ```

3. **Audit OAuth accounts:**
   ```bash
   curl https://gogentic-portal-real.vercel.app/api/admin/account-audit \
     -H "X-ADMIN-KEY: $ADMIN_TOKEN" | jq .
   ```

4. **Fix incorrect links (if found):**
   ```bash
   curl -X POST https://gogentic-portal-real.vercel.app/api/admin/account-fix \
     -H "X-ADMIN-KEY: $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"accountId": "bad-account-id"}'
   ```

5. **Test login with correct account**

6. **Disable admin endpoints:**
   Set `AUTH_DEBUG=false` in Vercel and redeploy