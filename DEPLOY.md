# 🚀 Guide de Déploiement Rapide

## Pour redéployer sur Netlify après ce fix CSP

### Option 1 : Déploiement automatique (recommandé)

Netlify redéploie automatiquement à chaque push sur la branche configurée.

**Étapes :**
1. Les commits sont déjà poussés sur `claude/website-help-QSRVH`
2. Va sur ton dashboard Netlify
3. Le déploiement devrait déjà être en cours
4. Attends que ça finisse (~2-3 minutes)
5. Teste Google Auth sur ton site

### Option 2 : Déploiement manuel via CLI

```bash
# Si tu as Netlify CLI installé
netlify deploy --prod
```

### Option 3 : Trigger manuel sur Netlify

1. Va sur [app.netlify.com](https://app.netlify.com)
2. Sélectionne ton site
3. **Deploys** → **Trigger deploy** → **Deploy site**

## ✅ Vérifier que le fix fonctionne

Après le déploiement :

1. **Vider le cache** : Ctrl+Shift+R (ou Cmd+Shift+R sur Mac)
2. **Ouvrir DevTools** (F12) → Console
3. **Tester Google Auth**
4. Aucune erreur CSP ne devrait apparaître !

## 🔍 Diagnostiquer si problème persiste

### Vérifier les headers appliqués

1. DevTools (F12) → **Network**
2. Rafraîchir la page
3. Cliquer sur le premier fichier (HTML)
4. **Headers** → Chercher `Content-Security-Policy`
5. Vérifier que `https://apis.google.com` est présent dans `script-src`

### Si CSP toujours incorrect

Le cache Netlify peut persister. Forcer un nouveau build :

1. Dashboard Netlify → **Site settings**
2. **Build & deploy** → **Post processing**
3. Désactiver puis réactiver "Asset optimization"
4. Trigger un nouveau deploy

---

**Dernière mise à jour :** 24 décembre 2024
