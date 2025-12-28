# 🔧 CONFIGURATION COMPLÈTE SUPABASE

## ⚠️ IMPORTANT - À LIRE AVANT DE COMMENCER

Ce guide contient **TOUTES** les étapes pour configurer Supabase correctement.
**NE SAUTE AUCUNE ÉTAPE**, elles sont toutes essentielles.

---

## 📋 PRÉREQUIS

- [ ] Compte Supabase créé sur https://supabase.com
- [ ] Projet Supabase créé
- [ ] Accès au dashboard Supabase

---

## 🚀 ÉTAPE 1: RÉCUPÉRER LES CLÉS API

### 1.1 Aller dans Settings → API

1. Va sur https://supabase.com/dashboard
2. Sélectionne ton projet
3. Clique sur **⚙️ Project Settings** (icône engrenage en bas à gauche)
4. Clique sur **API** dans le menu de gauche

### 1.2 Copier les clés

Tu vas voir 2 clés importantes:

- **`Project URL`** → commence par `https://xxx.supabase.co`
- **`anon public`** → commence par `eyJh...`

**GARDE CES CLÉS**, on en aura besoin après.

---

## 🗄️ ÉTAPE 2: CONFIGURER LA BASE DE DONNÉES

### 2.1 Ouvrir le SQL Editor

1. Dans le dashboard Supabase, clique sur **🗄️ SQL Editor** (dans le menu de gauche)
2. Clique sur **➕ New query**

### 2.2 Exécuter le script de configuration

1. **Ouvre le fichier** `supabase/COMPLETE_SETUP.sql`
2. **Copie TOUT le contenu** du fichier (Ctrl+A puis Ctrl+C)
3. **Colle** dans le SQL Editor de Supabase
4. **Clique sur RUN** (ou Ctrl+Enter)

⏱️ **Attends 10-20 secondes** pendant l'exécution.

### 2.3 Vérifier le succès

Tu dois voir un message comme:

```
✅ Configuration Supabase terminée avec succès!
tables_created: 15
policies_created: 25+
storage_buckets: 2
```

✅ Si tu vois ça → **Parfait, continue !**

❌ Si tu vois des erreurs:
- Copie le message d'erreur complet
- Envoie-le moi
- **N'essaye pas de continuer** tant que ce n'est pas résolu

---

## 🔐 ÉTAPE 3: CONFIGURER GOOGLE OAUTH

### 3.1 Aller dans Authentication → Providers

1. Dans le dashboard Supabase
2. Clique sur **🔐 Authentication** (menu de gauche)
3. Clique sur **Providers**
4. Trouve **Google** et clique dessus

### 3.2 Activer Google OAuth

1. **Active** le toggle "Enable Sign in with Google"
2. **Laisse les champs vides** pour l'instant (Client ID et Secret)
3. **Scroll en bas** et clique **Save**

> 💡 **Note**: On utilise les credentials par défaut de Supabase pour l'instant

### 3.3 Configurer les URLs de redirection

1. **Toujours dans Authentication**, clique sur **URL Configuration**
2. Dans le champ **Redirect URLs**, ajoute:

```
https://ton-site-vercel.vercel.app/pages/auth/callback.html
http://localhost:8000/pages/auth/callback.html
```

**⚠️ REMPLACE** `ton-site-vercel.vercel.app` par **TON vrai domaine Vercel**

3. Dans **Site URL**, mets:

```
https://ton-site-vercel.vercel.app
```

4. **Scroll en bas** et clique **Save**

---

## 📦 ÉTAPE 4: VÉRIFIER LE STORAGE

### 4.1 Aller dans Storage

1. Dans le dashboard Supabase
2. Clique sur **📦 Storage** (menu de gauche)

### 4.2 Vérifier les buckets

Tu dois voir **2 buckets**:

- ✅ **courses** (20 MB limit) - Pour les fichiers de cours
- ✅ **avatars** (2 MB limit) - Pour les photos de profil

Si tu ne les vois PAS:
- Retourne à l'ÉTAPE 2 et ré-exécute le script COMPLETE_SETUP.sql
- Ou exécute juste `supabase/setup_storage.sql`

---

## 💻 ÉTAPE 5: CONFIGURER LE CODE

### 5.1 Mettre à jour les clés API

**Ouvre le fichier**: `assets/js/supabase-config.js`

