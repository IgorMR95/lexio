import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CopyButton } from '@/components/ui/CopyButton'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PromptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()

  const { data: prompt } = await supabase
    .from('prompts')
    .select(`
      *,
      categorias_principais(id, nome, slug),
      subcategorias(id, nome, slug),
      subniveis(id, nome, slug),
      areas_direito(id, nome, slug),
      profiles(full_name, email)
    `)
    .eq('id', id)
    .in('status', ['ativo', 'aprovado'])
    .single()

  if (!prompt) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = user
    ? (await supabase.from('profiles').select('role').eq('id', user.id).single()).data?.role === 'admin'
    : false

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Link href="/prompts" className="text-sm text-zinc-500 hover:text-white transition-colors flex items-center gap-1">
          ← Base de Prompts
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Conteúdo principal */}
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold text-white mb-3">{prompt.titulo}</h1>

          {prompt.descricao_curta && (
            <p className="text-zinc-400 mb-6 leading-relaxed">{prompt.descricao_curta}</p>
          )}

          <div className="relative">
            <div className="absolute top-3 right-3 z-10">
              <CopyButton text={prompt.texto_completo} />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 pr-24">
              <pre className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed font-sans">
                {prompt.texto_completo}
              </pre>
            </div>
          </div>

          {prompt.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {(prompt.tags as string[]).map(tag => (
                <span key={tag} className="px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-400 text-xs">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {isAdmin && (
            <div className="mt-6 flex gap-3">
              <Link
                href={`/admin/prompts/${prompt.id}/edit`}
                className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors"
              >
                Editar
              </Link>
              <form action={`/api/prompts/${prompt.id}/delete`} method="POST">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-sm hover:bg-red-500/20 transition-colors"
                >
                  Deletar
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Sidebar com metadados */}
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
                  <dd className="text-sm text-blue-400">{(prompt as any).areas_direito.nome}</dd>
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
                  {new Date(prompt.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </dd>
              </div>
              {(prompt as any).profiles?.full_name && (
                <div>
                  <dt className="text-xs text-zinc-600">Autor</dt>
                  <dd className="text-sm text-zinc-300">{(prompt as any).profiles.full_name}</dd>
                </div>
              )}
            </dl>
          </div>

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
