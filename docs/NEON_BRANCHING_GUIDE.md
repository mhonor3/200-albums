# Neon Database Branching Guide

## What is Database Branching?

Neon branches are like Git branches for your database. They create instant, isolated copies of your database that share unchanged data (copy-on-write). This means:

- Creating a branch is instant (no data copying)
- Branches only store differences from the parent
- Perfect for dev/test/staging environments

## Current Setup

Your Neon project has one branch:
- **main** = Production database (used by Vercel)

## Recommended Branch Structure

```
main (production)
├── dev (local development)
├── staging (optional - for testing before prod)
└── [feature-branches] (optional - for testing schema changes)
```

---

## Creating a Dev Branch

### Option 1: Neon Console (Easiest)

1. Go to https://console.neon.tech
2. Select your project
3. Click **Branches** in sidebar
4. Click **Create Branch**
5. Configure:
   - **Name**: `dev`
   - **Parent**: `main`
   - **Copy data**: Yes (copies current state)
6. Click **Create Branch**
7. Copy the connection string

### Option 2: Neon CLI

```bash
# Install Neon CLI
npm install -g neonctl

# Login to Neon
neonctl auth

# Create dev branch from main
neonctl branches create --name dev --parent main

# Get connection string
neonctl connection-string dev
```

---

## Using Branches in Your Workflow

### Local Development Setup

After creating the `dev` branch:

1. **Copy the dev branch connection string** from Neon console
2. **Update your local `.env`**:
   ```bash
   # Use dev branch locally
   NEON_DATABASE_URL="postgresql://...@ep-xxx.aws.neon.tech/neondb?sslmode=require&options=endpoint%3Dep-xxx-dev"
   ```

3. **Run migrations on dev branch**:
   ```bash
   npx prisma db push
   ```

4. **Import data** (if needed):
   ```bash
   npm run import-albums
   npm run init-first-album
   ```

### Production (Vercel)

Vercel uses the `main` branch automatically (via Neon integration).

**No changes needed** - Vercel's `NEON_DATABASE_URL` already points to `main`.

---

## Common Workflows

### Testing a Schema Change

```bash
# 1. Create a feature branch
neonctl branches create --name test-new-field --parent main

# 2. Get connection string and update .env
neonctl connection-string test-new-field

# 3. Update schema in prisma/schema.prisma
# Add your new field...

# 4. Push changes to test branch
npx prisma db push

# 5. Test your changes locally
npm run dev

# 6. If it works, apply to main
# Update .env to point to main
npx prisma db push

# 7. Delete test branch
neonctl branches delete test-new-field
```

### Resetting Dev Branch to Match Production

```bash
# Option 1: Delete and recreate dev branch
neonctl branches delete dev
neonctl branches create --name dev --parent main

# Option 2: Use Neon console
# Go to Branches → dev → Delete
# Then create new dev branch from main
```

### Creating a Staging Environment

```bash
# Create staging branch
neonctl branches create --name staging --parent main

# Get connection string
neonctl connection-string staging

# Add to Vercel as preview environment
# Settings → Environment Variables → Preview
# NEON_DATABASE_URL = <staging-connection-string>
```

---

## Branch Management Best Practices

### 1. Never Develop Directly on Main

Always use `dev` branch locally:
- ✅ Local development → `dev` branch
- ✅ Production (Vercel) → `main` branch
- ❌ Never run risky commands on `main` locally

### 2. Sync Dev with Production Regularly

```bash
# Weekly: Reset dev to match production
neonctl branches delete dev
neonctl branches create --name dev --parent main
```

### 3. Test Schema Changes on Feature Branches

```bash
# Before changing schema:
neonctl branches create --name test-schema --parent dev

# Test on feature branch first
# If it works, apply to dev
# If dev works, apply to main
```

### 4. Use Branches for Backups

```bash
# Before risky operation, create a backup branch
neonctl branches create --name backup-before-migration --parent main

# If something goes wrong, you can:
# - Restore from the branch
# - Point your app to the backup branch temporarily
```

---

## Understanding Branch Connection Strings

Neon uses special endpoint parameters in the connection string:

```
Main branch:
postgresql://user:pass@ep-xxx-pooler.aws.neon.tech/neondb

Dev branch:
postgresql://user:pass@ep-xxx-pooler.aws.neon.tech/neondb?options=endpoint%3Dep-xxx-dev
```

The `options=endpoint%3Dep-xxx-dev` tells Neon to use the `dev` branch endpoint.

---

## Free Tier Limits

- **10 branches** total per project
- **7-day PITR** per branch
- **3 GB storage** shared across all branches (copy-on-write = very efficient)

---

## Branch Lifecycle

### Creating

```bash
# From parent
neonctl branches create --name <branch-name> --parent <parent-branch>

# From specific point in time
neonctl branches create --name <branch-name> --parent main --timestamp "2026-01-14 10:00:00"
```

### Listing

```bash
# List all branches
neonctl branches list

# Show details
neonctl branches get <branch-name>
```

### Deleting

```bash
# Delete a branch (cannot delete main)
neonctl branches delete <branch-name>
```

### Restoring

```bash
# Restore branch to earlier state (uses 1 PITR restore)
neonctl branches restore <branch-name> --timestamp "2026-01-14 10:00:00"
```

---

## Environment Variable Setup

### Recommended Setup

**Local `.env` (dev branch):**
```bash
NEON_DATABASE_URL="postgresql://...?options=endpoint%3Dep-xxx-dev"
```

**Vercel Production (main branch):**
```bash
NEON_DATABASE_URL="postgresql://...@ep-xxx-pooler.aws.neon.tech/neondb"
```

**Vercel Preview (optional staging branch):**
```bash
NEON_DATABASE_URL="postgresql://...?options=endpoint%3Dep-xxx-staging"
```

---

## Common Issues

### "Branch not found"
- Check branch name: `neonctl branches list`
- Ensure you're in the right project

### "Connection string doesn't work"
- Verify the endpoint parameter is URL-encoded
- Check if branch still exists
- Ensure Prisma client is regenerated: `npx prisma generate`

### "Changes on dev not appearing"
- Verify `.env` points to correct branch
- Check connection string includes branch endpoint
- Restart your dev server

---

## Quick Reference

```bash
# Create dev branch
neonctl branches create --name dev --parent main

# Get connection string
neonctl connection-string dev

# List branches
neonctl branches list

# Delete branch
neonctl branches delete <branch-name>

# Reset dev to match main
neonctl branches delete dev && neonctl branches create --name dev --parent main

# Create backup before risky operation
neonctl branches create --name backup-$(date +%Y%m%d) --parent main
```

---

## Summary

**Why use branches?**
- ✅ Separate dev/prod databases
- ✅ Test schema changes safely
- ✅ Create instant backups
- ✅ Prevent accidents on production
- ✅ Free on Neon's free tier

**Best practice:**
1. Use `dev` branch for local development
2. Use `main` branch for production (Vercel)
3. Create feature branches for testing schema changes
4. Create backup branches before risky operations

**This would have prevented today's disaster** - you would have run the destructive command on `dev`, not `main`!

---

## Next Steps

Want to automate database branching with your Git workflow?

**See:** [CI/CD Setup Guide](./CI_CD_SETUP.md) for automatic database branching that mirrors your GitHub branches and Vercel deployments.