**Trouve les lignes 26-27:**

```javascript
const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL', 'https://vhtzudbcfyxnwmpyjyqw.supabase.co');
const SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY', 'sb_publishable_05DXIBdO1dVAZK02foL-bA_SzobNKZX');
```

**Remplace par TES clés** (de l'ÉTAPE 1):

```javascript
const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL', 'TA_PROJECT_URL_ICI');
const SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY', 'TA_ANON_KEY_ICI');
```

### 5.2 Créer un fichier .env (optionnel mais recommandé)

Crée un fichier `.env` à la racine du projet:

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...
```

---

## ✅ ÉTAPE 6: TESTER LA CONFIGURATION

### 6.1 Ouvrir le SQL Editor

Dans Supabase, ouvre un nouveau SQL query et exécute:

```sql
-- Vérifier les tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Tu dois voir au minimum:**
- community_groups
- community_posts
- courses
- folders
- notifications
- planning_events
- pomodoro_stats
- quiz_results
- review_cards
- settings
- syntheses
- tutor_messages
- users

### 6.2 Vérifier les buckets

```sql
SELECT * FROM storage.buckets;
```

**Tu dois voir:**
- courses
- avatars

### 6.3 Vérifier les policies

```sql
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Tu dois avoir au moins 20 policies.**

---

## 🧪 ÉTAPE 7: TESTER L'AUTHENTIFICATION

### 7.1 Commit et push ton code

```bash
git add assets/js/supabase-config.js
git commit -m "Update Supabase API keys"
git push
```

### 7.2 Attendre le déploiement Vercel

⏱️ **Attends 2-3 minutes** que Vercel rebuild le site.

### 7.3 Tester la connexion Google

1. **Va sur ton site** Vercel
2. **Clique sur "Connexion"**
3. **Clique sur "Google"**
4. **Sélectionne un compte Google**

**🎯 Comportement attendu:**

**Si NOUVEAU compte:**
- Google OAuth se lance
- Retour sur le site
- Redirection vers `onboarding.html`
- Formulaire de profil (prénom, nom, école, avatar)
- Remplissage du formulaire
- Redirection vers `dashboard.html`
- **Le tutoriel Locus se lance automatiquement** 🦉

**Si compte EXISTANT:**
- Google OAuth se lance
- Retour sur le site
- Redirection directe vers `dashboard.html`
- Pas de tutoriel (déjà fait)

---

## ❌ PROBLÈMES COURANTS

### Erreur: "relation public.users does not exist"

**Solution:** Retourne à l'ÉTAPE 2 et ré-exécute `COMPLETE_SETUP.sql`

### Erreur: "Invalid API key"

**Solution:**
1. Vérifie que tu as bien copié les clés de l'ÉTAPE 1
2. Vérifie qu'il n'y a pas d'espaces avant/après les clés
3. Recommit et push le code

### Erreur: "bucket not found" lors de l'upload

**Solution:** Retourne à l'ÉTAPE 4 et ré-exécute `setup_storage.sql`

### OAuth Google ne fonctionne pas

**Solution:**
1. Vérifie que les Redirect URLs sont corrects (ÉTAPE 3.3)
2. Vérifie que le Site URL est correct
3. Vérifie que Google OAuth est activé dans Supabase

### Page reste blanche après Google login

**Solution:**
1. Ouvre la console navigateur (F12)
2. Regarde les erreurs
3. Vérifie que callback.html est bien dans le build Vite
4. Vérifie que les Redirect URLs correspondent EXACTEMENT

---

## 📞 BESOIN D'AIDE?

Si ça ne fonctionne **TOUJOURS PAS** après avoir suivi toutes les étapes:

1. **Ouvre la console du navigateur** (F12)
2. **Va dans l'onglet Console**
3. **Copie TOUTES les erreurs en rouge**
4. **Copie l'onglet Network** pour voir les requêtes qui échouent
5. **Envoie-moi tout ça**

---

## ✨ RÉCAPITULATIF

✅ Base de données configurée (15 tables)
✅ Policies RLS actives (20+)
✅ Storage buckets créés (courses, avatars)
✅ Google OAuth configuré
✅ Code mis à jour avec les clés API
✅ Système d'onboarding actif
✅ Tutoriel Locus prêt

**Le site doit maintenant fonctionner à 100% !** 🎉
