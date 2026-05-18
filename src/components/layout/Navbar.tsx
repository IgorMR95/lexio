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
  const [perfilOpen, setPerfilOpen] = useState(false)
  const [notificacoes, setNotificacoes] = useState<any[]>([])
  const [naoLidas, setNaoLidas] = useState(0)
  const supabase = createClient()
  const baseRef = useRef<HTMLDivElement>(null)
  const perfilRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (baseRef.current && !baseRef.current.contains(e.target as Node)) {
        setBaseOpen(false)
      }
      if (perfilRef.current && !perfilRef.current.contains(e.target as Node)) {
        setPerfilOpen(false)
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
  const isPerfilActive = pathname.startsWith('/perfil') || pathname.startsWith('/alimentacao') || pathname === '/faq'

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
                onClick={() => { setBaseOpen(o => !o); setPerfilOpen(false) }}
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

            {/* Ranking de IAs Jurídicas */}
            <Link
              href="/ranking"
              className={`text-sm transition-colors ${pathname.startsWith('/ranking') ? 'text-white font-medium' : 'text-zinc-400 hover:text-white'}`}
            >
              Ranking de IAs Jurídicas
            </Link>

            {/* Academy */}
            <Link
              href="/academy"
              className={`text-sm transition-colors ${pathname.startsWith('/academy') ? 'text-white font-medium' : 'text-zinc-400 hover:text-white'}`}
            >
              Academy
            </Link>

            {/* Feed — só para usuários logados */}
            {user && (
              <Link
                href="/feed"
                className={`text-sm transition-colors ${pathname.startsWith('/feed') ? 'text-white font-medium' : 'text-zinc-400 hover:text-white'}`}
              >
                Feed
              </Link>
            )}

            {/* Perfil dropdown — só para usuários logados */}
            {user && (
              <div ref={perfilRef} className="relative">
                <button
                  onClick={() => { setPerfilOpen(o => !o); setBaseOpen(false) }}
                  className={`flex items-center gap-1 text-sm transition-colors ${isPerfilActive ? 'text-white font-medium' : 'text-zinc-400 hover:text-white'}`}
                >
                  Perfil
                  <svg className={`w-3.5 h-3.5 transition-transform ${perfilOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {perfilOpen && (
                  <div className="absolute right-0 top-8 w-52 rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50 overflow-hidden z-50">
                    <div className="p-1.5">
                      <Link
                        href="/perfil"
                        onClick={() => setPerfilOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-900 transition-colors text-sm ${pathname.startsWith('/perfil') ? 'bg-zinc-900 text-white' : 'text-zinc-300'}`}
                      >
                        <svg className="w-4 h-4 text-zinc-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Meu perfil
                      </Link>
                      <Link
                        href="/alimentacao"
                        onClick={() => setPerfilOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-900 transition-colors text-sm ${pathname.startsWith('/alimentacao') ? 'bg-zinc-900 text-white' : 'text-zinc-300'}`}
                      >
                        <svg className="w-4 h-4 text-zinc-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Alimentação
                      </Link>
                      <div className="my-1 border-t border-zinc-800/70" />
                      <Link
                        href="/faq"
                        onClick={() => setPerfilOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-900 transition-colors text-sm ${pathname === '/faq' ? 'bg-zinc-900 text-white' : 'text-zinc-300'}`}
                      >
                        <svg className="w-4 h-4 text-zinc-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        FAQ
                      </Link>
                      {isAdmin && (
                        <>
                          <div className="my-1 border-t border-zinc-800/70" />
                          <Link
                            href="/gestao"
                            onClick={() => setPerfilOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-900 transition-colors text-sm ${pathname.startsWith('/gestao') ? 'bg-zinc-900 text-white' : 'text-zinc-300'}`}
                          >
                            <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-green-400">Gestão</span>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Links para visitantes não logados */}
            {!user && (
              <Link
                href="/faq"
                className={`text-sm transition-colors ${pathname === '/faq' ? 'text-white font-medium' : 'text-zinc-400 hover:text-white'}`}
              >
                FAQ
              </Link>
            )}
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
            <Link href="/ranking" onClick={() => setMenuOpen(false)} className={`text-sm py-2 px-2 rounded-lg transition-colors ${pathname.startsWith('/ranking') ? 'text-white bg-zinc-900' : 'text-zinc-400 hover:text-white'}`}>
              Ranking de IAs Jurídicas
            </Link>
            <Link href="/academy" onClick={() => setMenuOpen(false)} className={`text-sm py-2 px-2 rounded-lg transition-colors ${pathname.startsWith('/academy') ? 'text-white bg-zinc-900' : 'text-zinc-400 hover:text-white'}`}>
              Academy
            </Link>
            {user && (
              <Link href="/feed" onClick={() => setMenuOpen(false)} className={`text-sm py-2 px-2 rounded-lg transition-colors ${pathname.startsWith('/feed') ? 'text-white bg-zinc-900' : 'text-zinc-400 hover:text-white'}`}>
                Feed
              </Link>
            )}
            {!user && (
              <Link href="/faq" onClick={() => setMenuOpen(false)} className={`text-sm py-2 px-2 rounded-lg transition-colors ${pathname === '/faq' ? 'text-white bg-zinc-900' : 'text-zinc-400 hover:text-white'}`}>
                FAQ
              </Link>
            )}
            {user && (
              <>
                <div className="border-t border-zinc-800/50 my-1" />
                <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider px-1 py-1.5">Perfil</p>
                <Link href="/perfil" onClick={() => setMenuOpen(false)} className={`text-sm py-2 px-2 rounded-lg transition-colors ${pathname.startsWith('/perfil') ? 'text-white bg-zinc-900' : 'text-zinc-400 hover:text-white'}`}>
                  Meu perfil
                </Link>
                <Link href="/alimentacao" onClick={() => setMenuOpen(false)} className={`text-sm py-2 px-2 rounded-lg transition-colors ${pathname.startsWith('/alimentacao') ? 'text-white bg-zinc-900' : 'text-zinc-400 hover:text-white'}`}>
                  Alimentação
                </Link>
                <Link href="/faq" onClick={() => setMenuOpen(false)} className={`text-sm py-2 px-2 rounded-lg transition-colors ${pathname === '/faq' ? 'text-white bg-zinc-900' : 'text-zinc-400 hover:text-white'}`}>
                  FAQ
                </Link>
                {isAdmin && (
                  <Link href="/gestao" onClick={() => setMenuOpen(false)} className={`text-sm py-2 px-2 rounded-lg transition-colors ${pathname.startsWith('/gestao') ? 'text-white bg-zinc-900' : 'text-zinc-400 hover:text-white'}`}>
                    Gestão
                  </Link>
                )}
              </>
            )}
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
