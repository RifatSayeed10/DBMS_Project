export interface Transaction {
  id: number;
  userId: number;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  banglaName: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
