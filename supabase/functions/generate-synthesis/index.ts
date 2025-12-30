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
    level: string;
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
    const { format, level, length } = options

    console.log('📝 Generating synthesis:', { topic, format, level, length })

    // Définir le nombre de mots en fonction de la longueur
    let wordCount = 300
    if (length === 'short') wordCount = 150
    else if (length === 'medium') wordCount = 300
    else if (length === 'long') wordCount = 500
    else if (length === 'complet') wordCount = 800

    // Adapter le prompt en fonction du niveau
    let levelInstructions = ''
    switch (level) {
      case 'debutant':
        levelInstructions = `Niveau DÉBUTANT : Utilise un vocabulaire simple et accessible. Évite le jargon technique. Explique les concepts comme si tu parlais à quelqu'un qui découvre le sujet pour la première fois. Utilise des analogies simples et des exemples de la vie quotidienne.`
        break
      case 'intermediaire':
        levelInstructions = `Niveau INTERMÉDIAIRE : Utilise une terminologie standard que les étudiants connaissent. Explique les concepts avec une précision raisonnable. Tu peux utiliser du jargon courant mais explique les termes plus techniques si nécessaire.`
        break
      case 'avance':
        levelInstructions = `Niveau AVANCÉ : Utilise une terminologie précise et des concepts complexes. Suppose que le lecteur a déjà des connaissances de base. N'hésite pas à entrer dans les détails techniques et les nuances.`
        break
      case 'expert':
        levelInstructions = `Niveau EXPERT : Utilise le jargon technique et les concepts les plus avancés. Suppose que le lecteur est un professionnel ou un chercheur dans le domaine. Tu peux utiliser des acronymes et des termes très spécifiques sans les expliquer.`
        break
      default:
        levelInstructions = 'Niveau intermédiaire : Utilise une terminologie standard.'
    }

    // Adapter le prompt en fonction du format
    let formatInstructions = ''
    switch (format) {
      case 'resume':
        formatInstructions = `Rédige un résumé clair et structuré avec :
📌 **INTRODUCTION** : Présentation du sujet et enjeux
🔑 **POINTS CLÉS** : 3-5 idées essentielles avec explications
💡 **DÉFINITIONS** : Termes importants expliqués simplement
⚠️ **PIÈGES À ÉVITER** : Erreurs communes à connaître
🎯 **CONCLUSION** : Synthèse finale et applications pratiques

Format : Utilise des émojis pour structurer, sois clair et pédagogique`
        break
      case 'flashcards':
        formatInstructions = `IMPORTANT: Tu DOIS générer UNIQUEMENT des flashcards au format Question/Réponse strict avec niveaux de difficulté.

Format OBLIGATOIRE:
[🟢 FACILE]
Q: [Question de base]
R: [Réponse directe]

[🟡 MOYEN]
Q: [Question nécessitant de la réflexion]
R: [Réponse expliquée]

[🔴 DIFFICILE]
Q: [Question complexe ou application]
R: [Réponse détaillée avec exemples]

RÈGLES STRICTES:
- 9-12 flashcards maximum (3 par niveau)
- Indique clairement le niveau de difficulté
- Questions variées (définitions, applications, comparaisons)
- Réponses complètes mais concises
- PAS de texte hors du format Q:/R:`
        break
      case 'mindmap':
        formatInstructions = `Crée une mind map hiérarchique avec approfondissement :

🧠 **[SUJET PRINCIPAL]**
├── 📚 **BRANCHE 1 : Concept Fondamental**
│   ├── 📍 Sous-concept A
│   │   └── 💡 Explication + Exemple
│   └── 📍 Sous-concept B
│       └── ⚠️ Piège commun à éviter
├── 🎯 **BRANCHE 2 : Applications**
│   ├── 📍 Application pratique A
│   └── 📍 Application pratique B
└── ❓ **BRANCHE 3 : Points d'approfondissement**
    ├── 📍 Question complexe 1
    └── 📍 Question complexe 2

Utilise les symboles └── ├── pour la hiérarchie`
        break
      case 'fiche':
        formatInstructions = `Crée une fiche de révision ultra-pédagogique :

🎯 **OBJECTIF** : Ce que tu dois savoir absolument

📖 **DÉFINITIONS ESSENTIELLES**
• **Terme 1** : Explication simple + Exemple concret
• **Terme 2** : Explication simple + Exemple concret

🔑 **3 POINTS CLÉS À RETENIR**
1️⃣ **Point 1** : Explication + Pourquoi c'est important
2️⃣ **Point 2** : Explication + Pourquoi c'est important  
3️⃣ **Point 3** : Explication + Pourquoi c'est important

💡 **MÉMO-TECHNIQUE** : Astuce pour mémoriser facilement

⚠️ **ERREURS FRÉQUENTES**
- ❌ Erreur 1 : Pourquoi c'est faux
- ❌ Erreur 2 : Pourquoi c'est faux

🎯 **APPLICATIONS** : Comment utiliser ce concept en pratique

❓ **POUR ALLER PLUS LOIN** : Questions de réflexion

Format : Utilise les émojis et structure claire`
        break
      case 'pedagogique':
        formatInstructions = `Crée une synthèse pédagogique progressive avec points d'approfondissement :

📚 **PARTIE 1 : LES BASES** (Niveau Débutant)
📍 Concept fondamental expliqué simplement
• Définition claire
• Exemple de tous les jours
• Pourquoi c'est important

📈 **PARTIE 2 : APPROFONDISSEMENT** (Niveau Intermédiaire)  
📍 Points clés à maîtriser
• Mécanismes et principes
• Liens entre les concepts
• Applications pratiques

🚀 **PARTIE 3 : MISE EN PRATIQUE** (Niveau Avancé)
📍 Cas concrets et exercices
• Problème type avec solution
• Méthode de résolution
• Astuces de pro

💬 **POINTS D'APPROFONDISSEMENT INTERACTIFS**
❓ **Question de compréhension** : [Question sur un point délicat]
💡 **Pour approfondir** : [Suggestion de recherche/exploration]
🎯 **Exercice pratique** : [Petit problème à résoudre]

🔄 **AUTO-ÉVALUATION**
- ✅ Je comprends le concept de base
- ✅ Je peux expliquer à quelqu'un d'autre  
- ✅ Je peux l'appliquer dans un exercice

Format : Très visuel avec émojis, progression par étapes`
        break
      case 'explicatif':
        formatInstructions = `Crée une explication détaillée avec analogies et exemples :

🎯 **CE QU'IL FAUT SAVOIR EN 30 SECONDES**
[Idée centrale résumée en une phrase]

🧩 **ANALOGIE SIMPLE**
Imagine que [concept] c'est comme [analogie concrète]...
• Explication de l'analogie
• Pourquoi ça aide à comprendre
• Limites de l'analogie

📖 **EXPLICATION DÉTAILLÉE**
📍 **Le quoi** : Définition précise
📍 **Le pourquoi** : Raisons et mécanismes  
📍 **Le comment** : Fonctionnement étape par étape

🌟 **EXEMPLES CONCRETS**
🏠 **Exemple de tous les jours** : [Situation familière]
🎓 **Exemple académique** : [Application dans les études]
💼 **Exemple professionnel** : [Utilisation pratique]

❓ **QUESTIONS QUE VOUS POUVEZ VOUS POSER**
• "Mais pourquoi..." → [Réponse]
• "Et si..." → [Réponse]  
• "Comment faire quand..." → [Réponse]

🎯 **POUR VÉRIFIER VOTRE COMPRÉHENSION**
[Petit exercice d'auto-évaluation avec solution]

Format : Très pédagogique, utilise des analogies, répond aux questions fréquentes`
        break
      default:
        formatInstructions = 'Rédige un résumé clair et bien structuré avec exemples concrets.'
    }

    // Créer le prompt pour Gemini
    const prompt = `Tu es un professeur passionné et pédagogue expert en création de contenus éducatifs adaptatifs. 
Ta mission : rendre n'importe quel sujet compréhensible et mémorable pour des étudiants.

Sujet: ${topic}
${data ? `Contexte/Contenu: ${data}` : ''}

Format demandé: ${format}
Niveau: ${level}
Longueur: environ ${wordCount} mots

Instructions pédagogiques :
${formatInstructions}

${levelInstructions}

🎯 PRINCIPES PÉDAGOGIQUES À RESPECTER :
- Commencer par le simple pour aller vers le complexe
- Utiliser des analogies et exemples concrets
- Anticiper les questions et blocages des étudiants
- Donner des astuces de mémorisation
- Proposer différents niveaux de lecture
- Inclure des points d'auto-évaluation
- Rendre le contenu visuel et structuré

💡 APPROFONDISSEMENT ADAPTATIF :
Pour chaque concept important, inclure :
- Une explication de base (niveau 1)
- Un exemple concret (niveau 2)  
- Une application pratique (niveau 3)
- Une question de réflexion (approfondissement)

❓ RÉPONDRE AUX QUESTIONS IMPLICITES :
Les étudiants se demandent souvent :
- "À quoi ça sert concrètement ?"
- "Pourquoi c'est important ?"
- "Comment je peux retenir ça ?"
- "Quelles sont les erreurs à éviter ?"

🎨 FORMAT VISUEL :
- Utilise les émojis pour structurer et guider la lecture
- Crée des repères visuels clairs
- Varie les types de contenu (listes, paragraphes, questions)
- Rends le contenu scannable rapidement

Génère maintenant cette synthèse pédagogique exceptionnelle :`

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
