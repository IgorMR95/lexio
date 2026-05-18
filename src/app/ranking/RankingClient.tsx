'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Ferramenta {
  id: string
  nome: string
  descricao: string | null
  url: string | null
  tipo: 'llm' | 'app' | 'extensao' | 'plataforma' | 'outro'
  logo_url: string | null
  destaque: boolean
  status: string
}

interface Categoria {
  id: string
  nome: string
  slug: string
  descricao: string | null
  icone: string | null
  ordem: number
}

interface VotoContagem {
  ferramenta_id: string
  categoria_uso_id: string
  total_votos: number
}

interface Props {
  ferramentas: Ferramenta[]
  categorias: Categoria[]
  votos: VotoContagem[]
  meusVotos: { ferramenta_id: string; categoria_uso_id: string }[]
  userId: string | null
}

const TIPO_CONFIG: Record<string, { label: string; color: string }> = {
  llm:        { label: 'Modelo de IA',  color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  app:        { label: 'Aplicativo',    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  extensao:   { label: 'Extensão',      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  plataforma: { label: 'Plataforma',    color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  outro:      { label: 'Outro',         color: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
}

export function RankingClient({ ferramentas, categorias, votos, meusVotos: initialMeusVotos, userId }: Props) {
  const [activeTab, setActiveTab] = useState<'ranking' | 'explorar' | 'sugerir'>('ranking')
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>(categorias[0]?.id ?? '')
  const [meusVotos, setMeusVotos] = useState(initialMeusVotos)
  const [votosState, setVotosState] = useState(votos)
  const [filterTipo, setFilterTipo] = useState('')
  const [search, setSearch] = useState('')

  // Mapa de votos: ferramenta_id × categoria_uso_id → total
  const votosMap = useMemo(() => {
    const m: Record<string, number> = {}
    for (const v of votosState) {
      m[`${v.ferramenta_id}::${v.categoria_uso_id}`] = v.total_votos
    }
    return m
  }, [votosState])

  // Total geral de votos por ferramenta (todas as categorias)
  const totalVotosFerramenta = useMemo(() => {
    const m: Record<string, number> = {}
    for (const v of votosState) {
      m[v.ferramenta_id] = (m[v.ferramenta_id] ?? 0) + v.total_votos
    }
    return m
  }, [votosState])

  // Ranking da categoria ativa: ferramentas ordenadas por votos nessa categoria
  const rankingCategoria = useMemo(() => {
    return [...ferramentas]
      .map(f => ({
        ...f,
        votos_categoria: votosMap[`${f.id}::${categoriaAtiva}`] ?? 0,
      }))
      .filter(f => f.votos_categoria > 0 || ferramentas.length <= 12)
      .sort((a, b) => b.votos_categoria - a.votos_categoria)
  }, [ferramentas, votosMap, categoriaAtiva])

  // Lista explorar com filtros
  const explorar = useMemo(() => {
    let list = [...ferramentas]
    if (filterTipo) list = list.filter(f => f.tipo === filterTipo)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(f =>
        f.nome.toLowerCase().includes(q) ||
        (f.descricao ?? '').toLowerCase().includes(q)
      )
    }
    return list.sort((a, b) => (totalVotosFerramenta[b.id] ?? 0) - (totalVotosFerramenta[a.id] ?? 0))
  }, [ferramentas, filterTipo, search, totalVotosFerramenta])

  const handleVoto = async (ferramentaId: string, categoriaId: string) => {
    if (!userId) return
    const key = `${ferramentaId}::${categoriaId}`
    const jaVotou = meusVotos.some(v => v.ferramenta_id === ferramentaId && v.categoria_uso_id === categoriaId)
    const supabase = createClient()

    if (jaVotou) {
      await (supabase as any)
        .from('ferramenta_votos')
        .delete()
        .eq('ferramenta_id', ferramentaId)
        .eq('categoria_uso_id', categoriaId)
        .eq('user_id', userId)
      setMeusVotos(prev => prev.filter(v => !(v.ferramenta_id === ferramentaId && v.categoria_uso_id === categoriaId)))
      setVotosState(prev => prev.map(v =>
        v.ferramenta_id === ferramentaId && v.categoria_uso_id === categoriaId
          ? { ...v, total_votos: Math.max(0, v.total_votos - 1) }
          : v
      ).filter(v => v.total_votos > 0))
    } else {
      await (supabase as any)
        .from('ferramenta_votos')
        .insert({ ferramenta_id: ferramentaId, categoria_uso_id: categoriaId, user_id: userId })
      setMeusVotos(prev => [...prev, { ferramenta_id: ferramentaId, categoria_uso_id: categoriaId }])
      setVotosState(prev => {
        const existing = prev.find(v => v.ferramenta_id === ferramentaId && v.categoria_uso_id === categoriaId)
        if (existing) {
          return prev.map(v => v.ferramenta_id === ferramentaId && v.categoria_uso_id === categoriaId
            ? { ...v, total_votos: v.total_votos + 1 } : v)
        }
        return [...prev, { ferramenta_id: ferramentaId, categoria_uso_id: categoriaId, total_votos: 1 }]
      })
    }
  }

  const destaques = ferramentas.filter(f => f.destaque)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Ranking de IAs no Direito</h1>
            <p className="text-sm text-zinc-500 mt-1">
              As melhores ferramentas de IA e aplicativos jurídicos, avaliadas por advogados brasileiros
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800">
              {ferramentas.length} ferramentas
            </span>
            <span className="px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800">
              {votosState.reduce((s, v) => s + v.total_votos, 0)} votos
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg mb-8 w-fit">
        {[
          { id: 'ranking', label: 'Ranking por categoria' },
          { id: 'explorar', label: 'Todas as ferramentas' },
          { id: 'sugerir', label: '+ Sugerir ferramenta' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: RANKING */}
      {activeTab === 'ranking' && (
        <div className="space-y-6">
          {/* Destaques rápidos */}
          {destaques.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {destaques.slice(0, 4).map(f => (
                <div key={f.id} className="p-3 rounded-xl border border-yellow-500/15 bg-yellow-500/5 flex items-center gap-2.5">
                  <FerramIcon nome={f.nome} tipo={f.tipo} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{f.nome.split(' ')[0]}</p>
                    <p className="text-[10px] text-zinc-500">{TIPO_CONFIG[f.tipo]?.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-6 flex-col lg:flex-row">
            {/* Sidebar categorias */}
            <aside className="lg:w-56 shrink-0">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Categoria de uso</p>
              <div className="space-y-1">
                {categorias.map(cat => {
                  const totalNaCategoria = votosState.filter(v => v.categoria_uso_id === cat.id).reduce((s, v) => s + v.total_votos, 0)
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setCategoriaAtiva(cat.id)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left transition-all ${
                        categoriaAtiva === cat.id
                          ? 'bg-zinc-800 text-white'
                          : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm">
                        <span>{cat.icone}</span>
                        <span className="truncate">{cat.nome}</span>
                      </span>
                      {totalNaCategoria > 0 && (
                        <span className="text-xs text-zinc-600 flex-shrink-0">{totalNaCategoria}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </aside>

            {/* Ranking da categoria selecionada */}
            <div className="flex-1 min-w-0">
              {(() => {
                const cat = categorias.find(c => c.id === categoriaAtiva)
                if (!cat) return null
                return (
                  <div>
                    <div className="mb-4">
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>{cat.icone}</span>
                        {cat.nome}
                      </h2>
                      {cat.descricao && <p className="text-sm text-zinc-500 mt-0.5">{cat.descricao}</p>}
                      {!userId && (
                        <p className="text-xs text-zinc-600 mt-2">
                          <Link href="/login" className="text-green-400 hover:underline">Entre</Link> para votar nas melhores ferramentas por categoria
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      {rankingCategoria.map((f, i) => {
                        const jaVotou = meusVotos.some(v => v.ferramenta_id === f.id && v.categoria_uso_id === categoriaAtiva)
                        const maxVotos = rankingCategoria[0]?.votos_categoria ?? 1
                        const pct = maxVotos > 0 ? (f.votos_categoria / maxVotos) * 100 : 0

                        return (
                          <div
                            key={f.id}
                            className={`p-4 rounded-xl border transition-all ${
                              i === 0 && f.votos_categoria > 0
                                ? 'border-yellow-500/20 bg-yellow-500/5'
                                : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              {/* Posição */}
                              <span className={`text-lg font-black w-7 text-center flex-shrink-0 pt-0.5 ${
                                i === 0 ? 'text-yellow-400' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-amber-600' : 'text-zinc-700'
                              }`}>
                                {f.votos_categoria > 0 ? i + 1 : '—'}
                              </span>

                              {/* Ícone */}
                              <FerramIcon nome={f.nome} tipo={f.tipo} size="md" />

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <p className="text-sm font-semibold text-white">{f.nome}</p>
                                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] border ${TIPO_CONFIG[f.tipo]?.color}`}>
                                    {TIPO_CONFIG[f.tipo]?.label}
                                  </span>
                                  {f.destaque && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-[10px] border border-yellow-500/20">
                                      ★ Destaque
                                    </span>
                                  )}
                                </div>
                                {f.descricao && (
                                  <p className="text-xs text-zinc-500 line-clamp-2 mb-2">{f.descricao}</p>
                                )}
                                {/* Barra de progresso */}
                                {f.votos_categoria > 0 && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                                      <div
                                        className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                    <span className="text-xs text-zinc-500 flex-shrink-0 w-16 text-right">
                                      {f.votos_categoria} voto{f.votos_categoria !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-3">
                                  {f.url && (
                                    <a
                                      href={f.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                                      onClick={e => e.stopPropagation()}
                                    >
                                      Acessar site ↗
                                    </a>
                                  )}
                                </div>
                              </div>

                              {/* Botão de voto */}
                              <button
                                onClick={() => handleVoto(f.id, categoriaAtiva)}
                                disabled={!userId}
                                className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg border transition-all ${
                                  jaVotou
                                    ? 'border-green-500/50 bg-green-500/10 text-green-400'
                                    : userId
                                      ? 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-white'
                                      : 'border-zinc-800 text-zinc-700 cursor-not-allowed'
                                }`}
                                title={!userId ? 'Entre para votar' : jaVotou ? 'Remover voto' : 'Votar nesta ferramenta para esta categoria'}
                              >
                                <svg className="w-4 h-4" fill={jaVotou ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                                <span className="text-xs font-semibold">{f.votos_categoria}</span>
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* TAB: EXPLORAR */}
      {activeTab === 'explorar' && (
        <div>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar ferramenta..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 text-sm"
              />
            </div>
            <select
              value={filterTipo}
              onChange={e => setFilterTipo(e.target.value)}
              className="px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm focus:outline-none focus:border-zinc-600"
            >
              <option value="">Todos os tipos</option>
              {Object.entries(TIPO_CONFIG).map(([v, c]) => (
                <option key={v} value={v}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {explorar.map(f => {
              const totalVotos = totalVotosFerramenta[f.id] ?? 0
              // Categoria líder desta ferramenta
              const topCategoria = votosState
                .filter(v => v.ferramenta_id === f.id)
                .sort((a, b) => b.total_votos - a.total_votos)[0]
              const topCatNome = topCategoria
                ? categorias.find(c => c.id === topCategoria.categoria_uso_id)?.nome
                : null

              return (
                <div key={f.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900 transition-all flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <FerramIcon nome={f.nome} tipo={f.tipo} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-white">{f.nome}</p>
                        {f.destaque && <span className="text-[10px] text-yellow-400">★</span>}
                      </div>
                      <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded-full text-[10px] border ${TIPO_CONFIG[f.tipo]?.color}`}>
                        {TIPO_CONFIG[f.tipo]?.label}
                      </span>
                    </div>
                  </div>

                  {f.descricao && (
                    <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3">{f.descricao}</p>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-800/50">
                    <div className="flex items-center gap-3">
                      {totalVotos > 0 && (
                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          {totalVotos} votos
                        </span>
                      )}
                      {topCatNome && (
                        <span className="text-xs text-zinc-600">
                          Top em <span className="text-zinc-400">{topCatNome}</span>
                        </span>
                      )}
                    </div>
                    {f.url && (
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        Acessar ↗
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB: SUGERIR */}
      {activeTab === 'sugerir' && (
        <SugerirForm userId={userId} onSuccess={() => setActiveTab('explorar')} />
      )}
    </div>
  )
}

function FerramIcon({ nome, tipo, size }: { nome: string; tipo: string; size: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'w-7 h-7 text-sm' : size === 'md' ? 'w-9 h-9 text-base' : 'w-12 h-12 text-xl'
  const bgMap: Record<string, string> = {
    llm: 'bg-violet-500/15 border-violet-500/20 text-violet-300',
    app: 'bg-blue-500/15 border-blue-500/20 text-blue-300',
    extensao: 'bg-amber-500/15 border-amber-500/20 text-amber-300',
    plataforma: 'bg-green-500/15 border-green-500/20 text-green-300',
    outro: 'bg-zinc-800 border-zinc-700 text-zinc-400',
  }
  return (
    <div className={`${sizeClass} rounded-xl border flex items-center justify-center flex-shrink-0 font-bold ${bgMap[tipo] ?? bgMap.outro}`}>
      {nome[0]?.toUpperCase()}
    </div>
  )
}

function SugerirForm({ userId, onSuccess }: { userId: string | null; onSuccess: () => void }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [url, setUrl] = useState('')
  const [tipo, setTipo] = useState('llm')
  const [observacoes, setObservacoes] = useState('')

  if (!userId) {
    return (
      <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
        <p className="text-zinc-400 text-sm mb-2">Entre para sugerir uma ferramenta</p>
        <Link href="/login" className="text-sm text-green-400 hover:underline">Fazer login →</Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await (supabase as any).from('ferramentas').insert({
      nome, descricao: descricao || null, url: url || null,
      tipo, autor_id: userId, status: 'pendente', observacoes: observacoes || null,
    })
    if (err) {
      setError('Erro ao enviar. Tente novamente.')
    } else {
      setSuccess(true)
      setTimeout(onSuccess, 2000)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="text-center py-16 border border-green-500/20 bg-green-500/5 rounded-xl">
        <p className="text-green-400 font-medium mb-1">Sugestão enviada!</p>
        <p className="text-zinc-500 text-sm">Nossa equipe vai avaliar antes de publicar.</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white mb-1">Sugerir ferramenta</h2>
        <p className="text-sm text-zinc-500">
          Conhece uma IA ou aplicativo jurídico que deveria estar aqui? Sugira para avaliação.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Nome da ferramenta <span className="text-red-400">*</span></label>
          <input required value={nome} onChange={e => setNome(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-sm"
            placeholder="Ex: LexIA, Jurisfy..." />
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Tipo <span className="text-red-400">*</span></label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(TIPO_CONFIG).map(([v, c]) => (
              <button key={v} type="button" onClick={() => setTipo(v)}
                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left ${
                  tipo === v ? `${c.color} border-opacity-50` : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700'
                }`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Descrição <span className="text-red-400">*</span></label>
          <textarea required rows={4} value={descricao} onChange={e => setDescricao(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-sm resize-none"
            placeholder="O que essa ferramenta faz? Por que é útil para advogados?" />
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Site / URL</label>
          <input type="url" value={url} onChange={e => setUrl(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-sm"
            placeholder="https://..." />
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Observações para a equipe</label>
          <input value={observacoes} onChange={e => setObservacoes(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-sm"
            placeholder="Por que deveria ser incluída? Experiência pessoal..." />
        </div>

        {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

        <button type="submit" disabled={loading}
          className="px-6 py-2.5 rounded-lg bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors disabled:opacity-50">
          {loading ? 'Enviando...' : 'Enviar sugestão'}
        </button>
      </form>
    </div>
  )
}
