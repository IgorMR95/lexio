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
  { id: 'artigo', label: 'Artigos' },
  { id: 'video', label: 'Vídeos' },
  { id: 'texto', label: 'Textos' },
]

const tipoIcon: Record<string, string> = {
  curso: '🎓',
  artigo: '📄',
  video: '▶',
  texto: '📝',
}

const nivelColor: Record<string, string> = {
  Iniciante: 'text-green-400 bg-green-500/10 border-green-500/20',
  Intermediário: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Avançado: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
}

export function AcademyClient({ conteudos }: { conteudos: Conteudo[] }) {
  const [filtroTipo, setFiltroTipo] = useState('todos')

  const filtrados = filtroTipo === 'todos' ? conteudos : conteudos.filter(c => c.tipo === filtroTipo)

  // Agrupa por categoria para exibição
  const categorias = Array.from(new Set(filtrados.map(c => c.categoria ?? 'Geral')))

  const vazioTotal = conteudos.length === 0
  const vazioFiltro = !vazioTotal && filtrados.length === 0

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-white mb-3">Midori Academy</h1>
        <p className="text-zinc-500 max-w-xl mx-auto">
          Cursos, artigos, vídeos e textos sobre o uso de inteligência artificial no direito.
          Para advogados, magistrados, defensores e acadêmicos.
        </p>
      </div>

      {/* Filtro de tipo */}
      <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg mb-10 w-fit mx-auto overflow-x-auto">
        {TIPOS.map(t => (
          <button
            key={t.id}
            onClick={() => setFiltroTipo(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              filtroTipo === t.id ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t.label}
            {t.id !== 'todos' && (
              <span className="ml-1.5 text-xs opacity-60">
                {conteudos.filter(c => c.tipo === t.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Estado vazio total */}
      {vazioTotal && (
        <div className="text-center py-24 border border-dashed border-zinc-800 rounded-2xl">
          <p className="text-zinc-400 font-medium text-lg mb-2">Em breve</p>
          <p className="text-zinc-600 text-sm">Os primeiros conteúdos estão sendo preparados.</p>
        </div>
      )}

      {/* Estado vazio por filtro */}
      {vazioFiltro && (
        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl">
          <p className="text-zinc-500 text-sm">Nenhum conteúdo nessa categoria ainda.</p>
        </div>
      )}

      {/* Conteúdo agrupado por categoria */}
      {!vazioTotal && !vazioFiltro && (
        <div className="space-y-12">
          {categorias.map(cat => {
            const itens = filtrados.filter(c => (c.categoria ?? 'Geral') === cat)
            if (!itens.length) return null
            return (
              <div key={cat}>
                <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">{cat}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {itens.map(c => (
                    <Link
                      key={c.id}
                      href={`/academy/${c.id}`}
                      className="group p-5 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-zinc-600 hover:bg-zinc-900/60 transition-all relative overflow-hidden flex flex-col"
                    >
                      {/* Tipo badge top-right */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        {c.nivel && (
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${nivelColor[c.nivel]}`}>
                            {c.nivel}
                          </span>
                        )}
                      </div>

                      {/* Ícone tipo */}
                      <span className="text-2xl mb-3 block">{tipoIcon[c.tipo]}</span>

                      <h3 className="font-semibold text-white text-sm mb-2 pr-16 group-hover:text-zinc-200 transition-colors leading-snug">
                        {c.titulo}
                      </h3>

                      {c.descricao && (
                        <p className="text-xs text-zinc-500 leading-relaxed mb-4 line-clamp-2 flex-1">{c.descricao}</p>
                      )}

                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-800/60">
                        <span className="text-xs text-zinc-600 capitalize">{c.tipo}</span>
                        {c.duracao && (
                          <span className="text-xs text-zinc-600 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {c.duracao}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* CTA */}
      <div className="mt-16 p-8 rounded-2xl border border-zinc-800 bg-zinc-900/30 text-center">
        <h2 className="text-lg font-bold text-white mb-2">Quer contribuir com conteúdo?</h2>
        <p className="text-zinc-500 text-sm mb-5">
          Crie sua conta e faça parte da comunidade jurídica do Midori.
        </p>
        <a href="/signup" className="inline-block px-6 py-2.5 rounded-lg bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors">
          Criar conta grátis
        </a>
      </div>
    </div>
  )
}
