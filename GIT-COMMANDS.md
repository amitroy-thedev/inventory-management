# Git Commands to Deploy

## Current Status
✅ Staged the correct files (excluding .next build artifacts)
✅ Updated .gitignore to exclude Next.js build files

## Commit and Push

```bash
# Commit the changes
git commit -m "Fix Vercel deployment: add Next.js config and fix module resolution"

# Push to GitHub (or your git remote)
git push origin main
```

## Files Being Committed

**Modified Files:**
- `.gitignore` - Added .next/, .turbo/, out/
- `package.json` - Updated build/start scripts for Vercel
- `src/App.tsx` - Added database initialization call
- `src/lib/db.ts` - Auto-initialize on getDb()
- `tsconfig.json` - Fixed @/ path alias to ./src/*

**New Files:**
- `vercel.json` - Vercel deployment configuration
- `src/app/api/init-db/route.ts` - Database initialization endpoint
- `src/middleware.ts` - Next.js middleware
- `DEPLOYMENT.md` - Deployment guide
- `RESTART-GUIDE.md` - Restart instructions

## After Pushing

Your code will be ready to deploy on Vercel. The deployment will work because:
1. No custom server dependency
2. Proper Next.js configuration
3. Database auto-initializes on first request
4. Path aliases correctly configured

## Deploy to Vercel

```bash
# Option 1: Via Vercel CLI
vercel --prod

# Option 2: Via Vercel Dashboard
# Just connect your GitHub repo and Vercel will auto-deploy on push
```
