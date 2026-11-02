export type NoteDraft = { title: string; amount: string; due_date: string; category: string }
export type AccountDraft = { name: string; purpose: string; balance: string; tone: string; symbol: string }
export type TxDraft = { type: 'income' | 'expense'; amount: string; category: string; description: string; date: string }
export type GoalDraft = { title: string; current: string; target: string }
export type LenderDraft = { name: string; amount: string; note: string }
