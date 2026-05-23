import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CopyButton } from '@/components/ui/CopyButton'
import { UpvoteButton } from '@/components/ui/UpvoteButton'
import { ComentariosSection } from '@/components/ui/ComentariosSection'
import { UsePromptButtons } from '@/components/ui/UsePromptButtons'
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

  const [
    autorProfileResult,
    autorPromptsResult,
    autorVotosResult,
  ] = await Promise.all([
    autorId
      ? supabase.from('profiles').select('full_name, email, bio, instituicao').eq('id', autorId).single()
      : Promise.resolve({ data: null }),
    autorId
      ? supabase.from('prompts').select('id', { count: 'exact', head: true }).eq('autor_id', autorId).in('status', ['ativo', 'aprovado'])
      : Promise.resolve({ count: 0 }),
    autorId
      ? (async () => {
          const { data: promptIds } = await supabase.from('prompts').select('id').eq('autor_id', autorId).in('status', ['ativo', 'aprovado'])
          if (!promptIds?.length) return { count: 0 }
          return (supabase as any).from('prompt_votos').select('id', { count: 'exact', head: true }).in('prompt_id', promptIds.map((p: any) => p.id))
        })()
      : Promise.resolve({ count: 0 }),
  ])

  const autorProfile = autorProfileResult.data
  const autorPromptsCount: number = autorPromptsResult.count ?? 0
  const autorVotosCount: number = autorVotosResult.count ?? 0

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
                    Destaque editorial
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

          {/* Como usar — instrução rápida */}
          <div className="mb-4 px-4 py-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-500 leading-relaxed">
            <span className="text-zinc-400 font-medium">Como usar: </span>
            Copie o texto abaixo e cole no ChatGPT, Claude ou Gemini. Se houver campos entre colchetes como{' '}
            <span className="text-zinc-300 font-mono">[nome da parte]</span>, substitua pelo texto do seu caso antes de enviar.
          </div>

          <div className="relative">
            <div className="absolute top-3 right-3 z-10">
              <CopyButton text={(prompt as any).texto_completo} promptId={id} />
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

          {/* Botões de uso — card principal */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Usar este prompt</h3>
            <UsePromptButtons text={(prompt as any).texto_completo} promptId={id} />
          </div>

          {/* Curadoria */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Curadoria</h3>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-zinc-400 leading-relaxed">Revisado e aprovado pela equipe editorial antes da publicação</p>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-zinc-400 leading-relaxed">Construído com base em prática jurídica real, não em teoria</p>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-zinc-400 leading-relaxed">Testado nas principais ferramentas de IA disponíveis</p>
              </div>
              {isDestaque && (
                <div className="mt-1 pt-2.5 border-t border-zinc-800">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <p className="text-xs text-zinc-400 leading-relaxed">Marcado como destaque editorial — entre os mais úteis e testados da base</p>
                  </div>
                </div>
              )}
            </div>
          </div>

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

          {autorProfile && (() => {
            const designacao =
              isDestaque
                ? { label: 'Referência Editorial', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' }
                : autorPromptsCount >= 5 && autorVotosCount >= 20
                ? { label: 'Especialista', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' }
                : autorPromptsCount >= 1
                ? { label: 'Contribuidor', color: 'bg-green-500/10 text-green-400 border-green-500/20' }
                : null
            return (
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
                    {designacao && (
                      <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${designacao.color}`}>
                        {designacao.label}
                      </span>
                    )}
                    {(autorPromptsCount > 0 || autorVotosCount > 0) && (
                      <p className="text-xs text-zinc-600 mt-1.5">
                        {autorPromptsCount > 0 && <span>{autorPromptsCount} prompt{autorPromptsCount !== 1 ? 's' : ''} publicado{autorPromptsCount !== 1 ? 's' : ''}</span>}
                        {autorPromptsCount > 0 && autorVotosCount > 0 && <span className="mx-1">·</span>}
                        {autorVotosCount > 0 && <span>{autorVotosCount} voto{autorVotosCount !== 1 ? 's' : ''} recebido{autorVotosCount !== 1 ? 's' : ''}</span>}
                      </p>
                    )}
                    <p className="text-xs text-zinc-600 mt-1 group-hover:text-green-400 transition-colors">Ver perfil →</p>
                  </div>
                </Link>
              </div>
            )
          })()}

          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 text-center">
            <p className="text-xs text-zinc-400 font-medium mb-1">Você tem um prompt que funciona?</p>
            <p className="text-xs text-zinc-600 mb-3 leading-relaxed">Publique e torne-se referência na sua área</p>
            <Link
              href={user ? '/dashboard/novo-prompt' : '/signup'}
              className="block w-full py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm font-medium hover:bg-zinc-700 hover:text-white transition-colors"
            >
              {user ? 'Publicar meu prompt' : 'Criar conta grátis'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
