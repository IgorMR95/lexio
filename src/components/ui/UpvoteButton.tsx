'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  promptId: string
  initialCount: number
  initialVoted: boolean
  userId: string | null
}

export function UpvoteButton({ promptId, initialCount, initialVoted, userId }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [voted, setVoted] = useState(initialVoted)
  const [count, setCount] = useState(initialCount)
  const [isPending, startTransition] = useTransition()

  const toggle = async () => {
    if (!userId) {
      router.push('/login')
      return
    }

    const optimisticVoted = !voted
    const optimisticCount = optimisticVoted ? count + 1 : count - 1
    setVoted(optimisticVoted)
    setCount(optimisticCount)

    startTransition(async () => {
      if (optimisticVoted) {
        const { error } = await supabase
          .from('prompt_votos' as any)
          .insert({ prompt_id: promptId, user_id: userId })
        if (error) { setVoted(!optimisticVoted); setCount(count) }
      } else {
        const { error } = await supabase
          .from('prompt_votos' as any)
          .delete()
          .eq('prompt_id', promptId)
          .eq('user_id', userId)
        if (error) { setVoted(!optimisticVoted); setCount(count) }
      }
    })
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      title={userId ? (voted ? 'Remover voto' : 'Votar neste prompt') : 'Faça login para votar'}
      className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border transition-all disabled:opacity-60 ${
        voted
          ? 'bg-green-500/15 border-green-500/40 text-green-400'
          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-green-500/40 hover:text-green-400'
      }`}
    >
      <svg
        className={`w-5 h-5 transition-transform ${voted ? 'scale-110' : ''}`}
        fill={voted ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
      <span className="text-xs font-semibold tabular-nums">{count}</span>
    </button>
  )
}
