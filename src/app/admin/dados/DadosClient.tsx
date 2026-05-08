'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const PAGE_SIZE = 20

interface Area { id: string; nome: string }
interface Categoria { id: string; nome: string }
interface Subcategoria { id: string; nome: string; categoria_id: string }

interface Props {
  areas: Area[]
  categorias: Categoria[]
  subcategorias: Subcategoria[]
}

const TABS = [
  { id: 'prompts', label: 'Prompts' },
  { id: 'notas', label: 'Notas' },
]

export function DadosClient({ areas, categorias, subcategorias }: Props) {
  const [activeTab, setActiveTab] = useState('prompts')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin" className="text-zinc-500 hover:text-white text-sm transition-colors">← Admin</Link>
          </div>
          <h1 className="text-2xl font-bold text-white">Gestão de Dados</h1>
          <p className="text-zinc-500 text-sm mt-1">CRUD completo nas tabelas do sistema</p>
        </div>
      </div>

      <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg mb-8 w-fit">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'prompts' && <PromptsTab areas={areas} categorias={categorias} subcategorias={subcategorias} />}
      {activeTab === 'notas' && <NotasTab />}
    </div>
  )
}

// ── Prompts Tab ───────────────────────────────────────────────────────────────

function PromptsTab({ areas, categorias, subcategorias }: Props) {
  const supabase = createClient()
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [editing, setEditing] = useState<any>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async (p = 0) => {
    setLoading(true)
    let q = (supabase as any)
      .from('prompts')
      .select(`*, areas_direito(nome), categorias_principais(nome), subcategorias(nome), profiles(full_name)`, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(p * PAGE_SIZE, p * PAGE_SIZE + PAGE_SIZE - 1)

    if (search) q = q.or(`titulo.ilike.%${search}%,texto_completo.ilike.%${search}%`)
    if (filterStatus) q = q.eq('status', filterStatus)

    const { data: rows, count } = await q
    setData(rows ?? [])
    setTotal(count ?? 0)
    setLoading(false)
  }, [search, filterStatus])

  useEffect(() => { setPage(0); load(0) }, [search, filterStatus])
  useEffect(() => { load(page) }, [page])

  const totalPages = Math.ceil(total / PAGE_SIZE)

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
    })
  }

  const saveEdit = async () => {
    if (!editing) return
    setSaving(true)
    const payload = {
      titulo: editForm.titulo,
      descricao_curta: editForm.descricao_curta || null,
      texto_completo: editForm.texto_completo,
      status: editForm.status,
      area_direito_id: editForm.area_direito_id || null,
      categoria_id: editForm.categoria_id || null,
      subcategoria_id: editForm.subcategoria_id || null,
      tags: editForm.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
    }
    await (supabase as any).from('prompts').update(payload).eq('id', editing.id)
    setEditing(null)
    setSaving(false)
    load(page)
  }

  const handleDelete = async (id: string, titulo: string) => {
    if (!confirm(`Deletar "${titulo}"?`)) return
    await (supabase as any).from('prompts').delete().eq('id', id)
    load(page)
  }

  const filteredSubs = editForm.categoria_id ? subcategorias.filter(s => s.categoria_id === editForm.categoria_id) : subcategorias

  const exportAll = async () => {
    const XLSX = await import('xlsx')
    const q = (supabase as any).from('prompts').select(`*, areas_direito(nome), categorias_principais(nome), subcategorias(nome)`)
    const { data: all } = await q
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
      'Data Criação': new Date(p.created_at).toLocaleDateString('pt-BR'),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Prompts')
    XLSX.writeFile(wb, `midori-base-completa-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar prompts..."
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
        <span className="text-xs text-zinc-500">{total} prompts</span>
        <button onClick={exportAll} className="px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-xs hover:text-white hover:border-zinc-500 transition-colors">
          Exportar tudo
        </button>
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900/50 border-b border-zinc-800">
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Título</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 hidden md:table-cell">Autor</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Status</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-zinc-500 text-sm">Carregando...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-zinc-500 text-sm">Nenhum prompt encontrado</td></tr>
            ) : data.map(row => (
              <tr key={row.id} className="hover:bg-zinc-900/30 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-white text-sm font-medium line-clamp-1">{row.titulo}</p>
                  <p className="text-zinc-600 text-xs mt-0.5">{new Date(row.created_at).toLocaleDateString('pt-BR')}</p>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs text-zinc-400">{row.profiles?.full_name ?? '—'}</span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/prompts/${row.id}`} className="text-xs text-zinc-400 hover:text-white transition-colors">Ver</Link>
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
          <p className="text-xs text-zinc-500">
            Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}
          </p>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-400 text-xs hover:text-white disabled:opacity-30 transition-colors">
              ← Anterior
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-400 text-xs hover:text-white disabled:opacity-30 transition-colors">
              Próximo →
            </button>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 rounded-xl border border-zinc-700 w-full max-w-2xl my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h3 className="text-white font-semibold">Editar prompt</h3>
              <button onClick={() => setEditing(null)} className="text-zinc-500 hover:text-white text-xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
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

// ── Notas Tab ─────────────────────────────────────────────────────────────────

function NotasTab() {
  const supabase = createClient()
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (p = 0) => {
    setLoading(true)
    const { data: rows, count } = await (supabase as any)
      .from('notas')
      .select('id, texto, criado_em, prompt_id, autor_id, prompts(titulo), profiles!autor_id(full_name)', { count: 'exact' })
      .order('criado_em', { ascending: false })
      .range(p * PAGE_SIZE, p * PAGE_SIZE + PAGE_SIZE - 1)
    setData(rows ?? [])
    setTotal(count ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => { load(page) }, [page])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar esta nota?')) return
    await (supabase as any).from('notas').delete().eq('id', id)
    load(page)
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500">{total} notas no total</p>
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <div className="divide-y divide-zinc-800/50">
          {loading ? (
            <div className="px-4 py-10 text-center text-zinc-500 text-sm">Carregando...</div>
          ) : data.length === 0 ? (
            <div className="px-4 py-10 text-center text-zinc-500 text-sm">Nenhuma nota encontrada</div>
          ) : data.map(row => (
            <div key={row.id} className="p-4 flex items-start gap-4 hover:bg-zinc-900/30 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <span className="text-xs font-semibold text-amber-400">{row.prompts?.titulo ?? '—'}</span>
                  <span className="text-xs text-zinc-500">por {row.profiles?.full_name ?? 'Sistema'}</span>
                  <span className="text-xs text-zinc-600">{new Date(row.criado_em).toLocaleString('pt-BR')}</span>
                </div>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap">{row.texto}</p>
              </div>
              <button onClick={() => handleDelete(row.id)} className="text-zinc-600 hover:text-red-400 transition-colors flex-shrink-0 text-lg leading-none">×</button>
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="p-3 border-t border-zinc-800 flex justify-between items-center text-xs text-zinc-500">
            <span>Página {page + 1} de {totalPages}</span>
            <div className="flex gap-1">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border border-zinc-800 rounded disabled:opacity-30 hover:border-zinc-600 transition-colors">Anterior</button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border border-zinc-800 rounded disabled:opacity-30 hover:border-zinc-600 transition-colors">Próximo</button>
            </div>
          </div>
        )}
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
