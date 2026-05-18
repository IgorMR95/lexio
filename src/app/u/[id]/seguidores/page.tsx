import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function UserSeguidoresPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', params.id)
    .single()

  if (!profile) notFound()

  const { data: raw } = await (supabase as any)
    .from('seguidores')
    .select('created_at, profiles!seguidores_seguidor_id_fkey(id, full_name, email, bio, instituicao)')
    .eq('seguido_id', params.id)
    .order('created_at', { ascending: false })

  const lista = (raw ?? []).filter((r: any) => r.profiles)
  const displayName = profile.full_name ?? profile.email ?? 'Usuário'

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
        <Link href={`/u/${params.id}`} className="hover:text-white transition-colors">{displayName}</Link>
        <span>/</span>
        <span className="text-zinc-300">Seguidores</span>
      </div>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Seguidores</h1>
        <p className="text-sm text-zinc-500 mt-0.5">{lista.length} seguidor{lista.length !== 1 ? 'es' : ''}</p>
      </div>

      {lista.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
          <p className="text-zinc-500">Sem seguidores ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {lista.map((r: any) => {
            const p = r.profiles
            const nome = p.full_name ?? p.email ?? 'Usuário'
            return (
              <Link key={p.id} href={`/u/${p.id}`}
                className="group flex items-center gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900 transition-all">
                <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-300 flex-shrink-0">
                  {nome[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors truncate">{nome}</p>
                  {p.instituicao && <p className="text-xs text-zinc-500 truncate">{p.instituicao}</p>}
                  {p.bio && !p.instituicao && <p className="text-xs text-zinc-600 line-clamp-1">{p.bio}</p>}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
