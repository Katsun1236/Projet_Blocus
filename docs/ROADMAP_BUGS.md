# 🗺️ ROADMAP COMPLÈTE - Projet Blocus

**Date:** 2025-12-27
**Version:** 2.0.0
**Status:** Migration Supabase - Refonte en cours

---

## 📊 RÉSUMÉ EXÉCUTIF

### État Actuel
- ✅ Architecture: Application JAMstack moderne avec Vite
- ✅ Base de données: Migration Firebase → Supabase COMPLÈTE
- ⚠️ **26 pages HTML** avec fonctionnalités riches
- ❌ **Bugs critiques bloquants** empêchant le fonctionnement

### Problèmes Majeurs Identifiés
1. **Wrapper Firestore incompatible** avec syntaxe Supabase
2. **Incohérence camelCase/snake_case** entre code JS et schéma DB
3. **auth.currentUser null** au chargement
4. **Collections imbriquées Firestore** non supportées par Supabase
5. **Realtime polling inefficace** au lieu de Supabase Realtime

---

## 🔴 PHASE 1: BUGS P0 - BLOQUANTS CRITIQUES (Priorité Maximale)

### Bug P0-1: `auth.currentUser` est null au chargement
**Fichiers affectés:** `quizz.js`, `profile.js`, `courses.js`, `tutor.js`, `synthesize.js`, `spaced-repetition.js`

**Problème:**
```javascript
// ❌ CASSÉ - auth.currentUser est null au chargement initial
const synthesisRef = collection(db, 'users', auth.currentUser.id, 'syntheses');
```

**Cause:** `auth.currentUser` est mis à jour de façon asynchrone dans `onAuthStateChanged`, mais le code l'utilise de manière synchrone.

**Localisation précise:**
- `quizz.js:69` - `collection(db, 'users', auth.currentUser.id, 'syntheses')`
- `quizz.js:96` - `collection(db, 'users', auth.currentUser.id, 'courses')`
- `profile.js:97` - `auth.currentUser.email`
- `courses.js:76` - `collection(db, 'users', currentUserId, 'courses')` ✅ (utilise variable locale)

**Solution:**
```javascript
// ✅ CORRECT - Utiliser la variable user du callback
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserId = user.id; // Stocker dans variable locale
        await loadData(user.id); // Passer en paramètre
    }
});

// OU utiliser getCurrentUser()
const user = await auth.getCurrentUser();
if (user) {
    const ref = collection(db, 'users', user.id, 'courses');
}
```

**Impact:** 🔥 BLOQUANT - Aucune donnée ne se charge
**Effort:** 2-3 heures
**Fichiers à modifier:** 9 fichiers JS

---

### Bug P0-2: Incohérence camelCase (JS) vs snake_case (DB)
**Fichiers affectés:** TOUS les fichiers utilisant `users` table

**Problème:**
```javascript
// ❌ Code JS utilise camelCase
const name = userData.firstName; // undefined
const avatar = userData.photoURL; // undefined

// ✅ DB Supabase utilise snake_case
// Schema: first_name, last_name, photo_url
```

**Localisation précise:**
- `profile.js:94-96` - `firstName`, `lastName`, `photoURL`
- `community.js:130-131` - `firstName`, `photoURL`
- `layout.js` - Probablement affecté
- `home.js` - Probablement affecté

**Solution 1 (Recommandée):** Mapper dans le wrapper Supabase
```javascript
// supabase-config.js - Ajouter mapping automatique
export async function getDoc(docRef) {
    const result = await docRef.get();
    if (result.exists()) {
        const data = result.data();
        // Mapper snake_case → camelCase pour users table
        if (docRef.tableName === 'users') {
            return {
                ...result,
                data: () => ({
                    ...data,
                    firstName: data.first_name,
                    lastName: data.last_name,
                    photoURL: data.photo_url
                })
            };
        }
    }
    return result;
}
```

**Solution 2 (Alternative):** Changer tout le code en snake_case
```javascript
// ❌ Plus long et risqué
const name = userData.first_name;
const avatar = userData.photo_url;
```

**Impact:** 🔥 BLOQUANT - Profils utilisateurs vides, avatars cassés
**Effort:** 4-5 heures (Solution 1) ou 8-10 heures (Solution 2)
**Fichiers à modifier:** 8-15 fichiers

