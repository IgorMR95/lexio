'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { CategoriaPrincipal, Subcategoria, Subnivel, AreaDireito, PromptWithRelations } from '@/lib/supabase/types'

interface Props {
  initialPrompts: PromptWithRelations[]
  categorias: CategoriaPrincipal[]
  subcategorias: Subcategoria[]
  subniveis: Subnivel[]
  areas: AreaDireito[]
}

export function PromptsClient({ initialPrompts, categorias, subcategorias, subniveis, areas }: Props) {
  const [search, setSearch] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState('')
  const [selectedSubcategoria, setSelectedSubcategoria] = useState('')
  const [selectedSubnivel, setSelectedSubnivel] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent')

  const filteredSubcategorias = selectedCategoria
    ? subcategorias.filter(s => s.categoria_id === selectedCategoria)
    : subcategorias

  const filteredSubniveis = selectedSubcategoria
    ? subniveis.filter(s => s.subcategoria_id === selectedSubcategoria)
    : subniveis

  const filtered = useMemo(() => {
    let result = [...initialPrompts]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.titulo.toLowerCase().includes(q) ||
        p.texto_completo.toLowerCase().includes(q) ||
        (p.descricao_curta ?? '').toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      )
    }

    if (selectedCategoria) result = result.filter(p => p.categoria_id === selectedCategoria)
    if (selectedSubcategoria) result = result.filter(p => p.subcategoria_id === selectedSubcategoria)
    if (selectedSubnivel) result = result.filter(p => p.subnivel_id === selectedSubnivel)
    if (selectedArea) result = result.filter(p => p.area_direito_id === selectedArea)

    result.sort((a, b) => {
      const da = new Date(a.created_at).getTime()
      const db = new Date(b.created_at).getTime()
      return sortOrder === 'recent' ? db - da : da - db
    })

    return result
  }, [initialPrompts, search, selectedCategoria, selectedSubcategoria, selectedSubnivel, selectedArea, sortOrder])

  const clearFilters = () => {
    setSearch('')
    setSelectedCategoria('')
    setSelectedSubcategoria('')
    setSelectedSubnivel('')
    setSelectedArea('')
  }

  const hasFilters = search || selectedCategoria || selectedSubcategoria || selectedSubnivel || selectedArea

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Base de Prompts</h1>
        <p className="text-zinc-500 text-sm">{filtered.length} prompt{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Busca + ordenação */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar prompts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 text-sm"
          />
        </div>
        <select
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value as 'recent' | 'oldest')}
          className="px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm focus:outline-none focus:border-zinc-600"
        >
          <option value="recent">Mais recentes</option>
          <option value="oldest">Mais antigos</option>
        </select>
      </div>

      <div className="flex gap-8">
        {/* Sidebar filtros */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-20 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Filtros</span>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-zinc-500 hover:text-white transition-colors">
                  Limpar
                </button>
              )}
            </div>

            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Categoria</label>
              <select
                value={selectedCategoria}
                onChange={e => { setSelectedCategoria(e.target.value); setSelectedSubcategoria(''); setSelectedSubnivel('') }}
                className="w-full px-2.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs focus:outline-none focus:border-zinc-600"
              >
                <option value="">Todas</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>

            {filteredSubcategorias.length > 0 && (
              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Subcategoria</label>
                <select
                  value={selectedSubcategoria}
                  onChange={e => { setSelectedSubcategoria(e.target.value); setSelectedSubnivel('') }}
                  className="w-full px-2.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs focus:outline-none focus:border-zinc-600"
                >
                  <option value="">Todas</option>
                  {filteredSubcategorias.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>
            )}

            {selectedSubcategoria && filteredSubniveis.length > 0 && (
              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Subnível</label>
                <select
                  value={selectedSubnivel}
                  onChange={e => setSelectedSubnivel(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs focus:outline-none focus:border-zinc-600"
                >
                  <option value="">Todos</option>
                  {filteredSubniveis.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Área do Direito</label>
              <select
                value={selectedArea}
                onChange={e => setSelectedArea(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs focus:outline-none focus:border-zinc-600"
              >
                <option value="">Todas</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            </div>
          </div>
        </aside>

        {/* Grid de prompts */}
        <div className="flex-1 min-w-0">
          {/* Filtros mobile */}
          <div className="lg:hidden grid grid-cols-2 gap-2 mb-4">
            <select
              value={selectedCategoria}
              onChange={e => { setSelectedCategoria(e.target.value); setSelectedSubcategoria(''); setSelectedSubnivel('') }}
              className="px-2.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs focus:outline-none"
            >
              <option value="">Categoria</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            <select
              value={selectedArea}
              onChange={e => setSelectedArea(e.target.value)}
              className="px-2.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs focus:outline-none"
            >
              <option value="">Área</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-zinc-500 mb-2">Nenhum prompt encontrado</p>
              {hasFilters && (
                <button onClick={clearFilters} className="text-sm text-zinc-400 hover:text-white underline">
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(prompt => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PromptCard({ prompt }: { prompt: PromptWithRelations }) {
  return (
    <Link href={`/prompts/${prompt.id}`} className="group block">
      <div className="h-full p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900 transition-all">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-semibold text-white text-sm leading-snug group-hover:text-blue-300 transition-colors line-clamp-2">
            {prompt.titulo}
          </h3>
        </div>

        {prompt.descricao_curta && (
          <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 mb-3">
            {prompt.descricao_curta}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 mb-3">
          {(prompt as any).areas_direito?.nome && (
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20">
              {(prompt as any).areas_direito.nome}
            </span>
          )}
          {(prompt as any).subcategorias?.nome && (
            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs">
              {(prompt as any).subcategorias.nome}
            </span>
          )}
          {(prompt as any).internacional && (
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs border border-indigo-500/20">
              Intl{(prompt as any).idioma ? ` · ${(prompt as any).idioma.toUpperCase()}` : ''}
            </span>
          )}
        </div>

        {prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {prompt.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs text-zinc-600">#{tag}</span>
            ))}
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-zinc-800/50 flex items-center justify-between">
          <span className="text-xs text-zinc-600">
            {new Date(prompt.created_at).toLocaleDateString('pt-BR')}
          </span>
          <span className="text-xs text-zinc-500 group-hover:text-blue-400 transition-colors">
            Ver prompt →
          </span>
        </div>
      </div>
    </Link>
  )
}
