import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function UserPromptsPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', params.id)
    .single()

  if (!profile) notFound()

  const { data: prompts } = await supabase
    .from('prompts')
    .select('id, titulo, descricao_curta, created_at, areas_direito(nome), destaque, internacional, idioma')
    .eq('autor_id', params.id)
    .in('status', ['ativo', 'aprovado'])
    .order('created_at', { ascending: false })

  const displayName = profile.full_name ?? profile.email ?? 'Usuário'

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
        <Link href={`/u/${params.id}`} className="hover:text-white transition-colors">{displayName}</Link>
        <span>/</span>
        <span className="text-zinc-300">Prompts publicados</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Prompts publicados</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{prompts?.length ?? 0} prompt{(prompts?.length ?? 0) !== 1 ? 's' : ''} no total</p>
        </div>
      </div>

      {!prompts?.length ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
          <p className="text-zinc-500">Nenhum prompt publicado ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {prompts.map((p: any) => (
            <Link key={p.id} href={`/prompts/${p.id}`}
              className="group block p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">{p.titulo}</p>
                    {p.destaque && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">★ Destaque</span>
                    )}
                  </div>
                  {p.descricao_curta && (
                    <p className="text-xs text-zinc-500 line-clamp-2 mb-2">{p.descricao_curta}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.areas_direito?.nome && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">{p.areas_direito.nome}</span>
                    )}
                    {p.internacional && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        Intl{p.idioma ? ` · ${p.idioma.toUpperCase()}` : ''}
                      </span>
                    )}
                    <span className="text-xs text-zinc-600">{new Date(p.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <span className="text-xs text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 mt-0.5">Ver →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
