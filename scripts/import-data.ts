import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function importData() {
  const inputFile = process.argv[2]

  if (!inputFile) {
    console.error('Usage: npm run import-data <backup-file.json>')
    console.error('Example: npm run import-data backup-20260114.json')
    process.exit(1)
  }

  const inputPath = path.isAbsolute(inputFile) ? inputFile : path.join(process.cwd(), inputFile)

  if (!fs.existsSync(inputPath)) {
    console.error(`Error: File not found: ${inputPath}`)
    process.exit(1)
  }

  console.log(`\n⚠️  WARNING: This will DELETE all existing data!`)
  console.log(`Importing from: ${inputPath}`)

  const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'))

  console.log(`\nBackup info:`)
  console.log(`  Version: ${data.version}`)
  console.log(`  Created: ${data.timestamp}`)
  console.log(`\nData to import:`)
  console.log(`  - GlobalState: ${data.counts?.globalState || data.data.globalState.length}`)
  console.log(`  - Albums: ${data.counts?.albums || data.data.albums.length}`)
  console.log(`  - Users: ${data.counts?.users || data.data.users.length}`)
  console.log(`  - Ratings: ${data.counts?.ratings || data.data.ratings.length}`)
  console.log(`  - Listening Notes: ${data.counts?.listeningNotes || data.data.listeningNotes.length}`)

  console.log(`\nPress Ctrl+C to cancel, or wait 5 seconds to continue...`)

  await new Promise(resolve => setTimeout(resolve, 5000))

  console.log('\nStarting import...')

  try {
    await prisma.$transaction(async (tx) => {
      // Delete in reverse order of dependencies
      console.log('Deleting existing data...')
      await tx.listeningNote.deleteMany()
      await tx.rating.deleteMany()
      await tx.user.deleteMany()
      await tx.album.deleteMany()
      await tx.globalState.deleteMany()

      // Import in order
      console.log('Importing GlobalState...')
      if (data.data.globalState?.length) {
        await tx.globalState.createMany({
          data: data.data.globalState,
          skipDuplicates: true
        })
      }

      console.log('Importing Albums...')
      if (data.data.albums?.length) {
        await tx.album.createMany({
          data: data.data.albums,
          skipDuplicates: true
        })
      }

      console.log('Importing Users...')
      if (data.data.users?.length) {
        await tx.user.createMany({
          data: data.data.users,
          skipDuplicates: true
        })
      }

      console.log('Importing Ratings...')
      if (data.data.ratings?.length) {
        await tx.rating.createMany({
          data: data.data.ratings,
          skipDuplicates: true
        })
      }

      console.log('Importing Listening Notes...')
      if (data.data.listeningNotes?.length) {
        await tx.listeningNote.createMany({
          data: data.data.listeningNotes,
          skipDuplicates: true
        })
      }
    })

    console.log('\n✓ Import complete!')
  } catch (error) {
    console.error('\n✗ Import failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

importData()
