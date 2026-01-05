# Architecture Overview

This document explains how the 200 Albums app is structured and how its key features work.

## Tech Stack

- **Framework:** Next.js 14+ with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Hosting:** Vercel (recommended)
- **Cron Jobs:** Vercel Cron

## Project Structure

```
200-albums/
├── app/                          # Next.js app directory
│   ├── [username]/              # User-specific pages
│   │   ├── history/            # Album history views
│   │   │   ├── [albumPosition]/ # Individual album detail
│   │   │   ├── HistoryList.tsx
│   │   │   └── page.tsx
│   │   ├── stats/              # User statistics
│   │   │   ├── StatsDisplay.tsx
│   │   │   └── page.tsx
│   │   ├── CompletedMode.tsx   # Journey complete view
│   │   ├── ListeningMode.tsx   # Today's album view
│   │   ├── RatingMode.tsx      # Rating interface
│   │   └── page.tsx            # Main user page
│   ├── admin/                   # Admin panel
│   │   ├── AdminControls.tsx
│   │   └── page.tsx
│   ├── api/                     # API routes
│   │   ├── admin/              # Admin actions
│   │   │   ├── advance-day/
│   │   │   ├── reset-journey/
│   │   │   └── toggle-pause/
│   │   ├── cron/               # Cron job endpoints
│   │   │   └── daily-album/
│   │   ├── listening-note/     # Save listening notes
│   │   └── rate/               # Submit ratings
│   ├── browse/                  # Album browser
│   │   ├── AlbumBrowser.tsx
│   │   └── page.tsx
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
├── components/                  # Reusable components
│   ├── AlbumCard.tsx           # Album display card
│   ├── Navigation.tsx          # User navigation
│   └── StarRating.tsx          # Star rating widget
├── lib/                        # Utilities and helpers
│   ├── prisma.ts              # Prisma client singleton
│   └── utils.ts               # Helper functions
├── prisma/                     # Database
│   └── schema.prisma          # Database schema
├── public/                     # Static assets
│   └── data/                  # Album data
│       └── albums.csv         # Your CSV file (you provide)
├── scripts/                    # Utility scripts
│   ├── fetch-spotify-urls.ts  # Spotify URL fetcher
│   └── import-albums.ts       # CSV importer
└── vercel.json                # Vercel config (cron)
```

## Core Concepts

### 1. Global State Management

The app maintains a single global state that affects all users:

**Database Model:** `GlobalState`
```prisma
model GlobalState {
  id               Int
  currentDay       Int      // Which album (1-N)
  isPaused         Boolean
  journeyStartDate DateTime
}
```

**Key Features:**
- Only one record exists (id: 1)
- `currentDay` determines what album all users see "today"
- `isPaused` stops the daily progression for everyone
- Updated via cron job at midnight UTC

### 2. User Flow States

Each user can be in one of three states:

#### a) Listening Mode
- **When:** User is viewing today's album
- **Features:** Can take notes, but cannot rate yet
- **Next:** Tomorrow, this album becomes ratable

#### b) Rating Mode
- **When:** User has an unrated album from yesterday or earlier
- **Features:** Must rate before accessing current album
- **Blocking:** Cannot see newer albums until rating is submitted

#### c) Completed Mode
- **When:** Journey is complete (all albums released)
- **Features:** View history and stats

### 3. The Blocking Rule

This is the core mechanic that ensures users rate albums:

```typescript
// In getUserCurrentState() - lib/utils.ts
const unratedAlbum = albums.find(album => album.ratings.length === 0)

if (unratedAlbum) {
  // User MUST rate this before continuing
  return { mode: 'rating', album: unratedAlbum }
}

// Otherwise, show current album
return { mode: 'listening', album: todayAlbum }
```

**Example Scenario:**
- Day 1: User sees Album A (listening mode)
- Day 2: Album B generates, but user sees Album A in rating mode
- User rates Album A
- Now user sees Album B (listening mode)

