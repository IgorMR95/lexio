'use client'

import { useState, useRef } from 'react'
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
    descricao: 'Regras gerais de como a IA deve se comportar em qualquer situação — formatação, linguagem, referências que valem sempre.',
    color: 'green',
    template: `# [Nome da sua configuração]

## Contexto
[Descreva em 1-2 frases quem você é e em que contexto essa configuração será usada]

## Instruções gerais
- [Regra 1 — ex: Use sempre linguagem jurídica formal]
- [Regra 2 — ex: Cite os artigos de lei aplicáveis em cada resposta]
- [Regra 3 — ex: Formate as respostas com títulos e subtítulos claros]
- [Regra 4 — adicione quantas precisar]

## Formatação padrão
[Descreva como quer que as respostas sejam formatadas — ex: use negrito nos termos jurídicos, numere as etapas, etc.]

## Restrições
- Nunca [algo que a IA não deve fazer]
- Sempre avise quando [situação de incerteza]`,
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
    template: `# [Nome do perfil profissional]

## Quem você é
Você é um [cargo/função] especializado em [área de atuação], com [X] anos de experiência em [especificidade — ex: Justiça do Trabalho de São Paulo].

## Sua expertise
- [Especialidade 1 — ex: Reclamações trabalhistas individuais]
- [Especialidade 2 — ex: Acordos e homologações]
- [Especialidade 3 — adicione conforme necessário]

## Como você trabalha
- [Característica 1 — ex: Analisa os fatos antes de sugerir a tese jurídica]
- [Característica 2 — ex: Sempre considera o custo-benefício para o cliente]
- [Característica 3 — ex: Menciona prazos e riscos de forma proativa]

## Tom e linguagem
[Descreva o tom — ex: Técnico mas acessível. Direto ao ponto. Evita juridiquês desnecessário.]

## O que você nunca faz
- Nunca inventa jurisprudência ou números de processo
- [Outras restrições específicas do perfil]`,
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
    template: `# [Nome da tarefa — ex: Análise de Contrato Empresarial]

## Quando usar
[Descreva exatamente quando este passo a passo deve ser ativado — ex: Sempre que eu pedir para analisar um contrato]

## Etapas obrigatórias

### 1. [Nome da primeira etapa — ex: Identificação das partes]
[Descreva o que deve ser feito nesta etapa]

### 2. [Nome da segunda etapa — ex: Verificação de cláusulas críticas]
[Descreva o que deve ser feito]
- [Sub-item se necessário]
- [Sub-item se necessário]

### 3. [Nome da terceira etapa — ex: Análise de riscos]
[Descreva o que deve ser feito]

### 4. [Adicione quantas etapas precisar]

## Formato da resposta final
[Descreva como quer que o resultado seja apresentado — ex: Relatório com seções numeradas, tabela de riscos, conclusão com recomendação]

## Referências legais obrigatórias
[Liste as leis, códigos ou normas que devem ser verificados — ex: Código Civil arts. 421-480, CDC se houver relação de consumo]`,
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
    template: `# [Nome da regra — ex: Integridade jurídica]

## Propósito
[Explique em 1 frase por que essa regra existe — ex: Evitar que a IA apresente informações jurídicas incorretas como se fossem fatos]

## O que NUNCA fazer
- Nunca [proibição 1 — ex: inventar números de acórdão ou decisões judiciais]
- Nunca [proibição 2 — ex: afirmar que uma lei existe sem ter certeza]
- Nunca [proibição 3 — adicione conforme necessário]

## O que SEMPRE fazer
- Sempre [obrigação 1 — ex: indicar a fonte ao citar jurisprudência]
- Sempre [obrigação 2 — ex: avisar quando a resposta precisa ser verificada com pesquisa atualizada]
- Sempre [obrigação 3 — adicione conforme necessário]

## Situações específicas
### Quando não souber a resposta
[Instrução de como se comportar — ex: Dizer explicitamente "não tenho certeza sobre isso" e sugerir onde verificar]

### Quando a legislação puder ter mudado
[Instrução — ex: Alertar que a informação se baseia no conhecimento até [data] e recomendar verificação no site do Planalto]`,
  },
]

const COMPATIBILIDADE = [
  { value: 'Claude Code', label: 'Claude Code', desc: 'Assistente de programação da Anthropic' },
  { value: 'Cursor', label: 'Cursor', desc: 'Editor de código com IA integrada' },
  { value: 'Continue', label: 'Continue', desc: 'Extensão de IA para VS Code' },
  { value: 'Cline', label: 'Cline', desc: 'Agente autônomo de código' },
  { value: 'Copilot', label: 'GitHub Copilot', desc: 'Assistente da Microsoft/GitHub' },
  { value: 'Outro', label: 'ChatGPT / Gemini / outro', desc: 'Qualquer assistente de IA geral' },
]

type ColorKey = 'green' | 'violet' | 'blue' | 'amber'

