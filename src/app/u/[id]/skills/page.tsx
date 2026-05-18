import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const TIPO_LABEL: Record<string, string> = {
  skill: 'Configuração geral',
  persona: 'Perfil profissional',
  workflow: 'Passo a passo',
  instrucao: 'Regra de comportamento',
}
const TIPO_COLOR: Record<string, string> = {
  skill: 'bg-green-500/10 text-green-400 border-green-500/20',
  persona: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  workflow: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  instrucao: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
}

export default async function UserSkillsPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', params.id)
    .single()

  if (!profile) notFound()

  const { data: skills } = await (supabase as any)
    .from('skills')
    .select('id, titulo, descricao, tipo, destaque, compatibilidade, areas_direito(nome), created_at')
    .eq('autor_id', params.id)
    .in('status', ['ativo', 'aprovado'])
    .order('created_at', { ascending: false })

  const displayName = profile.full_name ?? profile.email ?? 'Usuário'

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
        <Link href={`/u/${params.id}`} className="hover:text-white transition-colors">{displayName}</Link>
        <span>/</span>
        <span className="text-zinc-300">Skills MD publicadas</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Skills MD publicadas</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{skills?.length ?? 0} skill{(skills?.length ?? 0) !== 1 ? 's' : ''} no total</p>
        </div>
      </div>

      {!skills?.length ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
          <p className="text-zinc-500">Nenhuma skill publicada ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(skills as any[]).map((s) => (
            <Link key={s.id} href={`/skills/${s.id}`}
              className="group block p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-medium text-white group-hover:text-green-300 transition-colors">{s.titulo}</p>
                    {s.destaque && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">★ Destaque</span>
                    )}
                  </div>
                  {s.descricao && (
                    <p className="text-xs text-zinc-500 line-clamp-2 mb-2">{s.descricao}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border ${TIPO_COLOR[s.tipo] ?? TIPO_COLOR.skill}`}>
                      {TIPO_LABEL[s.tipo] ?? s.tipo}
                    </span>
                    {s.areas_direito?.nome && (
                      <span className="text-xs text-zinc-600">{s.areas_direito.nome}</span>
                    )}
                    {s.compatibilidade?.slice(0, 2).map((c: string) => (
                      <span key={c} className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500">{c}</span>
                    ))}
                    <span className="text-xs text-zinc-600">{new Date(s.created_at).toLocaleDateString('pt-BR')}</span>
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
