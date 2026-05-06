import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminClient } from './AdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [
    { data: profiles },
    { data: auditLogs },
    { data: categorias },
    { data: subcategorias },
    { data: subniveis },
    { data: areas },
    { count: totalPrompts },
    { count: pendentes },
  ] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, role, created_at').order('created_at', { ascending: false }),
    supabase.from('audit_logs').select('*, profiles!usuario_id(full_name)').order('criado_em', { ascending: false }).limit(100),
    supabase.from('categorias_principais').select('*').order('ordem'),
    supabase.from('subcategorias').select('*').order('ordem'),
    supabase.from('subniveis').select('*').order('ordem'),
    supabase.from('areas_direito').select('*').order('ordem'),
    supabase.from('prompts').select('*', { count: 'exact', head: true }),
    supabase.from('prompts').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
  ])

  return (
    <AdminClient
      currentUserId={user.id}
      profiles={profiles ?? []}
      auditLogs={auditLogs ?? []}
      categorias={categorias ?? []}
      subcategorias={subcategorias ?? []}
      subniveis={subniveis ?? []}
      areas={areas ?? []}
      stats={{ totalPrompts: totalPrompts ?? 0, pendentes: pendentes ?? 0, totalUsers: profiles?.length ?? 0 }}
    />
  )
}
