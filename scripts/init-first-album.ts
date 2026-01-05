import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Get global state to use its journeyStartDate
  const globalState = await prisma.globalState.findUnique({
    where: { id: 1 },
  })

  if (!globalState) {
    console.log('Global state not found. Run the app first to initialize it.')
    return
  }

  // Set releasedAt for the first album to the journey start date
  const updated = await prisma.album.update({
    where: { position: 1 },
    data: {
      releasedAt: globalState.journeyStartDate,
    },
  })

  console.log(`✓ Set releasedAt for album #1: ${updated.artist} - ${updated.title}`)
  console.log(`  Released at: ${updated.releasedAt}`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
