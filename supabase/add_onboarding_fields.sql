-- Migration pour ajouter les champs d'onboarding et de tutoriel

-- Ajouter les colonnes pour l'onboarding
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';

-- Mettre à jour les utilisateurs existants pour qu'ils ne voient pas le tutoriel
UPDATE public.users
SET has_completed_onboarding = TRUE
WHERE has_completed_onboarding IS NULL OR has_completed_onboarding = FALSE;

-- Commentaire pour documentation
COMMENT ON COLUMN public.users.has_completed_onboarding IS 'Indique si l''utilisateur a terminé le tutoriel interactif avec Locus';
COMMENT ON COLUMN public.users.onboarding_completed_at IS 'Date de complétion du tutoriel';
COMMENT ON COLUMN public.users.role IS 'Rôle de l''utilisateur : student, teacher, admin';
