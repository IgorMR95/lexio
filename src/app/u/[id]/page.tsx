import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { FollowButton } from '@/components/ui/FollowButton'
import { ShareButton } from '@/components/ui/ShareButton'

export const dynamic = 'force-dynamic'

const PREVIEW = 5
const BASE_URL = 'https://www.midoriapp.com.br'

function getDesignacao(promptsCount: number, votosRecebidos: number, temDestaque: boolean): { label: string; color: string } | null {
  if (temDestaque) return { label: 'Referência Editorial', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' }
  if (promptsCount >= 5 && votosRecebidos >= 20) return { label: 'Especialista', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' }
  if (promptsCount >= 1) return { label: 'Contribuidor', color: 'bg-green-500/10 text-green-400 border-green-500/20' }
  return null
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, bio, instituicao')
    .eq('id', params.id)
    .single()

  if (!profile) return { title: 'Perfil | Midori' }

  const name = profile.full_name ?? profile.email ?? 'Contribuidor'
  const inst = profile.instituicao ? ` — ${profile.instituicao}` : ''
  const description = profile.bio
    ? `${name}${inst}. ${profile.bio}`
    : `${name}${inst}. Contribuidor da maior base de prompts jurídicos do Brasil.`

  return {
    title: `${name} | Midori — Base de Prompts Jurídicos`,
    description,
    openGraph: {
      title: `${name} | Midori`,
      description,
      url: `${BASE_URL}/u/${params.id}`,
      siteName: 'Midori — Base de Prompts Jurídicos',
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title: `${name} | Midori`,
      description,
    },
  }
}

export default async function PublicProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, bio, instituicao, role, created_at, avatar_url')
    .eq('id', params.id)
    .single()

  if (!profile) notFound()

  const { data: { user: currentUser } } = await supabase.auth.getUser()

  // Busca prompts do autor para calcular votos recebidos e cópias
  const { data: autorPromptIds } = await supabase
    .from('prompts')
    .select('id, total_copias')
    .eq('autor_id', params.id)
    .in('status', ['ativo', 'aprovado'])

  const promptIds = (autorPromptIds ?? []).map((p: any) => p.id)
  const totalCopias = (autorPromptIds ?? []).reduce((sum: number, p: any) => sum + (p.total_copias ?? 0), 0)

  const [
    { count: seguidoresCount },
    { count: seguindoCount },
    { count: promptsCount },
    { count: skillsCount },
    { count: votosRecebidos },
    { count: destaqueCount },
    { data: promptsPreview },
    { data: skillsPreview },
    { data: seguindoPreview },
    { data: seguidoresPreview },
    { data: grupos },
  ] = await Promise.all([
    (supabase as any).from('seguidores').select('id', { count: 'exact', head: true }).eq('seguido_id', params.id),
    (supabase as any).from('seguidores').select('id', { count: 'exact', head: true }).eq('seguidor_id', params.id),
    supabase.from('prompts').select('id', { count: 'exact', head: true }).eq('autor_id', params.id).in('status', ['ativo', 'aprovado']),
    (supabase as any).from('skills').select('id', { count: 'exact', head: true }).eq('autor_id', params.id).in('status', ['ativo', 'aprovado']),
    promptIds.length > 0
      ? (supabase as any).from('prompt_votos').select('id', { count: 'exact', head: true }).in('prompt_id', promptIds)
      : Promise.resolve({ count: 0 }),
    supabase.from('prompts').select('id', { count: 'exact', head: true }).eq('autor_id', params.id).eq('destaque', true).in('status', ['ativo', 'aprovado']),
    supabase
      .from('prompts')
      .select('id, titulo, descricao_curta, created_at, areas_direito(nome)')
      .eq('autor_id', params.id)
      .in('status', ['ativo', 'aprovado'])
      .order('created_at', { ascending: false })
      .limit(PREVIEW),
    (supabase as any)
      .from('skills')
      .select('id, titulo, descricao, tipo, areas_direito(nome), created_at')
      .eq('autor_id', params.id)
      .in('status', ['ativo', 'aprovado'])
      .order('created_at', { ascending: false })
      .limit(PREVIEW),
    (supabase as any)
      .from('seguidores')
      .select('seguido_id, profiles!seguidores_seguido_id_fkey(id, full_name, email, instituicao)')
      .eq('seguidor_id', params.id)
      .order('created_at', { ascending: false })
      .limit(PREVIEW),
    (supabase as any)
      .from('seguidores')
      .select('seguidor_id, profiles!seguidores_seguidor_id_fkey(id, full_name, email, instituicao)')
      .eq('seguido_id', params.id)
      .order('created_at', { ascending: false })
      .limit(PREVIEW),
    (supabase as any)
      .from('grupo_membros')
      .select('papel, grupos(id, nome, tipo)')
      .eq('user_id', params.id),
  ])

  let isFollowing = false
  if (currentUser && currentUser.id !== params.id) {
    const { data: followData } = await (supabase as any)
      .from('seguidores')
      .select('id')
      .eq('seguidor_id', currentUser.id)
      .eq('seguido_id', params.id)
      .single()
    isFollowing = !!followData
  }

  const designacao = getDesignacao(promptsCount ?? 0, votosRecebidos ?? 0, (destaqueCount ?? 0) > 0)

  const tipoLabel: Record<string, string> = {
    estudo: 'Grupo de Estudo', escritorio: 'Escritório', outro: 'Outro',
  }
  const tipoColor: Record<string, string> = {
    estudo: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    escritorio: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    outro: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  }
  const skillTipoLabel: Record<string, string> = {
    skill: 'Configuração', persona: 'Perfil', workflow: 'Workflow', instrucao: 'Regra',
  }

  const displayName = profile.full_name ?? profile.email ?? 'Usuário'
  const initial = displayName[0]?.toUpperCase() ?? '?'
  const uid = params.id

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Link href="/prompts" className="text-sm text-zinc-500 hover:text-white transition-colors">
          ← Base de Prompts
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start gap-5 mb-8 p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
        <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt={displayName} className="w-16 h-16 rounded-full object-cover" />
            : initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-white">{displayName}</h1>
              {profile.role === 'admin' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Admin</span>
              )}
              {designacao && (
                <span className={`text-xs px-2 py-0.5 rounded-full border ${designacao.color}`}>
                  {designacao.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ShareButton url={`${BASE_URL}/u/${uid}`} name={displayName} />
              {currentUser?.id !== params.id && (
                <FollowButton seguidoId={params.id} initialFollowing={isFollowing} userId={currentUser?.id ?? null} />
              )}
            </div>
          </div>
          {profile.instituicao && <p className="text-sm text-zinc-400 mb-2">{profile.instituicao}</p>}
          {profile.bio
            ? <p className="text-sm text-zinc-500 leading-relaxed">{profile.bio}</p>
            : !profile.instituicao && <p className="text-sm text-zinc-600 italic">Nenhuma informação preenchida.</p>
          }
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <Link href={`/u/${uid}/seguidores`} className="text-xs text-zinc-500 hover:text-white transition-colors">
              <span className="text-white font-semibold">{seguidoresCount ?? 0}</span> seguidores
            </Link>
            <Link href={`/u/${uid}/seguindo`} className="text-xs text-zinc-500 hover:text-white transition-colors">
              <span className="text-white font-semibold">{seguindoCount ?? 0}</span> seguindo
            </Link>
            <span className="text-xs text-zinc-700">
              Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats de contribuição */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Prompts publicados', count: promptsCount ?? 0, href: `/u/${uid}/prompts`, color: 'text-blue-400' },
          { label: 'Skills publicadas', count: skillsCount ?? 0, href: `/u/${uid}/skills`, color: 'text-green-400' },
          { label: 'Votos recebidos', count: votosRecebidos ?? 0, href: `/u/${uid}/prompts`, color: 'text-pink-400' },
          { label: 'Usos registrados', count: totalCopias, href: `/u/${uid}/prompts`, color: 'text-violet-400' },
        ].map(s => (
          <Link key={s.label} href={s.href}
            className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900 transition-all text-center group">
            <p className={`text-2xl font-black tabular-nums ${s.color}`}>{s.count}</p>
            <p className="text-xs text-zinc-500 mt-0.5 group-hover:text-zinc-400 transition-colors">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Grupos */}
      {grupos && grupos.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Grupos</h2>
          <div className="flex flex-wrap gap-2">
            {(grupos as any[]).map((m) => {
              const g = m.grupos
              if (!g) return null
              return (
                <Link key={g.id} href={`/grupos/${g.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-800 hover:border-zinc-600 bg-zinc-900/50 transition-colors">
                  <span className={`text-xs px-1.5 py-0.5 rounded border ${tipoColor[g.tipo] ?? tipoColor.outro}`}>
                    {tipoLabel[g.tipo] ?? 'Grupo'}
                  </span>
                  <span className="text-xs text-zinc-300">{g.nome}</span>
                  {m.papel === 'admin' && <span className="text-xs text-zinc-600">(admin)</span>}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <div className="space-y-8">

        {/* Prompts publicados */}
        <Section
          title="Prompts publicados"
          count={promptsCount ?? 0}
          verMaisHref={`/u/${uid}/prompts`}
          empty="Nenhum prompt publicado ainda."
        >
          {(promptsPreview ?? []).map((p: any) => (
            <Link key={p.id} href={`/prompts/${p.id}`}
              className="group flex items-start justify-between gap-3 px-4 py-3 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900 transition-all">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors line-clamp-1">{p.titulo}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {p.areas_direito?.nome && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">{p.areas_direito.nome}</span>
                  )}
                  <span className="text-xs text-zinc-600">{new Date(p.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
              <span className="text-xs text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 mt-0.5">Ver →</span>
            </Link>
          ))}
        </Section>

        {/* Skills MD publicadas */}
        <Section
          title="Skills MD publicadas"
          count={skillsCount ?? 0}
          verMaisHref={`/u/${uid}/skills`}
          empty="Nenhuma skill publicada ainda."
        >
          {(skillsPreview ?? []).map((s: any) => (
            <Link key={s.id} href={`/skills/${s.id}`}
              className="group flex items-start justify-between gap-3 px-4 py-3 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900 transition-all">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white group-hover:text-green-300 transition-colors line-clamp-1">{s.titulo}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                    {skillTipoLabel[s.tipo] ?? s.tipo}
                  </span>
                  {s.areas_direito?.nome && (
                    <span className="text-xs text-zinc-600">{s.areas_direito.nome}</span>
                  )}
                </div>
              </div>
              <span className="text-xs text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 mt-0.5">Ver →</span>
            </Link>
          ))}
        </Section>

        {/* Seguindo */}
        <Section
          title="Seguindo"
          count={seguindoCount ?? 0}
          verMaisHref={`/u/${uid}/seguindo`}
          empty="Não segue ninguém ainda."
        >
          {(seguindoPreview ?? []).map((r: any) => {
            const p = r.profiles
            if (!p) return null
            const nome = p.full_name ?? p.email ?? 'Usuário'
            return (
              <Link key={p.id} href={`/u/${p.id}`}
                className="group flex items-center gap-3 px-4 py-3 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900 transition-all">
                <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 flex-shrink-0">
                  {nome[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white group-hover:text-violet-300 transition-colors truncate">{nome}</p>
                  {p.instituicao && <p className="text-xs text-zinc-600 truncate">{p.instituicao}</p>}
                </div>
                <span className="text-xs text-zinc-600 group-hover:text-zinc-400 flex-shrink-0">Ver →</span>
              </Link>
            )
          })}
        </Section>

        {/* Seguidores */}
        <Section
          title="Seguidores"
          count={seguidoresCount ?? 0}
          verMaisHref={`/u/${uid}/seguidores`}
          empty="Sem seguidores ainda."
        >
          {(seguidoresPreview ?? []).map((r: any) => {
            const p = r.profiles
            if (!p) return null
            const nome = p.full_name ?? p.email ?? 'Usuário'
            return (
              <Link key={p.id} href={`/u/${p.id}`}
                className="group flex items-center gap-3 px-4 py-3 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900 transition-all">
                <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 flex-shrink-0">
                  {nome[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white group-hover:text-violet-300 transition-colors truncate">{nome}</p>
                  {p.instituicao && <p className="text-xs text-zinc-600 truncate">{p.instituicao}</p>}
                </div>
                <span className="text-xs text-zinc-600 group-hover:text-zinc-400 flex-shrink-0">Ver →</span>
              </Link>
            )
          })}
        </Section>

      </div>
    </div>
  )
}

function Section({
  title, count, verMaisHref, empty, badge, children,
}: {
  title: string
  count: number
  verMaisHref: string
  empty: string
  badge?: string
  children: React.ReactNode
}) {
  const hasChildren = Array.isArray(children)
    ? children.filter(Boolean).length > 0
    : !!children

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{title}</h2>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500 tabular-nums">{count}</span>
          {badge && <span className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-800/60 text-zinc-600">{badge}</span>}
        </div>
        {count > 5 && (
          <Link href={verMaisHref} className="text-xs text-zinc-500 hover:text-white transition-colors">
            Ver todos →
          </Link>
        )}
      </div>
      {!hasChildren ? (
        <div className="py-6 border border-dashed border-zinc-800 rounded-lg text-center">
          <p className="text-zinc-600 text-sm">{empty}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {children}
          {count > 5 && (
            <Link href={verMaisHref}
              className="block text-center py-2.5 rounded-lg border border-zinc-800 border-dashed text-xs text-zinc-500 hover:text-white hover:border-zinc-600 transition-all">
              Ver todos os {count} →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
