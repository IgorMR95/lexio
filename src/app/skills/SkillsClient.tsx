'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'

const TIPOS = [
  { value: 'skill',     label: 'Configuração geral',      color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  { value: 'persona',   label: 'Perfil profissional',     color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  { value: 'workflow',  label: 'Passo a passo de tarefa', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { value: 'instrucao', label: 'Regra de comportamento',  color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
]

function tipoConfig(tipo: string) {
  return TIPOS.find(t => t.value === tipo) ?? TIPOS[0]
}

interface UsuarioRanking {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  instituicao: string | null
  total: number
}

interface UsuariosDestaqueData {
  topAprovados: UsuarioRanking[]
  topDestaques: UsuarioRanking[]
  topVotados: UsuarioRanking[]
  topPublicadores: UsuarioRanking[]
}

interface Props {
  totalCount: number
  areas: any[]
  topSemana: any[]
  topAllTime: any[]
  destaques: any[]
  usuariosDestaque: UsuariosDestaqueData
}

export function SkillsClient({ totalCount, areas, topSemana, topAllTime, destaques, usuariosDestaque }: Props) {
  const [activeTab, setActiveTab] = useState<'todos' | 'melhores' | 'usuarios'>('todos')
  const [search, setSearch] = useState('')
  const [selectedTipo, setSelectedTipo] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent')

  const [skills, setSkills] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(totalCount)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const abortRef = useRef<AbortController | null>(null)

  const buildUrl = useCallback((p: number) => {
    const params = new URLSearchParams({ page: String(p) })
    if (search.trim()) params.set('q', search.trim())
    if (selectedTipo) params.set('tipo', selectedTipo)
    if (selectedArea) params.set('area', selectedArea)
    if (sortOrder === 'oldest') params.set('sort', 'oldest')
    return `/api/skills?${params.toString()}`
  }, [search, selectedTipo, selectedArea, sortOrder])

  const fetchPage = useCallback(async (p: number, append: boolean) => {
    if (abortRef.current) abortRef.current.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    if (append) setLoadingMore(true)
    else setLoading(true)

    try {
      const res = await fetch(buildUrl(p), { signal: ctrl.signal })
      if (!res.ok) return
      const json = await res.json()
      setSkills(prev => append ? [...prev, ...json.data] : json.data)
      setTotal(json.total)
      setHasMore(json.hasMore)
      setPage(p)
    } catch (e: any) {
      if (e.name !== 'AbortError') console.error(e)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [buildUrl])

  useEffect(() => {
    fetchPage(1, false)
  }, [fetchPage])

  const hasFilters = search || selectedTipo || selectedArea

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Skills MD</h1>
            <p className="text-sm text-zinc-500 mt-1">Arquivos de skill para Claude Code e outros assistentes jurídicos</p>
          </div>
          <Link
            href="/dashboard/nova-skill"
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors"
          >
            + Compartilhar skill
          </Link>
        </div>

        <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('todos')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'todos' ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'}`}
          >
            Todas as Skills
          </button>
          <button
            onClick={() => setActiveTab('melhores')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'melhores' ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'}`}
          >
            <svg className={`w-3.5 h-3.5 ${activeTab === 'melhores' ? 'text-yellow-500' : 'text-yellow-400'}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Melhores
          </button>
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'usuarios' ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'}`}
          >
            <svg className={`w-3.5 h-3.5 ${activeTab === 'usuarios' ? 'text-violet-600' : 'text-violet-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Usuários Destaque
          </button>
        </div>
      </div>

      {activeTab === 'melhores' && (
        <MelhoresSkills topSemana={topSemana} topAllTime={topAllTime} destaques={destaques} />
      )}

      {activeTab === 'usuarios' && (
        <UsuariosDestaqueSkills usuariosDestaque={usuariosDestaque} />
      )}

      {activeTab === 'todos' && (
        <>
          <p className="text-zinc-500 text-sm mb-6">{total} skill{total !== 1 ? 's' : ''} encontrada{total !== 1 ? 's' : ''}</p>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar skills..."
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
              <option value="oldest">Mais antigas</option>
            </select>
          </div>

          <div className="flex gap-8">
            <aside className="hidden lg:block w-56 shrink-0">
              <div className="sticky top-20 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Filtros</span>
                  {hasFilters && (
                    <button onClick={() => { setSearch(''); setSelectedTipo(''); setSelectedArea('') }} className="text-xs text-zinc-500 hover:text-white transition-colors">
                      Limpar
                    </button>
                  )}
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">Tipo</label>
                  <select
                    value={selectedTipo}
                    onChange={e => setSelectedTipo(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs focus:outline-none focus:border-zinc-600"
                  >
                    <option value="">Todos</option>
                    {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">Área do Direito</label>
                  <select
                    value={selectedArea}
                    onChange={e => setSelectedArea(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs focus:outline-none focus:border-zinc-600"
                  >
                    <option value="">Todas</option>
                    {areas.map((a: any) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                  </select>
                </div>
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              <div className="lg:hidden grid grid-cols-2 gap-2 mb-4">
                <select
                  value={selectedTipo}
                  onChange={e => setSelectedTipo(e.target.value)}
                  className="px-2.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs focus:outline-none"
                >
                  <option value="">Tipo</option>
                  {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <select
                  value={selectedArea}
                  onChange={e => setSelectedArea(e.target.value)}
                  className="px-2.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs focus:outline-none"
                >
                  <option value="">Área</option>
                  {areas.map((a: any) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-44 rounded-xl border border-zinc-800 bg-zinc-900/50 animate-pulse" />
                  ))}
                </div>
              ) : skills.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-zinc-500 mb-2">Nenhuma skill encontrada</p>
                  {hasFilters && (
                    <button onClick={() => { setSearch(''); setSelectedTipo(''); setSelectedArea('') }} className="text-sm text-zinc-400 hover:text-white underline">
                      Limpar filtros
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {skills.map((skill: any) => (
                      <SkillCard key={skill.id} skill={skill} />
                    ))}
                  </div>
                  {hasMore && (
                    <div className="mt-8 flex flex-col items-center gap-2">
                      <button
                        onClick={() => fetchPage(page + 1, true)}
                        disabled={loadingMore}
                        className="px-6 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-sm hover:border-zinc-500 hover:text-white transition-colors disabled:opacity-50"
                      >
                        {loadingMore ? 'Carregando...' : 'Carregar mais 20 skills'}
                      </button>
                      <p className="text-xs text-zinc-600">
                        Exibindo {skills.length} de {total}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function SkillCard({ skill }: { skill: any }) {
  const tc = tipoConfig(skill.tipo)
  return (
    <Link href={`/skills/${skill.id}`} className="group block">
      <div className="h-full p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900 transition-all">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-semibold text-white text-sm leading-snug group-hover:text-green-300 transition-colors line-clamp-2">
            {skill.titulo}
          </h3>
        </div>

        {skill.descricao && (
          <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 mb-3">{skill.descricao}</p>
        )}

        <div className="flex flex-wrap gap-1.5 mb-3">
          {skill.destaque && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-xs border border-yellow-500/20 font-medium">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Destaque
            </span>
          )}
          <span className={`px-2 py-0.5 rounded-full text-xs border ${tc.color}`}>{tc.label}</span>
          {skill.areas_direito?.nome && (
            <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs border border-green-500/20">
              {skill.areas_direito.nome}
            </span>
          )}
          {skill.compatibilidade?.slice(0, 2).map((c: string) => (
            <span key={c} className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs">{c}</span>
          ))}
        </div>

        {skill.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {skill.tags.slice(0, 3).map((tag: string) => (
              <span key={tag} className="text-xs text-zinc-600">#{tag}</span>
            ))}
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-zinc-800/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-4 h-4 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400 text-xs flex-shrink-0 font-bold">
              {(skill.profiles?.full_name ?? skill.profiles?.email ?? '?')[0]?.toUpperCase()}
            </div>
            <span className="text-xs text-zinc-500 truncate">
              {skill.profiles?.full_name ?? skill.profiles?.email ?? 'Anônimo'}
            </span>
          </div>
          <span className="text-xs text-zinc-500 group-hover:text-green-400 transition-colors flex-shrink-0">
            Ver →
          </span>
        </div>
      </div>
    </Link>
  )
}

function SkillAvatar({ u }: { u: UsuarioRanking }) {
  const nome = u.full_name ?? u.email ?? '?'
  if (u.avatar_url) {
    return <img src={u.avatar_url} alt={nome} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
  }
  return (
    <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
      <span className="text-sm font-bold text-zinc-300">{nome[0]?.toUpperCase()}</span>
    </div>
  )
}

function SkillRankingCard({
  titulo, descricao, usuarios, unidade, accentClass, iconPath,
}: {
  titulo: string
  descricao: string
  usuarios: UsuarioRanking[]
  unidade: string
  accentClass: string
  iconPath: React.ReactNode
}) {
  if (usuarios.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40">
        <h3 className="font-bold text-white text-sm mb-1">{titulo}</h3>
        <p className="text-xs text-zinc-500 italic">Nenhum dado disponível ainda.</p>
      </div>
    )
  }
  return (
    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40">
      <div className="flex items-start gap-3 mb-5">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${accentClass}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {iconPath}
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-white text-sm">{titulo}</h3>
          <p className="text-xs text-zinc-500 mt-0.5">{descricao}</p>
        </div>
      </div>
      <div className="space-y-3">
        {usuarios.map((u, i) => {
          const nome = u.full_name ?? u.email ?? 'Usuário'
          return (
            <Link
              key={u.id}
              href={`/u/${u.id}`}
              className="group flex items-center gap-3 p-3 rounded-xl border border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all"
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border ${
                i === 0 ? 'bg-yellow-500 border-yellow-400 text-zinc-950' :
                i === 1 ? 'bg-zinc-400 border-zinc-300 text-zinc-950' :
                i === 2 ? 'bg-amber-700 border-amber-600 text-white' :
                'bg-zinc-800 border-zinc-700 text-zinc-500'
              }`}>
                {i + 1}
              </div>
              <SkillAvatar u={u} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white group-hover:text-green-300 transition-colors truncate">{nome}</p>
                {u.instituicao && <p className="text-xs text-zinc-500 truncate">{u.instituicao}</p>}
              </div>
              <div className="flex-shrink-0 text-right">
                <span className={`text-sm font-bold tabular-nums ${accentClass.split(' ')[0]}`}>{u.total}</span>
                <p className="text-xs text-zinc-600">{unidade}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function UsuariosDestaqueSkills({ usuariosDestaque }: { usuariosDestaque: UsuariosDestaqueData }) {
  const { topAprovados, topDestaques, topVotados, topPublicadores } = usuariosDestaque
  const vazio = topAprovados.length === 0 && topDestaques.length === 0 && topVotados.length === 0 && topPublicadores.length === 0

  if (vazio) {
    return (
      <div className="text-center py-24 border border-dashed border-zinc-800 rounded-2xl">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p className="text-zinc-400 font-medium mb-1">Nenhum dado disponível ainda</p>
        <p className="text-zinc-600 text-sm">Os rankings serão exibidos conforme a comunidade cresce.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 pb-2 border-b border-zinc-800">
        <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Usuários Destaque</h2>
          <p className="text-xs text-zinc-500">Top 5 por categoria — atualizado em tempo real</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SkillRankingCard
          titulo="Mais skills aprovadas"
          descricao="Usuários com maior número de skills publicadas e aprovadas"
          usuarios={topAprovados}
          unidade="aprovadas"
          accentClass="text-green-400 bg-green-500/10 border-green-500/20"
          iconPath={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
        />
        <SkillRankingCard
          titulo="Mais selos de destaque"
          descricao="Usuários com mais skills marcadas como destaque pelos administradores"
          usuarios={topDestaques}
          unidade="destaques"
          accentClass="text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
          iconPath={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />}
        />
        <SkillRankingCard
          titulo="Mais curtidas recebidas"
          descricao="Usuários cujas skills acumularam mais curtidas da comunidade"
          usuarios={topVotados}
          unidade="curtidas"
          accentClass="text-teal-400 bg-teal-500/10 border-teal-500/20"
          iconPath={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />}
        />
        <SkillRankingCard
          titulo="Mais ativos na semana"
          descricao="Usuários que mais publicaram skills nos últimos 7 dias"
          usuarios={topPublicadores}
          unidade="publicadas"
          accentClass="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
          iconPath={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />}
        />
      </div>
    </div>
  )
}

function MelhoresSkills({ topSemana, topAllTime, destaques }: { topSemana: any[]; topAllTime: any[]; destaques: any[] }) {
  const vazio = topSemana.length === 0 && topAllTime.length === 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
      <div className="lg:col-span-2 space-y-10">

        {topSemana.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Destaque da Semana</h2>
                <p className="text-xs text-zinc-500">Mais curtidas nos últimos 7 dias</p>
              </div>
            </div>
            <div className="space-y-3">
              {topSemana.slice(0, 10).map((s: any, i: number) => (
                <Link
                  key={s.id}
                  href={`/skills/${s.id}`}
                  className="group flex items-start gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-yellow-500/30 hover:bg-zinc-900 transition-all"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 border ${
                    i === 0 ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' :
                    i === 1 ? 'bg-zinc-500/20 border-zinc-500/40 text-zinc-300' :
                    i === 2 ? 'bg-amber-700/20 border-amber-700/40 text-amber-500' :
                    'bg-zinc-800 border-zinc-700 text-zinc-500'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white group-hover:text-yellow-300 transition-colors line-clamp-1">
                      {s.titulo}
                    </h3>
                    {s.descricao && (
                      <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{s.descricao}</p>
                    )}
                    {s.areas_direito?.nome && (
                      <span className="inline-block mt-1.5 px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs border border-green-500/20">
                        {s.areas_direito.nome}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                    <span className="text-sm font-bold text-green-400 tabular-nums">{s.votos_semana}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {topAllTime.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Hall da Fama</h2>
                <p className="text-xs text-zinc-500">Mais curtidas de todos os tempos</p>
              </div>
            </div>
            <div className="space-y-2">
              {topAllTime.map((s: any, i: number) => (
                <Link
                  key={s.id}
                  href={`/skills/${s.id}`}
                  className="group flex items-center gap-3 px-4 py-3 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:border-green-500/30 hover:bg-zinc-900 transition-all"
                >
                  <span className="text-xs text-zinc-600 w-5 text-right flex-shrink-0 tabular-nums">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white group-hover:text-green-300 transition-colors line-clamp-1">{s.titulo}</p>
                    {s.areas_direito?.nome && (
                      <p className="text-xs text-zinc-600 mt-0.5">{s.areas_direito.nome}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                    <span className="text-xs font-semibold text-green-400 tabular-nums">{s.total_votos}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {vazio && (
          <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl">
            <p className="text-zinc-400 font-medium mb-1">Nenhuma curtida registrada ainda</p>
            <p className="text-zinc-600 text-sm">Explore as skills e curta as suas favoritas.</p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="p-5 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <h3 className="text-sm font-bold text-white">Selo Destaque</h3>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed mb-4">
            Skills selecionadas manualmente pelos administradores por qualidade excepcional.
          </p>
          {destaques.length > 0 ? (
            <div className="space-y-2">
              {destaques.map((s: any) => (
                <Link
                  key={s.id}
                  href={`/skills/${s.id}`}
                  className="group block p-3 rounded-lg border border-yellow-500/10 bg-yellow-500/5 hover:border-yellow-500/30 hover:bg-yellow-500/10 transition-all"
                >
                  <p className="text-xs font-medium text-white group-hover:text-yellow-300 transition-colors line-clamp-2">{s.titulo}</p>
                  {s.areas_direito?.nome && (
                    <p className="text-xs text-zinc-600 mt-1">{s.areas_direito.nome}</p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-600 italic">Nenhuma skill com selo destaque ainda.</p>
          )}
        </div>

        <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30">
          <h3 className="text-sm font-bold text-white mb-3">Como funciona o ranking?</h3>
          <div className="space-y-3 text-xs text-zinc-500 leading-relaxed">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </div>
              <p>Qualquer usuário logado pode curtir skills que achou úteis.</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <p>O ranking da semana considera apenas curtidas dos últimos 7 dias, priorizando conteúdo recente.</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p>O Selo Destaque é atribuído manualmente por administradores a skills de qualidade excepcional.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
