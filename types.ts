
export enum UserRole {
  NORMAL = 'NORMAL',
  ADVANCED = 'ADVANCED'
}

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
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
  attachment?: string; // Base64 string
  attachmentName?: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
}

export interface AppState {
  user: User | null;
  transactions: Transaction[];
  isLoading: boolean;
}

export interface FinancialForecast {
  predictedBalance: number;
  confidenceScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string;
}
