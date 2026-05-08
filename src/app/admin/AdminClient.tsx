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
              <button onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                className="text-xs text-zinc-500 hover:text-white transition-colors px-2 py-1 rounded border border-zinc-800 hover:border-zinc-600">
                {expanded === p.id ? 'Fechar' : 'Ver texto'}
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
          {expanded === p.id && (
            <div className="px-4 pb-4">
              <pre className="whitespace-pre-wrap text-xs text-zinc-300 bg-zinc-950 rounded-lg p-4 border border-zinc-800 font-mono leading-relaxed max-h-60 overflow-y-auto">
                {p.texto_completo}
              </pre>
              {p.observacoes && (
                <p className="text-xs text-amber-400 mt-2 bg-amber-500/5 border border-amber-500/10 rounded px-3 py-2">
                  Obs. do autor: {p.observacoes}
                </p>
              )}
            </div>
          )}
        </div>
      ))}
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
                    className={`relative w-11 h-6 rounded-full transition-colors ${editForm.internacional ? 'bg-indigo-500' : 'bg-zinc-700'}`}>
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
              onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}>
              <div className="flex items-center gap-3">
                <span className="text-white font-medium text-sm">{cat.nome}</span>
                <span className="text-xs text-zinc-600">{catSubs.length} subcategorias</span>
                {!cat.ativo && <span className="text-xs text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">inativo</span>}
              </div>
              <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                <button onClick={() => toggleAtivo('categorias_principais', cat.id, cat.ativo)}
                  className={`text-xs transition-colors ${cat.ativo ? 'text-zinc-500 hover:text-amber-400' : 'text-zinc-600 hover:text-green-400'}`}>
                  {cat.ativo ? 'Desativar' : 'Ativar'}
                </button>
                <button onClick={() => deleteItem('categorias_principais', cat.id, cat.nome)} className="text-xs text-red-400/60 hover:text-red-400 transition-colors">Remover</button>
                <span className="text-zinc-600">{expandedCat === cat.id ? '▲' : '▼'}</span>
              </div>
            </div>
            {expandedCat === cat.id && (
              <div className="border-t border-zinc-800 divide-y divide-zinc-800/50">
                {catSubs.map(sub => {
                  const subNiveis = subniveis.filter(n => n.subcategoria_id === sub.id)
                  return (
                    <div key={sub.id}>
                      <div className="flex items-center justify-between px-6 py-2.5 hover:bg-zinc-900/20 cursor-pointer"
                        onClick={() => setExpandedSub(expandedSub === sub.id ? null : sub.id)}>
                        <div className="flex items-center gap-3">
                          <span className="text-zinc-300 text-sm">↳ {sub.nome}</span>
                          <span className="text-xs text-zinc-600">{subNiveis.length} subníveis</span>
                        </div>
                        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                          <button onClick={() => deleteItem('subcategorias', sub.id, sub.nome)} className="text-xs text-red-400/60 hover:text-red-400 transition-colors">Remover</button>
                          <span className="text-zinc-600 text-xs">{expandedSub === sub.id ? '▲' : '▼'}</span>
                        </div>
                      </div>
                      {expandedSub === sub.id && (
                        <div className="px-10 py-2 bg-zinc-950/30 space-y-1">
                          {subNiveis.map(n => (
                            <div key={n.id} className="flex items-center justify-between py-1">
                              <span className="text-zinc-400 text-xs">↳ {n.nome}</span>
                              <button onClick={() => deleteItem('subniveis', n.id, n.nome)} className="text-xs text-red-400/60 hover:text-red-400 transition-colors">Remover</button>
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
                <td className="px-4 py-3 text-white text-sm">{a.nome}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${a.ativo ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                    {a.ativo ? 'ativa' : 'inativa'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => toggleAtivo(a.id, a.ativo)}
                      className={`text-xs transition-colors ${a.ativo ? 'text-zinc-500 hover:text-amber-400' : 'text-zinc-600 hover:text-green-400'}`}>
                      {a.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <button onClick={() => deleteArea(a.id, a.nome)} className="text-xs text-red-400/60 hover:text-red-400 transition-colors">Remover</button>
                  </div>
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    aprovado: 'bg-green-500/10 text-green-400 border-green-500/20',
    ativo: 'bg-green-500/10 text-green-400 border-green-500/20',
    pendente: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    inativo: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs border ${map[status] ?? map.inativo}`}>{status}</span>
}
