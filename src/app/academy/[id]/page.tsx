import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const tipoIcon: Record<string, string> = {
  curso: '🎓',
  artigo: '📄',
  video: '▶',
  texto: '📝',
}

const nivelColor: Record<string, string> = {
  Iniciante: 'bg-green-500/10 text-green-400 border-green-500/20',
  Intermediário: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Avançado: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

export default async function AcademyConteudoPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = user
    ? (await supabase.from('profiles').select('role').eq('id', user.id).single()).data?.role === 'admin'
    : false

  const { data: c } = await supabase
    .from('academy_conteudos')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!c || (!c.publicado && !isAdmin)) notFound()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <Link href="/academy" className="text-sm text-zinc-500 hover:text-white transition-colors">
          ← Midori Academy
        </Link>
      </div>

      {!c.publicado && isAdmin && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <span className="px-2.5 py-1 rounded-full text-xs border bg-amber-500/10 text-amber-400 border-amber-500/20 font-medium">Rascunho</span>
          <p className="text-sm text-zinc-400">Visível apenas para administradores.</p>
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 capitalize">
            {tipoIcon[c.tipo]} {c.tipo}
          </span>
          {c.nivel && (
            <span className={`text-xs px-2.5 py-1 rounded-full border ${nivelColor[c.nivel]}`}>{c.nivel}</span>
          )}
          {c.categoria && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-500 border border-zinc-700">{c.categoria}</span>
          )}
          {c.duracao && (
            <span className="text-xs text-zinc-600 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {c.duracao}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">{c.titulo}</h1>
        {c.descricao && <p className="text-zinc-400 leading-relaxed">{c.descricao}</p>}
      </div>

      {/* Vídeo embed */}
      {c.tipo === 'video' && c.url_video && (
        <div className="mb-8 rounded-xl overflow-hidden border border-zinc-800 aspect-video">
          <iframe
            src={c.url_video.includes('youtube.com/watch') ? c.url_video.replace('watch?v=', 'embed/') : c.url_video}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Link externo para cursos */}
      {c.url_externo && (
        <div className="mb-8">
          <a
            href={c.url_externo}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors"
          >
            {c.tipo === 'curso' ? 'Acessar curso' : c.tipo === 'video' ? 'Assistir no YouTube' : 'Acessar conteúdo'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}

      {/* Conteúdo principal (texto/markdown simples) */}
      {c.conteudo && (
        <div className="prose prose-invert prose-zinc max-w-none">
          <div className="text-zinc-300 leading-relaxed text-sm whitespace-pre-wrap">{c.conteudo}</div>
        </div>
      )}

      {isAdmin && (
        <div className="mt-10 pt-6 border-t border-zinc-800 flex justify-end">
          <Link
            href={`/gestao?tab=academy&edit=${c.id}`}
            className="text-xs text-zinc-500 hover:text-white transition-colors border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded-lg"
          >
            Editar este conteúdo →
          </Link>
        </div>
      )}
    </div>
  )
}
