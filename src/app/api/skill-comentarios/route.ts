import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { skill_id, conteudo } = await req.json()
  if (!skill_id || !conteudo?.trim()) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  const { error } = await (supabase as any)
    .from('skill_comentarios')
    .insert({ skill_id, autor_id: user.id, conteudo: conteudo.trim() })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await req.json()

  const profile = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile.data?.role === 'admin'

  const query = (supabase as any).from('skill_comentarios').delete().eq('id', id)
  if (!isAdmin) query.eq('autor_id', user.id)

  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
