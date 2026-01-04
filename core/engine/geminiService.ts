
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { EngineMode, EngineResult, GroundingSource } from "../types";

const MODEL_ROUTER: Record<EngineMode, string> = {
  [EngineMode.FLASH]: "gemini-3-flash-preview",
  [EngineMode.ULTRA]: "gemini-3-pro-preview",
  [EngineMode.LOCAL_X1]: "sovereign-local-x1"
};

/**
 * المحرك السيادي المركزي لتوليد المحتوى
 */
export const muntasirGenerateContent = async (
  prompt: string,
  mode: EngineMode,
  options?: {
    imageBase64?: string;
    search?: boolean;
  }
): Promise<EngineResult> => {
  const start = Date.now();
  const modelName = MODEL_ROUTER[mode];

  try {
    // التوجيه للمحرك المحلي X1 إذا كان مفعلاً
    if (mode === EngineMode.LOCAL_X1) {
       return await handleLocalX1Request(prompt, start);
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemInstruction = `
      أنت ChatBank Sovereign Intelligence.
      - العميل: خالد المنتصر (Commander).
      - المهمة: بناء حلول برمجية وهندسية فائقة الجودة.
      - البروتوكول: قدم الأكواد دائماً في Single File Application إذا طُلب ذلك.
      - الجمالية: التزم بـ Dark Gold UI (#d4af37).
      - التفكير: حلل بعمق قبل الإجابة في نمط ULTRA.
    `;

    const contents: any[] = [{
        parts: options?.imageBase64
          ? [
              { inlineData: { data: options.imageBase64.split(',')[1] || options.imageBase64, mimeType: "image/jpeg" } },
              { text: prompt }
            ]
          : [{ text: prompt }]
    }];

    const config: any = {
      systemInstruction,
      temperature: mode === EngineMode.ULTRA ? 0.75 : 0.25,
      maxOutputTokens: 8192
    };

    if (mode === EngineMode.ULTRA) {
      config.thinkingConfig = { thinkingBudget: 32768 };
    }

    if (options?.search) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config
    });

    const sources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) sources.push({ title: chunk.web.title || "المصدر السيادي", uri: chunk.web.uri });
      });
    }

    return {
      text: response.text ?? "النواة لم تولد بيانات.",
      sources: sources.length > 0 ? sources : undefined,
      meta: { model: modelName, mode, latencyMs: Date.now() - start }
    };
  } catch (error: any) {
    console.error("Critical Engine Failure:", error);
    throw error;
  }
};

/**
 * بروتوكول الترميم السيادي - النسخة المطورة
 */
export const muntasirRepairCode = async (code: string, error?: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      وحدة الترميم نشطة. أصلح هذا الكود وطوّره هندسياً ليعمل بمثالية مطلقة للسيد خالد المنتصر.
      الكود الحالي:
      ${code}
      ${error ? `الخطأ المكتشف: ${error}` : ''}
      المطلوب: أخرج الكود الكامل المصلح فقط داخل بلوك برمجية.
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: { 
        systemInstruction: "أنت مهندس ترميم الأكواد السيادي. هدفك هو الكود المثالي الخالي من الأخطاء.",
        temperature: 0.1 
      }
    });

    const match = /```(?:html|javascript|css|react)?([\s\S]*?)```/g.exec(response.text || "");
    return match ? match[1] : (response.text || code);
  } catch {
    return code;
  }
};

async function handleLocalX1Request(prompt: string, start: number): Promise<EngineResult> {
  try {
    const res = await fetch('http://localhost:8000/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: "sovereign-local-x1", messages: [{ role: "user", content: prompt }] })
    });
    const data = await res.json();
    return {
      text: data.choices[0].message.content,
      meta: { model: "Local-X1-Core", mode: EngineMode.LOCAL_X1, latencyMs: Date.now() - start }
    };
  } catch {
    throw new Error("CORE_OFFLINE");
  }
}
