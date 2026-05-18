'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const TIPOS = [
  { value: 'skill',     label: 'Configuração geral',      desc: 'Regras e instruções que valem para toda e qualquer situação' },
  { value: 'persona',   label: 'Perfil profissional',     desc: 'Define o papel e a especialidade que a IA deve assumir' },
  { value: 'workflow',  label: 'Passo a passo de tarefa', desc: 'Roteiro de etapas para uma tarefa específica (análise, peça, parecer)' },
  { value: 'instrucao', label: 'Regra de comportamento',  desc: 'Limites e restrições — o que a IA nunca deve fazer' },
]

const COMPATIBILIDADE = ['Claude Code', 'Cursor', 'Continue', 'Cline', 'Copilot', 'Outro']

interface Props {
  areas: { id: string; nome: string }[]
  userId: string
  isAdmin?: boolean
}

export function NovaSkillForm({ areas, userId, isAdmin }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [conteudoMd, setConteudoMd] = useState('')
  const [tipo, setTipo] = useState('skill')
  const [areaDireitoId, setAreaDireitoId] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [compatibilidade, setCompatibilidade] = useState<string[]>(['Claude Code'])

  const toggleCompat = (c: string) => {
    setCompatibilidade(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)

    const { error: err } = await (supabase as any).from('skills').insert({
      titulo,
      descricao: descricao || null,
      conteudo_md: conteudoMd,
      tipo,
      area_direito_id: areaDireitoId || null,
      tags,
      compatibilidade,
      autor_id: userId,
      status: isAdmin ? 'ativo' : 'pendente',
    })

    if (err) {
      setError('Erro ao salvar skill. Tente novamente.')
    } else {
      router.push('/skills')
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
          placeholder="Ex: Assistente de Peças Processuais"
        />
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">Descrição curta</label>
        <input
          type="text"
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-sm"
          placeholder="Uma frase descrevendo a skill"
        />
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">Tipo <span className="text-red-400">*</span></label>
        <div className="grid grid-cols-2 gap-2">
          {TIPOS.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTipo(t.value)}
              className={`p-3 rounded-lg border text-left transition-all ${
                tipo === t.value
                  ? 'border-green-500/50 bg-green-500/10'
                  : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
              }`}
            >
              <p className={`text-sm font-medium ${tipo === t.value ? 'text-green-300' : 'text-zinc-300'}`}>{t.label}</p>
              <p className="text-xs text-zinc-600 mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">Conteúdo .md <span className="text-red-400">*</span></label>
        <textarea
          required
          rows={14}
          value={conteudoMd}
          onChange={e => setConteudoMd(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-sm resize-none font-mono"
          placeholder="# Nome da Skill&#10;&#10;Cole ou escreva o conteúdo markdown aqui..."
        />
        <p className="text-xs text-zinc-600 mt-1">{conteudoMd.length} caracteres</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Tags (separadas por vírgula)</label>
          <input
            type="text"
            value={tagsInput}
            onChange={e => setTagsInput(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-sm"
            placeholder="peças, claude-code, processual"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-2">Compatível com</label>
        <div className="flex flex-wrap gap-2">
          {COMPATIBILIDADE.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => toggleCompat(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                compatibilidade.includes(c)
                  ? 'border-green-500/50 bg-green-500/10 text-green-300'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-lg bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Compartilhar skill'}
        </button>
        {!isAdmin && <p className="text-xs text-zinc-600">Será revisada antes de ser publicada</p>}
      </div>
    </form>
  )
}
