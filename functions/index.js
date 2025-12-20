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
    // TENTATIVE DE SAUVETAGE : On force le modèle le plus basique "gemini-pro"
    // C'est souvent celui qui est activé par défaut sur les vieux comptes.
    const modelName = "gemini-pro";

    const generationConfig = {
      responseMimeType: mimeType || "text/plain",
    };

    if (schema) {
      generationConfig.responseMimeType = "application/json";
      generationConfig.responseSchema = schema;
    }

    const genModel = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: generationConfig,
    }, {
      // Forcer l'utilisation de l'API v1 (stable) au lieu de v1beta
      apiVersion: "v1",
    });

    // 4. Génération
    const result = await genModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

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