---

### Bug P0-3: Collections Firestore imbriquées non supportées
**Fichiers affectés:** `quizz.js`, `courses.js`, `tutor.js`, `synthesize.js`, `spaced-repetition.js`, `planning.js`, `notifications.js`

**Problème:**
```javascript
// ❌ CASSÉ - Firestore permet sous-collections
collection(db, 'users', userId, 'courses')
// Supabase n'a PAS de sous-collections, seulement des tables plates

// Schéma Supabase actuel:
// Table: courses (user_id UUID, title TEXT, ...)
```

**Localisation précise:**
- `quizz.js:69` - `collection(db, 'users', auth.currentUser.id, 'syntheses')`
- `quizz.js:96` - `collection(db, 'users', auth.currentUser.id, 'courses')`
- `courses.js:76, 110` - `collection(db, 'users', currentUserId, 'courses')`
- `tutor.js` - Probablement `tutor_messages`
- `spaced-repetition.js` - Probablement `review_cards`

**Solution:** Utiliser tables plates avec filtres user_id
```javascript
// ✅ CORRECT pour Supabase
const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('user_id', userId);

// OU via wrapper mis à jour
const coursesRef = await collection(db, 'courses');
const q = query(coursesRef, where('user_id', '==', userId));
const courses = await getDocs(q);
```

**Modification du wrapper:**
```javascript
// supabase-config.js - REFACTOR collection()
export async function collection(dbRef, tableName, ...args) {
    // Si syntaxe Firestore imbriquée: collection(db, 'users', userId, 'courses')
    if (args.length >= 2) {
        const userId = args[0];
        const subCollection = args[1];

        // Mapper vers table Supabase
        // users/{id}/courses → courses (filtré par user_id)
        return await db.collection(subCollection).query().where('user_id', '==', userId);
    }

    // Sinon syntaxe simple: collection(db, 'courses')
    return await db.collection(tableName);
}
```

**Impact:** 🔥 BLOQUANT - Aucune donnée chargée (courses, quiz, tutor, flashcards)
**Effort:** 6-8 heures
**Fichiers à modifier:** `supabase-config.js` + 9 fichiers de features

---

## 🟠 PHASE 2: BUGS P1 - FONCTIONNALITÉS CASSÉES

### Bug P1-1: onSnapshot utilise polling au lieu de Realtime
**Fichiers affectés:** Tous les fichiers utilisant `onSnapshot()`

**Problème:**
```javascript
// supabase-config.js:428-446
// ❌ Polling inefficace toutes les 3 secondes
export function onSnapshot(queryOrDoc, callback) {
    const intervalId = setInterval(async () => {
        const data = await getDocs(queryOrDoc);
        callback(snapshot);
    }, 3000); // 😱 Mauvaise performance
}
```

**Solution:** Utiliser Supabase Realtime
```javascript
export function onSnapshot(queryOrDoc, callback) {
    const tableName = queryOrDoc.tableName || 'unknown';
    const userId = queryOrDoc.userId;

    // Subscribe to Supabase Realtime
    const channel = supabase
        .channel(`realtime:${tableName}:${userId}`)
        .on('postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: tableName,
                filter: `user_id=eq.${userId}`
            },
            (payload) => {
                // Reload data and call callback
                getDocs(queryOrDoc).then(data => {
                    const snapshot = {
                        docs: data.map(d => ({ id: d.id, data: () => d })),
                        empty: data.length === 0
                    };
                    callback(snapshot);
                });
            }
        )
        .subscribe();

    // Unsubscribe function
    return () => {
        supabase.removeChannel(channel);
    };
}
```

**Impact:** 🔥 Performance médiocre, batterie drainée, données pas en temps réel
**Effort:** 3-4 heures
**Fichiers à modifier:** `supabase-config.js`

---

### Bug P1-2: RLS Policies manquantes
**Tables affectées:** Potentiellement toutes

**Problème:** Certaines requêtes peuvent échouer avec "permission denied"

