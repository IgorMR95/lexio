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
      title={userId ? (voted ? 'Remover curtida' : 'Curtir este prompt') : 'Faça login para curtir'}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all disabled:opacity-60 ${
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
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
      </svg>
      <span className="text-sm font-semibold tabular-nums">{count}</span>
    </button>
  )
}
