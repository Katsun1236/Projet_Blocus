
const {onCall, HttpsError} = require("firebase-functions/v2/https");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-1.5-flash";

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

exports.generateContent = onCall({cors: true}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated",
        "Vous devez être connecté pour utiliser l'IA.");
  }

  const inputData = request.data || {};
  const {mode, topic, data, options} = inputData;

  if (!mode) {
    throw new HttpsError("invalid-argument",
        "Le paramètre 'mode' est manquant.");
  }

  try {
    let prompt = "";
    let systemInstruction = "";

    if (mode === "quiz") {
      const quizOptions = options || {};
      const count = quizOptions.count || 5;
      const type = quizOptions.type || "qcm";

      systemInstruction = "Tu es un professeur expert universitaire. " +
        "Ta réponse DOIT être exclusivement un objet JSON valide. " +
        "Structure : { \"title\": \"...\", \"questions\": [...] }";

      prompt = `Sujet: "${topic || "Général"}". ` +
        `Contexte: ${data ? String(data).substring(0, 5000) : "Aucun"}. ` +
        `Génère ${count} questions de type ${type}. Langue: Français.`;

    } else if (mode === "synthesis") {
      const synthOptions = options || {};
      const length = synthOptions.length || "medium";
      const format = synthOptions.format || "summary";

      systemInstruction = "Expert en pédagogie. Output HTML pur. " +
        "Utilise <h2>, <ul>, <strong>. Pas de Markdown. " +
        "Pas de balises <html>, <head>.";

      let formatInstruction = "";
      switch (format) {
        case "flashcards":
          formatInstruction = "Format: <div class=\"flashcard p-4 mb-4 " +
            "bg-gray-800 border border-gray-700 rounded-lg\">" +
            "<h4 class=\"text-indigo-400 font-bold mb-2\">Question</h4>" +
            "<p class=\"text-gray-300\">Réponse</p></div>";
          break;
        case "plan":
          formatInstruction = "Format: Plan détaillé (I. II. III.)";
          break;
        case "glossary":
          formatInstruction = "Format: <dl><div class=\"bg-gray-800/50 p-3\">" +
            "<dt class=\"text-indigo-400\">Terme</dt>" +
            "<dd class=\"text-gray-300\">Def</dd></div></dl>";
          break;
        default:
          formatInstruction = "Format: <h2>Concepts</h2>, " +
            "<h2>Résumé</h2>, <h2>Conclusion</h2>";
      }

      prompt = `Rédige un contenu type "${format}" sur "${topic}". ` +
        `Longueur: ${length}. ` +
        `${data ? `Basé sur: ${String(data).substring(0, 10000)}` : ""} ` +
        `Consignes: ${formatInstruction}`;
    } else {
      throw new HttpsError("invalid-argument", "Mode invalide.");
    }

    const requestBody = {
      contents: [{
        role: "user",
        parts: [{text: prompt}],
      }],
      systemInstruction: {
        parts: [{text: systemInstruction}],
      },
      generationConfig: {
        temperature: 0.7,
        responseMimeType: mode === "quiz" ? "application/json" : "text/plain",
      },
    };

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error details:", errorText);
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();

    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
         throw new Error("Réponse vide de l'IA (Filtrage de sécurité possible)");
    }

    const responseText = result.candidates[0].content.parts[0].text;

    if (mode === "quiz") {
      try {
        const cleanJson = responseText.replace(/```json/g, "")
            .replace(/```/g, "").trim();
        return JSON.parse(cleanJson);
      } catch (e) {
        console.error("JSON Parse Error:", responseText);
        throw new HttpsError("internal", "Format invalide généré par l'IA.");
      }
    } else {
      const cleanHtml = responseText.replace(/```html/g, "")
          .replace(/```/g, "").trim();
      return {content: cleanHtml};
    }
  } catch (error) {
    console.error("Error in generateContent:", {
      errorMessage: error.message,
      errorCode: error.code,
      mode,
      topic,
    });

    if (error.message && error.message.includes("API key")) {
      throw new HttpsError("failed-precondition",
          "Clé API Gemini invalide ou manquante.");
    }
    if (error.message && error.message.includes("quota")) {
      throw new HttpsError("resource-exhausted",
          "Quota API dépassé. Réessayez plus tard.");
    }
    if ((error.message && error.message.includes("not found")) ||
        (error.message && error.message.includes("404"))) {
      throw new HttpsError("failed-precondition",
          "Modèle IA non disponible. Contactez le support.");
    }

    throw new HttpsError("internal",
        `Erreur de génération: ${error.message}`);
  }
});
