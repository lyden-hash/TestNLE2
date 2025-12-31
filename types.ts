
export type EstimateStatus = 'Draft' | 'Submitted' | 'Won' | 'Lost';

export interface LineItem {
  id: string;
  name: string;
  description: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface Customer {
  id: string;
  name: string;
  type: 'Owner' | 'GC' | 'Developer';
  email?: string;
  phone?: string;
}

export interface Estimate {
  id: string;
  name: string;
  customerId: string;
  location: string;
  status: EstimateStatus;
  total: number;
  dueDate: string;
  memo: string;
  exclusions: string;
  lineItems: LineItem[];
  updatedAt: number;
  margin?: number; // Percentage
  tax?: number;    // Percentage
}

export interface AIInsight {
  score: number;
  summary: string;
  risks: string[];
  recommendations: string[];
}

export interface SuggestedItem {
  name: string;
  description: string;
  suggestedQty: number;
  suggestedRate: number;
  reason: string;
}

export interface SiteReport {
  id: string;
  date: string;
  projectName: string;
  workCompleted: string[];
  materialsUsed: string[];
  issues: string[];
  weather: string;
  safetyObservations: string;
  summary: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface MarketInsight {
  text: string;
  sources: { title: string; uri: string }[];
}
