# 🗺️ ROADMAP - Projet Blocus

## ⚠️ BUGS CRITIQUES À CORRIGER (PRIORITÉ MAXIMALE)

### 🔴 P0 - Bloquants (empêchent le fonctionnement)

1. **auth.currentUser n'existe pas en Supabase**
   - **Fichiers:** `quizz.js`, `profile.js`
   - **Problème:** `auth.currentUser.id` renvoie undefined
   - **Solution:** Remplacer par `await supabase.auth.getUser()` ou stocker dans variable
   - **Impact:** Quiz et profil ne fonctionnent pas

2. **Incohérence camelCase vs snake_case**
   - **Fichiers:** Tous les JS (community, profile, etc.)
   - **Problème:** Code utilise `firstName` mais DB a `first_name`
   - **Solution:**
     - Option A: Mapper les réponses Supabase en camelCase (via wrapper)
     - Option B: Changer tout le code en snake_case
   - **Impact:** Données utilisateur non affichées

3. **Collections Firestore vs Tables Supabase**
   - **Fichiers:** `quizz.js`, `tutor.js`, etc.
   - **Problème:** `collection(db, 'users', userId, 'courses')` ne fonctionne pas
   - **Solution:** Utiliser directement `supabase.from('courses').select()`
   - **Impact:** Pas de données chargées

### 🟠 P1 - Critiques (fonctionnalités cassées)

4. **onSnapshot polling inefficace**
   - **Fichier:** `supabase-config.js`
   - **Problème:** Polling toutes les 3s au lieu de realtime
   - **Solution:** Utiliser Supabase Realtime channels
   - **Impact:** Performance médiocre, données pas en temps réel

5. **Wrapper Firestore incomplet**
   - **Fichier:** `supabase-config.js`
   - **Problème:** Les wrappers `doc()`, `collection()` ne fonctionnent pas comme Firebase
   - **Solution:** Refaire les wrappers pour vraiment émuler Firebase
   - **Impact:** Beaucoup de code cassé

6. **RLS Policies manquantes**
   - **Impact:** Certaines requêtes échouent avec "permission denied"
   - **Solution:** Compléter la migration SQL avec toutes les policies
   - **Tables concernées:** folders, courses, quiz_results, etc.

### 🟡 P2 - Importantes (UX dégradée)

7. **Onboarding ne se lance pas automatiquement**
   - **Fichiers:** `dashboard.html`, `onboarding.js`
   - **Problème:** Trigger SQL non exécuté + champ manquant
   - **Solution:** Exécuter COMPLETE_MIGRATION.sql

8. **Upload storage incomplet**
   - **Fichier:** `supabase-config.js`
   - **Problème:** Pas de gestion progression, pas de retry
   - **Solution:** Améliorer uploadBytesResumable

9. **Gestion d'erreurs absente**
   - **Tous fichiers**
   - **Problème:** Pas de try/catch, pas de messages d'erreur user-friendly
   - **Solution:** Ajouter error handling partout

---

## 🔧 OPTIMISATIONS NÉCESSAIRES

### Performance

10. **Requêtes non optimisées**
    - Multiple `getDocs()` au lieu de jointures
    - Pas de cache
    - Pas de lazy loading

11. **Imports répétitifs**
    - Même liste d'imports dans chaque fichier
    - Solution: Créer un fichier `common.js` avec exports groupés

12. **Code dupliqué**
    - Fonctions similaires dans plusieurs fichiers
    - Solution: Créer des utilities réutilisables

### Code Quality

13. **Console.log partout**
    - Supprimer ou remplacer par logger conditionnel

14. **Variables non utilisées**
    - Nettoyer le code mort

15. **Pas de validation des données**
    - Ajouter sanitization/validation

---

## ✨ FONCTIONNALITÉS MANQUANTES

### Essentielles

16. **Système de cache**
    - Cache des données utilisateur
    - Cache des requêtes fréquentes

17. **Gestion offline**
    - Service Worker
    - Cache API

18. **Notifications push**
    - Via Supabase Edge Functions

### Améliorations UX

19. **Loading states**
    - Skeletons
    - Spinners
    - Progress bars

20. **Messages d'erreur user-friendly**
    - Toast notifications
    - Feedback visuel

21. **Animations fluides**
    - Transitions entre pages
    - Micro-interactions

---

## 🏗️ STRUCTURE & ARCHITECTURE

### Refactoring

22. **Séparer logique et UI**
    - Créer des services
    - Créer des composants

23. **Standardiser les conventions**
    - snake_case partout pour DB
    - camelCase pour JS

24. **Créer un system de routing**
    - Au lieu de window.location.href partout

### Tests

25. **Ajouter tests unitaires**
    - Pour les wrappers Supabase
    - Pour les utilities

26. **Ajouter tests E2E**
    - Playwright ou Cypress

---

## 📊 MIGRATION SUPABASE

### Base de données

27. **Compléter le schéma**
    - Ajouter index manquants
    - Ajouter contraintes foreign key

28. **Ajouter toutes les RLS policies**
    - Pour chaque table
    - Documenter les permissions

29. **Créer les triggers manquants**
    - Auto-update timestamps
    - Cascade deletes

### Edge Functions

30. **Migrer Cloud Functions**
    - Quiz generation
    - Synthesis AI
    - Tutor AI

---

## 🔐 SÉCURITÉ

31. **Validation côté serveur**
    - Via Edge Functions ou Postgres functions

32. **Sanitization des inputs**
    - XSS prevention
    - SQL injection prevention

33. **Rate limiting**
    - Sur les API calls
    - Sur les uploads

---

## 📱 RESPONSIVE & ACCESSIBILITY

34. **Mobile-first**
    - Revoir tous les breakpoints
    - Touch-friendly

35. **Accessibility**
    - ARIA labels
    - Keyboard navigation
    - Screen reader support

---

## 🚀 DÉPLOIEMENT

36. **CI/CD Pipeline**
    - Tests automatiques
    - Deploy automatique

37. **Monitoring**
    - Sentry pour errors
    - Analytics

38. **Documentation**
    - API docs
    - User guide

---

## 📈 PLAN D'IMPLÉMENTATION

### Phase 1: CRITIQUE (1-2 jours)
- Bugs P0 (1-3)
- Migration SQL complète
- Tests basiques

### Phase 2: STABILISATION (2-3 jours)
- Bugs P1 (4-6)
- Bugs P2 (7-9)
- Optimisations de base

### Phase 3: AMÉLIORATION (1 semaine)
- Optimisations performance
- Code quality
- Fonctionnalités manquantes

### Phase 4: POLISH (1 semaine)
- UX improvements
- Tests
- Documentation

### Phase 5: PRODUCTION (ongoing)
- Monitoring
- Bug fixes
- Nouvelles features

---

## 🎯 OBJECTIFS MESURABLES

- ✅ 0 erreurs console
- ✅ 100% fonctionnalités testées
- ✅ < 2s temps de chargement
- ✅ Score Lighthouse > 90
- ✅ 0 bugs critiques
- ✅ 100% responsive
- ✅ 100% accessible (WCAG AA)

---

*Dernière mise à jour: $(date)*
