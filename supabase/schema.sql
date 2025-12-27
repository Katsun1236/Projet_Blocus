-- ================================================
-- PROJET BLOCUS - SCHÉMA SUPABASE
-- ================================================
-- Créé pour remplacer Firebase Firestore
-- Repartir de zéro avec une structure PostgreSQL optimisée

-- ================================================
-- 1. TABLE USERS (Profils utilisateurs)
-- ================================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    photo_url TEXT,
    school TEXT,
    grade TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX idx_users_email ON public.users(email);

-- RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ================================================
-- 2. TABLE FOLDERS (Organisation des cours)
-- ================================================
CREATE TABLE public.folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_folders_user ON public.folders(user_id);

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own folders"
    ON public.folders FOR ALL
    USING (auth.uid() = user_id);

-- ================================================
-- 3. TABLE COURSES (Cours et fichiers)
-- ================================================
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    file_name TEXT,
    file_type TEXT,
    file_size INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_courses_user ON public.courses(user_id);
CREATE INDEX idx_courses_folder ON public.courses(folder_id);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own courses"
    ON public.courses FOR ALL
    USING (auth.uid() = user_id);

-- ================================================
-- 4. TABLE QUIZ_RESULTS (Résultats de quiz)
-- ================================================
CREATE TABLE public.quiz_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    questions JSONB NOT NULL,
    answers JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quiz_user ON public.quiz_results(user_id);
CREATE INDEX idx_quiz_created ON public.quiz_results(created_at DESC);

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own quiz results"
    ON public.quiz_results FOR ALL
    USING (auth.uid() = user_id);

-- ================================================
-- 5. TABLE TUTOR_MESSAGES (Historique tuteur IA)
-- ================================================
CREATE TABLE public.tutor_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tutor_user ON public.tutor_messages(user_id);
CREATE INDEX idx_tutor_created ON public.tutor_messages(created_at DESC);

ALTER TABLE public.tutor_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tutor messages"
    ON public.tutor_messages FOR ALL
    USING (auth.uid() = user_id);

-- ================================================
-- 6. TABLE REVIEW_CARDS (Cartes révision espacée)
-- ================================================
CREATE TABLE public.review_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT,
    ease_factor NUMERIC DEFAULT 2.5,
    interval INTEGER DEFAULT 1,
    repetitions INTEGER DEFAULT 0,
    next_review_date TIMESTAMPTZ DEFAULT NOW(),
    last_reviewed TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cards_user ON public.review_cards(user_id);
CREATE INDEX idx_cards_next_review ON public.review_cards(user_id, next_review_date);

ALTER TABLE public.review_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own review cards"
    ON public.review_cards FOR ALL
    USING (auth.uid() = user_id);

-- ================================================
-- 7. TABLE POMODORO_STATS (Statistiques Pomodoro)
-- ================================================
CREATE TABLE public.pomodoro_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    total_minutes INTEGER DEFAULT 0,
    total_pomodoros INTEGER DEFAULT 0,
    today_sessions INTEGER DEFAULT 0,
    last_date DATE,
    last_session_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

ALTER TABLE public.pomodoro_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own pomodoro stats"
    ON public.pomodoro_stats FOR ALL
    USING (auth.uid() = user_id);

-- ================================================
-- 8. TABLE SETTINGS (Paramètres utilisateur)
-- ================================================
CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- 'pomodoro', 'notifications', etc.
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, category)
);

CREATE INDEX idx_settings_user_category ON public.settings(user_id, category);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings"
    ON public.settings FOR ALL
    USING (auth.uid() = user_id);

-- ================================================
-- 9. TABLE COMMUNITY_GROUPS (Groupes communauté)
-- ================================================
CREATE TABLE public.community_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT DEFAULT '#6366f1',
    member_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view groups"
    ON public.community_groups FOR SELECT
    TO authenticated
    USING (true);

-- ================================================
-- 10. TABLE COMMUNITY_POSTS (Posts communauté)
-- ================================================
CREATE TABLE public.community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.community_groups(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('question', 'resource', 'discussion')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[],
    likes INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_group ON public.community_posts(group_id);
CREATE INDEX idx_posts_user ON public.community_posts(user_id);
CREATE INDEX idx_posts_type_created ON public.community_posts(type, created_at DESC);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view posts"
    ON public.community_posts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create posts"
    ON public.community_posts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
    ON public.community_posts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
    ON public.community_posts FOR DELETE
    USING (auth.uid() = user_id);

-- ================================================
-- 11. TABLE NOTIFICATIONS (Notifications)
-- ================================================
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notif_user ON public.notifications(user_id);
CREATE INDEX idx_notif_created ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notifications"
    ON public.notifications FOR ALL
    USING (auth.uid() = user_id);

-- ================================================
-- 12. TABLE ONBOARDING (État visite guidée)
-- ================================================
CREATE TABLE public.onboarding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    current_step INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

ALTER TABLE public.onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own onboarding"
    ON public.onboarding FOR ALL
    USING (auth.uid() = user_id);

-- ================================================
-- 13. FUNCTIONS (Triggers et fonctions utiles)
-- ================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.community_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer automatiquement un profil utilisateur après signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, created_at)
    VALUES (NEW.id, NEW.email, NOW());

    INSERT INTO public.onboarding (user_id, created_at)
    VALUES (NEW.id, NOW());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour auto-créer le profil
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================
-- 14. DONNÉES INITIALES (Groupes communauté)
-- ================================================
INSERT INTO public.community_groups (name, description, icon, color, member_count) VALUES
    ('Mathématiques', 'Questions et ressources en maths', '📐', '#3b82f6', 0),
    ('Sciences', 'Physique, chimie, biologie...', '🔬', '#10b981', 0),
    ('Langues', 'Français, anglais, néerlandais', '🗣️', '#f59e0b', 0),
    ('Histoire-Géo', 'Histoire et géographie', '🌍', '#8b5cf6', 0),
    ('Informatique', 'Programmation et tech', '💻', '#06b6d4', 0),
    ('Général', 'Discussions générales et entraide', '💬', '#6366f1', 0);

-- ================================================
-- FIN DU SCHÉMA
-- ================================================
