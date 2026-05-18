'use client'

import { useState } from 'react'

const sections = [
  {
    titulo: 'Sobre o Midori',
    faqs: [
      {
        q: 'O que é o Midori?',
        a: 'O Midori é uma plataforma criada por e para juristas brasileiros. Aqui você encontra prompts prontos — textos de instrução que você cola em uma IA para obter respostas melhores e mais específicas para o seu trabalho jurídico. Em vez de gastar tempo tentando descobrir como "falar" com a IA, você parte de um ponto já testado por colegas da mesma área.',
      },
      {
        q: 'Quem criou o Midori?',
        a: 'O Midori nasceu da percepção de que a maioria das ferramentas de IA é genérica demais para o trabalho jurídico. A plataforma foi construída por profissionais do direito que também trabalham com tecnologia, com o objetivo de criar um espaço colaborativo onde a comunidade jurídica compartilha o que funciona na prática — não na teoria.',
      },
      {
        q: 'Para quem é o Midori?',
        a: 'Para qualquer profissional do direito: advogados (públicos e privados), magistrados, promotores, defensores públicos, juristas acadêmicos e estudantes avançados. O conteúdo é organizado por perfil profissional, área do direito e nível de atuação — você encontra o que é relevante para o seu trabalho, não um repositório genérico.',
      },
      {
        q: 'Preciso pagar para usar?',
        a: 'Não. O Midori é gratuito. Você pode navegar e copiar qualquer prompt sem criar conta. A conta gratuita é necessária apenas se você quiser enviar seus próprios prompts ou interagir com a comunidade.',
      },
    ],
  },
  {
    titulo: 'O que é inteligência artificial e como funciona',
    faqs: [
      {
        q: 'O que é inteligência artificial (IA)?',
        a: 'Inteligência artificial é um software que aprendeu a processar e gerar texto lendo uma quantidade enorme de documentos — livros, artigos, legislação, jurisprudência, entre outros. Quando você escreve uma pergunta para ela, ela tenta gerar a resposta mais útil com base em tudo que aprendeu. Não é um buscador como o Google: ela cria a resposta no momento, a partir da sua instrução.',
      },
      {
        q: 'Quais ferramentas de IA posso usar com os prompts do Midori?',
        a: 'Os prompts funcionam com as principais ferramentas disponíveis: ChatGPT (OpenAI), Claude (Anthropic), Gemini (Google) e outras. Para usar, basta abrir qualquer uma dessas plataformas no seu navegador, copiar o prompt, colar na caixa de texto e enviar. Você não precisa instalar nada.',
      },
      {
        q: 'A IA sabe direito? Posso confiar no que ela responde?',
        a: 'A IA conhece muito sobre direito, mas não é infalível. Ela pode citar jurisprudência incorretamente, confundir datas ou distorcer detalhes de legislação. Por isso, os prompts do Midori são construídos para que a IA entregue uma estrutura sólida de raciocínio, não uma resposta para ser usada sem revisão. Pense nela como um assistente de pesquisa muito rápido — que você, como profissional, ainda precisa revisar antes de assinar.',
      },
      {
        q: 'A IA tem acesso aos meus documentos e processos?',
        a: 'Não automaticamente. Quando você usa ChatGPT, Claude ou Gemini, a IA só "vê" o que você digita ou cola na conversa. Se quiser que ela analise um documento, você precisa copiá-lo para o chat ou fazer upload diretamente na plataforma. Cada conversa começa do zero — ela não guarda o que você digitou antes, a menos que você esteja na mesma janela de conversa.',
      },
      {
        q: 'Existe risco de confidencialidade ao usar IA no trabalho jurídico?',
        a: 'Sim, e é um ponto importante. Dados que você cola em uma IA podem ser usados para treinar versões futuras do modelo, dependendo das configurações da plataforma. Para informações sigilosas de clientes, o recomendado é usar versões corporativas com contratos de privacidade (como o ChatGPT Enterprise ou o Claude for Business) ou anonimizar os dados antes de enviá-los. Nunca cole nome de cliente, número de processo ou dados sensíveis em uma IA gratuita sem verificar os termos de uso.',
      },
    ],
  },
  {
    titulo: 'O que são prompts e como usar',
    faqs: [
      {
        q: 'O que é um "prompt"?',
        a: 'Prompt é o texto que você digita para a IA. Quanto mais claro e detalhado ele é, melhor é a resposta. Um prompt ruim seria: "Me ajude com um contrato". Um prompt bom seria: "Você é um advogado especializado em direito imobiliário. Analise o contrato abaixo e identifique cláusulas que possam ser questionadas em caso de rescisão unilateral pelo comprador, listando cada uma com o risco correspondente e a fundamentação legal aplicável." Os prompts do Midori já vêm nesse formato detalhado — você só precisa copiar e adaptar.',
      },
      {
        q: 'Como uso um prompt do Midori?',
        a: '1. Encontre um prompt adequado para o que você precisa. 2. Clique em "Copiar prompt" ou use o botão de acesso direto ao Claude ou ChatGPT. 3. Se o prompt tiver campos entre colchetes, como [nome da parte] ou [área do direito], substitua pelo texto real do seu caso. 4. Cole na IA e envie. Normalmente a primeira resposta já é utilizável — se quiser refinar, você pode pedir ajustes na mesma conversa.',
      },
      {
        q: 'O que significa "Abrir no Claude" ou "Abrir no ChatGPT"?',
        a: 'São atalhos que abrem a ferramenta de IA já com o prompt copiado, para que você só precise colar e enviar. O Claude é feito pela Anthropic e tende a se destacar em textos jurídicos longos e raciocínio detalhado. O ChatGPT é feito pela OpenAI e é o mais conhecido. Ambos têm versões gratuitas com pequenas limitações de uso diário.',
      },
      {
        q: 'Os prompts funcionam em qualquer área do direito?',
        a: 'O Midori tem prompts organizados por área (Civil, Penal, Trabalhista, Tributário, Administrativo e outras) e por perfil profissional. Use os filtros na Base de Prompts para encontrar o que é mais relevante para seu trabalho. Se não encontrar um prompt específico para o que precisa, você pode adaptar um próximo ou enviar o seu próprio.',
      },
    ],
  },
  {
    titulo: 'Curadoria e qualidade',
    faqs: [
      {
        q: 'Como é garantida a qualidade dos prompts?',
        a: 'Todo prompt enviado passa por revisão antes de ser publicado. A equipe editorial verifica se o prompt é realmente útil na prática jurídica, se está bem estruturado e se entrega resultados confiáveis. Apenas prompts aprovados aparecem na base pública. Prompts com muitos votos positivos da comunidade também recebem destaque — é a própria comunidade jurídica sinalizando o que funciona.',
      },
      {
        q: 'Quem pode enviar prompts?',
        a: 'Qualquer usuário com conta ativa pode enviar. O prompt passa por revisão antes de ser publicado. Priorizamos contribuições de profissionais com experiência prática na área — quanto mais específico e testado for o prompt, maior a chance de aprovação.',
      },
      {
        q: 'Por que alguns prompts têm um "destaque"?',
        a: 'Prompts marcados como destaque foram identificados pela curadoria editorial como especialmente úteis, bem construídos e validados na prática. É um sinal de que aquele prompt já passou por mais testes e costuma gerar bons resultados.',
      },
      {
        q: 'Posso usar os prompts comercialmente?',
        a: 'Sim. Os prompts são de uso livre para qualquer finalidade profissional ou acadêmica. O Midori é uma plataforma colaborativa mantida pela comunidade jurídica.',
      },
    ],
  },
  {
    titulo: 'Conta e participação',
    faqs: [
      {
        q: 'Preciso criar uma conta para usar?',
        a: 'Não para navegar e copiar prompts — isso é livre. A conta é necessária para enviar seus próprios prompts, votar, comentar e acompanhar outros contribuidores.',
      },
      {
        q: 'Como envio um prompt?',
        a: 'Crie uma conta gratuita, acesse o Dashboard e clique em "Novo prompt". Preencha o formulário com título, texto completo, categoria e área do direito. O prompt será revisado pela curadoria antes de ser publicado. Você recebe uma notificação quando for aprovado.',
      },
      {
        q: 'O que são as Skills MD?',
        a: 'Skills MD são arquivos de instrução mais completos, usados com ferramentas avançadas como o Claude Code ou assistentes com memória persistente. Enquanto um prompt é uma instrução para uma tarefa específica, uma skill é mais parecida com um "manual de uso pessoal" — você configura como a IA deve se comportar com você de forma permanente. Para a maioria dos usuários, os prompts comuns são suficientes. As Skills MD são para quem já usa IA com frequência e quer um nível maior de personalização.',
      },
    ],
  },
]

