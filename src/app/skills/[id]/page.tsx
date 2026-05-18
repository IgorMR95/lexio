import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CopyButton } from '@/components/ui/CopyButton'
import { SkillUpvoteButton } from '@/components/ui/SkillUpvoteButton'
import { SkillComentariosSection } from '@/components/ui/SkillComentariosSection'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const TIPOS: Record<string, { label: string; color: string }> = {
  skill:     { label: 'Skill',      color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  persona:   { label: 'Persona',    color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  workflow:  { label: 'Workflow',   color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  instrucao: { label: 'Instrução',  color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
}

export default async function SkillPage({ params }: { params: { id: string } }) {
  const { id } = params
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = user
    ? (await supabase.from('profiles').select('role').eq('id', user.id).single()).data?.role === 'admin'
    : false

  const query = (supabase as any)
    .from('skills')
    .select('*, areas_direito(id, nome, slug)')
    .eq('id', id)

  const { data: skill } = user && !isAdmin
    ? await query.or(`status.in.(ativo,aprovado),autor_id.eq.${user.id}`).single()
    : isAdmin
      ? await query.single()
      : await query.in('status', ['ativo', 'aprovado']).single()

  if (!skill) notFound()

  const isOwner = user?.id === skill.autor_id
  const isPending = skill.status === 'pendente' || skill.status === 'inativo'

  const autorProfile = skill.autor_id
    ? (await supabase.from('profiles').select('full_name, email, bio, instituicao').eq('id', skill.autor_id).single()).data
    : null

  const { data: votosData } = await (supabase as any)
    .from('skill_votos_contagem')
    .select('total_votos')
    .eq('skill_id', id)
    .single()
  const totalVotos: number = votosData?.total_votos ?? 0

  let userVoted = false
  if (user) {
    const { data: votoUser } = await (supabase as any)
      .from('skill_votos')
      .select('id')
      .eq('skill_id', id)
      .eq('user_id', user.id)
      .single()
    userVoted = !!votoUser
  }

  const { data: comentarios } = await (supabase as any)
    .from('skill_comentarios')
    .select('id, conteudo, created_at, autor_id, profiles(full_name, email)')
    .eq('skill_id', id)
    .order('created_at', { ascending: true })

  const tipoInfo = TIPOS[skill.tipo] ?? TIPOS.skill
  const statusMap: Record<string, { label: string; color: string }> = {
    pendente: { label: 'Aguardando aprovação', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    inativo:  { label: 'Inativo',              color: 'bg-zinc-500/10 text-zinc-400 border-zinc-700' },
    aprovado: { label: 'Aprovado',             color: 'bg-green-500/10 text-green-400 border-green-500/20' },
    ativo:    { label: 'Ativo',                color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  }
  const statusInfo = statusMap[skill.status]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Link href="/skills" className="text-sm text-zinc-500 hover:text-white transition-colors flex items-center gap-1">
          ← Skills MD
        </Link>
      </div>

      {isPending && (isOwner || isAdmin) && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <span className={`px-2.5 py-1 rounded-full text-xs border font-medium ${statusInfo?.color}`}>
            {statusInfo?.label}
          </span>
          <p className="text-sm text-zinc-400">
            {isAdmin
              ? 'Visível apenas para você (admin) e o autor.'
              : 'Sua skill está aguardando revisão. Apenas você e os administradores podem vê-la.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-start gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {skill.destaque && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-xs border border-yellow-500/20 font-medium">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    Destaque
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-xs border ${tipoInfo.color}`}>{tipoInfo.label}</span>
              </div>
              <h1 className="text-2xl font-bold text-white">{skill.titulo}</h1>
            </div>
            <SkillUpvoteButton
              skillId={id}
              initialCount={totalVotos}
              initialVoted={userVoted}
              userId={user?.id ?? null}
            />
          </div>

          {skill.descricao && (
            <p className="text-zinc-400 mb-6 leading-relaxed">{skill.descricao}</p>
          )}

          <div className="relative">
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
              <a
                href={`data:text/markdown;charset=utf-8,${encodeURIComponent(skill.conteudo_md)}`}
                download={`${skill.titulo.replace(/\s+/g, '-').toLowerCase()}.md`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-colors border border-zinc-700"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                .md
              </a>
              <CopyButton text={skill.conteudo_md} />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 pr-28">
              <pre className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed font-mono">
                {skill.conteudo_md}
              </pre>
            </div>
          </div>

          {skill.tags?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {skill.tags.map((tag: string) => (
                <span key={tag} className="px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-400 text-xs">#{tag}</span>
              ))}
            </div>
          )}

          <SkillComentariosSection
            skillId={id}
            comentarios={comentarios ?? []}
            userId={user?.id ?? null}
            isAdmin={isAdmin}
          />
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Informações</h3>
            <dl className="space-y-2.5">
              <div>
                <dt className="text-xs text-zinc-600">Tipo</dt>
                <dd className="mt-0.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${tipoInfo.color}`}>{tipoInfo.label}</span>
                </dd>
              </div>
              {skill.areas_direito && (
                <div>
                  <dt className="text-xs text-zinc-600">Área do Direito</dt>
                  <dd className="text-sm text-green-400">{skill.areas_direito.nome}</dd>
                </div>
              )}
              {skill.compatibilidade?.length > 0 && (
                <div>
                  <dt className="text-xs text-zinc-600">Compatível com</dt>
                  <dd className="flex flex-wrap gap-1 mt-0.5">
                    {skill.compatibilidade.map((c: string) => (
                      <span key={c} className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs border border-zinc-700">{c}</span>
                    ))}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-zinc-600">Publicada em</dt>
                <dd className="text-sm text-zinc-300">
                  {new Date(skill.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-600">Status</dt>
                <dd className="mt-0.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${statusInfo?.color}`}>{statusInfo?.label}</span>
                </dd>
              </div>
            </dl>
          </div>

          {autorProfile && (
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Autor</h3>
              <Link href={`/u/${skill.autor_id}`} className="flex items-start gap-3 group">
                <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-white text-sm flex-shrink-0 group-hover:border-zinc-500 transition-colors">
                  {(autorProfile.full_name ?? autorProfile.email ?? '?')[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium group-hover:text-green-300 transition-colors">
                    {autorProfile.full_name ?? autorProfile.email}
                  </p>
                  {autorProfile.instituicao && (
                    <p className="text-xs text-zinc-500 mt-0.5">{autorProfile.instituicao}</p>
                  )}
                  <p className="text-xs text-zinc-600 mt-1 group-hover:text-green-400 transition-colors">Ver perfil →</p>
                </div>
              </Link>
            </div>
          )}

          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 text-center">
            <p className="text-xs text-zinc-500 mb-3">Tem uma skill para compartilhar?</p>
            <Link
              href={user ? '/dashboard/nova-skill' : '/signup'}
              className="block w-full py-2 rounded-lg bg-white text-zinc-950 text-sm font-medium hover:bg-zinc-100 transition-colors"
            >
              {user ? 'Compartilhar skill' : 'Criar conta'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
