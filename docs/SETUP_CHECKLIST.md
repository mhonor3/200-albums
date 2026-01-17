# Complete Setup Checklist

Follow these steps to enable the full backup and CI/CD system.

## ✅ Already Completed

- [x] Migrated to Neon PostgreSQL
- [x] Updated Prisma schema to use NEON_DATABASE_URL
- [x] Imported 222 albums
- [x] Initialized first album
- [x] Created backup/restore scripts
- [x] Set up GitHub Actions backup workflow
- [x] Set up GitHub Actions Neon branching workflow
- [x] Committed all code to Git

---

## 🔧 Required Setup Steps

### 1. GitHub Secrets & Variables

#### Add to GitHub Secrets:
Go to: https://github.com/mhonor3/200-albums/settings/secrets/actions

**Secrets (encrypted):**
- [ ] `NEON_DATABASE_URL`
  - Value: `***`
  - Used by: Daily backup workflow

- [ ] `NEON_API_KEY`
  - Get from: https://console.neon.tech → Account Settings → API Keys → Generate New Key
  - Used by: PR branching workflow

**Variables (not encrypted):**
Go to: https://github.com/mhonor3/200-albums/settings/variables/actions

- [ ] `NEON_PROJECT_ID`
  - Get from: Neon console URL `https://console.neon.tech/app/projects/YOUR_PROJECT_ID`
  - Or from: Project Settings → General
  - Used by: PR branching workflow

### 2. Vercel Environment Variables

Go to: https://vercel.com/mhonor3/200-albums/settings/environment-variables

**Already set (via Neon integration):**
- [x] `NEON_DATABASE_URL` - Production & Preview

**Verify it's correct:**
- Production: Points to Neon `main` branch
- Preview: Auto-set by Neon integration for PR branches

### 3. Test the Workflows

#### Test Backup Workflow:
- [ ] Go to: https://github.com/mhonor3/200-albums/actions/workflows/backup-database.yml
- [ ] Click "Run workflow"
- [ ] Select branch: `main`
- [ ] Click "Run workflow"
- [ ] Wait ~1-2 minutes
- [ ] Verify backup artifact is created
- [ ] Download and inspect the JSON file

#### Test PR Branching Workflow:
- [ ] Create test branch: `git checkout -b test/neon-workflow`
- [ ] Make a small change: `echo "# Test" >> test.md`
- [ ] Commit and push: `git add test.md && git commit -m "Test" && git push origin test/neon-workflow`
- [ ] Create PR on GitHub
- [ ] Verify:
  - [ ] GitHub Action runs successfully
  - [ ] Neon branch is created (check Neon console → Branches)
  - [ ] Schema diff comment appears on PR
  - [ ] Vercel preview deployment uses PR database
- [ ] Close PR (don't merge)
- [ ] Verify Neon branch is deleted automatically

---

## 🎯 Optional: Enhanced Setup

### Create Dev Branch for Local Development

- [ ] Follow: [scripts/setup-dev-branch.md](../scripts/setup-dev-branch.md)
- [ ] Create `dev` branch in Neon
- [ ] Update local `.env` to use dev branch
- [ ] Test local development

### Set Up Git Branch Strategy

- [ ] Create `dev` branch in Git
  ```bash
  git checkout -b dev
  git push origin dev
  ```
- [ ] Set branch protection rules:
  - Require PR for `main`
  - Require status checks to pass

### Enable Schema Diff Notifications

Already enabled in the workflow! Will post schema changes as PR comments.

---

## 📚 Documentation Reference

Quick links to guides:

- **Backup & Recovery**: [docs/BACKUP_GUIDE.md](./BACKUP_GUIDE.md)
- **Neon Branching**: [docs/NEON_BRANCHING_GUIDE.md](./NEON_BRANCHING_GUIDE.md)
- **CI/CD Setup**: [docs/CI_CD_SETUP.md](./CI_CD_SETUP.md)
- **Dev Branch Setup**: [scripts/setup-dev-branch.md](../scripts/setup-dev-branch.md)

---

## 🧪 Testing Checklist

### Test Backup System:

- [ ] Create manual backup: `npm run backup test-backup.json`
- [ ] Verify file created and contains data
- [ ] Test restore: `npm run restore test-backup.json`
- [ ] Verify data restored correctly
- [ ] Delete test backup: `rm test-backup.json`

### Test Neon PITR:

- [ ] Make a small change in Neon console (add test user)
- [ ] Note the timestamp
- [ ] Go to Neon console → Restore
- [ ] Restore to timestamp before change
- [ ] Verify change is undone

### Test PR Database Branching:

- [ ] Create feature branch with schema change
- [ ] Push and create PR
- [ ] Verify new database branch created
- [ ] Verify Vercel preview uses PR database
- [ ] Test schema change on preview
- [ ] Merge or close PR
- [ ] Verify database branch deleted

---

## 🚨 Critical Reminders

### Before ANY Database Operation:

```bash
# ALWAYS create backup first
npm run backup backups/before-$(date +%Y%m%d-%H%M%S).json
```

### Before Deploying Schema Changes:

1. Test on feature branch first
2. Verify on preview deployment
3. Create backup: `npm run backup`
4. Apply to production
5. Verify in production

### Weekly Maintenance:

- [ ] Check GitHub Actions backups are running
- [ ] Download one backup as local copy
- [ ] Verify Neon PITR is available (check console)
- [ ] Review and delete old Neon branches (if any stuck)

---

## 🎉 Success Criteria

You'll know everything is working when:

- [x] Daily backups appear in GitHub Actions artifacts
- [x] Can restore from backup successfully
- [x] PRs automatically create isolated databases
- [x] Schema changes post diff comments
- [x] PR databases auto-delete on close
- [x] Vercel previews use correct database branches
- [x] Production database is never touched during development

---

## 🆘 Need Help?

If something isn't working:

1. Check the specific guide for that feature
2. Verify all secrets/variables are set correctly
3. Check GitHub Actions logs for errors
4. Check Neon console for branch status
5. Check Vercel deployment logs

**Troubleshooting guides:**
- Backups: [docs/BACKUP_GUIDE.md](./BACKUP_GUIDE.md#troubleshooting)
- CI/CD: [docs/CI_CD_SETUP.md](./CI_CD_SETUP.md#part-9-troubleshooting)
- Branching: [docs/NEON_BRANCHING_GUIDE.md](./NEON_BRANCHING_GUIDE.md#common-issues)

---

**Total setup time: ~30 minutes**

Once complete, you'll have enterprise-grade database management for $0/month! 🎊