export default function FAQPage() {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-white mb-3">Perguntas frequentes</h1>
        <p className="text-zinc-500">Tudo que você precisa saber sobre o Midori e sobre inteligência artificial no direito</p>
      </div>

      <div className="space-y-10">
        {sections.map((section) => (
          <div key={section.titulo}>
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 px-1">{section.titulo}</h2>
            <div className="space-y-2">
              {section.faqs.map((faq) => {
                const key = section.titulo + faq.q
                const isOpen = open === key
                return (
                  <div
                    key={faq.q}
                    className="border border-zinc-800 rounded-xl bg-zinc-900/30 overflow-hidden"
                  >
                    <button
                      className="w-full flex items-center justify-between px-5 py-4 text-left text-white font-medium text-sm hover:text-zinc-200 transition-colors"
                      onClick={() => setOpen(isOpen ? null : key)}
                    >
                      <span>{faq.q}</span>
                      <svg
                        className={`w-4 h-4 text-zinc-500 transition-transform shrink-0 ml-4 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/50 pt-4">
                        {faq.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 p-6 rounded-xl border border-zinc-800 bg-zinc-900/30 text-center">
        <p className="text-sm text-zinc-400 mb-1">Ainda tem dúvidas?</p>
        <p className="text-sm text-zinc-500">
          Entre em contato pelo{' '}
          <a href="mailto:contato@midori.law" className="text-green-400 hover:text-green-300 transition-colors">
            contato@midori.law
          </a>
        </p>
      </div>
    </div>
  )
}
