# 🚀 Configuration Supabase pour Projet Blocus

## 📋 Prérequis

1. Compte Supabase créé sur https://supabase.com
2. Projet Supabase créé
3. Clés API récupérées (SUPABASE_URL et SUPABASE_ANON_KEY)

## 🔧 Étapes de configuration

### 1. Exécuter le schéma principal

Dans le **SQL Editor** de Supabase, exécute dans l'ordre :

```sql
-- 1. Schéma principal (tables, policies, triggers)
-- Copie le contenu de schema.sql et exécute-le
```

### 2. Ajouter les champs d'onboarding

```sql
-- 2. Migration onboarding
-- Copie le contenu de add_onboarding_fields.sql et exécute-le
```

### 3. Fixer le schéma des courses

```sql
-- 3. Colonnes manquantes pour upload de cours
-- Copie le contenu de fix_courses_schema.sql et exécute-le
```

### 4. Configurer le stockage

```sql
-- 4. Buckets de stockage pour fichiers et avatars
-- Copie le contenu de setup_storage.sql et exécute-le
```

## 🔐 Configuration OAuth Google

### Dans Supabase Dashboard

1. Va dans **Authentication** → **Providers**
2. Active **Google**
3. Entre tes credentials OAuth :
   - Client ID
   - Client Secret

### Configuration des URLs de redirection

Dans **Authentication** → **URL Configuration**, ajoute :

**Redirect URLs:**
```
https://ton-site-vercel.vercel.app/pages/auth/callback.html
http://localhost:8000/pages/auth/callback.html
```

**Site URL:**
```
https://ton-site-vercel.vercel.app
```

## 📁 Structure des buckets de stockage

Après avoir exécuté `setup_storage.sql`, tu auras :

- **`courses`** : Fichiers de cours (PDF, images, etc.) - Max 20MB
- **`avatars`** : Photos de profil - Max 2MB

## ✅ Vérification

Pour vérifier que tout fonctionne :

1. **Tables créées :**
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public';
   ```

2. **Buckets créés :**
   - Va dans **Storage** → Tu dois voir `courses` et `avatars`

3. **Policies actives :**
   ```sql
   SELECT schemaname, tablename, policyname
   FROM pg_policies
   WHERE schemaname = 'public';
   ```

## 🎯 Flux d'authentification

### Nouvel utilisateur Google

1. Clic sur "Google" → Sélection de compte
2. OAuth Google → Retour sur `callback.html`
3. Callback détecte : pas d'entrée dans `users` table
4. Redirection vers `onboarding.html`
5. Remplissage profil (nom, école, avatar)
6. Sauvegarde avec `has_completed_onboarding: false`
7. Redirection vers `dashboard.html`
8. Dashboard lance le tutoriel automatiquement (Locus la mascotte)

### Utilisateur existant

1. Clic sur "Google" → Sélection de compte
2. OAuth Google → Retour sur `callback.html`
3. Callback trouve l'utilisateur dans `users`
4. Redirection directe vers `dashboard.html`
5. Pas de tutoriel (déjà complété)

## 🐛 Dépannage

### Erreur: "relation public.users does not exist"
→ Exécute `schema.sql`

### Erreur: "column has_completed_onboarding does not exist"
→ Exécute `add_onboarding_fields.sql`

### Upload de fichiers échoue
→ Vérifie que les buckets existent dans Storage
→ Exécute `setup_storage.sql`

### OAuth Google ne fonctionne pas
→ Vérifie les Redirect URLs dans Authentication → URL Configuration
→ Format: `https://ton-domaine.com/pages/auth/callback.html`

## 📞 Support

Pour toute question, consulte :
- Documentation Supabase: https://supabase.com/docs
- Documentation Projet Blocus: Voir SETUP_GUIDE.md
