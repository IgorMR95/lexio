'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { CategoriaPrincipal, Subcategoria, Subnivel, AreaDireito, Prompt } from '@/lib/supabase/types'

interface Props {
  prompt: Prompt
  categorias: CategoriaPrincipal[]
  subcategorias: Subcategoria[]
  subniveis: Subnivel[]
  areas: AreaDireito[]
}

export function EditPromptForm({ prompt: initial, categorias, subcategorias, subniveis, areas }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [titulo, setTitulo] = useState(initial.titulo)
  const [descricao, setDescricao] = useState(initial.descricao_curta ?? '')
  const [texto, setTexto] = useState(initial.texto_completo)
  const [categoriaId, setCategoriaId] = useState(initial.categoria_id ?? '')
  const [subcategoriaId, setSubcategoriaId] = useState(initial.subcategoria_id ?? '')
  const [subnivelId, setSubnivelId] = useState(initial.subnivel_id ?? '')
  const [areaDireitoId, setAreaDireitoId] = useState(initial.area_direito_id ?? '')
  const [tagsInput, setTagsInput] = useState(initial.tags.join(', '))
  const [status, setStatus] = useState(initial.status)

  const filteredSubcategorias = categoriaId ? subcategorias.filter(s => s.categoria_id === categoriaId) : subcategorias
  const filteredSubniveis = subcategoriaId ? subniveis.filter(s => s.subcategoria_id === subcategoriaId) : subniveis

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)

    const { error: err } = await supabase.from('prompts').update({
      titulo,
      descricao_curta: descricao || null,
      texto_completo: texto,
      categoria_id: categoriaId || null,
      subcategoria_id: subcategoriaId || null,
      subnivel_id: subnivelId || null,
      area_direito_id: areaDireitoId || null,
      tags,
      status,
    }).eq('id', initial.id)

    if (err) {
      setError('Erro ao salvar. Tente novamente.')
    } else {
      router.push('/admin')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">Título <span className="text-red-400">*</span></label>
        <input type="text" required value={titulo} onChange={e => setTitulo(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-sm" />
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">Descrição curta</label>
        <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-sm" />
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">Prompt completo <span className="text-red-400">*</span></label>
        <textarea required rows={10} value={texto} onChange={e => setTexto(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-sm resize-none font-mono" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Categoria</label>
          <select value={categoriaId} onChange={e => { setCategoriaId(e.target.value); setSubcategoriaId(''); setSubnivelId('') }}
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm focus:outline-none">
            <option value="">—</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Subcategoria</label>
          <select value={subcategoriaId} onChange={e => { setSubcategoriaId(e.target.value); setSubnivelId('') }}
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm focus:outline-none">
            <option value="">—</option>
            {filteredSubcategorias.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Subnível</label>
          <select value={subnivelId} onChange={e => setSubnivelId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm focus:outline-none">
            <option value="">—</option>
            {filteredSubniveis.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Área do Direito</label>
          <select value={areaDireitoId} onChange={e => setAreaDireitoId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm focus:outline-none">
            <option value="">—</option>
            {areas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Tags</label>
          <input type="text" value={tagsInput} onChange={e => setTagsInput(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-sm"
            placeholder="tag1, tag2, tag3" />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Status</label>
          <select value={status} onChange={e => setStatus(e.target.value as any)}
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm focus:outline-none">
            <option value="aprovado">Aprovado</option>
            <option value="ativo">Ativo</option>
            <option value="pendente">Pendente</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="px-6 py-2.5 rounded-lg bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors disabled:opacity-50">
          {loading ? 'Salvando...' : 'Salvar alterações'}
        </button>
        <button type="button" onClick={() => router.back()} className="text-sm text-zinc-500 hover:text-white transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}
