'use client'

import Link from 'next/link'

interface UsuarioRanking {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  instituicao: string | null
  total: number
}

interface Props {
  topAprovados: UsuarioRanking[]
  topDestaques: UsuarioRanking[]
  topVotados: UsuarioRanking[]
  topPublicadores: UsuarioRanking[]
}

function Avatar({ u }: { u: UsuarioRanking }) {
  const nome = u.full_name ?? u.email ?? '?'
  const inicial = nome[0]?.toUpperCase()
  if (u.avatar_url) {
    return (
      <img
        src={u.avatar_url}
        alt={nome}
        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
      />
    )
  }
  return (
    <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
      <span className="text-sm font-bold text-zinc-300">{inicial}</span>
    </div>
  )
}

function RankingCard({
  titulo,
  descricao,
  usuarios,
  unidade,
  accentClass,
  iconPath,
}: {
  titulo: string
  descricao: string
  usuarios: UsuarioRanking[]
  unidade: string
  accentClass: string
  iconPath: React.ReactNode
}) {
  if (usuarios.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40">
        <h3 className="font-bold text-white text-sm mb-1">{titulo}</h3>
        <p className="text-xs text-zinc-500 italic">Nenhum dado disponível ainda.</p>
      </div>
    )
  }

  return (
    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40">
      <div className="flex items-start gap-3 mb-5">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${accentClass}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {iconPath}
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-white text-sm">{titulo}</h3>
          <p className="text-xs text-zinc-500 mt-0.5">{descricao}</p>
        </div>
      </div>

      <div className="space-y-3">
        {usuarios.map((u, i) => {
          const nome = u.full_name ?? u.email ?? 'Usuário'
          return (
            <Link
              key={u.id}
              href={`/u/${u.id}`}
              className="group flex items-center gap-3 p-3 rounded-xl border border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all"
            >
              {/* Posição */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border ${
                i === 0 ? 'bg-yellow-500 border-yellow-400 text-zinc-950' :
                i === 1 ? 'bg-zinc-400 border-zinc-300 text-zinc-950' :
                i === 2 ? 'bg-amber-700 border-amber-600 text-white' :
                'bg-zinc-800 border-zinc-700 text-zinc-500'
              }`}>
                {i + 1}
              </div>

              <Avatar u={u} />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white group-hover:text-green-300 transition-colors truncate">
                  {nome}
                </p>
                {u.instituicao && (
                  <p className="text-xs text-zinc-500 truncate">{u.instituicao}</p>
                )}
              </div>

              <div className="flex-shrink-0 text-right">
                <span className={`text-sm font-bold tabular-nums ${accentClass.split(' ')[0]}`}>{u.total}</span>
                <p className="text-xs text-zinc-600">{unidade}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function UsuariosDestaqueContent({ topAprovados, topDestaques, topVotados, topPublicadores }: Props) {
  const vazio = topAprovados.length === 0 && topDestaques.length === 0 && topVotados.length === 0 && topPublicadores.length === 0

  if (vazio) {
    return (
      <div className="text-center py-24 border border-dashed border-zinc-800 rounded-2xl">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p className="text-zinc-400 font-medium mb-1">Nenhum dado disponível ainda</p>
        <p className="text-zinc-600 text-sm">Os rankings serão exibidos conforme a comunidade cresce.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-zinc-800">
        <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Usuários Destaque</h2>
          <p className="text-xs text-zinc-500">Top 5 por categoria — atualizado em tempo real</p>
        </div>
      </div>

      {/* Grid 2x2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RankingCard
          titulo="Mais prompts aprovados"
          descricao="Usuários com maior número de prompts publicados e aprovados"
          usuarios={topAprovados}
          unidade="aprovados"
          accentClass="text-green-400 bg-green-500/10 border-green-500/20"
          iconPath={
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          }
        />

        <RankingCard
          titulo="Mais selos de destaque"
          descricao="Usuários com mais prompts marcados como destaque pelos administradores"
          usuarios={topDestaques}
          unidade="destaques"
          accentClass="text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
          iconPath={
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          }
        />

        <RankingCard
          titulo="Mais curtidas recebidas"
          descricao="Usuários cujos prompts acumularam mais curtidas da comunidade"
          usuarios={topVotados}
          unidade="curtidas"
          accentClass="text-teal-400 bg-teal-500/10 border-teal-500/20"
          iconPath={
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          }
        />

        <RankingCard
          titulo="Mais ativos na semana"
          descricao="Usuários que mais publicaram prompts nos últimos 7 dias"
          usuarios={topPublicadores}
          unidade="publicados"
          accentClass="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
          iconPath={
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          }
        />
      </div>
    </div>
  )
}
