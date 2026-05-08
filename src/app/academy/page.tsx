import { createClient } from '@/lib/supabase/server'
import { AcademyClient } from './AcademyClient'

export const dynamic = 'force-dynamic'

export default async function AcademyPage() {
  const supabase = createClient()
  const { data: conteudos } = await supabase
    .from('academy_conteudos')
    .select('*')
    .eq('publicado', true)
    .order('ordem', { ascending: true })
    .order('created_at', { ascending: false })

  return <AcademyClient conteudos={conteudos ?? []} />
}
