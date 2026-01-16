# Quick Setup: Dev Branch

Follow these steps to create a separate development database:

## Step 1: Create Dev Branch in Neon Console

1. Go to https://console.neon.tech
2. Select your `200-albums` project
3. Click **Branches** in the left sidebar
4. Click **Create Branch** button
5. Fill in:
   - **Name**: `dev`
   - **Parent branch**: `main`
   - **Include data from parent**: ✅ Yes
6. Click **Create Branch**

## Step 2: Get Dev Branch Connection String

After creating the branch, you'll see the connection string. It looks like:

```
postgresql://neondb_owner:npg_xxx@ep-spring-cell-ahqacl39-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&options=endpoint%3Dep-spring-cell-ahqacl39-dev
```

**Key difference from main:**
- Main: `...neondb?sslmode=require`
- Dev: `...neondb?sslmode=require&options=endpoint%3Dep-xxx-dev`

## Step 3: Update Your Local .env

```bash
# Old (points to main - production)
NEON_DATABASE_URL="postgresql://neondb_owner:npg_xxx@ep-xxx.aws.neon.tech/neondb?sslmode=require"

# New (points to dev - local development)
NEON_DATABASE_URL="postgresql://neondb_owner:npg_xxx@ep-xxx.aws.neon.tech/neondb?sslmode=require&options=endpoint%3Dep-xxx-dev"
```

## Step 4: Verify It Works

```bash
# Regenerate Prisma client
npx prisma generate

# Check connection
npx prisma db push

# Start dev server
npm run dev
```

## Step 5: Keep Production Safe

**Vercel (Production):**
- Already uses `main` branch
- No changes needed
- NEON_DATABASE_URL points to main branch

**Your Local Machine:**
- Now uses `dev` branch
- Safe to experiment
- Won't affect production data

## Success!

Now when you develop locally:
- ✅ Changes only affect `dev` branch
- ✅ Production data is safe
- ✅ Can test schema changes without risk
- ✅ Can reset dev anytime: delete branch → create new one from main

**This prevents disasters like what happened earlier!**

---

## Want Automatic Branching?

See [CI/CD Setup Guide](../docs/CI_CD_SETUP.md) to automatically create database branches for every GitHub PR and Vercel preview deployment!
