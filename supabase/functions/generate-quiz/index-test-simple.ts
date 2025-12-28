// 🧪 VERSION TEST ULTRA-SIMPLE
// Déploie cette version dans le Dashboard pour tester que ça fonctionne
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('✅ Function called!')

    // Retourne un quiz de test (sans appeler Gemini)
    const testQuiz = {
      questions: [
        {
          question: "Test: La fonction Supabase fonctionne ?",
          options: ["Oui", "Non", "Peut-être", "Je ne sais pas"],
          correctAnswer: 0
        },
        {
          question: "Test: Le déploiement est OK ?",
          options: ["Absolument", "Non", "Presque", "Bof"],
          correctAnswer: 0
        }
      ]
    }

    console.log('✅ Returning test quiz')

    return new Response(
      JSON.stringify(testQuiz),
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
      JSON.stringify({ error: error.message }),
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
