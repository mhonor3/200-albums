import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function exportData() {
  const outputFile = process.argv[2] || `backup-${Date.now()}.json`
  const outputPath = path.isAbsolute(outputFile) ? outputFile : path.join(process.cwd(), outputFile)

  console.log('Exporting database...')

  const [globalState, albums, users, ratings, listeningNotes] = await Promise.all([
    prisma.globalState.findMany(),
    prisma.album.findMany({ orderBy: { position: 'asc' } }),
    prisma.user.findMany({ orderBy: { username: 'asc' } }),
    prisma.rating.findMany({ orderBy: [{ userId: 'asc' }, { albumId: 'asc' }] }),
    prisma.listeningNote.findMany({ orderBy: [{ userId: 'asc' }, { albumId: 'asc' }] })
  ])

  const backup = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    data: {
      globalState,
      albums,
      users,
      ratings,
      listeningNotes
    },
    counts: {
      globalState: globalState.length,
      albums: albums.length,
      users: users.length,
      ratings: ratings.length,
      listeningNotes: listeningNotes.length
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(backup, null, 2))

  console.log(`\n✓ Export complete: ${outputPath}`)
  console.log(`\nCounts:`)
  console.log(`  - GlobalState: ${backup.counts.globalState}`)
  console.log(`  - Albums: ${backup.counts.albums}`)
  console.log(`  - Users: ${backup.counts.users}`)
  console.log(`  - Ratings: ${backup.counts.ratings}`)
  console.log(`  - Listening Notes: ${backup.counts.listeningNotes}`)
  console.log(`\nFile size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`)

  await prisma.$disconnect()
}

exportData().catch((error) => {
  console.error('Export failed:', error)
  process.exit(1)
})
