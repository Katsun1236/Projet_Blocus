-- Ajouter la colonne tag manquante
ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS tag TEXT;
