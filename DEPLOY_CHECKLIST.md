# 🚀 DÉPLOIEMENT & CHECKLIST - POST-FIXES

**Pour déployer les changements de sécurité en production**

---

## ⚡ QUICK DEPLOY (30 MIN)

### Étape 1: Vérifier les changements localement
```bash
# 1. Pull latest changes
git pull origin main

# 2. Install dependencies
npm install

# 3. Test local build
npm run dev

# Dans le navigateur:
# ✓ Pas d'erreurs console
# ✓ Page charge correctement
# ✓ Pas de "Missing Supabase configuration"
```

### Étape 2: Régénérer les clés Supabase
```bash
# 1. Aller sur https://app.supabase.com/
# 2. Sélectionner ton projet
# 3. Settings → API
# 4. Copier la nouvelle ANON_KEY (Attention: c'est une clé publique, c'est normal)
# 5. Copier SUPABASE_URL aussi
```

### Étape 3: Configurer Vercel Secrets
```bash
# Option A: CLI Vercel
npm i -g vercel
vercel env add VITE_SUPABASE_URL
# Paste: https://your-project.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY
# Paste: eyJ... (la nouvelle clé)

# Option B: Dashboard Vercel
# 1. Aller sur vercel.com/dashboard
# 2. Projet "Projet Blocus"
# 3. Settings → Environment Variables
# 4. Add VITE_SUPABASE_URL
# 5. Add VITE_SUPABASE_ANON_KEY
```

### Étape 4: Créer .env.local pour local dev
```bash
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...paste-new-key...
VITE_APP_ENV=development
VITE_ENABLE_DEBUG=true
EOF
```

### Étape 5: Commit et Push
```bash
# Commit les changements
git add -A
git commit -m "fix(security): migrate to env-based config, add CSP headers, sanitize XSS

BREAKING: Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY env vars

Security improvements:
- Remove hardcoded Supabase keys
- Add DOMPurify XSS sanitization
- Implement CSP headers
- Add rate limiting utility
- Fix auth-guard race conditions
- Restrict CORS to whitelisted origins
- Improve password validation
- Add security headers

Closes: #XXX

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"

# Push vers main (auto-deploy on Vercel)
git push origin main
```

### Étape 6: Vérifier le déploiement
```bash
# Attendre ~3-5 min que Vercel finisse le build
# 1. Vérifier https://vercel.com/dashboard (status: Ready ✓)
# 2. Aller sur https://projet-blocus.vercel.app/
# 3. Vérifier que tout charge correctement

# Si ça échoue:
# 1. Vérifier les logs Vercel
# 2. Vérifier que les env vars sont configurés
# 3. Rollback: git revert HEAD
```

---

## ✅ POST-DEPLOY CHECKLIST

### Vérification Sécurité
- [ ] Accéder à https://projet-blocus.vercel.app/
- [ ] Ouvrir DevTools → Console
- [ ] Vérifier: **Aucune erreur** "Missing Supabase"
- [ ] Vérifier: **Aucun log** de clé Supabase
- [ ] Tester login page (pas de XSS)

### Vérification Headers
```bash
curl -I https://projet-blocus.vercel.app/

# Vérifier présence de:
# Content-Security-Policy: ✓
# X-Content-Type-Options: nosniff ✓
# X-Frame-Options: DENY ✓
```

### Vérification Fonctionnalité
- [ ] Page login charge
- [ ] Quiz page charge
- [ ] Pas d'erreur auth
- [ ] Mode dark/light fonctionne
- [ ] Mobile responsive OK

### Vérification Performance
```bash
# Lighthouse Check
# DevTools → Lighthouse
# Score Sécurité doit être: ≥ 80

# Bundle size (doit pas augmenter significantly)
npm run build
# dist/ size: doit être similaire à avant
```

---

## 🔒 SÉCURITÉ POST-DEPLOY

### Actions Immédiates
```bash
# 1. Nettoyer le .env local
rm .env
rm .env.local

# 2. Supprimer l'ancien .env du git history
git filter-repo --path .env --invert-paths

# 3. Vérifier qu'aucune clé n'est exposée
git log --all --oneline --source -S "eyJ" | grep -E "(commit|Supabase)" || echo "✓ No secrets found"

# 4. Force push to clean history (WARNING: only if needed)
# git push --force origin main  # Use with caution!
```

### Monitoring
```bash
# 1. Configurer monitoring (Sentry)
# - Aller sur sentry.io
# - Create new project → JavaScript
# - Copier DSN
# - TODO: Intégrer dans supabase-config.js

# 2. Vérifier rate limiting
# - Dans pages/auth/login.html
# - TODO: Ajouter import + intégration rate-limiter.js

# 3. Configurer alerts
# - Sentry → Alerts
# - Create alert pour erreurs critiques
```

---

## 🧪 TESTS RECOMMANDÉS

