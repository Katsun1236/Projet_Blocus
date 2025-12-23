const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialisation de Gemini
// Assure-toi d'avoir défini la variable d'environnement : firebase functions:config:set gemini.key="TON_API_KEY"
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.generateContent = onCall({ cors: true }, async (request) => {
  // 1. Sécurité : Vérifier si l'utilisateur est connecté
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Vous devez être connecté pour utiliser l'IA.");
  }

  // Récupération des paramètres sécurisés (plus de 'prompt' direct venant du client)
  const { mode, topic, data, options } = request.data;
  
  // 2. Sécurité : Force l'utilisation du modèle Flash (rapide & pas cher) pour tout le monde
  // Impossible pour un utilisateur de forcer 'gemini-pro' ou 'gemini-ultra'
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    let prompt = "";
    let systemInstruction = "";

    // --- MODE QUIZ ---
    if (mode === "quiz") {
      const count = options.count || 5;
      const type = options.type || "qcm"; // qcm, truefalse
      
      systemInstruction = `
        Tu es un professeur expert universitaire.
        Ta réponse DOIT être exclusivement un objet JSON valide, sans Markdown.
        Structure : { "title": "Titre", "questions": [{ "question": "...", "options": ["..."], "correctAnswer": 0, "explanation": "..." }] }
      `;

      prompt = `
        Sujet : "${topic}".
        Contexte : ${data ? data.substring(0, 10000) : "Connaissances générales"}.
        Génère ${count} questions de type ${type}.
        Niveau : Universitaire. Langue : Français.
      `;
    
    // --- MODE SYNTHÈSE (Sécurisé & Amélioré) ---
    } else if (mode === "synthesis") {
      const length = options.length || "medium"; // short, medium, long
      const format = options.format || "summary"; // summary, flashcards, plan, glossary
      
      systemInstruction = `
        Tu es un expert en pédagogie et en synthèse de documents pour étudiants.
        Ton objectif est de produire du contenu de révision structuré en HTML pur (sans balises <html>, <head> ou <body>).
        
        Règles de formatage HTML obligatoires :
        - Utilise des balises <h2>, <h3> pour les titres.
        - Utilise <ul> et <li> pour les listes.
        - Utilise <strong> pour les mots-clés.
        - N'utilise PAS de Markdown (\`**gras**\`), uniquement du HTML.
        - Ton output sera injecté directement dans une <div>.
      `;

      // Construction du prompt spécifique selon le format demandé (Backend logic)
      let formatInstruction = "";
      switch (format) {
        case 'flashcards':
            formatInstruction = `
                Génère une liste de concepts clés sous forme de cartes.
                Pour chaque concept, utilise EXACTEMENT cette structure HTML :
                <div class="flashcard p-4 mb-4 bg-gray-800 border border-gray-700 rounded-lg">
                    <h4 class="text-indigo-400 font-bold mb-2">Concept / Question</h4>
                    <p class="text-gray-300">Explication ou réponse concise.</p>
                </div>
            `;
            break;
        case 'plan':
            formatInstruction = "Génère un plan de cours détaillé et structuré (I. II. III.) avec des titres clairs.";
            break;
        case 'glossary':
            formatInstruction = `
                Génère un glossaire des termes techniques.
                Utilise cette structure :
                <dl class="space-y-4">
                    <div class="bg-gray-800/50 p-3 rounded">
                        <dt class="text-indigo-400 font-bold">Terme</dt>
                        <dd class="text-gray-300 text-sm mt-1">Définition</dd>
                    </div>
                </dl>
            `;
            break;
        default: // summary
            formatInstruction = `
                Structure la réponse ainsi :
                <h2>🎯 Concepts Clés</h2> (Liste à puces)
                <h2>📝 Résumé du Cours</h2> (Paragraphes structurés)
                <h2>💡 Conclusion</h2> (Phrase mémorable)
            `;
      }

      prompt = `
        Rédige un contenu de type "${format}" sur le sujet suivant :
        Sujet : "${topic}"
        Longueur souhaitée : ${length} (short=concis, long=détaillé)
        
        ${data ? `Basé sur le contenu suivant :\n${data.substring(0, 20000)}` : ''}
        
        Consignes spécifiques au format :
        ${formatInstruction}
      `;

    } else {
      throw new HttpsError("invalid-argument", "Mode invalide.");
    }

    // --- GÉNÉRATION ---
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        temperature: 0.7,
        responseMimeType: mode === "quiz" ? "application/json" : "text/plain",
      },
    });

    const responseText = result.response.text();

    // Traitement post-génération
    if (mode === "quiz") {
      try {
        // Nettoyage au cas où l'IA mettrait quand même du markdown json
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
      } catch (e) {
        console.error("JSON Error:", responseText);
        throw new HttpsError("internal", "Format de quiz invalide généré.");
      }
    } else {
      // Pour la synthèse, on nettoie les balises markdown éventuelles
      let cleanHtml = responseText.replace(/```html/g, '').replace(/```/g, '').trim();
      return { content: cleanHtml };
    }

  } catch (error) {
    console.error("Erreur Gemini:", error);
    throw new HttpsError("internal", error.message);
  }
});