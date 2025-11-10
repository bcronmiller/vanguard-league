# Vercel Deployment Guide - Vanguard League Platform

## Overview

Deploy your Vanguard League Platform to **Vercel for FREE** with automatic weekly updates. The deployed site reads from JSON data files (no backend needed), while you maintain full control locally for event management.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  LOCAL (Your Computer)                                  │
│  ┌──────────────┐    ┌─────────────────────┐           │
│  │   Backend    │ ←──│  Admin Interface    │           │
│  │   (FastAPI)  │    │  localhost:3000     │           │
│  └──────────────┘    │  - Event management │           │
│         │            │  - Fighter profiles  │           │
│         │            │  - Match entry       │           │
│         ↓            └─────────────────────┘           │
│  ┌──────────────┐                                       │
│  │ Export Data  │    After each event:                 │
│  │ (JSON files) │    1. Enter results locally          │
│  └──────────────┘    2. Run: npm run export-data       │
│         │            3. Push to GitHub                  │
│         ↓            4. Auto-deploy to Vercel!          │
└────────┼────────────────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────────────────────┐
│  VERCEL (Public Website - FREE)                         │
│  ┌────────────────────────────────────────┐             │
│  │  vanguardleague.vercel.app             │             │
│  │  ┌──────────────────────────────────┐  │             │
│  │  │  Next.js App (reads JSON data)   │  │             │
│  │  │  - Current standings             │  │             │
│  │  │  - Fighter profiles              │  │             │
│  │  │  - Event schedule                │  │             │
│  │  │  - Weight class ladders          │  │             │
│  │  └──────────────────────────────────┘  │             │
│  └────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────┘
```

## Prerequisites

1. GitHub account (free)
2. Vercel account (free) - sign up at https://vercel.com
3. Git installed locally
4. Backend running locally on port 8000

## Initial Setup (One-Time)

### Step 1: Create GitHub Repository

```bash
cd /home/bc/vanguard-league-platform

# Initialize git if not already done
git init

# Add remote (create repo on GitHub first)
git remote add origin https://github.com/YOUR_USERNAME/vanguard-league.git

# Make sure frontend data directory is not in .gitignore
# We WANT to commit the JSON files!
echo "!frontend/public/data/*.json" >> .gitignore

# Commit everything
git add .
git commit -m "Initial commit - Vanguard League Platform"
git push -u origin main
```

### Step 2: Connect Vercel

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build:vercel`
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

5. Add Environment Variables in Vercel Dashboard:
   - `NEXT_PUBLIC_STATIC_MODE` = `true`
   - `NEXT_PUBLIC_READ_ONLY` = `true`

6. Click "Deploy"

Your site will be live at `https://vanguard-league.vercel.app` (or custom URL)!

## Weekly Update Workflow

After each VGI Trench event:

### 1. Enter Match Results Locally

```bash
cd /home/bc/vanguard-league-platform/frontend

# Start local dev server (if not running)
npm run dev

# Access at http://localhost:3000
# - Enter match results
# - Update fighter profiles
# - Record weigh-ins
```

### 2. Export Updated Data

```bash
# Make sure backend is running
curl http://192.168.1.246:8000/api/health

# Export all current data to JSON files
npm run export-data
```

This creates/updates files in `frontend/public/data/`:
- `events.json`
- `players.json`
- `ladder-overall.json`
- `event-{id}.json`
- `player-{id}.json`
- And more...

### 3. Commit and Push

```bash
cd /home/bc/vanguard-league-platform

git add frontend/public/data/
git commit -m "Update ladder after VGI Trench $(date +%Y-%m-%d)"
git push
```

### 4. Automatic Deployment

Vercel automatically detects the push and:
1. Runs `npm run build:vercel`
2. Deploys the updated site
3. Goes live in ~2 minutes

Check deployment status at https://vercel.com/dashboard

## Environment Configuration

### Local Development (.env.local)

```env
# For local development - connects to real API
NEXT_PUBLIC_API_URL=http://192.168.1.246:8000
NEXT_PUBLIC_STATIC_MODE=false
NEXT_PUBLIC_READ_ONLY=false
```

### Vercel Production (Dashboard Settings)

```env
# For production - reads from JSON files
NEXT_PUBLIC_STATIC_MODE=true
NEXT_PUBLIC_READ_ONLY=true
```

## Custom Domain (Optional)

### Add Custom Domain

1. Purchase domain (e.g., `vanguardleague.com` from Namecheap)
2. In Vercel Dashboard → Project Settings → Domains
3. Click "Add Domain"
4. Enter your domain
5. Update DNS records:

For root domain (`vanguardleague.com`):
```
Type: A
Name: @
Value: 76.76.21.21
```

For www subdomain (`www.vanguardleague.com`):
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

Vercel automatically handles HTTPS/SSL certificates!

## Costs

- **Vercel Hobby Plan**: $0/month
  - Unlimited projects
  - 100GB bandwidth/month
  - Custom domains
  - Automatic HTTPS
  - Deploy from Git

- **Domain Name** (optional): ~$12/year

**Total: FREE** (or $1/month with domain) 🎉

## Troubleshooting

### Build Failing on Vercel

Check Vercel deployment logs for errors. Common issues:

**Data export failed:**
```bash
# Run locally to see errors
npm run export-data
```

**Missing environment variables:**
- Verify `NEXT_PUBLIC_STATIC_MODE=true` in Vercel Dashboard

### Site Shows Old Data

```bash
# 1. Make sure you exported fresh data
npm run export-data

# 2. Commit the changes
git add frontend/public/data/
git commit -m "Update data"
git push

# 3. Check Vercel deployment logs
```

### Local Development Not Working

```bash
# Make sure backend is running
cd /home/bc/vanguard-league-platform/backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Make sure you're NOT in static mode locally
# Check .env.local:
# NEXT_PUBLIC_STATIC_MODE=false
```

## Advanced: Manual Deployment

If you don't want automatic deployments:

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy manually
cd /home/bc/vanguard-league-platform/frontend
npm run build:vercel
vercel --prod
```

## Admin Features (Local Only)

These features only work on your local development server:

✅ **Available Locally**:
- Create new events
- Register new fighters
- Edit fighter profiles
- Record match results
- Manage event check-in
- Generate brackets

❌ **Not Available on Vercel**:
- All admin/edit features (by design)
- Real-time API access
- Direct database access

This separation keeps your public site simple and secure while maintaining full control locally.

## Monitoring

### View Deployment Logs

- Vercel Dashboard: https://vercel.com/dashboard
- Click on your project
- View "Deployments" tab
- Click any deployment for detailed logs

### Analytics (Free on Vercel)

- Track page views
- Monitor performance
- See visitor locations
- All in Vercel Dashboard → Analytics

## Comparison: Vercel vs Static Export

| Approach | Complexity | Flexibility | Recommended |
|----------|-----------|-------------|-------------|
| **Vercel (This Guide)** | Simple | High | ✅ Yes |
| Full Static Export | Complex | Limited | ❌ No |
| Cloud Backend (Neon/Supabase) | Medium | Highest | Maybe later |

## Next Steps

1. ✅ Deploy initial version to Vercel
2. ✅ Test the site live
3. ✅ Run your next event
4. ✅ Update data and redeploy
5. 🎯 (Optional) Add custom domain
6. 🎯 (Optional) Set up analytics
7. 🎯 (Optional) Add social media sharing

---

**Questions?**
- Vercel Documentation: https://vercel.com/docs
- Next.js Documentation: https://nextjs.org/docs

**Last Updated**: November 10, 2025
