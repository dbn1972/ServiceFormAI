# Deployment Guide: ServiceFormAI OS

Complete guide for deploying both frontend and backend to production.

## 🏗️ Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│                 │         │                  │         │             │
│   Frontend      │ ──────► │   NestJS API     │ ──────► │ PostgreSQL  │
│   (Vite/React)  │  HTTPS  │   (Backend)      │         │  Database   │
│                 │         │                  │         │             │
└─────────────────┘         └──────────────────┘         └─────────────┘
      Vercel/                     Railway/                   Railway/
      Netlify                     Render                     Render
```

## 📦 Backend Deployment

### Option 1: Railway (Recommended)

Railway provides automatic deployments and PostgreSQL database in one platform.

#### Step 1: Prepare Backend

1. **Add a Procfile** (if not exists) in `/backend` directory:
   ```
   web: npm run start:prod
   ```

2. **Update package.json** build scripts:
   ```json
   {
     "scripts": {
       "build": "nest build",
       "start:prod": "node dist/main"
     }
   }
   ```

3. **Ensure environment variables are ready**:
   Create `/backend/.env.example`:
   ```env
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   JWT_SECRET=your_jwt_secret_key
   JWT_REFRESH_SECRET=your_refresh_secret_key
   PORT=3000
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-domain.com
   ```

#### Step 2: Deploy to Railway

1. Go to [railway.app](https://railway.app) and sign in

2. Click "New Project" → "Deploy from GitHub repo"

3. Select your repository and choose the `/backend` directory

4. Railway will auto-detect it's a Node.js app

5. Add PostgreSQL:
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will automatically inject `DATABASE_URL`

6. Add environment variables:
   - Go to your service → "Variables"
   - Add:
     ```
     JWT_SECRET=<generate-random-string>
     JWT_REFRESH_SECRET=<generate-random-string>
     NODE_ENV=production
     FRONTEND_URL=https://your-frontend.vercel.app
     ```

7. Deploy:
   - Railway will automatically deploy
   - Note your backend URL: `https://your-app.railway.app`

8. **Enable CORS** in `backend/src/main.ts`:
   ```typescript
   app.enableCors({
     origin: [
       'http://localhost:5173',
       'https://your-frontend.vercel.app',
       'https://your-custom-domain.com'
     ],
     credentials: true,
   });
   ```

#### Step 3: Verify Backend

Test your deployed backend:
```bash
curl https://your-app.railway.app/api/health
```

### Option 2: Render

