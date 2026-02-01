'use client'

import { useRouter } from 'next/navigation'

export default function NewUserConfirm({ username }: { username: string }) {
  const router = useRouter()

  const handleCreate = async () => {
    // Call the API to trigger user creation, then refresh
    await fetch(`/api/user/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    })
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl text-center">
        <h2 className="text-lg font-semibold mb-2">Create new user?</h2>
        <p className="text-gray-600 mb-4">
          No user found with username &ldquo;<strong>{username}</strong>&rdquo;.
          Would you like to create a new account?
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create User
          </button>
        </div>
      </div>
    </div>
  )
}
