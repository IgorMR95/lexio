'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Props {
  user: { id: string; email: string }
  profile: any
  meusPrompts: any[]
  meusGrupos: any[]
}

const TABS = [
  { id: 'perfil', label: 'Meu Perfil' },
  { id: 'prompts', label: 'Meus Prompts' },
  { id: 'grupos', label: 'Grupos' },
]

export function PerfilClient({ user, profile, meusPrompts, meusGrupos }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get('tab')
    return TABS.find(t => t.id === tab) ? tab! : 'perfil'
  })

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
          {(profile?.full_name ?? user.email)?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">{profile?.full_name ?? '—'}</h1>
          <p className="text-sm text-zinc-500">{user.email}</p>
          {profile?.instituicao && <p className="text-xs text-zinc-600 mt-0.5">{profile.instituicao}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg mb-8 w-fit">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <DashboardTab prompts={meusPrompts} profile={profile} />
      )}
      {activeTab === 'perfil' && (
        <EditarPerfilTab user={user} profile={profile} />
      )}
      {activeTab === 'prompts' && (
        <MeusPromptsTab prompts={meusPrompts} />
      )}
      {activeTab === 'grupos' && (
        <GruposTab userId={user.id} meusGrupos={meusGrupos} />
      )}
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function DashboardTab({ prompts, profile }: { prompts: any[]; profile: any }) {
  const total = prompts.length
  const aprovados = prompts.filter(p => p.status === 'aprovado' || p.status === 'ativo').length
  const pendentes = prompts.filter(p => p.status === 'pendente').length

  const statusColor: Record<string, string> = {
    aprovado: 'bg-green-500/10 text-green-400 border-green-500/20',
    ativo:    'bg-green-500/10 text-green-400 border-green-500/20',
    pendente: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    inativo:  'bg-zinc-500/10 text-zinc-400 border-zinc-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-zinc-400 text-sm">Olá, <span className="text-white font-medium">{profile?.full_name ?? 'usuário'}</span></p>
        <Link href="/dashboard/novo-prompt" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo prompt
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <p className="text-xs text-zinc-500 mb-1">Enviados</p>
          <p className="text-2xl font-bold text-white">{total}</p>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <p className="text-xs text-zinc-500 mb-1">Publicados</p>
          <p className="text-2xl font-bold text-green-400">{aprovados}</p>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <p className="text-xs text-zinc-500 mb-1">Pendentes</p>
          <p className="text-2xl font-bold text-amber-400">{pendentes}</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Últimos prompts</p>
        {prompts.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-zinc-800 rounded-xl">
            <p className="text-zinc-500 text-sm mb-3">Você ainda não enviou nenhum prompt</p>
            <Link href="/dashboard/novo-prompt" className="text-sm text-white hover:underline">Enviar meu primeiro prompt →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {prompts.slice(0, 5).map(p => (
              <Link key={p.id} href={`/prompts/${p.id}`}
                className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{p.titulo}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    {p.areas_direito?.nome && `${p.areas_direito.nome} · `}
                    {new Date(p.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <span className={`ml-4 px-2 py-0.5 rounded-full text-xs border flex-shrink-0 ${statusColor[p.status] ?? statusColor.inativo}`}>
                  {p.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Editar Perfil ─────────────────────────────────────────────────────────────

function EditarPerfilTab({ user, profile }: { user: { id: string; email: string }; profile: any }) {
  const supabase = createClient()
  const router = useRouter()
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [instituicao, setInstituicao] = useState(profile?.instituicao ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await (supabase as any).from('profiles').update({
      full_name: fullName,
      bio: bio || null,
      instituicao: instituicao || null,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user.email) return
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Nome completo</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:border-zinc-600"
            placeholder="Seu nome" />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Instituição / Escritório</label>
          <input value={instituicao} onChange={e => setInstituicao(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:border-zinc-600"
            placeholder="Ex: USP, Escritório Silva & Associados" />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Bio</label>
          <textarea rows={3} value={bio} onChange={e => setBio(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:border-zinc-600 resize-none"
            placeholder="Uma breve descrição sobre você" />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Email</label>
          <input value={user.email} disabled
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800 text-zinc-500 text-sm cursor-not-allowed" />
          <p className="text-xs text-zinc-600 mt-1">O email não pode ser alterado aqui</p>
        </div>
        <button type="submit" disabled={saving}
          className="px-5 py-2.5 rounded-lg bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors disabled:opacity-50">
          {saving ? 'Salvando...' : saved ? '✓ Salvo' : 'Salvar alterações'}
        </button>
      </form>

      {/* Zona de perigo */}
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
        <h3 className="text-sm font-semibold text-red-400 mb-1">Zona de perigo</h3>
        <p className="text-xs text-zinc-500 mb-4">Apagar sua conta é irreversível. Seus prompts serão mantidos na base mas sem vínculo ao seu perfil.</p>
        {!showDelete ? (
          <button onClick={() => setShowDelete(true)}
            className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-xs hover:bg-red-500/10 transition-colors">
            Apagar minha conta
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-zinc-400">Digite seu email <span className="text-white">{user.email}</span> para confirmar:</p>
            <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-red-500/30 text-white text-sm focus:outline-none"
              placeholder={user.email} />
            <div className="flex gap-3">
              <button onClick={() => { setShowDelete(false); setDeleteConfirm('') }}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Cancelar</button>
              <button onClick={handleDeleteAccount} disabled={deleteConfirm !== user.email}
                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold hover:bg-red-500/30 transition-colors disabled:opacity-30">
                Confirmar exclusão
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Meus Prompts ──────────────────────────────────────────────────────────────

function MeusPromptsTab({ prompts }: { prompts: any[] }) {
  const statusMap: Record<string, string> = {
    aprovado: 'bg-green-500/10 text-green-400 border-green-500/20',
    ativo: 'bg-green-500/10 text-green-400 border-green-500/20',
    pendente: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    inativo: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  }

  if (!prompts.length) {
    return (
      <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
        <p className="text-zinc-500 mb-3">Você ainda não enviou nenhum prompt</p>
        <Link href="/dashboard/novo-prompt" className="text-sm text-white hover:underline">Enviar meu primeiro prompt →</Link>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500 mb-4">{prompts.length} prompt(s) enviado(s)</p>
      {prompts.map(p => (
        <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition-colors">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{p.titulo}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-zinc-600">{new Date(p.created_at).toLocaleDateString('pt-BR')}</span>
              {p.internacional && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Intl{p.idioma ? ` · ${p.idioma.toUpperCase()}` : ''}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 ml-4">
            <span className={`px-2 py-0.5 rounded-full text-xs border ${statusMap[p.status] ?? statusMap.inativo}`}>{p.status}</span>
            <Link href={`/prompts/${p.id}`} className="text-xs text-zinc-500 hover:text-white transition-colors">Ver →</Link>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Grupos ────────────────────────────────────────────────────────────────────

function GruposTab({ userId, meusGrupos }: { userId: string; meusGrupos: any[] }) {
  const supabase = createClient()
  const [grupos, setGrupos] = useState(meusGrupos)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [createForm, setCreateForm] = useState({ nome: '', descricao: '', tipo: 'estudo' })
  const [joinId, setJoinId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const reload = async () => {
    const { data } = await (supabase as any)
      .from('grupo_membros')
      .select('papel, joined_at, grupos(id, nome, descricao, tipo, criado_por)')
      .eq('user_id', userId)
    setGrupos(data ?? [])
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { data: grupo, error: err } = await (supabase as any).from('grupos').insert({
      nome: createForm.nome,
      descricao: createForm.descricao || null,
      tipo: createForm.tipo,
      criado_por: userId,
    }).select().single()
    if (err || !grupo) { setError('Erro ao criar grupo.'); setLoading(false); return }
    await (supabase as any).from('grupo_membros').insert({ grupo_id: grupo.id, user_id: userId, papel: 'admin' })
    setShowCreate(false)
    setCreateForm({ nome: '', descricao: '', tipo: 'estudo' })
    setLoading(false)
    reload()
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { data: grupo } = await (supabase as any).from('grupos').select('id').eq('id', joinId.trim()).single()
    if (!grupo) { setError('Grupo não encontrado. Verifique o ID.'); setLoading(false); return }
    const { error: err } = await (supabase as any).from('grupo_membros').insert({ grupo_id: grupo.id, user_id: userId, papel: 'membro' })
    if (err) { setError('Você já faz parte deste grupo.'); setLoading(false); return }
    setShowJoin(false)
    setJoinId('')
    setLoading(false)
    reload()
  }

  const handleLeave = async (grupoId: string) => {
    if (!confirm('Sair deste grupo?')) return
    await (supabase as any).from('grupo_membros').delete().eq('grupo_id', grupoId).eq('user_id', userId)
    reload()
  }

  const tipoLabel: Record<string, string> = { estudo: 'Grupo de Estudo', escritorio: 'Escritório', outro: 'Outro' }
  const tipoColor: Record<string, string> = {
    estudo: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    escritorio: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    outro: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => { setShowCreate(true); setShowJoin(false); setError('') }}
          className="px-4 py-2 rounded-lg bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors">
          + Criar grupo
        </button>
        <button onClick={() => { setShowJoin(true); setShowCreate(false); setError('') }}
          className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:text-white hover:border-zinc-500 transition-colors">
          Entrar com ID
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="p-4 rounded-xl border border-zinc-700 bg-zinc-900/50 space-y-3">
          <h3 className="text-sm font-semibold text-white">Criar novo grupo</h3>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Nome</label>
            <input required value={createForm.nome} onChange={e => setCreateForm({ ...createForm, nome: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none"
              placeholder="Nome do grupo" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Tipo</label>
            <select value={createForm.tipo} onChange={e => setCreateForm({ ...createForm, tipo: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm focus:outline-none">
              <option value="estudo">Grupo de Estudo</option>
              <option value="escritorio">Escritório</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Descrição (opcional)</label>
            <input value={createForm.descricao} onChange={e => setCreateForm({ ...createForm, descricao: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none"
              placeholder="Breve descrição" />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowCreate(false)} className="text-xs text-zinc-500 hover:text-white px-3 py-1.5">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-1.5 rounded-lg bg-white text-zinc-950 font-semibold text-xs hover:bg-zinc-100 disabled:opacity-50">
              {loading ? 'Criando...' : 'Criar'}
            </button>
          </div>
        </form>
      )}

      {showJoin && (
        <form onSubmit={handleJoin} className="p-4 rounded-xl border border-zinc-700 bg-zinc-900/50 space-y-3">
          <h3 className="text-sm font-semibold text-white">Entrar em um grupo</h3>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">ID do grupo</label>
            <input required value={joinId} onChange={e => setJoinId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none font-mono"
              placeholder="Cole o ID do grupo aqui" />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowJoin(false)} className="text-xs text-zinc-500 hover:text-white px-3 py-1.5">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-1.5 rounded-lg bg-white text-zinc-950 font-semibold text-xs hover:bg-zinc-100 disabled:opacity-50">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>
      )}

      {grupos.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl">
          <p className="text-zinc-500 text-sm">Você não faz parte de nenhum grupo ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grupos.map((m: any) => {
            const g = m.grupos
            if (!g) return null
            return (
              <div key={g.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-medium text-sm">{g.nome}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${tipoColor[g.tipo]}`}>{tipoLabel[g.tipo]}</span>
                      {m.papel === 'admin' && <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Admin</span>}
                    </div>
                    {g.descricao && <p className="text-xs text-zinc-500 mt-1">{g.descricao}</p>}
                    <p className="text-xs text-zinc-700 mt-1 font-mono">ID: {g.id}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link href={`/grupos/${g.id}`} className="text-xs text-zinc-400 hover:text-white transition-colors">Ver</Link>
                    {g.criado_por !== m.user_id && (
                      <button onClick={() => handleLeave(g.id)} className="text-xs text-red-400/60 hover:text-red-400 transition-colors">Sair</button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
