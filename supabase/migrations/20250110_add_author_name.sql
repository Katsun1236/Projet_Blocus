-- Ajouter la colonne author_name manquante
ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS author_name TEXT;
