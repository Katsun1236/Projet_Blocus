-- Migration: Corriger la structure de quiz_results pour la sauvegarde
-- Date: 2025-01-08
-- Description: Ajouter les colonnes manquantes pour la sauvegarde des quiz

-- Ajouter les colonnes manquantes à la table quiz_results
ALTER TABLE public.quiz_results 
ADD COLUMN IF NOT EXISTS content JSONB,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'qcm',
ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'intermediaire',
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS question_count INTEGER DEFAULT 0;

-- Mettre à jour les entrées existantes avec les valeurs par défaut
UPDATE public.quiz_results 
SET 
    content = COALESCE(content, questions),
    title = COALESCE(title, 'Quiz sans titre'),
    type = COALESCE(type, 'qcm'),
    difficulty = COALESCE(difficulty, 'intermediaire'),
    theme = COALESCE(theme, 'general'),
    question_count = COALESCE(question_count, jsonb_array_length(questions))
WHERE content IS NULL OR title IS NULL OR type IS NULL OR difficulty IS NULL OR theme IS NULL OR question_count IS NULL;
