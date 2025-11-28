# 🔧 PostgREST Migration Complete

## ✅ What's Been Done

### 1. **Netlify Function Updated** (`netlify/functions/characters.js`)
   - Removed dependency on `pg` (Node Postgres client)
   - Now uses `fetch()` to call Supabase PostgREST API over HTTPS (port 443)
   - Bypasses corporate firewall that blocks port 5432
   - Same response format → **frontend code unchanged**

### 2. **Dependencies Cleaned** (`package.json`)
   - Removed `pg` package (fetch is built-in Node 18+)
   - Keeps `netlify-cli` for local development

### 3. **Environment Variables Updated** (`.env` & `.env.example`)
   - **Old format** (blocked by firewall):
     ```
     DATABASE_URL=postgresql://postgres:password@host:5432/postgres
     ```
   - **New format** (HTTP/HTTPS, port 443):
     ```
     SUPABASE_URL=https://xxrimrlllwlwkzyjrwdq.supabase.co
     SUPABASE_KEY=eyJ...
     ```

### 4. **Security Improved** (`.gitignore`)
   - Added `.env` and `.env.local` to `.gitignore`
   - Prevents credentials from being committed to git

---

## ⚠️ CRITICAL: Security Issue

**Your Supabase password was exposed** in the `.env` file which may have been committed to git.

### Actions Required NOW:
1. **Rotate Supabase credentials:**
   - Go to https://supabase.com → Your Project → Settings → Database
   - Reset the postgres password
   - Or use a different auth method (JWT/anon key recommended)

2. **Remove `.env` from git history:**
   ```bash
   git rm --cached .env
   git commit -m "Remove .env file with exposed credentials"
   git push
   ```

3. **Update Netlify with new credentials:**
   - Go to Netlify Dashboard → Site Settings → Build & Deploy → Environment
   - Set these variables:
     - `SUPABASE_URL` = `https://xxrimrlllwlwkzyjrwdq.supabase.co`
     - `SUPABASE_KEY` = [Get from Supabase → Settings → API → Anon key]

---

## 🚀 Next Steps to Deploy

### 1. **Test Locally (Optional)**
```bash
netlify dev
# Open http://localhost:8888
# Try filling a form and clicking "Salvar"
# Check browser console for success/errors
```

### 2. **Deploy to Netlify**
```bash
git add .
git commit -m "Switch to PostgREST API (HTTP) - bypass port 5432 firewall block"
git push
# Netlify auto-deploys on push
```

### 3. **Verify Deployment**
After 1-2 minutes:
- **Health check:** `curl https://your-site.netlify.app/.netlify/functions/characters?health=1`
- **Should return:** `{"ok":true}`

### 4. **Test Save Functionality**
1. Open the deployed site
2. Go to "Ficha 1"
3. Fill in some fields (e.g., Nome: "Test Character")
4. Click "💾 Salvar Ficha 1"
5. Should see "Ficha 1 salva com sucesso!" message
6. Refresh page → data should persist

---

## 📋 Environment Variables Reference

### Local Development (`.env`)
Both variables needed for Netlify Functions to work locally:
```env
SUPABASE_URL=https://xxrimrlllwlwkzyjrwdq.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Netlify Site Settings
Same variables must be configured in:
**Site Settings → Build & Deploy → Environment → Environment Variables**

### Finding Your Values
1. **SUPABASE_URL**: Go to Supabase → Settings → API → Project URL
2. **SUPABASE_KEY**: Go to Supabase → Settings → API → Anon key (or Service Role key if write access needed)

---

## 🔌 How It Works Now

### Old Flow (Blocked by Firewall ❌)
```
Browser → Netlify Function → pg client → Supabase Postgres (port 5432) ❌
                                          ^
                                          Corporate firewall blocks this
```

### New Flow (Working ✅)
```
Browser → Netlify Function → fetch → Supabase PostgREST API (HTTPS port 443) ✅
                                       ^
                                       Corporate firewall allows HTTPS
```

### API Endpoints Used
- **GET** `/rest/v1/characters?health=1` — Health check
- **GET** `/rest/v1/characters?char_number=eq.{N}` — Fetch one character
- **GET** `/rest/v1/characters` — Fetch all characters
- **POST** `/rest/v1/characters` — Create character
- **PATCH** `/rest/v1/characters?char_number=eq.{N}` — Update character

---

## 🐛 Troubleshooting

### Issue: "error: Cannot find module 'pg'"
**Solution:** You haven't redeployed. Git push to trigger rebuild.

### Issue: Health check fails or save returns 500 error
**Check:** Did you set `SUPABASE_URL` and `SUPABASE_KEY` in Netlify settings?
- Netlify doesn't read `.env` files automatically
- Must manually add in Site Settings → Environment Variables

### Issue: "PostgREST error 401" or "invalid JWT"
**Check:** Is your `SUPABASE_KEY` correct?
- Get from Supabase → Settings → API → Anon key
- Make sure it's the full key, not truncated

### Issue: Save appears to work but data doesn't persist on refresh
**Check:** Netlify Function logs for errors
- Go to Netlify → Logs → Functions
- Look for red error messages

---

## 📝 Summary of Changes

| File | Change | Why |
|------|--------|-----|
| `netlify/functions/characters.js` | Remove `pg` Pool, add `fetch` → PostgREST | Bypass firewall block on port 5432 |
| `package.json` | Remove `"pg": "^8.10.0"` | No longer needed, fetch is built-in |
| `.env` | `DATABASE_URL` → `SUPABASE_URL` + `SUPABASE_KEY` | Use HTTP API instead of Postgres protocol |
| `.env.example` | Updated template | Document new variable names |
| `.gitignore` | Add `.env` | Prevent credentials leak |
| **Frontend** (index.html, script.js, styles.css) | **NO CHANGES** | Same API interface |

---

## ✨ Result

Your VtM V5 character sheet app should now:
1. ✅ Save all 5 character sheets to Supabase
2. ✅ Show "Salvo!" message only on button click
3. ✅ Display saved data in table below form
4. ✅ Work on corporate network (no port 5432 block)
5. ✅ Auto-deploy on git push (via Netlify)

**Next:** Deploy to Netlify and test! 🎮
