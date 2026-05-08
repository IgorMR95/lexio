'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/supabase/types'

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
          .then(({ data: p }) => setProfile(p))
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: p }) => setProfile(p))
      } else {
        setProfile(null)
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isAdmin = profile?.role === 'admin'

  const publicLinks = [
    { href: '/prompts', label: 'Base de Prompts' },
    { href: '/academy', label: 'Academy' },
    { href: '/faq', label: 'FAQ' },
  ]

  const privateLinks = user ? [
    { href: '/perfil', label: 'Perfil' },
    { href: '/alimentacao', label: 'Alimentação' },
    ...(isAdmin ? [{ href: '/gestao', label: 'Gestão' }] : []),
  ] : []

  const allLinks = [...publicLinks, ...privateLinks]

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-white">midori</span>
            <span className="text-xs text-zinc-500 hidden sm:block">prompts jurídicos</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {allLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors ${
                  pathname.startsWith(link.href)
                    ? 'text-white font-medium'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {isAdmin ? (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-medium">
                    Admin
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 font-medium">
                    Usuário
                  </span>
                )}
                <button
                  onClick={handleLogout}
                  className="text-sm px-3 py-1.5 rounded-md border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
                >
                  Sair
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
                  Entrar
                </Link>
                <Link
                  href="/signup"
                  className="text-sm px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-500 text-white font-medium transition-colors"
                >
                  Criar conta
                </Link>
              </div>
            )}

            <button className="md:hidden text-zinc-400 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-zinc-800 py-3 flex flex-col gap-2">
            {allLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-sm py-2 text-zinc-400 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <div className="pt-2 border-t border-zinc-800 mt-1">
                {isAdmin ? (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-medium">
                    Admin
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 font-medium">
                    Usuário
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
