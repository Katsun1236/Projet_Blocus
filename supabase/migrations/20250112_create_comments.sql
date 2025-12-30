-- Créer la table des commentaires
CREATE TABLE IF NOT EXISTS community_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_created_at ON community_comments(created_at);

-- Activer RLS
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour community_comments
DROP POLICY IF EXISTS "Users can view community_comments" ON community_comments;
CREATE POLICY "Users can view community_comments" ON community_comments
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can insert community_comments" ON community_comments;
CREATE POLICY "Users can insert community_comments" ON community_comments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update community_comments" ON community_comments;
CREATE POLICY "Users can update community_comments" ON community_comments
    FOR UPDATE USING (auth.role() = 'authenticated' AND author_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete community_comments" ON community_comments;
CREATE POLICY "Users can delete community_comments" ON community_comments
    FOR DELETE USING (auth.role() = 'authenticated' AND author_id = auth.uid());

-- Fonction pour incrémenter le compteur
CREATE OR REPLACE FUNCTION increment_comments_counter()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE community_posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour incrémenter automatiquement le compteur de commentaires
DROP TRIGGER IF EXISTS increment_comments_trigger ON community_comments;
CREATE TRIGGER increment_comments_trigger
    AFTER INSERT ON community_comments
    FOR EACH ROW
    EXECUTE FUNCTION increment_comments_counter();
