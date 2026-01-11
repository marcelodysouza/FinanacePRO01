
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, FinancialForecast, FinancialGoal } from "../types.ts";
import { PersistenceService } from "./persistenceService.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialInsights = async (transactions: Transaction[], goals: FinancialGoal[] = []) => {
  if (transactions.length === 0) return "Adicione transações para receber conselhos da IA.";

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));
  const settings = await PersistenceService.getAISettings();
  
  const spendingLimit = goals.find(g => g.type === 'SPENDING_LIMIT' && g.month === currentMonth)?.amount || 0;
  const savingsTarget = goals.find(g => g.type === 'SAVINGS_TARGET' && g.month === currentMonth)?.amount || 0;

  const summary = {
    totalTransactions: monthTransactions.length,
    spendingLimit,
    savingsTarget,
    currentExpenses: monthTransactions.filter(t => t.type === 'EXPENSE').reduce((a, b) => a + b.amount, 0),
    currentIncome: monthTransactions.filter(t => t.type === 'INCOME').reduce((a, b) => a + b.amount, 0),
    topCategories: Array.from(new Set(monthTransactions.map(t => t.category))).slice(0, 5)
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Contexto do Mês (${currentMonth}): ${JSON.stringify(summary)}.`,
      config: {
        systemInstruction: settings.insightsPrompt,
        temperature: 0.7,
      }
    });
    return response.text || "Continue registrando para uma análise profunda.";
  } catch (error: any) {
    console.error("Erro Insights Gemini:", error);
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      return "Conexão com a IA interrompida. Verifique sua internet ou permissões do navegador.";
    }
    return "Insights temporariamente indisponíveis.";
  }
};

export const getFinancialForecast = async (transactions: Transaction[]): Promise<FinancialForecast | null> => {
  if (transactions.length < 5) return null;
  const history = transactions.slice(0, 50).map(t => ({ data: t.date, valor: t.amount, tipo: t.type }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Histórico: ${JSON.stringify(history)}. Preveja o saldo para o próximo mês.`,
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
  } catch (error: any) {
    console.error("Erro Previsão Gemini:", error);
    return null;
  }
};

export const analyzeReceipt = async (base64Data: string, mimeType: string = 'image/jpeg') => {
  try {
    const settings = await PersistenceService.getAISettings();
    const cleanData = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType, data: cleanData } },
          { text: settings.receiptPrompt }
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

    return JSON.parse(response.text?.trim() || '{}');
  } catch (error: any) {
    console.error("Erro análise de recibo:", error);
    if (error.message?.includes('fetch')) {
      throw new Error("Falha na conexão com a rede. O navegador pode estar bloqueando a requisição.");
    }
    throw error;
  }
};
