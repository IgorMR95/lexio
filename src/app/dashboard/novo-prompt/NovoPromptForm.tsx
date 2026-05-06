'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { CategoriaPrincipal, Subcategoria, Subnivel, AreaDireito } from '@/lib/supabase/types'

interface Props {
  categorias: CategoriaPrincipal[]
  subcategorias: Subcategoria[]
  subniveis: Subnivel[]
  areas: AreaDireito[]
  userId: string
}

export function NovoPromptForm({ categorias, subcategorias, subniveis, areas, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [texto, setTexto] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [subcategoriaId, setSubcategoriaId] = useState('')
  const [subnivelId, setSubnivelId] = useState('')
  const [areaDireitoId, setAreaDireitoId] = useState('')
  const [tagsInput, setTagsInput] = useState('')

  const filteredSubcategorias = categoriaId
    ? subcategorias.filter(s => s.categoria_id === categoriaId)
    : []

  const filteredSubniveis = subcategoriaId
    ? subniveis.filter(s => s.subcategoria_id === subcategoriaId)
    : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)

    const { error: err } = await supabase.from('prompts').insert({
      titulo,
      descricao_curta: descricao || null,
      texto_completo: texto,
      categoria_id: categoriaId || null,
      subcategoria_id: subcategoriaId || null,
      subnivel_id: subnivelId || null,
      area_direito_id: areaDireitoId || null,
      tags,
      autor_id: userId,
      status: 'pendente',
    })

    if (err) {
      setError('Erro ao salvar prompt. Tente novamente.')
    } else {
      router.push('/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">Título <span className="text-red-400">*</span></label>
        <input
          type="text"
          required
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-sm"
          placeholder="Ex: Análise de Contrato Empresarial"
        />
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">Descrição curta</label>
        <input
          type="text"
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-sm"
          placeholder="Uma frase descrevendo o prompt"
        />
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">Prompt completo <span className="text-red-400">*</span></label>
        <textarea
          required
          rows={10}
          value={texto}
          onChange={e => setTexto(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-sm resize-none font-mono"
          placeholder="Cole ou escreva o prompt aqui..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Categoria</label>
          <select
            value={categoriaId}
            onChange={e => { setCategoriaId(e.target.value); setSubcategoriaId(''); setSubnivelId('') }}
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm focus:outline-none focus:border-zinc-600"
          >
            <option value="">Selecionar...</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Subcategoria</label>
          <select
            value={subcategoriaId}
            onChange={e => { setSubcategoriaId(e.target.value); setSubnivelId('') }}
            disabled={!categoriaId}
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm focus:outline-none focus:border-zinc-600 disabled:opacity-40"
          >
            <option value="">Selecionar...</option>
            {filteredSubcategorias.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Subnível</label>
          <select
            value={subnivelId}
            onChange={e => setSubnivelId(e.target.value)}
            disabled={!subcategoriaId || filteredSubniveis.length === 0}
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm focus:outline-none focus:border-zinc-600 disabled:opacity-40"
          >
            <option value="">Selecionar...</option>
            {filteredSubniveis.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Área do Direito</label>
          <select
            value={areaDireitoId}
            onChange={e => setAreaDireitoId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm focus:outline-none focus:border-zinc-600"
          >
            <option value="">Selecionar...</option>
            {areas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">Tags (separadas por vírgula)</label>
        <input
          type="text"
          value={tagsInput}
          onChange={e => setTagsInput(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-sm"
          placeholder="contrato, empresarial, análise"
        />
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-lg bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Enviar prompt'}
        </button>
        <p className="text-xs text-zinc-600">Será revisado antes de ser publicado</p>
      </div>
    </form>
  )
}
