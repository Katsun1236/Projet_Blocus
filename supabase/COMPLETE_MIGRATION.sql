-- ============================================
-- MIGRATION COMPLETE SUPABASE - PROJET BLOCUS
-- ============================================

-- ==========================================
-- 1. USERS TABLE - Ajouter champs onboarding
-- ==========================================
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- ==========================================
-- 2. TRIGGER - Auto-création profil utilisateur
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, first_name, last_name, photo_url, has_completed_onboarding)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
        FALSE
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        photo_url = COALESCE(EXCLUDED.photo_url, public.users.photo_url);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 3. STORAGE - Créer bucket "courses" si n'existe pas
-- ==========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('courses', 'courses', true)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 4. STORAGE POLICIES - Autoriser uploads
-- ==========================================

-- Supprimer anciennes policies si existent
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view files" ON storage.objects;

-- Upload : Les utilisateurs peuvent uploader dans leur dossier
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'courses' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Read : Tout le monde peut voir les fichiers (bucket public)
CREATE POLICY "Public can view files"
ON storage.objects FOR SELECT
USING (bucket_id = 'courses');

-- Delete : Les utilisateurs peuvent supprimer leurs propres fichiers
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'courses' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Update : Les utilisateurs peuvent modifier leurs propres fichiers
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'courses' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- ==========================================
-- 5. METTRE À JOUR utilisateurs existants
-- ==========================================
UPDATE public.users
SET has_completed_onboarding = FALSE
WHERE has_completed_onboarding IS NULL;

-- ==========================================
-- FIN MIGRATION
-- ==========================================
