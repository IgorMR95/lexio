import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { seguido_id } = await req.json()
  if (!seguido_id || seguido_id === user.id)
    return NextResponse.json({ error: 'Inválido' }, { status: 400 })

  const { error } = await (supabase as any)
    .from('seguidores')
    .insert({ seguidor_id: user.id, seguido_id })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Notificar o seguido
  await (supabase as any).from('notificacoes').insert({
    user_id: seguido_id,
    tipo: 'novo_seguidor',
    ator_id: user.id,
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { seguido_id } = await req.json()

  await (supabase as any)
    .from('seguidores')
    .delete()
    .eq('seguidor_id', user.id)
    .eq('seguido_id', seguido_id)

  return NextResponse.json({ ok: true })
}
