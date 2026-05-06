'use client'

import { useState } from 'react'
import { ManualTab } from './tabs/ManualTab'
import { ImportTab } from './tabs/ImportTab'
import type { CategoriaPrincipal, Subcategoria, Subnivel, AreaDireito } from '@/lib/supabase/types'

interface Props {
  categorias: CategoriaPrincipal[]
  subcategorias: Subcategoria[]
  subniveis: Subnivel[]
  areas: AreaDireito[]
  userId: string
}

const tabs = [
  { id: 'manual', label: 'Manual' },
  { id: 'excel', label: 'Importar Excel' },
  { id: 'docs', label: 'Documentação' },
]

export function AlimentacaoClient({ categorias, subcategorias, subniveis, areas, userId }: Props) {
  const [activeTab, setActiveTab] = useState('manual')

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Alimentação</h1>
        <p className="text-zinc-500 text-sm mt-1">Cadastre novos prompts na base</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg mb-8 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-zinc-950'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'manual' && (
        <ManualTab
          categorias={categorias}
          subcategorias={subcategorias}
          subniveis={subniveis}
          areas={areas}
          userId={userId}
        />
      )}
      {activeTab === 'excel' && <ImportTab areas={areas} categorias={categorias} subcategorias={subcategorias} userId={userId} />}
      {activeTab === 'docs' && <DocsTab />}
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
