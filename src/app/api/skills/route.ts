import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 0

const PAGE_SIZE = 20

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const search = searchParams.get('q') ?? ''
  const tipo = searchParams.get('tipo') ?? ''
  const area = searchParams.get('area') ?? ''
  const sort = searchParams.get('sort') === 'oldest' ? true : false

  const supabase = createClient()
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = (supabase as any)
    .from('skills')
    .select(
      'id, titulo, descricao, tipo, compatibilidade, tags, area_direito_id, autor_id, status, destaque, created_at, areas_direito(id, nome, slug)',
      { count: 'exact' }
    )
    .in('status', ['ativo', 'aprovado'])
    .order('created_at', { ascending: sort })
    .range(from, to)

  if (search.trim()) {
    query = query.or(`titulo.ilike.%${search}%,descricao.ilike.%${search}%`)
  }
  if (tipo) query = query.eq('tipo', tipo)
  if (area) query = query.eq('area_direito_id', area)

  const { data: skills, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const autorIds = Array.from(new Set((skills ?? []).map((s: any) => s.autor_id).filter(Boolean)))
  const profileMap: Record<string, any> = {}
  if (autorIds.length > 0) {
    const { data: profiles } = await (supabase as any)
      .from('profiles')
      .select('id, full_name, email')
      .in('id', autorIds)
    ;(profiles ?? []).forEach((p: any) => { profileMap[p.id] = p })
  }

  const data = (skills ?? []).map((s: any) => ({
    ...s,
    profiles: profileMap[s.autor_id] ? { full_name: profileMap[s.autor_id].full_name, email: profileMap[s.autor_id].email } : null,
  }))

  return NextResponse.json({
    data,
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    hasMore: (count ?? 0) > page * PAGE_SIZE,
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
  })
}
