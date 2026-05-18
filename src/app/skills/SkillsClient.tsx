'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

const TIPOS = [
  { value: 'skill',     label: 'Skill',       color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  { value: 'persona',   label: 'Persona',     color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  { value: 'workflow',  label: 'Workflow',    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { value: 'instrucao', label: 'Instrução',   color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
]

function tipoConfig(tipo: string) {
  return TIPOS.find(t => t.value === tipo) ?? TIPOS[0]
}

interface Props {
  initialSkills: any[]
  areas: any[]
  topSemana: any[]
  topAllTime: any[]
  destaques: any[]
}

export function SkillsClient({ initialSkills, areas, topSemana, topAllTime, destaques }: Props) {
  const [activeTab, setActiveTab] = useState<'todos' | 'melhores'>('todos')
  const [search, setSearch] = useState('')
  const [selectedTipo, setSelectedTipo] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent')

  const filtered = useMemo(() => {
    let result = [...initialSkills]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(s =>
        s.titulo.toLowerCase().includes(q) ||
        (s.descricao ?? '').toLowerCase().includes(q) ||
        s.conteudo_md.toLowerCase().includes(q) ||
        s.tags?.some((t: string) => t.toLowerCase().includes(q))
      )
    }
    if (selectedTipo) result = result.filter(s => s.tipo === selectedTipo)
    if (selectedArea) result = result.filter(s => s.area_direito_id === selectedArea)
    result.sort((a, b) => {
      const da = new Date(a.created_at).getTime()
      const db = new Date(b.created_at).getTime()
      return sortOrder === 'recent' ? db - da : da - db
    })
    return result
  }, [initialSkills, search, selectedTipo, selectedArea, sortOrder])

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
        </div>
      </div>

      {activeTab === 'melhores' && (
        <MelhoresSkills topSemana={topSemana} topAllTime={topAllTime} destaques={destaques} />
      )}

      {activeTab === 'todos' && (
        <>
          <p className="text-zinc-500 text-sm mb-6">{filtered.length} skill{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}</p>

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

              {filtered.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-zinc-500 mb-2">Nenhuma skill encontrada</p>
                  {hasFilters && (
                    <button onClick={() => { setSearch(''); setSelectedTipo(''); setSelectedArea('') }} className="text-sm text-zinc-400 hover:text-white underline">
                      Limpar filtros
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filtered.map((skill: any) => (
                    <SkillCard key={skill.id} skill={skill} />
                  ))}
                </div>
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

function MelhoresSkills({ topSemana, topAllTime, destaques }: { topSemana: any[]; topAllTime: any[]; destaques: any[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        {topSemana.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Destaque da Semana</h2>
            <div className="space-y-2">
              {topSemana.slice(0, 5).map((s: any, i: number) => (
                <Link key={s.id} href={`/skills/${s.id}`} className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900 transition-all group">
                  <span className={`text-lg font-black w-8 text-center flex-shrink-0 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-amber-600' : 'text-zinc-600'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white group-hover:text-green-300 transition-colors truncate">{s.titulo}</p>
                    {s.areas_direito?.nome && <p className="text-xs text-zinc-600 mt-0.5">{s.areas_direito.nome}</p>}
                  </div>
                  <span className="text-xs text-zinc-500 flex-shrink-0">{s.votos_semana} curtidas</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {topAllTime.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Hall da Fama</h2>
            <div className="space-y-2">
              {topAllTime.map((s: any, i: number) => (
                <Link key={s.id} href={`/skills/${s.id}`} className="flex items-center gap-4 p-3 rounded-lg border border-zinc-800/50 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/60 transition-all group">
                  <span className="text-sm font-bold w-6 text-center flex-shrink-0 text-zinc-600">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-300 group-hover:text-white transition-colors truncate">{s.titulo}</p>
                    {s.areas_direito?.nome && <p className="text-xs text-zinc-600 mt-0.5">{s.areas_direito.nome}</p>}
                  </div>
                  <span className="text-xs text-zinc-600 flex-shrink-0">{s.total_votos} curtidas</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        {destaques.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Selecionadas pelos Admins
            </h2>
            <div className="space-y-2">
              {destaques.map((s: any) => (
                <Link key={s.id} href={`/skills/${s.id}`} className="block p-3 rounded-lg border border-yellow-500/10 bg-yellow-500/5 hover:border-yellow-500/20 transition-colors group">
                  <p className="text-sm text-zinc-300 group-hover:text-white transition-colors truncate">{s.titulo}</p>
                  {s.areas_direito?.nome && <p className="text-xs text-zinc-600 mt-0.5">{s.areas_direito.nome}</p>}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
