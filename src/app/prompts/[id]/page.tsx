import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CopyButton } from '@/components/ui/CopyButton'
import { UpvoteButton } from '@/components/ui/UpvoteButton'
import { ComentariosSection } from '@/components/ui/ComentariosSection'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PromptPage({ params }: { params: { id: string } }) {
  const { id } = params
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = user
    ? (await supabase.from('profiles').select('role').eq('id', user.id).single()).data?.role === 'admin'
    : false

  const query = supabase
    .from('prompts')
    .select(`*, categorias_principais(id, nome, slug), subcategorias(id, nome, slug), subniveis(id, nome, slug), areas_direito(id, nome, slug)`)
    .eq('id', id)

  const { data: prompt } = user && !isAdmin
    ? await query.or(`status.in.(ativo,aprovado),autor_id.eq.${user.id}`).single()
    : isAdmin
      ? await query.single()
      : await query.in('status', ['ativo', 'aprovado']).single()

  if (!prompt) notFound()

  const isOwner = user?.id === (prompt as any).autor_id
  const isPending = (prompt as any).status === 'pendente' || (prompt as any).status === 'inativo'

  const autorId = (prompt as any).autor_id
  const autorProfile = autorId
    ? (await supabase.from('profiles').select('full_name, email, bio, instituicao').eq('id', autorId).single()).data
    : null

  // Contagem de votos
  const { data: votosData } = await (supabase as any)
    .from('prompt_votos_contagem')
    .select('total_votos')
    .eq('prompt_id', id)
    .single()
  const totalVotos: number = votosData?.total_votos ?? 0

  // Verificar se o usuário atual já votou
  let userVoted = false
  if (user) {
    const { data: votoUser } = await (supabase as any)
      .from('prompt_votos')
      .select('id')
      .eq('prompt_id', id)
      .eq('user_id', user.id)
      .single()
    userVoted = !!votoUser
  }

  const isDestaque = !!(prompt as any).destaque

  // Comentários
  const { data: comentarios } = await (supabase as any)
    .from('prompt_comentarios')
    .select('id, conteudo, created_at, autor_id, profiles(full_name, email)')
    .eq('prompt_id', id)
    .order('created_at', { ascending: true })

  const statusMap: Record<string, { label: string; color: string }> = {
    pendente: { label: 'Aguardando aprovação', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    inativo:  { label: 'Inativo',              color: 'bg-zinc-500/10 text-zinc-400 border-zinc-700' },
    aprovado: { label: 'Aprovado',             color: 'bg-green-500/10 text-green-400 border-green-500/20' },
    ativo:    { label: 'Ativo',                color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  }
  const statusInfo = statusMap[(prompt as any).status]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Link href="/prompts" className="text-sm text-zinc-500 hover:text-white transition-colors flex items-center gap-1">
          ← Base de Prompts
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
              : 'Seu prompt está aguardando revisão. Apenas você e os administradores podem vê-lo.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Conteúdo principal */}
        <div className="lg:col-span-2">
          {/* Título + upvote */}
          <div className="flex items-start gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {isDestaque && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-xs border border-yellow-500/20 font-medium">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    Destaque
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-white">{(prompt as any).titulo}</h1>
            </div>
            <UpvoteButton
              promptId={id}
              initialCount={totalVotos}
              initialVoted={userVoted}
              userId={user?.id ?? null}
            />
          </div>

          {(prompt as any).descricao_curta && (
            <p className="text-zinc-400 mb-6 leading-relaxed">{(prompt as any).descricao_curta}</p>
          )}

          <div className="relative">
            <div className="absolute top-3 right-3 z-10">
              <CopyButton text={(prompt as any).texto_completo} />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 pr-24">
              <pre className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed font-sans">
                {(prompt as any).texto_completo}
              </pre>
            </div>
          </div>

          {(prompt as any).tags?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {((prompt as any).tags as string[]).map((tag: string) => (
                <span key={tag} className="px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-400 text-xs">#{tag}</span>
              ))}
            </div>
          )}

          <ComentariosSection
            promptId={id}
            comentarios={comentarios ?? []}
            userId={user?.id ?? null}
            isAdmin={isAdmin}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Classificação</h3>
            <dl className="space-y-2.5">
              {(prompt as any).categorias_principais && (
                <div>
                  <dt className="text-xs text-zinc-600">Categoria</dt>
                  <dd className="text-sm text-zinc-300">{(prompt as any).categorias_principais.nome}</dd>
                </div>
              )}
              {(prompt as any).subcategorias && (
                <div>
                  <dt className="text-xs text-zinc-600">Subcategoria</dt>
                  <dd className="text-sm text-zinc-300">{(prompt as any).subcategorias.nome}</dd>
                </div>
              )}
              {(prompt as any).subniveis && (
                <div>
                  <dt className="text-xs text-zinc-600">Subnível</dt>
                  <dd className="text-sm text-zinc-300">{(prompt as any).subniveis.nome}</dd>
                </div>
              )}
              {(prompt as any).areas_direito && (
                <div>
                  <dt className="text-xs text-zinc-600">Área do Direito</dt>
                  <dd className="text-sm text-green-400">{(prompt as any).areas_direito.nome}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Informações</h3>
            <dl className="space-y-2.5">
              <div>
                <dt className="text-xs text-zinc-600">Publicado em</dt>
                <dd className="text-sm text-zinc-300">
                  {new Date((prompt as any).created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </dd>
              </div>
              {(prompt as any).internacional && (
                <div>
                  <dt className="text-xs text-zinc-600">Origem</dt>
                  <dd className="text-sm">
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 text-xs border border-teal-500/20">
                      Internacional{(prompt as any).idioma ? ` · ${(prompt as any).idioma.toUpperCase()}` : ''}
                    </span>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-zinc-600">Status</dt>
                <dd className="mt-0.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${statusInfo?.color}`}>
                    {statusInfo?.label}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {autorProfile && (
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Autor</h3>
              <Link href={`/u/${autorId}`} className="flex items-start gap-3 group">
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
                  {autorProfile.bio && (
                    <p className="text-xs text-zinc-600 mt-1 line-clamp-2">{autorProfile.bio}</p>
                  )}
                  <p className="text-xs text-zinc-600 mt-1 group-hover:text-green-400 transition-colors">Ver perfil →</p>
                </div>
              </Link>
            </div>
          )}

          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 text-center">
            <p className="text-xs text-zinc-500 mb-3">Tem um prompt para compartilhar?</p>
            <Link
              href={user ? '/dashboard/novo-prompt' : '/signup'}
              className="block w-full py-2 rounded-lg bg-white text-zinc-950 text-sm font-medium hover:bg-zinc-100 transition-colors"
            >
              {user ? 'Enviar prompt' : 'Criar conta'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
