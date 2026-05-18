'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Ferramenta {
  id: string
  nome: string
  descricao: string | null
  url: string | null
  tipo: 'llm' | 'app' | 'extensao' | 'plataforma' | 'outro'
  grupo: 'modelo' | 'ferramenta'
  destaque: boolean
}

interface Categoria {
  id: string
  nome: string
  slug: string
  descricao: string | null
  ordem: number
  tipo_categoria: 'perfil' | 'uso'
}

interface VotoContagem {
  ferramenta_id: string
  categoria_uso_id: string
  total_votos: number
}

interface Props {
  ferramentas: Ferramenta[]
  categorias: Categoria[]
  votosGeral: VotoContagem[]
  votosSemana: VotoContagem[]
  votosMes: VotoContagem[]
  meusVotos: { ferramenta_id: string; categoria_uso_id: string }[]
  userId: string | null
}

type Periodo = 'geral' | 'mes' | 'semana'
type EixoFiltro = 'perfil' | 'uso'

function buildVotosMap(votos: VotoContagem[]) {
  const m: Record<string, number> = {}
  for (const v of votos) m[`${v.ferramenta_id}::${v.categoria_uso_id}`] = v.total_votos
  return m
}

// Cores por posição
const PODIO_BG = ['bg-yellow-500/10 border-yellow-500/30', 'bg-zinc-800/60 border-zinc-700', 'bg-amber-900/20 border-amber-700/30']
const PODIO_NUM = ['text-yellow-400', 'text-zinc-300', 'text-amber-500']
const PODIO_BAR = ['bg-yellow-400', 'bg-zinc-400', 'bg-amber-600']
const DEFAULT_BAR = 'bg-green-500'