### Tests Manuels
```javascript
// 1. Test XSS Protection
// Dans console de pages/app/dashboard.html:
const malicious = '<img src=x onerror="alert(\'XSS\')">';
// Tenter d'injecter via input
// ✓ Doit bloquer (pas d'alert)

// 2. Test Rate Limiting
// À implémenter dans login page
// Tenter 6 logins rapides
// ✓ 6ème devrait être bloqué

// 3. Test Auth Timeout
// Accéder à pages/app/dashboard.html sans auth
// ✓ Doit timeout/redirect après 5s
```

### Tests Automatisés (À ajouter)
```bash
# npm install --save-dev @testing-library/dom

# tests/security.test.js
import { describe, it, expect } from 'vitest';
import DOMPurify from 'dompurify';

describe('Security', () => {
  it('should sanitize XSS', () => {
    const malicious = '<img src=x onerror="alert(1)">';
    const clean = DOMPurify.sanitize(malicious, { ALLOWED_TAGS: [] });
    expect(clean).toBe('');
  });
  
  it('should validate strong passwords', () => {
    // Test password validator
  });
  
  it('should rate limit login', () => {
    // Test rate limiter
  });
});

# npm run test
```

---

## 🐛 TROUBLESHOOTING

### Erreur: "Missing Supabase configuration"
```bash
# Solution:
# 1. Vérifier .env.local contient les bonnes values
# 2. Vérifier que VITE_SUPABASE_URL/KEY ne sont PAS undefined
# 3. Redémarrer: npm run dev
# 4. Vérifier dans Network tab que config se charge
```

### Erreur: "Failed to import module"
```bash
# Si DOMPurify import échoue:
# 1. Vérifier CDN is accessible: https://cdn.jsdelivr.net/
# 2. Vérifier CSP policy autorise cdn.jsdelivr.net
# 3. Vérifier import path: https://cdn.jsdelivr.net/gh/cure53/DOMPurify@3.0.6/dist/purify.es.js
```

### XSS Still Happening
```bash
# 1. Vérifier que TOUS les innerHTML utilisent DOMPurify
grep -r "\.innerHTML" assets/js/ | grep -v DOMPurify
# Doit être vide

# 2. Vérifier que sanitize() est appelé
grep -r "sanitize" assets/js/error-handler.js
# Doit afficher les appels

# 3. Vérifier ALLOWED_TAGS/ATTR
# Doit être restrictif
```

### Build Échoue
```bash
# 1. Vérifier node_modules
rm -rf node_modules package-lock.json
npm install

# 2. Vérifier syntax
npm run lint

# 3. Vérifier que dompurify est installé
npm list dompurify
# Si manquant: npm install dompurify

# 4. Vérifier imports ES6
# grep -r "import.*from.*http" assets/js/
# Doit utiliser cdn.jsdelivr.net URLs
```

---

## 📋 CHECKLIST FINALE

### Avant de Mercher en Production

- [ ] Tests locaux passent
- [ ] Build sans erreur
- [ ] Lint sans erreur
- [ ] .env.local configuré
- [ ] Vercel secrets configurés
- [ ] Commits messages OK
- [ ] Pas de secrets en git
- [ ] Code review OK
- [ ] Mobile tested
- [ ] Headers vérifiés
- [ ] Monitoring setup
- [ ] Rate limiting integré
- [ ] Documentation updated

### Avant d'Annoncer

- [ ] 24h monitoring sur production
- [ ] Pas d'erreurs Sentry
- [ ] Performance OK (Lighthouse ≥ 80)
- [ ] Users peuvent login/quiz/synthesize
- [ ] Mobile users OK
- [ ] SEO pas affecté
- [ ] Analytics tracking OK

---

## 📞 EN CAS DE PROBLÈME

### Emergency Rollback
```bash
# Si production est cassée:
git revert HEAD
git push origin main
# Vercel redéploie automatiquement la version précédente
```

### Contact Support
- **Sentry Errors**: https://sentry.io/dashboard/
- **Vercel Logs**: https://vercel.com/dashboard/
- **GitHub Issues**: https://github.com/Katsun1236/Projet_Blocus/issues

---

## 🎉 APRÈS LA DÉPLOIEMENT

### Communication
```markdown
Release v2.0.1 - Security Update 🔒

**Changelog:**
- ✅ Migrated to environment-based config (no more hardcoded secrets)
- ✅ Added XSS protection with DOMPurify
- ✅ Implemented Content Security Policy headers
- ✅ Added rate limiting infrastructure
- ✅ Fixed authentication race conditions
- ✅ Improved password strength requirements

**Impact:** Production-ready security improvements. No breaking changes for users.

**Migration:** Developers need to configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY env vars locally.
```

### Monitoring
- Activer alertes Sentry
- Monitor error rates
- Check performance metrics
- Vérifier user login success rate

---

**Deployé par**: [Your Name]  
**Date**: [Today]  
**Status**: ✅ Ready for Production
