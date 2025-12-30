// Supabase Edge Function pour générer des quiz avec Gemini AI
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

interface QuizRequest {
  mode: 'quiz';
  topic: string;
  data?: string;
  options: {
    count: number;
    type: 'qcm' | 'vrai-faux' | 'remplissage' | 'chronologie' | 'association' | 'calcul';
    difficulty?: string;
    theme?: string;
    answerFormat?: string;
    focusConcepts?: boolean;
    focusApplications?: boolean;
    focusDefinitions?: boolean;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📥 Request received!')

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

    // Validation des entrées
    if (!topic || topic.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Topic is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!count || count < 1 || count > 30) {
      return new Response(
        JSON.stringify({ error: 'Count must be between 1 and 30' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!type || !['qcm', 'vrai-faux', 'remplissage', 'chronologie', 'association', 'calcul'].includes(type)) {
      return new Response(
        JSON.stringify({ error: 'Type must be "qcm", "vrai-faux", "remplissage", "chronologie", "association", or "calcul"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Créer le prompt pour Gemini
    const prompt = `Tu es un générateur de quiz éducatif. Génère un quiz au format JSON strict.

Sujet: ${topic}
${data ? `Contexte: ${data}` : ''}

Nombre de questions: ${count}
Type de questions: ${getTypeDescription(type)}
${options.difficulty ? `Difficulté: ${options.difficulty}` : ''}
${options.theme ? `Thème: ${options.theme}` : ''}
${options.answerFormat ? `Format des réponses: ${options.answerFormat}` : ''}

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

${getTypeInstructions(type)}

Génère exactement ${count} question${count > 1 ? 's' : ''}.`

    // Fonctions pour gérer les types de quiz
    function getTypeDescription(type: string): string {
      switch(type) {
        case 'qcm': return 'QCM (choix multiples)';
        case 'vrai-faux': return 'Vrai/Faux';
        case 'remplissage': return 'Remplissage à trous';
        case 'chronologie': return 'Chronologique';
        case 'association': return 'Association';
        case 'calcul': return 'Calcul / Problème';
        default: return 'QCM';
      }
    }

    function getTypeInstructions(type: string): string {
      switch(type) {
        case 'qcm':
          return `Pour QCM:
- Fournis 4 options par question
- correctAnswer est l'index (0, 1, 2 ou 3) de la bonne réponse
- Les questions doivent être pertinentes et éducatives`;
        
        case 'vrai-faux':
          return `Pour Vrai/Faux:
- Fournis exactement 2 options: ["Vrai", "Faux"]
- correctAnswer est 0 pour "Vrai" ou 1 pour "Faux"
- Les questions doivent être claires et non ambiguës`;
        
        case 'remplissage':
          return `Pour Remplissage à trous:
- Fournis 4 options par question avec 1 seule bonne réponse
- La question doit contenir un trou représenté par ___
- Les options doivent être des mots ou phrases pour compléter le trou
- correctAnswer est l'index de la bonne réponse`;
        
        case 'chronologie':
          return `Pour Chronologique:
- Fournis 4 options par question avec des dates ou événements
- Les questions doivent demander de classer chronologiquement
- correctAnswer est l'index du bon ordre
- Format: "Quel est l'ordre chronologique correct de..."`;
        
        case 'association':
          return `Pour Association:
- Fournis 4 options par question avec des paires à associer
- Les questions doivent demander d'associer des éléments
- correctAnswer est l'index de la bonne association
- Format: "Quel élément correspond à..."`;
        
        case 'calcul':
          return `Pour Calcul / Problème:
- Fournis 4 options par question avec des résultats numériques
- Les questions doivent être des problèmes de calcul
- correctAnswer est l'index du bon résultat
- Inclut des problèmes adaptés au niveau`;
        
        default:
          return `- Fournis 4 options par question
- correctAnswer est l'index de la bonne réponse`;
      }
    }

    // Appeler l'API Gemini
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`

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
