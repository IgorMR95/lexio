import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PublicProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, bio, instituicao, role, created_at')
    .eq('id', params.id)
    .single()

  if (!profile) notFound()

  const { data: prompts } = await supabase
    .from('prompts')
    .select('id, titulo, descricao_curta, created_at, areas_direito(nome), internacional, idioma')
    .eq('autor_id', params.id)
    .in('status', ['ativo', 'aprovado'])
    .order('created_at', { ascending: false })

  const { data: grupos } = await (supabase as any)
    .from('grupo_membros')
    .select('papel, grupos(id, nome, tipo)')
    .eq('user_id', params.id)

  const tipoLabel: Record<string, string> = {
    estudo: 'Grupo de Estudo',
    escritorio: 'Escritório',
    outro: 'Outro',
  }
  const tipoColor: Record<string, string> = {
    estudo: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    escritorio: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    outro: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  }

  const displayName = profile.full_name ?? profile.email ?? 'Usuário'
  const initial = displayName[0]?.toUpperCase() ?? '?'

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Link href="/prompts" className="text-sm text-zinc-500 hover:text-white transition-colors">
          ← Base de Prompts
        </Link>
      </div>

      {/* Header do perfil */}
      <div className="flex items-start gap-5 mb-8 p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
        <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="text-xl font-bold text-white">{displayName}</h1>
            {profile.role === 'admin' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Admin
              </span>
            )}
          </div>
          {profile.instituicao && (
            <p className="text-sm text-zinc-400 mb-2">{profile.instituicao}</p>
          )}
          {profile.bio && (
            <p className="text-sm text-zinc-500 leading-relaxed">{profile.bio}</p>
          )}
          {!profile.bio && !profile.instituicao && (
            <p className="text-sm text-zinc-600 italic">Nenhuma informação preenchida.</p>
          )}
          <p className="text-xs text-zinc-700 mt-3">
            Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Grupos */}
      {grupos && grupos.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Grupos</h2>
          <div className="flex flex-wrap gap-2">
            {grupos.map((m: any) => {
              const g = m.grupos
              if (!g) return null
              return (
                <Link
                  key={g.id}
                  href={`/grupos/${g.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors hover:border-zinc-600 bg-zinc-900/50"
                >
                  <span className={`text-xs px-1.5 py-0.5 rounded border ${tipoColor[g.tipo] ?? tipoColor.outro}`}>
                    {tipoLabel[g.tipo] ?? 'Grupo'}
                  </span>
                  <span className="text-xs text-zinc-300">{g.nome}</span>
                  {m.papel === 'admin' && (
                    <span className="text-xs text-zinc-600">(admin)</span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Prompts publicados */}
      <div>
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Prompts publicados ({prompts?.length ?? 0})
        </h2>
        {!prompts?.length ? (
          <div className="text-center py-10 border border-dashed border-zinc-800 rounded-xl">
            <p className="text-zinc-600 text-sm">Nenhum prompt publicado ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {prompts.map((p: any) => (
              <Link
                key={p.id}
                href={`/prompts/${p.id}`}
                className="block p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white group-hover:text-blue-300">{p.titulo}</p>
                    {p.descricao_curta && (
                      <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{p.descricao_curta}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {p.areas_direito?.nome && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {p.areas_direito.nome}
                        </span>
                      )}
                      {p.internacional && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          Intl{p.idioma ? ` · ${p.idioma.toUpperCase()}` : ''}
                        </span>
                      )}
                      <span className="text-xs text-zinc-600">
                        {new Date(p.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-500 flex-shrink-0">Ver →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
