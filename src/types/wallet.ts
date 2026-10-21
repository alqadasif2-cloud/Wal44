export type UserRole = 'owner' | 'user';
export type AccountStatus = 'active' | 'suspended';

export interface User {
  userId: string;
  username: string;
  displayName: string;
  role: UserRole;
  accountStatus: AccountStatus;
  createdAt: string;
  lastActivityAt: string;
  walletId: string;
  demoAddress: string;
  passwordHash?: string;
  email?: string;
  firebaseUid?: string;
}

export interface LiveMarketData {
  symbol: string; // e.g., 'BTC', 'ETH', 'BNB', 'SOL', 'USDT', 'TRX'
  tickerSymbol: string; // e.g., 'BTCUSDT'
  name: string;
  nameAr: string;
  price: number;
  bidPrice?: number;
  askPrice?: number;
  spread?: number;
  change24h: number;
  change24hAmount: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  lastUpdated: string; // ISO string
  isLive: boolean;
  source: string;
}

export interface CryptoAsset {
  symbol: string;
  name: string;
  nameAr: string;
  balance: number;
  usdPrice: number;
  usdValue: number;
  change24h: number;
  icon: string;
  network: string;
  bidPrice?: number;
  askPrice?: number;
  spread?: number;
  high24h?: number;
  low24h?: number;
  isLive?: boolean;
}

export interface Wallet {
  walletId: string;
  ownerUserId: string;
  networkType: 'BEP20' | 'ERC20' | 'TRC20';
  demoAddress: string;
  totalDemoBalance: number;
  availableDemoBalance: number;
  lockedDemoBalance: number;
  assets: CryptoAsset[];
  updatedAt?: string;
}

export type TransactionType = 
  | 'receive' 
  | 'send' 
  | 'refund' 
  | 'admin_adjustment' 
  | 'lock_release';

export type TransactionStatus = 
  | 'completed' 
  | 'locked' 
  | 'refunded' 
  | 'cancelled' 
  | 'rejected' 
  | 'pending';

export interface Transaction {
  transactionId: string;
  senderUserId: string;
  senderUsername: string;
  senderAddress: string;
  receiverUserId: string;
  receiverUsername: string;
  receiverAddress: string;
  destinationAddress?: string;
  amount: number;
  currency: string;
  network: string;
  transactionType: TransactionType;
  status: TransactionStatus;
  statusTextAr?: string;
  createdAt: string;
  formattedTimeAr?: string;
  lockUntil?: string;
  lockDurationMinutes?: number;
  originalTransactionId?: string;
  isSimulated: boolean;
  isHistorical?: boolean;
  notes?: string;
  networkTxHash?: string;
  refundReason?: string;
}

export interface AdminAuditLog {
  logId: string;
  adminUserId: string;
  adminUsername: string;
  actionType: 'balance_add' | 'balance_deduct' | 'user_suspend' | 'user_activate' | 'lock_release' | 'system_reset';
  targetUserId: string;
  targetUsername: string;
  timestamp: string;
  reason: string;
  previousValue: string | number;
  newValue: string | number;
}

export interface AppNotification {
  notificationId: string;
  recipientUserId: string;
  transactionId?: string;
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
  createdAt: string;
  read: boolean;
  type: 'incoming_transfer' | 'locked_transfer' | 'lock_unlocked' | 'refund' | 'admin' | 'chat_message';
}

export interface ChatMessage {
  messageId: string;
  conversationId: string;
  senderUserId: string;
  senderUsername: string;
  receiverUserId: string;
  text: string;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  conversationId: string;
  participantIds: string[];
  participantNames: Record<string, string>;
  lastMessageText: string;
  lastMessageAt: string;
  updatedAt: string;
  unreadCount?: number;
}
