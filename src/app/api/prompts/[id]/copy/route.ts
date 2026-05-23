import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  await (supabase as any)
    .from('prompt_copies')
    .insert({ prompt_id: params.id, user_id: user?.id ?? null })

  return NextResponse.json({ ok: true })
}
