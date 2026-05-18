import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function UserCurtidasPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', params.id)
    .single()

  if (!profile) notFound()

  const [{ data: promptCurtidasRaw }, { data: skillCurtidasRaw }] = await Promise.all([
    (supabase as any)
      .from('prompt_votos')
      .select('created_at, prompts(id, titulo, descricao_curta, areas_direito(nome))')
      .eq('user_id', params.id)
      .order('created_at', { ascending: false }),
    (supabase as any)
      .from('skill_votos')
      .select('created_at, skills(id, titulo, descricao, tipo)')
      .eq('user_id', params.id)
      .order('created_at', { ascending: false }),
  ])

  const promptCurtidas = (promptCurtidasRaw ?? []).filter((r: any) => r.prompts)
  const skillCurtidas = (skillCurtidasRaw ?? []).filter((r: any) => r.skills)

  // Intercalar por data mais recente
  type Item = { type: 'prompt' | 'skill'; date: string; data: any }
  const all: Item[] = [
    ...promptCurtidas.map((r: any) => ({ type: 'prompt' as const, date: r.created_at, data: r.prompts })),
    ...skillCurtidas.map((r: any) => ({ type: 'skill' as const, date: r.created_at, data: r.skills })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const displayName = profile.full_name ?? profile.email ?? 'Usuário'

  const TIPO_LABEL: Record<string, string> = {
    skill: 'Configuração', persona: 'Perfil', workflow: 'Workflow', instrucao: 'Regra',
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
        <Link href={`/u/${params.id}`} className="hover:text-white transition-colors">{displayName}</Link>
        <span>/</span>
        <span className="text-zinc-300">Curtidas</span>
      </div>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Curtidas</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          {all.length} curtida{all.length !== 1 ? 's' : ''} no total
          <span className="text-zinc-600 ml-2">({promptCurtidas.length} prompts · {skillCurtidas.length} skills)</span>
        </p>
      </div>

      {all.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
          <p className="text-zinc-500">Nenhuma curtida ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {all.map((item, i) => (
            item.type === 'prompt' ? (
              <Link key={`p-${item.data.id}-${i}`} href={`/prompts/${item.data.id}`}
                className="group block p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-pink-500/20 hover:bg-zinc-900 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white group-hover:text-pink-300 transition-colors line-clamp-1">{item.data.titulo}</p>
                    {item.data.descricao_curta && (
                      <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{item.data.descricao_curta}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">Prompt</span>
                      {item.data.areas_direito?.nome && (
                        <span className="text-xs text-zinc-600">{item.data.areas_direito.nome}</span>
                      )}
                      <span className="text-xs text-zinc-700">{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 mt-0.5">Ver →</span>
                </div>
              </Link>
            ) : (
              <Link key={`s-${item.data.id}-${i}`} href={`/skills/${item.data.id}`}
                className="group block p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-pink-500/20 hover:bg-zinc-900 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white group-hover:text-pink-300 transition-colors line-clamp-1">{item.data.titulo}</p>
                    {item.data.descricao && (
                      <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{item.data.descricao}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Skill MD</span>
                      {item.data.tipo && (
                        <span className="text-xs text-zinc-600">{TIPO_LABEL[item.data.tipo] ?? item.data.tipo}</span>
                      )}
                      <span className="text-xs text-zinc-700">{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 mt-0.5">Ver →</span>
                </div>
              </Link>
            )
          ))}
        </div>
      )}
    </div>
  )
}
