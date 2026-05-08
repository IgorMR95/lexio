export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email?: string | null
          role?: string
        }
        Update: {
          full_name?: string | null
          email?: string | null
          role?: string
          updated_at?: string
        }
      }
      categorias_principais: {
        Row: {
          id: string
          slug: string
          nome: string
          descricao: string | null
          ordem: number
          ativo: boolean
          created_at: string
        }
        Insert: {
          slug: string
          nome: string
          descricao?: string | null
          ordem?: number
          ativo?: boolean
        }
        Update: {
          nome?: string
          descricao?: string | null
          ordem?: number
          ativo?: boolean
        }
      }
      subcategorias: {
        Row: {
          id: string
          categoria_id: string
          slug: string
          nome: string
          descricao: string | null
          ordem: number
          ativo: boolean
          created_at: string
        }
        Insert: {
          categoria_id: string
          slug: string
          nome: string
          descricao?: string | null
          ordem?: number
          ativo?: boolean
        }
        Update: {
          nome?: string
          descricao?: string | null
          ordem?: number
          ativo?: boolean
        }
      }
      subniveis: {
        Row: {
          id: string
          subcategoria_id: string
          slug: string
          nome: string
          descricao: string | null
          ordem: number
          ativo: boolean
          created_at: string
        }
        Insert: {
          subcategoria_id: string
          slug: string
          nome: string
          descricao?: string | null
          ordem?: number
          ativo?: boolean
        }
        Update: {
          nome?: string
          descricao?: string | null
          ordem?: number
          ativo?: boolean
        }
      }
      areas_direito: {
        Row: {
          id: string
          slug: string
          nome: string
          descricao: string | null
          ordem: number
          ativo: boolean
          created_at: string
        }
        Insert: {
          slug: string
          nome: string
          descricao?: string | null
          ordem?: number
          ativo?: boolean
        }
        Update: {
          nome?: string
          descricao?: string | null
          ordem?: number
          ativo?: boolean
        }
      }
      prompts: {
        Row: {
          id: string
          titulo: string
          descricao_curta: string | null
          texto_completo: string
          categoria_id: string | null
          subcategoria_id: string | null
          subnivel_id: string | null
          area_direito_id: string | null
          tags: string[]
          autor_id: string | null
          status: string
          observacoes: string | null
          visualizacoes: number
          internacional: boolean
          idioma: string | null
          destaque: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          titulo: string
          texto_completo: string
          descricao_curta?: string | null
          categoria_id?: string | null
          subcategoria_id?: string | null
          subnivel_id?: string | null
          area_direito_id?: string | null
          tags?: string[]
          autor_id?: string | null
          status?: string
          observacoes?: string | null
          internacional?: boolean
          idioma?: string | null
          destaque?: boolean
        }
        Update: {
          titulo?: string
          texto_completo?: string
          descricao_curta?: string | null
          categoria_id?: string | null
          subcategoria_id?: string | null
          subnivel_id?: string | null
          area_direito_id?: string | null
          tags?: string[]
          status?: string
          observacoes?: string | null
          internacional?: boolean
          idioma?: string | null
          destaque?: boolean
        }
      }
      prompt_votos: {
        Row: {
          id: string
          prompt_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          prompt_id: string
          user_id: string
        }
        Update: Record<string, never>
      }
    }
    Views: {
      prompt_votos_contagem: {
        Row: { prompt_id: string; total_votos: number }
      }
      destaques_semana: {
        Row: {
          id: string
          titulo: string
          descricao_curta: string | null
          tags: string[]
          created_at: string
          area_direito_id: string | null
          subcategoria_id: string | null
          categoria_id: string | null
          votos_semana: number
          score: number
        }
      }
    }
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean }
    }
    Enums: Record<string, never>
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type CategoriaPrincipal = Database['public']['Tables']['categorias_principais']['Row']
export type Subcategoria = Database['public']['Tables']['subcategorias']['Row']
export type Subnivel = Database['public']['Tables']['subniveis']['Row']
export type AreaDireito = Database['public']['Tables']['areas_direito']['Row']
export type Prompt = Database['public']['Tables']['prompts']['Row']

export type PromptWithRelations = Prompt & {
  categorias_principais: CategoriaPrincipal | null
  subcategorias: Subcategoria | null
  subniveis: Subnivel | null
  areas_direito: AreaDireito | null
  profiles: Pick<Profile, 'full_name' | 'email'> | null
}
