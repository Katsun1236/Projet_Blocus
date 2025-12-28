# 🚀 Guide de Configuration Supabase - Projet Blocus

## ⚠️ IMPORTANT: Configuration Requise

Ton application ne fonctionne pas actuellement car **Supabase n'est pas encore configuré**.
Les tables et buckets de stockage n'existent pas, ce qui cause:

- ❌ Impossible d'uploader des cours
- ❌ Chargement infini sur toutes les pages
- ❌ Les requêtes échouent silencieusement

## ✅ Solution: Exécuter les Scripts SQL

### Étape 1: Accéder à Supabase Dashboard

1. Va sur https://supabase.com/dashboard
2. Sélectionne ton projet **Projet Blocus**
3. Dans le menu de gauche, clique sur **SQL Editor**

### Étape 2: Créer les Tables (OBLIGATOIRE)

**Exécute les 3 fichiers SQL dans l'ordre:**

#### A. Schema Principal
1. Dans le SQL Editor, clique sur **+ New query**
2. Ouvre le fichier `/supabase/schema.sql`
3. **Copie TOUT le contenu** du fichier
4. **Colle** dans le SQL Editor
5. Clique sur **RUN** (ou Ctrl+Enter)

✅ **Vérification:** Tu devrais voir "Success. No rows returned" en vert

#### B. Fix Schema Courses (Colonnes manquantes)
1. Créenew query**
2. Ouvre le fichier `/supabase/fix_courses_schema.sql`
3. **Copie TOUT le contenu**
4. **Colle** dans le SQL Editor
5. Clique sur **RUN**

✅ **Vérification:** "Courses table schema fixed successfully"

#### C. Tables Manquantes (si besoin)
1. Crée une **nouvelle query**
2. Ouvre le fichier `/supabase/migrations/add_missing_tables.sql`
3. **Copie TOUT le contenu**
4. **Colle** dans le SQL Editor
5. Clique sur **RUN**

✅ **Vérification:** "Migration completed successfully"

### Étape 3: Configurer le Stockage (OBLIGATOIRE)

**Exécute le fichier `setup_storage.sql`:**

1. Dans le SQL Editor, crée une **nouvelle query**
2. Ouvre le fichier `/supabase/setup_storage.sql`
3. **Copie TOUT le contenu**
4. **Colle** dans le SQL Editor
5. Clique sur **RUN**

✅ **Vérification:** Tu devrais voir "Storage buckets configured successfully"

### Étape 4: Vérifier que Tout est OK

#### A. Vérifier les Tables

1. Va dans **Table Editor** (menu gauche)
2. Tu dois voir ces tables:
   - ✅ users
   - ✅ courses
   - ✅ folders
   - ✅ quiz_results
   - ✅ syntheses
   - ✅ tutor_messages
   - ✅ review_cards
   - ✅ planning_events
   - ✅ notifications
   - ✅ community_groups
   - ✅ community_posts
   - ✅ settings
   - ✅ pomodoro_stats
   - ✅ onboarding

#### B. Vérifier le Storage

1. Va dans **Storage** (menu gauche)
2. Tu dois voir ces buckets:
   - ✅ courses (pour les fichiers de cours)
   - ✅ avatars (pour les photos de profil)

## 🔐 Configuration OAuth (OPTIONNEL mais recommandé)

Pour la connexion Google:

1. Va dans **Authentication** > **Providers**
2. Active **Google**
3. Ajoute tes credentials OAuth (Client ID et Secret)
4. Ajoute l'URL de callback autorisée

## 🧪 Tester l'Application

Une fois les scripts exécutés:

1. **Vide le cache** du navigateur (Ctrl+Shift+Delete)
2. **Hard refresh** (Ctrl+F5)
3. **Connecte-toi** avec ton compte
4. **Teste l'upload** d'un fichier de cours
5. **Vérifie** que ça ne charge plus à l'infini

## ❓ Problèmes Courants

### "relation public.courses does not exist"
→ Tu n'as pas exécuté `schema.sql` correctement
→ Réexécute l'Étape 2

### "Storage bucket not found"
→ Tu n'as pas exécuté `setup_storage.sql`
→ Réexécute l'Étape 3

### "Row Level Security policy violation"
→ Les politiques RLS bloquent l'accès
→ Vérifie que tu es bien connecté avec un compte

### Toujours des chargements infinis
→ Vide complètement le cache
→ Redémarre le serveur de dev (`npm run dev`)

## 📊 Architecture Supabase

### Mapping Firestore → Supabase

| Firestore | Supabase |
|-----------|----------|
| `users/{userId}/courses` | Table `courses` avec `user_id` |
| `users/{userId}/syntheses` | Table `syntheses` avec `user_id` |
| `users/{userId}/quiz_results` | Table `quiz_results` avec `user_id` |
| Sub-collections | Tables avec foreign keys |
| Firebase Storage | Supabase Storage buckets |

### Sécurité (RLS)

Toutes les tables ont **Row Level Security** activé:
- Les utilisateurs ne voient QUE leurs propres données
- `auth.uid() = user_id` sur toutes les requêtes
- Impossible d'accéder aux données des autres

## 🎯 Prochaines Étapes

Après avoir configuré Supabase:

1. ✅ L'upload de cours fonctionnera
2. ✅ Les pages ne chargeront plus à l'infini
3. ✅ Toutes les fonctionnalités seront opérationnelles
4. ✅ La persistence de session fonctionnera

---

**Questions ?** Reviens vers moi si tu as des erreurs après avoir suivi ce guide !
