# Vanguard League - Deployment Guide

This guide explains how to deploy a read-only, public version of the Vanguard League platform.

## Overview

The platform has two modes:
- **Development Mode**: Full admin access (local use)
- **Production Mode**: Read-only public site (online deployment)

## What's Included in Read-Only Mode

### ✅ Visible Features
- Homepage with current champion cards
- Pound-for-Pound ladder rankings
- Weight class ladders (Lightweight, Middleweight, Heavyweight)
- Fighter profiles with stats and records
- Match history
- ELO ratings

### ❌ Hidden Features (Admin Only)
- Event management
- Fighter registration
- Match entry
- Profile editing
- Weigh-ins and check-ins
- Bracket generation

## Deployment Options

### Option 1: Vercel (Recommended - Free Tier)

Vercel provides free hosting for Next.js applications with automatic deployments.

#### Steps:

1. **Push to GitHub** (if not already done):
   ```bash
   cd /home/bc/vanguard-league-platform
   git add .
   git commit -m "Prepare for production deployment"
   git push origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Set root directory to `frontend`
   - Add environment variables:
     ```
     NEXT_PUBLIC_API_URL=http://YOUR_BACKEND_URL:8000
     NEXT_PUBLIC_READ_ONLY=true
     ```
   - Click "Deploy"

3. **Custom Domain** (optional):
   - In Vercel project settings → Domains
   - Add your custom domain (e.g., vanguardleague.com)
   - Follow DNS configuration instructions

**Pros:**
- Free for hobby projects
- Automatic deployments on git push
- Built-in CDN and SSL
- Great performance

**Cons:**
- Backend must be hosted separately

---

### Option 2: Netlify (Alternative - Free Tier)

Similar to Vercel, great for static/Next.js sites.

#### Steps:

1. **Deploy to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select repository
   - Build settings:
     - Base directory: `frontend`
     - Build command: `npm run build`
     - Publish directory: `frontend/.next`
   - Environment variables:
     ```
     NEXT_PUBLIC_API_URL=http://YOUR_BACKEND_URL:8000
     NEXT_PUBLIC_READ_ONLY=true
     ```

---

### Option 3: Backend Deployment

Your backend needs to be accessible from the internet. Options:

#### 3a. Keep Backend Local (Port Forwarding)

**Requirements:**
- Static IP or dynamic DNS
- Port forwarding on router (port 8000)
- HTTPS recommended (use Cloudflare Tunnel or ngrok)

**Quick Setup with ngrok:**
```bash
# Install ngrok
npm install -g ngrok

# Start backend
cd /home/bc/vanguard-league-platform/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000

# In another terminal, create tunnel
ngrok http 8000
```

Copy the ngrok URL (e.g., `https://abc123.ngrok.io`) and use it as `NEXT_PUBLIC_API_URL`.

#### 3b. Deploy Backend to Railway (Free Tier)

Railway offers free hosting for small projects.

**Steps:**
1. Create `railway.toml` in backend directory:
   ```toml
   [build]
   builder = "NIXPACKS"

   [deploy]
   startCommand = "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
   ```

2. Deploy:
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub"
   - Select repository and backend directory
   - Railway will auto-detect Python and deploy
   - Add environment variables (database URL, etc.)

3. Get deployment URL and use it in frontend environment

#### 3c. Deploy Backend to Render (Free Tier)

