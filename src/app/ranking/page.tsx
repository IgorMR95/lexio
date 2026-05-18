import { createClient } from '@/lib/supabase/server'
import { RankingClient } from './RankingClient'

export const dynamic = 'force-dynamic'

export default async function RankingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: ferramentas },
    { data: categorias },
    { data: votosGeral },
    { data: votosSemana },
    { data: votosMes },
    { data: votosDiario },
  ] = await Promise.all([
    (supabase as any)
      .from('ferramentas')
      .select('id, nome, descricao, url, tipo, grupo, destaque')
      .eq('status', 'ativo')
      .order('nome'),
    (supabase as any)
      .from('categorias_uso')
      .select('id, nome, slug, descricao, ordem, tipo_categoria')
      .eq('ativo', true)
      .order('tipo_categoria')
      .order('ordem'),
    (supabase as any)
      .from('ferramenta_votos_contagem')
      .select('ferramenta_id, categoria_uso_id, total_votos'),
    (supabase as any)
      .from('ferramenta_votos_semana')
      .select('ferramenta_id, categoria_uso_id, total_votos'),
    (supabase as any)
      .from('ferramenta_votos_mes')
      .select('ferramenta_id, categoria_uso_id, total_votos'),
    (supabase as any)
      .from('ferramenta_votos_diario')
      .select('ferramenta_id, categoria_uso_id, dia, total_votos')
      .order('dia', { ascending: true }),
  ])

  let meusVotos: { ferramenta_id: string; categoria_uso_id: string }[] = []
  if (user) {
    const { data: mv } = await (supabase as any)
      .from('ferramenta_votos')
      .select('ferramenta_id, categoria_uso_id')
      .eq('user_id', user.id)
    meusVotos = mv ?? []
  }

  return (
    <RankingClient
      ferramentas={ferramentas ?? []}
      categorias={categorias ?? []}
      votosGeral={votosGeral ?? []}
      votosSemana={votosSemana ?? []}
      votosMes={votosMes ?? []}
      votosDiario={votosDiario ?? []}
      meusVotos={meusVotos}
      userId={user?.id ?? null}
    />
  )
}
