import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        skinType: { type: Type.STRING, description: "e.g., oily, dry, combination, normal, sensitive" },
        analysis: { type: Type.STRING, description: "A detailed 1-2 paragraph summary of the skin's condition." },
        concerns: {
            type: Type.ARRAY,
            description: "A list of key skin concerns observed.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Name of the concern, e.g., Acne, Pores, Wrinkles" },
                    description: { type: Type.STRING, description: "A brief explanation of the concern for the user." },
                },
                required: ["name", "description"],
            },
        },
        recommendations: {
            type: Type.OBJECT,
            properties: {
                morningRoutine: {
                    type: Type.ARRAY,
                    description: "Step-by-step morning skincare routine.",
                    items: { type: Type.STRING },
                },
                eveningRoutine: {
                    type: Type.ARRAY,
                    description: "Step-by-step evening skincare routine.",
                    items: { type: Type.STRING },
                },
                productSuggestions: {
                    type: Type.ARRAY,
                    description: "Specific K-Beauty product type suggestions.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING, description: "e.g., Gentle Cleanser, Hydrating Toner, Vitamin C Serum" },
                            reason: { type: Type.STRING, description: "Why this product type is recommended for the user's skin." },
                        },
                        required: ["type", "reason"],
                    },
                },
            },
            required: ["morningRoutine", "eveningRoutine", "productSuggestions"],
        },
    },
    required: ["skinType", "analysis", "concerns", "recommendations"],
};


export const analyzeSkin = async (imageFile: File, language: 'en' | 'tr'): Promise<AnalysisResult> => {
  try {
    const imagePart = await fileToGenerativePart(imageFile);
    
    const prompts = {
        en: "You are an expert K-Beauty dermatologist. Analyze this user's facial photo, taken with a back camera and flash, based on Korean beauty standards. Provide a detailed analysis and personalized recommendations. Return the analysis as a JSON object matching the provided schema.",
        tr: "Sen uzman bir K-Beauty dermatoloğusun. Kullanıcının arka kamera ve flaşla çekilmiş bu yüz fotoğrafını Kore güzellik standartlarına göre analiz et. Detaylı bir analiz ve kişiselleştirilmiş öneriler sun. Analizi, sağlanan şemayla eşleşen bir JSON nesnesi olarak döndür."
    };

    const prompt = prompts[language];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      }
    });
    
    const text = response.text.trim();
    // Gemini can sometimes wrap the JSON in markdown backticks
    const cleanedText = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(cleanedText) as AnalysisResult;

  } catch (error) {
    console.error("Error analyzing skin:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to analyze skin. Gemini API error: ${error.message}`);
    }
    throw new Error("An unknown error occurred during skin analysis.");
  }
};
