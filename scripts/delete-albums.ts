import { PrismaClient } from '@prisma/client'
import * as readline from 'readline'

const prisma = new PrismaClient()

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) =>
    rl.question(query, (answer) => {
      rl.close()
      resolve(answer)
    })
  )
}

async function main() {
  const albumPositions = process.argv.slice(2).map(Number)

  if (albumPositions.length === 0) {
    console.log('Usage: npm run delete-albums <position1> <position2> ...')
    console.log('Example: npm run delete-albums 150 151 152')
    console.log('\nThis will delete unreleased albums at the specified positions')
    return
  }

  console.log(`Looking up albums at positions: ${albumPositions.join(', ')}\n`)

  // Get albums to delete
  const albumsToDelete = await prisma.album.findMany({
    where: {
      position: { in: albumPositions },
    },
    orderBy: { position: 'asc' },
  })

  if (albumsToDelete.length === 0) {
    console.log('No albums found at the specified positions.')
    return
  }

  if (albumsToDelete.length < albumPositions.length) {
    const foundPositions = albumsToDelete.map((a) => a.position)
    const missingPositions = albumPositions.filter((p) => !foundPositions.includes(p))
    console.log(`Warning: No albums found at positions: ${missingPositions.join(', ')}\n`)
  }

  // Check if any are already released
  const releasedAlbums = albumsToDelete.filter((a) => a.isReleased)
  if (releasedAlbums.length > 0) {
    console.error('ERROR: Cannot delete released albums:\n')
    releasedAlbums.forEach((album) => {
      console.error(`  Position ${album.position}: "${album.title}" by ${album.artist}`)
      console.error(`    Released: ${album.releasedAt?.toLocaleDateString() || 'Unknown'}`)
    })
    console.error('\nOnly unreleased albums can be deleted.')
    return
  }

  // Show albums that will be deleted with full details
  console.log('Albums to be deleted:\n')
  albumsToDelete.forEach((album) => {
    console.log(`  Position ${album.position}:`)
    console.log(`    Title: "${album.title}"`)
    console.log(`    Artist: ${album.artist}`)
    console.log(`    Year: ${album.releaseYear}`)
    console.log(`    Genre: ${album.genre}`)
    console.log(`    Status: UNRELEASED\n`)
  })

  // Ask for confirmation
  const answer = await askQuestion(
    `Are you sure you want to delete ${albumsToDelete.length} album(s)? (yes/no): `
  )

  if (answer.toLowerCase() !== 'yes') {
    console.log('Deletion cancelled.')
    return
  }

  // Delete the albums
  const deleteResult = await prisma.album.deleteMany({
    where: {
      id: { in: albumsToDelete.map((a) => a.id) },
    },
  })

  console.log(`\n✓ Deleted ${deleteResult.count} album(s)`)
  console.log('\nNow run: npm run shuffle-unreleased')
  console.log('This will compact positions and remove gaps.')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
