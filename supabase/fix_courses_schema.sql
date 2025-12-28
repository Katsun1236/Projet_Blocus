-- =============================================
-- FIX COURSES TABLE SCHEMA
-- =============================================
-- Ajoute les colonnes manquantes pour compatibilité avec le code

-- 1. Ajouter la colonne storage_path (chemin complet dans Storage)
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- 2. Ajouter la colonne parent_id (pour navigation dossiers)
-- Note: folder_id sera utilisé comme parent_id
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.folders(id) ON DELETE SET NULL;

-- 3. Créer un index pour parent_id
CREATE INDEX IF NOT EXISTS idx_courses_parent ON public.courses(parent_id);

-- 4. Ajouter la colonne 'type' pour distinguer fichiers et dossiers
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'file';

-- 5. Créer la table folders si elle n'existe pas encore (pour les dossiers de cours)
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_folders_user ON public.folders(user_id);

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own folders" ON public.folders;
CREATE POLICY "Users can manage their own folders"
    ON public.folders FOR ALL USING (auth.uid() = user_id);

-- Succès
SELECT 'Courses table schema fixed successfully' AS status;
