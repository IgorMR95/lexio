-- =====================================================================
-- RLS POLICIES COMPLETAS — MIDORI
-- Aplique no Supabase: SQL Editor → cole tudo → Run
-- =====================================================================

-- Helper: verifica se o usuário logado é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()),
    false
  )
$$;

-- =====================================================================
-- PROFILES
-- =====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles: leitura autenticada" ON public.profiles;
DROP POLICY IF EXISTS "profiles: update proprio" ON public.profiles;
DROP POLICY IF EXISTS "profiles: admin update qualquer" ON public.profiles;

-- Qualquer usuário autenticado pode ler perfis (necessário para exibir autores)
CREATE POLICY "profiles: leitura autenticada"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Usuário só atualiza o próprio perfil
CREATE POLICY "profiles: update proprio"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admin atualiza qualquer perfil (inclusive role)
CREATE POLICY "profiles: admin update qualquer"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Trigger: impede usuário comum de mudar o próprio role
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.role <> OLD.role AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Sem permissão para alterar role';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_escalation();

-- =====================================================================
-- PROMPTS
-- =====================================================================
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prompts: leitura publica" ON public.prompts;
DROP POLICY IF EXISTS "prompts: autor le proprio pendente" ON public.prompts;
DROP POLICY IF EXISTS "prompts: admin le tudo" ON public.prompts;
DROP POLICY IF EXISTS "prompts: insert autenticado" ON public.prompts;
DROP POLICY IF EXISTS "prompts: update proprio" ON public.prompts;
DROP POLICY IF EXISTS "prompts: admin update" ON public.prompts;
DROP POLICY IF EXISTS "prompts: admin delete" ON public.prompts;

-- Leitura pública de prompts ativos/aprovados
CREATE POLICY "prompts: leitura publica"
  ON public.prompts FOR SELECT
  USING (status IN ('ativo', 'aprovado'));

-- Autor vê o próprio prompt (inclusive pendente)
CREATE POLICY "prompts: autor le proprio pendente"
  ON public.prompts FOR SELECT
  TO authenticated
  USING (autor_id = auth.uid());

-- Admin vê tudo
CREATE POLICY "prompts: admin le tudo"
  ON public.prompts FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Usuário autenticado pode criar prompt (sempre entra como pendente)
CREATE POLICY "prompts: insert autenticado"
  ON public.prompts FOR INSERT
  TO authenticated
  WITH CHECK (autor_id = auth.uid() AND status = 'pendente');

-- Autor pode editar o próprio prompt (não pode mudar status)
CREATE POLICY "prompts: update proprio"
  ON public.prompts FOR UPDATE
  TO authenticated
  USING (autor_id = auth.uid() AND NOT public.is_admin())
  WITH CHECK (autor_id = auth.uid() AND status = 'pendente');

-- Admin pode atualizar qualquer prompt (incluindo status, destaque)
CREATE POLICY "prompts: admin update"
  ON public.prompts FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Só admin pode deletar prompts
CREATE POLICY "prompts: admin delete"
  ON public.prompts FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- =====================================================================
-- SKILLS
-- =====================================================================
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "skills: leitura publica" ON public.skills;
DROP POLICY IF EXISTS "skills: autor le proprio" ON public.skills;
DROP POLICY IF EXISTS "skills: admin le tudo" ON public.skills;
DROP POLICY IF EXISTS "skills: insert autenticado" ON public.skills;
DROP POLICY IF EXISTS "skills: update proprio" ON public.skills;
DROP POLICY IF EXISTS "skills: admin update" ON public.skills;
DROP POLICY IF EXISTS "skills: admin delete" ON public.skills;

CREATE POLICY "skills: leitura publica"
  ON public.skills FOR SELECT
  USING (status IN ('ativo', 'aprovado'));

CREATE POLICY "skills: autor le proprio"
  ON public.skills FOR SELECT
  TO authenticated
  USING (autor_id = auth.uid());

