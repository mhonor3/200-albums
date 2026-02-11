'use client'

interface StatsDisplayProps {
  username: string
  totalAlbums: number
  currentDay: number
  ratedCount: number
  averageRating: number
  starDistribution: number[]
  topGenres: Array<{ genre: string; averageRating: number; count: number }>
  progressPercentage: number
  daysRemaining: number
  estimatedCompletion: string | null
  isPaused: boolean
}

export default function StatsDisplay({
  username,
  totalAlbums,
  currentDay,
  ratedCount,
  averageRating,
  starDistribution,
  topGenres,
  progressPercentage,
  daysRemaining,
  estimatedCompletion,
  isPaused,
}: StatsDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Journey Progress</h2>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Album {currentDay} of {totalAlbums}</span>
            <span>{progressPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{currentDay}</div>
            <div className="text-sm text-gray-600">Current Day</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{ratedCount}</div>
            <div className="text-sm text-gray-600">Albums Rated</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{daysRemaining}</div>
            <div className="text-sm text-gray-600">Days Remaining</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              {estimatedCompletion ? '📅' : isPaused ? '⏸️' : '🏁'}
            </div>
            <div className="text-sm text-gray-600">
              {isPaused ? 'Paused' : estimatedCompletion ? estimatedCompletion : 'Complete!'}
            </div>
          </div>
        </div>
      </div>

      {/* Rating Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Rating Statistics</h2>

          <div className="text-center mb-6">
            <div className="text-5xl font-bold text-yellow-500 mb-2">
              {averageRating.toFixed(2)}
            </div>
            <div className="text-gray-600">Average Rating</div>
            <div className="flex justify-center mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-2xl ${
                    star <= Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 mb-3">Star Distribution</div>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = starDistribution[star - 1]
              const percentage = ratedCount > 0 ? (count / ratedCount) * 100 : 0

              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="w-12 text-sm">{star} ★</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6">
                    <div
                      className="bg-yellow-400 h-6 rounded-full flex items-center justify-end px-2 text-xs font-medium text-gray-800 transition-all"
                      style={{ width: `${percentage}%` }}
                    >
                      {count > 0 && count}
                    </div>
                  </div>
                  <span className="w-12 text-right text-sm text-gray-600">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Top Rated Genres</h2>

          {topGenres.length > 0 ? (
            <div className="space-y-4">
              {topGenres.map(({ genre, averageRating, count }, index) => {
                const percentage = (averageRating / 5) * 100

                return (
                  <div key={genre}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-700">
                        {index + 1}. {genre}
                      </span>
                      <span className="text-sm text-gray-600">
                        {averageRating.toFixed(2)} ★ ({count} albums)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Start rating albums to see your top genres!</p>
            </div>
          )}
        </div>
      </div>

      {/* Milestone Badges */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Milestones</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            className={`text-center p-4 rounded-lg ${
              ratedCount >= 1 ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-50'
            }`}
          >
            <div className="text-3xl mb-2">🎵</div>
            <div className="font-medium text-sm">First Rating</div>
            <div className="text-xs text-gray-600">{ratedCount >= 1 ? 'Complete!' : 'Locked'}</div>
          </div>

          <div
            className={`text-center p-4 rounded-lg ${
              ratedCount >= 10 ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-50'
            }`}
          >
            <div className="text-3xl mb-2">🎸</div>
            <div className="font-medium text-sm">10 Albums</div>
            <div className="text-xs text-gray-600">{ratedCount >= 10 ? 'Complete!' : `${ratedCount}/10`}</div>
          </div>

          <div
            className={`text-center p-4 rounded-lg ${
              ratedCount >= 50 ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-50'
            }`}
          >
            <div className="text-3xl mb-2">🎹</div>
            <div className="font-medium text-sm">50 Albums</div>
            <div className="text-xs text-gray-600">{ratedCount >= 50 ? 'Complete!' : `${ratedCount}/50`}</div>
          </div>

          <div
            className={`text-center p-4 rounded-lg ${
              ratedCount >= 100 ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-50'
            }`}
          >
            <div className="text-3xl mb-2">🏆</div>
            <div className="font-medium text-sm">100 Albums</div>
            <div className="text-xs text-gray-600">{ratedCount >= 100 ? 'Complete!' : `${ratedCount}/100`}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
