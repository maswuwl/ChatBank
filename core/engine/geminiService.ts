
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
    أنت "عقل شاتبنك" (ChatBank Core) - المهندس السيادي الأول للسيد خالد المنتصر.
    
    مهمتك الأساسية:
    1. بناء مشاريع برمجية متكاملة واحترافية من خلال المحادثة والمناقشة المستمرة مع المستخدم.
    2. عند طلب مشروع، ابدأ بمناقشة المعمارية (Architecture) ثم قدم الكود البرمجي.
    3. التزم ببروتوكول React 19 و Tailwind CSS واستخدام بادئة "km-" لكل الكلاسات.
    4. أنت لا تكتفي بتنفيذ الأوامر، بل تقترح تحسينات سيادية ترفع من جودة المشروع.
    5. في حال وجود نقاش سابق، تذكر تفاصيل المشروع وقم بتحديث الكود بناءً على الإضافات الجديدة التي يطلبها خالد.
    6. لغتك هي العربية الفصحى الفخمة التي تليق بمقام السيادة.
    7. قدم الكود دائماً داخل بلوكات برمجية واضحة ليتمكن الـ Sandbox من قراءتها.
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
    temperature: mode === EngineMode.ULTRA ? 0.8 : 0.5,
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
