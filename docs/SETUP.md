# 200 Albums - Setup Guide

This guide will walk you through setting up your album discovery app from scratch.

## Prerequisites

- Node.js 20.11 or higher
- PostgreSQL database (local or hosted)
- Spotify Developer Account (for automated Spotify URL fetching)
- Your album data CSV file

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure:

### Database Connection

For **local PostgreSQL**:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/albums?schema=public"
```

For **Vercel Postgres** (recommended for deployment):
1. Create a Vercel Postgres database in your Vercel dashboard
2. Copy the `DATABASE_URL` from Vercel and paste it into `.env`

### Spotify API Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Copy Client ID and Client Secret to `.env`:

```env
SPOTIFY_CLIENT_ID="your_client_id_here"
SPOTIFY_CLIENT_SECRET="your_client_secret_here"
```

### Cron Secret

Generate a random secret for securing the cron endpoint:

```env
CRON_SECRET="your_random_secret_here"
```

You can generate one with:
```bash
openssl rand -base64 32
```

## Step 3: Prepare Your Album Data

Place your CSV file at: `public/data/albums.csv`

### Required CSV Format

Your CSV must have these columns (in any order):

```csv
position,artist,title,releaseYear,genre,imageUrl,rymAlbumUrl,rymArtistUrl
1,The Beatles,Abbey Road,1969,Rock,https://e.snmc.io/...,https://rateyourmusic.com/...,https://rateyourmusic.com/...
```

**Column Descriptions:**
- `position` - Sequential number (1, 2, 3, ...)
- `artist` - Artist name
- `title` - Album title
- `releaseYear` - Year released (e.g., 1969)
- `genre` - Primary genre
- `imageUrl` - Album cover image URL (from RateYourMusic)
- `rymAlbumUrl` - RateYourMusic album page URL
- `rymArtistUrl` - RateYourMusic artist page URL

**Note:** Spotify URLs will be added automatically in the next step.

## Step 4: Initialize Database

Run Prisma migrations to create database tables:

```bash
npx prisma migrate dev --name init
```

This will:
- Create all necessary tables
- Generate Prisma Client

## Step 5: Import Album Data

Import your CSV file into the database:

```bash
npm run import-albums
```

This script will:
- Read your CSV file
- Clear any existing albums
- Import all albums into the database
- Initialize global state (starting at day 1)

## Step 6: Fetch Spotify URLs (Optional but Recommended)

Automatically fetch Spotify URLs for all albums:

```bash
npm run fetch-spotify-urls
```

This will:
- Use the Spotify API to search for each album
- Update albums with matching Spotify URLs
- Rate-limited to avoid API throttling

**Note:** Some albums may not be found on Spotify. That's okay - users can still see all other information.

## Step 7: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app!

## Step 8: Test the App

1. Visit the home page
2. Enter a username (e.g., "john")
3. You should see Album #1 in "Listening Mode"
4. Test the different features:
   - Add listening notes
   - View history (will be empty at first)
   - Check stats
   - Browse albums
   - Visit admin panel

## Step 9: Deploy to Vercel

### Quick Deploy

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel dashboard:
   - `DATABASE_URL` (from Vercel Postgres)
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
   - `CRON_SECRET`
5. Deploy!

### Vercel Cron Setup

The cron job is already configured in `vercel.json`. It will automatically:
- Run every day at midnight UTC
- Advance the global album day
- No additional setup needed!

### Post-Deployment

After deploying to Vercel:

1. Import your albums again (Vercel Postgres is a separate database):
   ```bash
   # In your local terminal with DATABASE_URL pointing to Vercel Postgres
   npm run import-albums
   npm run fetch-spotify-urls
   ```

2. Or use Vercel's terminal in the dashboard

## Troubleshooting

### Database Connection Issues

**Error:** "Can't reach database server"

Solution:
- Check your `DATABASE_URL` is correct
- Ensure PostgreSQL is running (if local)
- Check firewall settings

### Prisma Client Not Found

**Error:** "Cannot find module '@prisma/client'"

Solution:
```bash
npx prisma generate
```

### CSV Import Fails

**Error:** "CSV file not found"

Solution:
- Ensure file is at `public/data/albums.csv`
- Check file permissions

### Spotify API Errors

**Error:** "Failed to get Spotify access token"

Solution:
- Verify `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are correct
- Check your Spotify app is active in the dashboard

## Advanced Configuration

### Changing the Journey Start Date

In the admin panel, you can reset the journey to day 1, which will update the start date.

### Manual Database Operations

View your data with Prisma Studio:
```bash
npx prisma studio
```

### Custom Cron Schedule

Edit `vercel.json` to change when albums advance:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-album",
      "schedule": "0 0 * * *"  // Midnight UTC (default)
    }
  ]
}
```

Schedule format: `minute hour day month dayOfWeek`

Examples:
- `0 12 * * *` - Noon UTC
- `0 0 * * 1` - Midnight every Monday
- `0 6 * * *` - 6 AM UTC

## Next Steps

1. Customize the design in `app/globals.css` and component files
2. Add your own branding
3. Invite users to start their journey!
4. Monitor progress in the admin panel

## Support

For issues or questions:
- Check [README.md](README.md) for project overview
- Review [README-requirements.md](README-requirements.md) for detailed specs
- Open an issue on GitHub

Enjoy your album discovery journey!
