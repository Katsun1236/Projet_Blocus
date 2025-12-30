// Supabase Edge Function pour générer des quiz avec Gemini AI
// Ceci tourne côté serveur, la clé API n'est jamais exposée au client

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
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
    console.log('📥 Request received!')

    // Récupérer la clé API depuis les secrets Supabase
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured in Supabase secrets')
    }

    // Parser et valider la requête
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

    if (!count || count < 1 || count > 20) {
      return new Response(
        JSON.stringify({ error: 'Count must be between 1 and 20' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!type || !['qcm', 'vrai-faux'].includes(type)) {
      return new Response(
        JSON.stringify({ error: 'Type must be "qcm" or "vrai-faux"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🎯 Generating quiz:', { topic, count, type })

    // Créer le prompt pour Gemini avec instructions améliorées
    const prompt = `Tu es un professeur expert et générateur de quiz éducatif. Ta mission : créer des quiz pertinents et adaptés au niveau de l'étudiant.

Sujet: ${topic}
${data ? `Contexte: ${data}` : ''}

Nombre de questions: ${count}
Type de questions: ${type === 'qcm' ? 'QCM (choix multiples)' : 'Vrai/Faux'}

🎯 PRINCIPES PÉDAGOGIQUES :
- Questions claires et sans ambiguïté
- Options plausibles mais une seule correcte
- Difficulté progressive si possible
- Vocabulaire adapté au niveau étudiant
- Questions testant la compréhension réelle

📝 FORMAT OBLIGATOIRE :
Réponds UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après :

{
  "questions": [
    {
      "question": "Texte de la question claire et précise",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Explication brève de la bonne réponse"
    }
  ]
}

📋 SPÉCIFICATIONS :
${type === 'qcm' ? `- Fournis exactement 4 options par question
- Les options doivent être plausibles et de même longueur si possible
- Une seule bonne réponse (index 0, 1, 2 ou 3)` : `- Fournis exactement 2 options: ["Vrai", "Faux"]
- correctAnswer: 0 pour Vrai, 1 pour Faux`}
- Ajoute un champ "explanation" avec une explication concise
- Varie la complexité : questions de définition, d'application, d'analyse
- Évite les questions pièges ou trop spécifiques

Génère exactement ${count} question${count > 1 ? 's' : ''} de haute qualité pédagogique.`

    // Appeler l'API Gemini (modèle 2.5-flash : le plus récent et performant)
    // ✅ FIX: Utiliser le nom COMPLET avec préfixe "models/"
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

    // Nettoyer et parser le JSON de la réponse avec gestion d'erreurs
    let jsonText = aiText.trim()
    console.log('📝 Raw AI response:', jsonText.substring(0, 200) + '...')

    // Enlever les balises markdown si présentes
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '')
    }

    // Trouver le début et la fin du JSON
    const jsonStart = jsonText.indexOf('{')
    const jsonEnd = jsonText.lastIndexOf('}')
    
    if (jsonStart === -1 || jsonEnd === -1 || jsonStart >= jsonEnd) {
      throw new Error('Invalid JSON format in AI response')
    }

    jsonText = jsonText.substring(jsonStart, jsonEnd + 1)

    let quizData
    try {
      quizData = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError)
      console.error('❌ Invalid JSON:', jsonText)
      throw new Error('Failed to parse AI response as JSON')
    }

    // Valider la structure du quiz
    if (!quizData.questions || !Array.isArray(quizData.questions)) {
      throw new Error('Invalid quiz structure: missing questions array')
    }

    if (quizData.questions.length !== count) {
      console.warn(`⚠️ Expected ${count} questions, got ${quizData.questions.length}`)
    }

    // Valider chaque question
    for (let i = 0; i < quizData.questions.length; i++) {
      const question = quizData.questions[i]
      if (!question.question || !question.options || !Array.isArray(question.options) || 
          typeof question.correctAnswer !== 'number') {
        throw new Error(`Invalid question structure at index ${i}`)
      }

      if (type === 'qcm' && question.options.length !== 4) {
        throw new Error(`QCM question at index ${i} must have exactly 4 options`)
      }

      if (type === 'vrai-faux' && question.options.length !== 2) {
        throw new Error(`True/False question at index ${i} must have exactly 2 options`)
      }

      if (question.correctAnswer < 0 || question.correctAnswer >= question.options.length) {
        throw new Error(`Invalid correctAnswer index at question ${i}`)
      }
    }

    console.log('✅ Quiz generated and validated successfully')

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
