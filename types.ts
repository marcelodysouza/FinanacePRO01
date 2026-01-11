
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum UserRole {
  NORMAL = 'NORMAL',
  ADVANCED = 'ADVANCED'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Transaction {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  type: TransactionType;
  attachment?: string;
  attachmentName?: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
}

export interface FinancialForecast {
  predictedBalance: number;
  confidenceScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string;
}

export interface FinancialGoal {
  id: string;
  userId: string;
  type: 'SPENDING_LIMIT' | 'SAVINGS_TARGET';
  amount: number;
  month: string; // YYYY-MM
}

export interface AISettings {
  insightsPrompt: string;
  receiptPrompt: string;
}
