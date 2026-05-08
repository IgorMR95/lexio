'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Profile { id: string; full_name: string; email: string; role: string; created_at: string }
interface AuditLog { id: string; acao: string; entidade: string; entidade_id: string; detalhes: any; criado_em: string; profiles: { full_name: string } | null }
interface Categoria { id: string; nome: string; descricao: string | null; ordem: number; ativo: boolean }
interface Subcategoria { id: string; nome: string; categoria_id: string; ordem: number; ativo: boolean }
interface Subnivel { id: string; nome: string; subcategoria_id: string; ordem: number; ativo: boolean }
interface Area { id: string; nome: string; ordem: number; ativo: boolean }

interface Props {
  currentUserId: string
  profiles: Profile[]
  auditLogs: AuditLog[]
  categorias: Categoria[]
  subcategorias: Subcategoria[]
  subniveis: Subnivel[]
  areas: Area[]
  stats: { totalPrompts: number; pendentes: number; totalUsers: number }
}

const TABS = [
  { id: 'revisao', label: 'Revisão' },
  { id: 'prompts', label: 'Prompts' },
  { id: 'usuarios', label: 'Usuários' },
  { id: 'estrutura', label: 'Estrutura' },
  { id: 'areas', label: 'Áreas' },
  { id: 'grupos', label: 'Grupos' },
  { id: 'academy', label: 'Academy' },
  { id: 'auditoria', label: 'Auditoria' },
]

