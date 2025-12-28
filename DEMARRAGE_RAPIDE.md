# ⚡ DÉMARRAGE RAPIDE - 5 MINUTES

## 📖 Ouvre ce fichier: `CONFIGURATION_SUPABASE.md`

Il contient **TOUT** ce qu'il faut faire, étape par étape.

## 🎯 En résumé (lis quand même le guide complet):

### 1️⃣ Récupère tes clés Supabase
- Va sur https://supabase.com/dashboard
- Settings → API
- Copie `Project URL` et `anon public`

### 2️⃣ Configure la base de données
- Ouvre le SQL Editor dans Supabase
- Copie-colle **TOUT** le fichier `supabase/COMPLETE_SETUP.sql`
- Clique RUN
- Attends le message ✅

### 3️⃣ Configure Google OAuth
- Authentication → Providers → Google → Active
- Authentication → URL Configuration
- Ajoute ton domaine Vercel dans Redirect URLs:
  ```
  https://ton-site.vercel.app/pages/auth/callback.html
  ```

### 4️⃣ Met à jour ton code
Fichier: `assets/js/supabase-config.js` lignes 26-27:
```javascript
const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL', 'TA_URL_ICI');
const SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY', 'TA_CLÉ_ICI');
```

### 5️⃣ Vérifie que tout marche
- Exécute `supabase/VERIFICATION.sql` dans Supabase
- Tu dois voir que des ✅

### 6️⃣ Teste le site
```bash
git add .
git commit -m "Configure Supabase"
git push
```

Attends 2 min → Va sur ton site Vercel → Teste la connexion Google

---

## 🆘 SI ÇA NE MARCHE PAS

1. **Ouvre le guide complet**: `CONFIGURATION_SUPABASE.md`
2. **Lis CHAQUE étape** attentivement
3. **Vérifie les erreurs** dans la console (F12)
4. **Exécute** `supabase/VERIFICATION.sql`
5. **Contacte-moi** avec les erreurs exactes

---

## ✅ CHECKLIST RAPIDE

- [ ] Base de données configurée (`COMPLETE_SETUP.sql` exécuté)
- [ ] Buckets storage créés (`courses` et `avatars`)
- [ ] Google OAuth activé
- [ ] Redirect URLs configurées
- [ ] Clés API mises à jour dans le code
- [ ] Code commit & push
- [ ] Vercel a rebuild
- [ ] Test de connexion Google fonctionne

**Une fois que TOUT est ✅ → Le site marche à 100%**
