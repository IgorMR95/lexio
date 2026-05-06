'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Conta criada!</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Verifique seu email para confirmar a conta e depois faça login.
          </p>
          <Link href="/login" className="inline-block px-6 py-2.5 rounded-lg bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors">
            Ir para o login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-white">midori</Link>
          <p className="mt-2 text-sm text-zinc-500">Crie sua conta gratuita</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Nome completo</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-sm"
              placeholder="Dr. João Silva"
            />
          </div>
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
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-sm"
              placeholder="mínimo 6 caracteres"
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
            className="w-full py-2.5 rounded-lg bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors disabled:opacity-50"
          >
            {loading ? 'Criando conta...' : 'Criar conta grátis'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Já tem conta?{' '}
          <Link href="/login" className="text-white hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  )
}
