# Static Site Deployment Guide

## Overview

This guide explains how to deploy the Vanguard League Platform as a **completely standalone static website** on Vercel (free hosting). The site requires NO backend or database when deployed - all data is baked into the HTML at build time.

## When to Use This Approach

✅ **Perfect for:**
- Weekly event updates (not real-time)
- Public-facing league standings and stats
- Free hosting on Vercel/Netlify/GitHub Pages
- No server maintenance needed

❌ **Not suitable for:**
- Real-time updates
- Admin functionality (fighter registration, match entry)
- User authentication

## How It Works

1. **Local Development**: Run backend API locally for data management
2. **Build Process**: Export all current data to JSON files
3. **Static Generation**: Next.js fetches data at BUILD TIME and generates HTML
4. **Deploy**: Upload static HTML/CSS/JS to Vercel (no backend needed)
5. **Updates**: After events, rebuild locally and redeploy

```
┌─────────────────────────────────────────────────────────┐
│  LOCAL (Your Computer)                                  │
│  ┌──────────────┐    ┌─────────────────────┐           │
│  │   Backend    │ ←──│  Frontend Dev Mode  │           │
│  │   (FastAPI)  │    │  (npm run dev)      │           │
│  └──────────────┘    └─────────────────────┘           │
│         │                      │                        │
│         │                      ↓                        │
│         │             ┌────────────────┐                │
│         └────────────→│  Export Data   │                │
│                       │  (JSON files)  │                │
│                       └────────────────┘                │
│                              │                          │
│                              ↓                          │
│                       ┌────────────────┐                │
│                       │  Build Static  │                │
│                       │  (HTML/CSS/JS) │                │
│                       └────────────────┘                │
│                              │                          │
└──────────────────────────────┼──────────────────────────┘
                               │
                               ↓
                    ┌───────────────────────┐
                    │   VERCEL (Cloud)      │
                    │   ┌───────────────┐   │
                    │   │  Static Site  │   │
                    │   │  (Free!)      │   │
                    │   └───────────────┘   │
                    └───────────────────────┘
```

## Step 1: Initial Setup

### Verify Backend is Running

```bash
# Make sure backend is running on port 8000
curl http://192.168.1.246:8000/api/health

# You should see: {"status":"healthy"}
```

### Install Dependencies

```bash
cd /home/bc/vanguard-league-platform/frontend
npm install
```

## Step 2: Build Static Site

The static build process is a single command that:
1. Exports all current data to JSON files
2. Builds static HTML from that data
3. Creates an `out/` directory ready for deployment

```bash
cd /home/bc/vanguard-league-platform/frontend

# Single command to export data and build static site
npm run build:static
```

This will create an `out/` directory with your complete static site.

### What Gets Excluded

Pages that require backend access (admin functions) will not be included:
- `/events/new` - Create new event
- `/register` - Register new fighter
- `/players/[id]/edit` - Edit fighter profile
- `/events/[id]/checkin` - Event check-in
- `/events/[id]/brackets` - Bracket generation

These pages remain available on your LOCAL development server for administration.

## Step 3: Preview Locally

Before deploying, test the static site locally:

```bash
npm run preview:static
```

Open http://localhost:3000 to verify everything looks correct.

## Step 4: Deploy to Vercel

### Option A: Vercel CLI (Recommended)

```bash
# Install Vercel CLI (one-time)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy the static site
cd /home/bc/vanguard-league-platform/frontend
vercel --prod ./out
```

### Option B: GitHub + Vercel Dashboard

