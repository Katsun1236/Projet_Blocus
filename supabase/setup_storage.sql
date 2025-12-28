-- =============================================
-- SETUP STORAGE BUCKETS FOR PROJET BLOCUS
-- =============================================
-- Ce fichier configure les buckets Supabase Storage
-- Exécuter dans: Supabase Dashboard > SQL Editor

-- 1. Créer le bucket 'courses' pour les fichiers de cours
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'courses',
    'courses',
    true,  -- Public pour que les utilisateurs puissent accéder à leurs fichiers
    20971520,  -- 20 MB limit
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        'text/markdown',
        'image/png',
        'image/jpeg',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed'
    ]::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Politique RLS: Les utilisateurs peuvent uploader leurs propres fichiers
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'courses' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Politique RLS: Les utilisateurs peuvent lire leurs propres fichiers
CREATE POLICY "Users can read their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'courses' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Politique RLS: Les utilisateurs peuvent mettre à jour leurs propres fichiers
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'courses' AND
    (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'courses' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Politique RLS: Les utilisateurs peuvent supprimer leurs propres fichiers
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'courses' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Créer le bucket 'avatars' pour les photos de profil
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    2097152,  -- 2 MB limit pour les avatars
    ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 7. Politiques RLS pour avatars
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Succès
SELECT 'Storage buckets configured successfully' AS status;
