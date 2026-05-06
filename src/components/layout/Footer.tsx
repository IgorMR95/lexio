import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <span className="text-lg font-bold text-white">midori</span>
            <p className="mt-2 text-sm text-zinc-500">
              A base de prompts jurídicos para profissionais e acadêmicos do direito.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-3">Produto</h3>
            <ul className="space-y-2">
              <li><Link href="/prompts" className="text-sm text-zinc-500 hover:text-white transition-colors">Base de Prompts</Link></li>
              <li><Link href="/academy" className="text-sm text-zinc-500 hover:text-white transition-colors">Academy</Link></li>
              <li><Link href="/faq" className="text-sm text-zinc-500 hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-3">Conta</h3>
            <ul className="space-y-2">
              <li><Link href="/login" className="text-sm text-zinc-500 hover:text-white transition-colors">Entrar</Link></li>
              <li><Link href="/signup" className="text-sm text-zinc-500 hover:text-white transition-colors">Criar conta</Link></li>
              <li><Link href="/dashboard" className="text-sm text-zinc-500 hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-3">Áreas</h3>
            <ul className="space-y-2">
              <li><Link href="/prompts?area=civil" className="text-sm text-zinc-500 hover:text-white transition-colors">Direito Civil</Link></li>
              <li><Link href="/prompts?area=penal" className="text-sm text-zinc-500 hover:text-white transition-colors">Direito Penal</Link></li>
              <li><Link href="/prompts?area=trabalho" className="text-sm text-zinc-500 hover:text-white transition-colors">Direito do Trabalho</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-zinc-800 flex items-center justify-between">
          <p className="text-xs text-zinc-600">© 2026 Lexio. Todos os direitos reservados.</p>
          <p className="text-xs text-zinc-600">Feito para juristas</p>
        </div>
      </div>
    </footer>
  )
}
