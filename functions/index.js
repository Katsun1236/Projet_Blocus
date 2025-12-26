const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const geminiApiKey = defineSecret("GEMINI_API_KEY");

const GEMINI_MODELS = [
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro-latest",
  "gemini-pro",
];

function getGeminiApiUrl(apiKey, modelIndex = 0) {
  const model = GEMINI_MODELS[modelIndex];
  const baseUrl = "https://generativelanguage.googleapis.com/v1";
  return `${baseUrl}/models/${model}:generateContent?key=${apiKey}`;
}

exports.generateContent = onCall(
    {cors: true, secrets: [geminiApiKey]},
    async (request) => {
      const GEMINI_API_KEY = geminiApiKey.value();

      if (!GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is not configured!");
        throw new HttpsError("failed-precondition",
            "Configuration de l'API Gemini manquante.");
 codespace-legendary-space-system-gv46r59x946f9qj7
      }

      console.log("API Key configured: ✓");
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
        let fullPrompt = "";

        if (mode === "quiz") {
          const quizOptions = options || {};
          const count = quizOptions.count || 5;
          const type = quizOptions.type || "qcm";

          const systemInstruction =
            "Tu es un professeur expert universitaire. " +
            "Ta réponse DOIT être exclusivement un objet JSON valide. " +
            "Structure : { \"title\": \"...\", \"questions\": [...] }";

          const userPrompt = `Sujet: "${topic || "Général"}". ` +
            `Contexte: ${data ? String(data).substring(0, 5000) : "Aucun"}. ` +
            `Génère ${count} questions de type ${type}. Langue: Français.`;

          fullPrompt = systemInstruction + "\n\n" + userPrompt;

        } else if (mode === "synthesis") {
          const synthOptions = options || {};
          const length = synthOptions.length || "medium";
          const format = synthOptions.format || "summary";

          const systemInstruction = "Expert en pédagogie. Output HTML pur. " +
            "Utilise <h2>, <ul>, <strong>. Pas de Markdown. " +
            "Pas de balises <html>, <head>.";

          let formatInstruction = "";
          switch (format) {
            case "flashcards":
              formatInstruction =
                "Format: <div class=\"flashcard p-4 mb-4 " +
                "bg-gray-800 border border-gray-700 rounded-lg\">" +
                "<h4 class=\"text-indigo-400 font-bold mb-2\">Question</h4>" +
                "<p class=\"text-gray-300\">Réponse</p></div>";
              break;
            case "plan":
              formatInstruction = "Format: Plan détaillé (I. II. III.)";
              break;
            case "glossary":
              formatInstruction =
                "Format: <dl><div class=\"bg-gray-800/50 p-3\">" +
                "<dt class=\"text-indigo-400\">Terme</dt>" +
                "<dd class=\"text-gray-300\">Def</dd></div></dl>";
              break;
            default:
              formatInstruction = "Format: <h2>Concepts</h2>, " +
                "<h2>Résumé</h2>, <h2>Conclusion</h2>";
          }

          const userPrompt =
            `Rédige un contenu type "${format}" sur "${topic}". ` +
            `Longueur: ${length}. ` +
            `${data ? `Basé sur: ${String(data).substring(0, 10000)}` : ""} ` +
            `Consignes: ${formatInstruction}`;

          fullPrompt = systemInstruction + "\n\n" + userPrompt;
        } else {
          throw new HttpsError("invalid-argument", "Mode invalide.");
        }

        const requestBody = {
          contents: [{
            parts: [{text: fullPrompt}],
          }],
          generationConfig: {
            temperature: 0.7,
          },
        };

        let response;
        let lastError;

        for (let i = 0; i < GEMINI_MODELS.length; i++) {
          const apiUrl = getGeminiApiUrl(GEMINI_API_KEY, i);
          console.log(`Tentative avec le modèle: ${GEMINI_MODELS[i]}`);

          try {
            response = await fetch(apiUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(requestBody),
            });

            if (response.ok) {
              console.log(`✓ Succès avec le modèle: ${GEMINI_MODELS[i]}`);
              break;
            }

            const errorText = await response.text();
            const modelName = GEMINI_MODELS[i];
            lastError =
              `${modelName}: ${response.status} - ${errorText}`;
            console.warn(`✗ Échec avec ${GEMINI_MODELS[i]}:`, errorText);
          } catch (fetchError) {
            lastError = `${GEMINI_MODELS[i]}: ${fetchError.message}`;
            console.warn(`✗ Erreur réseau avec ${GEMINI_MODELS[i]}:`,
                fetchError.message);
          }
        }

        if (!response || !response.ok) {
          const errorMsg =
            `Tous les modèles Gemini ont échoué. Dernière erreur: ${lastError}`;
          console.error(errorMsg);
          throw new Error(errorMsg);
        }

        const result = await response.json();

        if (!result.candidates || !result.candidates[0] ||
            !result.candidates[0].content ||
            !result.candidates[0].content.parts ||
            !result.candidates[0].content.parts[0]) {
          console.error("Format de réponse invalide:", JSON.stringify(result));
          throw new Error("Format de réponse Gemini invalide");
        }

        const responseText = result.candidates[0].content.parts[0].text;

        if (mode === "quiz") {
          try {
            const cleanJson = responseText.replace(/```json/g, "")
                .replace(/```/g, "").trim();
            return JSON.parse(cleanJson);
          } catch (e) {
            throw new HttpsError("internal",
                "Format invalide généré par l'IA.");
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
          errorStack: error.stack,
          mode,
          topic,
        });

        if (error.message?.includes("API key")) {
          throw new HttpsError("failed-precondition",
              "Clé API Gemini invalide ou manquante.");
        }
        if (error.message?.includes("quota")) {
          throw new HttpsError("resource-exhausted",
              "Quota API dépassé. Réessayez plus tard.");
        }
        if (error.message?.includes("not found") ||
        error.message?.includes("404")) {
          throw new HttpsError("failed-precondition",
              "Modèle IA non disponible. Contactez le support.");
        }

        throw new HttpsError("internal",
            `Erreur de génération: ${error.message}`);
      }
    });
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const geminiApiKey = defineSecret("GEMINI_API_KEY");

