# 🔧 Fix Erreur Gemini API

## Problème

Erreur 400 : "Modèle IA non disponible. Contactez le support."

## Causes Possibles

### 1. Clé API Gemini Non Configurée ⚠️

La clé API n'est peut-être pas définie dans les secrets Firebase Functions.

**Solution :**
```powershell
firebase functions:secrets:set GEMINI_API_KEY
```

Quand il te demande la valeur, entre ta clé API Gemini.

**Obtenir une clé API :**
1. Va sur https://aistudio.google.com/apikey
2. Crée ou copie une clé API
3. Configure-la avec la commande ci-dessus

**Vérifier :**
```powershell
firebase functions:secrets:access GEMINI_API_KEY
```

### 2. Nom du Modèle Incorrect

Plusieurs noms sont possibles selon la version du SDK :

| Nom | Statut | SDK Version |
|-----|--------|-------------|
| `gemini-1.5-flash` | ✅ Recommandé | Toutes |
| `gemini-1.5-flash-latest` | ⚠️ Peut ne pas marcher | SDK récent uniquement |
| `gemini-1.5-flash-001` | ❌ Obsolète | Anciens SDK |
| `gemini-pro` | ⚠️ Ancien | Anciens SDK |

**Modèle actuellement utilisé :**
```javascript
model: "gemini-1.5-flash"
```

### 3. Quota API Dépassé

Si tu as fait beaucoup de tests, tu as peut-être dépassé le quota gratuit.

**Vérifier :**
1. Va sur https://aistudio.google.com/
2. Clique sur "Quota" dans le menu
3. Vérifie ton usage quotidien

**Quota gratuit :**
- 15 requêtes par minute
- 1 500 requêtes par jour
- 1 million de tokens par jour

## 🔍 Diagnostic Étape par Étape

### Étape 1 : Vérifier les Logs

```powershell
firebase functions:log --only generateContent --limit 20
```

**Si tu vois :**
- `"API key not valid"` → Problème de clé API
- `"Quota exceeded"` → Quota dépassé
- `"Model not found"` → Nom du modèle incorrect
- `"GEMINI_API_KEY is not defined"` → Secret non configuré

### Étape 2 : Tester la Clé API Localement

Crée un fichier `test-gemini.js` :
```javascript
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("TA_CLE_API_ICI");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function test() {
  try {
    const result = await model.generateContent("Dis bonjour");
    console.log("✅ Succès:", result.response.text());
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  }
}

test();
```

```powershell
cd functions
node test-gemini.js
```

### Étape 3 : Redéployer après Correction

```powershell
firebase deploy --only functions
```

## ✅ Solution Complète (Commandes)

```powershell
# 1. Configurer la clé API
firebase functions:secrets:set GEMINI_API_KEY
# Entre ta clé quand demandé

# 2. Vérifier la configuration
firebase functions:secrets:access GEMINI_API_KEY

# 3. Récupérer les dernières corrections
git pull origin claude/website-review-8cviU

# 4. Redéployer
firebase deploy --only functions

# 5. Tester
# Va sur ton site et teste la génération

# 6. Voir les logs
firebase functions:log --only generateContent --limit 10
```

## 🆘 Si Ça Ne Marche Toujours Pas

### Option A : Utiliser un Modèle Alternatif

Dans `functions/index.js`, essaye :
```javascript
model: "gemini-pro"  // Ancien mais stable
```

### Option B : Vérifier la Région

Certaines régions n'ont pas accès à tous les modèles. Vérifie dans Google AI Studio que Gemini est disponible dans ta région.

### Option C : Créer une Nouvelle Clé API

1. Va sur https://aistudio.google.com/apikey
2. Révoque l'ancienne clé
3. Crée une nouvelle
4. Reconfigure :
   ```powershell
   firebase functions:secrets:set GEMINI_API_KEY
   firebase deploy --only functions
   ```

## 📊 Checklist de Vérification

- [ ] Clé API Gemini créée sur https://aistudio.google.com/apikey
- [ ] Secret configuré avec `firebase functions:secrets:set GEMINI_API_KEY`
- [ ] Secret vérifié avec `firebase functions:secrets:access GEMINI_API_KEY`
- [ ] Fonction redéployée avec `firebase deploy --only functions`
- [ ] Logs vérifiés avec `firebase functions:log`
- [ ] Quota vérifié sur Google AI Studio
- [ ] Test effectué sur le site
- [ ] Erreurs spécifiques identifiées dans les logs

## 🔗 Ressources

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Firebase Functions Secrets](https://firebase.google.com/docs/functions/config-env)
- [Gemini Models List](https://ai.google.dev/models/gemini)
