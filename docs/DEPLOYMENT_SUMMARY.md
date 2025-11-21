# Vanguard League Platform - Deployment Summary

## ✅ Deployment Solution Implemented

Your Vanguard League Platform is now ready to deploy to **Vercel for FREE** with a simple weekly update workflow!

## What Was Built

### 1. Data Export System
- **Script**: `scripts/export-data.js`
- **Purpose**: Snapshots all current league data to JSON files
- **Output**: `/public/data/*.json` files
- **Command**: `npm run export-data`

**Exports Include:**
- Events list and individual event data
- Fighter profiles and stats
- Overall ladder standings
- Weight class ladders (Lightweight, Middleweight, Heavyweight)
- Match history

### 2. Dual-Mode Configuration

**Local Development Mode** (STATIC_MODE=false):
- Fetches data from FastAPI backend (http://192.168.1.246:8000)
- Full admin functionality
- Real-time updates
- Event management, fighter registration, match entry

**Production Mode** (STATIC_MODE=true):
- Reads from JSON files in `/public/data/`
- No backend required
- Public-facing only
- Perfect for Vercel deployment

### 3. Build Process

**Command**: `npm run build:vercel`

This single command:
1. Exports all current data to JSON files
2. Builds optimized Next.js production bundle
3. Ready for deployment to Vercel

### 4. Deployment Files

Created/Modified:
- ✅ `scripts/export-data.js` - Data export automation
- ✅ `lib/staticData.ts` - Data layer abstraction
- ✅ `vercel.json` - Vercel configuration
- ✅ `VERCEL_DEPLOYMENT.md` - Complete deployment guide
- ✅ `next.config.ts` - Next.js configuration
- ✅ `package.json` - Build scripts
- ✅ `app/players/page.tsx` - Updated to support static mode
- ✅ `app/schedule/page.tsx` - Updated to support static mode

## How It Works

```
┌───────────────────────────────────────────────────┐
│  YOUR LOCAL COMPUTER                               │
│                                                    │
│  1. Run events & enter results                    │
│     └─> http://localhost:3000 (dev mode)          │
│                                                    │
│  2. Export data                                   │
│     └─> npm run export-data                       │
│                                                    │
│  3. Commit & push to GitHub                       │
│     └─> git push                                   │
│                                                    │
└───────────────────────────────────────────────────┘
                      │
                      │ Git Push
                      ↓
┌───────────────────────────────────────────────────┐
│  GITHUB                                           │
│  └─> Repository updated with new JSON data       │
└───────────────────────────────────────────────────┘
                      │
                      │ Webhook Trigger
                      ↓
┌───────────────────────────────────────────────────┐
│  VERCEL (Automatic)                               │
│                                                    │
│  1. Detects push                                  │
│  2. Runs: npm run build:vercel                    │
│  3. Deploys updated site                          │
│  4. Live in ~2 minutes!                           │
│                                                    │
│  🌐 https://vanguard-league.vercel.app            │
└───────────────────────────────────────────────────┘
```

## Quick Start

### Option 1: Vercel Dashboard (Recommended for First Time)

1. **Create GitHub Repo**
   ```bash
   cd /home/bc/vanguard-league-platform
   git init
   git remote add origin https://github.com/YOUR_USERNAME/vanguard-league.git
   git add .
   git commit -m "Initial deployment setup"
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Set **Root Directory**: `frontend`
   - Add Environment Variables:
     - `NEXT_PUBLIC_STATIC_MODE` = `true`
     - `NEXT_PUBLIC_READ_ONLY` = `true`
   - Click "Deploy"

3. **Done!** Your site is live 🎉

### Option 2: Vercel CLI (For Advanced Users)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd /home/bc/vanguard-league-platform/frontend
npm run build:vercel
vercel --prod
```

## Weekly Update Workflow

After each VGI Trench event:

```bash
# 1. Export updated data
cd /home/bc/vanguard-league-platform/frontend
npm run export-data

# 2. Commit changes
cd ..
git add frontend/public/data/
git commit -m "Update standings after VGI Trench $(date +%Y-%m-%d)"

# 3. Push (Vercel auto-deploys)
git push
```

That's it! Vercel will automatically rebuild and deploy your site.

## What Gets Deployed

**Public Pages** ✅:
- Homepage with league stats
- Fighter roster
- Event schedule
- Individual fighter profiles
- Individual event pages
- Weight class ladders (Lightweight, Middleweight, Heavyweight, P4P)

**Admin Pages** ❌ (Local Only):
- Create new event
- Fighter registration
- Edit fighter profiles
- Event check-in
- Match entry
- Bracket generation

This separation keeps your public site simple and secure while maintaining full control locally.

## Costs

- **Vercel Hobby Plan**: FREE
  - Unlimited projects
  - 100GB bandwidth/month
  - Automatic HTTPS
  - Custom domains
  - No credit card required

- **Optional Custom Domain**: ~$12/year
  - Example: `vanguardleague.com`

**Total: $0/month** 🎉

## Testing Before Deployment

Test the Vercel build locally:

```bash
# Build with static mode
npm run build:vercel

# Preview the built site
npm run preview

# Open http://localhost:3000
```

Verify:
- ✅ Homepage shows correct fighter count
- ✅ Fighter roster displays active competitors
- ✅ Event schedule shows events
- ✅ Ladder standings are correct
- ✅ Individual pages load

## Environment Variables

### Local Development (.env.local)
```env
NEXT_PUBLIC_API_URL=http://192.168.1.246:8000
NEXT_PUBLIC_STATIC_MODE=false
NEXT_PUBLIC_READ_ONLY=false
```

### Vercel Production (Dashboard)
```env
NEXT_PUBLIC_STATIC_MODE=true
NEXT_PUBLIC_READ_ONLY=true
```

## File Structure

```
vanguard-league-platform/
├── frontend/
│   ├── public/
│   │   └── data/                 # Exported JSON files
│   │       ├── events.json       # 📊 Deployed to Vercel
│   │       ├── players.json      # 📊 Deployed to Vercel
│   │       ├── ladder-*.json     # 📊 Deployed to Vercel
│   │       └── ...
│   ├── scripts/
│   │   └── export-data.js        # Data export automation
│   ├── lib/
│   │   └── staticData.ts         # Data layer abstraction
│   ├── vercel.json               # Vercel configuration
│   └── package.json              # Build scripts
├── backend/                      # NOT deployed (local only)
├── VERCEL_DEPLOYMENT.md          # Detailed guide
└── DEPLOYMENT_SUMMARY.md         # This file
```

## Troubleshooting

### Build Fails on Vercel

Check deployment logs in Vercel Dashboard:
- Look for "Failed to export data" errors
- Verify environment variables are set correctly

### Site Shows Old Data

```bash
# Make sure you exported fresh data before committing
npm run export-data

# Commit and push
git add frontend/public/data/
git commit -m "Update data"
git push
```

### Can't Access Admin Features

Admin features are **intentionally disabled** in production. Use your local development server:

```bash
cd /home/bc/vanguard-league-platform/frontend
npm run dev
# Access at http://localhost:3000
```

## Next Steps

1. ✅ Deploy to Vercel (follow guide above)
2. 🎯 Test the live site
3. 🎯 Run your next event
4. 🎯 Update and redeploy
5. 🎯 (Optional) Add custom domain
6. 🎯 (Optional) Share with fighters!

## Support

- **Full Deployment Guide**: See `VERCEL_DEPLOYMENT.md`
- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs

---

**Status**: ✅ Ready for deployment
**Cost**: $0/month
**Update Frequency**: Weekly (manual)
**Deployment Time**: ~2 minutes

**Last Updated**: November 10, 2025
