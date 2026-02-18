
import { GoogleGenAI } from "@google/genai";

// Strictly follow initialization guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateWorkoutAdvice = async (metrics: any[]) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `User metrics: ${JSON.stringify(metrics)}. Provide one short coaching sentence for Justin La Plante to tell his client.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Focus on your progressive overload this week.";
  }
};

export const generateMealPlanIdea = async (goal: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Suggest a high-protein meal for: ${goal}. One sentence.`,
    });
    return response.text;
  } catch (error) {
    return "High-protein meal with complex carbs and greens.";
  }
};
