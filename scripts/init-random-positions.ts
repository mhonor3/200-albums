import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Initializing random positions for albums...')

  // Get all albums
  const albums = await prisma.album.findMany({
    orderBy: { position: 'asc' },
  })

  if (albums.length === 0) {
    console.log('No albums found.')
    return
  }

  // Create array of positions 1 to N (each number appears exactly once)
  const positions = Array.from({ length: albums.length }, (_, i) => i + 1)

  // Shuffle using Fisher-Yates algorithm
  // This ensures a random permutation where each position appears exactly once
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[positions[i], positions[j]] = [positions[j], positions[i]]
  }

  console.log(`Setting random positions for ${albums.length} albums...`)
  console.log('Each album will get a unique randomPosition from 1 to', albums.length)

  // Assign each album one of the shuffled positions
  // Since positions array has exactly N unique values (1 to N),
  // and we have N albums, each album gets exactly one unique position
  await prisma.$transaction(
    albums.map((album, index) =>
      prisma.album.update({
        where: { id: album.id },
        data: { randomPosition: positions[index] },
      })
    )
  )

  console.log('✓ Random positions initialized successfully!')

  // Verify no duplicates
  const check = await prisma.album.groupBy({
    by: ['randomPosition'],
    _count: true,
  })

  const duplicates = check.filter(g => g._count > 1)
  if (duplicates.length > 0) {
    console.error('ERROR: Found duplicate randomPositions!', duplicates)
  } else {
    console.log('✓ Verified: All random positions are unique')
  }

  console.log('\nFirst 10 albums in random generation order:')
  const randomOrder = await prisma.album.findMany({
    take: 10,
    orderBy: { randomPosition: 'asc' },
    select: {
      position: true,
      randomPosition: true,
      artist: true,
      title: true,
    },
  })

  randomOrder.forEach((album) => {
    console.log(`  Day ${album.randomPosition}: ${album.artist} - ${album.title}`)
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
