'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Notif {
  id: string
  tipo: string
  lida: boolean
  created_at: string
  ator: { full_name: string | null; email: string | null } | null
  prompt: { id: string; titulo: string } | null
}

interface Props {
  notificacoes: Notif[]
  naoLidas: number
}

const tipoLabel = (tipo: string, ator: string) => {
  if (tipo === 'novo_seguidor') return `${ator} começou a te seguir`
  if (tipo === 'comentario_prompt') return `${ator} comentou em um dos seus prompts`
  if (tipo === 'voto_prompt') return `${ator} votou em um dos seus prompts`
  return 'Nova notificação'
}

export function NotificacoesBell({ notificacoes, naoLidas }: Props) {
  const [open, setOpen] = useState(false)
  const [lidas, setLidas] = useState(naoLidas)

  async function marcarLidas() {
    if (lidas === 0) return
    await fetch('/api/notificacoes', { method: 'PATCH' })
    setLidas(0)
  }

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(o => !o); if (!open) marcarLidas() }}
        className="relative p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        title="Notificações"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {lidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center">
            {lidas > 9 ? '9+' : lidas}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <span className="text-sm font-semibold text-white">Notificações</span>
              <Link href="/notificacoes" onClick={() => setOpen(false)} className="text-xs text-zinc-500 hover:text-green-400 transition-colors">
                Ver todas
              </Link>
            </div>

            {notificacoes.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-zinc-600">
                Nenhuma notificação ainda.
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto divide-y divide-zinc-900">
                {notificacoes.slice(0, 8).map(n => {
                  const ator = n.ator?.full_name ?? n.ator?.email ?? 'Alguém'
                  const href = n.tipo === 'novo_seguidor' && n.ator
                    ? `/u/${(n as any).ator_id}`
                    : n.prompt ? `/prompts/${n.prompt.id}` : '/notificacoes'
                  return (
                    <Link
                      key={n.id}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-zinc-900 transition-colors ${!n.lida ? 'bg-green-950/20' : ''}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${!n.lida ? 'bg-green-400' : 'bg-transparent'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-300 leading-snug">{tipoLabel(n.tipo, ator)}</p>
                        {n.prompt && (
                          <p className="text-xs text-zinc-600 mt-0.5 truncate">{n.prompt.titulo}</p>
                        )}
                        <p className="text-xs text-zinc-700 mt-1">
                          {new Date(n.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