const GEMINI_MODELS = [
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro-latest",
  "gemini-pro",
];

function getGeminiApiUrl(apiKey, modelIndex = 0) {
  const model = GEMINI_MODELS[modelIndex];
  const baseUrl = "https://generativelanguage.googleapis.com/v1";
  return `${baseUrl}/models/${model}:generateContent?key=${apiKey}`;
}

exports.generateContent = onCall(
    {cors: true, secrets: [geminiApiKey]},
    async (request) => {
      const GEMINI_API_KEY = geminiApiKey.value();

      if (!GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is not configured!");
        throw new HttpsError("failed-precondition",
            "Configuration de l'API Gemini manquante.");
      }


      }

main
      console.log("API Key configured: ✓");
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
        let fullPrompt = "";

        if (mode === "quiz") {
          const quizOptions = options || {};
          const count = quizOptions.count || 5;
          const type = quizOptions.type || "qcm";

          const systemInstruction =
            "Tu es un professeur expert universitaire. " +
            "Ta réponse DOIT être exclusivement un objet JSON valide. " +
            "Structure : { \"title\": \"...\", \"questions\": [...] }";

          const userPrompt = `Sujet: "${topic || "Général"}". ` +
            `Contexte: ${data ? String(data).substring(0, 5000) : "Aucun"}. ` +
            `Génère ${count} questions de type ${type}. Langue: Français.`;

          fullPrompt = systemInstruction + "\n\n" + userPrompt;

        } else if (mode === "synthesis") {
          const synthOptions = options || {};
          const length = synthOptions.length || "medium";
          const format = synthOptions.format || "summary";

          const systemInstruction = "Expert en pédagogie. Output HTML pur. " +
            "Utilise <h2>, <ul>, <strong>. Pas de Markdown. " +
            "Pas de balises <html>, <head>.";

          let formatInstruction = "";
          switch (format) {
            case "flashcards":
              formatInstruction =
                "Format: <div class=\"flashcard p-4 mb-4 " +
                "bg-gray-800 border border-gray-700 rounded-lg\">" +
                "<h4 class=\"text-indigo-400 font-bold mb-2\">Question</h4>" +
                "<p class=\"text-gray-300\">Réponse</p></div>";
              break;
            case "plan":
              formatInstruction = "Format: Plan détaillé (I. II. III.)";
              break;
            case "glossary":
              formatInstruction =
                "Format: <dl><div class=\"bg-gray-800/50 p-3\">" +
                "<dt class=\"text-indigo-400\">Terme</dt>" +
                "<dd class=\"text-gray-300\">Def</dd></div></dl>";
              break;
            default:
              formatInstruction = "Format: <h2>Concepts</h2>, " +
                "<h2>Résumé</h2>, <h2>Conclusion</h2>";
          }

          const userPrompt =
            `Rédige un contenu type "${format}" sur "${topic}". ` +
            `Longueur: ${length}. ` +
            `${data ? `Basé sur: ${String(data).substring(0, 10000)}` : ""} ` +
            `Consignes: ${formatInstruction}`;

          fullPrompt = systemInstruction + "\n\n" + userPrompt;
        } else {
          throw new HttpsError("invalid-argument", "Mode invalide.");
        }

        const requestBody = {
          contents: [{
            parts: [{text: fullPrompt}],
          }],
          generationConfig: {
            temperature: 0.7,
          },
        };

        let response;
        let lastError;

        for (let i = 0; i < GEMINI_MODELS.length; i++) {
          const apiUrl = getGeminiApiUrl(GEMINI_API_KEY, i);
          console.log(`Tentative avec le modèle: ${GEMINI_MODELS[i]}`);

          try {
            response = await fetch(apiUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(requestBody),
            });

            if (response.ok) {
              console.log(`✓ Succès avec le modèle: ${GEMINI_MODELS[i]}`);
codespace-legendary-space-system-gv46r59x946f9qj7
              break;
claude/website-help-QSRVH
              break;

              break; 
 main
main
            }

            const errorText = await response.text();
            const modelName = GEMINI_MODELS[i];
            lastError =
              `${modelName}: ${response.status} - ${errorText}`;
            console.warn(`✗ Échec avec ${GEMINI_MODELS[i]}:`, errorText);
          } catch (fetchError) {
            lastError = `${GEMINI_MODELS[i]}: ${fetchError.message}`;
            console.warn(`✗ Erreur réseau avec ${GEMINI_MODELS[i]}:`,
                fetchError.message);
          }
        }

        if (!response || !response.ok) {
          const errorMsg =
            `Tous les modèles Gemini ont échoué. Dernière erreur: ${lastError}`;
          console.error(errorMsg);
          throw new Error(errorMsg);
        }

        const result = await response.json();

        if (!result.candidates || !result.candidates[0] ||
            !result.candidates[0].content ||
            !result.candidates[0].content.parts ||
            !result.candidates[0].content.parts[0]) {
          console.error("Format de réponse invalide:", JSON.stringify(result));
          throw new Error("Format de réponse Gemini invalide");
        }

        const responseText = result.candidates[0].content.parts[0].text;

        if (mode === "quiz") {
          try {
            const cleanJson = responseText.replace(/```json/g, "")
                .replace(/```/g, "").trim();
            return JSON.parse(cleanJson);
          } catch (e) {
            throw new HttpsError("internal",
                "Format invalide généré par l'IA.");
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
          errorStack: error.stack,
          mode,
          topic,
        });

        if (error.message?.includes("API key")) {
          throw new HttpsError("failed-precondition",
              "Clé API Gemini invalide ou manquante.");
        }
        if (error.message?.includes("quota")) {
          throw new HttpsError("resource-exhausted",
              "Quota API dépassé. Réessayez plus tard.");
        }
        if (error.message?.includes("not found") ||
        error.message?.includes("404")) {
          throw new HttpsError("failed-precondition",
              "Modèle IA non disponible. Contactez le support.");
        }

        throw new HttpsError("internal",
            `Erreur de génération: ${error.message}`);
      }
    });
