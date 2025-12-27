# 🚀 Migration Firebase → Supabase + Vercel

Guide complet pour migrer Projet Blocus vers Supabase et Vercel (100% gratuit).

## 📋 Prérequis

- [ ] Compte GitHub
- [ ] Compte Supabase (gratuit)
- [ ] Compte Vercel (gratuit)
- [ ] Clé API Gemini (pour le tuteur IA)

---

## PARTIE 1 : Configurer Supabase

### Étape 1 : Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com)
2. Clique **"Start your project"** → Connecte-toi avec GitHub
3. Clique **"New project"**
4. Remplis :
   - **Name** : `projet-blocus`
   - **Database Password** : Génère un mot de passe fort (GARDE-LE !)
   - **Region** : Europe (West)
   - **Pricing Plan** : Free
5. Clique **"Create new project"**
6. ⏱️ **Attends 2-3 minutes** que le projet soit créé

### Étape 2 : Exécuter le schéma SQL

1. Dans ton projet Supabase, va dans **SQL Editor** (icône dans la barre latérale)
2. Clique **"New query"**
3. **Copie tout le contenu** du fichier `supabase/schema.sql`
4. **Colle-le** dans l'éditeur SQL
5. Clique **"Run"** (ou Ctrl+Enter)
6. ✅ Tu devrais voir : "Success. No rows returned"

**Vérification** : Va dans **Table Editor** → Tu devrais voir toutes les tables créées.

### Étape 3 : Configurer l'authentification

1. Va dans **Authentication** → **Providers**
2. Active **Email** :
   - ✅ Enable Email provider
   - ✅ Confirm email : **Activé** (recommandé)
   - Sauvegarde
3. Active **Google OAuth** (optionnel) :
   - Clique sur **Google**
   - Active "Enable Sign in with Google"
   - Pour l'instant, utilise les credentials par défaut de Supabase
   - (Tu pourras configurer tes propres credentials plus tard)
   - Sauvegarde

### Étape 4 : Configurer le Storage (pour les fichiers de cours)

1. Va dans **Storage**
2. Clique **"Create a new bucket"**
3. Remplis :
   - **Name** : `courses`
   - **Public bucket** : ✅ **OUI** (pour que les étudiants puissent télécharger)
   - **File size limit** : 50 MB
   - **Allowed MIME types** : `application/pdf,image/*,application/vnd.*,text/*`
4. Clique **"Create bucket"**

### Étape 5 : Récupérer les clés API

1. Va dans **Settings** → **API**
2. **Copie ces 3 valeurs** (tu en auras besoin pour la config) :
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public** key (commence par `eyJ...`)
   - **service_role** key (garde-la secrète !)

---

## PARTIE 2 : Créer la configuration Supabase dans le projet

### Étape 6 : Créer le fichier de config

Je vais créer le fichier de configuration Supabase pour toi.

**Fichier** : `assets/js/supabase-config.js`

