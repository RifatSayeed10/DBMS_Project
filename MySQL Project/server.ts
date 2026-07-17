import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { db } from './src/db/index.ts';
import { transactions } from './src/db/schema.ts';
import { eq, and, desc } from 'drizzle-orm';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser middleware
  app.use(express.json());

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 1. GET /api/transactions - Fetch all transactions for the authenticated user
  app.get('/api/transactions', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.dbUser) {
        return res.status(401).json({ error: 'User registration not found' });
      }

      const userTransactions = await db.select()
        .from(transactions)
        .where(eq(transactions.userId, req.dbUser.id))
        .orderBy(desc(transactions.date), desc(transactions.id));

      res.json(userTransactions);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'ডাটাবেস থেকে হিসাব আনতে সমস্যা হয়েছে।' });
    }
  });

  // 2. POST /api/transactions - Create a new transaction
  app.post('/api/transactions', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.dbUser) {
        return res.status(401).json({ error: 'User registration not found' });
      }

      const { type, amount, category, description, date } = req.body;

      if (!type || !amount || !category || !date) {
        return res.status(400).json({ error: 'সব প্রয়োজনীয় তথ্য প্রদান করুন।' });
      }

      if (type !== 'expense' && type !== 'income') {
        return res.status(400).json({ error: 'ভুল ধরণ (আয় বা ব্যয় হতে হবে)।' });
      }

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'টাকার পরিমাণ সঠিক হতে হবে।' });
      }

      const [newTx] = await db.insert(transactions)
        .values({
          userId: req.dbUser.id,
          type,
          amount: numAmount,
          category,
          description: description || '',
          date,
        })
        .returning();

      res.status(201).json(newTx);
    } catch (error) {
      console.error('Error creating transaction:', error);
      res.status(500).json({ error: 'হিসাব সংরক্ষণ করতে সমস্যা হয়েছে।' });
    }
  });

  // 3. PUT /api/transactions/:id - Update an existing transaction
  app.put('/api/transactions/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.dbUser) {
        return res.status(401).json({ error: 'User registration not found' });
      }

      const txId = Number(req.params.id);
      if (isNaN(txId)) {
        return res.status(400).json({ error: 'ভুল আইডি।' });
      }

      const { type, amount, category, description, date } = req.body;

      if (!type || !amount || !category || !date) {
        return res.status(400).json({ error: 'সব প্রয়োজনীয় তথ্য প্রদান করুন।' });
      }

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'টাকার পরিমাণ সঠিক হতে হবে।' });
      }

      const [updatedTx] = await db.update(transactions)
        .set({
          type,
          amount: numAmount,
          category,
          description: description || '',
          date,
        })
        .where(and(
          eq(transactions.id, txId),
          eq(transactions.userId, req.dbUser.id)
        ))
        .returning();

      if (!updatedTx) {
        return res.status(404).json({ error: 'হিসাবটি খুঁজে পাওয়া যায়নি।' });
      }

      res.json(updatedTx);
    } catch (error) {
      console.error('Error updating transaction:', error);
      res.status(500).json({ error: 'হিসাব আপডেট করতে সমস্যা হয়েছে।' });
    }
  });

  // 4. DELETE /api/transactions/:id - Delete a transaction
  app.delete('/api/transactions/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.dbUser) {
        return res.status(401).json({ error: 'User registration not found' });
      }

      const txId = Number(req.params.id);
      if (isNaN(txId)) {
        return res.status(400).json({ error: 'ভুল আইডি।' });
      }

      const deletedRows = await db.delete(transactions)
        .where(and(
          eq(transactions.id, txId),
          eq(transactions.userId, req.dbUser.id)
        ))
        .returning();

      if (deletedRows.length === 0) {
        return res.status(404).json({ error: 'হিসাবটি খুঁজে পাওয়া যায়নি।' });
      }

      res.json({ success: true, message: 'হিসাবটি সফলভাবে মুছে ফেলা হয়েছে।' });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      res.status(500).json({ error: 'হিসাব মুছতে সমস্যা হয়েছে।' });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