1. **Push to GitHub**:
   ```bash
   cd /home/bc/vanguard-league-platform
   git add .
   git commit -m "Update static site data"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Configure build:
     - Framework: Next.js
     - Build Command: `npm run build:static`
     - Output Directory: `out`
   - Deploy!

### Option C: Manual Upload

1. Compress the `out/` directory:
   ```bash
   cd /home/bc/vanguard-league-platform/frontend
   zip -r vanguard-static.zip out/
   ```

2. Upload to any static host:
   - Vercel: Drag & drop the `out/` folder
   - Netlify: Drag & drop the `out/` folder
   - GitHub Pages: Copy contents to `gh-pages` branch

## Step 5: Weekly Update Workflow

After each event, follow this simple workflow:

### 1. Update Data Locally

```bash
# Run the event, enter match results through local development server
cd /home/bc/vanguard-league-platform/frontend
npm run dev

# Access local admin interface at http://localhost:3000
# - Record weigh-ins
# - Enter match results
# - Update fighter profiles if needed
```

### 2. Rebuild and Redeploy

```bash
# Export fresh data and rebuild static site
npm run build:static

# Deploy updated site
vercel --prod ./out
```

That's it! Your public site is now updated with the latest standings.

## Configuration

### Environment Variables

Create `.env.production` for static builds:

```env
# API URL for build-time data fetching
NEXT_PUBLIC_API_URL=http://192.168.1.246:8000

# Enable static mode
NEXT_PUBLIC_STATIC_MODE=true

# Read-only mode (no admin features)
NEXT_PUBLIC_READ_ONLY=true
```

### Custom Domain

To use a custom domain (e.g., `vanguardleague.com`):

1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Update your domain's DNS records:
   - Type: `CNAME`
   - Name: `www` (or `@` for root domain)
   - Value: `cname.vercel-dns.com`

## Troubleshooting

### "API request failed" during build

Make sure your backend is running:
```bash
cd /home/bc/vanguard-league-platform/backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Missing data in deployed site

Re-run the data export:
```bash
npm run export-data
npm run build:static
```

### Images not loading

Check that `images.unoptimized = true` in `next.config.ts` for static export.

### Page not found (404)

Some dynamic routes may not generate correctly. Check that:
1. All players have valid IDs
2. All events have valid IDs
3. Data export completed successfully

## Cost Breakdown

- **Vercel Free Plan**: $0/month
  - Unlimited static sites
  - 100GB bandwidth/month
  - Custom domain support
  - HTTPS included

- **Custom Domain** (optional): ~$12/year
  - Purchase from Namecheap, Google Domains, etc.

**Total Monthly Cost: $0** (free!) 🎉

## Advanced: Automation

### Auto-deploy on Git Push

Set up Vercel to auto-deploy when you push to GitHub:

1. Connect GitHub repository to Vercel
2. Configure build command: `npm run build:static`
3. Every `git push` will trigger a new deployment

### Pre-build Data Check

Add a pre-build script to verify data integrity:

```javascript
// scripts/pre-build-check.js
const fs = require('fs');

// Check that required data files exist
const requiredFiles = [
  'public/data/events.json',
  'public/data/players.json',
  'public/data/ladder-overall.json'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`❌ Missing required data file: ${file}`);
    console.error('Run: npm run export-data');
    process.exit(1);
  }
}

console.log('✅ All required data files present');
```

Update `package.json`:
```json
{
  "scripts": {
    "prebuild": "node scripts/pre-build-check.js",
    "build:static": "npm run export-data && NEXT_PUBLIC_STATIC_MODE=true npm run build"
  }
}
```

## Comparison: Static vs Dynamic

| Feature | Static Site (Free) | Dynamic Site (Paid) |
|---------|-------------------|---------------------|
| Hosting Cost | $0/month | $7-25/month |
| Update Frequency | Weekly (manual) | Real-time |
| Admin Interface | Local only | Available online |
| Scalability | Unlimited | Limited by server |
| Maintenance | Zero | Server management |
| Data Backup | Git history | Database backups |

## Support

For issues or questions:
- Check build logs: `npm run build:static`
- Verify data export: `ls -lh public/data/`
- Test local preview: `npm run preview:static`
- Vercel deployment logs: `vercel logs`

---

**Last Updated**: November 10, 2025
**Next Update**: After each VGI Trench event
