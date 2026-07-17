import { useState, useMemo } from 'react';
import { Transaction, UserProfile } from '../types.ts';
import { getCategoryDetails, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants.ts';
import CategoryIcon from './CategoryIcon.tsx';
import {
  PlusCircle,
  LogOut,
  TrendingUp,
  TrendingDown,
  Wallet,
  Trash2,
  Edit2,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  X,
  Sparkles,
  Info
} from 'lucide-react';

interface ExpenseDashboardProps {
  user: UserProfile;
  transactions: Transaction[];
  onAddClick: () => void;
  onEditClick: (tx: Transaction) => void;
  onDeleteClick: (id: number) => Promise<void>;
  onSignOut: () => void;
}

export default function ExpenseDashboard({
  user,
  transactions,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onSignOut
}: ExpenseDashboardProps) {
  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'expense' | 'income'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Financial Summaries
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach(tx => {
      if (tx.type === 'income') {
        income += tx.amount;
      } else {
        expense += tx.amount;
      }
    });
    return {
      income,
      expense,
      balance: income - expense,
      ratio: income > 0 ? Math.min(Math.round((expense / income) * 100), 100) : (expense > 0 ? 100 : 0)
    };
  }, [transactions]);

  // Categories list based on transactions
  const uniqueCategoriesUsed = useMemo(() => {
    const categories = new Set<string>();
    transactions.forEach(tx => categories.add(tx.category));
    return Array.from(categories);
  }, [transactions]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchSearch =
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = selectedType === 'all' || tx.type === selectedType;
      const matchCategory = selectedCategory === 'all' || tx.category === selectedCategory;
      const matchStartDate = !startDate || tx.date >= startDate;
      const matchEndDate = !endDate || tx.date <= endDate;

      return matchSearch && matchType && matchCategory && matchStartDate && matchEndDate;
    });
  }, [transactions, searchTerm, selectedType, selectedCategory, startDate, endDate]);

  // Grouped category summaries (for expense stats visualization)
  const categoryStats = useMemo(() => {
    const expenseMap: Record<string, number> = {};
    let totalExpense = 0;

    transactions.forEach(tx => {
      if (tx.type === 'expense') {
        expenseMap[tx.category] = (expenseMap[tx.category] || 0) + tx.amount;
        totalExpense += tx.amount;
      }
    });

    return Object.entries(expenseMap)
      .map(([catId, amount]) => {
        const catDetails = getCategoryDetails(catId);
        return {
          id: catId,
          amount,
          percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
          color: catDetails.color,
          banglaName: catDetails.banglaName,
          icon: catDetails.icon
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await onDeleteClick(id);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedCategory('all');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = searchTerm || selectedType !== 'all' || selectedCategory !== 'all' || startDate || endDate;

  // Colors mapping for tailwind
  const colorClasses: Record<string, { bg: string; text: string; fill: string; progress: string }> = {
    amber: { bg: 'bg-[#F2EDE4]', text: 'text-[#A8A88E]', fill: 'fill-[#A8A88E]', progress: 'bg-[#A8A88E]' },
    blue: { bg: 'bg-[#E4E9F2]', text: 'text-slate-700', fill: 'fill-slate-700', progress: 'bg-slate-600' },
    purple: { bg: 'bg-[#F2EDE4]', text: 'text-[#8A8A7A]', fill: 'fill-[#8A8A7A]', progress: 'bg-[#8A8A7A]' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-700', fill: 'fill-rose-700', progress: 'bg-rose-600' },
    indigo: { bg: 'bg-[#E4E9F2]', text: 'text-[#5A5A40]', fill: 'fill-[#5A5A40]', progress: 'bg-[#5A5A40]' },
    pink: { bg: 'bg-[#F2EDE4]', text: 'text-[#A8A88E]', fill: 'fill-[#A8A88E]', progress: 'bg-[#A8A88E]' },
    teal: { bg: 'bg-[#D9E0D7]', text: 'text-[#5A5A40]', fill: 'fill-[#5A5A40]', progress: 'bg-[#5A5A40]' },
    violet: { bg: 'bg-[#E4E9F2]', text: 'text-[#8A8A7A]', fill: 'fill-[#8A8A7A]', progress: 'bg-[#8A8A7A]' },
    emerald: { bg: 'bg-[#D9E0D7]', text: 'text-[#5A5A40]', fill: 'fill-[#5A5A40]', progress: 'bg-[#5A5A40]' },
    green: { bg: 'bg-[#D9E0D7]', text: 'text-[#5A5A40]', fill: 'fill-[#5A5A40]', progress: 'bg-[#5A5A40]' },
    cyan: { bg: 'bg-[#E4E9F2]', text: 'text-teal-700', fill: 'fill-teal-700', progress: 'bg-teal-700' },
    sky: { bg: 'bg-[#E4E9F2]', text: 'text-sky-700', fill: 'fill-sky-700', progress: 'bg-sky-600' },
    gray: { bg: 'bg-[#F0F0E8]', text: 'text-[#8A8A7A]', fill: 'fill-[#8A8A7A]', progress: 'bg-[#8A8A7A]' },
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#2D2D2A] flex flex-col font-sans">
      
      {/* Upper Navigation Bar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-[#E5E5DF] sticky top-0 z-40 shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#5A5A40] text-[#F5F5F0] flex items-center justify-center shadow-md shadow-[#5A5A40]/10">
              <Wallet size={20} />
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold text-[#5A5A40] tracking-tight">দৈনিক খরচ ট্র্যাকার</h1>
              <p className="text-xxs text-[#8A8A7A] font-mono hidden sm:block">CLOUDSQL POSTGRESQL SECURED</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2.5">
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#2D2D2A] leading-tight">
                    {user.displayName || 'ব্যবহারকারী'}
                  </p>
                  <p className="text-xs text-[#8A8A7A] hidden sm:block">{user.email}</p>
                </div>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="profile"
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full border-2 border-[#5A5A40] object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full border border-[#E5E5DF] bg-[#D9E0D7] text-[#5A5A40] flex items-center justify-center font-bold text-sm">
                    {(user.displayName || user.email || 'ইউ').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            )}
            <button
              id="signout-btn"
              onClick={onSignOut}
              className="p-2.5 text-[#8A8A7A] hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all duration-200 cursor-pointer"
              title="লগ-আউট"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 overflow-y-auto">
        
        {/* Top Summaries Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Current Balance Card */}
          <div className="bg-[#5A5A40] text-white rounded-[32px] p-6 shadow-sm relative overflow-hidden flex flex-col justify-between h-[180px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D9E0D7]/10 rounded-full blur-2xl -mr-8 -mt-8" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#D9E0D7]">বর্তমান মোট ব্যালেন্স</span>
              <div className="p-2.5 bg-[#6B6B4E] rounded-2xl text-[#D9E0D7]">
                <Wallet size={20} />
              </div>
            </div>
            <div>
              <h2 className="text-4xl font-serif font-bold tracking-tight">
                ৳{totals.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <p className="text-xs text-[#D9E0D7] mt-1 flex items-center gap-1 font-medium">
                <Sparkles size={12} className="text-[#D9E0D7]" /> আয় ও ব্যয়ের সমন্বিত হিসাব
              </p>
            </div>
          </div>

          {/* Income Card */}
          <div className="bg-white rounded-[32px] p-6 border border-[#E5E5DF] shadow-sm flex flex-col justify-between h-[180px]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#8A8A7A]">মোট আয় (Income)</span>
              <div className="p-2.5 bg-[#D9E0D7] text-[#5A5A40] rounded-2xl">
                <TrendingUp size={20} />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-serif font-bold text-[#5A5A40] tracking-tight">
                ৳{totals.income.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <p className="text-xs text-[#5A5A40] font-semibold mt-1">
                + সফলভাবে জমা হয়েছে
              </p>
            </div>
          </div>

          {/* Expense Card */}
          <div className="bg-white rounded-[32px] p-6 border border-[#E5E5DF] shadow-sm flex flex-col justify-between h-[180px]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#8A8A7A]">মোট ব্যয় (Expense)</span>
              <div className="p-2.5 bg-[#F2EDE4] text-[#A8A88E] rounded-2xl">
                <TrendingDown size={20} />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-serif font-bold text-[#2D2D2A] tracking-tight">
                ৳{totals.expense.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-[#8A8A7A] font-medium">আয়ের {totals.ratio}% খরচ হয়েছে</span>
                {/* Micro circular indicator */}
                <div className="w-16 bg-[#F0F0E8] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#5A5A40]"
                    style={{ width: `${totals.ratio}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Visual Charts & Category Insights Section */}
        {transactions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Category spending bar progression */}
            <div className="bg-white rounded-[32px] p-6 border border-[#E5E5DF] shadow-sm lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-serif font-bold text-[#2D2D2A]">খরচের ক্যাটাগরি ভিত্তিক বিশ্লেষণ</h3>
                  <p className="text-xs text-[#8A8A7A] mt-0.5">কোন খাতে সবচেয়ে বেশি ব্যয় হচ্ছে দেখুন</p>
                </div>
                <div className="bg-[#F9F9F5] text-[#5A5A40] text-xs px-3 py-1.5 rounded-xl border border-[#E5E5DF] font-semibold">
                  ব্যয় খাত বিশ্লেষণ
                </div>
              </div>

              {categoryStats.length === 0 ? (
                <div className="py-12 text-center text-[#8A8A7A] text-sm font-medium">
                  এখনো কোনো খরচের হিসাব রেকর্ড করা হয়নি।
                </div>
              ) : (
                <div className="space-y-4">
                  {categoryStats.map(stat => {
                    const colors = colorClasses[stat.color] || colorClasses.gray;
                    return (
                      <div key={stat.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${colors.bg} ${colors.text}`}>
                              <CategoryIcon name={stat.icon} size={14} />
                            </div>
                            <span className="font-semibold text-[#2D2D2A]">{stat.banglaName}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-[#2D2D2A]">৳{stat.amount.toLocaleString('en-IN')}</span>
                            <span className="text-xs text-[#8A8A7A] ml-1.5">({stat.percentage}%)</span>
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-[#F0F0E8] rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${colors.progress}`}
                            style={{ width: `${stat.percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Visual Circular Budget/Usage Ring Gauge */}
            <div className="bg-white rounded-[32px] p-6 border border-[#E5E5DF] shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-serif font-bold text-[#2D2D2A]">বাজেট ব্যবহার মিটার</h3>
                <p className="text-xs text-[#8A8A7A] mt-0.5">মোট আয়ের কত অংশ ব্যয় হচ্ছে</p>
              </div>

              <div className="flex flex-col items-center justify-center my-6 relative">
                {/* Pure custom SVG radial gauge */}
                <svg className="w-40 h-40 transform -rotate-90">
                  {/* Track ring */}
                  <circle
                    cx="80"
                    cy="80"
                    r="64"
                    className="stroke-[#F0F0E8]"
                    strokeWidth="12"
                    fill="transparent"
                  />
                  {/* Progress ring */}
                  <circle
                    cx="80"
                    cy="80"
                    r="64"
                    className={`transition-all duration-1000 ${
                      totals.ratio > 80
                        ? 'stroke-rose-600'
                        : totals.ratio > 50
                        ? 'stroke-[#A8A88E]'
                        : 'stroke-[#5A5A40]'
                    }`}
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={402}
                    strokeDashoffset={402 - (402 * totals.ratio) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                {/* Center text overlay */}
                <div className="absolute text-center">
                  <span className="text-3xl font-serif font-bold text-[#2D2D2A]">{totals.ratio}%</span>
                  <p className="text-xs font-semibold text-[#8A8A7A] uppercase tracking-wider mt-0.5">খরচ</p>
                </div>
              </div>

              <div className="bg-[#F9F9F5] rounded-2xl p-3.5 flex items-start gap-3 border border-[#E5E5DF]">
                <Info size={16} className="text-[#8A8A7A] shrink-0 mt-0.5" />
                <p className="text-xxs text-[#8A8A7A] leading-relaxed font-medium">
                  {totals.ratio > 80
                    ? 'সতর্কতা! আপনার খরচের অনুপাত অনেক বেশি। হিসাব সংকুচিত করার পরামর্শ দেওয়া হলো।'
                    : totals.ratio > 50
                    ? 'আপনার আয়ের সাথে ব্যয়ের অনুপাত ঠিক আছে, তবে সতর্ক থাকুন।'
                    : 'চমৎকার! আপনার সঞ্চয় খুবই আশাব্যঞ্জক। সুন্দরভাবে বাজেট নিয়ন্ত্রণ করছেন।'}
                </p>
              </div>
            </div>

          </div>
        )}

        {/* Filters and List Dashboard Content */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-serif font-bold text-[#2D2D2A]">হিসাবের খাতা</h3>
              <p className="text-xs text-[#8A8A7A]">আপনার সমস্ত রেকর্ডসমূহ অনুসন্ধান এবং পরিবর্তন করুন</p>
            </div>
            
            {/* Add transaction trigger button */}
            <button
              id="add-tx-btn"
              onClick={onAddClick}
              className="bg-[#5A5A40] hover:bg-[#6B6B4E] text-white font-bold px-5 py-3 rounded-2xl shadow-sm hover:shadow-md transition flex items-center gap-2 text-sm shrink-0 cursor-pointer"
            >
              <PlusCircle size={18} />
              নতুন হিসাব যোগ করুন
            </button>
          </div>

          {/* Filters card */}
          <div className="bg-white rounded-[32px] p-5 border border-[#E5E5DF] shadow-sm space-y-4">
            
            {/* Row 1: Search and Type filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Search text */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="খুঁজুন (মন্তব্য বা ক্যাটাগরি)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-[#F9F9F5] border border-[#E5E5DF] rounded-2xl focus:ring-2 focus:ring-[#5A5A40]/10 focus:border-[#5A5A40] text-sm outline-none transition text-[#2D2D2A]"
                />
                <Search size={16} className="text-[#8A8A7A] absolute left-3.5 top-3.5" />
              </div>

              {/* Type filter */}
              <div className="relative">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as any)}
                  className="w-full pl-9 pr-4 py-2.5 bg-[#F9F9F5] border border-[#E5E5DF] rounded-2xl focus:ring-2 focus:ring-[#5A5A40]/10 focus:border-[#5A5A40] text-sm outline-none transition appearance-none font-medium text-[#2D2D2A]"
                >
                  <option value="all">সব হিসাব (All Types)</option>
                  <option value="expense">ব্যয় (Expenses Only)</option>
                  <option value="income">আয় (Incomes Only)</option>
                </select>
                <Filter size={16} className="text-[#8A8A7A] absolute left-3.5 top-3.5" />
              </div>

              {/* Category filter */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-[#F9F9F5] border border-[#E5E5DF] rounded-2xl focus:ring-2 focus:ring-[#5A5A40]/10 focus:border-[#5A5A40] text-sm outline-none transition appearance-none font-medium text-[#2D2D2A]"
                >
                  <option value="all">সব ক্যাটাগরি</option>
                  {uniqueCategoriesUsed.map(cat => (
                    <option key={cat} value={cat}>
                      {getCategoryDetails(cat).banglaName}
                    </option>
                  ))}
                </select>
                <Filter size={16} className="text-[#8A8A7A] absolute left-3.5 top-3.5" />
              </div>

              {/* Clear filters shortcut */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="py-2.5 px-4 border border-[#E5E5DF] hover:bg-[#F5F5F0] text-[#8A8A7A] text-xs font-semibold rounded-2xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <X size={14} />
                  ফিল্টার বাতিল
                </button>
              )}

            </div>

            {/* Row 2: Date Filters */}
            <div className="pt-2 border-t border-[#F0F0E8] flex flex-col md:flex-row md:items-center gap-4 text-xs text-[#8A8A7A]">
              <span className="font-semibold flex items-center gap-1"><Calendar size={14} /> তারিখের পরিসীমা:</span>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 bg-[#F9F9F5] border border-[#E5E5DF] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#5A5A40] font-medium text-[#2D2D2A]"
                />
                <span>থেকে</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 bg-[#F9F9F5] border border-[#E5E5DF] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#5A5A40] font-medium text-[#2D2D2A]"
                />
              </div>
            </div>

          </div>

          {/* Transactions List */}
          <div className="bg-white rounded-[32px] border border-[#E5E5DF] shadow-sm overflow-hidden">
            {filteredTransactions.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 bg-[#F9F9F5] rounded-full flex items-center justify-center text-[#8A8A7A] mx-auto mb-4 border border-[#E5E5DF]">
                  <Search size={28} />
                </div>
                <h4 className="text-base font-serif font-bold text-[#2D2D2A]">কোনো হিসাব পাওয়া যায়নি</h4>
                <p className="text-sm text-[#8A8A7A] mt-1 max-w-xs mx-auto px-4 font-medium">
                  {hasActiveFilters
                    ? 'আপনার নির্বাচিত ফিল্টার বা খোঁজার সাথে কোনো হিসাব মেলেনি।'
                    : 'আপনার এখনো কোনো হিসাব নেই। হিসাব যোগ করতে উপরের বোতামটি ব্যবহার করুন।'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 inline-flex items-center gap-1 px-4 py-2 bg-[#F9F9F5] border border-[#E5E5DF] hover:bg-[#F5F5F0] text-[#2D2D2A] text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    সব হিসাব দেখুন
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-[#F0F0E8]">
                
                {/* List Items */}
                {filteredTransactions.map((tx) => {
                  const cat = getCategoryDetails(tx.category);
                  const colors = colorClasses[cat.color] || colorClasses.gray;
                  const isExpense = tx.type === 'expense';
                  const isDeleting = deletingId === tx.id;

                  return (
                    <div
                      key={tx.id}
                      className="p-4 sm:p-5 flex items-center justify-between hover:bg-[#F9F9F5] transition-all duration-150"
                    >
                      {/* Left: Icon & Description */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Category Circle Icon */}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${colors.bg} ${colors.text} border border-white shadow-xs`}>
                          <CategoryIcon name={cat.icon} size={22} />
                        </div>
                        
                        {/* Main info */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-[#2D2D2A] leading-tight font-sans">
                              {cat.banglaName}
                            </h4>
                            <span className="text-xxs text-[#8A8A7A] font-mono hidden sm:inline bg-[#F0F0E8] px-1.5 py-0.5 rounded-md">
                              {tx.date}
                            </span>
                          </div>
                          
                          {/* Description text */}
                          <p className="text-xs text-[#8A8A7A] font-medium truncate max-w-[200px] sm:max-w-md mt-0.5 font-sans">
                            {tx.description || <span className="text-[#C2C2B8] italic">কোনো মন্তব্য নেই</span>}
                          </p>
                          
                          <span className="text-xxs text-[#8A8A7A] sm:hidden block font-mono mt-0.5">
                            {tx.date}
                          </span>
                        </div>
                      </div>

                      {/* Right: Amount & Actions */}
                      <div className="flex items-center gap-4">
                        <div className="text-right shrink-0">
                          <span className={`text-base font-serif font-bold tracking-tight ${isExpense ? 'text-rose-600' : 'text-[#5A5A40]'}`}>
                            {isExpense ? '-' : '+'}৳{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 border-l border-[#F0F0E8] pl-3">
                          <button
                            onClick={() => onEditClick(tx)}
                            className="p-1.5 text-[#8A8A7A] hover:text-[#5A5A40] hover:bg-[#F5F5F0] rounded-lg transition cursor-pointer"
                            title="সম্পাদনা"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            disabled={isDeleting}
                            className="p-1.5 text-[#8A8A7A] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            {isDeleting ? (
                              <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}

              </div>
            )}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E5DF] py-6 text-center text-xs text-[#8A8A7A] shrink-0 font-sans mt-auto">
        <p>© {new Date().getFullYear()} দৈনিক খরচ ট্র্যাকার • সুরক্ষিত ক্লাউড ডাটাবেস এ সংরক্ষিত</p>
      </footer>

    </div>
  );
}