**Steps:**
1. Go to [render.com](https://render.com)
2. Create new "Web Service"
3. Connect GitHub repository
4. Settings:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables
6. Deploy and get URL

---

## Database Options for Production

### Option 1: Keep PostgreSQL Local
- Expose port 5432 with port forwarding
- Use secure password
- Configure firewall to only allow backend IP

### Option 2: Neon (Free PostgreSQL)
- Go to [neon.tech](https://neon.tech)
- Create free database (3GB storage)
- Update `DATABASE_URL` in backend environment
- Run migrations:
  ```bash
  alembic upgrade head
  ```

### Option 3: Supabase (Free PostgreSQL)
- Go to [supabase.com](https://supabase.com)
- Create new project
- Use provided connection string
- Update environment and run migrations

---

## Quick Deployment (All-in-One)

For the easiest setup:

1. **Frontend**: Deploy to Vercel
2. **Backend**: Use ngrok tunnel (for testing) or Railway (permanent)
3. **Database**: Keep local or migrate to Neon

### Example Full Setup (15 minutes):

```bash
# 1. Start backend locally
cd /home/bc/vanguard-league-platform/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 &

# 2. Create tunnel
ngrok http 8000
# Copy the HTTPS URL (e.g., https://abc123.ngrok-free.app)

# 3. Deploy frontend to Vercel
cd ../frontend
# Push to GitHub if not done
git add .
git commit -m "Production build"
git push

# Go to vercel.com, import project, set env var:
# NEXT_PUBLIC_API_URL=https://abc123.ngrok-free.app
# NEXT_PUBLIC_READ_ONLY=true

# Done! Your site is live at: https://your-project.vercel.app
```

---

## Testing Production Build Locally

Before deploying, test the production build:

```bash
cd /home/bc/vanguard-league-platform/frontend

# Build for production
npm run build

# Start production server
npm start

# Visit http://localhost:3000
# Event Management section should be hidden
```

---

## Environment Variables Reference

### Frontend (.env.production)
```env
NEXT_PUBLIC_API_URL=http://192.168.1.246:8000  # Your backend URL
NEXT_PUBLIC_READ_ONLY=true                      # Enable read-only mode
NEXT_PUBLIC_SITE_NAME=Vanguard League
NEXT_PUBLIC_SITE_DESCRIPTION=VGI Trench Submission-Only Ladder
```

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@host:5432/vanguard_league
CORS_ORIGINS=["https://your-frontend.vercel.app"]
```

---

## CORS Configuration

Update backend CORS to allow your frontend domain:

```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-frontend.vercel.app",  # Add your production URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Updating the Production Site

After events or ranking changes:

1. **Regenerate ladder images** (if using static images):
   ```bash
   cd /home/bc/vanguard-league-platform/frontend
   ./update-ladder-images.sh
   ```

2. **Backend updates auto-refresh** - No rebuild needed

3. **Frontend changes** - Git push triggers auto-deploy on Vercel

---

## Security Considerations

### For Public Deployment:

1. **Database**: Use strong passwords, restrict access
2. **API**: Add rate limiting (optional)
3. **CORS**: Only allow your frontend domain
4. **HTTPS**: Always use HTTPS in production (Vercel/Netlify provide free SSL)

### Read-Only Protection:

The read-only mode hides UI elements but doesn't block API endpoints. For full security:

1. **Option A**: Deploy separate read-only API endpoints
2. **Option B**: Add authentication middleware to write endpoints
3. **Option C**: Use firewall rules to restrict access to admin endpoints

For a small community league, hiding UI elements is usually sufficient.

---

## Cost Breakdown

### Recommended Setup (100% Free):
- Frontend: Vercel Free Tier
- Backend: Railway Free Tier OR ngrok free
- Database: Keep local OR Neon free tier
- **Total: $0/month**

### Scalable Setup (~$20/month):
- Frontend: Vercel Pro ($20/mo) - custom domain, analytics
- Backend: Railway Pro - better performance
- Database: Neon paid tier - more storage
- **Total: ~$20-40/month**

---

## Support

For issues:
- Check deployment logs in Vercel/Railway/Netlify dashboard
- Test API connectivity: `curl https://your-backend-url/api/health`
- Verify environment variables are set correctly

---

## Next Steps

1. Choose your deployment platform (Vercel recommended)
2. Push code to GitHub (if not already done)
3. Deploy frontend with environment variables
4. Set up backend (ngrok for testing, Railway for production)
5. Test the live site
6. Share the URL with your community!

**Your site will be live at:**
- `https://your-project-name.vercel.app`
- Or your custom domain: `https://vanguardleague.com`