export function RankingClient({
  ferramentas,
  categorias,
  votosGeral,
  votosSemana,
  votosMes,
  meusVotos: initialMeusVotos,
  userId,
}: Props) {
  const perfis = categorias.filter(c => c.tipo_categoria === 'perfil')
  const usos   = categorias.filter(c => c.tipo_categoria === 'uso')

  const [eixo, setEixo] = useState<EixoFiltro>('perfil')
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>(perfis[0]?.id ?? '')
  const [grupoAtivo, setGrupoAtivo] = useState<'modelo' | 'ferramenta'>('modelo')
  const [periodo, setPeriodo] = useState<Periodo>('geral')
  const [meusVotos, setMeusVotos] = useState(initialMeusVotos)
  const [votosGeralState, setVotosGeralState] = useState(votosGeral)
  const [mostrarSugerir, setMostrarSugerir] = useState(false)
  const [mostrarExplicacao, setMostrarExplicacao] = useState(false)

  function handleEixo(novoEixo: EixoFiltro) {
    setEixo(novoEixo)
    setCategoriaAtiva(novoEixo === 'perfil' ? (perfis[0]?.id ?? '') : (usos[0]?.id ?? ''))
  }

  const votosAtivos = useMemo(() => {
    if (periodo === 'semana') return votosSemana
    if (periodo === 'mes')    return votosMes
    return votosGeralState
  }, [periodo, votosSemana, votosMes, votosGeralState])

  const votosMap = useMemo(() => buildVotosMap(votosAtivos), [votosAtivos])

  const rankingAtual = useMemo(() =>
    ferramentas
      .filter(f => f.grupo === grupoAtivo)
      .map(f => ({ ...f, votos_cat: votosMap[`${f.id}::${categoriaAtiva}`] ?? 0 }))
      .sort((a, b) => b.votos_cat - a.votos_cat),
  [ferramentas, grupoAtivo, categoriaAtiva, votosMap])

  const maxVotos = rankingAtual[0]?.votos_cat ?? 0
  const totalVotos = votosGeralState.reduce((s, v) => s + v.total_votos, 0)

  const handleVoto = async (ferramentaId: string) => {
    if (!userId || periodo !== 'geral') return
    const jaVotou = meusVotos.some(v => v.ferramenta_id === ferramentaId && v.categoria_uso_id === categoriaAtiva)
    const supabase = createClient()
    if (jaVotou) {
      await (supabase as any).from('ferramenta_votos').delete()
        .eq('ferramenta_id', ferramentaId).eq('categoria_uso_id', categoriaAtiva).eq('user_id', userId)
      setMeusVotos(prev => prev.filter(v => !(v.ferramenta_id === ferramentaId && v.categoria_uso_id === categoriaAtiva)))
      setVotosGeralState(prev => prev.map(v =>
        v.ferramenta_id === ferramentaId && v.categoria_uso_id === categoriaAtiva
          ? { ...v, total_votos: Math.max(0, v.total_votos - 1) } : v
      ))
    } else {
      await (supabase as any).from('ferramenta_votos').insert({ ferramenta_id: ferramentaId, categoria_uso_id: categoriaAtiva, user_id: userId })
      setMeusVotos(prev => [...prev, { ferramenta_id: ferramentaId, categoria_uso_id: categoriaAtiva }])
      setVotosGeralState(prev => {
        const ex = prev.find(v => v.ferramenta_id === ferramentaId && v.categoria_uso_id === categoriaAtiva)
        if (ex) return prev.map(v => v.ferramenta_id === ferramentaId && v.categoria_uso_id === categoriaAtiva ? { ...v, total_votos: v.total_votos + 1 } : v)
        return [...prev, { ferramenta_id: ferramentaId, categoria_uso_id: categoriaAtiva, total_votos: 1 }]
      })
    }
  }

  if (mostrarSugerir) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button onClick={() => setMostrarSugerir(false)} className="text-sm text-zinc-500 hover:text-white transition-colors mb-6 flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Voltar ao ranking
        </button>
        <ContatoSugestao />
      </div>
    )
  }

  const categoriasAtivas = eixo === 'perfil' ? perfis : usos

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-1">
          <h1 className="text-2xl font-bold text-white">Ranking de IAs no Direito</h1>
          <button onClick={() => setMostrarSugerir(true)} className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-500 hover:text-white hover:border-zinc-500 transition-colors">
            Sugerir ferramenta
          </button>
        </div>
        <p className="text-sm text-zinc-500">
          Avaliadas por advogados, magistrados, promotores e defensores · {totalVotos} votos registrados
        </p>
      </div>

      {/* Toggle Modelos / Ferramentas — destaque principal */}
      <div className="flex gap-2 mb-6">
        {(['modelo', 'ferramenta'] as const).map(g => (
          <button
            key={g}
            onClick={() => setGrupoAtivo(g)}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all border ${
              grupoAtivo === g
                ? g === 'modelo'
                  ? 'bg-violet-500/10 border-violet-500/30 text-violet-300'
                  : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 bg-zinc-900/30'
            }`}
          >
            {g === 'modelo' ? 'Modelos de IA' : 'Ferramentas'}
            <span className="block text-xs font-normal mt-0.5 opacity-60">
              {g === 'modelo' ? 'ChatGPT, Claude, Gemini...' : 'Apps e plataformas jurídicas'}
            </span>
          </button>
        ))}
      </div>

      {/* Filtros: eixo + categorias + período — tudo numa linha compacta */}
      <div className="space-y-3 mb-8">
        {/* Eixo */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-600 shrink-0">Ver por:</span>
          {(['perfil', 'uso'] as EixoFiltro[]).map(e => (
            <button
              key={e}
              onClick={() => handleEixo(e)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                eixo === e ? 'border-zinc-500 text-white bg-zinc-800' : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {e === 'perfil' ? 'Perfil profissional' : 'Tipo de uso'}
            </button>
          ))}
        </div>

        {/* Categorias do eixo ativo */}
        <div className="flex items-center gap-2 flex-wrap">
          {categoriasAtivas.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoriaAtiva(cat.id)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                categoriaAtiva === cat.id
                  ? 'border-green-500/50 text-green-300 bg-green-500/10'
                  : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
              }`}
            >
              {cat.nome}
            </button>
          ))}
        </div>

        {/* Período */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-600 shrink-0">Período:</span>
          {([
            { v: 'geral', l: 'Geral' },
            { v: 'mes',   l: '30 dias' },
            { v: 'semana',l: '7 dias' },
          ] as { v: Periodo; l: string }[]).map(p => (
            <button
              key={p.v}
              onClick={() => setPeriodo(p.v)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                periodo === p.v ? 'border-zinc-500 text-white bg-zinc-800' : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {p.l}
            </button>
          ))}
        </div>
      </div>

      {/* Banner login */}
      {!userId && (
        <div className="mb-6 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/30 flex items-center justify-between gap-3">
          <p className="text-sm text-zinc-500">Faça login para votar nos favoritos da sua área</p>
          <Link href="/login" className="text-sm text-green-400 hover:underline shrink-0 font-medium">Entrar</Link>
        </div>
      )}

      {/* Lista */}
      {rankingAtual.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl">
          <p className="text-zinc-500 text-sm">Nenhum{grupoAtivo === 'modelo' ? ' modelo' : 'a ferramenta'} cadastrado ainda.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rankingAtual.map((f, i) => {
            const jaVotou = meusVotos.some(v => v.ferramenta_id === f.id && v.categoria_uso_id === categoriaAtiva)
            const pct = maxVotos > 0 ? (f.votos_cat / maxVotos) * 100 : 0
            const temVotos = f.votos_cat > 0
            const isPodio = i < 3 && temVotos
            const barColor = isPodio ? PODIO_BAR[i] : DEFAULT_BAR

            return (
              <div
                key={f.id}
                className={`rounded-2xl border transition-all ${isPodio ? PODIO_BG[i] : 'border-zinc-800/60 bg-zinc-900/20 hover:border-zinc-700'}`}
              >
                <div className="flex items-center gap-4 px-4 py-4">
                  {/* Posição */}
                  <div className="w-7 text-center shrink-0">
                    <span className={`text-base font-black ${isPodio ? PODIO_NUM[i] : 'text-zinc-700'}`}>
                      {temVotos ? i + 1 : '—'}
                    </span>
                  </div>

                  {/* Avatar letra */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm border ${
                    grupoAtivo === 'modelo'
                      ? 'bg-violet-500/15 border-violet-500/20 text-violet-300'
                      : 'bg-blue-500/15 border-blue-500/20 text-blue-300'
                  }`}>
                    {f.nome[0]?.toUpperCase()}
                  </div>

                  {/* Info + barra */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-semibold text-white truncate">{f.nome}</span>
                      {f.destaque && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 shrink-0">Destaque</span>}
                    </div>

                    {/* Barra de votos */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                          style={{ width: temVotos ? `${Math.max(pct, 4)}%` : '0%' }}
                        />
                      </div>
                      <span className="text-xs text-zinc-500 tabular-nums shrink-0 w-16 text-right">
                        {temVotos ? `${f.votos_cat} ${f.votos_cat === 1 ? 'voto' : 'votos'}` : 'sem votos'}
                      </span>
                    </div>

                    {f.descricao && (
                      <p className="text-xs text-zinc-600 mt-1.5 line-clamp-1">{f.descricao}</p>
                    )}
                  </div>

                  {/* Botão voto */}
                  <button
                    onClick={() => handleVoto(f.id)}
                    disabled={!userId || periodo !== 'geral'}
                    title={!userId ? 'Entre para votar' : periodo !== 'geral' ? 'Disponível no ranking geral' : jaVotou ? 'Remover voto' : 'Votar'}
                    className={`shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                      jaVotou && periodo === 'geral'
                        ? 'border-green-500/50 bg-green-500/15 text-green-400'
                        : userId && periodo === 'geral'
                          ? 'border-zinc-700 text-zinc-500 hover:border-zinc-400 hover:text-white'
                          : 'border-zinc-800 text-zinc-700 cursor-not-allowed'
                    }`}
                  >
                    <svg className="w-4 h-4" fill={jaVotou && periodo === 'geral' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                </div>

                {/* Link externo — apenas 1ª linha, no rodapé do card se existir */}
                {f.url && (
                  <div className="px-4 pb-3 -mt-1">
                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors">
                      {f.url.replace(/^https?:\/\//, '').replace(/\/$/, '')} ↗
                    </a>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Explicação modelos vs ferramentas — no rodapé, fora do fluxo principal */}
      <div className="mt-12 border border-zinc-800 rounded-2xl overflow-hidden">
        <button
          onClick={() => setMostrarExplicacao(o => !o)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-zinc-900/40 transition-colors"
        >
          <span className="text-sm text-zinc-400">
            Qual é a diferença entre <span className="text-white">modelos de IA</span> e <span className="text-white">ferramentas</span>?
          </span>
          <svg className={`w-4 h-4 text-zinc-500 transition-transform shrink-0 ml-3 ${mostrarExplicacao ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {mostrarExplicacao && (
          <div className="px-5 pb-5 pt-1 border-t border-zinc-800/60 grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/15">
              <p className="text-sm font-semibold text-violet-300 mb-1.5">Modelos de IA</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                São os &ldquo;cérebros&rdquo; — você interage diretamente via chat. Exemplos: <span className="text-zinc-300">ChatGPT, Claude, Gemini</span>. Escreve uma instrução e eles respondem. Versões gratuitas disponíveis.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/15">
              <p className="text-sm font-semibold text-blue-300 mb-1.5">Ferramentas que usam IA</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Aplicativos construídos <em>por cima</em> de um modelo, com funções específicas. Exemplos: <span className="text-zinc-300">Clio, Harvey, Detach Legal</span>. Integram com sua rotina, geralmente com assinatura paga.
              </p>
            </div>
            <p className="sm:col-span-2 text-xs text-zinc-600 px-1">
              Analogia: o modelo é o motor. A ferramenta é o carro inteiro. Para começar, modelos gratuitos já são suficientes.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function ContatoSugestao() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Sugerir ferramenta</h2>
        <p className="text-sm text-zinc-500 leading-relaxed">
          O ranking é curado pela equipe Midori para garantir qualidade e relevância para o mercado jurídico brasileiro.
        </p>
      </div>
      <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-3">
        <p className="text-sm font-medium text-white">Você representa uma empresa com uma ferramenta de IA para o mundo jurídico?</p>
        <p className="text-sm text-zinc-500 leading-relaxed">
          Entre em contato pelo e-mail abaixo. Nossa equipe avalia a ferramenta e, se aprovada, ela é adicionada com uma descrição imparcial para que os usuários possam votar.
        </p>
        <a href="mailto:contato@midori.law" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors text-sm font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          contato@midori.law
        </a>
      </div>
      <p className="text-xs text-zinc-600 leading-relaxed">
        Plataforma independente. Inclusão não é paga. Posição determinada exclusivamente pelos votos da comunidade.
      </p>
    </div>
  )
}
