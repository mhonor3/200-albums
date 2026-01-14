# Complete CI/CD Setup: GitHub + Vercel + Neon

This guide sets up automatic database branching that mirrors your Git workflow.

## Overview

When fully configured, here's what happens automatically:

```
GitHub Branch          Vercel Deployment       Neon Database Branch
─────────────────────────────────────────────────────────────────────
main                → Production           → main (production data)
dev                 → Preview              → dev (development data)
feature/new-thing   → Preview              → feature-new-thing (isolated test data)
```

**Benefits:**
- ✅ Every PR gets its own isolated database
- ✅ Test database migrations safely before production
- ✅ Preview deployments have real data without affecting production
- ✅ Databases auto-delete when branches are merged/closed

---

## Prerequisites

- ✅ Neon account with 200-albums project
- ✅ GitHub repository (mhonor3/200-albums)
- ✅ Vercel project connected to GitHub
- ✅ Neon integration installed in Vercel

---

## Part 1: Enable Neon GitHub Integration

### Step 1: Connect Neon to GitHub

1. Go to https://console.neon.tech
2. Select your `200-albums` project
3. Click **Integrations** in the left sidebar
4. Find **GitHub** and click **Add Integration**
5. Click **Authorize Neon**
6. Select your GitHub account
7. Choose **Only select repositories**
8. Select `mhonor3/200-albums`
9. Click **Install & Authorize**

### Step 2: Configure Auto-Branching

After connecting:

1. In Neon console, go to **Integrations** → **GitHub**
2. Configure settings:
   - ✅ **Create a branch for each pull request**
   - ✅ **Delete branch when PR is merged/closed**
   - **Parent branch**: `main`
   - **Branch name pattern**: Use PR branch name (default)
3. Click **Save**

### What This Does

Now when you:
- Create a PR → Neon creates a database branch
- Push commits → Same database branch is used
- Merge/close PR → Neon deletes the database branch

---

## Part 2: Configure Vercel Environment Variables

### Understanding Vercel Environments

Vercel has three environment types:
1. **Production** - Only `main` branch
2. **Preview** - All other branches (PRs, dev, etc.)
3. **Development** - Local development (not used here)

### Step 1: Set Production Environment Variable

1. Go to https://vercel.com/dashboard
2. Select your `200-albums` project
3. Go to **Settings** → **Environment Variables**
4. Find `NEON_DATABASE_URL` (should already exist from Neon integration)
5. Verify it's set for:
   - ✅ **Production** ✅
   - ⬜ **Preview**
   - ⬜ **Development**
6. This points to Neon `main` branch

### Step 2: Configure Preview Deployments

**Option A: Automatic (Recommended - Neon Integration)**

The Neon-Vercel integration handles this automatically:
- Each preview deployment gets a unique database URL
- Neon creates/deletes branches as needed
- **No manual configuration needed!**

**Option B: Manual (Fixed Dev Branch for All Previews)**

If you want ALL previews to use the same `dev` branch:

1. In Vercel **Environment Variables**
2. Edit `NEON_DATABASE_URL`
3. Check only:
   - ⬜ **Production**
   - ✅ **Preview** ✅
   - ⬜ **Development**
4. Set value to your `dev` branch connection string

---

## Part 3: Set Up Git Workflow

### Create a Dev Branch

```bash
# Create dev branch in Git
git checkout -b dev
git push origin dev

# This will:
# 1. Trigger Vercel preview deployment
# 2. Create Neon dev database branch (if GitHub integration is active)
```

### Set Dev as Default Branch for Development

1. Go to GitHub → Settings → Branches
2. Change default branch to `dev` (optional)
3. Or keep `main` as default and merge to it from `dev`

---

## Part 4: Complete Workflow Example

### Scenario: Adding a New Feature

**1. Create Feature Branch**
```bash
git checkout dev
git pull origin dev
git checkout -b feature/add-album-tags
```

**2. Push to GitHub**
```bash
git push origin feature/add-album-tags
```

