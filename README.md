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

## Album Management

### Initial Setup: Importing Albums

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

**Import Script:**
```bash
npm run import-albums
```

**Fetch Spotify URLs:**
After importing albums, run the Spotify URL fetcher:
```bash
npm run fetch-spotify-urls
```

This will automatically fetch Spotify URLs for all albums based on artist and title.

**Initialize First Album:**
To start the journey with day 1:
```bash
npm run init-first-album
```

### Managing Albums (Add/Delete/Shuffle)

The app uses an `isReleased` flag to track which albums have been released to users. Released albums are **frozen** and cannot be deleted or shuffled. Only unreleased albums can be managed.

#### Adding New Albums

Add new albums from a CSV file:

```bash
npm run add-albums path/to/albums.csv
```

**CSV Format:**
```csv
artist,title,releaseYear,genre
The Beatles,Abbey Road,1969,Rock
Pink Floyd,Dark Side of the Moon,1973,Progressive Rock
```

Optional columns: `imageUrl`, `rymAlbumUrl`, `rymArtistUrl`, `spotifyUrl`

Albums are automatically added to the end of the queue as unreleased.

#### Deleting Albums

Delete unreleased albums by position:

```bash
npm run delete-albums 150 151 152
```

This will:
1. Show full album details (title, artist, year, genre)
2. Ask for confirmation (type "yes" to proceed)
3. Prevent deletion of released albums
4. Delete the specified albums

After deletion, run the shuffle script to compact positions:

```bash
npm run shuffle-unreleased
```

#### Shuffling Album Order

Shuffle unreleased albums and compact positions:

```bash
npm run shuffle-unreleased
```

This will:
- Keep released albums at positions 1-N (unchanged)
- Shuffle unreleased albums starting from position N+1
- Automatically remove gaps from deleted albums
- Uses Fisher-Yates algorithm for true randomization

**Example Workflow:**

```bash
# Add new albums
npm run add-albums new-albums.csv

# Delete unwanted albums
npm run delete-albums 180 181

# Shuffle the order
npm run shuffle-unreleased
```

### Album Release System

- **Released albums** (`isReleased = true`): Frozen at positions 1-N, cannot be modified
- **Unreleased albums** (`isReleased = false`): Can be added, deleted, or shuffled
- **History is preserved**: User ratings and progress are never affected by managing unreleased albums

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
