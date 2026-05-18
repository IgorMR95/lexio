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

const TIPO_LABELS: Record<string, string> = {
  llm:        'Modelo de IA',
  app:        'Aplicativo',
  extensao:   'Extensão',
  plataforma: 'Plataforma',
  outro:      'Outro',
}

const TIPO_COLOR: Record<string, string> = {
  llm:        'bg-violet-500/10 text-violet-400 border-violet-500/20',
  app:        'bg-blue-500/10 text-blue-400 border-blue-500/20',
  extensao:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  plataforma: 'bg-green-500/10 text-green-400 border-green-500/20',
  outro:      'bg-zinc-800 text-zinc-400 border-zinc-700',
}

type Periodo = 'geral' | 'mes' | 'semana'
type EixoFiltro = 'perfil' | 'uso'

function buildVotosMap(votos: VotoContagem[]) {
  const m: Record<string, number> = {}
  for (const v of votos) m[`${v.ferramenta_id}::${v.categoria_uso_id}`] = v.total_votos
  return m
}

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

  // Troca eixo e reseta categoria ativa
  function handleEixo(novoEixo: EixoFiltro) {
    setEixo(novoEixo)
    if (novoEixo === 'perfil') setCategoriaAtiva(perfis[0]?.id ?? '')
    else setCategoriaAtiva(usos[0]?.id ?? '')
  }

  // Votos conforme período selecionado (semana/mês usam dados do server; geral é mutável via votos locais)
  const votosAtivos: VotoContagem[] = useMemo(() => {
    if (periodo === 'semana') return votosSemana
    if (periodo === 'mes')    return votosMes
    return votosGeralState
  }, [periodo, votosSemana, votosMes, votosGeralState])

  const votosMap = useMemo(() => buildVotosMap(votosAtivos), [votosAtivos])

  const rankingAtual = useMemo(() => {
    return ferramentas
      .filter(f => f.grupo === grupoAtivo)
      .map(f => ({
        ...f,
        votos_cat: votosMap[`${f.id}::${categoriaAtiva}`] ?? 0,
      }))
      .sort((a, b) => b.votos_cat - a.votos_cat)
  }, [ferramentas, grupoAtivo, categoriaAtiva, votosMap])

  const handleVoto = async (ferramentaId: string) => {
    if (!userId || periodo !== 'geral') return
    const jaVotou = meusVotos.some(v => v.ferramenta_id === ferramentaId && v.categoria_uso_id === categoriaAtiva)
    const supabase = createClient()

    if (jaVotou) {
      await (supabase as any)
        .from('ferramenta_votos')
        .delete()
        .eq('ferramenta_id', ferramentaId)
        .eq('categoria_uso_id', categoriaAtiva)
        .eq('user_id', userId)
      setMeusVotos(prev => prev.filter(v => !(v.ferramenta_id === ferramentaId && v.categoria_uso_id === categoriaAtiva)))
      setVotosGeralState(prev => prev.map(v =>
        v.ferramenta_id === ferramentaId && v.categoria_uso_id === categoriaAtiva
          ? { ...v, total_votos: Math.max(0, v.total_votos - 1) }
          : v
      ))
    } else {
      await (supabase as any)
        .from('ferramenta_votos')
        .insert({ ferramenta_id: ferramentaId, categoria_uso_id: categoriaAtiva, user_id: userId })
      setMeusVotos(prev => [...prev, { ferramenta_id: ferramentaId, categoria_uso_id: categoriaAtiva }])
      setVotosGeralState(prev => {
        const existing = prev.find(v => v.ferramenta_id === ferramentaId && v.categoria_uso_id === categoriaAtiva)
        if (existing) {
          return prev.map(v =>
            v.ferramenta_id === ferramentaId && v.categoria_uso_id === categoriaAtiva
              ? { ...v, total_votos: v.total_votos + 1 } : v
          )
        }
        return [...prev, { ferramenta_id: ferramentaId, categoria_uso_id: categoriaAtiva, total_votos: 1 }]
      })
    }
  }

  const totalVotos = votosGeralState.reduce((s, v) => s + v.total_votos, 0)
  const categoriaInfo = categorias.find(c => c.id === categoriaAtiva)

  if (mostrarSugerir) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button
          onClick={() => setMostrarSugerir(false)}
          className="text-sm text-zinc-500 hover:text-white transition-colors mb-6 flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar ao ranking
        </button>
        <ContatoSugestao />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Ranking de IAs no Direito</h1>
          <p className="text-sm text-zinc-500 mt-1">
            As melhores IAs e ferramentas avaliadas por profissionais jurídicos brasileiros
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-600">
            {ferramentas.length} ferramentas · {totalVotos} votos
          </span>
          <button
            onClick={() => setMostrarSugerir(true)}
            className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
          >
            Sugerir ferramenta
          </button>
        </div>
      </div>

      {/* Dropdown explicativo */}
      <div className="mb-6 border border-zinc-800 rounded-xl overflow-hidden">
        <button
          onClick={() => setMostrarExplicacao(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-900/40 transition-colors"
        >
          <span className="text-sm text-zinc-400">
            Entenda a diferença entre <span className="text-white font-medium">modelos de IA</span> e <span className="text-white font-medium">ferramentas que usam IA</span>
          </span>
          <svg
            className={`w-4 h-4 text-zinc-500 transition-transform shrink-0 ml-3 ${mostrarExplicacao ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {mostrarExplicacao && (
          <div className="px-4 pb-4 pt-1 border-t border-zinc-800/60 grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/15">
              <p className="text-sm font-semibold text-violet-300 mb-1.5">Modelos de IA</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                São os &ldquo;cérebros&rdquo; — softwares que processam linguagem e geram texto. Você interage com eles diretamente por um chat. Exemplos: <span className="text-zinc-300">ChatGPT, Claude, Gemini, Copilot</span>. Você escreve uma instrução e eles respondem. O modelo em si não faz nada além de texto — é a base de tudo.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/15">
              <p className="text-sm font-semibold text-blue-300 mb-1.5">Ferramentas que usam IA</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                São aplicativos construídos <em>por cima</em> de um modelo de IA, com funcionalidades específicas. Exemplos: <span className="text-zinc-300">Clio, Harvey, Detach Legal</span>. Elas conectam o modelo à sua rotina — gerenciam documentos, integram com processos, automatizam tarefas. Costumam ter assinatura paga.
              </p>
            </div>
            <div className="sm:col-span-2 px-1">
              <p className="text-xs text-zinc-600 leading-relaxed">
                Em resumo: o modelo é como o motor de um carro. A ferramenta é o carro inteiro — com painel, GPS e conforto. Para começar, os modelos gratuitos (ChatGPT ou Claude) já são suficientes. As ferramentas fazem sentido quando você tem um fluxo de trabalho repetitivo que pode ser automatizado.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-8 flex-col lg:flex-row">
        {/* Sidebar — filtros */}
        <aside className="lg:w-56 shrink-0 space-y-6">
          {/* Eixo de filtro */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Filtrar por</p>
            <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg">
              <button
                onClick={() => handleEixo('perfil')}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${eixo === 'perfil' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Perfil profissional
              </button>
              <button
                onClick={() => handleEixo('uso')}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${eixo === 'uso' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Tipo de uso
              </button>
            </div>
          </div>

          {/* Lista de categorias */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              {eixo === 'perfil' ? 'Perfil' : 'Uso'}
            </p>
            <div className="space-y-1">
              {(eixo === 'perfil' ? perfis : usos).map(cat => {
                const totalNaCat = votosGeralState
                  .filter(v => v.categoria_uso_id === cat.id)
                  .reduce((s, v) => s + v.total_votos, 0)
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategoriaAtiva(cat.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
                      categoriaAtiva === cat.id
                        ? 'bg-zinc-800 text-white font-medium'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/60'
                    }`}
                  >
                    <span>{cat.nome}</span>
                    {totalNaCat > 0 && (
                      <span className="text-xs text-zinc-600 tabular-nums">{totalNaCat}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Período */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Período</p>
            <div className="space-y-1">
              {([
                { value: 'geral',  label: 'Ranking geral' },
                { value: 'mes',    label: 'Últimos 30 dias' },
                { value: 'semana', label: 'Últimos 7 dias' },
              ] as { value: Periodo; label: string }[]).map(p => (
                <button
                  key={p.value}
                  onClick={() => setPeriodo(p.value)}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
                    periodo === p.value
                      ? 'bg-zinc-800 text-white font-medium'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/60'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {periodo !== 'geral' && (
              <p className="text-xs text-zinc-600 mt-2 px-1 leading-relaxed">
                Votar só altera o ranking geral. Os rankings de semana e mês refletem votos recentes.
              </p>
            )}
          </div>
        </aside>

        {/* Conteúdo principal */}
        <div className="flex-1 min-w-0">
          {/* Subtítulo da categoria + toggle modelo/ferramenta */}
          <div className="mb-5 flex items-start justify-between flex-wrap gap-3">
            <div>
              {categoriaInfo && (
                <>
                  <h2 className="text-lg font-bold text-white">{categoriaInfo.nome}</h2>
                  {categoriaInfo.descricao && (
                    <p className="text-sm text-zinc-500 mt-0.5">{categoriaInfo.descricao}</p>
                  )}
                </>
              )}
            </div>
            <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg shrink-0">
              <button
                onClick={() => setGrupoAtivo('modelo')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  grupoAtivo === 'modelo' ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Modelos de IA
              </button>
              <button
                onClick={() => setGrupoAtivo('ferramenta')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  grupoAtivo === 'ferramenta' ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Ferramentas
              </button>
            </div>
          </div>

          {/* Badge de período */}
          {periodo !== 'geral' && (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full border border-zinc-700 text-zinc-400 bg-zinc-900">
                {periodo === 'semana' ? 'Últimos 7 dias' : 'Últimos 30 dias'}
              </span>
              <span className="text-xs text-zinc-600">— votos recebidos nesse período</span>
            </div>
          )}

          {!userId && (
            <div className="mb-4 px-4 py-3 rounded-lg border border-zinc-800 bg-zinc-900/30 flex items-center justify-between gap-3">
              <p className="text-xs text-zinc-500">
                Vote nos melhores {grupoAtivo === 'modelo' ? 'modelos de IA' : 'ferramentas'} para o seu perfil
              </p>
              <Link href="/login" className="text-xs text-green-400 hover:underline flex-shrink-0">
                Entrar para votar
              </Link>
            </div>
          )}

          {userId && periodo !== 'geral' && (
            <div className="mb-4 px-4 py-3 rounded-lg border border-zinc-800/50 bg-zinc-900/20 flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-zinc-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-zinc-600">Para votar, volte ao ranking geral</p>
            </div>
          )}

          {/* Lista rankeada */}
          <div className="space-y-3">
            {rankingAtual.map((f, i) => {
              const jaVotou = meusVotos.some(v => v.ferramenta_id === f.id && v.categoria_uso_id === categoriaAtiva)
              const maxVotos = rankingAtual[0]?.votos_cat ?? 0
              const pct = maxVotos > 0 ? (f.votos_cat / maxVotos) * 100 : 0
              const temVotos = f.votos_cat > 0

              return (
                <div
                  key={f.id}
                  className={`p-4 rounded-xl border transition-all ${
                    i === 0 && temVotos
                      ? 'border-yellow-500/20 bg-yellow-500/5'
                      : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Posição */}
                    <div className="w-8 text-center flex-shrink-0 pt-1">
                      {temVotos ? (
                        <span className={`text-lg font-black ${
                          i === 0 ? 'text-yellow-400' :
                          i === 1 ? 'text-zinc-300' :
                          i === 2 ? 'text-amber-600' :
                          'text-zinc-700'
                        }`}>
                          {i + 1}
                        </span>
                      ) : (
                        <span className="text-zinc-800 text-lg font-black">—</span>
                      )}
                    </div>

                    {/* Ícone */}
                    <FerramIcon nome={f.nome} tipo={f.tipo} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-semibold text-white">{f.nome}</p>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] border ${TIPO_COLOR[f.tipo]}`}>
                          {TIPO_LABELS[f.tipo]}
                        </span>
                        {f.destaque && (
                          <span className="text-xs text-zinc-500 font-medium">Destaque</span>
                        )}
                      </div>

                      {f.descricao && (
                        <p className="text-xs text-zinc-500 line-clamp-2 mb-2">{f.descricao}</p>
                      )}

                      {temVotos && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-green-500/70 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-zinc-600 flex-shrink-0 tabular-nums w-20 text-right">
                            {f.votos_cat} {f.votos_cat === 1 ? 'voto' : 'votos'}
                          </span>
                        </div>
                      )}

                      {f.url && (
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                          onClick={e => e.stopPropagation()}
                        >
                          {f.url.replace(/^https?:\/\//, '').replace(/\/$/, '')} ↗
                        </a>
                      )}
                    </div>

                    {/* Botão de voto */}
                    <button
                      onClick={() => handleVoto(f.id)}
                      disabled={!userId || periodo !== 'geral'}
                      title={
                        !userId ? 'Entre para votar'
                        : periodo !== 'geral' ? 'Votar só no ranking geral'
                        : jaVotou ? 'Remover voto'
                        : 'Votar'
                      }
                      className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg border transition-all min-w-[48px] ${
                        jaVotou && periodo === 'geral'
                          ? 'border-green-500/40 bg-green-500/10 text-green-400'
                          : userId && periodo === 'geral'
                            ? 'border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-white'
                            : 'border-zinc-800 text-zinc-700 cursor-not-allowed'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill={jaVotou && periodo === 'geral' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      <span className="text-xs font-semibold tabular-nums">{f.votos_cat}</span>
                    </button>
                  </div>
                </div>
              )
            })}

            {rankingAtual.length === 0 && (
              <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
                <p className="text-zinc-500 text-sm">
                  Nenhum{grupoAtivo === 'modelo' ? ' modelo de IA' : 'a ferramenta'} cadastrado ainda.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FerramIcon({ nome, tipo }: { nome: string; tipo: string }) {
  const bgMap: Record<string, string> = {
    llm:        'bg-violet-500/15 border-violet-500/20 text-violet-300',
    app:        'bg-blue-500/15 border-blue-500/20 text-blue-300',
    extensao:   'bg-amber-500/15 border-amber-500/20 text-amber-300',
    plataforma: 'bg-green-500/15 border-green-500/20 text-green-300',
    outro:      'bg-zinc-800 border-zinc-700 text-zinc-400',
  }
  return (
    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 font-bold text-sm ${bgMap[tipo] ?? bgMap.outro}`}>
      {nome[0]?.toUpperCase()}
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
          Apenas ferramentas avaliadas pela equipe são incluídas.
        </p>
      </div>

      <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-3">
        <p className="text-sm font-medium text-white">Você representa uma empresa com uma ferramenta de IA para o mundo jurídico?</p>
        <p className="text-sm text-zinc-500 leading-relaxed">
          Entre em contato pelo e-mail abaixo para solicitar a inclusão no ranking. Nossa equipe avalia a ferramenta e, se aprovada, ela é adicionada com uma descrição imparcial para que os usuários possam votar.
        </p>
        <a
          href="mailto:contato@midori.law"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          contato@midori.law
        </a>
      </div>

      <div className="p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/20">
        <p className="text-xs text-zinc-600 leading-relaxed">
          Somos uma plataforma independente. A inclusão no ranking não é paga e não representa endosso comercial. A posição de cada ferramenta é determinada exclusivamente pelos votos da comunidade de profissionais do direito.
        </p>
      </div>
    </div>
  )
}
