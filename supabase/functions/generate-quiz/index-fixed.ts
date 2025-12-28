// ✅ CORRIGÉ : Tout le code CORS est inline (pas d'import externe)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// CORS headers inline (requis pour le Dashboard)
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured in Supabase secrets')
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

    // Nettoyer les balises markdown
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '')
    }

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
      JSON.stringify({ error: error.message || 'Internal server error' }),
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
