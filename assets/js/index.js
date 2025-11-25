// Ceci est le fichier de code pour Firebase Cloud Functions (Node.js)

const functions = require('firebase-functions');
const { GoogleGenAI } = require('@google/genai');

// Initialisez le client GenAI avec la clé API stockée en dur (pour le prototype)
// REMPLACER process.env.GEMINI_API_KEY par la clé fournie.
const ai = new GoogleGenAI({ apiKey: "AIzaSyAaeATbGjXfsYLxprAJWwxIBgS3-JO8ITQ" }); 

// Fonction HTTP pour générer la synthèse
exports.generateSynthesis = functions.https.onCall(async (data, context) => {
    // 1. Vérification d'authentification (TRÈS IMPORTANT)
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'L\'utilisateur doit être connecté pour appeler cette fonction.');
    }

    const { prompt } = data;

    if (!prompt) {
        throw new functions.https.HttpsError('invalid-argument', 'Le prompt est manquant.');
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-09-2025",
            contents: [{ parts: [{ text: prompt }] }]
        });

        const synthesisContent = response.candidates[0].content.parts[0].text;
        
        // Retourne le contenu généré
        return { content: synthesisContent };

    } catch (error) {
        console.error("Erreur Gemini API:", error);
        throw new functions.https.HttpsError('internal', "Erreur lors de la communication avec l'API Gemini.");
    }
});