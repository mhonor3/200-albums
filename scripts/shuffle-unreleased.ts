import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Processing unreleased albums...')

  // Get count of released albums to know where unreleased should start
  const releasedCount = await prisma.album.count({
    where: { isReleased: true },
  })

  // Get all unreleased albums
  const unreleasedAlbums = await prisma.album.findMany({
    where: { isReleased: false },
    orderBy: { position: 'asc' },
  })

  if (unreleasedAlbums.length === 0) {
    console.log('No unreleased albums to shuffle.')
    return
  }

  console.log(`Found ${releasedCount} released and ${unreleasedAlbums.length} unreleased albums`)

  // Unreleased albums should fill positions starting right after released albums
  // This automatically compacts/removes any gaps from deletions
  const startPosition = releasedCount + 1

  // Create sequential positions for unreleased albums
  const positions = Array.from(
    { length: unreleasedAlbums.length },
    (_, i) => startPosition + i
  )

  // Shuffle using Fisher-Yates algorithm
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[positions[i], positions[j]] = [positions[j], positions[i]]
  }

  console.log('Compacting and shuffling unreleased albums...')

  // Step 1: Set all positions to negative temporary values to avoid unique constraint conflicts
  await prisma.$transaction(
    unreleasedAlbums.map((album) =>
      prisma.album.update({
        where: { id: album.id },
        data: { position: -album.id },
      })
    )
  )

  // Step 2: Update to final shuffled positions
  await prisma.$transaction(
    unreleasedAlbums.map((album, index) =>
      prisma.album.update({
        where: { id: album.id },
        data: { position: positions[index] },
      })
    )
  )

  console.log('✓ Unreleased albums shuffled successfully!')

  // Verify no duplicates
  const check = await prisma.album.groupBy({
    by: ['position'],
    _count: true,
  })

  const duplicates = check.filter((g) => g._count > 1)
  if (duplicates.length > 0) {
    console.error('ERROR: Found duplicate positions!', duplicates)
  } else {
    console.log('✓ Verified: All positions are unique')
  }

  console.log('\nFirst 10 albums in new generation order:')
  const newOrder = await prisma.album.findMany({
    take: 10,
    orderBy: { position: 'asc' },
    select: {
      position: true,
      isReleased: true,
      artist: true,
      title: true,
    },
  })

  newOrder.forEach((album) => {
    const status = album.isReleased ? '[RELEASED]' : '[UNRELEASED]'
    console.log(`  Position ${album.position} ${status}: ${album.artist} - ${album.title}`)
  })
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