CREATE POLICY "skills: admin le tudo"
  ON public.skills FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "skills: insert autenticado"
  ON public.skills FOR INSERT
  TO authenticated
  WITH CHECK (autor_id = auth.uid() AND status = 'pendente');

CREATE POLICY "skills: update proprio"
  ON public.skills FOR UPDATE
  TO authenticated
  USING (autor_id = auth.uid() AND NOT public.is_admin())
  WITH CHECK (autor_id = auth.uid() AND status = 'pendente');

CREATE POLICY "skills: admin update"
  ON public.skills FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "skills: admin delete"
  ON public.skills FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- =====================================================================
-- PROMPT_VOTOS
-- =====================================================================
ALTER TABLE public.prompt_votos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prompt_votos: leitura publica" ON public.prompt_votos;
DROP POLICY IF EXISTS "prompt_votos: insert proprio" ON public.prompt_votos;
DROP POLICY IF EXISTS "prompt_votos: delete proprio" ON public.prompt_votos;

CREATE POLICY "prompt_votos: leitura publica"
  ON public.prompt_votos FOR SELECT
  USING (true);

CREATE POLICY "prompt_votos: insert proprio"
  ON public.prompt_votos FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "prompt_votos: delete proprio"
  ON public.prompt_votos FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- =====================================================================
-- SKILL_VOTOS
-- =====================================================================
ALTER TABLE public.skill_votos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "skill_votos: leitura publica" ON public.skill_votos;
DROP POLICY IF EXISTS "skill_votos: insert proprio" ON public.skill_votos;
DROP POLICY IF EXISTS "skill_votos: delete proprio" ON public.skill_votos;

CREATE POLICY "skill_votos: leitura publica"
  ON public.skill_votos FOR SELECT
  USING (true);

CREATE POLICY "skill_votos: insert proprio"
  ON public.skill_votos FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "skill_votos: delete proprio"
  ON public.skill_votos FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- =====================================================================
-- PROMPT_COMENTARIOS
-- =====================================================================
ALTER TABLE public.prompt_comentarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prompt_comentarios: leitura autenticada" ON public.prompt_comentarios;
DROP POLICY IF EXISTS "prompt_comentarios: insert proprio" ON public.prompt_comentarios;
DROP POLICY IF EXISTS "prompt_comentarios: delete proprio ou admin" ON public.prompt_comentarios;

CREATE POLICY "prompt_comentarios: leitura autenticada"
  ON public.prompt_comentarios FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "prompt_comentarios: insert proprio"
  ON public.prompt_comentarios FOR INSERT
  TO authenticated
  WITH CHECK (autor_id = auth.uid());

CREATE POLICY "prompt_comentarios: delete proprio ou admin"
  ON public.prompt_comentarios FOR DELETE
  TO authenticated
  USING (autor_id = auth.uid() OR public.is_admin());

-- =====================================================================
-- SKILL_COMENTARIOS
-- =====================================================================
ALTER TABLE public.skill_comentarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "skill_comentarios: leitura autenticada" ON public.skill_comentarios;
DROP POLICY IF EXISTS "skill_comentarios: insert proprio" ON public.skill_comentarios;
DROP POLICY IF EXISTS "skill_comentarios: delete proprio ou admin" ON public.skill_comentarios;

CREATE POLICY "skill_comentarios: leitura autenticada"
  ON public.skill_comentarios FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "skill_comentarios: insert proprio"
  ON public.skill_comentarios FOR INSERT
  TO authenticated
  WITH CHECK (autor_id = auth.uid());

CREATE POLICY "skill_comentarios: delete proprio ou admin"
  ON public.skill_comentarios FOR DELETE
  TO authenticated
  USING (autor_id = auth.uid() OR public.is_admin());

-- =====================================================================
-- FERRAMENTAS
-- =====================================================================
ALTER TABLE public.ferramentas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ferramentas: leitura publica" ON public.ferramentas;
DROP POLICY IF EXISTS "ferramentas: admin escreve" ON public.ferramentas;
DROP POLICY IF EXISTS "ferramentas: admin update" ON public.ferramentas;
DROP POLICY IF EXISTS "ferramentas: admin delete" ON public.ferramentas;

