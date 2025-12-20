const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {GoogleGenerativeAI} = require("@google/generative-ai");
const admin = require("firebase-admin");

admin.initializeApp();

// La clé est récupérée depuis les variables d'environnement (.env)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialisation du client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

exports.generateContent = onCall({cors: true}, async (request) => {
  // 1. Vérification de l'authentification
  if (!request.auth) {
    throw new HttpsError(
        "unauthenticated",
        "Vous devez être connecté pour utiliser cette fonction.",
    );
  }

  const {prompt, schema, mimeType} = request.data;

  // 2. Vérifications de sécurité
  if (!GEMINI_API_KEY) {
    throw new HttpsError("failed-precondition", "Clé API serveur manquante.");
  }

  if (!prompt) {
    throw new HttpsError("invalid-argument", "Le prompt est obligatoire.");
  }

  try {
    // On reste sur "gemini-pro" car c'est le seul qui passe avec ta clé actuelle.
    const modelName = "gemini-pro";

    // CORRECTION 400 : On retire 'responseMimeType' et 'responseSchema'
    // car l'API v1 de gemini-pro ne les supporte pas.
    const generationConfig = {
      // Config vide pour éviter l'erreur "Unknown field"
    };

    // Adaptation manuelle : Si on veut du JSON, on l'ajoute dans le prompt
    let finalPrompt = prompt;
    if (schema || mimeType === "application/json") {
      finalPrompt += `
      
      IMPORTANT : Tu DOIS répondre uniquement avec un JSON valide brut.
      Pas de balises Markdown (\`\`\`json), pas d'intro, pas de conclusion.
      Juste le JSON.
      `;
    }

    const genModel = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: generationConfig,
    }, {
      // On garde v1 car c'est celle qui a accepté ta clé
      apiVersion: "v1",
    });

    // 4. Génération
    const result = await genModel.generateContent(finalPrompt);
    const response = await result.response;
    let text = response.text();

    // Nettoyage de sécurité si l'IA met quand même du markdown
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    return {text};
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new HttpsError(
        "internal",
        `Erreur Gemini (${error.status || "Inconnu"}): ${error.message}`,
        error,
    );
  }
});
