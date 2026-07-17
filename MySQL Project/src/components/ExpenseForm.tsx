import React, { useState, useEffect } from 'react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants.ts';
import { Transaction } from '../types.ts';
import CategoryIcon from './CategoryIcon.tsx';
import { X, Calendar, DollarSign, FileText } from 'lucide-react';

interface ExpenseFormProps {
  initialTransaction?: Transaction | null;
  onSave: (txData: {
    type: 'expense' | 'income';
    amount: number;
    category: string;
    description: string;
    date: string;
  }) => Promise<void>;
  onClose: () => void;
}

export default function ExpenseForm({ initialTransaction, onSave, onClose }: ExpenseFormProps) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTransaction) {
      setType(initialTransaction.type);
      setAmount(initialTransaction.amount.toString());
      setCategory(initialTransaction.category);
      setDescription(initialTransaction.description || '');
      setDate(initialTransaction.date);
    } else {
      // Set default category
      setCategory(type === 'expense' ? EXPENSE_CATEGORIES[0].id : INCOME_CATEGORIES[0].id);
    }
  }, [initialTransaction]);

  // Adjust category if type changes
  const handleTypeChange = (newType: 'expense' | 'income') => {
    setType(newType);
    setCategory(newType === 'expense' ? EXPENSE_CATEGORIES[0].id : INCOME_CATEGORIES[0].id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('অনুগ্রহ করে সঠিক টাকার পরিমাণ প্রবেশ করান।');
      return;
    }

    if (!category) {
      setError('একটি ক্যাটাগরি নির্বাচন করুন।');
      return;
    }

    if (!date) {
      setError('তারিখ নির্বাচন করুন।');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        type,
        amount: numAmount,
        category,
        description,
        date,
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'হিসাব সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  // Colors mapping for category borders/backgrounds
  const colorClasses: Record<string, { border: string; bg: string; text: string }> = {
    amber: { border: 'border-[#A8A88E]', bg: 'bg-[#F2EDE4]', text: 'text-[#A8A88E]' },
    blue: { border: 'border-slate-300', bg: 'bg-[#E4E9F2]', text: 'text-slate-700' },
    purple: { border: 'border-[#E5E5DF]', bg: 'bg-[#F2EDE4]', text: 'text-[#8A8A7A]' },
    rose: { border: 'border-rose-200', bg: 'bg-rose-50', text: 'text-rose-700' },
    indigo: { border: 'border-[#D9D9C1]', bg: 'bg-[#E4E9F2]', text: 'text-[#5A5A40]' },
    pink: { border: 'border-[#E5E5DF]', bg: 'bg-[#F2EDE4]', text: 'text-[#A8A88E]' },
    teal: { border: 'border-[#D9D9C1]', bg: 'bg-[#D9E0D7]', text: 'text-[#5A5A40]' },
    violet: { border: 'border-slate-200', bg: 'bg-[#E4E9F2]', text: 'text-[#8A8A7A]' },
    emerald: { border: 'border-[#D9D9C1]', bg: 'bg-[#D9E0D7]', text: 'text-[#5A5A40]' },
    green: { border: 'border-[#D9D9C1]', bg: 'bg-[#D9E0D7]', text: 'text-[#5A5A40]' },
    cyan: { border: 'border-teal-200', bg: 'bg-[#E4E9F2]', text: 'text-teal-700' },
    sky: { border: 'border-sky-200', bg: 'bg-[#E4E9F2]', text: 'text-sky-700' },
    gray: { border: 'border-[#E5E5DF]', bg: 'bg-[#F0F0E8]', text: 'text-[#8A8A7A]' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2D2A]/60 backdrop-blur-xs animate-fade-in font-sans">
      <div className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl border border-[#E5E5DF] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F0F0E8] shrink-0">
          <h2 className="text-xl font-serif font-bold text-[#2D2D2A]">
            {initialTransaction ? 'হিসাব পরিবর্তন করুন' : 'নতুন হিসাব যোগ করুন'}
          </h2>
          <button
            id="close-form-btn"
            onClick={onClose}
            className="p-1.5 text-[#8A8A7A] hover:text-[#5A5A40] hover:bg-[#F5F5F0] rounded-full transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-sm text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Transaction Type Sliding Toggle */}
          <div className="p-1 bg-[#F0F0E8] rounded-2xl flex relative">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex-1 py-3 text-center rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
                type === 'expense'
                  ? 'bg-white text-rose-700 shadow-xs border border-[#E5E5DF]'
                  : 'text-[#8A8A7A] hover:text-[#2D2D2A]'
              }`}
            >
              খরচ (Expense)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex-1 py-3 text-center rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
                type === 'income'
                  ? 'bg-white text-[#5A5A40] shadow-xs border border-[#E5E5DF]'
                  : 'text-[#8A8A7A] hover:text-[#2D2D2A]'
              }`}
            >
              আয় (Income)
            </button>
          </div>

          {/* Amount and Date row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Amount */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#2D2D2A] flex items-center gap-1.5">
                <DollarSign size={16} className="text-[#8A8A7A]" /> টাকার পরিমাণ *
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0.00"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#F9F9F5] border border-[#E5E5DF] rounded-2xl focus:ring-2 focus:ring-[#5A5A40]/10 focus:border-[#5A5A40] font-semibold text-[#2D2D2A] outline-none transition"
                />
                <span className="absolute left-3 top-3.5 text-[#8A8A7A] font-medium text-sm">৳</span>
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#2D2D2A] flex items-center gap-1.5">
                <Calendar size={16} className="text-[#8A8A7A]" /> তারিখ *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-[#F9F9F5] border border-[#E5E5DF] rounded-2xl focus:ring-2 focus:ring-[#5A5A40]/10 focus:border-[#5A5A40] font-medium text-[#2D2D2A] outline-none transition"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#2D2D2A] flex items-center gap-1.5">
              <FileText size={16} className="text-[#8A8A7A]" /> মন্তব্য / বিবরণ (ঐচ্ছিক)
            </label>
            <input
              type="text"
              placeholder="সংক্ষিপ্ত বর্ণনা লিখুন..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-[#F9F9F5] border border-[#E5E5DF] rounded-2xl focus:ring-2 focus:ring-[#5A5A40]/10 focus:border-[#5A5A40] font-medium text-[#2D2D2A] outline-none transition"
            />
          </div>

          {/* Category Grid Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-[#2D2D2A]">
              ক্যাটাগরি নির্বাচন করুন *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {categories.map((cat) => {
                const colors = colorClasses[cat.color] || colorClasses.gray;
                const isSelected = category === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? `${colors.border} ${colors.bg} ring-2 ring-offset-1 ${type === 'expense' ? 'ring-rose-500' : 'ring-[#5A5A40]'}`
                        : 'border-[#E5E5DF] hover:bg-[#F9F9F5]'
                    }`}
                  >
                    <div className={`p-2 rounded-xl mb-1.5 ${colors.bg} ${colors.text}`}>
                      <CategoryIcon name={cat.icon} size={20} />
                    </div>
                    <span className="text-xs font-semibold text-[#2D2D2A] break-words leading-tight max-w-[80px]">
                      {cat.banglaName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        {/* Action Buttons */}
        <div className="p-6 border-t border-[#F0F0E8] shrink-0 bg-[#F9F9F5] flex items-center gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 border border-[#E5E5DF] bg-white hover:bg-[#F5F5F0] text-[#8A8A7A] text-sm font-semibold rounded-2xl transition active:scale-[0.98] cursor-pointer"
          >
            বাতিল
          </button>
          <button
            id="save-tx-btn"
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className={`px-6 py-3 text-white text-sm font-semibold rounded-2xl shadow-sm transition active:scale-[0.98] flex items-center gap-2 cursor-pointer ${
              type === 'expense'
                ? 'bg-[#2D2D2A] hover:bg-rose-700'
                : 'bg-[#5A5A40] hover:bg-[#6B6B4E]'
            } disabled:opacity-50`}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : null}
            সংরক্ষণ করুন
          </button>
        </div>

      </div>
    </div>
  );
}
