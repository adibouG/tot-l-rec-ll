import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || ''; // In a real app, handle missing key gracefully
const ai = new GoogleGenAI({ apiKey });

export const generateAssistantResponse = async (
  history: string,
  userMessage: string
): Promise<string> => {
  try {
    const model = 'gemini-3-flash-preview';
    
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
            role: 'user',
            parts: [{ text: `System Context: You are Memento AI, a minimalist assistant for a reminder app. 
            Help the user refine their reminder notes to be concise and clear. 
            Explain app features (Calendar zoom based on entries, temp accounts).
            Keep responses short, sober, and helpful.
            
            Conversation History:
            ${history}
            
            User Input: ${userMessage}` }]
        }
      ],
    });

    return response.text || "I'm having trouble connecting to the cloud right now.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I apologize, but I cannot process your request at the moment.";
  }
};

export const refineReminderText = async (text: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Rewrite the following reminder note to be more concise, clear, and professional, but keep the friendly tone. Return ONLY the rewritten text.
            
            Original: "${text}"`
        });
        return response.text?.trim() || text;
    } catch (e) {
        return text;
    }
}