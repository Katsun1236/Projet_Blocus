const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {GoogleGenerativeAI} = require("@google/generative-ai");
const admin = require("firebase-admin");

admin.initializeApp();

// La clé est récupérée depuis les variables d'environnement (.env) du serveur
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

exports.generateContent = onCall({cors: true}, async (request) => {
  // 1. Vérification de l'authentification (Sécurité)
  if (!request.auth) {
    throw new HttpsError(
        "unauthenticated",
        "Vous devez être connecté pour utiliser cette fonction.",
    );
  }

  // 2. Récupération des données envoyées par le client
  const {prompt, schema, model, mimeType} = request.data;

  if (!GEMINI_API_KEY) {
    throw new HttpsError("failed-precondition", "Clé API serveur manquante.");
  }

  if (!prompt) {
    throw new HttpsError("invalid-argument", "Le prompt est obligatoire.");
  }

  try {
    // 3. Configuration du modèle
    // MODIFICATION ICI : On passe à gemini-pro (plus stable)
    const modelName = model || "gemini-pro";

    const generationConfig = {
      // Si un mimeType spécifique est demandé (ex: json), on l'utilise
      // Sinon text/plain par défaut
      responseMimeType: mimeType || "text/plain",
    };

    // Si un schéma JSON est fourni, on l'ajoute à la config
    if (schema) {
      generationConfig.responseMimeType = "application/json";
      generationConfig.responseSchema = schema;
    }

    const genModel = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: generationConfig,
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
        "Erreur lors de la génération IA",
        error.message,
    );
  }
});