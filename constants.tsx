
import React from 'react';
import { LayoutDashboard, Receipt, FileText, Settings, LogOut, PlusCircle, TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon } from 'lucide-react';

export const CATEGORIES = {
  INCOME: ['Vendas', 'Serviços', 'Investimentos', 'Outros'],
  EXPENSE: ['Aluguel', 'Salários', 'Fornecedores', 'Marketing', 'Infraestrutura', 'Impostos', 'Outros']
};

export const PAYMENT_METHODS = [
  'Cartão de Crédito',
  'Cartão de Débito',
  'Pix',
  'Transferência Bancária',
  'Dinheiro',
  'Boleto'
];

export const NAV_ITEMS = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
  { label: 'Transações', icon: <Receipt size={20} />, path: '/transactions' },
  { label: 'Relatórios', icon: <FileText size={20} />, path: '/reports' }
];
