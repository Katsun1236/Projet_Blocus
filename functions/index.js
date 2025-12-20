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
    // SOLUTION : On utilise "gemini-pro" qui est compatible avec ton compte
    const modelName = "gemini-pro";

    // IMPORTANT : On laisse la config vide car "gemini-pro" ne supporte pas
    // "responseMimeType" ni "responseSchema".
    const generationConfig = {
      // Config vide volontairement pour éviter l'erreur 400
      temperature: 0.7,
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
