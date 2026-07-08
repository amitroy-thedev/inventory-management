# Vercel Deployment Guide

## Overview
This app is now configured to work on both localhost (with custom server) and Vercel (serverless).

## Changes Made for Vercel Compatibility

1. **Updated package.json scripts**:
   - `build`: Standard Next.js build for Vercel
   - `start`: Standard Next.js start for Vercel
   - `dev:vercel`: For local testing without custom server
   - `build:custom` & `start:custom`: For custom server (localhost only)

2. **Created vercel.json**: Configuration file for Vercel deployment

3. **Database initialization**: Moved from server startup to API route `/api/init-db`

4. **Auto-initialization**: App now calls `/api/init-db` on first load

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [vercel.com](https://vercel.com)
3. Click "Add New Project"
4. Import your repository
5. Configure build settings (should auto-detect):
   - **Framework Preset**: Next.js
   - **Build Command**: `next build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
6. Add environment variables (if using Turso):
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
7. Click "Deploy"

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

## Environment Variables

If you're using Turso Cloud Database, add these environment variables in Vercel:

- `TURSO_DATABASE_URL`: Your Turso database URL (starts with `libsql://`)
- `TURSO_AUTH_TOKEN`: Your Turso authentication token

If not set, the app will use a local SQLite file in `/tmp` directory.

## Local Development

### With Custom Server (Current Setup)
```bash
npm run dev
```

### Without Custom Server (Vercel-like)
```bash
npm run dev:vercel
```

## Troubleshooting

### 404 Errors on Vercel
- Ensure `vercel.json` is committed to your repository
- Check that build completes successfully in Vercel dashboard
- Verify all API routes are in `src/app/api/` directory

### Database Issues
- For Vercel deployment, use Turso or another cloud database
- Local SQLite files don't persist on Vercel (serverless)
- Database initializes automatically on first request

### Build Errors
- Run `npm run build` locally to test before deploying
- Check Vercel deployment logs for specific errors
- Ensure all dependencies are in `package.json`

## Important Notes

- **Custom server (`server.ts`)** only works locally, not on Vercel
- **Vercel uses serverless functions** for API routes
- **Database persists** only with cloud database (Turso recommended)
- **Environment variables** must be set in Vercel dashboard
