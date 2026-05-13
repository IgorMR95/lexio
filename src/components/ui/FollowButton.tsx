'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  seguidoId: string
  initialFollowing: boolean
  userId: string | null
}

export function FollowButton({ seguidoId, initialFollowing, userId }: Props) {
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (!userId) {
    return (
      <a
        href="/login"
        className="px-4 py-1.5 rounded-lg border border-zinc-700 text-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
      >
        Seguir
      </a>
    )
  }

  async function toggle() {
    setLoading(true)
    const method = following ? 'DELETE' : 'POST'
    await fetch('/api/seguir', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seguido_id: seguidoId }),
    })
    setFollowing(f => !f)
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`px-4 py-1.5 rounded-lg border text-sm font-medium transition-colors disabled:opacity-50 ${
        following
          ? 'border-zinc-600 text-zinc-400 hover:border-red-500/50 hover:text-red-400 bg-zinc-800/50'
          : 'border-green-600 text-green-400 hover:bg-green-600 hover:text-white bg-green-600/10'
      }`}
    >
      {loading ? '...' : following ? 'Seguindo' : 'Seguir'}
    </button>
  )
}
