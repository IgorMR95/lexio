import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 0

const PAGE_SIZE = 20

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const search = searchParams.get('q') ?? ''
  const categoria = searchParams.get('categoria') ?? ''
  const subcategoria = searchParams.get('subcategoria') ?? ''
  const subnivel = searchParams.get('subnivel') ?? ''
  const area = searchParams.get('area') ?? ''
  const origem = searchParams.get('origem') ?? ''
  const idioma = searchParams.get('idioma') ?? ''
  const sort = searchParams.get('sort') === 'oldest' ? true : false // ascending

  const supabase = createClient()
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('prompts')
    .select(
      'id, titulo, descricao_curta, categoria_id, subcategoria_id, subnivel_id, area_direito_id, tags, autor_id, status, internacional, idioma, destaque, created_at, categorias_principais(id, nome, slug), subcategorias(id, nome, slug), subniveis(id, nome, slug), areas_direito(id, nome, slug)',
      { count: 'exact' }
    )
    .in('status', ['ativo', 'aprovado'])
    .order('created_at', { ascending: sort })
    .range(from, to)

  if (search.trim()) {
    query = query.or(`titulo.ilike.%${search}%,descricao_curta.ilike.%${search}%`)
  }
  if (categoria) query = query.eq('categoria_id', categoria)
  if (subcategoria) query = query.eq('subcategoria_id', subcategoria)
  if (subnivel) query = query.eq('subnivel_id', subnivel)
  if (area) query = query.eq('area_direito_id', area)
  if (origem === 'nacional') query = query.eq('internacional', false)
  if (origem === 'internacional') query = query.eq('internacional', true)
  if (idioma) query = query.eq('idioma', idioma)

  const { data: prompts, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Buscar autores para os prompts desta página
  const autorIds = Array.from(new Set((prompts ?? []).map((p: any) => p.autor_id).filter(Boolean)))
  const profileMap: Record<string, any> = {}
  if (autorIds.length > 0) {
    const { data: profiles } = await (supabase as any)
      .from('profiles')
      .select('id, full_name, email')
      .in('id', autorIds)
    ;(profiles ?? []).forEach((p: any) => { profileMap[p.id] = p })
  }

  const data = (prompts ?? []).map((p: any) => ({
    ...p,
    profiles: profileMap[p.autor_id] ? { full_name: profileMap[p.autor_id].full_name, email: profileMap[p.autor_id].email } : null,
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
