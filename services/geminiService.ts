import { GoogleGenAI } from "@google/genai";

// Use a getter to handle potential delayed injection of the API key
const getAIClient = () => {
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : undefined;
  if (!apiKey) {
    console.warn("Gemini API Key not found in process.env.API_KEY");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateWorkoutAdvice = async (metrics: any[]) => {
  try {
    const ai = getAIClient();
    if (!ai) return "Stay focused on your progressive overload goals.";

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `User metrics: ${JSON.stringify(metrics)}. Provide one short coaching sentence for Justin La Plante to tell his client.`,
    });
    return response.text || "Focus on your progressive overload this week.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Keep pushing towards your consistency goals.";
  }
};

export const generateMealPlanIdea = async (goal: string) => {
  try {
    const ai = getAIClient();
    if (!ai) return "High-protein meal with complex carbs and greens.";

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Suggest a high-protein meal for: ${goal}. One sentence.`,
    });
    return response.text || "High-protein meal with complex carbs and greens.";
  } catch (error) {
    return "High-protein meal with complex carbs and greens.";
  }
};