CREATE POLICY "ferramentas: leitura publica"
  ON public.ferramentas FOR SELECT
  USING (true);

CREATE POLICY "ferramentas: admin escreve"
  ON public.ferramentas FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "ferramentas: admin update"
  ON public.ferramentas FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "ferramentas: admin delete"
  ON public.ferramentas FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- =====================================================================
-- FERRAMENTA_VOTOS
-- =====================================================================
ALTER TABLE public.ferramenta_votos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ferramenta_votos: leitura publica" ON public.ferramenta_votos;
DROP POLICY IF EXISTS "ferramenta_votos: insert proprio" ON public.ferramenta_votos;
DROP POLICY IF EXISTS "ferramenta_votos: delete proprio ou admin" ON public.ferramenta_votos;

CREATE POLICY "ferramenta_votos: leitura publica"
  ON public.ferramenta_votos FOR SELECT
  USING (true);

CREATE POLICY "ferramenta_votos: insert proprio"
  ON public.ferramenta_votos FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "ferramenta_votos: delete proprio ou admin"
  ON public.ferramenta_votos FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- =====================================================================
-- FERRAMENTA_REVIEWS
-- =====================================================================
ALTER TABLE public.ferramenta_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ferramenta_reviews: leitura publica" ON public.ferramenta_reviews;
DROP POLICY IF EXISTS "ferramenta_reviews: admin escreve" ON public.ferramenta_reviews;
DROP POLICY IF EXISTS "ferramenta_reviews: admin update" ON public.ferramenta_reviews;
DROP POLICY IF EXISTS "ferramenta_reviews: admin delete" ON public.ferramenta_reviews;

CREATE POLICY "ferramenta_reviews: leitura publica"
  ON public.ferramenta_reviews FOR SELECT
  USING (true);

CREATE POLICY "ferramenta_reviews: admin escreve"
  ON public.ferramenta_reviews FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "ferramenta_reviews: admin update"
  ON public.ferramenta_reviews FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "ferramenta_reviews: admin delete"
  ON public.ferramenta_reviews FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- =====================================================================
-- CATEGORIAS_PRINCIPAIS / SUBCATEGORIAS / SUBNIVEIS / AREAS_DIREITO / CATEGORIAS_USO
-- Leitura pública, escrita só admin
-- =====================================================================
ALTER TABLE public.categorias_principais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subniveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas_direito ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_uso ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['categorias_principais','subcategorias','subniveis','areas_direito','categorias_uso']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t||': leitura publica', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t||': admin escreve', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t||': admin update', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t||': admin delete', t);

    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (true)',
      t||': leitura publica', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_admin())',
      t||': admin escreve', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())',
      t||': admin update', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.is_admin())',
      t||': admin delete', t);
  END LOOP;
END $$;

-- =====================================================================
-- GRUPOS
-- =====================================================================
ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "grupos: leitura autenticada" ON public.grupos;
DROP POLICY IF EXISTS "grupos: insert autenticado" ON public.grupos;
DROP POLICY IF EXISTS "grupos: update criador ou admin" ON public.grupos;
DROP POLICY IF EXISTS "grupos: delete admin" ON public.grupos;

CREATE POLICY "grupos: leitura autenticada"
  ON public.grupos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "grupos: insert autenticado"
  ON public.grupos FOR INSERT
  TO authenticated
  WITH CHECK (criado_por = auth.uid());

CREATE POLICY "grupos: update criador ou admin"
  ON public.grupos FOR UPDATE
  TO authenticated
  USING (criado_por = auth.uid() OR public.is_admin())
  WITH CHECK (criado_por = auth.uid() OR public.is_admin());

CREATE POLICY "grupos: delete admin"
  ON public.grupos FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- =====================================================================