**Vérification nécessaire:**
```sql
-- Vérifier que TOUTES les tables ont RLS activé
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Vérifier les policies existantes
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

**Solution:** Exécuter `COMPLETE_MIGRATION.sql` et vérifier chaque table

**Impact:** 🟡 Certaines fonctionnalités peuvent échouer silencieusement
**Effort:** 2 heures
**Fichiers à modifier:** `supabase/schema.sql`, `supabase/COMPLETE_MIGRATION.sql`

---

### Bug P1-3: Upload storage sans gestion de progression
**Fichier:** `supabase-config.js:485-524`

**Problème:**
```javascript
// uploadBytesResumable simule la progression
// ❌ Pas de vraie progression pendant l'upload
if (progressCallback) {
    progressCallback({
        bytesTransferred: file.size,  // 😱 Faux - affiche 100% immédiatement
        totalBytes: file.size,
        state: 'success'
    });
}
```

**Solution:** Implémenter vraie progression avec XMLHttpRequest ou fetch avec streams
```javascript
export function uploadBytesResumable(storageRef, file) {
    return {
        on(event, onProgress, onError, onComplete) {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable && onProgress) {
                    onProgress({
                        bytesTransferred: e.loaded,
                        totalBytes: e.total,
                        state: 'running'
                    });
                }
            });

            // Upload via Supabase storage
            storageRef.put(file).then(...).catch(...);
        }
    };
}
```

**Impact:** 🟡 Mauvaise UX - pas de feedback pendant l'upload
**Effort:** 3 heures
**Fichiers à modifier:** `supabase-config.js`

---

## 🟡 PHASE 3: OPTIMISATIONS & CODE QUALITY

### Opt-1: Requêtes non optimisées - Pas de cache
**Problème:** Chaque page reload refetch toutes les données

**Solution:**
```javascript
// Créer un cache simple
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCachedDoc(docRef, cacheKey) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }

    const doc = await getDoc(docRef);
    cache.set(cacheKey, { data: doc, timestamp: Date.now() });
    return doc;
}
```

**Effort:** 4 heures

---

### Opt-2: Code dupliqué - Imports répétitifs
**Problème:** Chaque fichier importe 15-20 fonctions identiques

**Solution:** Créer `common.js`
```javascript
// assets/js/common.js
export * from './supabase-config.js';
export { initLayout } from './layout.js';
export { showMessage, formatDate } from './utils.js';

// Dans les fichiers:
import { auth, db, collection, getDocs, initLayout, showMessage } from './common.js';
```

**Effort:** 2 heures
**Fichiers:** Créer `common.js` + modifier 25 fichiers

---

### Opt-3: Console.log en production
**Problème:** Logs partout, même en production

**Solution:**
```javascript
// utils.js
export const logger = {
    log: (...args) => import.meta.env.DEV && console.log(...args),
    error: (...args) => console.error(...args),
    warn: (...args) => import.meta.env.DEV && console.warn(...args)
};

// Utilisation
logger.log('Debug info'); // Seulement en dev
logger.error('Critical error'); // Toujours affiché
```

**Effort:** 3 heures

---

### Opt-4: Pas de validation des données
**Problème:** Pas de sanitization avant insert DB

**Solution:**
```javascript
// validation.js - Étendre avec validations DB
export function validateUserInput(data, schema) {
    // Validate + sanitize
    // Throw error si invalide
}

// Avant insert:
const userData = validateUserInput(formData, userSchema);
await setDoc(userRef, userData);
```

**Effort:** 6 heures

---

## ✨ PHASE 4: FONCTIONNALITÉS MANQUANTES

### Feature-1: Système de cache
- Cache des profils utilisateurs
- Cache des groupes communautaires
- Invalidation automatique

**Effort:** 8 heures

---

### Feature-2: Gestion offline avec Service Worker
- Cache des pages statiques
- Queue des requêtes offline
- Sync quand reconnecté

**Effort:** 12 heures

---

### Feature-3: Notifications push
- Via Supabase Edge Functions
- Push notifications navigateur
- Email notifications

**Effort:** 10 heures

---

### Feature-4: Loading states / Skeletons
- Remplacer spinners par skeletons
- Feedback visuel partout
- Optimistic updates

**Effort:** 8 heures

---

## 🏗️ PHASE 5: REFACTORING ARCHITECTURE

### Refactor-1: Séparer logique et UI
**Problème:** Logique business mélangée avec DOM manipulation

**Solution:** Pattern MVC/MVP
```javascript
// services/CourseService.js
export class CourseService {
    async getCourses(userId) {
        return await supabase.from('courses').select('*').eq('user_id', userId);
    }
}

