'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function EsqueciSenhaPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/nova-senha`,
    })
    if (error) {
      setError('Não foi possível enviar o email. Verifique o endereço e tente novamente.')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-white">midori</Link>
          <p className="mt-2 text-sm text-zinc-500">Recuperar senha</p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5 text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-white font-medium mb-1">Email enviado</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Enviamos um link de recuperação para <span className="text-white">{email}</span>. Verifique sua caixa de entrada e a pasta de spam.
              </p>
            </div>
            <p className="text-center text-xs text-zinc-600">
              O link expira em 1 hora.
            </p>
            <Link href="/login" className="block w-full py-2.5 rounded-lg border border-zinc-700 text-zinc-300 text-sm text-center hover:border-zinc-500 hover:text-white transition-colors">
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-zinc-500 leading-relaxed">
              Digite seu email e enviaremos um link para você criar uma nova senha.
            </p>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-sm"
                placeholder="seu@email.com"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>

            <p className="text-center text-sm text-zinc-500">
              Lembrou a senha?{' '}
              <Link href="/login" className="text-white hover:underline">Entrar</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
