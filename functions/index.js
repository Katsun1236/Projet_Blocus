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
    // On utilise le modèle le plus récent et léger
    const modelName = "gemini-1.5-flash";

    // Configuration de base sans fioritures pour maximiser la compatibilité
    const generationConfig = {
      temperature: 0.7, // Créativité standard
    };

    // Si on veut du JSON, on l'ajoute dans le prompt plutôt que dans la config
    // C'est la méthode "universelle" qui marche sur tous les modèles
    let finalPrompt = prompt;
    if (schema || mimeType === "application/json") {
      finalPrompt += `
      
      IMPORTANT: Réponds UNIQUEMENT avec un JSON valide. 
      Pas de Markdown, pas de \`\`\`json, pas de texte avant ou après.
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

    // Nettoyage de sécurité
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
