'use client'

import { useState } from 'react'
import Link from 'next/link'

interface GlobalState {
  id: number
  currentDay: number
  isPaused: boolean
  journeyStartDate: Date
}

interface RecentUser {
  username: string
  currentPosition: number
  ratingsCount: number
  joinedAt: Date
}

interface AdminControlsProps {
  globalState: GlobalState
  totalAlbums: number
  totalUsers: number
  totalRatings: number
  recentUsers: RecentUser[]
}

export default function AdminControls({
  globalState: initialState,
  totalAlbums,
  totalUsers,
  totalRatings,
  recentUsers,
}: AdminControlsProps) {
  const [globalState, setGlobalState] = useState(initialState)
  const [isUpdating, setIsUpdating] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const togglePause = async () => {
    setIsUpdating(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/toggle-pause', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to toggle pause')
      }

      const data = await response.json()
      setGlobalState(data.globalState)
      setMessage(data.globalState.isPaused ? 'Journey paused' : 'Journey resumed')
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage('Failed to update. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const advanceDay = async () => {
    if (!confirm('Manually advance to the next day? This will skip the daily schedule.')) {
      return
    }

    setIsUpdating(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/advance-day', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to advance day')
      }

      const data = await response.json()
      setGlobalState(data.globalState)
      setMessage(`Advanced to day ${data.globalState.currentDay}`)
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage('Failed to advance day. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const resetJourney = async () => {
    if (!confirm('Reset journey to day 1? This will NOT delete user ratings.')) {
      return
    }

    setIsUpdating(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/reset-journey', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to reset journey')
      }

      const data = await response.json()
      setGlobalState(data.globalState)
      setMessage('Journey reset to day 1')
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage('Failed to reset journey. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const progressPercentage = (globalState.currentDay / totalAlbums) * 100

  return (
    <div className="space-y-6">
      {message && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <p className="text-blue-800">{message}</p>
        </div>
      )}

      {/* Global Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-4xl font-bold text-blue-600">{globalState.currentDay}</div>
          <div className="text-gray-600 mt-2">Current Day</div>
          <div className="text-sm text-gray-500 mt-1">of {totalAlbums}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-4xl font-bold text-green-600">{totalUsers}</div>
          <div className="text-gray-600 mt-2">Total Users</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-4xl font-bold text-purple-600">{totalRatings}</div>
          <div className="text-gray-600 mt-2">Total Ratings</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-4xl font-bold text-orange-600">
            {globalState.isPaused ? '⏸️' : '▶️'}
          </div>
          <div className="text-gray-600 mt-2">
            {globalState.isPaused ? 'Paused' : 'Running'}
          </div>
        </div>
      </div>

      {/* Journey Progress */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Journey Progress</h2>
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Day {globalState.currentDay} of {totalAlbums}</span>
            <span>{progressPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Started: {new Date(globalState.journeyStartDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Global Controls</h2>

        <div className="grid md:grid-cols-3 gap-4">
          <button
            onClick={togglePause}
            disabled={isUpdating}
            className={`px-6 py-3 rounded-lg font-medium transition disabled:opacity-50 ${
              globalState.isPaused
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-yellow-600 text-white hover:bg-yellow-700'
            }`}
          >
            {globalState.isPaused ? 'Resume Journey' : 'Pause Journey'}
          </button>

          <button
            onClick={advanceDay}
            disabled={isUpdating || globalState.currentDay >= totalAlbums}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
          >
            Advance to Next Day
          </button>

          <button
            onClick={resetJourney}
            disabled={isUpdating}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
          >
            Reset to Day 1
          </button>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-medium text-yellow-800 mb-2">Important Notes:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Pausing stops daily album generation for ALL users</li>
            <li>• Advancing skips the normal midnight UTC schedule</li>
            <li>• Resetting does NOT delete user ratings or accounts</li>
          </ul>
        </div>
      </div>

      {/* Recent Users */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Recent Users</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Username</th>
                <th className="text-left py-3 px-4">Current Position</th>
                <th className="text-left py-3 px-4">Ratings</th>
                <th className="text-left py-3 px-4">Joined</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((user) => (
                <tr key={user.username} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <Link
                      href={`/${user.username}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {user.username}
                    </Link>
                  </td>
                  <td className="py-3 px-4">{user.currentPosition}</td>
                  <td className="py-3 px-4">{user.ratingsCount}</td>
                  <td className="py-3 px-4">
                    {new Date(user.joinedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/${user.username}/stats`}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      View Stats
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {recentUsers.length === 0 && (
          <p className="text-center py-8 text-gray-500">No users yet</p>
        )}
      </div>
    </div>
  )
}