export function AdminClient({ currentUserId, profiles: initialProfiles, auditLogs, categorias: initialCategorias, subcategorias: initialSubcategorias, subniveis: initialSubniveis, areas: initialAreas, stats }: Props) {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState('revisao')
  const [profiles, setProfiles] = useState(initialProfiles)
  const [categorias, setCategorias] = useState(initialCategorias)
  const [subcategorias, setSubcategorias] = useState(initialSubcategorias)
  const [subniveis, setSubniveis] = useState(initialSubniveis)
  const [areas, setAreas] = useState(initialAreas)
  const [pendentes, setPendentes] = useState(stats.pendentes)

  const reloadProfiles = useCallback(async () => {
    const { data } = await (supabase as any).from('profiles').select('id, full_name, email, role, created_at').order('created_at', { ascending: false })
    setProfiles(data ?? [])
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs border border-amber-500/20">Admin</span>
            <h1 className="text-2xl font-bold text-white">Gestão da Base</h1>
          </div>
          <p className="text-zinc-500 text-sm">Gerenciamento completo do sistema</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <p className="text-xs text-zinc-500 mb-1">Total de prompts</p>
          <p className="text-2xl font-bold text-white">{stats.totalPrompts}</p>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 cursor-pointer hover:border-amber-500/30 transition-colors" onClick={() => setActiveTab('revisao')}>
          <p className="text-xs text-zinc-500 mb-1">Pendentes revisão</p>
          <p className="text-2xl font-bold text-amber-400">{pendentes}</p>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <p className="text-xs text-zinc-500 mb-1">Usuários</p>
          <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg mb-8 w-fit overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'}`}>
            {tab.label}
            {tab.id === 'revisao' && pendentes > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs">{pendentes}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'revisao' && <RevisaoTab onCountChange={setPendentes} />}
      {activeTab === 'prompts' && <PromptsTab areas={areas} categorias={categorias} subcategorias={subcategorias} />}
      {activeTab === 'usuarios' && <UsuariosTab profiles={profiles} currentUserId={currentUserId} onReload={reloadProfiles} />}
      {activeTab === 'estrutura' && (
        <EstruturaTab
          categorias={categorias} subcategorias={subcategorias} subniveis={subniveis}
          onReload={async () => {
            const [c, s, n] = await Promise.all([
              (supabase as any).from('categorias_principais').select('*').order('ordem'),
              (supabase as any).from('subcategorias').select('*').order('ordem'),
              (supabase as any).from('subniveis').select('*').order('ordem'),
            ])
            setCategorias(c.data ?? [])
            setSubcategorias(s.data ?? [])
            setSubniveis(n.data ?? [])
          }}
        />
      )}
      {activeTab === 'areas' && (
        <AreasTab areas={areas} onReload={async () => {
          const { data } = await (supabase as any).from('areas_direito').select('*').order('ordem')
          setAreas(data ?? [])
        }} />
      )}
      {activeTab === 'grupos' && <GruposAdminTab />}
      {activeTab === 'academy' && <AcademyAdminTab />}
      {activeTab === 'auditoria' && <AuditoriaTab logs={auditLogs} />}
    </div>
  )
}

// ── Revisão ───────────────────────────────────────────────────────────────────

function RevisaoTab({ onCountChange }: { onCountChange: (n: number) => void }) {
  const supabase = createClient()
  const [prompts, setPrompts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [detalhes, setDetalhes] = useState<any | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await (supabase as any)
      .from('prompts')
      .select('*, areas_direito(nome), categorias_principais(nome)')
      .eq('status', 'pendente')
      .order('created_at', { ascending: true })
    if (!data) { setLoading(false); return }

    // Busca profiles dos autores separadamente (autor_id pode ser null)
    const autorIds = Array.from(new Set<string>(data.map((p: any) => p.autor_id).filter(Boolean)))
    const profileMap: Record<string, any> = {}
    if (autorIds.length > 0) {
      const { data: profiles } = await (supabase as any)
        .from('profiles')
        .select('id, full_name, email')
        .in('id', autorIds)
      profiles?.forEach((p: any) => { profileMap[p.id] = p })
    }

    setPrompts(data.map((p: any) => ({ ...p, autorProfile: profileMap[p.autor_id] ?? null })))
    onCountChange(data.length)
    setLoading(false)
  }, [onCountChange])

  useEffect(() => { load() }, [load])

  const aprovar = async (id: string) => {
    const { error } = await (supabase as any).from('prompts').update({ status: 'aprovado' }).eq('id', id)
    if (error) { alert('Erro ao aprovar: ' + error.message); return }
    load()
  }
  const rejeitar = async (id: string) => {
    if (!confirm('Rejeitar e remover este prompt?')) return
    await (supabase as any).from('prompts').delete().eq('id', id)
    load()
  }
  const marcarAtivo = async (id: string) => {
    const { error } = await (supabase as any).from('prompts').update({ status: 'ativo' }).eq('id', id)
    if (error) { alert('Erro ao ativar: ' + error.message); return }
    load()
  }

  if (loading) return <div className="text-center py-16 text-zinc-500 text-sm">Carregando...</div>

  if (prompts.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
        <p className="text-zinc-400 font-medium">Nenhum prompt pendente</p>
        <p className="text-zinc-600 text-sm mt-1">Todos os envios foram revisados.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500">{prompts.length} prompt(s) aguardando revisão — mais antigos primeiro</p>
      {prompts.map(p => (
        <div key={p.id} className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
          <div className="px-4 py-3 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm">{p.titulo}</p>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-xs text-zinc-500">
                  por <span className="text-zinc-400">{p.autorProfile?.full_name ?? p.autorProfile?.email ?? '—'}</span>
                </span>
                {p.areas_direito?.nome && <span className="text-xs text-zinc-600">{p.areas_direito.nome}</span>}
                {p.categorias_principais?.nome && <span className="text-xs text-zinc-600">{p.categorias_principais.nome}</span>}
                {p.internacional && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Internacional{p.idioma ? ` · ${p.idioma.toUpperCase()}` : ''}
                  </span>
                )}
                <span className="text-xs text-zinc-600">{new Date(p.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
              {p.descricao_curta && <p className="text-xs text-zinc-500 mt-1 italic">{p.descricao_curta}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
              <button onClick={() => setDetalhes(p)}
                className="text-xs text-zinc-500 hover:text-white transition-colors px-2 py-1 rounded border border-zinc-800 hover:border-zinc-600">
                Ver detalhes
              </button>
              <button onClick={() => aprovar(p.id)}
                className="text-xs px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors font-medium">
                Aprovar
              </button>
              <button onClick={() => marcarAtivo(p.id)}
                className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors font-medium">
                Ativar
              </button>
              <button onClick={() => rejeitar(p.id)}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors font-medium">
                Rejeitar
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Modal de detalhes do prompt */}
      {detalhes && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 rounded-xl border border-zinc-700 w-full max-w-3xl my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <div>
                <h3 className="text-white font-semibold">{detalhes.titulo}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  por {detalhes.autorProfile?.full_name ?? detalhes.autorProfile?.email ?? '—'} · {new Date(detalhes.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <button onClick={() => setDetalhes(null)} className="text-zinc-500 hover:text-white text-2xl leading-none ml-4">×</button>
            </div>
            <div className="p-6 space-y-4">
              {detalhes.descricao_curta && (
                <p className="text-sm text-zinc-400 italic">{detalhes.descricao_curta}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {detalhes.areas_direito?.nome && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20">{detalhes.areas_direito.nome}</span>
                )}
                {detalhes.categorias_principais?.nome && (
                  <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs">{detalhes.categorias_principais.nome}</span>
                )}
                {detalhes.internacional && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs border border-indigo-500/20">
                    Internacional{detalhes.idioma ? ` · ${detalhes.idioma.toUpperCase()}` : ''}
                  </span>
                )}
                {detalhes.tags?.map((t: string) => (
                  <span key={t} className="text-xs text-zinc-600">#{t}</span>
                ))}
              </div>
              <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-5">
                <pre className="whitespace-pre-wrap text-sm text-zinc-300 leading-relaxed font-sans">
                  {detalhes.texto_completo}
                </pre>
              </div>
              {detalhes.observacoes && (
                <p className="text-xs text-amber-400 bg-amber-500/5 border border-amber-500/10 rounded px-3 py-2">
                  Obs. do autor: {detalhes.observacoes}
                </p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-zinc-800 flex gap-3 justify-end">
              <button onClick={() => { rejeitar(detalhes.id); setDetalhes(null) }}
                className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-sm hover:bg-red-500/20 transition-colors">
                Rejeitar
              </button>
              <button onClick={() => { marcarAtivo(detalhes.id); setDetalhes(null) }}
                className="px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-sm hover:bg-blue-500/20 transition-colors font-medium">
                Ativar
              </button>
              <button onClick={() => { aprovar(detalhes.id); setDetalhes(null) }}
                className="px-4 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 text-sm hover:bg-green-500/20 transition-colors font-medium">
                Aprovar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Prompts CRUD ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

const IDIOMAS = [
  { code: 'en', label: 'Inglês (EN)' },
  { code: 'es', label: 'Espanhol (ES)' },
  { code: 'fr', label: 'Francês (FR)' },
  { code: 'de', label: 'Alemão (DE)' },
  { code: 'it', label: 'Italiano (IT)' },
  { code: 'pt-PT', label: 'Português (PT-PT)' },
  { code: 'zh', label: 'Chinês (ZH)' },
  { code: 'ja', label: 'Japonês (JA)' },
  { code: 'ar', label: 'Árabe (AR)' },
]

function PromptsTab({ areas, categorias, subcategorias }: { areas: Area[]; categorias: Categoria[]; subcategorias: Subcategoria[] }) {
  const supabase = createClient()
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterInternacional, setFilterInternacional] = useState('')
  const [editing, setEditing] = useState<any>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [batchAction, setBatchAction] = useState('')
  const [batchInternacional, setBatchInternacional] = useState('')
  const [batchIdioma, setBatchIdioma] = useState('')
  const [batchLoading, setBatchLoading] = useState(false)

  const searchRef = useRef(search)
  const filterStatusRef = useRef(filterStatus)
  const filterInternacionalRef = useRef(filterInternacional)
  searchRef.current = search
  filterStatusRef.current = filterStatus
  filterInternacionalRef.current = filterInternacional

  const load = useCallback(async (p: number, s: string, fs: string, fi: string) => {
    setLoading(true)
    setSelected(new Set())
    let q = (supabase as any)
      .from('prompts')
      .select('*, areas_direito(nome), categorias_principais(nome)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(p * PAGE_SIZE, p * PAGE_SIZE + PAGE_SIZE - 1)
    if (s) q = q.or(`titulo.ilike.%${s}%,texto_completo.ilike.%${s}%`)
    if (fs) q = q.eq('status', fs)
    if (fi === 'sim') q = q.eq('internacional', true)
    if (fi === 'nao') q = q.eq('internacional', false)
    const { data: rows, count } = await q

    // Busca profiles dos autores separadamente
    const autorIds = Array.from(new Set<string>((rows ?? []).map((r: any) => r.autor_id).filter(Boolean)))
    const profileMap: Record<string, any> = {}
    if (autorIds.length > 0) {
      const { data: profiles } = await (supabase as any)
        .from('profiles').select('id, full_name').in('id', autorIds)
      profiles?.forEach((pr: any) => { profileMap[pr.id] = pr })
    }
    setData((rows ?? []).map((r: any) => ({ ...r, autorProfile: profileMap[r.autor_id] ?? null })))
    setTotal(count ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => {
    setPage(0)
    load(0, search, filterStatus, filterInternacional)
  }, [search, filterStatus, filterInternacional])

  useEffect(() => {
    load(page, searchRef.current, filterStatusRef.current, filterInternacionalRef.current)
  }, [page])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === data.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(data.map(r => r.id)))
    }
  }

  const executeBatch = async () => {
    if (!batchAction || selected.size === 0) return
    setBatchLoading(true)
    const ids = Array.from(selected)

    if (batchAction === 'deletar') {
      if (!confirm(`Deletar ${ids.length} prompt(s) selecionado(s)?`)) { setBatchLoading(false); return }
      await (supabase as any).from('prompts').delete().in('id', ids)
    } else if (['aprovado', 'ativo', 'pendente', 'inativo'].includes(batchAction)) {
      await (supabase as any).from('prompts').update({ status: batchAction }).in('id', ids)
    } else if (batchAction === 'origem') {
      const isIntl = batchInternacional === 'sim'
      await (supabase as any).from('prompts').update({
        internacional: isIntl,
        idioma: isIntl ? (batchIdioma || null) : null,
      }).in('id', ids)
    }

    setBatchAction('')
    setBatchInternacional('')
    setBatchIdioma('')
    setBatchLoading(false)
    load(page, searchRef.current, filterStatusRef.current, filterInternacionalRef.current)
  }

  const openEdit = (row: any) => {
    setEditing(row)
    setEditForm({
      titulo: row.titulo,
      descricao_curta: row.descricao_curta ?? '',
      texto_completo: row.texto_completo,
      status: row.status,
      area_direito_id: row.area_direito_id ?? '',
      categoria_id: row.categoria_id ?? '',
      subcategoria_id: row.subcategoria_id ?? '',
      tags: Array.isArray(row.tags) ? row.tags.join(', ') : '',
      internacional: row.internacional ?? false,
      idioma: row.idioma ?? '',
      destaque: row.destaque ?? false,
    })
  }

  const saveEdit = async () => {
    if (!editing) return
    setSaving(true)
    await (supabase as any).from('prompts').update({
      titulo: editForm.titulo,
      descricao_curta: editForm.descricao_curta || null,
      texto_completo: editForm.texto_completo,
      status: editForm.status,
      area_direito_id: editForm.area_direito_id || null,
      categoria_id: editForm.categoria_id || null,
      subcategoria_id: editForm.subcategoria_id || null,
      tags: editForm.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
      internacional: editForm.internacional,
      idioma: editForm.internacional ? (editForm.idioma || null) : null,
      destaque: editForm.destaque,
    }).eq('id', editing.id)
    setEditing(null)
    setSaving(false)
    load(page, searchRef.current, filterStatusRef.current, filterInternacionalRef.current)
  }

  const handleDelete = async (id: string, titulo: string) => {
    if (!confirm(`Deletar "${titulo}"?`)) return
    await (supabase as any).from('prompts').delete().eq('id', id)
    load(page, searchRef.current, filterStatusRef.current, filterInternacionalRef.current)
  }

  const exportAll = async () => {
    const XLSX = await import('xlsx')
    const { data: all } = await (supabase as any).from('prompts').select('*, areas_direito(nome), categorias_principais(nome), subcategorias(nome)')
    if (!all) return
    const rows = all.map((p: any) => ({
      Título: p.titulo,
      Descrição: p.descricao_curta ?? '',
      'Prompt Completo': p.texto_completo,
      Categoria: p.categorias_principais?.nome ?? '',
      Subcategoria: p.subcategorias?.nome ?? '',
      Área: p.areas_direito?.nome ?? '',
      Tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
      Status: p.status,
      Internacional: p.internacional ? 'Sim' : 'Não',
      Idioma: p.idioma ?? '',
      Data: new Date(p.created_at).toLocaleDateString('pt-BR'),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Prompts')
    XLSX.writeFile(wb, `midori-base-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const filteredSubs = editForm.categoria_id ? subcategorias.filter(s => s.categoria_id === editForm.categoria_id) : subcategorias

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar prompts..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 text-sm" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm focus:outline-none">
          <option value="">Todos os status</option>
          <option value="aprovado">Aprovado</option>
          <option value="ativo">Ativo</option>
          <option value="pendente">Pendente</option>
          <option value="inativo">Inativo</option>
        </select>
        <select value={filterInternacional} onChange={e => setFilterInternacional(e.target.value)}
          className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm focus:outline-none">
          <option value="">Nacional + Internacional</option>
          <option value="nao">Somente nacionais</option>
          <option value="sim">Somente internacionais</option>
        </select>
        <span className="text-xs text-zinc-500">{total} prompts</span>
        <button onClick={exportAll} className="px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-xs hover:text-white hover:border-zinc-500 transition-colors">
          Exportar Excel
        </button>
      </div>

      {/* Ações em lote */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 flex-wrap p-3 rounded-lg bg-zinc-900 border border-zinc-700">
          <span className="text-xs text-zinc-400 font-medium">{selected.size} selecionado(s)</span>
          <select value={batchAction} onChange={e => { setBatchAction(e.target.value); setBatchInternacional(''); setBatchIdioma('') }}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs focus:outline-none">
            <option value="">Ação em lote...</option>
            <option value="aprovado">Marcar como Aprovado</option>
            <option value="ativo">Marcar como Ativo</option>
            <option value="pendente">Marcar como Pendente</option>
            <option value="inativo">Marcar como Inativo</option>
            <option value="origem">Reclassificar Origem</option>
            <option value="deletar">Deletar selecionados</option>
          </select>
          {batchAction === 'origem' && (
            <>
              <select value={batchInternacional} onChange={e => { setBatchInternacional(e.target.value); setBatchIdioma('') }}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs focus:outline-none">
                <option value="">Origem...</option>
                <option value="nao">Nacional</option>
                <option value="sim">Internacional</option>
              </select>
              {batchInternacional === 'sim' && (
                <select value={batchIdioma} onChange={e => setBatchIdioma(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs focus:outline-none">
                  <option value="">Idioma (opcional)...</option>
                  {IDIOMAS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              )}
            </>
          )}
          {batchAction && (
            <button onClick={executeBatch} disabled={batchLoading}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${batchAction === 'deletar' ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' : 'bg-white text-zinc-950 hover:bg-zinc-100'}`}>
              {batchLoading ? 'Aplicando...' : 'Aplicar'}
            </button>
          )}
          <button onClick={() => setSelected(new Set())} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors ml-auto">Limpar seleção</button>
        </div>
      )}

      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900/50 border-b border-zinc-800">
              <th className="px-4 py-3 w-8">
                <input type="checkbox" checked={data.length > 0 && selected.size === data.length}
                  onChange={toggleSelectAll}
                  className="rounded border-zinc-600 bg-zinc-800 text-white" />
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Título</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 hidden md:table-cell">Autor</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 hidden lg:table-cell">Origem</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-zinc-500 text-sm">Carregando...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-zinc-500 text-sm">Nenhum prompt encontrado</td></tr>
            ) : data.map(row => (
              <tr key={row.id} className={`hover:bg-zinc-900/30 transition-colors ${selected.has(row.id) ? 'bg-zinc-900/50' : ''}`}>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleSelect(row.id)}
                    className="rounded border-zinc-600 bg-zinc-800" />
                </td>
                <td className="px-4 py-3">
                  <p className="text-white text-sm font-medium line-clamp-1">{row.titulo}</p>
                  <p className="text-zinc-600 text-xs mt-0.5">{new Date(row.created_at).toLocaleDateString('pt-BR')}</p>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs text-zinc-400">{row.autorProfile?.full_name ?? '—'}</span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {row.internacional ? (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      Intl{row.idioma ? ` · ${row.idioma.toUpperCase()}` : ''}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-600">Nacional</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={async () => {
                        await (supabase as any).from('prompts').update({ destaque: !row.destaque }).eq('id', row.id)
                        load(page, searchRef.current, filterStatusRef.current, filterInternacionalRef.current)
                      }}
                      title={row.destaque ? 'Remover destaque' : 'Marcar como destaque'}
                      className={`text-xs transition-colors ${row.destaque ? 'text-yellow-400 hover:text-zinc-400' : 'text-zinc-600 hover:text-yellow-400'}`}
                    >
                      <svg className="w-4 h-4" fill={row.destaque ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                    <button onClick={() => openEdit(row)} className="text-xs text-zinc-400 hover:text-white transition-colors">Editar</button>
                    <button onClick={() => handleDelete(row.id, row.titulo)} className="text-xs text-red-400/70 hover:text-red-400 transition-colors">Deletar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}</p>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-400 text-xs hover:text-white disabled:opacity-30 transition-colors">← Anterior</button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-400 text-xs hover:text-white disabled:opacity-30 transition-colors">Próximo →</button>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 rounded-xl border border-zinc-700 w-full max-w-2xl my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h3 className="text-white font-semibold">Editar prompt</h3>
              <button onClick={() => setEditing(null)} className="text-zinc-500 hover:text-white text-xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Título</label>
                <input value={editForm.titulo} onChange={e => setEditForm({ ...editForm, titulo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Descrição curta</label>
                <input value={editForm.descricao_curta} onChange={e => setEditForm({ ...editForm, descricao_curta: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Texto completo</label>
                <textarea rows={8} value={editForm.texto_completo} onChange={e => setEditForm({ ...editForm, texto_completo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none resize-none font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Status</label>
                  <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm focus:outline-none">
                    <option value="pendente">Pendente</option>
                    <option value="aprovado">Aprovado</option>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Área do Direito</label>
                  <select value={editForm.area_direito_id} onChange={e => setEditForm({ ...editForm, area_direito_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm focus:outline-none">
                    <option value="">— Sem área —</option>
                    {areas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Categoria</label>
                  <select value={editForm.categoria_id} onChange={e => setEditForm({ ...editForm, categoria_id: e.target.value, subcategoria_id: '' })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm focus:outline-none">
                    <option value="">— Sem categoria —</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Subcategoria</label>
                  <select value={editForm.subcategoria_id} onChange={e => setEditForm({ ...editForm, subcategoria_id: e.target.value })}
                    disabled={!editForm.categoria_id}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm focus:outline-none disabled:opacity-40">
                    <option value="">— Sem subcategoria —</option>
                    {filteredSubs.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Tags (separadas por vírgula)</label>
                <input value={editForm.tags} onChange={e => setEditForm({ ...editForm, tags: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none" />
              </div>
              {/* Destaque */}
              <div className="rounded-lg border border-zinc-700 p-4 bg-zinc-800/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white font-medium">Selo Destaque</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Exibe badge e aparece na seção de destaques</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, destaque: !editForm.destaque })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${editForm.destaque ? 'bg-yellow-500' : 'bg-zinc-700'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${editForm.destaque ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              {/* Internacional */}
              <div className="rounded-lg border border-zinc-700 p-4 space-y-3 bg-zinc-800/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white font-medium">Prompt Internacional</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Marque se este prompt é de origem estrangeira</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, internacional: !editForm.internacional, idioma: !editForm.internacional ? '' : editForm.idioma })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${editForm.internacional ? 'bg-teal-500' : 'bg-zinc-700'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${editForm.internacional ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
                {editForm.internacional && (
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">Idioma</label>
                    <select value={editForm.idioma} onChange={e => setEditForm({ ...editForm, idioma: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm focus:outline-none">
                      <option value="">— Selecionar idioma —</option>
                      {IDIOMAS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-zinc-800 flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Cancelar</button>
              <button onClick={saveEdit} disabled={saving}
                className="px-4 py-2 rounded-lg bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors disabled:opacity-50">
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Usuários ──────────────────────────────────────────────────────────────────

function UsuariosTab({ profiles, currentUserId, onReload }: { profiles: Profile[]; currentUserId: string; onReload: () => void }) {
  const supabase = createClient()
  const [editing, setEditing] = useState<Profile | null>(null)
  const [editRole, setEditRole] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ email: '', password: '', full_name: '', role: 'user' })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleRoleChange = async () => {
    if (!editing) return
    const { error } = await (supabase as any).from('profiles').update({ role: editRole }).eq('id', editing.id)
    if (error) { alert('Erro ao alterar role: ' + error.message); return }
    setEditing(null)
    onReload()
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    setCreating(true)
    const { error } = await supabase.auth.signUp({
      email: createForm.email,
      password: createForm.password,
      options: { data: { full_name: createForm.full_name } },
    })
    if (error) {
      setCreateError(error.message)
      setCreating(false)
      return
    }
    if (createForm.role === 'admin') {
      await new Promise(r => setTimeout(r, 1000))
      const { data: np } = await (supabase as any).from('profiles').select('id').eq('email', createForm.email).single()
      if (np) await (supabase as any).from('profiles').update({ role: 'admin' }).eq('id', np.id)
    }
    setShowCreate(false)
    setCreateForm({ email: '', password: '', full_name: '', role: 'user' })
    setCreating(false)
    onReload()
  }

  const handleDelete = async (p: Profile) => {
    if (!confirm(`Deletar o usuário "${p.full_name || p.email}"? Esta ação não pode ser desfeita.`)) return
    setDeleting(p.id)
    const res = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: p.id }),
    })
    if (!res.ok) {
      const { error } = await res.json()
      alert('Erro ao deletar: ' + (error ?? 'desconhecido'))
    }
    setDeleting(null)
    onReload()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded-lg bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors">
          + Criar usuário
        </button>
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900/50 border-b border-zinc-800">
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Nome</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Perfil</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 hidden md:table-cell">Cadastro</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {profiles.map(p => (
              <tr key={p.id} className={`hover:bg-zinc-900/30 transition-colors ${deleting === p.id ? 'opacity-40' : ''}`}>
                <td className="px-4 py-3 text-white text-sm font-medium">{p.full_name || '—'}</td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{p.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${p.role === 'admin' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                    {p.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs hidden md:table-cell">{new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    {p.id !== currentUserId && (
                      <>
                        <button onClick={() => { setEditing(p); setEditRole(p.role) }} className="text-xs text-zinc-400 hover:text-white transition-colors">Editar</button>
                        <button onClick={() => handleDelete(p)} className="text-xs text-red-400/70 hover:text-red-400 transition-colors">Apagar</button>
                      </>
                    )}
                    {p.id === currentUserId && <span className="text-xs text-zinc-600">você</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal editar role */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-xl border border-zinc-700 w-full max-w-sm p-6 space-y-4">
            <h3 className="text-white font-semibold">Editar: {editing.full_name || editing.email}</h3>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Nível de acesso</label>
              <select value={editRole} onChange={e => setEditRole(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none">
                <option value="user">Usuário</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Cancelar</button>
              <button onClick={handleRoleChange} className="px-4 py-2 rounded-lg bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal criar usuário */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-xl border border-zinc-700 w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h3 className="text-white font-semibold">Criar novo usuário</h3>
              <button onClick={() => setShowCreate(false)} className="text-zinc-500 hover:text-white text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Nome completo</label>
                <input required value={createForm.full_name} onChange={e => setCreateForm({ ...createForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none"
                  placeholder="Dr. João Silva" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Email</label>
                <input required type="email" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none"
                  placeholder="usuario@email.com" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Senha inicial</label>
                <input required type="password" minLength={6} value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none"
                  placeholder="mínimo 6 caracteres" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Perfil</label>
                <select value={createForm.role} onChange={e => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm focus:outline-none">
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              {createError && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{createError}</p>
              )}
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Cancelar</button>
                <button type="submit" disabled={creating}
                  className="px-4 py-2 rounded-lg bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors disabled:opacity-50">
                  {creating ? 'Criando...' : 'Criar usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Auditoria ──────────────────────────────────────────────────────────────────

function AuditoriaTab({ logs }: { logs: AuditLog[] }) {
  if (logs.length === 0) return <div className="text-center py-16 text-zinc-500 text-sm">Nenhum log encontrado.</div>
  return (
    <div className="space-y-3">
      {logs.map(log => (
        <div key={log.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white">
              <span className="font-medium">{log.profiles?.full_name ?? 'Sistema'}</span>
              <span className="text-zinc-400"> realizou </span>
              <span className="uppercase text-xs font-bold text-amber-400">{log.acao}</span>
            </p>
            <p className="text-xs text-zinc-500 mt-1">Entidade: {log.entidade} {log.entidade_id ? `(ID: ${log.entidade_id})` : ''}</p>
            {log.detalhes && (
              <pre className="mt-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 overflow-auto max-h-24">
                {JSON.stringify(log.detalhes, null, 2)}
              </pre>
            )}
          </div>
          <span className="text-xs text-zinc-600 whitespace-nowrap flex-shrink-0">{new Date(log.criado_em).toLocaleString('pt-BR')}</span>
        </div>
      ))}
    </div>
  )
}

// ── Estrutura ──────────────────────────────────────────────────────────────────

function EstruturaTab({ categorias, subcategorias, subniveis, onReload }: { categorias: Categoria[]; subcategorias: Subcategoria[]; subniveis: Subnivel[]; onReload: () => void }) {
  const supabase = createClient()
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  const [expandedSub, setExpandedSub] = useState<string | null>(null)
  const [newCatName, setNewCatName] = useState('')
  const [newSubName, setNewSubName] = useState('')
  const [newSubForCat, setNewSubForCat] = useState('')
  const [newNivelName, setNewNivelName] = useState('')
  const [newNivelForSub, setNewNivelForSub] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const addCategoria = async () => {
    if (!newCatName.trim()) return
    const maxOrdem = categorias.length ? Math.max(...categorias.map(c => c.ordem)) + 1 : 1
    await (supabase as any).from('categorias_principais').insert({ nome: newCatName.trim(), ordem: maxOrdem, ativo: true })
    setNewCatName(''); onReload()
  }
  const addSubcategoria = async (catId: string) => {
    if (!newSubName.trim() || newSubForCat !== catId) return
    const subs = subcategorias.filter(s => s.categoria_id === catId)
    const maxOrdem = subs.length ? Math.max(...subs.map(s => s.ordem)) + 1 : 1
    await (supabase as any).from('subcategorias').insert({ nome: newSubName.trim(), categoria_id: catId, ordem: maxOrdem, ativo: true })
    setNewSubName(''); setNewSubForCat(''); onReload()
  }
  const addSubnivel = async (subId: string) => {
    if (!newNivelName.trim() || newNivelForSub !== subId) return
    const niveis = subniveis.filter(s => s.subcategoria_id === subId)
    const maxOrdem = niveis.length ? Math.max(...niveis.map(s => s.ordem)) + 1 : 1
    await (supabase as any).from('subniveis').insert({ nome: newNivelName.trim(), subcategoria_id: subId, ordem: maxOrdem, ativo: true })
    setNewNivelName(''); setNewNivelForSub(''); onReload()
  }
  const toggleAtivo = async (table: string, id: string, current: boolean) => {
    await (supabase as any).from(table).update({ ativo: !current }).eq('id', id); onReload()
  }
  const deleteItem = async (table: string, id: string, label: string) => {
    if (!confirm(`Remover "${label}"?`)) return
    await (supabase as any).from(table).delete().eq('id', id); onReload()
  }
  const startEdit = (id: string, nome: string) => { setEditingId(id); setEditingName(nome) }
  const saveEdit = async (table: string) => {
    if (!editingName.trim() || !editingId) return
    await (supabase as any).from(table).update({ nome: editingName.trim() }).eq('id', editingId)
    setEditingId(null); setEditingName(''); onReload()
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Nova categoria principal..."
          className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 text-sm focus:outline-none"
          onKeyDown={e => e.key === 'Enter' && addCategoria()} />
        <button onClick={addCategoria} className="px-4 py-2 rounded-lg bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors">+ Categoria</button>
      </div>
      {categorias.map(cat => {
        const catSubs = subcategorias.filter(s => s.categoria_id === cat.id)
        return (
          <div key={cat.id} className="rounded-xl border border-zinc-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/50 cursor-pointer hover:bg-zinc-900"
              onClick={() => editingId !== cat.id && setExpandedCat(expandedCat === cat.id ? null : cat.id)}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {editingId === cat.id ? (
                  <div className="flex items-center gap-2 flex-1" onClick={e => e.stopPropagation()}>
                    <input autoFocus value={editingName} onChange={e => setEditingName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit('categorias_principais'); if (e.key === 'Escape') { setEditingId(null); setEditingName('') } }}
                      className="flex-1 px-2 py-1 rounded bg-zinc-800 border border-zinc-600 text-white text-sm focus:outline-none focus:border-zinc-400" />
                    <button onClick={() => saveEdit('categorias_principais')} className="text-xs text-green-400 hover:text-green-300 transition-colors">Salvar</button>
                    <button onClick={() => { setEditingId(null); setEditingName('') }} className="text-xs text-zinc-500 hover:text-white transition-colors">Cancelar</button>
                  </div>
                ) : (
                  <>
                    <span className="text-white font-medium text-sm">{cat.nome}</span>
                    <span className="text-xs text-zinc-600">{catSubs.length} subcategorias</span>
                    {!cat.ativo && <span className="text-xs text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">inativo</span>}
                  </>
                )}
              </div>
              {editingId !== cat.id && (
                <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                  <button onClick={() => startEdit(cat.id, cat.nome)} className="text-xs text-zinc-500 hover:text-white transition-colors">Editar</button>
                  <button onClick={() => toggleAtivo('categorias_principais', cat.id, cat.ativo)}
                    className={`text-xs transition-colors ${cat.ativo ? 'text-zinc-500 hover:text-amber-400' : 'text-zinc-600 hover:text-green-400'}`}>
                    {cat.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                  <button onClick={() => deleteItem('categorias_principais', cat.id, cat.nome)} className="text-xs text-red-400/60 hover:text-red-400 transition-colors">Remover</button>
                  <span className="text-zinc-600">{expandedCat === cat.id ? '▲' : '▼'}</span>
                </div>
              )}
            </div>
            {expandedCat === cat.id && (
              <div className="border-t border-zinc-800 divide-y divide-zinc-800/50">
                {catSubs.map(sub => {
                  const subNiveis = subniveis.filter(n => n.subcategoria_id === sub.id)
                  return (
                    <div key={sub.id}>
                      <div className="flex items-center justify-between px-6 py-2.5 hover:bg-zinc-900/20 cursor-pointer"
                        onClick={() => editingId !== sub.id && setExpandedSub(expandedSub === sub.id ? null : sub.id)}>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {editingId === sub.id ? (
                            <div className="flex items-center gap-2 flex-1" onClick={e => e.stopPropagation()}>
                              <span className="text-zinc-600 text-sm">↳</span>
                              <input autoFocus value={editingName} onChange={e => setEditingName(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') saveEdit('subcategorias'); if (e.key === 'Escape') { setEditingId(null); setEditingName('') } }}
                                className="flex-1 px-2 py-1 rounded bg-zinc-800 border border-zinc-600 text-white text-sm focus:outline-none focus:border-zinc-400" />
                              <button onClick={() => saveEdit('subcategorias')} className="text-xs text-green-400 hover:text-green-300 transition-colors">Salvar</button>
                              <button onClick={() => { setEditingId(null); setEditingName('') }} className="text-xs text-zinc-500 hover:text-white transition-colors">Cancelar</button>
                            </div>
                          ) : (
                            <>
                              <span className="text-zinc-300 text-sm">↳ {sub.nome}</span>
                              <span className="text-xs text-zinc-600">{subNiveis.length} subníveis</span>
                            </>
                          )}
                        </div>
                        {editingId !== sub.id && (
                          <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                            <button onClick={() => startEdit(sub.id, sub.nome)} className="text-xs text-zinc-500 hover:text-white transition-colors">Editar</button>
                            <button onClick={() => deleteItem('subcategorias', sub.id, sub.nome)} className="text-xs text-red-400/60 hover:text-red-400 transition-colors">Remover</button>
                            <span className="text-zinc-600 text-xs">{expandedSub === sub.id ? '▲' : '▼'}</span>
                          </div>
                        )}
                      </div>
                      {expandedSub === sub.id && (
                        <div className="px-10 py-2 bg-zinc-950/30 space-y-1">
                          {subNiveis.map(n => (
                            <div key={n.id} className="flex items-center justify-between py-1">
                              {editingId === n.id ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <span className="text-zinc-600 text-xs">↳</span>
                                  <input autoFocus value={editingName} onChange={e => setEditingName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') saveEdit('subniveis'); if (e.key === 'Escape') { setEditingId(null); setEditingName('') } }}
                                    className="flex-1 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-600 text-white text-xs focus:outline-none focus:border-zinc-400" />
                                  <button onClick={() => saveEdit('subniveis')} className="text-xs text-green-400 hover:text-green-300 transition-colors">Salvar</button>
                                  <button onClick={() => { setEditingId(null); setEditingName('') }} className="text-xs text-zinc-500 hover:text-white transition-colors">Cancelar</button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-zinc-400 text-xs">↳ {n.nome}</span>
                                  <div className="flex items-center gap-3">
                                    <button onClick={() => startEdit(n.id, n.nome)} className="text-xs text-zinc-600 hover:text-white transition-colors">Editar</button>
                                    <button onClick={() => deleteItem('subniveis', n.id, n.nome)} className="text-xs text-red-400/60 hover:text-red-400 transition-colors">Remover</button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                          <div className="flex gap-2 pt-2">
                            <input value={newNivelForSub === sub.id ? newNivelName : ''}
                              onChange={e => { setNewNivelForSub(sub.id); setNewNivelName(e.target.value) }}
                              placeholder="Novo subnível..."
                              className="flex-1 px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 text-xs focus:outline-none"
                              onKeyDown={e => e.key === 'Enter' && addSubnivel(sub.id)} />
                            <button onClick={() => addSubnivel(sub.id)} className="px-3 py-1 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition-colors">+ Subnível</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
                <div className="px-6 py-3 flex gap-2">
                  <input value={newSubForCat === cat.id ? newSubName : ''}
                    onChange={e => { setNewSubForCat(cat.id); setNewSubName(e.target.value) }}
                    placeholder="Nova subcategoria..."
                    className="flex-1 px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 text-xs focus:outline-none"
                    onKeyDown={e => e.key === 'Enter' && addSubcategoria(cat.id)} />
                  <button onClick={() => addSubcategoria(cat.id)} className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition-colors">+ Sub</button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Áreas ─────────────────────────────────────────────────────────────────────

function AreasTab({ areas, onReload }: { areas: Area[]; onReload: () => void }) {
  const supabase = createClient()
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const addArea = async () => {
    if (!newName.trim()) return
    const maxOrdem = areas.length ? Math.max(...areas.map(a => a.ordem)) + 1 : 1
    await (supabase as any).from('areas_direito').insert({ nome: newName.trim(), ordem: maxOrdem, ativo: true })
    setNewName(''); onReload()
  }
  const toggleAtivo = async (id: string, current: boolean) => {
    await (supabase as any).from('areas_direito').update({ ativo: !current }).eq('id', id); onReload()
  }
  const deleteArea = async (id: string, nome: string) => {
    if (!confirm(`Remover "${nome}"?`)) return
    await (supabase as any).from('areas_direito').delete().eq('id', id); onReload()
  }
  const saveEdit = async () => {
    if (!editingName.trim() || !editingId) return
    await (supabase as any).from('areas_direito').update({ nome: editingName.trim() }).eq('id', editingId)
    setEditingId(null); setEditingName(''); onReload()
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nova área do direito..."
          className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 text-sm focus:outline-none"
          onKeyDown={e => e.key === 'Enter' && addArea()} />
        <button onClick={addArea} className="px-4 py-2 rounded-lg bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors">+ Área</button>
      </div>
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900/50 border-b border-zinc-800">
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Nome</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Status</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {areas.map(a => (
              <tr key={a.id} className="hover:bg-zinc-900/30 transition-colors">
                <td className="px-4 py-3">
                  {editingId === a.id ? (
                    <div className="flex items-center gap-2">
                      <input autoFocus value={editingName} onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') { setEditingId(null); setEditingName('') } }}
                        className="flex-1 px-2 py-1 rounded bg-zinc-800 border border-zinc-600 text-white text-sm focus:outline-none focus:border-zinc-400" />
                      <button onClick={saveEdit} className="text-xs text-green-400 hover:text-green-300 transition-colors">Salvar</button>
                      <button onClick={() => { setEditingId(null); setEditingName('') }} className="text-xs text-zinc-500 hover:text-white transition-colors">Cancelar</button>
                    </div>
                  ) : (
                    <span className="text-white text-sm">{a.nome}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${a.ativo ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                    {a.ativo ? 'ativa' : 'inativa'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {editingId !== a.id && (
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => { setEditingId(a.id); setEditingName(a.nome) }} className="text-xs text-zinc-400 hover:text-white transition-colors">Editar</button>
                      <button onClick={() => toggleAtivo(a.id, a.ativo)}
                        className={`text-xs transition-colors ${a.ativo ? 'text-zinc-500 hover:text-amber-400' : 'text-zinc-600 hover:text-green-400'}`}>
                        {a.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                      <button onClick={() => deleteArea(a.id, a.nome)} className="text-xs text-red-400/60 hover:text-red-400 transition-colors">Remover</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {areas.length === 0 && <tr><td colSpan={3} className="px-4 py-10 text-center text-zinc-500 text-sm">Nenhuma área cadastrada</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Grupos Admin ──────────────────────────────────────────────────────────────

interface Grupo { id: string; nome: string; descricao: string | null; tipo: string; criado_por: string | null; created_at: string; _membros?: number }

function GruposAdminTab() {
  const supabase = createClient()
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Grupo | null>(null)
  const [editForm, setEditForm] = useState({ nome: '', descricao: '', tipo: 'publico' })
  const [saving, setSaving] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ nome: '', descricao: '', tipo: 'publico' })
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await (supabase as any)
      .from('grupos')
      .select('*, grupo_membros(count)')
      .order('created_at', { ascending: false })
    if (data) {
      setGrupos(data.map((g: any) => ({
        ...g,
        _membros: g.grupo_membros?.[0]?.count ?? 0,
      })))
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const openEdit = (g: Grupo) => {
    setEditing(g)
    setEditForm({ nome: g.nome, descricao: g.descricao ?? '', tipo: g.tipo })
  }

  const saveEdit = async () => {
    if (!editing) return
    setSaving(true)
    await (supabase as any).from('grupos').update({
      nome: editForm.nome.trim(),
      descricao: editForm.descricao.trim() || null,
      tipo: editForm.tipo,
    }).eq('id', editing.id)
    setEditing(null)
    setSaving(false)
    load()
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    await (supabase as any).from('grupos').insert({
      nome: createForm.nome.trim(),
      descricao: createForm.descricao.trim() || null,
      tipo: createForm.tipo,
    })
    setShowCreate(false)
    setCreateForm({ nome: '', descricao: '', tipo: 'publico' })
    setCreating(false)
    load()
  }

  const handleDelete = async (g: Grupo) => {
    if (!confirm(`Excluir o grupo "${g.nome}"? Os membros serão removidos também.`)) return
    await (supabase as any).from('grupo_membros').delete().eq('grupo_id', g.id)
    await (supabase as any).from('grupos').delete().eq('id', g.id)
    load()
  }

  if (loading) return <div className="text-center py-16 text-zinc-500 text-sm">Carregando...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded-lg bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors">
          + Criar grupo
        </button>
      </div>

      {grupos.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
          <p className="text-zinc-400 font-medium">Nenhum grupo criado</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-900/50 border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 hidden md:table-cell">Descrição</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 hidden lg:table-cell">Membros</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 hidden lg:table-cell">Criado em</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {grupos.map(g => (
                <tr key={g.id} className="hover:bg-zinc-900/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-white font-medium text-sm">{g.nome}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-zinc-500 text-xs line-clamp-1">{g.descricao ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${g.tipo === 'publico' ? 'bg-green-500/10 text-green-400 border-green-500/20' : g.tipo === 'privado' ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                      {g.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs hidden lg:table-cell">{g._membros}</td>
                  <td className="px-4 py-3 text-zinc-600 text-xs hidden lg:table-cell">{new Date(g.created_at).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => openEdit(g)} className="text-xs text-zinc-400 hover:text-white transition-colors">Editar</button>
                      <button onClick={() => handleDelete(g)} className="text-xs text-red-400/70 hover:text-red-400 transition-colors">Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal editar grupo */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-xl border border-zinc-700 w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h3 className="text-white font-semibold">Editar grupo</h3>
              <button onClick={() => setEditing(null)} className="text-zinc-500 hover:text-white text-xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Nome</label>
                <input value={editForm.nome} onChange={e => setEditForm({ ...editForm, nome: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Descrição</label>
                <textarea rows={3} value={editForm.descricao} onChange={e => setEditForm({ ...editForm, descricao: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none resize-none" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Visibilidade</label>
                <select value={editForm.tipo} onChange={e => setEditForm({ ...editForm, tipo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm focus:outline-none">
                  <option value="publico">Público</option>
                  <option value="privado">Privado</option>
                  <option value="fechado">Fechado</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-zinc-800 flex gap-3 justify-end">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Cancelar</button>
              <button onClick={saveEdit} disabled={saving}
                className="px-4 py-2 rounded-lg bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors disabled:opacity-50">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal criar grupo */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-xl border border-zinc-700 w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h3 className="text-white font-semibold">Criar grupo</h3>
              <button onClick={() => setShowCreate(false)} className="text-zinc-500 hover:text-white text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Nome</label>
                <input required value={createForm.nome} onChange={e => setCreateForm({ ...createForm, nome: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none"
                  placeholder="Nome do grupo" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Descrição</label>
                <textarea rows={3} value={createForm.descricao} onChange={e => setCreateForm({ ...createForm, descricao: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none resize-none"
                  placeholder="Descrição do grupo (opcional)" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Visibilidade</label>
                <select value={createForm.tipo} onChange={e => setCreateForm({ ...createForm, tipo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm focus:outline-none">
                  <option value="publico">Público</option>
                  <option value="privado">Privado</option>
                  <option value="fechado">Fechado</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Cancelar</button>
                <button type="submit" disabled={creating}
                  className="px-4 py-2 rounded-lg bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors disabled:opacity-50">
                  {creating ? 'Criando...' : 'Criar grupo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Academy Admin ─────────────────────────────────────────────────────────────

const ACADEMY_TIPOS = ['curso', 'artigo', 'video', 'texto'] as const
const ACADEMY_NIVEIS = ['Iniciante', 'Intermediário', 'Avançado'] as const

const emptyForm = () => ({
  tipo: 'texto',
  titulo: '',
  descricao: '',
  conteudo: '',
  url_video: '',
  url_externo: '',
  nivel: '',
  categoria: '',
  duracao: '',
  ordem: 0,
  publicado: false,
})

function AcademyAdminTab() {
  const supabase = createClient()
  const [conteudos, setConteudos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState<ReturnType<typeof emptyForm>>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await (supabase as any)
      .from('academy_conteudos')
      .select('*')
      .order('ordem', { ascending: true })
      .order('created_at', { ascending: false })
    setConteudos(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
  }

  const openEdit = (c: any) => {
    setEditing(c)
    setForm({
      tipo: c.tipo,
      titulo: c.titulo,
      descricao: c.descricao ?? '',
      conteudo: c.conteudo ?? '',
      url_video: c.url_video ?? '',
      url_externo: c.url_externo ?? '',
      nivel: c.nivel ?? '',
      categoria: c.categoria ?? '',
      duracao: c.duracao ?? '',
      ordem: c.ordem ?? 0,
      publicado: c.publicado ?? false,
    })
  }

  const handleSave = async () => {
    if (!form.titulo.trim()) return
    setSaving(true)
    const payload = {
      tipo: form.tipo,
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim() || null,
      conteudo: form.conteudo.trim() || null,
      url_video: form.url_video.trim() || null,
      url_externo: form.url_externo.trim() || null,
      nivel: form.nivel || null,
      categoria: form.categoria.trim() || null,
      duracao: form.duracao.trim() || null,
      ordem: Number(form.ordem) || 0,
      publicado: form.publicado,
      updated_at: new Date().toISOString(),
    }
    if (editing) {
      await (supabase as any).from('academy_conteudos').update(payload).eq('id', editing.id)
    } else {
      await (supabase as any).from('academy_conteudos').insert(payload)
    }
    setSaving(false)
    setEditing(undefined)
    setForm(emptyForm())
    load()
  }

  const handleDelete = async (c: any) => {
    if (!confirm(`Excluir "${c.titulo}"?`)) return
    await (supabase as any).from('academy_conteudos').delete().eq('id', c.id)
    load()
  }

  const togglePublicado = async (c: any) => {
    await (supabase as any).from('academy_conteudos').update({ publicado: !c.publicado }).eq('id', c.id)
    load()
  }

  const showForm = editing !== undefined

  const tipoLabel: Record<string, string> = { curso: 'Curso', artigo: 'Artigo', video: 'Vídeo', texto: 'Texto' }
  const nivelColor: Record<string, string> = {
    Iniciante: 'bg-green-500/10 text-green-400 border-green-500/20',
    Intermediário: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Avançado: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  }

  const filtrados = filtroTipo ? conteudos.filter(c => c.tipo === filtroTipo) : conteudos

  if (loading) return <div className="text-center py-16 text-zinc-500 text-sm">Carregando...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg w-fit">
          <button onClick={() => setFiltroTipo('')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${!filtroTipo ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'}`}>
            Todos ({conteudos.length})
          </button>
          {ACADEMY_TIPOS.map(t => (
            <button key={t} onClick={() => setFiltroTipo(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${filtroTipo === t ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'}`}>
              {t} ({conteudos.filter(c => c.tipo === t).length})
            </button>
          ))}
        </div>
        <button onClick={openCreate}
          className="px-4 py-2 rounded-lg bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors">
          + Novo conteúdo
        </button>
      </div>

      {filtrados.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
          <p className="text-zinc-400 font-medium">Nenhum conteúdo ainda</p>
          <p className="text-zinc-600 text-sm mt-1">Clique em &quot;+ Novo conteúdo&quot; para começar.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-900/50 border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 w-8">Ord.</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Título</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 hidden md:table-cell">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 hidden lg:table-cell">Nível</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 hidden lg:table-cell">Categoria</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filtrados.map(c => (
                <tr key={c.id} className="hover:bg-zinc-900/30 transition-colors">
                  <td className="px-4 py-3 text-zinc-600 text-xs">{c.ordem}</td>
                  <td className="px-4 py-3">
                    <p className="text-white font-medium text-sm line-clamp-1">{c.titulo}</p>
                    {c.descricao && <p className="text-zinc-600 text-xs mt-0.5 line-clamp-1">{c.descricao}</p>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-zinc-400">{tipoLabel[c.tipo]}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {c.nivel ? (
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${nivelColor[c.nivel]}`}>{c.nivel}</span>
                    ) : <span className="text-zinc-700 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-zinc-500 text-xs">{c.categoria ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => togglePublicado(c)}
                      className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${c.publicado ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-500'}`}>
                      {c.publicado ? 'Publicado' : 'Rascunho'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <a href={`/academy/${c.id}`} target="_blank" className="text-xs text-zinc-600 hover:text-white transition-colors">Ver</a>
                      <button onClick={() => openEdit(c)} className="text-xs text-zinc-400 hover:text-white transition-colors">Editar</button>
                      <button onClick={() => handleDelete(c)} className="text-xs text-red-400/70 hover:text-red-400 transition-colors">Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal criar/editar */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 rounded-xl border border-zinc-700 w-full max-w-2xl my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h3 className="text-white font-semibold">{editing ? 'Editar conteúdo' : 'Novo conteúdo'}</h3>
              <button onClick={() => { setEditing(undefined); setForm(emptyForm()) }} className="text-zinc-500 hover:text-white text-2xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Tipo + Publicado */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Tipo</label>
                  <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm focus:outline-none">
                    {ACADEMY_TIPOS.map(t => <option key={t} value={t} className="capitalize">{tipoLabel[t]}</option>)}
                  </select>
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <button type="button" onClick={() => setForm({ ...form, publicado: !form.publicado })}
                      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${form.publicado ? 'bg-green-500' : 'bg-zinc-700'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${form.publicado ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                    <span className="text-sm text-zinc-300">{form.publicado ? 'Publicado' : 'Rascunho'}</span>
                  </label>
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Título <span className="text-red-400">*</span></label>
                <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500"
                  placeholder="Título do conteúdo" />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Descrição curta</label>
                <input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500"
                  placeholder="Breve descrição exibida nos cards" />
              </div>

              {/* Categoria + Nível + Duração + Ordem */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Categoria</label>
                  <input value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none"
                    placeholder="Ex: Fundamentos, Prática..." />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Nível</label>
                  <select value={form.nivel} onChange={e => setForm({ ...form, nivel: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm focus:outline-none">
                    <option value="">— Sem nível —</option>
                    {ACADEMY_NIVEIS.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Duração</label>
                  <input value={form.duracao} onChange={e => setForm({ ...form, duracao: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none"
                    placeholder="Ex: 1h 30min" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Ordem</label>
                  <input type="number" value={form.ordem} onChange={e => setForm({ ...form, ordem: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none" />
                </div>
              </div>

              {/* URL Vídeo (só para tipo video) */}
              {form.tipo === 'video' && (
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">URL do vídeo (YouTube embed ou direto)</label>
                  <input value={form.url_video} onChange={e => setForm({ ...form, url_video: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none font-mono"
                    placeholder="https://www.youtube.com/watch?v=..." />
                </div>
              )}

              {/* URL Externo */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Link externo {form.tipo === 'curso' ? '(plataforma do curso)' : '(opcional)'}</label>
                <input value={form.url_externo} onChange={e => setForm({ ...form, url_externo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none font-mono"
                  placeholder="https://..." />
              </div>

              {/* Conteúdo completo */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Conteúdo completo</label>
                <textarea rows={10} value={form.conteudo} onChange={e => setForm({ ...form, conteudo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none resize-none font-mono leading-relaxed"
                  placeholder="Texto completo do conteúdo. Use quebras de linha normalmente." />
                <p className="text-xs text-zinc-600 mt-1">Suporta quebras de linha. Para artigos e textos longos.</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-zinc-800 flex gap-3 justify-end">
              <button onClick={() => { setEditing(undefined); setForm(emptyForm()) }}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={saving || !form.titulo.trim()}
                className="px-4 py-2 rounded-lg bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors disabled:opacity-50">
                {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar conteúdo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    aprovado: 'bg-green-500/10 text-green-400 border-green-500/20',
    ativo: 'bg-green-500/10 text-green-400 border-green-500/20',
    pendente: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    inativo: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs border ${map[status] ?? map.inativo}`}>{status}</span>
}
