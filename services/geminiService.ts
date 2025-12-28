
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, FinancialForecast } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialInsights = async (transactions: Transaction[]) => {
  if (transactions.length === 0) return "Adicione algumas transações para receber insights financeiros.";

  const summary = transactions.slice(0, 50).map(t => ({
    type: t.type,
    amount: t.amount,
    date: t.date,
    category: t.category
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise estas transações financeiras e forneça 3 insights estratégicos curtos: ${JSON.stringify(summary)}`,
      config: {
        systemInstruction: "Você é um CFO experiente. Seja direto, use tom profissional e foque em saúde do fluxo de caixa. Responda em português.",
        temperature: 0.4,
      }
    });
    return response.text || "Continue registrando para mais insights.";
  } catch (error) {
    console.error("Erro Gemini:", error);
    return "Insights temporariamente indisponíveis.";
  }
};

export const getFinancialForecast = async (transactions: Transaction[]): Promise<FinancialForecast | null> => {
  if (transactions.length < 5) return null;

  const history = transactions.map(t => ({
    d: t.date,
    a: t.amount,
    t: t.type,
    c: t.category
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Com base no histórico: ${JSON.stringify(history)}. Preveja o saldo para o próximo mês e avalie o risco.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            predictedBalance: { type: Type.NUMBER },
            confidenceScore: { type: Type.NUMBER },
            riskLevel: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] },
            explanation: { type: Type.STRING }
          },
          required: ["predictedBalance", "riskLevel", "explanation"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Erro Forecast Gemini:", error);
    return null;
  }
};

export const analyzeReceipt = async (base64Image: string) => {
  try {
    const imageData = base64Image.split(',')[1];
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: imageData } },
          { text: "Extraia: valor total (amount), data (YYYY-MM-DD), estabelecimento (description) e sugira uma categoria financeira." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            date: { type: Type.STRING },
            description: { type: Type.STRING },
            category_suggestion: { type: Type.STRING }
          },
          required: ["amount", "date", "description"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Erro Vision Gemini:", error);
    return null;
  }
};