```javascript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ⚠️ REMPLACE CES VALEURS PAR LES TIENNES (de l'étape 5)
const supabaseUrl = 'TON_PROJECT_URL_ICI'
const supabaseAnonKey = 'TA_ANON_KEY_ICI'

// Créer le client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helpers pour l'authentification (compatible avec le code existant)
export const auth = {
    currentUser: null,

    async signInWithEmailAndPassword(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        if (error) throw error
        return { user: data.user }
    },

    async createUserWithEmailAndPassword(email, password) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        })
        if (error) throw error
        return { user: data.user }
    },

    async signInWithPopup(provider) {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google'
        })
        if (error) throw error
        return { user: data.user }
    },

    async signOut() {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    },

    async sendPasswordResetEmail(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/pages/auth/login.html'
        })
        if (error) throw error
    },

    onAuthStateChanged(callback) {
        // Récupérer l'utilisateur actuel
        supabase.auth.getUser().then(({ data }) => {
            callback(data.user)
        })

        // Écouter les changements
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            callback(session?.user ?? null)
        })

        return authListener.subscription
    }
}

// Helpers pour la base de données (compatibles avec Firestore)
export const db = {
    async collection(path) {
        const tableName = path.split('/').pop()
        return {
            tableName,

            async add(data) {
                const userId = (await supabase.auth.getUser()).data.user?.id
                const { data: result, error } = await supabase
                    .from(tableName)
                    .insert({ ...data, user_id: userId })
                    .select()
                    .single()

                if (error) throw error
                return { id: result.id, ...result }
            },

            async get() {
                const userId = (await supabase.auth.getUser()).data.user?.id
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .eq('user_id', userId)

                if (error) throw error
                return data
            },

            async where(field, operator, value) {
                const userId = (await supabase.auth.getUser()).data.user?.id
                let query = supabase.from(tableName).select('*').eq('user_id', userId)

                if (operator === '==') query = query.eq(field, value)
                else if (operator === '!=') query = query.neq(field, value)
                else if (operator === '<') query = query.lt(field, value)
                else if (operator === '<=') query = query.lte(field, value)
                else if (operator === '>') query = query.gt(field, value)
                else if (operator === '>=') query = query.gte(field, value)

                const { data, error } = await query
                if (error) throw error
                return data
            },

            async orderBy(field, direction = 'asc') {
                const userId = (await supabase.auth.getUser()).data.user?.id
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .eq('user_id', userId)
                    .order(field, { ascending: direction === 'asc' })

                if (error) throw error
                return data
            },

            async limit(n) {
                const userId = (await supabase.auth.getUser()).data.user?.id
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .eq('user_id', userId)
                    .limit(n)

                if (error) throw error
                return data
            }
        }
    },

    async doc(path, id) {
        const tableName = path.split('/').pop()

        return {
            async get() {
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .eq('id', id)
                    .single()

                if (error) throw error
                return { exists: () => !!data, data: () => data }
            },

            async set(data, options = {}) {
                const userId = (await supabase.auth.getUser()).data.user?.id

                if (options.merge) {
                    const { error } = await supabase
                        .from(tableName)
                        .update({ ...data, user_id: userId })
                        .eq('id', id)
                    if (error) throw error
                } else {
                    const { error } = await supabase
                        .from(tableName)
                        .insert({ ...data, id, user_id: userId })
                    if (error) throw error
                }
            },

            async update(data) {
                const { error } = await supabase
                    .from(tableName)
                    .update(data)
                    .eq('id', id)
                if (error) throw error
            },

            async delete() {
                const { error } = await supabase
                    .from(tableName)
                    .delete()
                    .eq('id', id)
                if (error) throw error
            }
        }
    }
}

// Storage (pour les fichiers de cours)
export const storage = {
    ref(path) {
        return {
            async upload(file) {
                const fileName = `${Date.now()}_${file.name}`
                const { data, error } = await supabase.storage
                    .from('courses')
                    .upload(fileName, file)

                if (error) throw error
                return { fullPath: data.path }
            },

            async getDownloadURL() {
                const { data } = supabase.storage
                    .from('courses')
                    .getPublicUrl(path)

                return data.publicUrl
            },

            async delete() {
                const { error } = await supabase.storage
                    .from('courses')
                    .remove([path])

                if (error) throw error
            }
        }
    }
}

// Timestamp helper
export const Timestamp = {
    now() {
        return new Date().toISOString()
    },
    fromDate(date) {
        return date.toISOString()
    }
}

export const serverTimestamp = () => new Date().toISOString()
```

---

## PARTIE 3 : Déployer sur Vercel

### Étape 7 : Préparer le projet pour Vercel

1. Crée un fichier `vercel.json` à la racine :

```json
{
  "buildCommand": "echo 'No build needed'",
  "outputDirectory": ".",
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

2. Crée un fichier `.env.local` (pour le dev local) :

```
VITE_SUPABASE_URL=ton_url_supabase
VITE_SUPABASE_ANON_KEY=ta_clé_anon
VITE_GEMINI_API_KEY=ta_clé_gemini
```

### Étape 8 : Déployer sur Vercel

1. Va sur [vercel.com](https://vercel.com)
2. Connecte-toi avec GitHub
3. Clique **"Add New..."** → **"Project"**
4. Importe ton repo **Projet_Blocus**
5. Configure :
   - **Framework Preset** : Other
   - **Root Directory** : `./`
   - **Build Command** : Laisse vide
   - **Output Directory** : `./`
6. **Environment Variables** :
   - `SUPABASE_URL` = ton URL Supabase
   - `SUPABASE_ANON_KEY` = ta clé anon
   - `GEMINI_API_KEY` = ta clé Gemini
7. Clique **"Deploy"**
8. ⏱️ Attends 1-2 minutes
9. ✅ Ton site est en ligne !

---

## PARTIE 4 : Tester

### Étape 9 : Vérifier que tout fonctionne

1. **Inscription** : Crée un nouveau compte
2. **Login** : Connecte-toi
3. **Upload** : Teste l'upload d'un fichier de cours
4. **Tuteur IA** : Envoie un message au tuteur
5. **Pomodoro** : Lance un timer
6. **Révisions** : Crée une carte de révision

---

## 📊 Avantages de Supabase vs Firebase

| Feature | Firebase | Supabase |
|---------|----------|----------|
| **Database** | NoSQL (Firestore) | PostgreSQL (SQL) |
| **Auth** | Bon | Excellent |
| **Storage** | Bon | Excellent |
| **Functions** | Cloud Functions | Edge Functions |
| **Pricing** | Complexe | Simple |
| **Free Tier** | Limité | Généreux |
| **Open Source** | ❌ | ✅ |
| **Self-Hosting** | ❌ | ✅ |

---

## 🆘 Aide et Support

**Problèmes courants** :

1. **"Invalid API key"** → Vérifie que tu as bien copié la clé anon (pas la service_role)
2. **"RLS policy violation"** → Vérifie que l'utilisateur est bien connecté
3. **"File upload failed"** → Vérifie que le bucket 'courses' est public

**Ressources** :
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
