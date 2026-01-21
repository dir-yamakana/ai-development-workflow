import type { Category } from '../types/household';

export const DEFAULT_CATEGORIES: Category[] = [
  // Income categories
  { id: 'income-salary', name: '給料', type: 'income', color: '#10b981', icon: '💰' },
  { id: 'income-bonus', name: 'ボーナス', type: 'income', color: '#059669', icon: '🎁' },
  { id: 'income-investment', name: '投資収益', type: 'income', color: '#34d399', icon: '📈' },
  { id: 'income-other', name: 'その他収入', type: 'income', color: '#6ee7b7', icon: '💵' },

  // Expense categories
  { id: 'expense-food', name: '食費', type: 'expense', color: '#ef4444', icon: '🍽️' },
  { id: 'expense-transport', name: '交通費', type: 'expense', color: '#f97316', icon: '🚗' },
  { id: 'expense-housing', name: '住居費', type: 'expense', color: '#ec4899', icon: '🏠' },
  { id: 'expense-utilities', name: '光熱費', type: 'expense', color: '#8b5cf6', icon: '💡' },
  { id: 'expense-entertainment', name: '娯楽費', type: 'expense', color: '#06b6d4', icon: '🎮' },
  { id: 'expense-healthcare', name: '医療費', type: 'expense', color: '#14b8a6', icon: '🏥' },
  { id: 'expense-education', name: '教育費', type: 'expense', color: '#3b82f6', icon: '📚' },
  { id: 'expense-shopping', name: '買い物', type: 'expense', color: '#a855f7', icon: '🛍️' },
  { id: 'expense-other', name: 'その他支出', type: 'expense', color: '#64748b', icon: '📝' },

  // Savings categories
  { id: 'savings-emergency', name: '緊急資金', type: 'savings', color: '#0ea5e9', icon: '🛡️' },
  { id: 'savings-investment', name: '投資用', type: 'savings', color: '#8b5cf6', icon: '💎' },
  { id: 'savings-goal', name: '目的別貯金', type: 'savings', color: '#06b6d4', icon: '🎯' },
];

export const CURRENCY_SYMBOLS: Record<string, string> = {
  JPY: '¥',
  USD: '$',
  EUR: '€',
  GBP: '£',
  CNY: '¥',
};
