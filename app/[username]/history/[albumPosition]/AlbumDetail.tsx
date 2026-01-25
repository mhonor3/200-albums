'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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

interface Rating {
  stars: number
  review: string
  createdAt: Date
}

interface CommunityRating {
  stars: number
  review: string
  createdAt: Date
  user: {
    username: string
  }
}

interface CommunityStats {
  average: string
  total: number
  distribution: number[]
}

interface AlbumDetailProps {
  album: Album
  username: string
  userRating: Rating | null
  listeningNote: string
  communityRatings: CommunityRating[]
  communityStats: CommunityStats | null
  canRate: boolean
}

export default function AlbumDetail({
  album,
  username,
  userRating: initialRating,
  listeningNote,
  communityRatings,
  communityStats,
  canRate,
}: AlbumDetailProps) {
  const [isEditing, setIsEditing] = useState(!initialRating && canRate)
  const [stars, setStars] = useState(initialRating?.stars || 0)
  const [review, setReview] = useState(initialRating?.review || listeningNote)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const storageKey = `rating-draft-${username}-${album.position}`

  // Load from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(storageKey)
    if (savedDraft && !initialRating) {
      try {
        const { stars: savedStars, review: savedReview } = JSON.parse(savedDraft)
        setStars(savedStars || 0)
        setReview(savedReview || listeningNote)
      } catch {
        // If parsing fails, use defaults
      }
    }
  }, [storageKey, listeningNote, initialRating])

  // Autosave to localStorage with debounce (only when editing)
  useEffect(() => {
    if (!isEditing) return

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
  }, [stars, review, storageKey, isEditing])

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

      setIsEditing(false)
      setIsSubmitting(false)
      router.refresh()
    } catch (err) {
      setError('Failed to submit rating. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <Link
        href={`/${username}/history`}
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        ← Back to History
      </Link>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div>
          <AlbumCard album={album} />
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">
            {isEditing ? 'Rate This Album' : 'Your Rating'}
          </h2>

          {isEditing ? (
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
              </div>

              {error && <div className="text-red-600 text-sm">{error}</div>}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Rating'}
                </button>
                {initialRating && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false)
                      setStars(initialRating.stars)
                      setReview(initialRating.review)
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Rating
                </label>
                <StarRating value={stars} onChange={() => {}} readonly />
              </div>

              {review && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Review
                  </label>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{review}</p>
                  </div>
                </div>
              )}

              <button
                onClick={() => setIsEditing(true)}
                className="w-full bg-gray-700 text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition font-medium"
              >
                Edit Rating
              </button>
            </div>
          )}
        </div>
      </div>

      {communityStats && (
        <div className="border-t border-gray-200 pt-12">
          <h2 className="text-2xl font-bold mb-6">Community Ratings</h2>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {communityStats.average}
              </div>
              <div className="text-gray-600">Average Rating</div>
              <div className="mt-2">
                <StarRating
                  value={Math.round(parseFloat(communityStats.average))}
                  onChange={() => {}}
                  readonly
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {communityStats.total}
              </div>
              <div className="text-gray-600">Total Ratings</div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-700 mb-3">Rating Distribution</div>
              <div className="space-y-1">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = communityStats.distribution[star - 1]
                  const percentage = (count / communityStats.total) * 100

                  return (
                    <div key={star} className="flex items-center gap-2 text-sm">
                      <span className="w-8">{star}★</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-gray-600">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {communityRatings.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Other Reviews</h3>
              {communityRatings.map((rating, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Link
                      href={`/${rating.user.username}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {rating.user.username}
                    </Link>
                    <StarRating value={rating.stars} onChange={() => {}} readonly />
                  </div>
                  {rating.review && (
                    <p className="text-gray-700 whitespace-pre-wrap">{rating.review}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No other reviews yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      )}

      {!communityStats && (
        <div className="border-t border-gray-200 pt-12">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-6 text-center">
            <p className="text-blue-800">
              Rate this album to unlock community ratings and reviews!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
