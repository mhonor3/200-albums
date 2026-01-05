import { getUserCurrentState } from '@/lib/utils'
import Navigation from '@/components/Navigation'
import RatingMode from './RatingMode'
import ListeningMode from './ListeningMode'
import CompletedMode from './CompletedMode'
import { notFound } from 'next/navigation'

export default async function UserPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params

  // Block system file requests (favicon, apple-touch-icon, etc.)
  const systemFilePattern = /\.(ico|png|jpg|jpeg|svg|xml|txt|webmanifest)$/i
  if (systemFilePattern.test(username)) {
    notFound()
  }

  // Block known system paths
  const invalidUsernames = ['favicon', 'apple-touch-icon', 'robots', 'sitemap', 'manifest']
  if (invalidUsernames.some((invalid) => username.toLowerCase().startsWith(invalid))) {
    notFound()
  }

  // Validate username format (alphanumeric, hyphens, underscores only)
  const validUsernamePattern = /^[a-z0-9_-]+$/i
  if (!validUsernamePattern.test(username)) {
    notFound()
  }

  const state = await getUserCurrentState(username)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation username={username} currentPage="current" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {state.mode === 'rating' && state.album && (
          <RatingMode
            username={username}
            album={state.album}
            listeningNote={state.listeningNote}
          />
        )}

        {state.mode === 'listening' && state.album && (
          <ListeningMode
            username={username}
            album={state.album}
            listeningNote={state.listeningNote}
            globalDay={state.globalState.currentDay}
          />
        )}

        {state.mode === 'completed' && (
          <CompletedMode username={username} />
        )}
      </main>
    </div>
  )
}
