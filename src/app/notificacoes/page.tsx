'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const tipoLabel = (tipo: string, ator: string) => {
  if (tipo === 'novo_seguidor') return `${ator} começou a te seguir`
  if (tipo === 'comentario_prompt') return `${ator} comentou em um dos seus prompts`
  if (tipo === 'voto_prompt') return `${ator} votou em um dos seus prompts`
  return 'Nova notificação'
}

export default async function NotificacoesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notificacoes } = await (supabase as any)
    .from('notificacoes')
    .select('id, tipo, lida, created_at, ator_id, prompt_id, prompts(id, titulo), ator:ator_id(full_name, email)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  // Mark all as read
  await (supabase as any)
    .from('notificacoes')
    .update({ lida: true })
    .eq('user_id', user.id)
    .eq('lida', false)

  const grouped: Record<string, typeof notificacoes> = {}
  for (const n of (notificacoes ?? [])) {
    const date = new Date(n.created_at).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(n)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Link href="/prompts" className="text-sm text-zinc-500 hover:text-white transition-colors">
          ← Base de Prompts
        </Link>
      </div>

      <h1 className="text-xl font-bold text-white mb-8">Notificações</h1>

      {!notificacoes?.length ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
          <p className="text-zinc-600 text-sm">Nenhuma notificação ainda.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-3 capitalize">{date}</p>
              <div className="space-y-1 rounded-xl border border-zinc-800 overflow-hidden">
                {items.map((n: any) => {
                  const ator = n.ator?.full_name ?? n.ator?.email ?? 'Alguém'
                  const href = n.tipo === 'novo_seguidor' && n.ator_id
                    ? `/u/${n.ator_id}`
                    : n.prompts ? `/prompts/${n.prompts.id}` : '#'
                  return (
                    <Link
                      key={n.id}
                      href={href}
                      className={`flex items-start gap-4 px-5 py-4 hover:bg-zinc-900 transition-colors border-b border-zinc-800/50 last:border-b-0 ${!n.lida ? 'bg-green-950/10' : 'bg-zinc-950'}`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.lida ? 'bg-green-400' : 'bg-zinc-700'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-300 leading-snug">{tipoLabel(n.tipo, ator)}</p>
                        {n.prompts && (
                          <p className="text-xs text-zinc-600 mt-0.5 truncate">{n.prompts.titulo}</p>
                        )}
                        <p className="text-xs text-zinc-700 mt-1">
                          {new Date(n.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
