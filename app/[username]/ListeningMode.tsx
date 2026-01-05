'use client'

import { useState, useEffect } from 'react'
import AlbumCard from '@/components/AlbumCard'

interface Album {
  id: number
  position: number
  artist: string
  title: string
  releaseYear: number
  genre: string
  imageUrl: string | null
  spotifyUrl: string | null
  rymAlbumUrl: string | null
}

interface ListeningModeProps {
  username: string
  album: Album
  listeningNote: string
  globalDay: number
}

export default function ListeningMode({
  username,
  album,
  listeningNote: initialNote,
  globalDay,
}: ListeningModeProps) {
  const [note, setNote] = useState(initialNote)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    setNote(initialNote)
  }, [initialNote])

  const saveNote = async () => {
    setIsSaving(true)
    setSaveMessage(null)

    try {
      const response = await fetch('/api/listening-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          albumPosition: album.position,
          note,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save note')
      }

      setSaveMessage('Note saved!')
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (err) {
      setSaveMessage('Failed to save note')
    } finally {
      setIsSaving(false)
    }
  }

  const isToday = album.position === globalDay

  return (
    <div>
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              {isToday ? "Today's Album" : 'Listening Mode'}
            </h3>
            <p className="mt-1 text-sm text-blue-700">
              {isToday
                ? 'Take your time listening. You can rate this album tomorrow!'
                : 'Listen and take notes. Rating will be available soon.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <AlbumCard album={album} />
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">Listening Notes</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                Take notes while you listen
              </label>
              <textarea
                id="note"
                rows={8}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Write down your thoughts, favorite tracks, standout moments..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                These notes will be available when you rate this album tomorrow.
              </p>
            </div>

            <button
              onClick={saveNote}
              disabled={isSaving}
              className="w-full bg-gray-700 text-white py-3 px-4 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
            >
              {isSaving ? 'Saving...' : 'Save Notes'}
            </button>

            {saveMessage && (
              <div
                className={`text-sm text-center ${
                  saveMessage.includes('saved') ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {saveMessage}
              </div>
            )}

            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">What happens next?</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Tomorrow, this album will be available to rate</li>
                <li>• Your notes will be pre-filled in the review field</li>
                <li>• After rating, you&apos;ll see the next album</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
