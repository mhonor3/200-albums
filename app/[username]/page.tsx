import { getUserCurrentState } from '@/lib/utils'
import Navigation from '@/components/Navigation'
import RatingMode from './RatingMode'
import ListeningMode from './ListeningMode'
import CompletedMode from './CompletedMode'

export default async function UserPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const state = await getUserCurrentState(username)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation username={username} currentPage="current" />

      <main className="max-w-4xl mx-auto px-4 py-8">
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
