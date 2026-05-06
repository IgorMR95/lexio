import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AdminPromptsTable } from './AdminPromptsTable'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: prompts, count } = await supabase
    .from('prompts')
    .select(`
      *,
      categorias_principais(nome),
      subcategorias(nome),
      areas_direito(nome),
      profiles(full_name, email)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  const stats = {
    total: count ?? 0,
    aprovados: prompts?.filter(p => p.status === 'aprovado' || p.status === 'ativo').length ?? 0,
    pendentes: prompts?.filter(p => p.status === 'pendente').length ?? 0,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs border border-amber-500/20">Admin</span>
            <h1 className="text-2xl font-bold text-white">Painel de Administração</h1>
          </div>
          <p className="text-zinc-500 text-sm">Gerencie todos os prompts da plataforma</p>
        </div>
        <Link
          href="/dashboard/novo-prompt"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors"
        >
          + Novo prompt
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <p className="text-xs text-zinc-500 mb-1">Total de prompts</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <p className="text-xs text-zinc-500 mb-1">Aprovados</p>
          <p className="text-2xl font-bold text-green-400">{stats.aprovados}</p>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <p className="text-xs text-zinc-500 mb-1">Pendentes</p>
          <p className="text-2xl font-bold text-amber-400">{stats.pendentes}</p>
        </div>
      </div>

      <AdminPromptsTable prompts={prompts ?? []} />
    </div>
  )
}
