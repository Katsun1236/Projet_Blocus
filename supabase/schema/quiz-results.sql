-- Table pour stocker les résultats des quiz
CREATE TABLE IF NOT EXISTS public.quiz_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'qcm',
    difficulty TEXT NOT NULL DEFAULT 'intermediaire',
    theme TEXT NOT NULL DEFAULT 'general',
    question_count INTEGER NOT NULL DEFAULT 0,
    score INTEGER,
    percentage INTEGER,
    content JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON public.quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_created_at ON public.created_at(quiz_results.created_at);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_created_at ON public.quiz_results(user_id, created_at);

-- RLS (Row Level Security)
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- Politique : les utilisateurs ne peuvent voir que leurs propres résultats
CREATE POLICY "Users can view own quiz results" ON public.quiz_results
    FOR SELECT USING (auth.uid() = user_id);

-- Politique : les utilisateurs peuvent insérer leurs propres résultats
CREATE POLICY "Users can insert own quiz results" ON public.quiz_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politique : les utilisateurs peuvent mettre à jour leurs propres résultats
CREATE POLICY "Users can update own quiz results" ON public.quiz_results
    FOR UPDATE USING (auth.uid() = user_id);

-- Politique : les utilisateurs peuvent supprimer leurs propres résultats
CREATE POLICY "Users can delete own quiz results" ON public.quiz_results
    FOR DELETE USING (auth.uid() = user_id);
