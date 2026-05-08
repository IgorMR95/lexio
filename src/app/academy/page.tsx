const modules = [
  {
    categoria: 'Fundamentos',
    cursos: [
      { titulo: 'Introdução ao uso de IA no Direito', descricao: 'Como usar ChatGPT, Claude e Gemini no dia a dia jurídico. Boas práticas e limitações.', duracao: '1h 20min', nivel: 'Iniciante' },
      { titulo: 'Prompts básicos para advogados', descricao: 'Aprenda a formular prompts eficazes para petições, contratos e consultas jurídicas.', duracao: '45min', nivel: 'Iniciante' },
    ],
  },
  {
    categoria: 'Prática Profissional',
    cursos: [
      { titulo: 'Petições com IA: do esboço à versão final', descricao: 'Como usar prompts para acelerar a redação de peças processuais mantendo qualidade técnica.', duracao: '2h 10min', nivel: 'Intermediário' },
      { titulo: 'Análise de contratos com IA', descricao: 'Prompts para identificar riscos, cláusulas abusivas e oportunidades de negociação.', duracao: '1h 30min', nivel: 'Intermediário' },
      { titulo: 'Pesquisa jurisprudencial com IA', descricao: 'Como usar IA para encontrar e analisar jurisprudência do STF, STJ e tribunais estaduais.', duracao: '1h', nivel: 'Intermediário' },
    ],
  },
  {
    categoria: 'Academia e Pesquisa',
    cursos: [
      { titulo: 'Escrita acadêmica jurídica com IA', descricao: 'Do fichamento ao artigo científico: como usar IA para acelerar a produção acadêmica.', duracao: '2h', nivel: 'Avançado' },
      { titulo: 'Monografias e TCC com apoio de IA', descricao: 'Estrutura, pesquisa bibliográfica e desenvolvimento de tese com ferramentas de IA.', duracao: '3h', nivel: 'Avançado' },
    ],
  },
]

const levelColor: Record<string, string> = {
  'Iniciante': 'text-green-400 bg-green-500/10 border-green-500/20',
  'Intermediário': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'Avançado': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
}

export default function AcademyPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <span className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">Em breve</span>
        <h1 className="text-3xl font-bold text-white mt-4 mb-3">Midori Academy</h1>
        <p className="text-zinc-500 max-w-xl mx-auto">
          Cursos e tutoriais sobre o uso de inteligência artificial no direito.
          Para advogados, magistrados, defensores e acadêmicos.
        </p>
      </div>

      <div className="space-y-10">
        {modules.map(mod => (
          <div key={mod.categoria}>
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">{mod.categoria}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mod.cursos.map(curso => (
                <div key={curso.titulo} className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30 relative overflow-hidden">
                  <div className="absolute top-3 right-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${levelColor[curso.nivel]}`}>
                      {curso.nivel}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-2 pr-20">{curso.titulo}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed mb-3">{curso.descricao}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-600 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {curso.duracao}
                    </span>
                    <span className="text-xs text-zinc-700">Em breve</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-14 p-8 rounded-2xl border border-zinc-800 bg-zinc-900/30 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Quer ser notificado quando lançarmos?</h2>
        <p className="text-zinc-500 text-sm mb-5">Crie sua conta gratuita e fique por dentro de todas as novidades do Midori Academy.</p>
        <a href="/signup" className="inline-block px-6 py-2.5 rounded-lg bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors">
          Criar conta grátis
        </a>
      </div>
    </div>
  )
}
