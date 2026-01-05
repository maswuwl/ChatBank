
// @google/genai senior implementation for Sovereign Core
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { EngineMode, EngineResult, GroundingSource } from "../types";

const MODEL_ROUTER: Record<EngineMode, string> = {
  [EngineMode.FLASH]: "gemini-3-flash-preview",
  [EngineMode.ULTRA]: "gemini-3-pro-preview",
  [EngineMode.LOCAL_X1]: "sovereign-local-x1"
};

export const muntasirGenerateContentStream = async function* (
  prompt: string,
  mode: EngineMode,
  options?: {
    imageBase64?: string;
    search?: boolean;
    context?: string; // سياق المحادثة أو المنشور
  }
) {
  const modelName = MODEL_ROUTER[mode];

  try {
    if (mode === EngineMode.LOCAL_X1) {
       const start = Date.now();
       const res = await handleLocalX1Request(prompt, start);
       yield { text: res.text, isFinished: true, meta: res.meta };
       return;
    }

    // Always create a new instance to ensure up-to-date API key access
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemInstruction = `
      أنت "ChatBank Sovereign Intelligence" مدمج داخل منصة تواصل اجتماعي سيادية.
      المخاطب: القائد خالد المنتصر ومجتمعه التقني.
      
      مهامك:
      1. بناء مشاريع برمجية (Live Project Builder) عند الطلب، دائماً في ملف واحد كود HTML/Tailwind/JS داخل بلوك \`\`\`html.
      2. التفاعل كعقل ذكي في المحادثات الاجتماعية: اقترح ردوداً، حلل منشورات، وولد محتوى إبداعي.
      3. التصميم: التزم دائماً بالهوية الذهبية (#d4af37) والأسود الفاخر (#050505).
      4. الدقة: في وضع ULTRA، كن عميق التفكير برمجياً ومنطقياً.
      5. الأسلوب: مهيب، تقني، وداعم للسيادة المعلوماتية.
      
      سياق إضافي: ${options?.context || 'محادثة عامة'}.
    `;

    const contents: any[] = [{
        parts: options?.imageBase64
          ? [
              { inlineData: { data: options.imageBase64.split(',')[1] || options.imageBase64, mimeType: "image/jpeg" } },
              { text: prompt }
            ]
          : [{ text: prompt }]
    }];

    // Fix: Removed maxOutputTokens to prevent response blocking and allow full use of thinkingBudget
    const config: any = {
      systemInstruction,
      temperature: mode === EngineMode.ULTRA ? 0.7 : 0.3
    };

    if (mode === EngineMode.ULTRA) {
      config.thinkingConfig = { thinkingBudget: 32768 };
    }

    if (options?.search) {
      config.tools = [{ googleSearch: {} }];
    }

    const stream = await ai.models.generateContentStream({
      model: modelName,
      contents,
      config
    });

    let fullText = "";
    for await (const chunk of stream) {
      // Correctly access .text property
      const chunkText = chunk.text;
      fullText += chunkText;
      
      const sources: GroundingSource[] = [];
      const chunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((c: any) => {
          if (c.web) sources.push({ title: c.web.title || "مصدر سيادي", uri: c.web.uri });
        });
      }

      yield { 
        text: fullText, 
        isFinished: false,
        sources: sources.length > 0 ? sources : undefined,
        meta: { model: modelName, mode, latencyMs: 0 } 
      };
    }

    yield { text: fullText, isFinished: true };

  } catch (error: any) {
    console.error("Critical Failure in Sovereign Engine:", error);
    throw error;
  }
};

export const muntasirRepairCode = async (code: string, error?: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `أصلح هذا الكود البرمجي فوراً وطوره هندسياً للسيد خالد المنتصر:\n${code}\n${error ? `الخطأ: ${error}` : ''}`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: { 
        systemInstruction: "أنت مهندس ترميم النظم السيادي.",
        temperature: 0.1 
      }
    });

    const match = /```(?:html|javascript|css|react)?([\s\S]*?)```/g.exec(response.text || "");
    return match ? match[1] : (response.text || code);
  } catch { return code; }
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
    return {
      text: "النواة المحلية (Local X1) غير متصلة.",
      meta: { model: "Local-Core-Offline", mode: EngineMode.LOCAL_X1, latencyMs: Date.now() - start }
    };
  }
}
