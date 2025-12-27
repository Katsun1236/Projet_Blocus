# 🚀 Démarrage Rapide - Supabase + Vercel

Guide express pour migrer en **15 minutes**.

## ⚡ Étapes Rapides

### 1. Créer le projet Supabase (3 min)

1. [supabase.com](https://supabase.com) → **New project**
2. Name: `projet-blocus`, Region: **Europe (West)**, Plan: **Free**
3. Copie le **mot de passe database** quelque part

### 2. Importer la base de données (2 min)

1. Dans Supabase : **SQL Editor** → **New query**
2. Copie tout le contenu de `supabase/schema.sql`
3. Colle et **Run** (Ctrl+Enter)
4. ✅ Vérifie : **Table Editor** → Tu dois voir 12 tables

### 3. Configurer l'authentification (2 min)

1. **Authentication** → **Providers** :
   - ✅ Email : Activé
   - ✅ Google : Activé (garde les credentials par défaut)

### 4. Créer le bucket Storage (1 min)

1. **Storage** → **Create bucket**
2. Name: `courses`, Public: **✅ OUI**
3. File size: **50 MB**, MIME types: `application/pdf,image/*,application/vnd.*,text/*`

### 5. Copier les clés API (1 min)

**Settings** → **API** → Copie :
- ✅ **Project URL**
- ✅ **anon public** key

### 6. Mettre à jour le code (3 min)

Ouvre `assets/js/supabase-config.js` et remplace :

```javascript
const SUPABASE_URL = 'TON_URL_ICI'  // https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'TA_CLÉ_ICI'  // eyJhbGciOiJ...
```

### 7. Remplacer Firebase par Supabase (2 min)

Dans **TOUS** les fichiers JS, change :

```javascript
// AVANT
import { auth, db, storage } from './config.js'

// APRÈS
import { auth, db, storage } from './supabase-config.js'
```

**Fichiers à modifier** :
- `assets/js/courses.js`
- `assets/js/tutor.js`
- `assets/js/pomodoro.js`
- `assets/js/spaced-repetition.js`
- `assets/js/quiz.js`
- `assets/js/community.js`
- `assets/js/planning.js`
- `assets/js/synthesize.js`
- `assets/js/profile.js`
- Tous les fichiers dans `pages/auth/`

**Commande rapide** (pour remplacer automatiquement) :

```bash
# Sauvegarde d'abord !
git add -A && git commit -m "Before Supabase migration"

# Remplace tous les imports
find assets/js pages/auth -name "*.js" -type f -exec sed -i "s/from '\.\/config\.js'/from '.\/supabase-config.js'/g" {} +
find assets/js pages/auth -name "*.js" -type f -exec sed -i "s/from '\.\.\/\.\.\/assets\/js\/config\.js'/from '..\/..\/assets\/js\/supabase-config.js'/g" {} +
```

### 8. Déployer sur Vercel (3 min)

1. [vercel.com](https://vercel.com) → **New Project**
2. Import ton repo GitHub
3. **Environment Variables** :
   - `SUPABASE_URL` = ton URL
   - `SUPABASE_ANON_KEY` = ta clé
   - `GEMINI_API_KEY` = ta clé Gemini
4. **Deploy** !

---

## ✅ Vérification

Visite ton site Vercel et teste :

- [ ] **Inscription** : Créer un compte
- [ ] **Login** : Se connecter
- [ ] **Upload** : Ajouter un fichier de cours
- [ ] **Tuteur IA** : Envoyer un message
- [ ] **Pomodoro** : Démarrer un timer

---

## 🆘 Problèmes ?

### "Invalid API key"
→ Vérifie que tu as copié la **anon public** key (pas service_role)

### "RLS policy violation"
→ Tu dois être connecté pour accéder aux données

### "Module not found"
→ Vérifie que tous les imports pointent vers `supabase-config.js`

---

## 🎉 C'est tout !

Ton site est maintenant sur **Supabase + Vercel** (100% gratuit) et tu peux supprimer Firebase !

**Prochaines étapes** :
1. Supprimer les anciens fichiers Firebase : `assets/js/config.js`, `firebase.json`, `.firebaserc`
2. Commit et push les changements
3. Inviter tes premiers utilisateurs !
