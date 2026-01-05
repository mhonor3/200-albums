import Link from 'next/link'

interface NavigationProps {
  username: string
  currentPage?: 'current' | 'history' | 'stats'
}

export default function Navigation({ username, currentPage = 'current' }: NavigationProps) {
  return (
    <nav className="bg-white shadow-sm mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              200 Albums
            </Link>
            <span className="ml-3 text-gray-500">/ {username}</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href={`/${username}`}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                currentPage === 'current'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Current
            </Link>
            <Link
              href={`/${username}/history`}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                currentPage === 'history'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              History
            </Link>
            <Link
              href={`/${username}/stats`}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                currentPage === 'stats'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Stats
            </Link>
            <Link
              href="/"
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-300"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
