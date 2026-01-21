import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import type { Transaction, Category, Budget } from '../types/household';

export function formatCurrency(amount: number, currency: string = 'JPY'): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function getMonthKey(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM');
}

export function calculateTotals(transactions: Transaction[], month?: string) {
  const filtered = month
    ? transactions.filter((t) => getMonthKey(t.date) === month)
    : transactions;

  const income = filtered
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = filtered
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const savings = filtered
    .filter((t) => t.type === 'savings')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    income,
    expense,
    savings,
    balance: income - expense - savings,
  };
}

export function getCategoryTotals(
  transactions: Transaction[],
  categories: Category[],
  type: 'income' | 'expense' | 'savings',
  month?: string
) {
  const filtered = transactions.filter((t) => {
    const matchesType = t.type === type;
    const matchesMonth = month ? getMonthKey(t.date) === month : true;
    return matchesType && matchesMonth;
  });

  const totals = filtered.reduce((acc, transaction) => {
    acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
    return acc;
  }, {} as Record<string, number>);

  return categories
    .filter((c) => c.type === type)
    .map((category) => ({
      category: category.name,
      amount: totals[category.id] || 0,
      color: category.color,
      icon: category.icon,
    }))
    .filter((item) => item.amount > 0);
}

export function getBudgetProgress(
  transactions: Transaction[],
  budgets: Budget[],
  categories: Category[]
) {
  return budgets.map((budget) => {
    const category = categories.find((c) => c.id === budget.categoryId);
    const spent = transactions
      .filter((t) => t.category === budget.categoryId && getMonthKey(t.date) === budget.month)
      .reduce((sum, t) => sum + t.amount, 0);

    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

    return {
      ...budget,
      categoryName: category?.name || 'Unknown',
      categoryColor: category?.color || '#64748b',
      spent,
      percentage,
      isOverBudget: spent > budget.amount,
    };
  });
}

export function getTransactionsByDateRange(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
) {
  return transactions.filter((t) => {
    const transactionDate = parseISO(t.date);
    return isWithinInterval(transactionDate, { start: startDate, end: endDate });
  });
}

export function getMonthlyTrend(transactions: Transaction[], months: number = 6) {
  const now = new Date();
  const data: Array<{ month: string; income: number; expense: number; savings: number }> = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = getMonthKey(date);
    const totals = calculateTotals(transactions, monthKey);

    data.push({
      month: format(date, 'MMM'),
      ...totals,
    });
  }

  return data;
}
