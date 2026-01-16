'use client'

import Link from 'next/link'

export default function Home() {
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
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const username = (e.target as HTMLInputElement).value.trim().toLowerCase()
                  if (username) {
                    window.location.href = `/${username}`
                  }
                }
              }}
            />
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
    </main>
  )
}
