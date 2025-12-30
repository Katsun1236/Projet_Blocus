-- Ajouter les colonnes manquantes à community_posts
ALTER TABLE community_groups 
ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour community_groups
DROP POLICY IF EXISTS "Users can view community_groups" ON community_groups;
CREATE POLICY "Users can view community_groups" ON community_groups
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can insert community_groups" ON community_groups;
CREATE POLICY "Users can insert community_groups" ON community_groups
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update community_groups" ON community_groups;
CREATE POLICY "Users can update community_groups" ON community_groups
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete community_groups" ON community_groups;
CREATE POLICY "Users can delete community_groups" ON community_groups
    FOR DELETE USING (auth.role() = 'authenticated');

-- Ajouter les colonnes manquantes si elles n'existent pas
ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS author_avatar TEXT,
ADD COLUMN IF NOT EXISTS author_name TEXT,
ADD COLUMN IF NOT EXISTS likes_by TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Politiques RLS pour community_posts
DROP POLICY IF EXISTS "Users can view community_posts" ON community_posts;
CREATE POLICY "Users can view community_posts" ON community_posts
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can insert community_posts" ON community_posts;
CREATE POLICY "Users can insert community_posts" ON community_posts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update community_posts" ON community_posts;
CREATE POLICY "Users can update community_posts" ON community_posts
    FOR UPDATE USING (auth.role() = 'authenticated' AND user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete community_posts" ON community_posts;
CREATE POLICY "Users can delete community_posts" ON community_posts
    FOR DELETE USING (auth.role() = 'authenticated' AND user_id = auth.uid());
