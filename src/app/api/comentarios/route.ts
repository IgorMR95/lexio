import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { prompt_id, conteudo } = await req.json()
  if (!prompt_id || !conteudo?.trim())
    return NextResponse.json({ error: 'Inválido' }, { status: 400 })

  if (conteudo.trim().length > 2000)
    return NextResponse.json({ error: 'Comentário muito longo' }, { status: 400 })

  const { data: comentario, error } = await (supabase as any)
    .from('prompt_comentarios')
    .insert({ prompt_id, autor_id: user.id, conteudo: conteudo.trim() })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Notificar o autor do prompt
  const { data: prompt } = await (supabase as any)
    .from('prompts')
    .select('autor_id')
    .eq('id', prompt_id)
    .single()

  if (prompt?.autor_id && prompt.autor_id !== user.id) {
    await (supabase as any).from('notificacoes').insert({
      user_id: prompt.autor_id,
      tipo: 'comentario_prompt',
      ator_id: user.id,
      prompt_id,
      comentario_id: comentario.id,
    })
  }

  return NextResponse.json({ ok: true, id: comentario.id })
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await req.json()

  // Só o autor ou admin pode deletar
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  const query = (supabase as any).from('prompt_comentarios').delete().eq('id', id)
  if (!isAdmin) query.eq('autor_id', user.id)

  await query
  return NextResponse.json({ ok: true })
}