1. Go to [render.com](https://render.com) and create account

2. Click "New +" → "Web Service"

3. Connect your GitHub repository

4. Configure:
   - **Name**: serviceformai-backend
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Instance Type**: Free (or paid)

5. Add PostgreSQL:
   - "New +" → "PostgreSQL"
   - Note the Internal Database URL

6. Add environment variables in Render dashboard:
   ```
   DATABASE_URL=<postgres-internal-url>
   JWT_SECRET=<random-string>
   JWT_REFRESH_SECRET=<random-string>
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend.vercel.app
   ```

7. Deploy and note your URL: `https://serviceformai-backend.onrender.com`

## 🎨 Frontend Deployment

### Option 1: Vercel (Recommended for Vite)

#### Step 1: Prepare Frontend

1. **Create production environment file** `.env.production`:
   ```env
   VITE_API_URL=https://your-backend.railway.app/api
   VITE_ENV=production
   ```

2. **Ensure build script works**:
   ```bash
   npm run build
   ```

3. **Add vercel.json** in root (optional):
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

#### Step 2: Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. For production:
   ```bash
   vercel --prod
   ```

5. **Or use Vercel Dashboard**:
   - Go to [vercel.com](https://vercel.com)
   - "Add New Project"
   - Import your GitHub repo
   - Set root directory to `.` (or leave empty)
   - Add environment variable:
     ```
     VITE_API_URL=https://your-backend.railway.app/api
     ```
   - Deploy!

6. Note your frontend URL: `https://your-app.vercel.app`

#### Step 3: Update Backend CORS

Update your backend's CORS settings with the Vercel URL:

```typescript
// backend/src/main.ts
app.enableCors({
  origin: [
    'https://your-app.vercel.app',
    'https://your-custom-domain.com'
  ],
  credentials: true,
});
```

Redeploy backend to apply changes.

### Option 2: Netlify

1. **Add netlify.toml** in root:
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. Deploy to Netlify:
   - Go to [netlify.com](https://netlify.com)
   - "Add new site" → "Import from Git"
   - Connect repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Add environment variables:
     ```
     VITE_API_URL=https://your-backend.railway.app/api
     ```
   - Deploy!

## 🔐 Security Checklist

Before going to production:

### Backend
- [ ] Change JWT secrets to strong random values
- [ ] Enable HTTPS only (Railway/Render do this automatically)
- [ ] Set proper CORS origins (remove wildcards)
- [ ] Add rate limiting (NestJS throttler)
- [ ] Enable helmet for security headers
- [ ] Set up environment-specific configs
- [ ] Enable database connection pooling
- [ ] Add request logging
- [ ] Set up error monitoring (Sentry)

### Frontend
- [ ] Remove console.logs
- [ ] Set API URL to production backend
- [ ] Enable production build optimizations
- [ ] Add error boundary
- [ ] Set up analytics (optional)
- [ ] Add CSP headers
- [ ] Enable HTTPS
- [ ] Add monitoring (Vercel Analytics)

## 🔄 CI/CD Setup

### Automatic Deployments

Both Railway and Vercel support automatic deployments from Git:

1. **Push to main branch** → Automatic production deployment
2. **Push to feature branch** → Preview deployment

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd backend && npm install
      - run: cd backend && npm run build
      - run: cd backend && npm run test
      # Deploy to Railway via CLI or API

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## 📊 Monitoring & Logging

### Backend Monitoring

1. **Railway Logs**:
   - Dashboard → Your service → "Logs"
   - Real-time log streaming

2. **Database Monitoring**:
   - Railway PostgreSQL → "Metrics"
   - Monitor connections, queries, storage

3. **Error Tracking** (Optional):
   ```bash
   npm install @sentry/node
   ```
   
   ```typescript
   // backend/src/main.ts
   import * as Sentry from '@sentry/node';
   
   Sentry.init({
     dsn: 'your-sentry-dsn',
     environment: process.env.NODE_ENV,
   });
   ```

### Frontend Monitoring

1. **Vercel Analytics**:
   - Automatic with Vercel deployment
   - Dashboard → Your project → "Analytics"

2. **Error Tracking**:
   ```bash
   npm install @sentry/react
   ```

   ```typescript
   // src/main.tsx
   import * as Sentry from '@sentry/react';
   
   Sentry.init({
     dsn: 'your-sentry-dsn',
     environment: import.meta.env.VITE_ENV,
   });
   ```

## 🌐 Custom Domain Setup

### Frontend (Vercel)

1. Go to Project Settings → Domains
2. Add your domain: `serviceformai.com`
3. Add DNS records as instructed by Vercel
4. Wait for SSL certificate (automatic)

### Backend (Railway)

1. Go to your service → Settings → Networking
2. Click "Generate Domain" or add custom domain
3. Add CNAME record: `api.serviceformai.com` → `your-app.railway.app`
4. Update frontend `.env.production`:
   ```env
   VITE_API_URL=https://api.serviceformai.com/api
   ```

## 🧪 Testing Production

After deployment, test the full flow:

### 1. Test Authentication
```bash
# Register a new user
curl -X POST https://your-backend.railway.app/api/auth/register-consumer \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'

# Login
curl -X POST https://your-backend.railway.app/api/auth/login-consumer \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### 2. Test Frontend
- Visit `https://your-frontend.vercel.app`
- Try registering a new account
- Browse services
- Submit an application
- Check application status

### 3. Test Producer Flow
- Register as tenant
- Create a service
- Publish the service
- Verify it appears in consumer catalog

## 📝 Environment Variables Summary

### Backend (Railway/Render)
```env
DATABASE_URL=<auto-injected-by-railway>
JWT_SECRET=<random-64-char-string>
JWT_REFRESH_SECRET=<random-64-char-string>
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-frontend.vercel.app
```

### Frontend (Vercel/Netlify)
```env
VITE_API_URL=https://your-backend.railway.app/api
VITE_ENV=production
```

## 🚨 Troubleshooting

### Issue: CORS errors in production

**Solution**: Verify backend CORS settings include your frontend URL:
```typescript
app.enableCors({
  origin: ['https://your-frontend.vercel.app'],
  credentials: true,
});
```

### Issue: Database connection fails

**Solution**: 
1. Check `DATABASE_URL` is set correctly
2. Verify PostgreSQL service is running
3. Check database connection limits
4. Review logs: Railway → Service → Logs

### Issue: Frontend shows "Network Error"

**Solution**:
1. Verify `VITE_API_URL` is correct
2. Check backend is running and accessible
3. Test API directly: `curl https://your-backend.railway.app/api/health`
4. Check browser console for CORS errors

### Issue: Build fails

**Backend**:
```bash
cd backend
npm install
npm run build
```
Check for TypeScript errors.

**Frontend**:
```bash
npm install
npm run build
```
Check for import errors or missing dependencies.

## 📚 Quick Reference

| Service | URL Pattern | Purpose |
|---------|-------------|---------|
| Railway Backend | `https://[app-name].railway.app` | API server |
| Railway DB | Internal URL | PostgreSQL |
| Vercel Frontend | `https://[app-name].vercel.app` | Web app |
| Custom Domain | `https://serviceformai.com` | Production |

## ✅ Final Checklist

- [ ] Backend deployed to Railway/Render
- [ ] PostgreSQL database created and connected
- [ ] Environment variables configured
- [ ] CORS settings updated
- [ ] Frontend deployed to Vercel/Netlify
- [ ] API URL configured in frontend
- [ ] Custom domains set up (optional)
- [ ] SSL certificates active
- [ ] Test complete user flow
- [ ] Monitoring and logging enabled
- [ ] Error tracking configured
- [ ] Documentation updated

---

**Congratulations!** 🎉 Your ServiceFormAI OS platform is now live in production!

Next steps:
- Add user documentation
- Set up staging environment
- Configure backups
- Add load testing
- Monitor performance
