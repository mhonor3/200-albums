'use client'

import { useState, useEffect, useRef } from 'react'
import NotificationPopup from './NotificationPopup'

interface NotificationBellProps {
  username: string
}

export interface Notification {
  id: number
  type: string
  stars: number
  createdAt: string
  isRead: boolean
  actor: { username: string }
  album: { position: number; title: string; artist: string; imageUrl: string | null }
}

export default function NotificationBell({ username }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications?username=${encodeURIComponent(username)}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
  }, [username])

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Mark notifications as read when popup opens
  const handleOpen = async () => {
    setIsOpen(true)
    // Refetch to get latest
    await fetchNotifications()

    if (unreadCount > 0) {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })
      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => (isOpen ? setIsOpen(false) : handleOpen())}
        className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-md transition"
        aria-label="Notifications"
      >
        {/* Bell Icon SVG */}
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popup */}
      {isOpen && (
        <NotificationPopup
          notifications={notifications}
          isLoading={isLoading}
          username={username}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
