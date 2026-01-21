'use client';

import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DEFAULT_CATEGORIES } from '../constants/household';
import type { Transaction, Category, Budget, SavingsGoal, HouseholdData, TransactionType } from '../types/household';
import {
  formatCurrency,
  getMonthKey,
  calculateTotals,
  getCategoryTotals,
  getBudgetProgress,
  getMonthlyTrend,
} from '../utils/household';

export default function HouseholdPage() {
  const [data, setData] = useLocalStorage<HouseholdData>('household-data', {
    transactions: [],
    categories: DEFAULT_CATEGORIES,
    budgets: [],
    savingsGoals: [],
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'budgets' | 'goals' | 'reports'>('dashboard');
  const [currentMonth, setCurrentMonth] = useState(getMonthKey(new Date()));
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    type: 'expense',
    amount: 0,
    category: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    memo: '',
  });

  const [newBudget, setNewBudget] = useState<Partial<Budget>>({
    categoryId: '',
    amount: 0,
    month: currentMonth,
  });

  const [newGoal, setNewGoal] = useState<Partial<SavingsGoal>>({
    name: '',
    targetAmount: 0,
    currentAmount: 0,
    deadline: '',
  });

  // Calculations
  const currentTotals = useMemo(() => calculateTotals(data.transactions, currentMonth), [data.transactions, currentMonth]);
  const allTimeTotals = useMemo(() => calculateTotals(data.transactions), [data.transactions]);
  const monthlyTrend = useMemo(() => getMonthlyTrend(data.transactions, 6), [data.transactions]);

  const expenseByCategory = useMemo(
    () => getCategoryTotals(data.transactions, data.categories, 'expense', currentMonth),
    [data.transactions, data.categories, currentMonth]
  );

  const incomeByCategory = useMemo(
    () => getCategoryTotals(data.transactions, data.categories, 'income', currentMonth),
    [data.transactions, data.categories, currentMonth]
  );

  const budgetProgress = useMemo(
    () => getBudgetProgress(data.transactions, data.budgets.filter((b) => b.month === currentMonth), data.categories),
    [data.transactions, data.budgets, data.categories, currentMonth]
  );

  // Transaction handlers
  const addTransaction = () => {
    if (!newTransaction.amount || !newTransaction.category) return;

    const transaction: Transaction = {
      id: Date.now().toString(),
      type: newTransaction.type as TransactionType,
      amount: Number(newTransaction.amount),
      category: newTransaction.category,
      date: newTransaction.date || format(new Date(), 'yyyy-MM-dd'),
      memo: newTransaction.memo,
    };

    setData({
      ...data,
      transactions: [...data.transactions, transaction],
    });

    setNewTransaction({
      type: 'expense',
      amount: 0,
      category: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      memo: '',
    });
  };

  const deleteTransaction = (id: string) => {
    setData({
      ...data,
      transactions: data.transactions.filter((t) => t.id !== id),
    });
  };

  // Budget handlers
  const addBudget = () => {
    if (!newBudget.categoryId || !newBudget.amount) return;

    const budget: Budget = {
      id: Date.now().toString(),
      categoryId: newBudget.categoryId,
      amount: Number(newBudget.amount),
      month: newBudget.month || currentMonth,
    };

    setData({
      ...data,
      budgets: [...data.budgets, budget],
    });

    setNewBudget({
      categoryId: '',
      amount: 0,
      month: currentMonth,
    });
  };

  const deleteBudget = (id: string) => {
    setData({
      ...data,
      budgets: data.budgets.filter((b) => b.id !== id),
    });
  };

  // Savings goal handlers
  const addGoal = () => {
    if (!newGoal.name || !newGoal.targetAmount) return;

    const goal: SavingsGoal = {
      id: Date.now().toString(),
      name: newGoal.name,
      targetAmount: Number(newGoal.targetAmount),
      currentAmount: Number(newGoal.currentAmount || 0),
      deadline: newGoal.deadline || '',
      createdAt: new Date().toISOString(),
    };

    setData({
      ...data,
      savingsGoals: [...data.savingsGoals, goal],
    });

    setNewGoal({
      name: '',
      targetAmount: 0,
      currentAmount: 0,
      deadline: '',
    });
  };

  const updateGoalProgress = (id: string, amount: number) => {
    setData({
      ...data,
      savingsGoals: data.savingsGoals.map((g) =>
        g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g
      ),
    });
  };

  const deleteGoal = (id: string) => {
    setData({
      ...data,
      savingsGoals: data.savingsGoals.filter((g) => g.id !== id),
    });
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return data.transactions
      .filter((t) => {
        const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
        const matchesSearch =
          searchQuery === '' ||
          t.memo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          data.categories.find((c) => c.id === t.category)?.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.transactions, data.categories, filterCategory, searchQuery]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['日付', '種類', 'カテゴリー', '金額', 'メモ'];
    const rows = data.transactions.map((t) => {
      const category = data.categories.find((c) => c.id === t.category);
      return [
        t.date,
        t.type === 'income' ? '収入' : t.type === 'expense' ? '支出' : '貯金',
        category?.name || '',
        t.amount.toString(),
        t.memo || '',
      ];
    });

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `household_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const availableCategories = data.categories.filter((c) => c.type === newTransaction.type);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            💰 家計簿アプリ
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">モダンでスタイリッシュな家計管理</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {[
            { id: 'dashboard', label: 'ダッシュボード', icon: '📊' },
            { id: 'transactions', label: '取引記録', icon: '💳' },
            { id: 'budgets', label: '予算管理', icon: '🎯' },
            { id: 'goals', label: '貯金目標', icon: '💎' },
            { id: 'reports', label: 'レポート', icon: '📈' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-105'
                  : 'bg-white/60 dark:bg-gray-800/60 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-gray-800'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Month Selector */}
            <div className="flex items-center justify-between bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl p-4 shadow-xl">
              <button
                onClick={() => {
                  const date = parseISO(currentMonth + '-01');
                  date.setMonth(date.getMonth() - 1);
                  setCurrentMonth(getMonthKey(date));
                }}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
              >
                ← 前月
              </button>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                {format(parseISO(currentMonth + '-01'), 'yyyy年 MM月')}
              </h2>
              <button
                onClick={() => {
                  const date = parseISO(currentMonth + '-01');
                  date.setMonth(date.getMonth() + 1);
                  setCurrentMonth(getMonthKey(date));
                }}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
              >
                次月 →
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl p-6 shadow-xl text-white transform hover:scale-105 transition-transform">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">収入</p>
                    <p className="text-3xl font-bold mt-2">{formatCurrency(currentTotals.income)}</p>
                  </div>
                  <div className="text-5xl opacity-80">💰</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-400 to-rose-600 rounded-2xl p-6 shadow-xl text-white transform hover:scale-105 transition-transform">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm font-medium">支出</p>
                    <p className="text-3xl font-bold mt-2">{formatCurrency(currentTotals.expense)}</p>
                  </div>
                  <div className="text-5xl opacity-80">💸</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-400 to-cyan-600 rounded-2xl p-6 shadow-xl text-white transform hover:scale-105 transition-transform">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">貯金</p>
                    <p className="text-3xl font-bold mt-2">{formatCurrency(currentTotals.savings)}</p>
                  </div>
                  <div className="text-5xl opacity-80">🏦</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-400 to-indigo-600 rounded-2xl p-6 shadow-xl text-white transform hover:scale-105 transition-transform">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">残高</p>
                    <p className="text-3xl font-bold mt-2">{formatCurrency(currentTotals.balance)}</p>
                  </div>
                  <div className="text-5xl opacity-80">💵</div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Expense Pie Chart */}
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">支出内訳</h3>
                {expenseByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={expenseByCategory}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(props) => {
                          const entry = expenseByCategory[props.index];
                          return `${entry.category}: ${formatCurrency(entry.amount)}`;
                        }}
                        labelLine={false}
                      >
                        {expenseByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-slate-500 py-12">データがありません</p>
                )}
              </div>

              {/* Income Pie Chart */}
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">収入内訳</h3>
                {incomeByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={incomeByCategory}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(props) => {
                          const entry = incomeByCategory[props.index];
                          return `${entry.category}: ${formatCurrency(entry.amount)}`;
                        }}
                        labelLine={false}
                      >
                        {incomeByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-slate-500 py-12">データがありません</p>
                )}
              </div>
            </div>

            {/* Budget Progress */}
            {budgetProgress.length > 0 && (
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">予算進捗</h3>
                <div className="space-y-4">
                  {budgetProgress.map((item) => (
                    <div key={item.id}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{item.categoryName}</span>
                        <span className={`font-bold ${item.isOverBudget ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}`}>
                          {formatCurrency(item.spent)} / {formatCurrency(item.amount)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            item.isOverBudget ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
                          }`}
                          style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        />
                      </div>
                      {item.isOverBudget && (
                        <p className="text-red-600 text-sm mt-1">⚠️ 予算オーバー</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="space-y-6">
            {/* Add Transaction Form */}
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">取引を追加</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">種類</label>
                  <select
                    value={newTransaction.type}
                    onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value as TransactionType, category: '' })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                  >
                    <option value="income">収入</option>
                    <option value="expense">支出</option>
                    <option value="savings">貯金</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">金額</label>
                  <input
                    type="number"
                    value={newTransaction.amount || ''}
                    onChange={(e) => setNewTransaction({ ...newTransaction, amount: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">カテゴリー</label>
                  <select
                    value={newTransaction.category}
                    onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                  >
                    <option value="">選択してください</option>
                    {availableCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">日付</label>
                  <input
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">メモ</label>
                  <input
                    type="text"
                    value={newTransaction.memo}
                    onChange={(e) => setNewTransaction({ ...newTransaction, memo: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="メモを入力（任意）"
                  />
                </div>
              </div>

              <button
                onClick={addTransaction}
                className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all font-semibold shadow-lg"
              >
                追加
              </button>
            </div>

            {/* Filters */}
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">カテゴリーフィルター</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">すべて</option>
                    {data.categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">検索</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="メモやカテゴリーで検索"
                  />
                </div>
              </div>

              <button
                onClick={exportToCSV}
                className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
              >
                📥 CSV出力
              </button>
            </div>

            {/* Transaction List */}
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">取引履歴</h3>
              {filteredTransactions.length > 0 ? (
                <div className="space-y-3">
                  {filteredTransactions.map((transaction) => {
                    const category = data.categories.find((c) => c.id === transaction.category);
                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between bg-white dark:bg-gray-700 p-4 rounded-xl shadow hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="text-3xl">{category?.icon}</div>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-800 dark:text-white">{category?.name}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{format(parseISO(transaction.date), 'yyyy/MM/dd')}</p>
                            {transaction.memo && <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{transaction.memo}</p>}
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-xl font-bold ${
                                transaction.type === 'income'
                                  ? 'text-green-600'
                                  : transaction.type === 'expense'
                                  ? 'text-red-600'
                                  : 'text-blue-600'
                              }`}
                            >
                              {transaction.type === 'income' ? '+' : '-'}
                              {formatCurrency(transaction.amount)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteTransaction(transaction.id)}
                          className="ml-4 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                        >
                          削除
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-12">取引がありません</p>
              )}
            </div>
          </div>
        )}

        {/* Budgets Tab */}
        {activeTab === 'budgets' && (
          <div className="space-y-6">
            {/* Add Budget Form */}
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">予算を設定</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">カテゴリー</label>
                  <select
                    value={newBudget.categoryId}
                    onChange={(e) => setNewBudget({ ...newBudget, categoryId: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">選択してください</option>
                    {data.categories.filter((c) => c.type === 'expense').map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">予算額</label>
                  <input
                    type="number"
                    value={newBudget.amount || ''}
                    onChange={(e) => setNewBudget({ ...newBudget, amount: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">対象月</label>
                  <input
                    type="month"
                    value={newBudget.month}
                    onChange={(e) => setNewBudget({ ...newBudget, month: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                onClick={addBudget}
                className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all font-semibold shadow-lg"
              >
                設定
              </button>
            </div>

            {/* Budget List */}
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">予算一覧</h3>
              {budgetProgress.length > 0 ? (
                <div className="space-y-4">
                  {budgetProgress.map((item) => (
                    <div key={item.id} className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-lg font-bold text-slate-800 dark:text-white">{item.categoryName}</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {format(parseISO(item.month + '-01'), 'yyyy年 MM月')}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteBudget(item.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                        >
                          削除
                        </button>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-700 dark:text-slate-300">進捗</span>
                        <span className={`font-bold ${item.isOverBudget ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}`}>
                          {formatCurrency(item.spent)} / {formatCurrency(item.amount)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            item.isOverBudget ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
                          }`}
                          style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        />
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                        {item.percentage.toFixed(1)}% 使用
                      </p>
                      {item.isOverBudget && (
                        <p className="text-red-600 text-sm mt-2 font-semibold">⚠️ 予算を超過しています</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-12">予算が設定されていません</p>
              )}
            </div>
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div className="space-y-6">
            {/* Add Goal Form */}
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">貯金目標を設定</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">目標名</label>
                  <input
                    type="text"
                    value={newGoal.name}
                    onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="例: 旅行資金"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">目標金額</label>
                  <input
                    type="number"
                    value={newGoal.targetAmount || ''}
                    onChange={(e) => setNewGoal({ ...newGoal, targetAmount: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">現在の金額</label>
                  <input
                    type="number"
                    value={newGoal.currentAmount || ''}
                    onChange={(e) => setNewGoal({ ...newGoal, currentAmount: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">期限</label>
                  <input
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                onClick={addGoal}
                className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all font-semibold shadow-lg"
              >
                設定
              </button>
            </div>

            {/* Goals List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.savingsGoals.map((goal) => {
                const percentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                const isAchieved = goal.currentAmount >= goal.targetAmount;

                return (
                  <div
                    key={goal.id}
                    className={`bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl ${
                      isAchieved ? 'ring-4 ring-green-400' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xl font-bold text-slate-800 dark:text-white">{goal.name}</h4>
                        {goal.deadline && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            期限: {format(parseISO(goal.deadline), 'yyyy/MM/dd')}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteGoal(goal.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                      >
                        削除
                      </button>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-700 dark:text-slate-300">進捗</span>
                        <span className="font-bold text-slate-800 dark:text-white">
                          {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isAchieved ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-blue-400 to-purple-500'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                        {percentage.toFixed(1)}% 達成
                      </p>
                    </div>

                    {isAchieved ? (
                      <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 p-3 rounded-lg text-center font-semibold">
                        🎉 目標達成！
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="金額を追加"
                          id={`goal-add-${goal.id}`}
                          className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => {
                            const input = document.getElementById(`goal-add-${goal.id}`) as HTMLInputElement;
                            const amount = Number(input.value);
                            if (amount > 0) {
                              updateGoalProgress(goal.id, amount);
                              input.value = '';
                            }
                          }}
                          className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-semibold"
                        >
                          追加
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {data.savingsGoals.length === 0 && (
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl p-12 shadow-xl text-center">
                <p className="text-slate-500 text-lg">貯金目標が設定されていません</p>
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Monthly Trend Chart */}
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">月次推移</h3>
              {monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="income" name="収入" fill="#10b981" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="expense" name="支出" fill="#ef4444" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="savings" name="貯金" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-slate-500 py-12">データがありません</p>
              )}
            </div>

            {/* All-Time Summary */}
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">全期間サマリー</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl p-4 text-white">
                  <p className="text-sm opacity-90">総収入</p>
                  <p className="text-2xl font-bold mt-2">{formatCurrency(allTimeTotals.income)}</p>
                </div>
                <div className="bg-gradient-to-br from-red-400 to-rose-600 rounded-xl p-4 text-white">
                  <p className="text-sm opacity-90">総支出</p>
                  <p className="text-2xl font-bold mt-2">{formatCurrency(allTimeTotals.expense)}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-400 to-cyan-600 rounded-xl p-4 text-white">
                  <p className="text-sm opacity-90">総貯金</p>
                  <p className="text-2xl font-bold mt-2">{formatCurrency(allTimeTotals.savings)}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-400 to-indigo-600 rounded-xl p-4 text-white">
                  <p className="text-sm opacity-90">純資産</p>
                  <p className="text-2xl font-bold mt-2">{formatCurrency(allTimeTotals.balance)}</p>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">統計情報</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-700 p-4 rounded-xl">
                  <p className="text-sm text-slate-600 dark:text-slate-400">取引件数</p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-white mt-2">{data.transactions.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-700 p-4 rounded-xl">
                  <p className="text-sm text-slate-600 dark:text-slate-400">設定予算数</p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-white mt-2">{data.budgets.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-700 p-4 rounded-xl">
                  <p className="text-sm text-slate-600 dark:text-slate-400">貯金目標数</p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-white mt-2">{data.savingsGoals.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
