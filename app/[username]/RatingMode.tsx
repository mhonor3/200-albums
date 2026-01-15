'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import AlbumCard from '@/components/AlbumCard'
import StarRating from '@/components/StarRating'

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

interface RatingModeProps {
  username: string
  album: Album
  listeningNote: string
}

export default function RatingMode({ username, album, listeningNote }: RatingModeProps) {
  const [stars, setStars] = useState<number>(0)
  const [review, setReview] = useState<string>(listeningNote)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const storageKey = `rating-draft-${username}-${album.position}`

  // Load from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(storageKey)
    if (savedDraft) {
      try {
        const { stars: savedStars, review: savedReview } = JSON.parse(savedDraft)
        setStars(savedStars || 0)
        setReview(savedReview || listeningNote)
      } catch {
        // If parsing fails, use defaults
        setReview(listeningNote)
      }
    }
  }, [storageKey, listeningNote])

  // Autosave to localStorage with debounce
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify({ stars, review }))
    }, 1000)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [stars, review, storageKey])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (stars === 0) {
      setError('Please select a star rating')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          albumPosition: album.position,
          stars,
          review,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit rating')
      }

      // Clear localStorage after successful submission
      localStorage.removeItem(storageKey)

      // Refresh the page to show next album
      router.refresh()
    } catch (err) {
      setError('Failed to submit rating. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleSkip = async () => {
    setIsSkipping(true)
    setError(null)

    try {
      const response = await fetch('/api/skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })

      if (!response.ok) {
        throw new Error('Failed to skip album')
      }

      // Clear localStorage after successful skip
      localStorage.removeItem(storageKey)
      setIsSkipping(false)

      // Refresh the page to show today's album
      router.refresh()
    } catch (err) {
      setError('Failed to skip album. Please try again.')
      setIsSkipping(false)
    }
  }

  return (
    <div>
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Rate this album to continue
            </h3>
            <p className="mt-1 text-sm text-yellow-700">
              You need to rate yesterday&apos;s album before you can access today&apos;s album.
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <AlbumCard album={album} />
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">Rate This Album</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Rating
              </label>
              <StarRating value={stars} onChange={setStars} />
              {error && stars === 0 && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
              )}
            </div>

            <div>
              <label htmlFor="review" className="block text-sm font-medium text-gray-700 mb-2">
                Review (optional)
              </label>
              <textarea
                id="review"
                rows={6}
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share your thoughts about this album..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                Auto-saved locally. Your listening notes are pre-filled here. Feel free to edit or expand.
              </p>
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isSubmitting || isSkipping}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Rating'}
              </button>

              <button
                type="button"
                onClick={handleSkip}
                disabled={isSubmitting || isSkipping}
                className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition font-medium"
              >
                {isSkipping ? 'Skipping...' : 'Did Not Listen - Skip for Now'}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Skipped albums will appear in your history and can be rated later
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