const colorMap: Record<ColorKey, { border: string; bg: string; text: string; iconBg: string; iconBorder: string }> = {
  green:  { border: 'border-green-500/50',  bg: 'bg-green-500/10',  text: 'text-green-300',  iconBg: 'bg-green-500/20',  iconBorder: 'border-green-500/30' },
  violet: { border: 'border-violet-500/50', bg: 'bg-violet-500/10', text: 'text-violet-300', iconBg: 'bg-violet-500/20', iconBorder: 'border-violet-500/30' },
  blue:   { border: 'border-blue-500/50',   bg: 'bg-blue-500/10',   text: 'text-blue-300',   iconBg: 'bg-blue-500/20',   iconBorder: 'border-blue-500/30' },
  amber:  { border: 'border-amber-500/50',  bg: 'bg-amber-500/10',  text: 'text-amber-300',  iconBg: 'bg-amber-500/20',  iconBorder: 'border-amber-500/30' },
}

export function SkillManualTab({ areas, userId }: Props) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [inputMode, setInputMode] = useState<'template' | 'upload' | 'livre'>('template')

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [conteudoMd, setConteudoMd] = useState('')
  const [tipo, setTipo] = useState('skill')
  const [areaDireitoId, setAreaDireitoId] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [compatibilidade, setCompatibilidade] = useState<string[]>(['Outro'])

  const tipoAtual = TIPOS.find(t => t.value === tipo)!

  const handleTipoChange = (value: string) => {
    setTipo(value)
    if (inputMode === 'template') {
      const t = TIPOS.find(x => x.value === value)
      if (t) setConteudoMd(t.template)
    }
  }

  const handleModeChange = (mode: 'template' | 'upload' | 'livre') => {
    setInputMode(mode)
    if (mode === 'template') {
      setConteudoMd(tipoAtual.template)
    } else if (mode === 'livre') {
      setConteudoMd('')
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
      setError('Selecione um arquivo .md ou .txt')
      return
    }
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      setConteudoMd(text)
      if (!titulo && file.name) {
        setTitulo(file.name.replace(/\.(md|txt)$/, '').replace(/[-_]/g, ' '))
      }
      setError('')
    }
    reader.readAsText(file)
  }

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
      setTitulo(''); setDescricao(''); setConteudoMd(tipoAtual.template); setTipo('skill')
      setAreaDireitoId(''); setTagsInput(''); setCompatibilidade(['Outro'])
      setInputMode('template')
      setTimeout(() => setSuccess(false), 5000)
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

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
                onClick={() => handleTipoChange(t.value)}
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

      {/* Dados de identificação */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              placeholder="trabalhista, análise de contrato"
            />
          </div>
        </div>
      </div>

      {/* Conteúdo — modo de entrada */}
      <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-1">Conteúdo da Skill</h3>
          <p className="text-xs text-zinc-600">Escolha como quer inserir o conteúdo:</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleModeChange('template')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              inputMode === 'template' ? 'border-green-500/50 bg-green-500/10 text-green-300' : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
            }`}
          >
            Usar modelo pronto
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('upload')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              inputMode === 'upload' ? 'border-green-500/50 bg-green-500/10 text-green-300' : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
            }`}
          >
            Fazer upload de arquivo .md
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('livre')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              inputMode === 'livre' ? 'border-green-500/50 bg-green-500/10 text-green-300' : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
            }`}
          >
            Escrever livremente
          </button>
        </div>

        {inputMode === 'template' && (
          <div className="p-3 rounded-lg bg-zinc-950/50 border border-zinc-800/50">
            <p className="text-xs text-zinc-500 mb-2">
              Modelo carregado para <span className="text-zinc-300 font-medium">{tipoAtual.label}</span>. Substitua os campos entre colchetes <span className="text-zinc-400 font-mono text-xs">[assim]</span> pelo seu conteúdo.
            </p>
          </div>
        )}

        {inputMode === 'upload' && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-xl border-2 border-dashed border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900/50 transition-colors"
            >
              <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm text-zinc-400">Clique para selecionar um arquivo <span className="text-zinc-300 font-medium">.md</span> ou <span className="text-zinc-300 font-medium">.txt</span></span>
              <span className="text-xs text-zinc-600">O conteúdo será carregado abaixo para você revisar antes de enviar</span>
            </button>
            {conteudoMd && inputMode === 'upload' && (
              <p className="text-xs text-green-400 mt-2">Arquivo carregado — {conteudoMd.length} caracteres. Revise o conteúdo abaixo.</p>
            )}
          </div>
        )}

        <textarea
          required
          rows={16}
          value={inputMode === 'template' && !conteudoMd ? tipoAtual.template : conteudoMd}
          onChange={e => setConteudoMd(e.target.value)}
          onFocus={() => {
            if (inputMode === 'template' && !conteudoMd) setConteudoMd(tipoAtual.template)
          }}
          className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-sm resize-none font-mono"
        />
        <p className="text-xs text-zinc-600">{(inputMode === 'template' && !conteudoMd ? tipoAtual.template : conteudoMd).length} caracteres</p>
      </div>

      {/* Compatibilidade */}
      <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-1">Com qual assistente de IA funciona?</h3>
          <p className="text-xs text-zinc-600">Selecione todos que se aplicam. Se não tiver certeza, marque a última opção.</p>
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
        <p className="text-xs text-zinc-600">Será revisada antes de ser publicada</p>
      </div>
    </form>
  )
}
