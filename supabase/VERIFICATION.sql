-- ==========================================
-- SCRIPT DE VÉRIFICATION SUPABASE
-- ==========================================
-- Exécute ce script pour vérifier que tout est bien configuré

-- ==========================================
-- 1. VÉRIFIER LES TABLES
-- ==========================================

SELECT '🗄️  TABLES EXISTANTES' AS check_type;

SELECT
    table_name,
    CASE
        WHEN table_name IN (
            'users', 'folders', 'courses', 'quiz_results',
            'syntheses', 'tutor_messages', 'review_cards',
            'pomodoro_stats', 'planning_events', 'settings',
            'community_groups', 'community_posts', 'notifications'
        ) THEN '✅'
        ELSE '❌'
    END AS status
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- ==========================================
-- 2. COMPTER LES TABLES
-- ==========================================

SELECT '📊 RÉSUMÉ DES TABLES' AS check_type;

SELECT
    'Tables créées' AS metric,
    COUNT(*)::text || '/13 attendues' AS value,
    CASE WHEN COUNT(*) >= 13 THEN '✅' ELSE '❌' END AS status
FROM information_schema.tables
WHERE table_schema = 'public';

-- ==========================================
-- 3. VÉRIFIER LES COLONNES DE LA TABLE USERS
-- ==========================================

SELECT '👤 COLONNES DE LA TABLE USERS' AS check_type;

SELECT
    column_name,
    data_type,
    CASE
        WHEN column_name = 'has_completed_onboarding' THEN '✅ ONBOARDING OK'
        WHEN column_name = 'role' THEN '✅ ROLE OK'
        WHEN column_name = 'photo_url' THEN '✅ PHOTO OK'
        ELSE '✓'
    END AS status
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- ==========================================
-- 4. VÉRIFIER LES POLICIES RLS
-- ==========================================

SELECT '🔐 POLICIES RLS (ROW LEVEL SECURITY)' AS check_type;

SELECT
    tablename,
    COUNT(*) AS policies_count,
    CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END AS status
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ==========================================
-- 5. COMPTER LES POLICIES TOTALES
-- ==========================================

SELECT '📊 RÉSUMÉ DES POLICIES' AS check_type;

SELECT
    'Policies RLS' AS metric,
    COUNT(*)::text || ' créées' AS value,
    CASE WHEN COUNT(*) >= 20 THEN '✅' ELSE '❌ Trop peu de policies' END AS status
FROM pg_policies
WHERE schemaname = 'public';

-- ==========================================
-- 6. VÉRIFIER LES STORAGE BUCKETS
-- ==========================================

SELECT '📦 STORAGE BUCKETS' AS check_type;

SELECT
    id,
    name,
    public,
    file_size_limit,
    CASE
        WHEN id = 'courses' AND file_size_limit = 20971520 THEN '✅ 20MB OK'
        WHEN id = 'avatars' AND file_size_limit = 2097152 THEN '✅ 2MB OK'
        ELSE '✓'
    END AS status
FROM storage.buckets
ORDER BY name;

-- ==========================================
-- 7. COMPTER LES BUCKETS
-- ==========================================

SELECT '📊 RÉSUMÉ DU STORAGE' AS check_type;

SELECT
    'Storage buckets' AS metric,
    COUNT(*)::text || '/2 attendus' AS value,
    CASE WHEN COUNT(*) >= 2 THEN '✅' ELSE '❌' END AS status
FROM storage.buckets;

-- ==========================================
-- 8. VÉRIFIER LES STORAGE POLICIES
-- ==========================================

SELECT '🔐 STORAGE POLICIES' AS check_type;

SELECT
    policyname,
    bucket_id,
    operation,
    CASE WHEN bucket_id IN ('courses', 'avatars') THEN '✅' ELSE '❌' END AS status
FROM storage.policies
ORDER BY bucket_id, policyname;

-- ==========================================
-- 9. VÉRIFIER LES TRIGGERS
-- ==========================================

SELECT '⚡ TRIGGERS ACTIFS' AS check_type;

SELECT
    trigger_name,
    event_object_table AS table_name,
    '✓' AS status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ==========================================
-- 10. VÉRIFIER LES GROUPES COMMUNAUTAIRES
-- ==========================================

SELECT '👥 GROUPES COMMUNAUTAIRES' AS check_type;

SELECT
    name,
    icon,
    color,
    CASE WHEN member_count >= 0 THEN '✅' ELSE '❌' END AS status
FROM public.community_groups
ORDER BY name;

-- ==========================================
-- 11. COMPTER LES GROUPES
-- ==========================================

SELECT '📊 RÉSUMÉ DES GROUPES' AS check_type;

SELECT
    'Groupes communautaires' AS metric,
    COUNT(*)::text || '/6 attendus' AS value,
    CASE WHEN COUNT(*) >= 6 THEN '✅' ELSE '❌' END AS status
FROM public.community_groups;

-- ==========================================
-- 12. VÉRIFIER LES FONCTIONS
-- ==========================================

SELECT '⚙️  FONCTIONS POSTGRESQL' AS check_type;

SELECT
    routine_name AS function_name,
    '✓' AS status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- ==========================================
-- RÉSULTAT FINAL
-- ==========================================

SELECT '🎯 RÉSUMÉ FINAL' AS check_type;

WITH stats AS (
    SELECT
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') AS tables_count,
        (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') AS policies_count,
        (SELECT COUNT(*) FROM storage.buckets) AS buckets_count,
        (SELECT COUNT(*) FROM public.community_groups) AS groups_count
)
SELECT
    '✅ CONFIGURATION COMPLÈTE' AS message,
    tables_count::text || ' tables' AS tables,
    policies_count::text || ' policies' AS policies,
    buckets_count::text || ' buckets' AS storage,
    groups_count::text || ' groupes' AS community,
    CASE
        WHEN tables_count >= 13
         AND policies_count >= 20
         AND buckets_count >= 2
         AND groups_count >= 6
        THEN '✅ TOUT EST OK, TU PEUX UTILISER LE SITE!'
        ELSE '❌ IL MANQUE DES ÉLÉMENTS, VOIR CI-DESSUS'
    END AS final_status
FROM stats;

-- ==========================================
-- NOTES
-- ==========================================
/*
SI TU VOIS DES ❌:
1. Ré-exécute COMPLETE_SETUP.sql
2. Vérifie les erreurs SQL
3. Contacte le support si ça persiste

SI TU VOIS ✅ PARTOUT:
🎉 FÉLICITATIONS! La configuration est complète!
*/
