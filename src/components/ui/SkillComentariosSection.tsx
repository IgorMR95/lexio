'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Comentario {
  id: string
  conteudo: string
  created_at: string
  autor_id: string
  profiles: { full_name: string | null; email: string | null } | null
}

interface Props {
  skillId: string
  comentarios: Comentario[]
  userId: string | null
  isAdmin: boolean
}

export function SkillComentariosSection({ skillId, comentarios: initial, userId, isAdmin }: Props) {
  const [comentarios, setComentarios] = useState(initial)
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const router = useRouter()

  async function enviar() {
    if (!texto.trim()) return
    setLoading(true)
    setErro('')
    const res = await fetch('/api/skill-comentarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill_id: skillId, conteudo: texto }),
    })
    if (res.ok) {
      setTexto('')
      router.refresh()
    } else {
      const data = await res.json()
      setErro(data.error ?? 'Erro ao comentar')
    }
    setLoading(false)
  }

  async function deletar(id: string) {
    await fetch('/api/skill-comentarios', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setComentarios(c => c.filter(x => x.id !== id))
  }

  return (
    <div className="mt-8 pt-8 border-t border-zinc-800">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
        Comentários ({comentarios.length})
      </h2>

      {userId ? (
        <div className="mb-6">
          <textarea
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder="Deixe um comentário sobre esta skill..."
            rows={3}
            maxLength={2000}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-zinc-700">{texto.length}/2000</span>
            <div className="flex items-center gap-3">
              {erro && <span className="text-xs text-red-400">{erro}</span>}
              <button
                onClick={enviar}
                disabled={loading || !texto.trim()}
                className="px-4 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors disabled:opacity-40"
              >
                {loading ? 'Enviando...' : 'Comentar'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 rounded-xl border border-dashed border-zinc-800 text-center">
          <p className="text-sm text-zinc-500">
            <Link href="/login" className="text-green-400 hover:underline">Faça login</Link> para comentar.
          </p>
        </div>
      )}

      {comentarios.length === 0 ? (
        <p className="text-sm text-zinc-600 text-center py-6">Nenhum comentário ainda. Seja o primeiro!</p>
      ) : (
        <div className="space-y-4">
          {comentarios.map(c => {
            const nome = c.profiles?.full_name ?? c.profiles?.email ?? 'Usuário'
            const inicial = nome[0]?.toUpperCase() ?? '?'
            const isOwn = userId === c.autor_id
            return (
              <div key={c.id} className="flex gap-3">
                <Link href={`/u/${c.autor_id}`} className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-white hover:border-zinc-500 transition-colors">
                    {inicial}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/u/${c.autor_id}`} className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                      {nome}
                    </Link>
                    <span className="text-xs text-zinc-700">
                      {new Date(c.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{c.conteudo}</p>
                </div>
                {(isOwn || isAdmin) && (
                  <button
                    onClick={() => deletar(c.id)}
                    className="flex-shrink-0 text-zinc-700 hover:text-red-400 transition-colors mt-1"
                    title="Deletar comentário"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
