'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  const validUsernamePattern = /^[a-z0-9_-]+$/i

  const handleSubmit = async () => {
    const normalized = username.trim().toLowerCase()
    setError(null)

    if (!normalized) return

    if (!validUsernamePattern.test(normalized)) {
      setError('Username can only contain letters, numbers, hyphens, and underscores')
      return
    }

    setIsChecking(true)
    try {
      const res = await fetch(`/api/user/check?username=${encodeURIComponent(normalized)}`)
      const data = await res.json()

      if (data.exists) {
        window.location.href = `/${normalized}`
      } else {
        setShowConfirm(true)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsChecking(false)
    }
  }

  const handleConfirmCreate = () => {
    window.location.href = `/${username.trim().toLowerCase()}`
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-12 md:p-24">
      <div className="max-w-2xl w-full text-center px-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6">200 Albums</h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8">
          A daily album discovery journey
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Enter your username to start:
            </label>
            <input
              type="text"
              id="username"
              placeholder="e.g. john"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit()
                }
              }}
              disabled={isChecking}
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>

          <div className="pt-8 border-t border-gray-200 space-y-2">
            <Link
              href="/browse"
              className="block text-blue-600 hover:text-blue-800 underline"
            >
              Browse All Albums
            </Link>
            <Link
              href="/admin"
              className="block text-gray-500 hover:text-gray-700 text-sm"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h2 className="text-lg font-semibold mb-2">Create new user?</h2>
            <p className="text-gray-600 mb-4">
              No user found with username &ldquo;<strong>{username.trim().toLowerCase()}</strong>&rdquo;.
              Would you like to create a new account?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