// controllers/CoursesController.js
export class CoursesController {
    async loadCourses() {
        const courses = await this.courseService.getCourses(this.userId);
        this.view.renderCourses(courses);
    }
}
```

**Effort:** 20 heures

---

### Refactor-2: Standardiser conventions
- **DB:** snake_case partout
- **JS:** camelCase partout
- Mapping automatique dans wrapper

**Effort:** 12 heures

---

### Refactor-3: System de routing
**Problème:** `window.location.href` partout

**Solution:** SPA avec routing client-side ou rester en MPA mais améliorer
```javascript
// router.js
export class Router {
    navigate(path) {
        // Handle navigation avec history API
        window.history.pushState({}, '', path);
    }
}
```

**Effort:** 8 heures (si garde MPA) ou 40 heures (si migrate vers SPA)

---

## 🧪 PHASE 6: TESTS

### Test-1: Tests unitaires
- Wrappers Supabase
- Utilities
- Validation functions

**Effort:** 16 heures

---

### Test-2: Tests E2E
- Playwright ou Cypress
- Critical user flows
- CI/CD integration

**Effort:** 24 heures

---

## 🔐 PHASE 7: SÉCURITÉ

### Sec-1: Validation côté serveur
- Créer Edge Functions
- Valider tous les inputs
- Rate limiting

**Effort:** 12 heures

---

### Sec-2: Sanitization des inputs
- XSS prevention (DOMPurify déjà installé)
- SQL injection impossible (Supabase)
- CSRF tokens si besoin

**Effort:** 6 heures

---

### Sec-3: Rate limiting
- Sur API calls Gemini
- Sur uploads
- Sur posts communautaires

**Effort:** 8 heures

---

## 📱 PHASE 8: RESPONSIVE & ACCESSIBILITY

### A11y-1: Accessibility audit
- ARIA labels
- Keyboard navigation
- Screen reader support
- WCAG AA compliance

**Effort:** 16 heures

---

### Responsive-1: Mobile-first review
- Tous les breakpoints
- Touch-friendly buttons
- Mobile navigation

**Effort:** 12 heures

---

## 🚀 PHASE 9: DÉPLOIEMENT & MONITORING

### Deploy-1: CI/CD Pipeline
- GitHub Actions
- Tests automatiques
- Deploy automatique Vercel

**Effort:** 8 heures

---

### Monitor-1: Error tracking
- Sentry integration
- Error boundaries
- User feedback

**Effort:** 6 heures

---

### Monitor-2: Analytics
- Plausible ou Google Analytics
- User behavior tracking
- Performance monitoring

**Effort:** 4 heures

---

## 📈 PLAN D'IMPLÉMENTATION DÉTAILLÉ

### Sprint 1: CRITIQUE (2-3 jours) ⚡
**Objectif:** Application fonctionnelle de base

✅ **Jour 1:**
- [ ] Bug P0-1: Fix auth.currentUser (3h)
- [ ] Bug P0-2: Mapping camelCase/snake_case (4h)

✅ **Jour 2:**
- [ ] Bug P0-3: Collections Firestore → Supabase (8h)

✅ **Jour 3:**
- [ ] Bug P1-1: onSnapshot Realtime (4h)
- [ ] Tests manuels de toutes les pages (3h)

**Livrables:**
- ✅ Authentification fonctionne
- ✅ Profils utilisateurs affichés
- ✅ Upload de fichiers fonctionne
- ✅ Quiz génèrent
- ✅ Communauté accessible

---

### Sprint 2: STABILISATION (2-3 jours) 🔧
**Objectif:** Corriger bugs restants et optimisations de base

- [ ] Bug P1-2: Vérifier RLS Policies (2h)
- [ ] Bug P1-3: Upload avec progression (3h)
- [ ] Opt-1: Cache simple (4h)
- [ ] Opt-2: common.js (2h)
- [ ] Opt-3: Logger conditionnel (3h)

---

### Sprint 3: AMÉLIORATION (1 semaine) ✨
**Objectif:** Features manquantes et UX

- [ ] Feature-1: Système de cache complet (8h)
- [ ] Feature-4: Loading states/skeletons (8h)
- [ ] Opt-4: Validation données (6h)
- [ ] Code cleanup (8h)

---

### Sprint 4: POLISH (1 semaine) 💎
**Objectif:** Production-ready

- [ ] Test-1: Tests unitaires (16h)
- [ ] Sec-1, Sec-2, Sec-3: Sécurité (26h)
- [ ] A11y-1: Accessibility (16h)

---

### Sprint 5: PRODUCTION (ongoing) 🚀
**Objectif:** Déploiement et monitoring

- [ ] Deploy-1: CI/CD (8h)
- [ ] Monitor-1, Monitor-2: Monitoring (10h)
- [ ] Documentation (8h)

---

## 🎯 OBJECTIFS MESURABLES

### Performance
- [ ] ⚡ < 2s temps de chargement initial
- [ ] ⚡ < 500ms navigation entre pages
- [ ] ⚡ Lighthouse Performance > 90
- [ ] ⚡ First Contentful Paint < 1.5s

### Qualité
- [ ] ✅ 0 erreurs console en production
- [ ] ✅ 0 bugs critiques (P0/P1)
- [ ] ✅ 100% fonctionnalités testées manuellement
- [ ] ✅ > 80% code coverage (tests unitaires)

### UX
- [ ] 📱 100% responsive (mobile/tablet/desktop)
- [ ] ♿ 100% accessible (WCAG AA)
- [ ] 🎨 Animations fluides 60fps
- [ ] 💬 Messages d'erreur user-friendly partout

### Sécurité
- [ ] 🔐 RLS activé sur TOUTES les tables
- [ ] 🔐 XSS prevention partout (DOMPurify)
- [ ] 🔐 Rate limiting sur APIs
- [ ] 🔐 Validation serveur pour inputs critiques

---

## 📊 MÉTRIQUES DE SUCCÈS

### Technique
- **Uptime:** > 99.5%
- **Error rate:** < 0.1%
- **API response time:** < 200ms (p95)

### Business
- **User registration:** Parcours complet sans erreur
- **File upload:** Success rate > 99%
- **Quiz completion:** 0 crashes

---

## 🚨 RISQUES IDENTIFIÉS

### Risque 1: Migration Firestore → Supabase incomplète
**Probabilité:** HAUTE
**Impact:** CRITIQUE
**Mitigation:**
- ✅ Déjà identifié dans P0-3
- Priorité maximale Sprint 1

### Risque 2: Gemini API rate limits
**Probabilité:** MOYENNE
**Impact:** MOYEN
**Mitigation:**
- Implémenter rate limiting côté client
- Queue system
- Fallback messages

### Risque 3: Supabase free tier limits
**Probabilité:** BASSE (en dev)
**Impact:** MOYEN
**Mitigation:**
- Monitor usage
- Optimiser requêtes
- Upgrade si nécessaire

---

## 📝 NOTES TECHNIQUES

### Tables Supabase Confirmées
✅ Existantes avec RLS:
- `users` (first_name, last_name, photo_url)
- `folders`
- `courses`
- `quiz_results`
- `tutor_messages`
- `review_cards`
- `pomodoro_stats`
- `settings`
- `community_groups`
- `community_posts`
- `notifications`
- `onboarding`

### APIs Externes
- **Gemini API:** Quiz, Synthèse, Tutor (clé: `VITE_GEMINI_API_KEY`)
- **Supabase:** Auth, DB, Storage, Realtime
- **Vercel:** Hosting

### Dépendances Critiques
- `@supabase/supabase-js@2` (via CDN esm.sh)
- Vite 5.0.10
- Tailwind CSS 3.4.1
- DOMPurify 3.0.6

---

## ✅ CHECKLIST FINALE

### Avant Production
- [ ] Tous les bugs P0 corrigés
- [ ] Tous les bugs P1 corrigés
- [ ] Tests manuels de tous les flows
- [ ] Lighthouse audit passé
- [ ] Sécurité audit passé
- [ ] Accessibility audit passé
- [ ] Documentation à jour
- [ ] Monitoring activé
- [ ] Backup strategy en place

---

**Dernière mise à jour:** 2025-12-27
**Prochaine review:** Après Sprint 1 (dans 3 jours)
**Owner:** Claude Code
**Statut:** 🔴 CRITIQUE - Corrections en cours
