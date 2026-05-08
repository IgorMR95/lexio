import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: meusPrompts, count } = await supabase
    .from('prompts')
    .select('id, titulo, status, created_at, areas_direito(nome)', { count: 'exact' })
    .eq('autor_id', user.id)
    .order('created_at', { ascending: false })

  const aprovados = meusPrompts?.filter(p => p.status === 'aprovado' || p.status === 'ativo').length ?? 0
  const pendentes = meusPrompts?.filter(p => p.status === 'pendente').length ?? 0

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-1">Olá, {profile?.full_name ?? user.email}</p>
        </div>
        <Link
          href="/dashboard/novo-prompt"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo prompt
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <p className="text-xs text-zinc-500 mb-1">Prompts enviados</p>
          <p className="text-2xl font-bold text-white">{count ?? 0}</p>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <p className="text-xs text-zinc-500 mb-1">Aprovados</p>
          <p className="text-2xl font-bold text-green-400">{aprovados}</p>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <p className="text-xs text-zinc-500 mb-1">Pendentes</p>
          <p className="text-2xl font-bold text-amber-400">{pendentes}</p>
        </div>
      </div>

      {/* Meus prompts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Meus prompts</h2>
          <Link href="/perfil?tab=prompts" className="text-xs text-zinc-500 hover:text-white transition-colors">Ver todos →</Link>
        </div>
        {!meusPrompts?.length ? (
          <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl">
            <p className="text-zinc-500 mb-4">Você ainda não enviou nenhum prompt</p>
            <Link href="/dashboard/novo-prompt" className="text-sm text-white hover:underline">
              Enviar meu primeiro prompt →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {meusPrompts.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{p.titulo}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {(p as any).areas_direito?.nome && `${(p as any).areas_direito.nome} · `}
                    {new Date(p.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <StatusBadge status={p.status} />
                  <Link href={`/prompts/${p.id}`} className="text-xs text-zinc-500 hover:text-white transition-colors">
                    Ver →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    aprovado: { label: 'Aprovado', className: 'bg-green-500/10 text-green-400 border-green-500/20' },
    ativo: { label: 'Ativo', className: 'bg-green-500/10 text-green-400 border-green-500/20' },
    pendente: { label: 'Pendente', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    inativo: { label: 'Inativo', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  }
  const { label, className } = map[status] ?? map.inativo
  return <span className={`px-2 py-0.5 rounded-full text-xs border ${className}`}>{label}</span>
}
