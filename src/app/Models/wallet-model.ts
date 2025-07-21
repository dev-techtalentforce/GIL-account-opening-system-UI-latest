export interface InitiatePaymentRequest {
  agentId?: string;
  amount: number;
}

export interface InitiatePaymentResponse {
  paymentOrderId: string;
  paymentLink: string;
  message: string;
}
export interface InitiatePaymentCheckout {
  orderId: string;
  amount: number;
  name: string;
  email: string;
  contact: string;
}

export interface VerifyPaymentRequest {
  agentId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

export interface VerifyPaymentResponse {
  message: string;
  walletBalance: number;
  creditsAdded: number;
}

export interface WalletBalanceResponse {
  agentId: string;
  walletBalance: number;
  availableCredits: number;
  lastTransactionDate: string; // ISO string (e.g. "2025-06-10T14:25:00Z")
}

// ✅ Transaction Response Interface
export interface AdminTransaction {
  transactionId: string;
  agentId: string;
  type: 'Credit' | 'Debit';
  amount: number;
  creditsAdded?: number;
  creditsDeducted?: number;
  method: string;
  timestamp: string; // ISO string
}

// ✅ Optional filter params
export interface TransactionFilter {
  agentId?: string;
  type?: 'Credit' | 'Debit';
  fromDate?: string; // Format: YYYY-MM-DD
  toDate?: string; // Format: YYYY-MM-DD
}
