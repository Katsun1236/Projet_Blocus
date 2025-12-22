const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialisation de Gemini
// Assure-toi d'avoir défini la variable d'environnement : firebase functions:config:set gemini.key="TON_API_KEY"
// Ou utilise process.env.GEMINI_API_KEY si tu utilises .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.generateContent = onCall({ cors: true }, async (request) => {
  // 1. Sécurité : Vérifier si l'utilisateur est connecté
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Vous devez être connecté pour utiliser l'IA.");
  }

  const { mode, topic, data, options } = request.data;
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    let prompt = "";
    let systemInstruction = "";

    // --- MODE QUIZ ---
    if (mode === "quiz") {
      const count = options.count || 5;
      const type = options.type || "qcm"; // qcm, truefalse
      
      systemInstruction = `
        Tu es un professeur expert capable de créer des quiz éducatifs précis.
        Ta réponse DOIT être exclusivement un objet JSON valide, sans Markdown (pas de \`\`\`json).
        Structure attendue :
        {
          "title": "Titre du Quiz",
          "questions": [
            {
              "question": "L'énoncé de la question ?",
              "options": ["Réponse A", "Réponse B", "Réponse C", "Réponse D"],
              "correctAnswer": 0, // Index de la bonne réponse (0, 1, 2 ou 3)
              "explanation": "Courte explication de pourquoi c'est la bonne réponse."
            }
          ]
        }
      `;

      prompt = `
        Génère un quiz de ${count} questions sur le sujet : "${topic}".
        Type de questions : ${type === 'truefalse' ? 'Vrai/Faux' : 'QCM à 4 choix'}.
        Niveau : Universitaire.
        Langue : Français.
        Si le sujet est un texte fourni, base-toi uniquement dessus : ${data || "Aucun texte fourni, utilise tes connaissances."}
      `;
    
    // --- MODE SYNTHÈSE ---
    } else if (mode === "synthesis") {
      const length = options.length || "medium"; // short, medium, long
      
      systemInstruction = `
        Tu es un expert en pédagogie et en synthèse de documents.
        Ton objectif est de résumer des cours complexes de manière claire, structurée et facile à mémoriser.
        Utilise le format Markdown pour la mise en forme (Gras, Listes à puces, Titres).
        Adopte un ton encourageant et direct.
      `;

      prompt = `
        Fais une synthèse ${length === 'short' ? 'très concise' : 'détaillée'} du sujet ou texte suivant :
        "${topic}"
        ${data ? `\nContenu du cours à résumer :\n${data}` : ''}
        
        Structure ta réponse comme suit :
        1. 🎯 **Concepts Clés** (Les 3-5 points essentiels)
        2. 📝 **Résumé Structuré** (Le corps du cours)
        3. 💡 **À Retenir** (Une conclusion mémorable)
      `;

    } else {
      throw new HttpsError("invalid-argument", "Mode invalide.");
    }

    // --- GÉNÉRATION ---
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        temperature: 0.7, // Créatif mais pas trop
        responseMimeType: mode === "quiz" ? "application/json" : "text/plain", // Force le JSON pour le quiz
      },
    });

    const responseText = result.response.text();

    // Parsing pour le Quiz (sécurité supplémentaire)
    if (mode === "quiz") {
      try {
        const jsonResponse = JSON.parse(responseText);
        return jsonResponse;
      } catch (e) {
        console.error("Erreur parsing JSON Gemini:", responseText);
        throw new HttpsError("internal", "L'IA a généré un format invalide. Réessayez.");
      }
    }

    // Retour texte brut pour la synthèse
    return { content: responseText };

  } catch (error) {
    console.error("Erreur Gemini:", error);
    throw new HttpsError("internal", "Erreur lors de la génération. " + error.message);
  }
});