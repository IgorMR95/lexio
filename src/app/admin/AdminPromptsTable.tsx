'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Prompt {
  id: string
  titulo: string
  status: string
  created_at: string
  categorias_principais: { nome: string } | null
  areas_direito: { nome: string } | null
  profiles: { full_name: string | null; email: string | null } | null
}

export function AdminPromptsTable({ prompts: initialPrompts }: { prompts: Prompt[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [prompts, setPrompts] = useState(initialPrompts)
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  const filtered = filterStatus ? prompts.filter(p => p.status === filterStatus) : prompts

  const updateStatus = async (id: string, status: string) => {
    setLoading(id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('prompts').update({ status }).eq('id', id)
    if (!error) {
      setPrompts(prev => prev.map(p => p.id === id ? { ...p, status } : p))
    }
    setLoading(null)
  }

  const deletePrompt = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este prompt?')) return
    setLoading(id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('prompts').delete().eq('id', id)
    if (!error) {
      setPrompts(prev => prev.filter(p => p.id !== id))
    }
    setLoading(null)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs text-zinc-500">{filtered.length} prompts</span>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs focus:outline-none"
        >
          <option value="">Todos os status</option>
          <option value="aprovado">Aprovados</option>
          <option value="pendente">Pendentes</option>
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
        </select>
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Título</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 hidden md:table-cell">Área</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 hidden lg:table-cell">Autor</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Status</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {filtered.map(prompt => (
              <tr key={prompt.id} className="hover:bg-zinc-900/30 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/prompts/${prompt.id}`} className="text-white hover:text-blue-300 transition-colors font-medium line-clamp-1">
                    {prompt.titulo}
                  </Link>
                  <p className="text-xs text-zinc-600 mt-0.5">{new Date(prompt.created_at).toLocaleDateString('pt-BR')}</p>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs text-zinc-400">{prompt.areas_direito?.nome ?? '—'}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-xs text-zinc-400">{prompt.profiles?.full_name ?? prompt.profiles?.email ?? 'Anônimo'}</span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={prompt.status}
                    onChange={e => updateStatus(prompt.id, e.target.value)}
                    disabled={loading === prompt.id}
                    className={`px-2 py-1 rounded-md text-xs border focus:outline-none disabled:opacity-40 ${
                      prompt.status === 'aprovado' || prompt.status === 'ativo'
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : prompt.status === 'pendente'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                    }`}
                  >
                    <option value="aprovado">Aprovado</option>
                    <option value="ativo">Ativo</option>
                    <option value="pendente">Pendente</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/prompts/${prompt.id}/edit`}
                      className="text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => deletePrompt(prompt.id)}
                      disabled={loading === prompt.id}
                      className="text-xs text-red-400/70 hover:text-red-400 transition-colors disabled:opacity-40"
                    >
                      Deletar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