**3. Automatic Actions**
- ✅ Neon creates `feature-add-album-tags` database branch
- ✅ Vercel creates preview deployment
- ✅ Preview deployment uses feature database branch

**4. Create Pull Request**
- Go to GitHub
- Create PR: `feature/add-album-tags` → `dev`
- Vercel comment appears with preview URL
- Preview uses isolated database - safe to test!

**5. Make Database Schema Changes**

Edit `prisma/schema.prisma`:
```prisma
model Album {
  // ... existing fields
  tags String[] @default([]) // New field!
}
```

**6. Push Schema Changes**
```bash
git add prisma/schema.prisma
git commit -m "Add tags field to Album model"
git push origin feature/add-album-tags
```

**7. Vercel Automatically:**
- Redeploys preview
- Runs `prisma generate` (via postinstall)
- **Schema change only affects feature branch database!**

**8. Test on Preview**
- Visit preview URL from Vercel
- Add tags to albums
- Test thoroughly
- Production database is untouched ✅

**9. Merge to Dev**
```bash
# After PR approval
git checkout dev
git merge feature/add-album-tags
git push origin dev
```

**10. Automatic Cleanup**
- ✅ Neon deletes `feature-add-album-tags` database
- ✅ Vercel deploys new preview for `dev` branch
- ✅ `dev` database now has the schema change

**11. Test on Dev Preview**
- Verify everything works on dev preview
- Run migrations if needed

**12. Deploy to Production**
```bash
# Create PR: dev → main
# After testing and approval, merge to main
git checkout main
git merge dev
git push origin main
```

**13. Production Deployment**
- ✅ Vercel deploys to production
- ⚠️ **Schema migration needed!**

---

## Part 5: Handling Database Migrations in Production

### Before Merging to Main

**Option 1: Manual Migration (Safest)**

1. **Create backup first:**
```bash
# Run GitHub Actions backup manually
# Or create Neon branch backup
```

2. **Apply migration to production:**
```bash
# Temporarily point local .env to production
NEON_DATABASE_URL="<main-branch-url>"

# Create backup
npm run backup backups/before-tags-migration.json

# Run migration
npx prisma db push

# Verify in Neon console
```

3. **Deploy code:**
```bash
git push origin main
```

**Option 2: Automated Migration (Advanced)**

Add to Vercel build command:

**vercel.json:**
```json
{
  "buildCommand": "prisma db push && next build",
  "crons": [...]
}
```

⚠️ **Warning:** This runs migrations on every deploy. Use with caution!

**Option 3: GitHub Action (Recommended for Production)**

Create `.github/workflows/deploy-production.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run database migration
        env:
          NEON_DATABASE_URL: ${{ secrets.NEON_DATABASE_URL }}
        run: npx prisma db push

      - name: Trigger Vercel deployment
        run: |
          curl -X POST ${{ secrets.VERCEL_DEPLOY_HOOK }}
```

---

## Part 6: Environment Setup Summary

### Local Development (.env)

```bash
# Option A: Use dev branch (recommended)
NEON_DATABASE_URL="postgresql://...?options=endpoint%3Dep-xxx-dev"

# Option B: Use feature branch while working on it
NEON_DATABASE_URL="postgresql://...?options=endpoint%3Dep-xxx-feature-name"
```

### Vercel Production (Environment Variables)

```bash
NEON_DATABASE_URL="postgresql://...@ep-xxx.aws.neon.tech/neondb"
# (main branch - set by Neon integration)
```

### Vercel Preview (Automatic)

Handled automatically by Neon-Vercel integration:
- Each PR gets unique database URL
- Format: `postgresql://...?options=endpoint%3Dep-xxx-pr-123`

---

## Part 7: Branch Naming Conventions

### Recommended Structure

```
main                    → Production (never develop here)
├── dev                 → Development (base for features)
│   ├── feature/tags
│   ├── feature/dark-mode
│   └── fix/rating-bug
└── hotfix/critical     → Emergency fixes (from main)
```

### Git Flow

