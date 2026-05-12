export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}

export interface Account {
  id: string;
  userId: string;
  model: string;
  phone: string;
  balance: number;
  used: number;
  limit: number;
  category: string;
  color: string;
  notes?: string;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  type: "Add" | "Deduct" | "Reset";
  amount: number;
  balAfter: number;
  phone: string;
  account: string;
  category: string;
  notes?: string;
  status: string;
  createdAt: Date;
}

export interface SalaryEntry {
  id: string;
  userId: string;
  date: string;
  type: "profit" | "expense";
  amount: number;
  category: string;
  notes?: string;
  createdAt: Date;
}

export interface DashboardStats {
  totalAccounts: number;
  totalBalance: number;
  totalUsed: number;
  totalAvailable: number;
  monthlyProfit: number;
  dailyProfit: number;
  highestDay: number;
  highestDate: string;
  totalTransactions: number;
  monthLabel: string;
}
