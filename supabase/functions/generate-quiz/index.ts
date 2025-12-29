// Supabase Edge Function pour générer des quiz avec Gemini AI
// Ceci tourne côté serveur, la clé API n'est jamais exposée au client

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Récupérer la clé API depuis les secrets Supabase
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured in Supabase secrets')
    }

    // Parser la requête
    const request: QuizRequest = await req.json()
    const { topic, data, options } = request
    const { count, type } = options

    console.log('🎯 Generating quiz:', { topic, count, type })

    // Créer le prompt pour Gemini
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

    // Appeler l'API Gemini (modèle 1.5-flash : rapide et gratuit)
    // ✅ FIX: Utiliser v1 au lieu de v1beta (gemini-1.5-flash n'existe que dans v1)
    const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
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

    const aiText = data_response.candidates[0].content.parts[0].text

    // Nettoyer le JSON de la réponse
    let jsonText = aiText.trim()

    // Enlever les balises markdown si présentes
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '')
    }

    // Parser et retourner le quiz
    const quizData = JSON.parse(jsonText)

    console.log('✅ Quiz generated successfully')

    return new Response(
      JSON.stringify(quizData),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('❌ Error:', error)

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