### 4. Database Schema

#### Albums
```prisma
model Album {
  position     Int @unique  // 1 to N
  artist       String
  title        String
  releaseYear  Int
  genre        String
  imageUrl     String?
  spotifyUrl   String?      // Fetched via script
  rymAlbumUrl  String?
  rymArtistUrl String?
}
```

#### Users
```prisma
model User {
  username        String @unique
  currentPosition Int    // Where they are in journey
}
```

#### Ratings
```prisma
model Rating {
  userId   Int
  albumId  Int
  stars    Int    // 1-5
  review   String

  @@unique([userId, albumId])  // One rating per user per album
}
```

#### ListeningNotes
```prisma
model ListeningNote {
  userId   Int
  albumId  Int
  note     String

  @@unique([userId, albumId])
}
```

## Key Workflows

### Daily Album Generation

**Trigger:** Vercel Cron at midnight UTC

**Process:**
1. Cron hits `/api/cron/daily-album`
2. Checks if journey is paused → exit if paused
3. Checks if at end of albums → exit if complete
4. Increments `GlobalState.currentDay` by 1
5. All users now see the new day's album

**Code:** [app/api/cron/daily-album/route.ts](app/api/cron/daily-album/route.ts:17)

### New User Onboarding

**Trigger:** User visits `/{username}` for first time

**Process:**
1. `getOrCreateUser(username)` is called
2. User doesn't exist → create new user
3. Set `currentPosition = globalState.currentDay`
4. User joins at today's album (doesn't see past albums)

**Code:** [lib/utils.ts](lib/utils.ts:10)

### Rating Submission

**Trigger:** User submits rating form

