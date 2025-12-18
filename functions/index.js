const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");

admin.initializeApp();

// IMPORTANT: Set the GEMINI_API_KEY environment variable.
// You can create a .env file in the functions directory with:
// GEMINI_API_KEY=your_api_key_here
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

exports.generateContent = onCall({ cors: true }, async (request) => {
    // Check if user is authenticated
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const { prompt, schema, model } = request.data;

    if (!GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is not set.");
        throw new HttpsError('failed-precondition', 'Server configuration error: API Key missing.');
    }

    if (!prompt) {
        throw new HttpsError('invalid-argument', 'The function must be called with a "prompt" argument.');
    }

    try {
        const genModel = genAI.getGenerativeModel({
            model: model || "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        const result = await genModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return { text };
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new HttpsError('internal', 'Error calling Gemini API', error.message);
    }
});
