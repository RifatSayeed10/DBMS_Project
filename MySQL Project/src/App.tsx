import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './lib/firebase.ts';
import { Transaction, UserProfile } from './types.ts';
import {
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction
} from './lib/api.ts';
import LoginScreen from './components/LoginScreen.tsx';
import ExpenseDashboard from './components/ExpenseDashboard.tsx';
import ExpenseForm from './components/ExpenseForm.tsx';
import { Wallet, AlertCircle } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal / Form state
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
      } else {
        setUser(null);
        setTransactions([]);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Use user.uid as a primitive trigger for fetching data to avoid infinite loops
  const userUid = user?.uid;

  // 2. Fetch Transactions whenever the user logs in
  useEffect(() => {
    if (!userUid) {
      return;
    }

    const loadData = async () => {
      setDataLoading(true);
      setError(null);
      try {
        const data = await fetchTransactions();
        setTransactions(data);
      } catch (err: any) {
        console.error('Error loading transaction data:', err);
        setError(err.message || 'ডাটাবেস থেকে হিসাব লোড করতে সমস্যা হয়েছে।');
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [userUid]);

  const handleSaveTransaction = async (txData: {
    type: 'expense' | 'income';
    amount: number;
    category: string;
    description: string;
    date: string;
  }) => {
    try {
      if (editingTransaction) {
        const updated = await updateTransaction(editingTransaction.id, txData);
        setTransactions(prev =>
          prev.map(t => (t.id === editingTransaction.id ? updated : t))
        );
      } else {
        const created = await createTransaction(txData);
        setTransactions(prev => [created, ...prev]);
      }
      setShowForm(false);
      setEditingTransaction(null);
    } catch (err: any) {
      console.error('Error saving transaction:', err);
      throw err;
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    try {
      await deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      console.error('Error deleting transaction:', err);
      setError(err.message || 'হিসাব মুছতে সমস্যা হয়েছে।');
      throw err;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Loading Screens
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-16 h-16 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-500 animate-pulse">লোড হচ্ছে...</p>
      </div>
    );
  }

  // Login Screen if not authenticated
  if (!user) {
    return (
      <LoginScreen
        onLoginStart={() => setAuthLoading(true)}
        onLoginSuccess={() => setAuthLoading(false)}
      />
    );
  }

  // Main Dashboard if authenticated
  return (
    <div className="min-h-screen bg-slate-50 relative flex flex-col font-sans">
      
      {/* Centralized notification alerts */}
      {error && (
        <div className="bg-rose-600 text-white p-4 text-center text-sm font-semibold flex items-center justify-center gap-2 relative z-50 animate-bounce">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-3 font-bold border border-white/40 hover:border-white rounded-full w-5 h-5 flex items-center justify-center text-xxs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Loading overlay for active database fetch */}
      {dataLoading && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 animate-pulse z-50" />
      )}

      {/* Dashboard View */}
      <ExpenseDashboard
        user={user}
        transactions={transactions}
        onAddClick={() => {
          setEditingTransaction(null);
          setShowForm(true);
        }}
        onEditClick={(tx) => {
          setEditingTransaction(tx);
          setShowForm(true);
        }}
        onDeleteClick={handleDeleteTransaction}
        onSignOut={handleSignOut}
      />

      {/* Transaction Entry Form Modal */}
      {showForm && (
        <ExpenseForm
          initialTransaction={editingTransaction}
          onSave={handleSaveTransaction}
          onClose={() => {
            setShowForm(false);
            setEditingTransaction(null);
          }}
        />
      )}

    </div>
  );
}
