'use client'

import { useState } from 'react'
import { ManualTab } from './tabs/ManualTab'
import { ImportTab } from './tabs/ImportTab'
import { SkillManualTab } from './tabs/SkillManualTab'
import type { CategoriaPrincipal, Subcategoria, Subnivel, AreaDireito } from '@/lib/supabase/types'

function InfoDropdown({ title, color, children }: { title: string; color: 'green' | 'violet'; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const iconColor = color === 'green' ? 'text-green-400' : 'text-violet-400'
  const borderColor = color === 'green' ? 'border-green-500/20' : 'border-violet-500/20'
  const bgColor = color === 'green' ? 'bg-green-500/5' : 'bg-violet-500/5'
  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:brightness-110 transition-all"
      >
        <div className="flex items-center gap-2.5">
          <svg className={`w-4 h-4 ${iconColor} flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-zinc-300">{title}</span>
        </div>
        <svg className={`w-4 h-4 text-zinc-500 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-zinc-800/40">
          <div className="pt-3 text-xs text-zinc-500 leading-relaxed space-y-2">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

interface Props {
  categorias: CategoriaPrincipal[]
  subcategorias: Subcategoria[]
  subniveis: Subnivel[]
  areas: AreaDireito[]
  userId: string
}

type ContentType = 'prompt' | 'skill'
type PromptTab = 'manual' | 'excel' | 'docs'

export function AlimentacaoClient({ categorias, subcategorias, subniveis, areas, userId }: Props) {
  const [contentType, setContentType] = useState<ContentType>('prompt')
  const [promptTab, setPromptTab] = useState<PromptTab>('manual')

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Contribuir com a base</h1>
        <p className="text-zinc-500 text-sm mt-1">Compartilhe seu conhecimento com a comunidade jurídica</p>
      </div>

      {/* Seleção do tipo de conteúdo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => setContentType('prompt')}
          className={`p-5 rounded-xl border text-left transition-all ${
            contentType === 'prompt'
              ? 'border-green-500/50 bg-green-500/10'
              : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${contentType === 'prompt' ? 'bg-green-500/20 border border-green-500/30' : 'bg-zinc-800 border border-zinc-700'}`}>
              <svg className={`w-5 h-5 ${contentType === 'prompt' ? 'text-green-400' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className={`font-semibold text-sm ${contentType === 'prompt' ? 'text-green-300' : 'text-white'}`}>Prompt</p>
              <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                Um texto de instrução que você envia para a IA antes de fazer sua pergunta. Ex: &quot;Analise este contrato como advogado especialista em...&quot;
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setContentType('skill')}
          className={`p-5 rounded-xl border text-left transition-all ${
            contentType === 'skill'
              ? 'border-violet-500/50 bg-violet-500/10'
              : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${contentType === 'skill' ? 'bg-violet-500/20 border border-violet-500/30' : 'bg-zinc-800 border border-zinc-700'}`}>
              <svg className={`w-5 h-5 ${contentType === 'skill' ? 'text-violet-400' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className={`font-semibold text-sm ${contentType === 'skill' ? 'text-violet-300' : 'text-white'}`}>Skill MD <span className="text-xs font-normal opacity-70">(arquivo de configuração)</span></p>
              <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                Um arquivo de configuração permanente que &quot;ensina&quot; a IA sobre você, sua área e seu jeito de trabalhar — sem precisar repetir isso a cada conversa.
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Dropdowns explicativos — aparecem conforme o tipo selecionado */}
      <div className="mb-8 space-y-3">
        {contentType === 'prompt' && (
          <InfoDropdown title="O que é um prompt? Como funciona?" color="green">
            <p>
              Um <strong className="text-zinc-300">prompt</strong> é o texto de instrução que você digita para a IA antes ou junto com a sua pergunta. Ele define o contexto, o papel que a IA deve assumir e como ela deve responder.
            </p>
            <p>
              Por exemplo: em vez de perguntar apenas <em>&quot;analise este contrato&quot;</em>, um prompt bem feito diria: <em>&quot;Você é um advogado especialista em contratos empresariais. Analise o contrato abaixo identificando: 1) as partes e suas obrigações, 2) cláusulas que possam ser abusivas, 3) riscos para o contratante, 4) sugestões de alteração. Use linguagem técnica e seja objetivo.&quot;</em>
            </p>
            <p>
              A diferença de qualidade na resposta é enorme. Prompts bem construídos economizam tempo e geram resultados mais consistentes e confiáveis.
            </p>
            <p>
              Ao compartilhar um prompt aqui, outros advogados poderão usar o mesmo texto como ponto de partida para suas consultas — e você contribui para elevar o padrão de uso da IA na advocacia.
            </p>
          </InfoDropdown>
        )}
        {contentType === 'skill' && (
          <InfoDropdown title="O que é uma Skill MD? Como funciona?" color="violet">
            <p>
              Uma <strong className="text-zinc-300">Skill MD</strong> é um arquivo de texto simples que você &quot;instala&quot; no seu assistente de IA uma única vez. A partir daí, ele passa a se comportar do jeito que você quer em todas as conversas — sem precisar repetir as mesmas instruções toda hora.
            </p>
            <p>
              Pense assim: hoje, toda vez que você abre o ChatGPT ou Claude, precisa explicar quem você é, como trabalha, que linguagem usar, o que nunca fazer. Com uma skill configurada, ele já sabe tudo isso antes de você começar a digitar.
            </p>
            <p>
              O formato <strong className="text-zinc-300">.md</strong> (Markdown) é apenas um arquivo de texto com alguns sinais de formatação simples — como usar # para título. Você não precisa saber programar.
            </p>
            <p>
              Ao compartilhar sua skill, outros advogados com perfil parecido com o seu podem usá-la como base, adaptando para sua realidade — e economizando horas de tentativa e erro.
            </p>
          </InfoDropdown>
        )}
      </div>

      {contentType === 'prompt' && (
        <>
          <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg mb-8 w-fit">
            {([
              { id: 'manual', label: 'Manual' },
              { id: 'excel', label: 'Importar Excel' },
              { id: 'docs', label: 'Documentação' },
            ] as { id: PromptTab; label: string }[]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setPromptTab(tab.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  promptTab === tab.id ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {promptTab === 'manual' && (
            <ManualTab categorias={categorias} subcategorias={subcategorias} subniveis={subniveis} areas={areas} userId={userId} />
          )}
          {promptTab === 'excel' && (
            <ImportTab areas={areas} categorias={categorias} subcategorias={subcategorias} userId={userId} />
          )}
          {promptTab === 'docs' && <DocsTab />}
        </>
      )}

      {contentType === 'skill' && (
        <SkillManualTab areas={areas} userId={userId} />
      )}
    </div>
  )
}

function DocsTab() {
  return (
    <div className="prose prose-invert max-w-none">
      <div className="space-y-6">
        <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30">
          <h3 className="text-white font-semibold mb-2">Estrutura dos prompts</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Cada prompt deve conter: título, texto completo, categoria, subcategoria, subnível e área do direito.
            O status inicial será sempre <span className="text-amber-400">pendente</span> — um administrador precisa aprovar antes de aparecer publicamente.
          </p>
        </div>
        <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30">
          <h3 className="text-white font-semibold mb-2">Importação por Excel</h3>
          <p className="text-zinc-400 text-sm leading-relaxed mb-3">
            O arquivo Excel deve ter as colunas na aba &quot;Prompts&quot;:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="text-left py-2 pr-4 text-zinc-400">Coluna</th>
                  <th className="text-left py-2 pr-4 text-zinc-400">Obrigatório</th>
                  <th className="text-left py-2 text-zinc-400">Descrição</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {[
                  ['titulo', 'Sim', 'Título do prompt'],
                  ['texto_completo', 'Sim', 'Texto completo do prompt'],
                  ['descricao_curta', 'Não', 'Resumo em uma linha'],
                  ['area', 'Não', 'Nome da área do direito (ex: Direito Civil)'],
                  ['tags', 'Não', 'Tags separadas por vírgula'],
                ].map(([col, req, desc]) => (
                  <tr key={col}>
                    <td className="py-2 pr-4 text-zinc-300 font-mono">{col}</td>
                    <td className={`py-2 pr-4 ${req === 'Sim' ? 'text-red-400' : 'text-zinc-500'}`}>{req}</td>
                    <td className="py-2 text-zinc-400">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30">
          <h3 className="text-white font-semibold mb-2">Boas práticas</h3>
          <ul className="text-zinc-400 text-sm space-y-1 list-disc list-inside">
            <li>Use colchetes para indicar campos variáveis: <span className="text-zinc-300">[INSERIR CONTRATO]</span></li>
            <li>Seja específico na descrição curta — ela aparece nos cards da listagem</li>
            <li>Escolha tags relevantes para facilitar a busca</li>
            <li>Revise o texto antes de enviar — edições só são feitas por admins</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
