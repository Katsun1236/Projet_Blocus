-- Migration: Ajouter les tables manquantes (syntheses et planning_events)
-- Date: 2025-12-27
-- Description: Correction des bugs P0 - Tables manquantes pour synthèses et planning

-- Table syntheses (pour les synthèses IA générées)
CREATE TABLE IF NOT EXISTS public.syntheses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    format_label TEXT,
    source_type TEXT,
    source_name TEXT,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_syntheses_user ON public.syntheses(user_id);
CREATE INDEX IF NOT EXISTS idx_syntheses_created ON public.syntheses(created_at DESC);

ALTER TABLE public.syntheses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own syntheses" ON public.syntheses;
CREATE POLICY "Users can manage their own syntheses"
    ON public.syntheses FOR ALL USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_syntheses_updated_at ON public.syntheses;
CREATE TRIGGER update_syntheses_updated_at BEFORE UPDATE ON public.syntheses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table planning_events (pour le calendrier de planning)
CREATE TABLE IF NOT EXISTS public.planning_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    color TEXT DEFAULT '#6366f1',
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_planning_user ON public.planning_events(user_id);
CREATE INDEX IF NOT EXISTS idx_planning_dates ON public.planning_events(start_date, end_date);

ALTER TABLE public.planning_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own planning events" ON public.planning_events;
CREATE POLICY "Users can manage their own planning events"
    ON public.planning_events FOR ALL USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_planning_events_updated_at ON public.planning_events;
CREATE TRIGGER update_planning_events_updated_at BEFORE UPDATE ON public.planning_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ajouter syntheses aux tables Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.syntheses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.planning_events;

-- Succès
SELECT 'Migration completed successfully: syntheses and planning_events tables added' AS status;
