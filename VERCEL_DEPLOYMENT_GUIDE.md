# Vercel Deployment Guide - GCashFin

## 🚨 "Error loading notes: Failed to fetch notes" - Diagnosis

If you see this error on Vercel but it works locally, it's almost always one of these:

### 1. **Missing Environment Variables** ⚠️ MOST COMMON

You must set these in Vercel **Settings → Environment Variables**:

```env
DATABASE_URL=postgresql://user:password@your-neon-db.neon.tech/gcashfin
NEXTAUTH_SECRET=your-random-secret-here
NEXTAUTH_URL=https://your-domain.vercel.app
```

**How to get them:**

- **DATABASE_URL**: From Neon dashboard → Connection string
- **NEXTAUTH_SECRET**: Generate with: `openssl rand -base64 32`
- **NEXTAUTH_URL**: Your Vercel domain (e.g., `hopeee-snowy.vercel.app`)

### 2. **Check Vercel Function Logs**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click your project
3. Go to **Deployments** tab
4. Click the latest deployment
5. Go to **Function Logs** tab
6. Redeploy or refresh the page to trigger the error
7. Look for `[Notes API]` log messages

**Expected logs if working:**
```
[Notes API] GET - Starting request
[Notes API] GET - Fetching notes for user: user_123
[Notes API] GET - Success: Found note with 0 characters
```

**Error logs (what to fix):**
```
[Notes API] GET - No session found
[Notes API] GET - Error: Unique constraint failed on the fields: (`userId`)
[Notes API] GET - Error details: Can't reach database server at `db.neon.tech`
```

---

## ✅ Complete Deployment Checklist

### Pre-Deployment (Local)

- [ ] `npm run build` succeeds locally
- [ ] Notes feature works locally (save, delete)
- [ ] Browser console shows `[Notes Page]` logs
- [ ] Server console shows `[Notes API]` logs
- [ ] All git changes committed
- [ ] `.env.local` NOT in git (check `.gitignore`)

### Vercel Settings

- [ ] **Environment Variables** set:
  - [ ] `DATABASE_URL` (from Neon)
  - [ ] `NEXTAUTH_SECRET` (generated)
  - [ ] `NEXTAUTH_URL` (your Vercel domain)
  - [ ] Any other vars from `.env.example`

- [ ] **Build & Development Settings:**
  - [ ] Build Command: `prisma generate && next build`
  - [ ] Output Directory: `.next`
  - [ ] Install Command: `npm install`

- [ ] **Domains:**
  - [ ] Domain(s) added and verified
  - [ ] `NEXTAUTH_URL` matches your domain

### Post-Deployment (Live)

- [ ] Visit your app on Vercel domain
- [ ] Login works
- [ ] Try to save a note
- [ ] Check browser console for errors
- [ ] Check Function Logs in Vercel dashboard
- [ ] Share live URL and test in incognito mode

---

## 🔧 Troubleshooting

### Error: "Unauthorized" or "No session"

**Cause:** NextAuth session not working

**Fixes:**
1. Verify `NEXTAUTH_SECRET` is set
2. Verify `NEXTAUTH_URL` is exact (no trailing slash)
3. Check login still works
4. Clear browser cookies and try again
5. Check that you ARE logged in (check `/api/auth/session` in browser)

### Error: "Can't reach database server"

**Cause:** DATABASE_URL wrong or Neon connection issue

**Fixes:**
1. Verify `DATABASE_URL` is correct (copy from Neon)
2. Check Neon project status (not suspended)
3. Check IP whitelist allows all IPs (Vercel IPs)
4. Run `npx prisma db push` locally to verify DB is accessible
5. Check Neon quota and connection limits

### Error: "Unique constraint failed on the fields: (`userId`)"

**Cause:** Note already exists for user, trying to create instead of update

**Fix:** API is already fixed - just redeploy

### Error: Network error or timeout

**Cause:** Function taking too long or connection issues

**Fixes:**
1. Check Vercel function logs for actual error
2. Verify DATABASE_URL responds quickly
3. Check for slow queries in Prisma
4. Increase Vercel function timeout if needed

### Still seeing "Failed to fetch notes" after all above

1. **Check exact error message:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - You should see: `[Notes Page] Fetch error: Unauthorized: No session`
   - Or: `[Notes Page] Fetch failed: {error: "...", details: "..."}`

2. **Check API is responding:**
   - In browser, visit `/api/notes`
   - Should see JSON response (error or success)
   - If blank page or 404, API route not deployed

3. **Check Network tab:**
   - In DevTools, go to Network tab
   - Refresh page
   - Find `/api/notes` request
   - Check Status (should be 200, 401, or 500)
   - Check Response tab for error details

---

## 📝 Environment Variables Explained

### DATABASE_URL
- Format: `postgresql://user:password@host:5432/dbname`
- Where to get: Neon → Connection String (PostgreSQL)
- Example: `postgresql://neondb_owner:password@ep-abc123.neon.tech/gcashfin`
- **DO NOT include this in code, only in Vercel env vars**