-- GRUPO_MEMBROS
-- =====================================================================
ALTER TABLE public.grupo_membros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "grupo_membros: leitura autenticada" ON public.grupo_membros;
DROP POLICY IF EXISTS "grupo_membros: insert proprio" ON public.grupo_membros;
DROP POLICY IF EXISTS "grupo_membros: delete proprio ou admin" ON public.grupo_membros;

CREATE POLICY "grupo_membros: leitura autenticada"
  ON public.grupo_membros FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "grupo_membros: insert proprio"
  ON public.grupo_membros FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "grupo_membros: delete proprio ou admin"
  ON public.grupo_membros FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- =====================================================================
-- ACADEMY_CONTEUDOS
-- =====================================================================
ALTER TABLE public.academy_conteudos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "academy: leitura publica publicado" ON public.academy_conteudos;
DROP POLICY IF EXISTS "academy: admin le tudo" ON public.academy_conteudos;
DROP POLICY IF EXISTS "academy: admin escreve" ON public.academy_conteudos;
DROP POLICY IF EXISTS "academy: admin update" ON public.academy_conteudos;
DROP POLICY IF EXISTS "academy: admin delete" ON public.academy_conteudos;

CREATE POLICY "academy: leitura publica publicado"
  ON public.academy_conteudos FOR SELECT
  USING (publicado = true);

CREATE POLICY "academy: admin le tudo"
  ON public.academy_conteudos FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "academy: admin escreve"
  ON public.academy_conteudos FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "academy: admin update"
  ON public.academy_conteudos FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "academy: admin delete"
  ON public.academy_conteudos FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- =====================================================================
-- NOTIFICACOES
-- =====================================================================
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notificacoes: le proprio" ON public.notificacoes;
DROP POLICY IF EXISTS "notificacoes: insert autenticado" ON public.notificacoes;
DROP POLICY IF EXISTS "notificacoes: update proprio" ON public.notificacoes;
DROP POLICY IF EXISTS "notificacoes: delete proprio" ON public.notificacoes;

CREATE POLICY "notificacoes: le proprio"
  ON public.notificacoes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "notificacoes: insert autenticado"
  ON public.notificacoes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "notificacoes: update proprio"
  ON public.notificacoes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notificacoes: delete proprio"
  ON public.notificacoes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- =====================================================================
-- SEGUIDORES
-- =====================================================================
ALTER TABLE public.seguidores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "seguidores: leitura autenticada" ON public.seguidores;
DROP POLICY IF EXISTS "seguidores: insert proprio" ON public.seguidores;
DROP POLICY IF EXISTS "seguidores: delete proprio" ON public.seguidores;

CREATE POLICY "seguidores: leitura autenticada"
  ON public.seguidores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "seguidores: insert proprio"
  ON public.seguidores FOR INSERT
  TO authenticated
  WITH CHECK (seguidor_id = auth.uid());

CREATE POLICY "seguidores: delete proprio"
  ON public.seguidores FOR DELETE
  TO authenticated
  USING (seguidor_id = auth.uid() OR public.is_admin());

-- =====================================================================
-- NOTAS
-- =====================================================================
ALTER TABLE public.notas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notas: le proprio" ON public.notas;
DROP POLICY IF EXISTS "notas: insert proprio" ON public.notas;
DROP POLICY IF EXISTS "notas: delete proprio" ON public.notas;

CREATE POLICY "notas: le proprio"
  ON public.notas FOR SELECT
  TO authenticated
  USING (autor_id = auth.uid() OR public.is_admin());

CREATE POLICY "notas: insert proprio"
  ON public.notas FOR INSERT
  TO authenticated
  WITH CHECK (autor_id = auth.uid());

CREATE POLICY "notas: delete proprio"
  ON public.notas FOR DELETE
  TO authenticated
  USING (autor_id = auth.uid() OR public.is_admin());

-- =====================================================================
-- AUDIT_LOGS
-- =====================================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs: admin le" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs: insert autenticado" ON public.audit_logs;

CREATE POLICY "audit_logs: admin le"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "audit_logs: insert autenticado"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================================
-- FIM
-- =====================================================================