**Process:**
1. POST to `/api/rate`
2. Validate user can rate this album (not today's album)
3. Upsert rating record
4. Update user's `currentPosition` if needed
5. Page refreshes → user sees next album

**Code:** [app/api/rate/route.ts](app/api/rate/route.ts:11)

### Community Ratings Unlock

**Trigger:** User views album detail page

**Process:**
1. Check if user has rated this album
2. If NO → show "Rate to unlock community ratings"
3. If YES → fetch and display:
   - Average community rating
   - Rating distribution
   - Other users' reviews

**Code:** [app/[username]/history/[albumPosition]/page.tsx](app/[username]/history/[albumPosition]/page.tsx:27)

## API Routes

### Public Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/rate` | POST | Submit album rating |
| `/api/listening-note` | POST | Save listening notes |

### Cron Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/cron/daily-album` | GET | Bearer token | Advance to next day |

**Security:** Requires `Authorization: Bearer {CRON_SECRET}` header

### Admin Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/admin/toggle-pause` | POST | Pause/unpause journey |
| `/api/admin/advance-day` | POST | Manually advance day |
| `/api/admin/reset-journey` | POST | Reset to day 1 |

**Note:** In production, add authentication to admin routes!

## Utility Functions

### `getUserCurrentState(username)`
Determines what the user should see:
- Rating mode (unrated album)
- Listening mode (today's album)
- Completed mode (journey done)

**Location:** [lib/utils.ts](lib/utils.ts:83)

### `canRateAlbum(userId, albumPosition)`
Checks if user is allowed to rate an album:
- Must not be today's album
- Must not already be rated

**Location:** [lib/utils.ts](lib/utils.ts:59)

### `getOrCreateUser(username)`
Gets existing user or creates new one at current day

**Location:** [lib/utils.ts](lib/utils.ts:8)

## Data Flow Examples

### Example 1: First-Time User

```
1. User visits /john
2. getOrCreateUser("john")
   → User created with currentPosition = 5 (current global day)
3. getUserCurrentState("john")
   → No ratings exist
   → Album 5 is today's album
   → Returns { mode: 'listening', album: Album#5 }
4. User sees ListeningMode component
```

### Example 2: User Behind on Ratings

```
1. User last rated Album 3
2. Global day is now 7
3. getUserCurrentState("john")
   → Finds Album 4 is unrated
   → Album 4 is from yesterday (< day 7)
   → Returns { mode: 'rating', album: Album#4 }
4. User sees RatingMode component
5. User submits rating
6. Page refreshes
7. getUserCurrentState("john") called again
   → Finds Album 5 is unrated
   → Returns { mode: 'rating', album: Album#5 }
8. Process repeats until caught up to day 7
```

### Example 3: Admin Pauses Journey

```
1. Admin clicks "Pause Journey"
2. POST to /api/admin/toggle-pause
3. GlobalState.isPaused = true
4. Next midnight, cron job runs
5. Checks isPaused → exits without advancing
6. Global day stays the same
7. All users see same album tomorrow
```

## Performance Considerations

### Database Queries

**Optimized Queries:**
- Indexes on: `position`, `userId`, `albumId`
- Compound unique constraints prevent duplicate ratings
- `getUserCurrentState()` uses single query with includes

**Potential Optimizations for Scale:**
- Cache global state in Redis
- Cache community ratings per album
- Use database views for aggregations

### Image Loading

- Uses Next.js `Image` component
- `unoptimized` prop for external images (RYM)
- Consider adding image CDN for better performance

## Security Considerations

### Current Implementation

**Authentication:** None (URL-based usernames)
- Pro: Simple, no signup friction
- Con: Anyone can access any username

**Admin Panel:** No authentication
- ⚠️ **Production:** Add authentication!

### Recommendations for Production

1. **Add Authentication:**
   ```bash
   npm install next-auth
   ```
   - Protect admin routes
   - Optional: protect user routes

2. **Rate Limiting:**
   - Prevent spam ratings
   - Limit API calls per IP

3. **Input Validation:**
   - Sanitize username input
   - Validate rating data

4. **CSRF Protection:**
   - Add CSRF tokens to forms
   - Use Next.js API route patterns

## Extending the App

### Adding New Features

**Example: Add favorite albums**

1. Update schema:
```prisma
model Favorite {
  userId   Int
  albumId  Int
  @@unique([userId, albumId])
}
```

2. Run migration:
```bash
npx prisma migrate dev --name add_favorites
```

3. Create API route:
```typescript
// app/api/favorite/route.ts
export async function POST(request) {
  // Toggle favorite
}
```

4. Add UI component:
```typescript
// components/FavoriteButton.tsx
export default function FavoriteButton() {
  // Heart icon that toggles favorite
}
```

### Customizing the Design

**Colors:** Edit [tailwind.config.ts](tailwind.config.ts:7)
```typescript
theme: {
  extend: {
    colors: {
      primary: '#yourcolor',
    }
  }
}
```

**Fonts:** Update [app/layout.tsx](app/layout.tsx:1)
```typescript
import { YourFont } from 'next/font/google'
```

**Logo:** Replace in [app/page.tsx](app/page.tsx:7)

## Deployment Checklist

- [ ] Set environment variables in Vercel
- [ ] Import albums to production database
- [ ] Fetch Spotify URLs for production
- [ ] Test cron job (check logs after midnight UTC)
- [ ] Add authentication to admin panel
- [ ] Set up monitoring/error tracking
- [ ] Configure custom domain
- [ ] Test all user flows
- [ ] Create your first user account
- [ ] Announce to your community!

## Troubleshooting Guide

**Issue:** Cron not advancing days

**Solutions:**
- Check Vercel function logs
- Verify `CRON_SECRET` matches in Vercel
- Ensure journey isn't paused

---

**Issue:** Ratings not showing in community view

**Solutions:**
- Ensure user has rated the album first
- Check database for rating records
- Verify API route returns data

---

**Issue:** Images not loading

**Solutions:**
- Verify image URLs are accessible
- Check Next.js `remotePatterns` in config
- Ensure RYM allows hotlinking

## Further Reading

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Tailwind CSS](https://tailwindcss.com/docs)