```bash
# Regular features
dev → feature/name → dev → main

# Hotfixes
main → hotfix/name → main (and merge back to dev)

# Releases (optional)
dev → release/v1.1 → main
```

---

## Part 8: Testing the Setup

### Verify GitHub + Neon Integration

1. Create test branch:
```bash
git checkout -b test/integration-check
git push origin test/integration-check
```

2. Check Neon console:
   - Go to **Branches**
   - Look for `test-integration-check` branch
   - ✅ Should appear within 30 seconds

3. Check Vercel:
   - Go to **Deployments**
   - Look for preview deployment
   - Check environment variables in deployment logs

4. Cleanup:
```bash
git checkout dev
git branch -D test/integration-check
git push origin --delete test/integration-check
```

5. Verify Neon deletes branch automatically

---

## Part 9: Troubleshooting

### "Preview deployment uses production database"

**Problem:** Neon integration not configured properly

**Solution:**
1. Check Neon console → Integrations → GitHub
2. Verify "Create branch for PRs" is enabled
3. Re-install Vercel integration: Settings → Integrations → Neon → Disconnect → Reconnect

### "Database branch not created for PR"

**Problem:** GitHub integration not active

**Solution:**
1. Go to https://github.com/settings/installations
2. Find "Neon" app
3. Verify `mhonor3/200-albums` is selected
4. Grant repository access

### "Schema changes break preview deployment"

**Problem:** Migration not running on preview

**Solution:**
Add to `package.json`:
```json
{
  "scripts": {
    "build": "prisma generate && prisma db push && next build"
  }
}
```

⚠️ Only safe for preview environments!

### "Preview database is empty"

**Problem:** New branch needs data

**Solution:**
1. Branch is copied from parent at creation time
2. If parent was empty, child will be empty
3. Run seeding script in preview:
   - Add to Vercel build command
   - Or manually seed via Neon SQL editor

---

## Part 10: Advanced: Auto-Seed Preview Databases

### Option: GitHub Action to Seed PR Databases

`.github/workflows/seed-preview.yml`:

```yaml
name: Seed Preview Database

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  seed:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci

      - name: Get Neon branch URL
        id: neon
        run: |
          # This assumes Neon CLI is set up
          # Or use Neon API to get branch connection string
          echo "url=$NEON_BRANCH_URL" >> $GITHUB_OUTPUT

      - name: Seed database
        env:
          NEON_DATABASE_URL: ${{ steps.neon.outputs.url }}
        run: |
          npm run import-albums
          npm run init-first-album
```

---

## Summary: What You Get

### Automatic Workflow

```
1. Create feature branch in GitHub
   ↓
2. Neon creates database branch (isolated data)
   ↓
3. Vercel creates preview deployment (uses feature database)
   ↓
4. Make changes, test safely
   ↓
5. Merge PR
   ↓
6. Neon deletes database branch
   ↓
7. Changes deploy to next environment (dev → main)
```

### Safety Benefits

- ✅ Production database never touched during development
- ✅ Each PR has isolated database for testing
- ✅ Schema changes tested in isolation before production
- ✅ Automatic cleanup when branches merge
- ✅ Rollback capability via Neon PITR

### Cost

- **Free tier supports:**
  - 10 concurrent branches
  - 3 GB total storage (shared via copy-on-write)
  - This is plenty for most workflows!

---

## Quick Start Checklist

- [ ] Connect Neon to GitHub (Part 1)
- [ ] Enable auto-branching in Neon (Part 1)
- [ ] Verify Neon-Vercel integration (Part 2)
- [ ] Create `dev` branch in Git (Part 3)
- [ ] Test with a feature branch (Part 8)
- [ ] Document your team's workflow
- [ ] Set up production migration strategy (Part 5)

---

## Resources

- [Neon Branching Docs](https://neon.tech/docs/guides/branching)
- [Vercel Preview Deployments](https://vercel.com/docs/deployments/preview-deployments)
- [Neon-Vercel Integration](https://neon.tech/docs/guides/vercel)

---

**You now have a production-grade CI/CD pipeline!** 🚀
