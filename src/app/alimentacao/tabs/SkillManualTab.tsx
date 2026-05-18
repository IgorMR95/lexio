'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { AreaDireito } from '@/lib/supabase/types'

interface Props {
  areas: AreaDireito[]
  userId: string
}

const TIPOS = [
  {
    value: 'skill',
    label: 'Configuração geral',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    exemplo: 'Ex: "Sempre responda em linguagem jurídica formal. Use ABNT. Indique os artigos de lei aplicáveis."',
    descricao: 'Instruções gerais de como a IA deve se comportar em toda e qualquer situação — formatação, linguagem, regras que valem sempre.',
    color: 'green',
  },
  {
    value: 'persona',
    label: 'Perfil profissional',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    exemplo: 'Ex: "Você é um advogado trabalhista com 15 anos de experiência em reclamações na Justiça do Trabalho de São Paulo..."',
    descricao: 'Define quem a IA deve "ser" — um especialista em determinada área, com o perfil e experiência que você precisa para aquele trabalho.',
    color: 'violet',
  },
  {
    value: 'workflow',
    label: 'Passo a passo de tarefa',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    exemplo: 'Ex: "Ao analisar um contrato: 1) identifique as partes, 2) verifique cláusulas abusivas, 3) aponte os riscos, 4) sugira alterações..."',
    descricao: 'Um roteiro de etapas que a IA deve seguir automaticamente ao realizar uma tarefa específica — análise de contrato, elaboração de peça, parecer etc.',
    color: 'blue',
  },
  {
    value: 'instrucao',
    label: 'Regra de comportamento',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    exemplo: 'Ex: "Nunca invente jurisprudência. Se não souber a decisão exata, diga que precisa ser verificado. Sempre cite a fonte."',
    descricao: 'Limites e restrições específicas — o que a IA nunca deve fazer, como deve se comportar em situações delicadas ou quando não tiver certeza.',
    color: 'amber',
  },
]

const COMPATIBILIDADE = [
  { value: 'Claude Code', label: 'Claude Code', desc: 'Assistente de programação da Anthropic' },
  { value: 'Cursor', label: 'Cursor', desc: 'Editor com IA integrada' },
  { value: 'Continue', label: 'Continue', desc: 'Extensão para VS Code' },
  { value: 'Cline', label: 'Cline', desc: 'Agente autônomo de código' },
  { value: 'Copilot', label: 'GitHub Copilot', desc: 'Assistente da Microsoft/GitHub' },
  { value: 'Outro', label: 'Outro assistente', desc: 'ChatGPT, Gemini, outros' },
]

type ColorKey = 'green' | 'violet' | 'blue' | 'amber'

const colorMap: Record<ColorKey, { border: string; bg: string; text: string; iconBg: string; iconBorder: string }> = {
  green:  { border: 'border-green-500/50',  bg: 'bg-green-500/10',  text: 'text-green-300',  iconBg: 'bg-green-500/20',  iconBorder: 'border-green-500/30' },
  violet: { border: 'border-violet-500/50', bg: 'bg-violet-500/10', text: 'text-violet-300', iconBg: 'bg-violet-500/20', iconBorder: 'border-violet-500/30' },
  blue:   { border: 'border-blue-500/50',   bg: 'bg-blue-500/10',   text: 'text-blue-300',   iconBg: 'bg-blue-500/20',   iconBorder: 'border-blue-500/30' },
  amber:  { border: 'border-amber-500/50',  bg: 'bg-amber-500/10',  text: 'text-amber-300',  iconBg: 'bg-amber-500/20',  iconBorder: 'border-amber-500/30' },
}

