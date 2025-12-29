# 🚀 Déploiement des Edge Functions Supabase

Ce guide explique comment déployer les Edge Functions pour la génération de quiz avec l'IA.

## 📋 Prérequis

1. **Installer Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Se connecter à Supabase**
   ```bash
   supabase login
   ```

3. **Lier ton projet**
   ```bash
   supabase link --project-ref vhtzudbcfyxnwmpyjyqw
   ```
   (Trouve ton project-ref dans les settings de ton projet Supabase)

## 🔑 Étape 1 : Obtenir la clé API Gemini

1. Va sur : https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com
2. **Active l'API** Generative Language API
3. Va sur : https://aistudio.google.com/app/apikey
4. **Crée une clé API** et copie-la

## 🔐 Étape 2 : Configurer les secrets

Configure ta clé API Gemini en tant que secret Supabase :

```bash
supabase secrets set GEMINI_API_KEY=ta_vraie_cle_api_ici
```

**Exemple :**
```bash
supabase secrets set GEMINI_API_KEY=AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz
```

## 📦 Étape 3 : Déployer la fonction

Déploie la Edge Function `generate-quiz` :

```bash
supabase functions deploy generate-quiz
```

Tu devrais voir :
```
✓ Function deployed successfully
```

## ✅ Étape 4 : Vérifier le déploiement

1. Va dans ton **Supabase Dashboard** → **Edge Functions**
2. Tu devrais voir `generate-quiz` listée
3. Teste-la depuis le dashboard avec ce payload :

```json
{
  "mode": "quiz",
  "topic": "Les planètes du système solaire",
  "options": {
    "count": 3,
    "type": "qcm"
  }
}
```

## 🔧 Commandes utiles

```bash
# Voir les logs en temps réel
supabase functions logs generate-quiz --tail

# Lister tes secrets
supabase secrets list

# Mettre à jour un secret
supabase secrets set GEMINI_API_KEY=nouvelle_cle

# Redéployer après modifications
supabase functions deploy generate-quiz
```

## 🌐 Test dans l'application

Une fois déployée, ton application utilisera automatiquement la Edge Function.
Plus besoin de configurer la clé API dans le frontend !

**Avantages :**
- ✅ Clé API sécurisée côté serveur
- ✅ Pas d'exposition dans le code client
- ✅ Meilleure performance (edge computing)
- ✅ Logs centralisés

## ❌ Dépannage

**Erreur : "Function not found"**
- Vérifie que tu as bien lié ton projet : `supabase link --project-ref XXX`
- Redéploie la fonction : `supabase functions deploy generate-quiz`

**Erreur : "GEMINI_API_KEY not configured"**
- Configure le secret : `supabase secrets set GEMINI_API_KEY=ta_cle`
- Vérifie : `supabase secrets list`

**Erreur : "API key not valid"**
- Vérifie que tu as bien activé l'API Generative Language
- Crée une nouvelle clé sur https://aistudio.google.com/app/apikey
