# 🎯 Déploiement via Dashboard Supabase (Sans CLI)

Guide simple pour déployer la fonction `generate-quiz` directement depuis l'interface web.

## 🔑 Étape 1 : Activer l'API Gemini et obtenir une clé

1. **Activer l'API** : https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com
   - Clique sur "Enable" (Activer)
   - Attends 30 secondes

2. **Créer une clé API** : https://aistudio.google.com/app/apikey
   - Clique sur "Create API Key"
   - Copie la clé (ex: `AIzaSyC1234...`)

## 📦 Étape 2 : Créer la Edge Function via Dashboard

1. **Va sur ton Dashboard** : https://supabase.com/dashboard/project/vhtzudbcfyxnwmpyjyqw/functions

2. **Clique sur "Create a new function"**

3. **Configure la fonction** :
   - **Name** : `generate-quiz`
   - **Editor** : Copie-colle le code ci-dessous

### Code de la fonction (index.ts)

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QuizRequest {
  mode: 'quiz';
  topic: string;
  data?: string;
  options: {
    count: number;
    type: 'qcm' | 'vrai-faux';
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    const request: QuizRequest = await req.json()
    const { topic, data, options } = request
    const { count, type } = options

    console.log('🎯 Generating quiz:', { topic, count, type })

    const prompt = `Tu es un générateur de quiz éducatif. Génère un quiz au format JSON strict.

Sujet: ${topic}
${data ? `Contexte: ${data}` : ''}

Nombre de questions: ${count}
Type de questions: ${type === 'qcm' ? 'QCM (choix multiples)' : 'Vrai/Faux'}

IMPORTANT: Réponds UNIQUEMENT avec un objet JSON valide au format suivant, sans texte avant ou après:

{
  "questions": [
    {
      "question": "Quelle est la question ?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0
    }
  ]
}

Pour ${type === 'qcm' ? 'QCM' : 'Vrai/Faux'}:
${type === 'qcm' ? '- Fournis 4 options par question' : '- Fournis exactement 2 options: ["Vrai", "Faux"]'}
- correctAnswer est l'index (0, 1, 2 ou 3) de la bonne réponse
- Les questions doivent être pertinentes et éducatives
- Varie la difficulté des questions

Génère exactement ${count} question${count > 1 ? 's' : ''}.`

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`)
    }

    const data_response = await response.json()
    if (!data_response.candidates || data_response.candidates.length === 0) {
      throw new Error('No response from Gemini API')
    }

    let jsonText = data_response.candidates[0].content.parts[0].text.trim()
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '')
    }

    const quizData = JSON.parse(jsonText)
    console.log('✅ Quiz generated')

    return new Response(JSON.stringify(quizData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
```

4. **Clique sur "Deploy"**

## 🔐 Étape 3 : Configurer le secret

1. **Va dans Settings** → **Edge Functions** → **Secrets**
   https://supabase.com/dashboard/project/vhtzudbcfyxnwmpyjyqw/settings/functions

2. **Clique sur "Add new secret"**

3. **Configure** :
   - **Name** : `GEMINI_API_KEY`
   - **Value** : Ta clé API Gemini (celle que tu as copiée)

4. **Clique sur "Save"**

## ✅ Étape 4 : Tester

1. **Actualise** ta page quiz
2. **Clique sur "Nouveau Quiz"**
3. **Génère un quiz** → Ça devrait fonctionner ! 🎉

## 📊 Voir les logs

Si ça ne marche pas, regarde les logs :
https://supabase.com/dashboard/project/vhtzudbcfyxnwmpyjyqw/logs/edge-functions

## ❓ Dépannage

**Erreur : "Function not found"**
- Vérifie que la fonction est bien déployée dans le Dashboard
- Vérifie que le nom est exactement `generate-quiz`

**Erreur : "GEMINI_API_KEY not configured"**
- Vérifie que tu as bien ajouté le secret dans Settings → Edge Functions → Secrets
- Le nom doit être exactement `GEMINI_API_KEY`

**Erreur : "API key not valid"**
- Vérifie que tu as bien activé l'API Generative Language
- Crée une nouvelle clé sur https://aistudio.google.com/app/apikey