export function SkillManualTab({ areas, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [conteudoMd, setConteudoMd] = useState('')
  const [tipo, setTipo] = useState('skill')
  const [areaDireitoId, setAreaDireitoId] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [compatibilidade, setCompatibilidade] = useState<string[]>(['Outro'])

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
      status: 'pendente',
    })

    if (err) {
      setError('Erro ao enviar. Tente novamente.')
    } else {
      setSuccess(true)
      setTitulo(''); setDescricao(''); setConteudoMd(''); setTipo('skill')
      setAreaDireitoId(''); setTagsInput(''); setCompatibilidade(['Outro'])
      setTimeout(() => setSuccess(false), 4000)
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Explicação introdutória */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-300 mb-1">O que é uma Skill MD?</p>
            <p className="text-xs text-zinc-500 leading-relaxed">
              É um arquivo de texto (.md) que você salva no assistente de IA uma vez, e ele passa a se comportar do jeito que você quer em todos os trabalhos seguintes — sem precisar repetir as instruções toda hora. Pense como um &quot;manual de uso pessoal&quot; que a IA lê antes de cada conversa.
            </p>
          </div>
        </div>
      </div>

      {/* Tipo de skill */}
      <div>
        <label className="block text-xs text-zinc-400 mb-3">Qual tipo de configuração você está compartilhando? <span className="text-red-400">*</span></label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TIPOS.map(t => {
            const colors = colorMap[t.color as ColorKey]
            const isSelected = tipo === t.value
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTipo(t.value)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  isSelected ? `${colors.border} ${colors.bg}` : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isSelected ? `${colors.iconBg} border ${colors.iconBorder}` : 'bg-zinc-800 border border-zinc-700'
                  }`}>
                    <span className={isSelected ? colors.text : 'text-zinc-400'}>{t.icon}</span>
                  </div>
                  <p className={`text-sm font-semibold ${isSelected ? colors.text : 'text-zinc-300'}`}>{t.label}</p>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">{t.descricao}</p>
                <p className="text-xs text-zinc-600 mt-2 italic leading-relaxed">{t.exemplo}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Dados principais */}
      <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Identificação</h3>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Título <span className="text-red-400">*</span></label>
          <input
            type="text"
            required
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-sm"
            placeholder="Ex: Advogado Trabalhista Especialista em Reclamações"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Descrição em uma linha</label>
          <input
            type="text"
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-sm"
            placeholder="Para que serve e quem vai se beneficiar"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Área do Direito</label>
          <select
            value={areaDireitoId}
            onChange={e => setAreaDireitoId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm focus:outline-none focus:border-zinc-600"
          >
            <option value="">Todas as áreas / Geral</option>
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
            placeholder="trabalhista, análise de contrato, petição inicial"
          />
          <p className="text-xs text-zinc-600 mt-1">Palavras que facilitam a busca de outros usuários</p>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-1">Conteúdo da Skill</h3>
          <p className="text-xs text-zinc-600">Cole o texto da sua skill abaixo. Não precisa seguir nenhum formato especial — escreva como se estivesse dando instruções para um assistente.</p>
        </div>
        <textarea
          required
          rows={14}
          value={conteudoMd}
          onChange={e => setConteudoMd(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-sm resize-none font-mono"
          placeholder={`# Exemplo de skill\n\nVocê é um advogado especialista em direito do trabalho com 15 anos de experiência.\n\nAo analisar qualquer questão trabalhista:\n- Cite sempre os artigos da CLT aplicáveis\n- Mencione jurisprudência do TST quando relevante\n- Use linguagem técnica mas acessível ao cliente\n- Sempre indique o prazo prescricional quando aplicável\n\nNunca invente decisões judiciais. Se não tiver certeza, diga que é necessário verificar.`}
        />
        <p className="text-xs text-zinc-600">{conteudoMd.length} caracteres</p>
      </div>

      {/* Compatibilidade */}
      <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-1">Com qual assistente de IA funciona?</h3>
          <p className="text-xs text-zinc-600">Selecione todos que se aplicam. Se não souber, marque &quot;Outro assistente&quot;.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {COMPATIBILIDADE.map(c => (
            <button
              key={c.value}
              type="button"
              onClick={() => toggleCompat(c.value)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                compatibilidade.includes(c.value)
                  ? 'border-violet-500/50 bg-violet-500/10'
                  : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
              }`}
            >
              <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border ${
                compatibilidade.includes(c.value) ? 'border-violet-400 bg-violet-500/30' : 'border-zinc-700'
              }`}>
                {compatibilidade.includes(c.value) && (
                  <svg className="w-2.5 h-2.5 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div>
                <p className={`text-sm font-medium ${compatibilidade.includes(c.value) ? 'text-violet-300' : 'text-zinc-300'}`}>{c.label}</p>
                <p className="text-xs text-zinc-600">{c.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
      {success && (
        <div className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
          <p className="font-medium mb-0.5">Skill enviada com sucesso!</p>
          <p className="text-green-500/80">Nossa equipe vai revisar antes de publicar na base. Obrigado pela contribuição!</p>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-lg bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Enviar skill para revisão'}
        </button>
        <p className="text-xs text-zinc-600">Revisada antes de ser publicada</p>
      </div>
    </form>
  )
}
