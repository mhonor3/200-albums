# Database Backup & Recovery Guide

## Overview

Your 200-albums app now has a multi-layered backup strategy to prevent data loss:

1. **Neon Point-in-Time Recovery (PITR)** - 6-hour instant restore
2. **GitHub Actions** - Automated daily backups (90-day retention)
3. **Manual Backups** - On-demand backups before risky operations

---

## Layer 1: Neon Point-in-Time Recovery (Instant)

### What It Does
Neon automatically tracks all database changes for the past 6 hours, allowing you to restore to any point in time.

### When to Use
- You just made a mistake and need to undo it immediately
- Accidental data deletion within the last 6 hours
- Schema migration went wrong

### How to Restore

**Via Neon Console:**
1. Go to https://console.neon.tech
2. Select your project: `200-albums`
3. Click **Restore** in the sidebar
4. Select the branch: `main`
5. Choose a timestamp (within last 6 hours)
6. Click **Restore**
7. Your database will be restored in ~5 seconds

**Via Neon CLI:**
```bash
# Install Neon CLI
npm install -g neonctl

# Login
neonctl auth

# Restore to specific timestamp
neonctl branches restore main --timestamp "2026-01-14 14:00:00"
```

### Limitations
- Only 6 hours of history on free tier
- Or 1 GB of data changes (whichever comes first)
- Cannot restore beyond the 6-hour window

---

## Layer 2: GitHub Actions Automated Backups

### What It Does
Every day at 2 AM UTC, GitHub Actions exports your entire database to JSON and stores it as an artifact.

### Retention
- 90 days of backups (GitHub free tier)
- Last 30 backups are kept (older ones auto-deleted)

### How to Download a Backup

1. Go to your GitHub repository: https://github.com/YOUR_USERNAME/200-albums
2. Click **Actions** tab
3. Click **Database Backup** workflow
4. Find the backup you want (sorted by date)
5. Scroll down to **Artifacts**
6. Download `database-backup-XXX`
7. Unzip the file to get the JSON backup

### How to Restore from GitHub Backup

```bash
# Download and unzip the artifact first
# Then restore:
npm run restore backup-20260114_020000.json
```

### Manual Trigger

You can manually trigger a backup anytime:
1. Go to **Actions** → **Database Backup**
2. Click **Run workflow**
3. Select branch: `main`
4. Click **Run workflow**

### Setup Required

Add `NEON_DATABASE_URL` to GitHub Secrets:
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `NEON_DATABASE_URL`
4. Value: Your Neon connection string
5. Click **Add secret**

---

## Layer 3: Manual Backups (Before Risky Operations)

### When to Use
- Before deploying schema changes
- Before running data migration scripts
- Before making bulk data updates
- Any time you're doing something risky

### How to Create a Manual Backup

```bash
# Quick backup with auto-generated name
npm run backup

# Backup with specific name
npm run backup backups/pre-deployment.json

# Example: before schema change
npm run backup backups/before-adding-new-field.json
```

### How to Restore

```bash
# Restore from backup (DESTRUCTIVE - deletes all current data!)
npm run restore backups/pre-deployment.json

# You'll get a 5-second warning before it proceeds
```

### Storage

- Backups are saved locally (not committed to git by default)
- Create a `backups/` folder for organization
- Consider uploading important backups to cloud storage

---

## Complete Disaster Recovery Scenarios

### Scenario 1: "I just deleted all users by accident!"
**Timeline: 2 minutes ago**

```bash
# Use Neon PITR (fastest)
1. Go to https://console.neon.tech
2. Restore to timestamp before deletion
3. Done in 5 seconds
```

### Scenario 2: "I ran a bad migration yesterday"
**Timeline: 24 hours ago**

```bash
# Neon PITR won't work (>6 hours)
# Use GitHub Actions backup:

1. Download yesterday's backup from GitHub Actions
2. Unzip the artifact
3. npm run restore backup-20260113_020000.json
4. Verify data is restored
```

### Scenario 3: "I need to restore from 2 weeks ago"
**Timeline: 14 days ago**

```bash
# Use GitHub Actions backup (if available)
1. Go to Actions → Database Backup
2. Find backup from 14 days ago
3. Download artifact
4. npm run restore backup-20260101_020000.json
```

### Scenario 4: "The database is completely corrupted"
**Nuclear option**

```bash
# Restore from most recent backup
1. Download latest GitHub Actions backup
2. npm run restore backup-latest.json

# Or if you have a manual backup:
3. npm run restore backups/last-known-good.json
```

---

## Best Practices

### Before Any Risky Operation

```bash
# ALWAYS create a manual backup first
npm run backup backups/before-$(date +%Y%m%d-%H%M%S).json

# Then proceed with your operation
npx prisma db push
# or
npm run some-migration-script
```

### Regular Backup Checklist

**Daily (Automated):**
- ✅ GitHub Actions runs at 2 AM UTC

**Weekly (Manual):**
- [ ] Download latest GitHub Actions backup as local copy
- [ ] Test restore process with a copy of the database
- [ ] Verify backups are working

**Before Deployments:**
- [ ] Create manual backup: `npm run backup`
- [ ] Document what you're deploying
- [ ] Keep backup for 30 days after deployment

---

## Backup File Formats

### JSON Backup Structure

```json
{
  "version": "1.0",
  "timestamp": "2026-01-14T19:00:00.000Z",
  "data": {
    "globalState": [...],
    "albums": [...],
    "users": [...],
    "ratings": [...],
    "listeningNotes": [...]
  },
  "counts": {
    "globalState": 1,
    "albums": 222,
    "users": 5,
    "ratings": 50,
    "listeningNotes": 30
  }
}
```

---

## Troubleshooting

### "GitHub Actions backup failed"
- Check if `NEON_DATABASE_URL` secret is set correctly
- Verify Neon database is accessible
- Check Actions logs for specific error

### "npm run restore isn't working"
- Make sure the JSON file exists
- Check file format is valid JSON
- Ensure `NEON_DATABASE_URL` is in `.env`

### "Neon PITR restore button is greyed out"
- You're beyond the 6-hour window
- Use GitHub Actions backup instead

### "I can't find an old backup"
- GitHub free tier only keeps 90 days
- Artifacts older than 90 days are auto-deleted
- Download and save important backups locally

---

## Commands Reference

```bash
# Manual backups
npm run backup                              # Auto-generated filename
npm run backup backups/my-backup.json      # Custom filename

# Restore
npm run restore backups/my-backup.json     # Restore from file

# Verify backup exists
ls -lh backups/

# Check backup contents
cat backups/my-backup.json | jq '.counts'  # Requires jq installed
```

---

## Emergency Contacts

- **Neon Support**: https://neon.tech/docs/introduction/support
- **GitHub Actions Status**: https://www.githubstatus.com
- **This guide**: `/BACKUP_GUIDE.md`

---

## Summary

You now have **3 layers of protection**:

1. **0-6 hours ago**: Neon PITR (instant, via console)
2. **1-90 days ago**: GitHub Actions (daily automated)
3. **Anytime**: Manual backups (run before risky operations)

**The disaster from earlier would have been prevented by any of these layers.**

Stay safe! 🛡️
