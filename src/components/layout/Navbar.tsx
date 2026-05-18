'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/supabase/types'
import { NotificacoesBell } from '@/components/ui/NotificacoesBell'

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [baseOpen, setBaseOpen] = useState(false)
  const [notificacoes, setNotificacoes] = useState<any[]>([])
  const [naoLidas, setNaoLidas] = useState(0)
  const supabase = createClient()
  const baseRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        supabase.from('profiles').select('*').eq('id', data.user.id).single()
          .then(({ data: p }) => setProfile(p))
        fetchNotificacoes(data.user.id)
      }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single()
          .then(({ data: p }) => setProfile(p))
        fetchNotificacoes(session.user.id)
      } else {
        setProfile(null)
        setNotificacoes([])
        setNaoLidas(0)
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (baseRef.current && !baseRef.current.contains(e.target as Node)) {
        setBaseOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function fetchNotificacoes(userId: string) {
    const { data } = await (supabase as any)
      .from('notificacoes')
      .select('id, tipo, lida, created_at, ator_id, prompt_id, prompts(id, titulo), ator:ator_id(full_name, email)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) {
      setNotificacoes(data)
      setNaoLidas(data.filter((n: any) => !n.lida).length)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isAdmin = profile?.role === 'admin'
  const isBaseActive = pathname.startsWith('/prompts') || pathname.startsWith('/skills')

  const otherLinks = [
    { href: '/academy', label: 'Academy' },
    { href: '/faq', label: 'FAQ' },
    ...(user ? [{ href: '/perfil', label: 'Perfil' }] : []),
    ...(user ? [{ href: '/alimentacao', label: 'Alimentação' }] : []),
    ...(isAdmin ? [{ href: '/gestao', label: 'Gestão' }] : []),
  ]

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">midori</span>
            <span className="text-xs text-zinc-500 hidden sm:block">prompts jurídicos</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {/* Base de Conhecimento dropdown */}
            <div ref={baseRef} className="relative">
              <button
                onClick={() => setBaseOpen(o => !o)}
                className={`flex items-center gap-1 text-sm transition-colors ${isBaseActive ? 'text-white font-medium' : 'text-zinc-400 hover:text-white'}`}
              >
                Base de Conhecimento
                <svg className={`w-3.5 h-3.5 transition-transform ${baseOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {baseOpen && (
                <div className="absolute left-0 top-8 w-64 rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50 overflow-hidden z-50">
                  <div className="p-1.5">
                    <Link
                      href="/prompts"
                      onClick={() => setBaseOpen(false)}
                      className={`flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-900 transition-colors group ${pathname.startsWith('/prompts') ? 'bg-zinc-900' : ''}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Base de Prompts</p>
                        <p className="text-xs text-zinc-500 mt-0.5">Prompts prontos para uso jurídico</p>
                      </div>
                    </Link>
                    <Link
                      href="/skills"
                      onClick={() => setBaseOpen(false)}
                      className={`flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-900 transition-colors group ${pathname.startsWith('/skills') ? 'bg-zinc-900' : ''}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Skills MD</p>
                        <p className="text-xs text-zinc-500 mt-0.5">Arquivos .md para Claude Code e assistentes</p>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {otherLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors ${pathname.startsWith(link.href) ? 'text-white font-medium' : 'text-zinc-400 hover:text-white'}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {isAdmin ? (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-medium">Admin</span>
                ) : (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 font-medium">Usuário</span>
                )}
                <NotificacoesBell notificacoes={notificacoes} naoLidas={naoLidas} />
                <button onClick={handleLogout} className="text-sm px-3 py-1.5 rounded-md border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors">
                  Sair
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">Entrar</Link>
                <Link href="/signup" className="text-sm px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-500 text-white font-medium transition-colors">Criar conta</Link>
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

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-zinc-800 py-3 flex flex-col gap-1">
            <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider px-1 py-1.5">Base de Conhecimento</p>
            <Link href="/prompts" onClick={() => setMenuOpen(false)} className={`text-sm py-2 px-2 rounded-lg transition-colors ${pathname.startsWith('/prompts') ? 'text-white bg-zinc-900' : 'text-zinc-400 hover:text-white'}`}>
              Base de Prompts
            </Link>
            <Link href="/skills" onClick={() => setMenuOpen(false)} className={`text-sm py-2 px-2 rounded-lg transition-colors ${pathname.startsWith('/skills') ? 'text-white bg-zinc-900' : 'text-zinc-400 hover:text-white'}`}>
              Skills MD
            </Link>
            <div className="border-t border-zinc-800/50 my-1" />
            {otherLinks.map(link => (
              <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className={`text-sm py-2 px-2 rounded-lg transition-colors ${pathname.startsWith(link.href) ? 'text-white bg-zinc-900' : 'text-zinc-400 hover:text-white'}`}>
                {link.label}
              </Link>
            ))}
            {user && (
              <div className="pt-2 border-t border-zinc-800 mt-1">
                {isAdmin
                  ? <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-medium">Admin</span>
                  : <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 font-medium">Usuário</span>
                }
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
