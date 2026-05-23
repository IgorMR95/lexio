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
  topGeral: UsuarioRanking[]
  topPrompts: UsuarioRanking[]
  topSkills: UsuarioRanking[]
}

function Avatar({ u }: { u: UsuarioRanking }) {
  const nome = u.full_name ?? u.email ?? '?'
  if (u.avatar_url) {
    return <img src={u.avatar_url} alt={nome} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
  }
  return (
    <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
      <span className="text-sm font-bold text-zinc-300">{nome[0]?.toUpperCase()}</span>
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
                <p className="text-sm font-semibold text-white group-hover:text-green-300 transition-colors truncate">{nome}</p>
                {u.instituicao && <p className="text-xs text-zinc-500 truncate">{u.instituicao}</p>}
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

export function UsuariosDestaqueContent({ topGeral, topPrompts, topSkills }: Props) {
  const vazio = topGeral.length === 0 && topPrompts.length === 0 && topSkills.length === 0

  if (vazio) {
    return (
      <div className="text-center py-24 border border-dashed border-zinc-800 rounded-2xl">
        <p className="text-zinc-400 font-medium mb-1">Nenhum dado disponível ainda</p>
        <p className="text-zinc-600 text-sm">Os rankings serão exibidos conforme a comunidade cresce.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 pb-2 border-b border-zinc-800">
        <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Especialistas em IA Jurídica</h2>
          <p className="text-xs text-zinc-500">Rankings por contribuição — prompts, skills e votos recebidos dos pares</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <RankingCard
          titulo="Maiores especialistas em IA Jurídica"
          descricao="Soma de prompts + skills publicados, ponderada por votos recebidos"
          usuarios={topGeral}
          unidade="votos totais"
          accentClass="text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
          iconPath={
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          }
        />

        <RankingCard
          titulo="Maiores especialistas em Prompts"
          descricao="Usuários com maior número de prompts jurídicos publicados e aprovados"
          usuarios={topPrompts}
          unidade="prompts"
          accentClass="text-green-400 bg-green-500/10 border-green-500/20"
          iconPath={
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          }
        />

        <RankingCard
          titulo="Maiores especialistas em Skills MD"
          descricao="Usuários com maior número de skills de automação jurídica publicadas"
          usuarios={topSkills}
          unidade="skills"
          accentClass="text-blue-400 bg-blue-500/10 border-blue-500/20"
          iconPath={
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          }
        />
      </div>
    </div>
  )
}
