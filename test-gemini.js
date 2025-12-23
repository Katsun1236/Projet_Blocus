// Test rapide de la clé API Gemini
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ⚠️ REMPLACE PAR TA CLÉ (juste pour ce test)
const API_KEY = "AIzaSyBX1QEw3MceWrulzuL8wCpf64Txk_q_brc";

const genAI = new GoogleGenerativeAI(API_KEY);

async function testGemini() {
  console.log("🧪 Test de la clé API Gemini...\n");

  try {
    // Test 1: Liste des modèles
    console.log("📋 Modèles disponibles:");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Test 2: Génération simple
    console.log("\n🤖 Test génération de texte...");
    const result = await model.generateContent("Dis bonjour en français");
    const response = result.response.text();

    console.log("\n✅ SUCCÈS !");
    console.log("Réponse:", response);

  } catch (error) {
    console.error("\n❌ ERREUR:", error.message);
    console.error("Code:", error.code);
    console.error("Status:", error.status);

    if (error.message.includes("API key")) {
      console.error("\n⚠️ Problème de clé API !");
      console.error("- Vérifie que la clé est valide sur https://aistudio.google.com/apikey");
      console.error("- Vérifie que l'API Gemini est activée");
    }

    if (error.message.includes("quota") || error.message.includes("429")) {
      console.error("\n⚠️ Quota dépassé !");
      console.error("- Vérifie ton usage sur https://aistudio.google.com/");
    }

    if (error.message.includes("404") || error.message.includes("not found")) {
      console.error("\n⚠️ Modèle non trouvé !");
      console.error("- Le modèle 'gemini-1.5-flash' n'est peut-être pas disponible");
      console.error("- Essaye 'gemini-pro' à la place");
    }
  }
}

testGemini();
