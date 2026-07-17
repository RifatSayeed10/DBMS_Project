import { Category } from './types.ts';

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'খাবার', name: 'Food', banglaName: 'খাবার ও রেস্তোরাঁ', icon: 'Utensils', color: 'amber', type: 'expense' },
  { id: 'পরিবহন', name: 'Transport', banglaName: 'যাতায়াত ও জ্বালানি', icon: 'Car', color: 'blue', type: 'expense' },
  { id: 'বাসা ভাড়া', name: 'Rent', banglaName: 'বাসা ভাড়া ও ইউটিলিটি', icon: 'Home', color: 'purple', type: 'expense' },
  { id: 'চিকিৎসা', name: 'Healthcare', banglaName: 'চিকিৎসা ও ওষুধ', icon: 'HeartPulse', color: 'rose', type: 'expense' },
  { id: 'শিক্ষা', name: 'Education', banglaName: 'শিক্ষা ও বইপত্র', icon: 'GraduationCap', color: 'indigo', type: 'expense' },
  { id: 'বিনোদন', name: 'Entertainment', banglaName: 'বিনোদন ও আড্ডা', icon: 'Sparkles', color: 'pink', type: 'expense' },
  { id: 'বাজার', name: 'Shopping', banglaName: 'বাজার ও কেনাকাটা', icon: 'ShoppingBag', color: 'teal', type: 'expense' },
  { id: 'উপহার', name: 'Gifts', banglaName: 'পরিবার ও উপহার', icon: 'Gift', color: 'violet', type: 'expense' },
  { id: 'অন্যান্য', name: 'Others', banglaName: 'অন্যান্য খরচ', icon: 'CircleEllipsis', color: 'gray', type: 'expense' },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: 'বেতন', name: 'Salary', banglaName: 'চাকরির বেতন', icon: 'Briefcase', color: 'emerald', type: 'income' },
  { id: 'ব্যবসা', name: 'Business', banglaName: 'ব্যবসা থেকে আয়', icon: 'TrendingUp', color: 'green', type: 'income' },
  { id: 'বিনিয়োগ', name: 'Investment', banglaName: 'বিনিয়োগ ও লভ্যাংশ', icon: 'Coins', color: 'cyan', type: 'income' },
  { id: 'বোনাস', name: 'Bonus', banglaName: 'উপহার ও বোনাস', icon: 'Award', color: 'sky', type: 'income' },
  { id: 'ফ্রিল্যান্সিং', name: 'Freelancing', banglaName: 'ফ্রিল্যান্সিং ও প্রজেক্ট', icon: 'Laptop', color: 'indigo', type: 'income' },
  { id: 'অন্যান্য আয়', name: 'Others', banglaName: 'অন্যান্য আয়', icon: 'DollarSign', color: 'gray', type: 'income' },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export function getCategoryDetails(id: string): Category {
  const found = ALL_CATEGORIES.find(c => c.id === id);
  if (found) return found;
  return { id, name: id, banglaName: id, icon: 'CircleEllipsis', color: 'gray', type: 'expense' };
}
