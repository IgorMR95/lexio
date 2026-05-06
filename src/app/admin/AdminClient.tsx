'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

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
  { id: 'usuarios', label: 'Usuários' },
  { id: 'auditoria', label: 'Auditoria' },
  { id: 'estrutura', label: 'Categorias / Estrutura' },
  { id: 'areas', label: 'Áreas do Direito' },
]

export function AdminClient({ currentUserId, profiles: initialProfiles, auditLogs, categorias: initialCategorias, subcategorias: initialSubcategorias, subniveis: initialSubniveis, areas: initialAreas, stats }: Props) {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState('usuarios')
  const [profiles, setProfiles] = useState(initialProfiles)
  const [categorias, setCategorias] = useState(initialCategorias)
  const [subcategorias, setSubcategorias] = useState(initialSubcategorias)
  const [subniveis, setSubniveis] = useState(initialSubniveis)
  const [areas, setAreas] = useState(initialAreas)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs border border-amber-500/20">Admin</span>
            <h1 className="text-2xl font-bold text-white">Administração</h1>
          </div>
          <p className="text-zinc-500 text-sm">Gerenciamento do sistema Lexio</p>
        </div>
        <Link href="/admin/dados" className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:text-white hover:border-zinc-500 transition-colors">
          Gestão de Dados →
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <p className="text-xs text-zinc-500 mb-1">Total de prompts</p>
          <p className="text-2xl font-bold text-white">{stats.totalPrompts}</p>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <p className="text-xs text-zinc-500 mb-1">Pendentes</p>
          <p className="text-2xl font-bold text-amber-400">{stats.pendentes}</p>
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
          </button>
        ))}
      </div>

      {activeTab === 'usuarios' && (
        <UsuariosTab profiles={profiles} currentUserId={currentUserId} onReload={async () => {
          const { data } = await supabase.from('profiles').select('id, full_name, email, role, created_at').order('created_at', { ascending: false })
          setProfiles(data ?? [])
        }} />
      )}
      {activeTab === 'auditoria' && <AuditoriaTab logs={auditLogs} />}
      {activeTab === 'estrutura' && (
        <EstruturaTab
          categorias={categorias} subcategorias={subcategorias} subniveis={subniveis}
          onReload={async () => {
            const [c, s, n] = await Promise.all([
              supabase.from('categorias_principais').select('*').order('ordem'),
              supabase.from('subcategorias').select('*').order('ordem'),
              supabase.from('subniveis').select('*').order('ordem'),
            ])
            setCategorias(c.data ?? [])
            setSubcategorias(s.data ?? [])
            setSubniveis(n.data ?? [])
          }}
        />
      )}
      {activeTab === 'areas' && (
        <AreasTab areas={areas} onReload={async () => {
          const { data } = await supabase.from('areas_direito').select('*').order('ordem')
          setAreas(data ?? [])
        }} />
      )}
    </div>
  )
}

// ── Usuários ──────────────────────────────────────────────────────────────────

