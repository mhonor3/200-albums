import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Shuffling album order...')

  // Get all albums
  const albums = await prisma.album.findMany({
    orderBy: { position: 'asc' },
  })

  if (albums.length === 0) {
    console.log('No albums found to shuffle.')
    return
  }

  // Shuffle using Fisher-Yates algorithm
  const shuffled = [...albums]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  console.log(`Shuffling ${shuffled.length} albums...`)

  // Step 1: Set all positions to negative temporary values to avoid conflicts
  await prisma.$transaction(
    albums.map((album) =>
      prisma.album.update({
        where: { id: album.id },
        data: { position: -album.id }, // Use negative ID as temporary position
      })
    )
  )

  // Step 2: Update to final shuffled positions
  await prisma.$transaction(
    shuffled.map((album, index) =>
      prisma.album.update({
        where: { id: album.id },
        data: { position: index + 1 },
      })
    )
  )

  console.log('✓ Albums shuffled successfully!')
  console.log('\nFirst 10 albums in new order:')
  const updated = await prisma.album.findMany({
    take: 10,
    orderBy: { position: 'asc' },
    select: {
      position: true,
      artist: true,
      title: true,
    },
  })

  updated.forEach((album) => {
    console.log(`  ${album.position}. ${album.artist} - ${album.title}`)
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
