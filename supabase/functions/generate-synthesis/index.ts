// Supabase Edge Function pour générer des synthèses avec Gemini AI
// Ceci tourne côté serveur, la clé API n'est jamais exposée au client

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

interface SynthesisRequest {
  mode: 'synthesis';
  topic: string;
  data?: string;
  options: {
    format: string;
    length: string;
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
    const request: SynthesisRequest = await req.json()
    const { topic, data, options } = request
    const { format, length } = options

    console.log('📝 Generating synthesis:', { topic, format, length })

    // Définir le nombre de mots en fonction de la longueur
    let wordCount = 300
    if (length === 'court') wordCount = 150
    else if (length === 'long') wordCount = 500

    // Adapter le prompt en fonction du format
    let formatInstructions = ''
    switch (format) {
      case 'resume':
        formatInstructions = `Rédige un résumé clair et structuré avec :
- Une introduction présentant le sujet
- Les points clés organisés en paragraphes
- Une conclusion synthétisant l'essentiel`
        break
      case 'flashcards':
        formatInstructions = `Génère des flashcards au format Question/Réponse.
Format strict à respecter:
Q: [Question]
R: [Réponse]

Q: [Question]
R: [Réponse]

Crée entre 10 et 15 flashcards pertinentes.`
        break
      case 'mindmap':
        formatInstructions = `Crée une mind map textuelle avec:
# Titre Principal
## Branche 1
- Sous-point 1.1
- Sous-point 1.2
## Branche 2
- Sous-point 2.1
- Sous-point 2.2`
        break
      case 'fiche':
        formatInstructions = `Crée une fiche de révision structurée avec:
## Définitions
- Terme 1: explication
- Terme 2: explication

## Points Clés
1. Point important 1
2. Point important 2

## À Retenir
- Élément essentiel 1
- Élément essentiel 2`
        break
      default:
        formatInstructions = 'Rédige un résumé clair et bien structuré.'
    }

    // Créer le prompt pour Gemini
    const prompt = `Tu es un assistant pédagogique expert en création de synthèses éducatives.

Sujet: ${topic}
${data ? `Contexte/Contenu: ${data}` : ''}

Format demandé: ${format}
Longueur: environ ${wordCount} mots

Instructions:
${formatInstructions}

IMPORTANT:
- Sois précis et pédagogique
- Utilise un langage clair et accessible
- Structure bien ton contenu avec des titres et sous-titres quand approprié
- Si le contexte est insuffisant, base-toi sur le titre du sujet pour générer un contenu pertinent
- N'ajoute pas de commentaires avant ou après le contenu, génère directement la synthèse

Génère maintenant la synthèse:`

    // Appeler l'API Gemini (modèle 1.5-flash : rapide et gratuit)
    // ✅ FIX: Utiliser v1beta avec le nom standard du modèle
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`

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
          maxOutputTokens: 4096,
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

    const content = data_response.candidates[0].content.parts[0].text.trim()

    console.log('✅ Synthesis generated successfully')

    return new Response(
      JSON.stringify({ content }),
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
