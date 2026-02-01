'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Notification } from './NotificationBell'

interface NotificationPopupProps {
  notifications: Notification[]
  isLoading: boolean
  username: string
  onClose: () => void
}

export default function NotificationPopup({
  notifications,
  isLoading,
  username,
  onClose,
}: NotificationPopupProps) {
  // Format relative time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Format stars display
  const formatStars = (stars: number) => {
    return '★'.repeat(stars) + '☆'.repeat(5 - stars)
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
      <div className="p-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Notifications</h3>
      </div>

      <div className="overflow-y-auto max-h-80">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No notifications yet</p>
            <p className="text-sm mt-1">Activity from other users will appear here</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <Link
                  href={`/${username}/history/${notification.album.position}`}
                  onClick={onClose}
                  className={`flex gap-3 p-3 hover:bg-gray-50 transition ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  {/* Album thumbnail */}
                  {notification.album.imageUrl ? (
                    <div className="flex-shrink-0 w-10 h-10 relative rounded overflow-hidden">
                      <Image
                        src={notification.album.imageUrl}
                        alt={notification.album.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No img</span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{notification.actor.username}</span>
                      {notification.type === 'review' ? ' reviewed ' : ' rated '}
                      <span className="font-medium">{notification.album.title}</span>
                    </p>
                    <p className="text-xs text-yellow-500 mt-0.5">
                      {formatStars(notification.stars)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {!notification.isRead && (
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
