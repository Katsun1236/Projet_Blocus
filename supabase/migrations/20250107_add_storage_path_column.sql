-- Migration: Ajouter la colonne storage_path pour les uploads
-- Date: 2025-01-07
-- Description: Ajouter la colonne storage_path manquante pour les uploads de fichiers

-- Ajouter la colonne storage_path à la table courses
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Mettre à jour les entrées existantes avec le storage_path basé sur le file_url
UPDATE public.courses 
SET storage_path = CASE 
    WHEN file_url IS NOT NULL THEN 
        'courses/' || user_id || '/' || COALESCE(
            REGEXP_REPLACE(file_url, '.*/([^/]+)$', '\1'),
            title
        )
    ELSE NULL
END
WHERE storage_path IS NULL;
