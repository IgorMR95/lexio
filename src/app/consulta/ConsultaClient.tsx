'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { CategoriaPrincipal, Subcategoria, Subnivel, AreaDireito } from '@/lib/supabase/types'

const PAGE_SIZE = 15

interface Props {
  categorias: CategoriaPrincipal[]
  subcategorias: Subcategoria[]
  subniveis: Subnivel[]
  areas: AreaDireito[]
  isAdmin: boolean
  isLoggedIn: boolean
}

export function ConsultaClient({ categorias, subcategorias, subniveis, areas, isAdmin, isLoggedIn }: Props) {
  const supabase = createClient()
  const [prompts, setPrompts] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [filterCategoria, setFilterCategoria] = useState('')
  const [filterSubcategoria, setFilterSubcategoria] = useState('')
  const [filterSubnivel, setFilterSubnivel] = useState('')
  const [filterArea, setFilterArea] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent')

  const filteredSubcategorias = filterCategoria ? subcategorias.filter(s => s.categoria_id === filterCategoria) : subcategorias
  const filteredSubniveis = filterSubcategoria ? subniveis.filter(s => s.subcategoria_id === filterSubcategoria) : subniveis

  const loadData = useCallback(async (p = 0) => {
    setLoading(true)
    let query = supabase
      .from('prompts')
      .select(`*, categorias_principais(nome), subcategorias(nome), areas_direito(nome), profiles(full_name)`, { count: 'exact' })
      .order('created_at', { ascending: sortOrder === 'oldest' })
      .range(p * PAGE_SIZE, p * PAGE_SIZE + PAGE_SIZE - 1)

    if (!isAdmin) query = query.in('status', ['ativo', 'aprovado'])
    else if (filterStatus) query = query.eq('status', filterStatus)

    if (search) query = query.or(`titulo.ilike.%${search}%,texto_completo.ilike.%${search}%`)
    if (filterCategoria) query = query.eq('categoria_id', filterCategoria)
    if (filterSubcategoria) query = query.eq('subcategoria_id', filterSubcategoria)
    if (filterSubnivel) query = query.eq('subnivel_id', filterSubnivel)
    if (filterArea) query = query.eq('area_direito_id', filterArea)

    const { data, count } = await query
    setPrompts(data ?? [])
    setTotal(count ?? 0)
    setLoading(false)
  }, [search, filterCategoria, filterSubcategoria, filterSubnivel, filterArea, filterStatus, sortOrder, isAdmin])

  useEffect(() => { setPage(0); loadData(0) }, [search, filterCategoria, filterSubcategoria, filterSubnivel, filterArea, filterStatus, sortOrder])
  useEffect(() => { loadData(page) }, [page])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar este prompt?')) return
    await supabase.from('prompts').delete().eq('id', id)
    loadData(page)
  }

  const exportCSV = async () => {
    let query = supabase.from('prompts').select(`*, areas_direito(nome), categorias_principais(nome)`)
    if (!isAdmin) query = query.in('status', ['ativo', 'aprovado'])
    const { data } = await query
    if (!data) return
    const rows = data.map(p => ({
      titulo: p.titulo,
      descricao: p.descricao_curta ?? '',
      area: (p as any).areas_direito?.nome ?? '',
      categoria: (p as any).categorias_principais?.nome ?? '',
      status: p.status,
      tags: p.tags.join(', '),
      data: new Date(p.created_at).toLocaleDateString('pt-BR'),
    }))
    const header = Object.keys(rows[0]).join(',')
    const csv = [header, ...rows.map(r => Object.values(r).map(v => `"${v}"`).join(','))].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'lexio-prompts.csv'; a.click()
  }

  const exportExcel = async () => {
    const XLSX = await import('xlsx')
    let query = supabase.from('prompts').select(`*, areas_direito(nome), categorias_principais(nome), subcategorias(nome)`)
    if (!isAdmin) query = query.in('status', ['ativo', 'aprovado'])
    const { data } = await query
    if (!data) return
    const rows = data.map(p => ({
      Título: p.titulo,
      Descrição: p.descricao_curta ?? '',
      'Prompt Completo': p.texto_completo,
      Categoria: (p as any).categorias_principais?.nome ?? '',
      Subcategoria: (p as any).subcategorias?.nome ?? '',
      Área: (p as any).areas_direito?.nome ?? '',
      Tags: p.tags.join(', '),
      Status: p.status,
      'Data Criação': new Date(p.created_at).toLocaleDateString('pt-BR'),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Prompts')
    XLSX.writeFile(wb, 'lexio-prompts.xlsx')
  }

  const clearFilters = () => {
    setSearch(''); setFilterCategoria(''); setFilterSubcategoria('')
    setFilterSubnivel(''); setFilterArea(''); setFilterStatus('')
  }

  const hasFilters = search || filterCategoria || filterSubcategoria || filterSubnivel || filterArea || filterStatus

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Consulta da Base</h1>
          <p className="text-zinc-500 text-sm mt-1">{total} prompt{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-xs hover:text-white hover:border-zinc-500 transition-colors">
            CSV
          </button>
          <button onClick={exportExcel} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-xs hover:text-white hover:border-zinc-500 transition-colors">
            Excel
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <div className="lg:col-span-2 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Buscar por título ou conteúdo..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 text-sm" />
          </div>
          <select value={filterCategoria} onChange={e => { setFilterCategoria(e.target.value); setFilterSubcategoria(''); setFilterSubnivel('') }}
            className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm focus:outline-none">
            <option value="">Categoria</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <select value={filterSubcategoria} onChange={e => { setFilterSubcategoria(e.target.value); setFilterSubnivel('') }}
            disabled={!filterCategoria}
            className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm focus:outline-none disabled:opacity-40">
            <option value="">Subcategoria</option>
            {filteredSubcategorias.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
          <select value={filterSubnivel} onChange={e => setFilterSubnivel(e.target.value)}
            disabled={!filterSubcategoria}
            className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm focus:outline-none disabled:opacity-40">
            <option value="">Subnível</option>
            {filteredSubniveis.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
          <select value={filterArea} onChange={e => setFilterArea(e.target.value)}
            className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm focus:outline-none">
            <option value="">Área do Direito</option>
            {areas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select>
          {isAdmin && (
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm focus:outline-none">
              <option value="">Todos os status</option>
              <option value="aprovado">Aprovado</option>
              <option value="ativo">Ativo</option>
              <option value="pendente">Pendente</option>
              <option value="inativo">Inativo</option>
            </select>
          )}
          <select value={sortOrder} onChange={e => setSortOrder(e.target.value as any)}
            className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm focus:outline-none">
            <option value="recent">Mais recentes</option>
            <option value="oldest">Mais antigos</option>
          </select>
        </div>
        {hasFilters && (
          <button onClick={clearFilters} className="text-xs text-zinc-500 hover:text-white transition-colors">
            Limpar filtros
          </button>
        )}
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900/50 border-b border-zinc-800">
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Título</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 hidden md:table-cell">Área</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 hidden lg:table-cell">Categoria</th>
              {isAdmin && <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Status</th>}
              <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-zinc-500 text-sm">Carregando...</td></tr>
            ) : prompts.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-zinc-500 text-sm">Nenhum prompt encontrado</td></tr>
            ) : prompts.map(p => (
              <tr key={p.id} className="hover:bg-zinc-900/30 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-white text-sm font-medium line-clamp-1">{p.titulo}</p>
                  <p className="text-zinc-600 text-xs mt-0.5">{new Date(p.created_at).toLocaleDateString('pt-BR')}</p>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs text-zinc-400">{(p as any).areas_direito?.nome ?? '—'}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-xs text-zinc-400">{(p as any).categorias_principais?.nome ?? '—'}</span>
                </td>
                {isAdmin && (
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                )}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/prompts/${p.id}`} className="text-xs text-zinc-400 hover:text-white transition-colors">Ver</Link>
                    {isAdmin && (
                      <>
                        <Link href={`/admin/prompts/${p.id}/edit`} className="text-xs text-zinc-400 hover:text-white transition-colors">Editar</Link>
                        <button onClick={() => handleDelete(p.id)} className="text-xs text-red-400/70 hover:text-red-400 transition-colors">Deletar</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}
          </p>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-400 text-xs hover:text-white hover:border-zinc-600 disabled:opacity-30 transition-colors">
              ← Anterior
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = Math.max(0, Math.min(page - 2, totalPages - 5)) + i
              return (
                <button key={pg} onClick={() => setPage(pg)}
                  className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${pg === page ? 'border-white text-white' : 'border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'}`}>
                  {pg + 1}
                </button>
              )
            })}
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-400 text-xs hover:text-white hover:border-zinc-600 disabled:opacity-30 transition-colors">
              Próximo →
            </button>
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
