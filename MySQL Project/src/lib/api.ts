import { auth } from './firebase.ts';
import { Transaction } from '../types.ts';

async function getHeaders() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('ব্যবহারকারী লগ-ইন করা নেই।');
  }
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const headers = await getHeaders();
  const response = await fetch('/api/transactions', { headers });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'হিসাবগুলো লোড করতে সমস্যা হয়েছে।');
  }
  return response.json();
}

export async function createTransaction(txData: {
  type: 'expense' | 'income';
  amount: number;
  category: string;
  description: string;
  date: string;
}): Promise<Transaction> {
  const headers = await getHeaders();
  const response = await fetch('/api/transactions', {
    method: 'POST',
    headers,
    body: JSON.stringify(txData)
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'হিসাব যোগ করতে সমস্যা হয়েছে।');
  }
  return response.json();
}

export async function updateTransaction(
  id: number,
  txData: {
    type: 'expense' | 'income';
    amount: number;
    category: string;
    description: string;
    date: string;
  }
): Promise<Transaction> {
  const headers = await getHeaders();
  const response = await fetch(`/api/transactions/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(txData)
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'হিসাব আপডেট করতে সমস্যা হয়েছে।');
  }
  return response.json();
}

export async function deleteTransaction(id: number): Promise<void> {
  const headers = await getHeaders();
  const response = await fetch(`/api/transactions/${id}`, {
    method: 'DELETE',
    headers
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'হিসাব মুছতে সমস্যা হয়েছে।');
  }
}