function UsuariosTab({ profiles, currentUserId, onReload }: { profiles: Profile[]; currentUserId: string; onReload: () => void }) {
  const supabase = createClient()
  const [editing, setEditing] = useState<Profile | null>(null)
  const [editRole, setEditRole] = useState('')

  const handleRoleChange = async () => {
    if (!editing) return
    await (supabase as any).from('profiles').update({ role: editRole }).eq('id', editing.id)
    setEditing(null)
    onReload()
  }

  return (
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
            <tr key={p.id} className="hover:bg-zinc-900/30 transition-colors">
              <td className="px-4 py-3 text-white text-sm font-medium">{p.full_name || '—'}</td>
              <td className="px-4 py-3 text-zinc-400 text-xs">{p.email}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs border ${p.role === 'admin' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                  {p.role}
                </span>
              </td>
              <td className="px-4 py-3 text-zinc-500 text-xs hidden md:table-cell">{new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
              <td className="px-4 py-3 text-right">
                {p.id !== currentUserId && (
                  <button onClick={() => { setEditing(p); setEditRole(p.role) }}
                    className="text-xs text-zinc-400 hover:text-white transition-colors">
                    Editar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-xl border border-zinc-700 w-full max-w-sm p-6 space-y-4">
            <h3 className="text-white font-semibold">Editar perfil: {editing.full_name}</h3>
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
    </div>
  )
}

// ── Auditoria ──────────────────────────────────────────────────────────────────

function AuditoriaTab({ logs }: { logs: AuditLog[] }) {
  if (logs.length === 0) {
    return <div className="text-center py-16 text-zinc-500 text-sm">Nenhum log de auditoria encontrado.</div>
  }
  return (
    <div className="space-y-3">
      {logs.map(log => (
        <div key={log.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white">
              <span className="font-medium">{log.profiles?.full_name ?? 'Sistema'}</span>
              <span className="text-zinc-400"> realizou ação de </span>
              <span className="uppercase text-xs font-bold text-amber-400">{log.acao}</span>
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Entidade: {log.entidade} {log.entidade_id ? `(ID: ${log.entidade_id})` : ''}
            </p>
            {log.detalhes && (
              <pre className="mt-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 overflow-auto max-h-24">
                {JSON.stringify(log.detalhes, null, 2)}
              </pre>
            )}
          </div>
          <span className="text-xs text-zinc-600 whitespace-nowrap flex-shrink-0">
            {new Date(log.criado_em).toLocaleString('pt-BR')}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Estrutura ──────────────────────────────────────────────────────────────────

function EstruturaTab({ categorias, subcategorias, subniveis, onReload }: {
  categorias: Categoria[]
  subcategorias: Subcategoria[]
  subniveis: Subnivel[]
  onReload: () => void
}) {
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
    setNewCatName('')
    onReload()
  }

  const addSubcategoria = async (catId: string) => {
    if (!newSubName.trim() || newSubForCat !== catId) return
    const subs = subcategorias.filter(s => s.categoria_id === catId)
    const maxOrdem = subs.length ? Math.max(...subs.map(s => s.ordem)) + 1 : 1
    await (supabase as any).from('subcategorias').insert({ nome: newSubName.trim(), categoria_id: catId, ordem: maxOrdem, ativo: true })
    setNewSubName('')
    setNewSubForCat('')
    onReload()
  }

  const addSubnivel = async (subId: string) => {
    if (!newNivelName.trim() || newNivelForSub !== subId) return
    const niveis = subniveis.filter(s => s.subcategoria_id === subId)
    const maxOrdem = niveis.length ? Math.max(...niveis.map(s => s.ordem)) + 1 : 1
    await (supabase as any).from('subniveis').insert({ nome: newNivelName.trim(), subcategoria_id: subId, ordem: maxOrdem, ativo: true })
    setNewNivelName('')
    setNewNivelForSub('')
    onReload()
  }

  const toggleAtivo = async (table: string, id: string, current: boolean) => {
    await (supabase as any).from(table).update({ ativo: !current }).eq('id', id)
    onReload()
  }

  const deleteItem = async (table: string, id: string, label: string) => {
    if (!confirm(`Remover "${label}"? Isso pode afetar prompts vinculados.`)) return
    await (supabase as any).from(table).delete().eq('id', id)
    onReload()
  }

  return (
    <div className="space-y-4">
      {/* Add categoria */}
      <div className="flex gap-2">
        <input value={newCatName} onChange={e => setNewCatName(e.target.value)}
          placeholder="Nova categoria principal..."
          className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-zinc-600"
          onKeyDown={e => e.key === 'Enter' && addCategoria()} />
        <button onClick={addCategoria} className="px-4 py-2 rounded-lg bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors">
          + Categoria
        </button>
      </div>

      {categorias.map(cat => {
        const catSubs = subcategorias.filter(s => s.categoria_id === cat.id)
        return (
          <div key={cat.id} className="rounded-xl border border-zinc-800 overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-3 bg-zinc-900/50 cursor-pointer hover:bg-zinc-900"
              onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
            >
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
                <button onClick={() => deleteItem('categorias_principais', cat.id, cat.nome)}
                  className="text-xs text-red-400/60 hover:text-red-400 transition-colors">
                  Remover
                </button>
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
                          <button onClick={() => deleteItem('subcategorias', sub.id, sub.nome)}
                            className="text-xs text-red-400/60 hover:text-red-400 transition-colors">
                            Remover
                          </button>
                          <span className="text-zinc-600 text-xs">{expandedSub === sub.id ? '▲' : '▼'}</span>
                        </div>
                      </div>

                      {expandedSub === sub.id && (
                        <div className="px-10 py-2 bg-zinc-950/30 space-y-1">
                          {subNiveis.map(n => (
                            <div key={n.id} className="flex items-center justify-between py-1">
                              <span className="text-zinc-400 text-xs">↳ {n.nome}</span>
                              <button onClick={() => deleteItem('subniveis', n.id, n.nome)}
                                className="text-xs text-red-400/60 hover:text-red-400 transition-colors">
                                Remover
                              </button>
                            </div>
                          ))}
                          <div className="flex gap-2 pt-2">
                            <input
                              value={newNivelForSub === sub.id ? newNivelName : ''}
                              onChange={e => { setNewNivelForSub(sub.id); setNewNivelName(e.target.value) }}
                              placeholder="Novo subnível..."
                              className="flex-1 px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 text-xs focus:outline-none"
                              onKeyDown={e => e.key === 'Enter' && addSubnivel(sub.id)}
                            />
                            <button onClick={() => addSubnivel(sub.id)} className="px-3 py-1 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition-colors">
                              + Subnível
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Add subcategoria */}
                <div className="px-6 py-3 flex gap-2">
                  <input
                    value={newSubForCat === cat.id ? newSubName : ''}
                    onChange={e => { setNewSubForCat(cat.id); setNewSubName(e.target.value) }}
                    placeholder="Nova subcategoria..."
                    className="flex-1 px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 text-xs focus:outline-none"
                    onKeyDown={e => e.key === 'Enter' && addSubcategoria(cat.id)}
                  />
                  <button onClick={() => addSubcategoria(cat.id)} className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition-colors">
                    + Sub
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Áreas do Direito ──────────────────────────────────────────────────────────

function AreasTab({ areas, onReload }: { areas: Area[]; onReload: () => void }) {
  const supabase = createClient()
  const [newName, setNewName] = useState('')

  const addArea = async () => {
    if (!newName.trim()) return
    const maxOrdem = areas.length ? Math.max(...areas.map(a => a.ordem)) + 1 : 1
    await (supabase as any).from('areas_direito').insert({ nome: newName.trim(), ordem: maxOrdem, ativo: true })
    setNewName('')
    onReload()
  }

  const toggleAtivo = async (id: string, current: boolean) => {
    await (supabase as any).from('areas_direito').update({ ativo: !current }).eq('id', id)
    onReload()
  }

  const deleteArea = async (id: string, nome: string) => {
    if (!confirm(`Remover a área "${nome}"? Isso pode afetar prompts vinculados.`)) return
    await (supabase as any).from('areas_direito').delete().eq('id', id)
    onReload()
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={newName} onChange={e => setNewName(e.target.value)}
          placeholder="Nova área do direito..."
          className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-zinc-600"
          onKeyDown={e => e.key === 'Enter' && addArea()} />
        <button onClick={addArea} className="px-4 py-2 rounded-lg bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors">
          + Área
        </button>
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
                    <button onClick={() => deleteArea(a.id, a.nome)}
                      className="text-xs text-red-400/60 hover:text-red-400 transition-colors">
                      Remover
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {areas.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-10 text-center text-zinc-500 text-sm">Nenhuma área cadastrada</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
