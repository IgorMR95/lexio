import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function GrupoPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: grupo } = await (supabase as any)
    .from('grupos')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!grupo) notFound()

  const { data: membros } = await (supabase as any)
    .from('grupo_membros')
    .select('papel, joined_at, profiles(id, full_name, email, bio, instituicao)')
    .eq('grupo_id', params.id)
    .order('joined_at', { ascending: true })

  const tipoLabel: Record<string, string> = { estudo: 'Grupo de Estudo', escritorio: 'Escritório', outro: 'Outro' }
  const tipoColor: Record<string, string> = {
    estudo: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    escritorio: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    outro: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-white">{grupo.nome}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${tipoColor[grupo.tipo]}`}>{tipoLabel[grupo.tipo]}</span>
        </div>
        {grupo.descricao && <p className="text-zinc-400 text-sm">{grupo.descricao}</p>}
        <p className="text-xs text-zinc-700 mt-2 font-mono">ID: {grupo.id}</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
          {membros?.length ?? 0} membro(s)
        </h2>
        <div className="space-y-3">
          {membros?.map((m: any) => {
            const p = m.profiles
            if (!p) return null
            return (
              <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
                <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-white flex-shrink-0">
                  {(p.full_name ?? p.email)?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white text-sm font-medium">{p.full_name ?? p.email}</p>
                    {m.papel === 'admin' && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Admin</span>
                    )}
                  </div>
                  {p.instituicao && <p className="text-xs text-zinc-500 mt-0.5">{p.instituicao}</p>}
                  {p.bio && <p className="text-xs text-zinc-600 mt-0.5 line-clamp-1">{p.bio}</p>}
                </div>
                <span className="text-xs text-zinc-700 flex-shrink-0">
                  desde {new Date(m.joined_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-8">
        <Link href="/perfil" className="text-sm text-zinc-500 hover:text-white transition-colors">← Voltar ao perfil</Link>
      </div>
    </div>
  )
}
