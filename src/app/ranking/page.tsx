import { createClient } from '@/lib/supabase/server'
import { RankingClient } from './RankingClient'

export const dynamic = 'force-dynamic'

export default async function RankingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: ferramentas },
    { data: categorias },
    { data: votos },
  ] = await Promise.all([
    (supabase as any)
      .from('ferramentas')
      .select('*')
      .eq('status', 'ativo')
      .order('nome'),
    (supabase as any)
      .from('categorias_uso')
      .select('*')
      .eq('ativo', true)
      .order('ordem'),
    (supabase as any)
      .from('ferramenta_votos_contagem')
      .select('ferramenta_id, categoria_uso_id, total_votos'),
  ])

  // Votos do usuário atual
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
      votos={votos ?? []}
      meusVotos={meusVotos}
      userId={user?.id ?? null}
    />
  )
}
