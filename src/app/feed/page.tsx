import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function FeedPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: seguindo } = await (supabase as any)
    .from('seguidores')
    .select('seguido_id')
    .eq('seguidor_id', user.id)

  const seguidoIds: string[] = (seguindo ?? []).map((s: any) => s.seguido_id)

  const { data: prompts } = seguidoIds.length > 0
    ? await supabase
        .from('prompts')
        .select('id, titulo, descricao_curta, created_at, autor_id, areas_direito(nome), destaque')
        .in('autor_id', seguidoIds)
        .in('status', ['ativo', 'aprovado'])
        .order('created_at', { ascending: false })
        .limit(50)
    : { data: [] }

  const autorIds = Array.from(new Set((prompts ?? []).map((p: any) => p.autor_id).filter(Boolean)))
  const { data: profiles } = autorIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, email').in('id', autorIds)
    : { data: [] }

  const profileMap: Record<string, any> = {}
  for (const p of profiles ?? []) profileMap[p.id] = p

  const promptIds = (prompts ?? []).map((p: any) => p.id)
  const { data: votos } = promptIds.length > 0
    ? await (supabase as any)
        .from('prompt_votos_contagem')
        .select('prompt_id, total_votos')
        .in('prompt_id', promptIds)
    : { data: [] }

  const votosMap: Record<string, number> = {}
  for (const v of votos ?? []) votosMap[v.prompt_id] = v.total_votos

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white">Feed</h1>
        <p className="text-sm text-zinc-500 mt-1">Prompts publicados por quem você segue</p>
      </div>

      {seguidoIds.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
          <p className="text-zinc-500 text-sm mb-3">Você ainda não segue ninguém.</p>
          <Link href="/prompts" className="text-sm text-green-400 hover:underline">
            Explorar a base de prompts →
          </Link>
        </div>
      ) : !prompts?.length ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
          <p className="text-zinc-500 text-sm mb-3">Ninguém que você segue publicou prompts ainda.</p>
          <Link href="/prompts" className="text-sm text-green-400 hover:underline">
            Explorar a base de prompts →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {(prompts ?? []).map((p: any) => {
            const autor = profileMap[p.autor_id]
            const nome = autor?.full_name ?? autor?.email ?? 'Usuário'
            const inicial = nome[0]?.toUpperCase() ?? '?'
            const totalVotos = votosMap[p.id] ?? 0

            return (
              <div key={p.id} className="flex items-start gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900 transition-all">
                <Link
                  href={`/u/${p.autor_id}`}
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-white hover:border-zinc-500 transition-colors mt-0.5"
                >
                  {inicial}
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/u/${p.autor_id}`} className="text-xs font-medium text-zinc-400 hover:text-white transition-colors">
                      {nome}
                    </Link>
                    <span className="text-xs text-zinc-700">·</span>
                    <span className="text-xs text-zinc-700">
                      {new Date(p.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <Link href={`/prompts/${p.id}`} className="block group">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-white group-hover:text-green-300 transition-colors">{p.titulo}</p>
                      {p.destaque && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-[10px] border border-yellow-500/20">
                          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          Destaque
                        </span>
                      )}
                    </div>
                    {p.descricao_curta && (
                      <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{p.descricao_curta}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {(p as any).areas_direito?.nome && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                          {(p as any).areas_direito.nome}
                        </span>
                      )}
                      {totalVotos > 0 && (
                        <span className="flex items-center gap-1 text-xs text-zinc-600">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M7 11v8a1 1 0 01-1 1H4a1 1 0 01-1-1v-7a1 1 0 011-1h2V9a6 6 0 0112 0v1h2a1 1 0 011 1v7a1 1 0 01-1 1h-2a1 1 0 01-1-1v-8H7z" />
                          </svg>
                          {totalVotos}
                        </span>
                      )}
                    </div>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
