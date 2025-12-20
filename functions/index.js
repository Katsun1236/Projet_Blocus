const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {GoogleGenerativeAI} = require("@google/generative-ai");
const admin = require("firebase-admin");

admin.initializeApp();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

exports.generateContent = onCall({cors: true}, async (request) => {
  if (!request.auth) {
    throw new HttpsError(
        "unauthenticated",
        "Vous devez être connecté pour utiliser cette fonction.",
    );
  }

  const {prompt, schema, mimeType} = request.data;

  if (!GEMINI_API_KEY) {
    throw new HttpsError("failed-precondition", "Clé API serveur manquante.");
  }

  if (!prompt) {
    throw new HttpsError("invalid-argument", "Le prompt est obligatoire.");
  }

  try {
    // On réessaie avec le modèle standard actuel.
    // Si l'API est bien activée (Étape 1), ça DOIT marcher.
    const modelName = "gemini-1.5-flash";

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
    });

    const result = await genModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {text};
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new HttpsError(
        "internal",
        `Erreur Gemini: ${error.message}`,
        error,
    );
  }
});
