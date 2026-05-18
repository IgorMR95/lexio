'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'

interface FeedItem {
  id: string
  tipo: 'prompt' | 'skill'
  titulo: string
  descricao: string | null
  created_at: string
  autor_id: string
  autor_nome: string
  area_nome: string | null
  destaque: boolean
  total_votos: number
  skill_tipo?: string
}

interface UsuarioSugerido {
  id: string
  full_name: string | null
  email: string | null
  total_prompts: number
  total_skills: number
}

interface Props {
  items: FeedItem[]
  seguidoIds: string[]
  usuariosSugeridos: UsuarioSugerido[]
  areas: { id: string; nome: string }[]
}

const SKILL_TIPO_LABELS: Record<string, string> = {
  skill: 'Configuração geral',
  persona: 'Perfil profissional',
  workflow: 'Passo a passo de tarefa',
  instrucao: 'Regra de comportamento',
}

const STORAGE_KEYS = {
  lastSeen: 'feed_last_seen',
  recentes: 'feed_recentes',
  filterTipo: 'feed_filter_tipo',
  filterArea: 'feed_filter_area',
  layout: 'feed_layout',
}

function getStorage<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v !== null ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}

function setStorage(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

export function FeedClient({ items, seguidoIds, usuariosSugeridos, areas }: Props) {
  const [lastSeen, setLastSeen] = useState<string | null>(null)
  const [recentes, setRecentes] = useState<FeedItem[]>([])
  const [filterTipo, setFilterTipo] = useState<'todos' | 'prompt' | 'skill'>('todos')
  const [filterArea, setFilterArea] = useState<string>('')
  const [layout, setLayout] = useState<'lista' | 'grid'>('lista')
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const seen = getStorage<string | null>(STORAGE_KEYS.lastSeen, null)
    const rec = getStorage<FeedItem[]>(STORAGE_KEYS.recentes, [])
    const ft = getStorage<'todos' | 'prompt' | 'skill'>(STORAGE_KEYS.filterTipo, 'todos')
    const fa = getStorage<string>(STORAGE_KEYS.filterArea, '')
    const lay = getStorage<'lista' | 'grid'>(STORAGE_KEYS.layout, 'lista')

    setLastSeen(seen)
    setRecentes(rec)
    setFilterTipo(ft)
    setFilterArea(fa)
    setLayout(lay)
    setHydrated(true)

    // Atualiza last_seen para agora (próxima visita vai usar esse timestamp)
    setStorage(STORAGE_KEYS.lastSeen, new Date().toISOString())
  }, [])

  const handleFilterTipo = (v: 'todos' | 'prompt' | 'skill') => {
    setFilterTipo(v)
    setStorage(STORAGE_KEYS.filterTipo, v)
  }

  const handleFilterArea = (v: string) => {
    setFilterArea(v)
    setStorage(STORAGE_KEYS.filterArea, v)
  }

  const handleLayout = (v: 'lista' | 'grid') => {
    setLayout(v)
    setStorage(STORAGE_KEYS.layout, v)
  }

  const handleItemClick = (item: FeedItem) => {
    setRecentes(prev => {
      const sem = prev.filter(r => r.id !== item.id)
      const novo = [item, ...sem].slice(0, 5)
      setStorage(STORAGE_KEYS.recentes, novo)
      return novo
    })
  }

  const isNovo = (created_at: string) => {
    if (!lastSeen || !hydrated) return false
    return new Date(created_at) > new Date(lastSeen)
  }

  const filtered = useMemo(() => {
    let result = [...items]
    if (filterTipo !== 'todos') result = result.filter(i => i.tipo === filterTipo)
    if (filterArea) result = result.filter(i => i.area_nome !== null && areas.find(a => a.id === filterArea)?.nome === i.area_nome)
    return result
  }, [items, filterTipo, filterArea, areas])

  const novosCount = hydrated ? filtered.filter(i => isNovo(i.created_at)).length : 0

  // Empty state — não segue ninguém
  if (seguidoIds.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <FeedHeader />
        <EmptyState tipo="sem-seguidos" usuariosSugeridos={usuariosSugeridos} />
      </div>
    )
  }

  // Empty state — segue mas sem conteúdo
  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <FeedHeader />
        <EmptyState tipo="sem-conteudo" usuariosSugeridos={usuariosSugeridos} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Feed</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {filtered.length} publicaç{filtered.length !== 1 ? 'ões' : 'ão'}
            {novosCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 text-xs border border-green-500/25 font-medium">
                {novosCount} nova{novosCount !== 1 ? 's' : ''} desde a última visita
              </span>
            )}
          </p>
        </div>

        {/* Controles de layout */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleLayout('lista')}
            className={`p-1.5 rounded-md border transition-colors ${layout === 'lista' ? 'border-zinc-600 bg-zinc-800 text-white' : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
            title="Layout lista"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => handleLayout('grid')}
            className={`p-1.5 rounded-md border transition-colors ${layout === 'grid' ? 'border-zinc-600 bg-zinc-800 text-white' : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
            title="Layout grid"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="lg:w-56 shrink-0 space-y-5">
          {/* Filtros persistentes */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-3">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Filtros</p>
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Tipo</label>
              <div className="space-y-1">
                {([
                  { value: 'todos', label: 'Todos' },
                  { value: 'prompt', label: 'Prompts' },
                  { value: 'skill', label: 'Skills MD' },
                ] as { value: 'todos' | 'prompt' | 'skill'; label: string }[]).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleFilterTipo(opt.value)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      filterTipo === opt.value
                        ? 'bg-zinc-800 text-white font-medium'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Área</label>
              <select
                value={filterArea}
                onChange={e => handleFilterArea(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs focus:outline-none focus:border-zinc-600"
              >
                <option value="">Todas</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            </div>
            {(filterTipo !== 'todos' || filterArea) && (
              <button
                onClick={() => { handleFilterTipo('todos'); handleFilterArea('') }}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                Limpar filtros
              </button>
            )}
          </div>

          {/* Continue de onde parou */}
          {hydrated && recentes.length > 0 && (
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-2">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Vistos recentemente</p>
              {recentes.slice(0, 4).map(r => (
                <Link
                  key={r.id}
                  href={r.tipo === 'prompt' ? `/prompts/${r.id}` : `/skills/${r.id}`}
                  className="block text-xs text-zinc-500 hover:text-zinc-300 transition-colors truncate py-0.5"
                >
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 mb-0.5 ${r.tipo === 'prompt' ? 'bg-green-500/60' : 'bg-violet-500/60'}`} />
                  {r.titulo}
                </Link>
              ))}
            </div>
          )}
        </aside>

        {/* Feed principal */}
        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
              <p className="text-zinc-500 text-sm">Nenhuma publicação com esses filtros.</p>
              <button
                onClick={() => { handleFilterTipo('todos'); handleFilterArea('') }}
                className="text-sm text-green-400 hover:underline mt-2 block mx-auto"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className={layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-3'}>
              {filtered.map(item => (
                <FeedCard
                  key={`${item.tipo}-${item.id}`}
                  item={item}
                  isNovo={isNovo(item.created_at)}
                  layout={layout}
                  onClick={() => handleItemClick(item)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FeedHeader() {
  return (
    <div className="mb-8">
      <h1 className="text-xl font-bold text-white">Feed</h1>
      <p className="text-sm text-zinc-500 mt-0.5">Publicações de quem você segue</p>
    </div>
  )
}

function FeedCard({ item, isNovo, layout, onClick }: { item: FeedItem; isNovo: boolean; layout: 'lista' | 'grid'; onClick: () => void }) {
  const href = item.tipo === 'prompt' ? `/prompts/${item.id}` : `/skills/${item.id}`
  const inicial = item.autor_nome[0]?.toUpperCase() ?? '?'
  const isGrid = layout === 'grid'

  return (
    <div className={`flex gap-3 p-4 rounded-xl border transition-all ${isNovo ? 'border-green-500/20 bg-green-500/5 hover:border-green-500/30' : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900'} ${isGrid ? 'flex-col' : 'items-start'}`}>
      {!isGrid && (
        <Link
          href={`/u/${item.autor_id}`}
          className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-white hover:border-zinc-500 transition-colors mt-0.5"
        >
          {inicial}
        </Link>
      )}
      <div className="flex-1 min-w-0">
        <div className={`flex items-center gap-2 mb-1 flex-wrap ${isGrid ? '' : ''}`}>
          {isGrid && (
            <Link href={`/u/${item.autor_id}`} className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-white hover:border-zinc-500 transition-colors">
              {inicial}
            </Link>
          )}
          <Link href={`/u/${item.autor_id}`} className="text-xs font-medium text-zinc-400 hover:text-white transition-colors">
            {item.autor_nome}
          </Link>
          <span className="text-xs text-zinc-700">·</span>
          <span className="text-xs text-zinc-700">
            {new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </span>
          {isNovo && (
            <span className="px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 text-[10px] border border-green-500/20 font-semibold">
              Novo
            </span>
          )}
        </div>

        <Link href={href} onClick={onClick} className="block group">
          <div className="flex items-start gap-2 flex-wrap mb-1">
            {item.tipo === 'skill' && (
              <span className="inline-block px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-[10px] border border-violet-500/20 font-medium flex-shrink-0">
                skill
              </span>
            )}
            <p className={`font-medium text-white group-hover:text-green-300 transition-colors ${isGrid ? 'text-sm' : 'text-sm'}`}>
              {item.titulo}
            </p>
            {item.destaque && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-[10px] border border-yellow-500/20 flex-shrink-0">
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Destaque
              </span>
            )}
          </div>

          {item.descricao && (
            <p className="text-xs text-zinc-500 line-clamp-2 mb-2">{item.descricao}</p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {item.area_nome && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                {item.area_nome}
              </span>
            )}
            {item.tipo === 'skill' && item.skill_tipo && (
              <span className="text-xs text-zinc-600">
                {SKILL_TIPO_LABELS[item.skill_tipo] ?? item.skill_tipo}
              </span>
            )}
            {item.total_votos > 0 && (
              <span className="flex items-center gap-1 text-xs text-zinc-600">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {item.total_votos}
              </span>
            )}
          </div>
        </Link>
      </div>
    </div>
  )
}

function EmptyState({ tipo, usuariosSugeridos }: { tipo: 'sem-seguidos' | 'sem-conteudo'; usuariosSugeridos: UsuarioSugerido[] }) {
  return (
    <div className="space-y-6">
      <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl">
        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        </div>
        <p className="text-zinc-400 text-sm font-medium mb-1">
          {tipo === 'sem-seguidos' ? 'Seu feed está vazio' : 'Nenhuma publicação ainda'}
        </p>
        <p className="text-zinc-600 text-xs mb-4">
          {tipo === 'sem-seguidos'
            ? 'Siga outros usuários para ver as publicações deles aqui'
            : 'Quem você segue ainda não publicou nada'}
        </p>
        <Link href="/prompts" className="text-sm text-green-400 hover:underline">
          Explorar a base de prompts →
        </Link>
      </div>

      {usuariosSugeridos.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            {tipo === 'sem-seguidos' ? 'Usuários para seguir' : 'Outros usuários ativos'}
          </p>
          <div className="space-y-2">
            {usuariosSugeridos.map(u => {
              const nome = u.full_name ?? u.email ?? 'Usuário'
              const total = u.total_prompts + u.total_skills
              return (
                <Link
                  key={u.id}
                  href={`/u/${u.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900 transition-all group"
                >
                  <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                    {nome[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white group-hover:text-green-300 transition-colors truncate">{nome}</p>
                    <p className="text-xs text-zinc-600">
                      {u.total_prompts > 0 && `${u.total_prompts} prompt${u.total_prompts !== 1 ? 's' : ''}`}
                      {u.total_prompts > 0 && u.total_skills > 0 && ' · '}
                      {u.total_skills > 0 && `${u.total_skills} skill${u.total_skills !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-600 group-hover:text-zinc-400 transition-colors">Ver perfil →</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
