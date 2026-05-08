'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Conteudo {
  id: string
  tipo: string
  titulo: string
  descricao: string | null
  nivel: string | null
  categoria: string | null
  duracao: string | null
  url_externo: string | null
  url_video: string | null
  ordem: number
  created_at: string
}

const TIPOS = [
  { id: 'todos', label: 'Todos' },
  { id: 'curso', label: 'Cursos' },
  { id: 'video', label: 'Vídeos' },
  { id: 'artigo', label: 'Artigos' },
  { id: 'texto', label: 'Textos' },
]

const tipoConfig: Record<string, { label: string; icon: React.ReactNode; gradient: string; accent: string }> = {
  curso: {
    label: 'Curso',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      </svg>
    ),
    gradient: 'from-violet-600/30 to-indigo-600/10',
    accent: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  },
  video: {
    label: 'Vídeo',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    gradient: 'from-rose-600/30 to-orange-600/10',
    accent: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  },
  artigo: {
    label: 'Artigo',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    gradient: 'from-sky-600/30 to-cyan-600/10',
    accent: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  },
  texto: {
    label: 'Texto',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h10" />
      </svg>
    ),
    gradient: 'from-emerald-600/30 to-teal-600/10',
    accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
}

const nivelConfig: Record<string, { label: string; color: string; dot: string }> = {
  Iniciante: { label: 'Iniciante', color: 'text-green-400 bg-green-500/10 border-green-500/20', dot: 'bg-green-400' },
  Intermediário: { label: 'Intermediário', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-400' },
  Avançado: { label: 'Avançado', color: 'text-red-400 bg-red-500/10 border-red-500/20', dot: 'bg-red-400' },
}

function ConteudoCard({ c }: { c: Conteudo }) {
  const tipo = tipoConfig[c.tipo] ?? tipoConfig.texto
  const nivel = c.nivel ? nivelConfig[c.nivel] : null

  return (
    <Link href={`/academy/${c.id}`} className="group flex flex-col rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 hover:border-zinc-600 hover:shadow-xl hover:shadow-black/40 transition-all duration-200">
      {/* Thumbnail */}
      <div className={`relative h-36 bg-gradient-to-br ${tipo.gradient} flex items-center justify-center`}>
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${tipo.accent} backdrop-blur-sm`}>
          <span className={tipo.accent.split(' ')[0]}>{tipo.icon}</span>
        </div>
        {/* Tipo label */}
        <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full border ${tipo.accent}`}>
          {tipo.label}
        </span>
        {/* Duração */}
        {c.duracao && (
          <span className="absolute bottom-3 right-3 text-xs text-white/70 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {c.duracao}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="font-semibold text-white text-sm leading-snug mb-2 group-hover:text-zinc-100 transition-colors line-clamp-2">
          {c.titulo}
        </h3>
        {c.descricao && (
          <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 flex-1 mb-4">{c.descricao}</p>
        )}
        <div className="flex items-center justify-between mt-auto">
          {nivel ? (
            <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${nivel.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${nivel.dot}`} />
              {nivel.label}
            </span>
          ) : (
            <span />
          )}
          <span className="text-xs text-zinc-600 group-hover:text-zinc-400 transition-colors flex items-center gap-1">
            Acessar
            <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  )
}

export function AcademyClient({ conteudos }: { conteudos: Conteudo[] }) {
  const [filtroTipo, setFiltroTipo] = useState('todos')

  const filtrados = filtroTipo === 'todos' ? conteudos : conteudos.filter(c => c.tipo === filtroTipo)
  const categorias = Array.from(new Set(filtrados.map(c => c.categoria ?? 'Geral')))

  const totalCursos = conteudos.filter(c => c.tipo === 'curso').length
  const totalVideos = conteudos.filter(c => c.tipo === 'video').length
  const totalArtigos = conteudos.filter(c => c.tipo === 'artigo' || c.tipo === 'texto').length

  const vazioTotal = conteudos.length === 0
  const vazioFiltro = !vazioTotal && filtrados.length === 0

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden border-b border-zinc-800">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'linear-gradient(to right, #18181b 1px, transparent 1px), linear-gradient(to bottom, #18181b 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[200px] bg-indigo-600/10 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Plataforma de aprendizado jurídico
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
              Aprenda a usar{' '}
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                IA no Direito
              </span>
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed mb-8">
              Cursos, vídeos e artigos para advogados, magistrados, defensores e acadêmicos que querem dominar a inteligência artificial na prática jurídica.
            </p>
            <div className="flex items-center gap-6">
              <a href="/signup" className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-violet-900/30">
                Começar gratuitamente
              </a>
              <a href="#conteudos" className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5">
                Ver conteúdos
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </div>
          </div>

          {/* Stats */}
          {!vazioTotal && (
            <div className="mt-12 flex items-center gap-8 flex-wrap">
              {[
                { value: conteudos.length, label: 'conteúdos disponíveis' },
                ...(totalCursos > 0 ? [{ value: totalCursos, label: 'cursos' }] : []),
                ...(totalVideos > 0 ? [{ value: totalVideos, label: 'vídeos' }] : []),
                ...(totalArtigos > 0 ? [{ value: totalArtigos, label: 'artigos e textos' }] : []),
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white">{s.value}</span>
                  <span className="text-sm text-zinc-500">{s.label}</span>
                  {i < 3 && <span className="text-zinc-700 ml-6">·</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Conteúdos ── */}
      <div id="conteudos" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

        {/* Filtro */}
        <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-1">
          {TIPOS.map(t => {
            const count = t.id === 'todos' ? conteudos.length : conteudos.filter(c => c.tipo === t.id).length
            return (
              <button
                key={t.id}
                onClick={() => setFiltroTipo(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap border ${
                  filtroTipo === t.id
                    ? 'bg-white text-zinc-950 border-white shadow-md'
                    : 'text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-600 bg-zinc-900/50'
                }`}
              >
                {t.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${filtroTipo === t.id ? 'bg-zinc-200 text-zinc-700' : 'bg-zinc-800 text-zinc-500'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Estado vazio total */}
        {vazioTotal && (
          <div className="text-center py-32">
            <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-6">
              <svg className="w-9 h-9 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Conteúdos em preparação</h3>
            <p className="text-zinc-500 max-w-sm mx-auto">Os primeiros materiais do Midori Academy estão sendo produzidos. Volte em breve.</p>
          </div>
        )}

        {/* Estado vazio por filtro */}
        {vazioFiltro && (
          <div className="text-center py-24">
            <p className="text-zinc-500">Nenhum conteúdo desse tipo ainda.</p>
            <button onClick={() => setFiltroTipo('todos')} className="mt-3 text-sm text-violet-400 hover:text-violet-300 transition-colors">
              Ver todos os conteúdos →
            </button>
          </div>
        )}

        {/* Grade agrupada por categoria */}
        {!vazioTotal && !vazioFiltro && (
          <div className="space-y-14">
            {categorias.map(cat => {
              const itens = filtrados.filter(c => (c.categoria ?? 'Geral') === cat)
              if (!itens.length) return null
              return (
                <section key={cat}>
                  <div className="flex items-center gap-4 mb-6">
                    <h2 className="text-lg font-bold text-white">{cat}</h2>
                    <div className="flex-1 h-px bg-zinc-800" />
                    <span className="text-xs text-zinc-600">{itens.length} {itens.length === 1 ? 'item' : 'itens'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {itens.map(c => <ConteudoCard key={c.id} c={c} />)}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>

      {/* ── CTA Banner ── */}
      <div className="border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900/50 via-zinc-900 to-indigo-900/30 border border-violet-500/20 p-10 text-center">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
            <div className="relative">
              <h2 className="text-2xl font-bold text-white mb-3">Faça parte da comunidade</h2>
              <p className="text-zinc-400 mb-8 max-w-lg mx-auto">
                Crie sua conta gratuitamente e acesse todos os conteúdos do Midori Academy. Aprenda no seu ritmo.
              </p>
              <div className="flex items-center gap-4 justify-center">
                <a href="/signup" className="px-6 py-3 rounded-xl bg-white text-zinc-950 font-bold text-sm hover:bg-zinc-100 transition-colors shadow-xl">
                  Criar conta grátis
                </a>
                <a href="/prompts" className="px-6 py-3 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-medium hover:border-zinc-500 hover:text-white transition-colors">
                  Explorar prompts
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
