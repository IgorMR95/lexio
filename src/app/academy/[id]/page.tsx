import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const tipoConfig: Record<string, { label: string; gradient: string; accent: string; iconBg: string }> = {
  curso: {
    label: 'Curso',
    gradient: 'from-violet-900/60 via-zinc-900 to-zinc-950',
    accent: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    iconBg: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
  },
  video: {
    label: 'Vídeo',
    gradient: 'from-rose-900/50 via-zinc-900 to-zinc-950',
    accent: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    iconBg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
  },
  artigo: {
    label: 'Artigo',
    gradient: 'from-sky-900/50 via-zinc-900 to-zinc-950',
    accent: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    iconBg: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
  },
  texto: {
    label: 'Texto',
    gradient: 'from-emerald-900/50 via-zinc-900 to-zinc-950',
    accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  },
}

const nivelConfig: Record<string, { color: string; dot: string }> = {
  Iniciante: { color: 'text-green-400 bg-green-500/10 border-green-500/20', dot: 'bg-green-400' },
  Intermediário: { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-400' },
  Avançado: { color: 'text-red-400 bg-red-500/10 border-red-500/20', dot: 'bg-red-400' },
}

function TipoIcon({ tipo }: { tipo: string }) {
  if (tipo === 'curso') return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  )
  if (tipo === 'video') return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
  if (tipo === 'artigo') return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
  return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h10" />
    </svg>
  )
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

  // Busca mais conteúdos da mesma categoria para o sidebar
  const { data: relacionados } = await supabase
    .from('academy_conteudos')
    .select('id, titulo, tipo, nivel, duracao')
    .eq('publicado', true)
    .neq('id', c.id)
    .eq('categoria', c.categoria ?? '')
    .order('ordem')
    .limit(5)

  const cfg = tipoConfig[c.tipo] ?? tipoConfig.texto
  const nivelCfg = c.nivel ? nivelConfig[c.nivel] : null

  const videoSrc = c.url_video
    ? c.url_video
        .replace('youtube.com/watch?v=', 'youtube.com/embed/')
        .replace('youtu.be/', 'youtube.com/embed/')
    : null

  return (
    <div className="min-h-screen">
      {/* ── Header Hero ── */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${cfg.gradient} border-b border-zinc-800`}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-8">
            <Link href="/academy" className="text-zinc-500 hover:text-white transition-colors">Midori Academy</Link>
            {c.categoria && (
              <>
                <span className="text-zinc-700">/</span>
                <span className="text-zinc-500">{c.categoria}</span>
              </>
            )}
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-300 line-clamp-1 max-w-xs">{c.titulo}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            {/* Título e meta — 2/3 */}
            <div className="lg:col-span-2">
              {!c.publicado && isAdmin && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Rascunho — visível apenas para admins
                </div>
              )}

              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${cfg.accent}`}>
                  <TipoIcon tipo={c.tipo} />
                  {cfg.label}
                </span>
                {nivelCfg && (
                  <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${nivelCfg.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${nivelCfg.dot}`} />
                    {c.nivel}
                  </span>
                )}
                {c.categoria && (
                  <span className="text-xs px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">{c.categoria}</span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">{c.titulo}</h1>
              {c.descricao && (
                <p className="text-zinc-400 text-lg leading-relaxed mb-6">{c.descricao}</p>
              )}

              <div className="flex items-center gap-5 text-sm text-zinc-500 flex-wrap">
                {c.duracao && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {c.duracao}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(c.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Card CTA — 1/3 (apenas em desktop, no hero) */}
            <div className="hidden lg:block">
              <div className="rounded-2xl border border-zinc-700 bg-zinc-900/80 backdrop-blur-sm p-6 shadow-2xl">
                <div className={`w-full h-28 rounded-xl bg-gradient-to-br ${cfg.gradient} border border-zinc-700 flex items-center justify-center mb-5`}>
                  <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center ${cfg.iconBg}`}>
                    <TipoIcon tipo={c.tipo} />
                  </div>
                </div>
                {c.url_externo ? (
                  <a href={c.url_externo} target="_blank" rel="noopener noreferrer"
                    className="block w-full py-3 rounded-xl bg-white text-zinc-950 font-bold text-sm text-center hover:bg-zinc-100 transition-colors mb-3">
                    {c.tipo === 'curso' ? 'Acessar curso completo' : c.tipo === 'video' ? 'Assistir no YouTube' : 'Acessar conteúdo'}
                  </a>
                ) : (
                  <div className="block w-full py-3 rounded-xl bg-white/5 border border-zinc-700 text-zinc-500 font-medium text-sm text-center mb-3 cursor-default">
                    Conteúdo disponível abaixo
                  </div>
                )}
                {isAdmin && (
                  <Link href={`/gestao?tab=academy&edit=${c.id}`}
                    className="block w-full py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-xs font-medium text-center hover:text-white hover:border-zinc-500 transition-colors">
                    Editar conteúdo
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Corpo ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Conteúdo principal — 2/3 */}
          <div className="lg:col-span-2 space-y-8">

            {/* Vídeo embed */}
            {c.tipo === 'video' && videoSrc && (
              <div className="rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl shadow-black/40 aspect-video">
                <iframe src={videoSrc} className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen />
              </div>
            )}

            {/* Botão externo (mobile / não-curso) */}
            {c.url_externo && (
              <div className="lg:hidden">
                <a href={c.url_externo} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-white text-zinc-950 font-bold text-sm hover:bg-zinc-100 transition-colors shadow-lg">
                  {c.tipo === 'curso' ? 'Acessar curso completo' : c.tipo === 'video' ? 'Assistir no YouTube' : 'Acessar conteúdo'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}

            {/* Conteúdo em texto */}
            {c.conteudo && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
                <div className="text-zinc-300 leading-relaxed text-[15px] whitespace-pre-wrap font-sans"
                  style={{ lineHeight: '1.8' }}>
                  {c.conteudo}
                </div>
              </div>
            )}

            {/* Nada para mostrar */}
            {!c.conteudo && !videoSrc && !c.url_externo && (
              <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl">
                <p className="text-zinc-500">Conteúdo em preparação.</p>
              </div>
            )}
          </div>

          {/* Sidebar — 1/3 */}
          <div className="space-y-6">
            {/* CTA card (mobile — repetido do hero de forma simplificada) */}
            {c.url_externo && (
              <div className="lg:hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <a href={c.url_externo} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white text-zinc-950 font-bold text-sm hover:bg-zinc-100 transition-colors">
                  {c.tipo === 'curso' ? 'Acessar curso' : 'Ver conteúdo'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}

            {/* O que você vai aprender / detalhes */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Detalhes</h3>
              <dl className="space-y-3">
                <div className="flex items-center justify-between">
                  <dt className="text-xs text-zinc-500">Tipo</dt>
                  <dd className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.accent}`}>{cfg.label}</dd>
                </div>
                {c.nivel && nivelCfg && (
                  <div className="flex items-center justify-between">
                    <dt className="text-xs text-zinc-500">Nível</dt>
                    <dd className={`text-xs font-medium px-2 py-0.5 rounded-full border ${nivelCfg.color}`}>{c.nivel}</dd>
                  </div>
                )}
                {c.duracao && (
                  <div className="flex items-center justify-between">
                    <dt className="text-xs text-zinc-500">Duração</dt>
                    <dd className="text-xs text-zinc-300">{c.duracao}</dd>
                  </div>
                )}
                {c.categoria && (
                  <div className="flex items-center justify-between">
                    <dt className="text-xs text-zinc-500">Categoria</dt>
                    <dd className="text-xs text-zinc-300">{c.categoria}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Conteúdos relacionados */}
            {relacionados && relacionados.length > 0 && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Mais em {c.categoria}</h3>
                <div className="space-y-3">
                  {relacionados.map(r => {
                    const rCfg = tipoConfig[r.tipo] ?? tipoConfig.texto
                    return (
                      <Link key={r.id} href={`/academy/${r.id}`}
                        className="flex items-start gap-3 group p-2 rounded-xl hover:bg-zinc-800/50 transition-colors -mx-2">
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${rCfg.iconBg}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-zinc-300 group-hover:text-white transition-colors leading-snug line-clamp-2">{r.titulo}</p>
                          {r.duracao && <p className="text-xs text-zinc-600 mt-0.5">{r.duracao}</p>}
                        </div>
                      </Link>
                    )
                  })}
                </div>
                <Link href="/academy" className="block mt-4 text-xs text-zinc-500 hover:text-white transition-colors text-center">
                  Ver todos os conteúdos →
                </Link>
              </div>
            )}

            {/* Voltar */}
            <Link href="/academy"
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors group">
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar para o Academy
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
