import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, doublePrecision } from 'drizzle-orm/pg-core';

// Define the 'users' table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'transactions' table (for expenses and income)
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  type: text('type').$type<'expense' | 'income'>().notNull(), // 'expense' or 'income'
  amount: doublePrecision('amount').notNull(),
  category: text('category').notNull(), // e.g., 'Food', 'Transport', 'Rent', 'Salary', etc.
  description: text('description'),
  date: text('date').notNull(), // Format: YYYY-MM-DD
  createdAt: timestamp('created_at').defaultNow(),
});

// Define relationships for the 'users' table
export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
}));

// Define relationships for the 'transactions' table
export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));
