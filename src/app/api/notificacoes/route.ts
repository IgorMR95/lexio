import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Marcar todas como lidas
export async function PATCH() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  await (supabase as any)
    .from('notificacoes')
    .update({ lida: true })
    .eq('user_id', user.id)
    .eq('lida', false)

  return NextResponse.json({ ok: true })
}
