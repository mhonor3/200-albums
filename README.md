# 200 Albums - Daily Album Discovery App

A synchronized daily album discovery app where all users progress through the same album list together, one album per day at midnight UTC.

## Getting Started

### Prerequisites

- Node.js 20.11+
- PostgreSQL database
- Spotify API credentials (for automated Spotify URL fetching)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your database URL and Spotify credentials.

4. Initialize the database:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. Import your album data (see below)

6. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Album Data Import

### CSV Format

Your CSV file should have the following columns:
- `position` - Sequential number (1 to N)
- `artist` - Artist name
- `title` - Album title
- `releaseYear` - Year released
- `genre` - Primary genre
- `imageUrl` - Album cover image URL (from RateYourMusic)
- `rymAlbumUrl` - RateYourMusic album page URL
- `rymArtistUrl` - RateYourMusic artist page URL

Place your CSV file at `public/data/albums.csv`

### Import Script

Run the import script to load albums into the database:
```bash
npm run import-albums
```

### Spotify URL Script

After importing albums, run the Spotify URL fetcher:
```bash
npm run fetch-spotify-urls
```

This will automatically fetch Spotify URLs for all albums based on artist and title.

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Vercel Cron Setup

The app uses Vercel Cron to generate new albums at midnight UTC. The cron job is configured in `vercel.json`.

Make sure to set the `CRON_SECRET` environment variable in Vercel for security.

## Features

- **Daily Album Reveals** - New album at midnight UTC
- **User Progress Tracking** - Each user has their own journey
- **Rating System** - 1-5 stars with text reviews
- **Listening Notes** - Take notes while listening
- **History** - View all past albums and ratings
- **Stats Dashboard** - Progress tracking and analytics
- **Album Browser** - Search and filter all albums
- **Community Ratings** - See other users' ratings after rating yourself
- **Admin Panel** - Pause/unpause global journey

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- Vercel Cron

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── [username]/        # User-specific pages
│   ├── admin/             # Admin panel
│   ├── api/               # API routes
│   ├── browse/            # Album browser
│   └── page.tsx           # Home page
├── components/            # React components
├── lib/                   # Utility functions
├── prisma/               # Database schema
└── public/               # Static assets
```

## License

See LICENSE file for details.
