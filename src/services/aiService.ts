import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export const aiAssistantChat = async (text: string, history: { role: 'user' | 'ai', content: string }[], type: 'explain' | 'summarize' | 'examples' | 'chat' = 'chat') => {
  try {
    let promptPrefix = "";
    if (type === 'summarize') {
      promptPrefix = "Summarize the following text from a book in simple terms: ";
    } else if (type === 'examples') {
      promptPrefix = "Give real-world examples related to this concept from the book: ";
    } else if (type === 'explain') {
      promptPrefix = "Explain this concept or paragraph from a book in simple terms: ";
    } else {
      promptPrefix = "Help the student understand the following text from a book: ";
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { role: 'user', parts: [{ text: `You are an expert AI Tutor. ${promptPrefix} "${text}". 
        Be encouraging, use simple analogies, and always end your response with a thought-provoking question to check their understanding.
        
        Previous conversation:
        ${history.map(h => `${h.role === 'user' ? 'Student' : 'Tutor'}: ${h.content}`).join('\n')}
        ` }] }
      ],
      config: {
        systemInstruction: "You are a friendly, patient, and highly knowledgeable AI Tutor. You explain complex concepts using simple analogies and step-by-step reasoning. You always encourage the student and ask a follow-up question to ensure they are following along."
      }
    });
    return response.text || "I'm sorry, I'm having trouble explaining that right now.";
  } catch (error) {
    console.error("AI Assistant Error:", error);
    return "I'm sorry, I'm having trouble explaining that right now.";
  }
};

export const generateQuiz = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a 3-question multiple choice quiz based on the following text. Each question must have 4 options and one correct answer. Text: ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswer: { type: Type.INTEGER, description: "Index of the correct option (0-3)" },
              explanation: { type: Type.STRING }
            },
            required: ["question", "options", "correctAnswer", "explanation"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("AI Quiz Error:", error);
    return [];
  }
};

export const generateSpeech = async (text: string) => {
  if (!text || text.trim().length === 0) return null;
  
  // Limit text to a reasonable length for TTS to avoid 500 errors
  const truncatedText = text.slice(0, 500);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: truncatedText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error: any) {
    console.error("AI Speech Error:", error);
    return null;
  }
};
