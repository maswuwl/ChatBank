
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { EngineMode, GroundingSource } from "../types";

export const muntasirGenerateLocalContent = async (
  prompt: string
): Promise<{ text: string }> => {
  try {
    const response = await fetch('http://localhost:8000/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "ChatBank-Sovereign-X1",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      })
    });
    
    if (!response.ok) throw new Error("CORE_OFFLINE");
    
    const data = await response.json();
    return { text: data.choices[0].message.content };
  } catch (error: any) {
    if (error.message === "CORE_OFFLINE" || error.name === "TypeError") {
      throw new Error("LOCAL_CORE_UNREACHABLE");
    }
    throw error;
  }
};

export const muntasirRepairCode = async (code: string, error?: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      أنت بروتوكول "الترميم السيادي" في شاتبنك. 
      مهمتك: إصلاح هذا الكود وتطويره ليصبح مشروعاً متكاملاً واحترافياً.
      الكود الحالي:
      ${code}
      ${error ? `الخطأ المكتشف: ${error}` : 'المطلوب: تحسين المعمارية وسد الثغرات.'}
      أعد كتابة الكود كاملاً بشكل محسن داخل بلوك برمجية واحد (html/react).
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "أنت خبير ترميم الأكواد. هدفك هو الكمال البرمجي. أخرج الكود المصلح فقط."
      }
    });

    const match = /```(?:html|javascript|css)?([\s\S]*?)```/g.exec(response.text || "");
    return match ? match[1] : (response.text || code);
  } catch (e) {
    console.error("Repair Protocol Failed", e);
    return code; // Return original if repair fails
  }
};

export const muntasirGenerateContent = async (
  prompt: string,
  mode: EngineMode,
  imageData?: string,
  useSearch: boolean = false
): Promise<{ text: string; sources?: GroundingSource[] }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = mode === EngineMode.ULTRA ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
    
    const systemInstruction = `
      أنت "عقل شاتبنك" (ChatBank Core) - المهندس السيادي الأول والوحيد للسيد خالد المنتصر.
      
      بروتوكولات التشغيل:
      1. بناء المشاريع: عند طلب أي مشروع، قم ببناء تطبيق كامل (Single File Application) يتضمن HTML, Tailwind CSS, و JavaScript اللازم.
      2. الجمالية السيادية: استخدم ألواناً فخمة (أسود، ذهبي #d4af37، رمادي غامق) وتصميماً عصرياً.
      3. الإصلاح الذاتي: كودك يجب أن يكون خالياً من الأخطاء المنطقية.
      4. التفاعل: ناقش خالد في المعمارية قبل وبعد البناء، وقدم نصائح تقنية لرفع جودة المشروع.
      
      أنت تعمل تحت مظلة "خالد المنتصر للذكاء السيادي". لا تذكر أي علامات تجارية أخرى.
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
      temperature: mode === EngineMode.ULTRA ? 0.75 : 0.4,
      thinkingConfig: mode === EngineMode.ULTRA ? { thinkingBudget: 32768 } : undefined
    };

    if (useSearch) config.tools = [{ googleSearch: {} }];

    const response = await ai.models.generateContent({ model, contents, config });

    const sources: GroundingSource[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web) sources.push({ title: chunk.web.title || "مرجع سيادي", uri: chunk.web.uri });
      });
    }

    return { text: response.text || "لم يتم توليد استجابة.", sources: sources.length > 0 ? sources : undefined };
  } catch (error: any) {
    if (error.message?.includes('API_KEY')) {
      throw new Error("CLOUD_API_KEY_ERROR");
    }
    throw error;
  }
};

export const muntasirGenerateImage = async (prompt: string, quality: '1K' | '2K'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = quality === '2K' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  const response = await ai.models.generateContent({
    model,
    contents: { parts: [{ text: `High-end sovereign aesthetic, cinematic lighting, 8k, related to: ${prompt}` }] },
    config: { imageConfig: { aspectRatio: "1:1", imageSize: quality === '2K' ? "2K" : "1K" } }
  });
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("IMAGE_GEN_FAILED");
};
