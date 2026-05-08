const faqs = [
  {
    q: 'O que é o Midori?',
    a: 'Midori é uma base de prompts de inteligência artificial especialmente desenvolvida para profissionais e acadêmicos do direito. Reúne prompts organizados por categoria profissional, área do direito e nível de atuação.',
  },
  {
    q: 'Preciso criar uma conta para usar?',
    a: 'Não. Qualquer pessoa pode navegar pela base de prompts e copiá-los sem criar conta. A conta é necessária apenas para enviar novos prompts.',
  },
  {
    q: 'Como envio um prompt?',
    a: 'Crie uma conta gratuita, acesse o Dashboard e clique em "Novo prompt". Preencha o formulário com título, texto completo, categoria e área do direito. O prompt será revisado antes de ser publicado.',
  },
  {
    q: 'Posso editar ou deletar meus prompts?',
    a: 'Apenas administradores podem editar e deletar prompts. Esta regra garante a qualidade e consistência do conteúdo da plataforma.',
  },
  {
    q: 'Como funciona a hierarquia de categorias?',
    a: 'Os prompts são organizados em: Categoria Principal (Profissionais / Acadêmicos) → Subcategoria (Advogados, Magistrados, Defensores, Promotores) → Subnível (Estaduais, Federais, Públicos, Privados...) → Área do Direito.',
  },
  {
    q: 'Como me tornar admin?',
    a: 'A promoção a admin é feita manualmente por outro administrador diretamente no banco de dados Supabase. Execute: UPDATE profiles SET role = \'admin\' WHERE email = \'seu@email.com\';',
  },
  {
    q: 'Os prompts são revisados?',
    a: 'Sim. Todo prompt enviado fica com status "pendente" até ser revisado e aprovado por um administrador. Isso garante a qualidade jurídica do conteúdo.',
  },
  {
    q: 'Posso usar os prompts comercialmente?',
    a: 'Os prompts são de uso livre para qualquer finalidade profissional ou acadêmica. O Midori é uma plataforma colaborativa mantida pela comunidade jurídica.',
  },
]

export default function FAQPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-white mb-3">Perguntas frequentes</h1>
        <p className="text-zinc-500">Tire suas dúvidas sobre o Midori</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <details key={i} className="group border border-zinc-800 rounded-xl bg-zinc-900/30 overflow-hidden">
            <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-white font-medium text-sm select-none hover:text-zinc-200 transition-colors">
              {faq.q}
              <svg className="w-4 h-4 text-zinc-500 group-open:rotate-180 transition-transform shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-5 pb-4 text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/50 pt-3">
              {faq.a}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
