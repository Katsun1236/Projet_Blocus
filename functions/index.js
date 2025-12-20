const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {GoogleGenerativeAI} = require("@google/generative-ai");
const admin = require("firebase-admin");

admin.initializeApp();

// La clé est récupérée depuis les variables d'environnement (.env) du serveur
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// MODIFICATION ICI : On initialise le client, la version se gère souvent automatiqument
// mais on va s'assurer que le modèle appelé est bien le bon.
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
    // On force "gemini-pro" qui est le modèle legacy stable
    // Si "gemini-1.5-flash" échoue, "gemini-pro" est le repli sûr.
    // Assure-toi que le frontend envoie bien "gemini-pro" ou rien (pour prendre le défaut ici)
    const modelName = "gemini-pro"; 

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
    // On renvoie l'erreur brute pour que tu la voies dans la console du navigateur (F12)
    // C'est temporaire pour le debug
    throw new HttpsError(
        "internal",
        `Erreur Gemini: ${error.message}`, 
        error
    );
  }
});
