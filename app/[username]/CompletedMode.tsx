import Link from 'next/link'

interface CompletedModeProps {
  username: string
}

export default function CompletedMode({ username }: CompletedModeProps) {
  return (
    <div className="text-center py-16">
      <div className="mb-8">
        <svg
          className="mx-auto h-24 w-24 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <h1 className="text-4xl font-bold mb-4">Journey Complete!</h1>
      <p className="text-xl text-gray-600 mb-8">
        You&apos;ve experienced all the albums. Amazing work!
      </p>

      <div className="flex gap-4 justify-center">
        <Link
          href={`/${username}/history`}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          View Your History
        </Link>
        <Link
          href={`/${username}/stats`}
          className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition font-medium"
        >
          View Your Stats
        </Link>
      </div>
    </div>
  )
}
