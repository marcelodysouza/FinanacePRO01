import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, FinancialForecast } from "../types";

// A API KEY é injetada automaticamente do ambiente
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialInsights = async (transactions: Transaction[]) => {
  if (transactions.length === 0) return "Adicione transações para análise.";

  const summary = transactions.slice(0, 30).map(t => ({
    tipo: t.type,
    valor: t.amount,
    cat: t.category,
    desc: t.description
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise meu fluxo de caixa e dê 2 dicas curtas e 1 alerta: ${JSON.stringify(summary)}`,
      config: {
        systemInstruction: "Você é um consultor financeiro sênior. Seja sarcástico mas útil. Responda em português brasileiro.",
        temperature: 0.7,
      }
    });
    return response.text || "Continue registrando para novos insights.";
  } catch (error) {
    console.error("Erro Gemini:", error);
    return "Não consegui analisar seus dados agora. Tente novamente.";
  }
};

export const getFinancialForecast = async (transactions: Transaction[]): Promise<FinancialForecast | null> => {
  if (transactions.length < 3) return null;

  const history = transactions.map(t => ({ d: t.date, v: t.amount, t: t.type }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Com base nisso: ${JSON.stringify(history)}. Preveja o saldo final do próximo mês.`,
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
          { text: "Extraia o valor total, data (YYYY-MM-DD) e nome do local deste comprovante." }
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
    return null;
  }
};

