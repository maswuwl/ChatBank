
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { EngineMode, GroundingSource } from "../types";

export const muntasirGenerateContent = async (
  prompt: string,
  mode: EngineMode,
  imageData?: string, // base64
  useSearch: boolean = false
): Promise<{ text: string; sources?: GroundingSource[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const model = mode === EngineMode.ULTRA ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  const systemInstruction = `
    أنت نظام "شاتبنك" (ChatBank) للذكاء السيادي. 
    أنت ملكية خاصة وحصرية للسيد خالد المنتصر.
    
    قواعد البرمجة السيادية (Sovereign Coding Standards):
    1. عند بناء أي مشروع برمجى، استخدم أحدث تقنيات React 19 و Tailwind CSS.
    2. يجب أن تكون جميع أسماء الكلاسات (CSS Classes) فريدة وتبدأ بالبادئة "km-" (مثلاً: km-container, km-gold-btn).
    3. قدم الكود كملف واحد متكامل (Single-file Component) يحتوي على المنطق والتصميم.
    4. افترض أن البيئة تعمل بنظام مشابه لـ Vite من حيث السرعة والنمطية.
    5. لغتك هي العربية الملكية الفخمة.
    6. إذا طلب منك بناء مشروع، ابنه بشكل كامل واحترافي ليكون جاهزاً للعرض في الـ Sandbox.
    7. عرّف نفسك دائماً بأنك محرك ChatBank السيادي.
  `;

  const contents: any[] = [];
  if (imageData) {
    contents.push({
      parts: [
        { inlineData: { data: imageData.split(',')[1] || imageData, mimeType: 'image/jpeg' } },
        { text: prompt }
      ]
    });
  } else {
    contents.push({ parts: [{ text: prompt }] });
  }

  const config: any = {
    systemInstruction,
    temperature: mode === EngineMode.ULTRA ? 0.7 : 0.5,
    thinkingConfig: mode === EngineMode.ULTRA ? { thinkingBudget: 32768 } : undefined
  };

  if (useSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  const response = await ai.models.generateContent({
    model,
    contents,
    config
  });

  const sources: GroundingSource[] = [];
  if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
    response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
      if (chunk.web) {
        sources.push({
          title: chunk.web.title || "مصدر شاتبنك السيادي",
          uri: chunk.web.uri
        });
      }
    });
  }

  return {
    text: response.text || "حدث خلل في الاتصال بمركز شاتبنك السيادي.",
    sources: sources.length > 0 ? sources : undefined
  };
};

export const muntasirGenerateImage = async (prompt: string, quality: '1K' | '2K'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = quality === '2K' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  
  const response = await ai.models.generateContent({
    model,
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: quality === '2K' ? "2K" : "1K"
      }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("فشل توليد الصورة في محرك شاتبنك.");
};