### NEXTAUTH_SECRET
- Purpose: Encrypt session tokens
- Generate with: `openssl rand -base64 32` (or `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Keep it secret! Only in Vercel env vars
- Changing this logs out all users

### NEXTAUTH_URL
- Purpose: Tell NextAuth what your domain is
- Must be exact URL of your site
- Format: `https://domain.com` (no path, no trailing slash)
- Examples:
  - Vercel: `https://myapp.vercel.app`
  - Custom domain: `https://myapp.com`
- In development: `http://localhost:3000`

---

## 🚀 Step-by-Step Vercel Setup

### 1. First Time Setup

```bash
# Connect your Git repo to Vercel
# Go to https://vercel.com/new
# Select your GitHub repo
# Vercel auto-detects Next.js ✓
```

### 2. Add Environment Variables

On Vercel dashboard:
1. Go to your project
2. Settings → Environment Variables
3. Add each variable:
   - Name: `DATABASE_URL`
   - Value: (paste from Neon)
   - Select: Production, Preview, Development
   - Click Add
4. Repeat for `NEXTAUTH_SECRET` and `NEXTAUTH_URL`
5. **No need to redeploy - Vercel redeploys automatically**

### 3. Configure Build Settings

Settings → Build & Development:
- Build Command: `prisma generate && next build`
- Output Directory: `.next`
- Development Command: `next dev`
- Install Command: `npm install` (default is fine)

### 4. First Deployment

```bash
# Push to GitHub
git add .
git commit -m "Add notes feature fixes"
git push origin main

# Vercel automatically deploys from GitHub
# Watch deployment in Vercel dashboard
```

### 5. Test on Live

1. Visit your Vercel domain
2. Login
3. Go to `/notes`
4. Write something and click Save
5. Check for `[Notes Page]` in browser console
6. Check Function Logs for `[Notes API]`

---

## 🔍 Debugging Checklist (For Every Error)

When something doesn't work:

1. **Check browser console:**
   ```
   Open DevTools → Console
   Look for [Notes Page] messages
   Copy full error message
   ```

2. **Check Function Logs on Vercel:**
   ```
   Vercel Dashboard → Deployments → Latest → Function Logs
   Look for [Notes API] messages
   Copy full error message
   ```

3. **Test API directly:**
   ```bash
   # In browser console or with curl:
   fetch('/api/notes').then(r => r.json()).then(console.log)
   
   # Should show either:
   # {success: true, content: "", id: "..."}  <- Working
   # {error: "Unauthorized", details: "No session"}  <- Fix session
   # {error: "Failed to fetch notes", details: "..."}  <- Check logs
   ```

4. **Check environment variables:**
   ```
   Vercel Dashboard → Project → Settings → Environment Variables
   Verify all 3 vars are set
   Check NEXTAUTH_URL has no trailing slash
   ```

5. **Check database connection:**
   ```bash
   # Locally:
   npx prisma db execute --stdin
   # Paste: SELECT 1;
   # Should return 1, not error
   ```

---

## 📚 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| `Error: "Unauthorized"` | No session | Login again, check NEXTAUTH_SECRET |
| `Error: "No session found"` | NextAuth not configured | Set NEXTAUTH_SECRET and NEXTAUTH_URL |
| `Error: "Can't reach database"` | DB connection failed | Check DATABASE_URL, check Neon status |
| `Error: "Unique constraint"` | Duplicate note | DB issue, shouldn't happen with upsert |
| `Network error` | API timeout | Check Function Logs, might be slow query |
| Works locally, fails on Vercel | Missing env var | Check all 3 env vars are set |
| Blank page, no error | API not deployed | Check deployment succeeded, check build logs |

---

## ✨ Success Indicators

When everything is working:

✅ Navigate to `/notes` (no error)
✅ Textarea loads with existing note or empty
✅ Browser console shows:
```
[Notes Page] Fetching notes...
[Notes Page] Fetch successful
```

✅ Vercel Function Logs show:
```
[Notes API] GET - Starting request
[Notes API] GET - Fetching notes for user: abc123
[Notes API] GET - Success: Found note with X characters
```

✅ Can type in textarea
✅ Click Save → toast says "Notes saved!"
✅ Refresh page → notes still there
✅ Can delete notes (shows confirmation)

---

## 🎯 Quick Fixes

**Nothing working? Try this:**

1. Set `NEXTAUTH_URL=https://yourdomain.vercel.app` (exact)
2. Set `DATABASE_URL` from Neon (copy-paste exactly)
3. Generate new `NEXTAUTH_SECRET` with: `openssl rand -base64 32`
4. Redeploy in Vercel (just click "Redeploy")
5. Clear browser cache: Ctrl+Shift+Delete
6. Clear cookies: DevTools → Storage → Cookies → Delete all
7. Hard refresh: Ctrl+F5
8. Logout and login again
9. Check console and function logs

If still failing, copy the full error message from console/logs and we can debug from there.

---

## 📞 Getting Help

When asking for help, include:
1. Screenshot of error message
2. Full error from browser console (`[Notes Page]...`)
3. Full error from Vercel Function Logs (`[Notes API]...`)
4. What works/doesn't work (save? delete? fetch?)
5. Whether it works locally
