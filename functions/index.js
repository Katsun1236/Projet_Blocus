const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {GoogleGenerativeAI} = require("@google/generative-ai");
const admin = require("firebase-admin");

admin.initializeApp();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
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
    throw new HttpsError(
        "failed-precondition",
        "Clé API serveur manquante.",
    );
  }

  if (!prompt) {
    throw new HttpsError(
        "invalid-argument",
        "Le prompt est obligatoire.",
    );
  }

  try {
    // Utiliser gemini-1.5-flash (rapide)
    // ou gemini-1.5-pro (puissant)
    const modelName = "gemini-1.5-flash";

    const generationConfig = {
      temperature: 0.7,
    };

    // Support natif du JSON avec les nouveaux modèles
    if (schema || mimeType === "application/json") {
      generationConfig.responseMimeType = "application/json";
      if (schema) {
        generationConfig.responseSchema = schema;
      }
    }

    let finalPrompt = prompt;

    // Aide pour le JSON (optionnel mais recommandé)
    if (mimeType === "application/json" && !schema) {
      finalPrompt += "\n\nIMPORTANT : Réponds uniquement " +
        "avec un JSON valide, sans markdown.";
    }

    const genModel = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: generationConfig,
    });

    // 4. Génération
    const result = await genModel.generateContent(finalPrompt);
    const response = await result.response;
    let text = response.text();

    // Nettoyage de sécurité
    text = text.replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

    return {text};
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new HttpsError(
        "internal",
        `Erreur Gemini (${error.status || "Inconnu"}): ` +
        `${error.message}`,
        error,
    );
  }
});
