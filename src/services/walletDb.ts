import { User, Wallet, Transaction, AdminAuditLog, AppNotification, CryptoAsset, LiveMarketData } from '../types/wallet';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { marketPriceService } from './marketPriceService';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot 
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

const STORAGE_KEYS = {
  USERS: 'twp_users_v4',
  WALLETS: 'twp_wallets_v4',
  TRANSACTIONS: 'twp_transactions_v4',
  AUDIT_LOGS: 'twp_audit_logs_v4',
  NOTIFICATIONS: 'twp_notifications_v4',
  CURRENT_USER: 'twp_current_user_v4',
  LANGUAGE: 'twp_language_v4',
  BACKUP: 'twp_backup_pre_migration_v4',
};

// Generate crypto assets with actual live market prices from marketPriceService
export function createDefaultAssets(totalUsd: number, customPrices?: Record<string, LiveMarketData>): CryptoAsset[] {
  const prices = customPrices || marketPriceService.getPrices();

  const btcPrice = prices['BTC']?.price || 96000.00;
  const ethPrice = prices['ETH']?.price || 3500.00;
  const bnbPrice = prices['BNB']?.price || 640.00;
  const usdtPrice = 1.00;
  const solPrice = prices['SOL']?.price || 185.00;

  // Proportional token allocation matching Trust Wallet real portfolio weight
  const usdtShare = totalUsd * 0.70;
  const bnbShare = totalUsd * 0.15;
  const ethShare = totalUsd * 0.10;
  const btcShare = totalUsd * 0.05;

  const btcBalance = Math.round((btcShare / btcPrice) * 100000) / 100000;
  const ethBalance = Math.round((ethShare / ethPrice) * 10000) / 10000;
  const bnbBalance = Math.round((bnbShare / bnbPrice) * 10000) / 10000;
  const usdtBalance = Math.round(usdtShare * 100) / 100;

  return [
    {
      symbol: 'USDT',
      name: 'Tether USD',
      nameAr: 'تيثر دولار',
      balance: usdtBalance,
      usdPrice: usdtPrice,
      usdValue: Math.round(usdtBalance * usdtPrice * 100) / 100,
      change24h: prices['USDT']?.change24h ?? 0.01,
      bidPrice: prices['USDT']?.bidPrice ?? 0.9999,
      askPrice: prices['USDT']?.askPrice ?? 1.0001,
      spread: prices['USDT']?.spread ?? 0.0002,
      high24h: prices['USDT']?.high24h,
      low24h: prices['USDT']?.low24h,
      isLive: prices['USDT']?.isLive ?? false,
      network: 'BEP20',
      icon: 'usdt'
    },
    {
      symbol: 'BNB',
      name: 'BNB Smart Chain',
      nameAr: 'بي إن بي سمارت شين',
      balance: bnbBalance,
      usdPrice: bnbPrice,
      usdValue: Math.round(bnbBalance * bnbPrice * 100) / 100,
      change24h: prices['BNB']?.change24h ?? 2.45,
      bidPrice: prices['BNB']?.bidPrice,
      askPrice: prices['BNB']?.askPrice,
      spread: prices['BNB']?.spread,
      high24h: prices['BNB']?.high24h,
      low24h: prices['BNB']?.low24h,
      isLive: prices['BNB']?.isLive ?? false,
      network: 'BEP20',
      icon: 'bnb'
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      nameAr: 'إيثيريوم',
      balance: ethBalance,
      usdPrice: ethPrice,
      usdValue: Math.round(ethBalance * ethPrice * 100) / 100,
      change24h: prices['ETH']?.change24h ?? -1.15,
      bidPrice: prices['ETH']?.bidPrice,
      askPrice: prices['ETH']?.askPrice,
      spread: prices['ETH']?.spread,
      high24h: prices['ETH']?.high24h,
      low24h: prices['ETH']?.low24h,
      isLive: prices['ETH']?.isLive ?? false,
      network: 'ERC20',
      icon: 'eth'
    },
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      nameAr: 'بيتكوين',
      balance: btcBalance,
      usdPrice: btcPrice,
      usdValue: Math.round(btcBalance * btcPrice * 100) / 100,
      change24h: prices['BTC']?.change24h ?? 3.82,
      bidPrice: prices['BTC']?.bidPrice,
      askPrice: prices['BTC']?.askPrice,
      spread: prices['BTC']?.spread,
      high24h: prices['BTC']?.high24h,
      low24h: prices['BTC']?.low24h,
      isLive: prices['BTC']?.isLive ?? false,
      network: 'Bitcoin',
      icon: 'btc'
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      nameAr: 'سولانا',
      balance: 0.00,
      usdPrice: solPrice,
      usdValue: 0.00,
      change24h: prices['SOL']?.change24h ?? 4.20,
      bidPrice: prices['SOL']?.bidPrice,
      askPrice: prices['SOL']?.askPrice,
      spread: prices['SOL']?.spread,
      high24h: prices['SOL']?.high24h,
      low24h: prices['SOL']?.low24h,
      isLive: prices['SOL']?.isLive ?? false,
      network: 'Solana',
      icon: 'sol'
    }
  ];
}

// Initial seed data generator preserving all original specifications
export function getInitialSeedData() {
  const users: User[] = [
    {
      userId: 'usr_owner_sami',
      username: 'Sami',
      displayName: 'Sami (مالك المحفظة / Owner)',
      role: 'owner',
      accountStatus: 'active',
      createdAt: '2026-10-01T10:00:00.000Z',
      lastActivityAt: new Date().toISOString(),
      walletId: 'wlt_owner_sami',
      demoAddress: '0x71C6381f211322C81985B8Fa2A478b8813C824a8',
      passwordHash: '70707070'
    },
    {
      userId: 'usr_eslam_alqadasi',
      username: 'Eslam Alqadasi',
      displayName: 'Eslam Alqadasi',
      role: 'user',
      accountStatus: 'active',
      createdAt: '2026-10-05T08:00:00.000Z',
      lastActivityAt: new Date().toISOString(),
      walletId: 'wlt_eslam_alqadasi',
      demoAddress: '0x429E5A3bF6789D8b76c128dE65E2C4F22c4a9B12',
      passwordHash: 'Eslam@2es'
    },
    {
      userId: 'usr_ahmed_crypto',
      username: 'Ahmed Crypto',
      displayName: 'أحمد التميمي',
      role: 'user',
      accountStatus: 'active',
      createdAt: '2026-10-06T12:00:00.000Z',
      lastActivityAt: new Date().toISOString(),
      walletId: 'wlt_ahmed_crypto',
      demoAddress: '0x8891dEa24B641c49129532B5B4961f77d3451A01',
      passwordHash: 'Ahmed@123'
    },
    {
      userId: 'usr_nour_tech',
      username: 'Nour Tech',
      displayName: 'نور للدعم التقني',
      role: 'user',
      accountStatus: 'active',
      createdAt: '2026-10-08T14:30:00.000Z',
      lastActivityAt: new Date().toISOString(),
      walletId: 'wlt_nour_tech',
      demoAddress: '0x992Bcd48102a9C1284Ea84092bF58B124C2817c9',
      passwordHash: 'Nour@123'
    }
  ];

  const wallets: Wallet[] = [
    {
      walletId: 'wlt_owner_sami',
      ownerUserId: 'usr_owner_sami',
      networkType: 'BEP20',
      demoAddress: '0x71C6381f211322C81985B8Fa2A478b8813C824a8',
      totalDemoBalance: 3000.00,
      availableDemoBalance: 3000.00,
      lockedDemoBalance: 0.00,
      assets: createDefaultAssets(3000.00)
    },
    {
      walletId: 'wlt_eslam_alqadasi',
      ownerUserId: 'usr_eslam_alqadasi',
      networkType: 'BEP20',
      demoAddress: '0x429E5A3bF6789D8b76c128dE65E2C4F22c4a9B12',
      totalDemoBalance: 0.00,
      availableDemoBalance: 0.00,
      lockedDemoBalance: 0.00,
      assets: createDefaultAssets(0.00)
    },
    {
      walletId: 'wlt_ahmed_crypto',
      ownerUserId: 'usr_ahmed_crypto',
      networkType: 'BEP20',
      demoAddress: '0x8891dEa24B641c49129532B5B4961f77d3451A01',
      totalDemoBalance: 450.00,
      availableDemoBalance: 450.00,
      lockedDemoBalance: 0.00,
      assets: createDefaultAssets(450.00)
    },
    {
      walletId: 'wlt_nour_tech',
      ownerUserId: 'usr_nour_tech',
      networkType: 'BEP20',
      demoAddress: '0x992Bcd48102a9C1284Ea84092bF58B124C2817c9',
      totalDemoBalance: 600.00,
      availableDemoBalance: 600.00,
      lockedDemoBalance: 0.00,
      assets: createDefaultAssets(600.00)
    }
  ];

  const transactions: Transaction[] = [
    {
      transactionId: 'TX_HIST_001',
      senderUserId: 'usr_system_faucet',
      senderUsername: 'Sender External',
      senderAddress: '0x12a89B10d86290C22B487c645D792911b330F7c0',
      receiverUserId: 'usr_eslam_alqadasi',
      receiverUsername: 'Eslam Alqadasi',
      receiverAddress: '0x429E5A3bF6789D8b76c128dE65E2C4F22c4a9B12',
      amount: 100.00,
      currency: 'USD',
      network: 'BEP20',
      transactionType: 'receive',
      status: 'completed',
      statusTextAr: 'مكتملة',
      createdAt: '2026-10-07T05:11:00.000Z',
      formattedTimeAr: '7 أكتوبر - 5:11 صباحًا',
      isSimulated: false,
      isHistorical: false,
      notes: 'سجل استلام'
    },
    {
      transactionId: 'TX_HIST_002',
      senderUserId: 'usr_system_faucet',
      senderUsername: 'Sender External',
      senderAddress: '0x33b890C12841c64128532B5B4961f77d3451A011',
      receiverUserId: 'usr_eslam_alqadasi',
      receiverUsername: 'Eslam Alqadasi',
      receiverAddress: '0x429E5A3bF6789D8b76c128dE65E2C4F22c4a9B12',
      amount: 50.00,
      currency: 'USD',
      network: 'BEP20',
      transactionType: 'receive',
      status: 'completed',
      statusTextAr: 'مكتملة',
      createdAt: '2026-10-09T08:30:00.000Z',
      formattedTimeAr: '9 أكتوبر - 8:30 صباحًا',
      isSimulated: false,
      isHistorical: false,
      notes: 'سجل استلام'
    },
    {
      transactionId: 'TX_HIST_003',
      senderUserId: 'usr_system_faucet',
      senderUsername: 'Sender External',
      senderAddress: '0x77c90D22B487c645D792911b330F7c012a89B10d',
      receiverUserId: 'usr_eslam_alqadasi',
      receiverUsername: 'Eslam Alqadasi',
      receiverAddress: '0x429E5A3bF6789D8b76c128dE65E2C4F22c4a9B12',
      amount: 150.00,
      currency: 'USD',
      network: 'BEP20',
      transactionType: 'receive',
      status: 'completed',
      statusTextAr: 'مكتملة',
      createdAt: '2026-10-09T15:15:00.000Z',
      formattedTimeAr: '9 أكتوبر - 3:15 مساءً',
      isSimulated: false,
      isHistorical: false,
      notes: 'سجل استلام'
    },
    {
      transactionId: 'TX_HIST_004',
      senderUserId: 'usr_system_faucet',
      senderUsername: 'Sender External',
      senderAddress: '0x8891dEa24B641c49129532B5B4961f77d3451A01',
      receiverUserId: 'usr_eslam_alqadasi',
      receiverUsername: 'Eslam Alqadasi',
      receiverAddress: '0x429E5A3bF6789D8b76c128dE65E2C4F22c4a9B12',
      amount: 15.00,
      currency: 'USD',
      network: 'BEP20',
      transactionType: 'receive',
      status: 'completed',
      statusTextAr: 'مكتملة',
      createdAt: '2026-10-09T16:05:00.000Z',
      formattedTimeAr: '9 أكتوبر - 4:05 مساءً',
      isSimulated: false,
      isHistorical: false,
      notes: 'سجل استلام'
    },
    {
      transactionId: 'TX_HIST_005',
      senderUserId: 'usr_eslam_alqadasi',
      senderUsername: 'Eslam Alqadasi',
      senderAddress: '0x429E5A3bF6789D8b76c128dE65E2C4F22c4a9B12',
      receiverUserId: 'usr_dest_742d',
      receiverUsername: '0x742d...fc26',
      receiverAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438fc26',
      destinationAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438fc26',
      amount: 15.00,
      currency: 'USD',
      network: 'BEP20',
      transactionType: 'send',
      status: 'completed',
      statusTextAr: 'إرسال',
      createdAt: '2026-10-09T17:13:00.000Z',
      formattedTimeAr: '9 أكتوبر - 5:13 مساءً',
      isSimulated: false,
      isHistorical: false,
      notes: 'إرسال إلى 0x742d35Cc6634C0532925a3b844Bc454e4438fc26'
    },
    {
      transactionId: 'TX_REFUND_001',
      originalTransactionId: 'TX_HIST_001',
      senderUserId: 'usr_eslam_alqadasi',
      senderUsername: 'Eslam Alqadasi',
      senderAddress: '0x429E5A3bF6789D8b76c128dE65E2C4F22c4a9B12',
      receiverUserId: 'usr_system_faucet',
      receiverUsername: 'Sender External',
      receiverAddress: '0x12a89B10d86290C22B487c645D792911b330F7c0',
      amount: 100.00,
      currency: 'USD',
      network: 'BEP20',
      transactionType: 'refund',
      status: 'refunded',
      statusTextAr: 'مسترجع',
      createdAt: '2026-10-09T21:00:00.000Z',
      formattedTimeAr: '9 أكتوبر - 9:00 مساءً',
      refundReason: 'استرجاع من قبل المرسل',
      isSimulated: false,
      isHistorical: false,
      notes: 'عملية استرجاع مرتبطة بالمعاملة الأصلية TX_HIST_001'
    },
    {
      transactionId: 'TX_REFUND_002',
      originalTransactionId: 'TX_HIST_002',
      senderUserId: 'usr_eslam_alqadasi',
      senderUsername: 'Eslam Alqadasi',
      senderAddress: '0x429E5A3bF6789D8b76c128dE65E2C4F22c4a9B12',
      receiverUserId: 'usr_system_faucet',
      receiverUsername: 'Sender External',
      receiverAddress: '0x33b890C12841c64128532B5B4961f77d3451A011',
      amount: 50.00,
      currency: 'USD',
      network: 'BEP20',
      transactionType: 'refund',
      status: 'refunded',
      statusTextAr: 'مسترجع',
      createdAt: '2026-10-09T21:02:00.000Z',
      formattedTimeAr: '9 أكتوبر - 9:02 مساءً',
      refundReason: 'استرجاع من قبل المرسل',
      isSimulated: false,
      isHistorical: false,
      notes: 'عملية استرجاع مرتبطة بالمعاملة الأصلية TX_HIST_002'
    },
    {
      transactionId: 'TX_REFUND_003',
      originalTransactionId: 'TX_HIST_003',
      senderUserId: 'usr_eslam_alqadasi',
      senderUsername: 'Eslam Alqadasi',
      senderAddress: '0x429E5A3bF6789D8b76c128dE65E2C4F22c4a9B12',
      receiverUserId: 'usr_system_faucet',
      receiverUsername: 'Sender External',
      receiverAddress: '0x77c90D22B487c645D792911b330F7c012a89B10d',
      amount: 150.00,
      currency: 'USD',
      network: 'BEP20',
      transactionType: 'refund',
      status: 'refunded',
      statusTextAr: 'مسترجع',
      createdAt: '2026-10-09T21:05:00.000Z',
      formattedTimeAr: '9 أكتوبر - 9:05 مساءً',
      refundReason: 'استرجاع من قبل المرسل',
      isSimulated: false,
      isHistorical: false,
      notes: 'عملية استرجاع مرتبطة بالمعاملة الأصلية TX_HIST_003'
    }
  ];

  const auditLogs: AdminAuditLog[] = [
    {
      logId: 'LOG_INIT_001',
      adminUserId: 'usr_owner_sami',
      adminUsername: 'Sami',
      actionType: 'system_reset',
      targetUserId: 'system',
      targetUsername: 'System Engine',
      timestamp: '2026-10-01T10:00:00.000Z',
      reason: 'تهيئة بيئة المحفظة وتخصيص رصيد المالك الأولي 3000$',
      previousValue: '0',
      newValue: '3000'
    }
  ];

  const notifications: AppNotification[] = [
    {
      notificationId: 'notif_welcome',
      recipientUserId: 'usr_eslam_alqadasi',
      title: 'مرحباً بك في TRUST WALLET PRO',
      titleAr: 'مرحباً بك في TRUST WALLET PRO',
      body: 'تم تجهيز محفظتك بنجاح مع كامل الميزات ومزامنة Firebase والأسعار الحية.',
      bodyAr: 'تم تجهيز محفظتك بنجاح مع كامل الميزات ومزامنة Firebase والأسعار الحية.',
      createdAt: new Date().toISOString(),
      read: false,
      type: 'admin'
    }
  ];

  return { users, wallets, transactions, auditLogs, notifications };
}

// Storage helpers & Cloud Firestore Synchronizer
export class WalletDatabase {
  private static initDone = false;
  private static firestoreSyncActive = false;
  private static firestoreUnsubscribers: (() => void)[] = [];

  public static initialize(): void {
    if (this.initDone) return;
    if (typeof window === 'undefined') return;

    // 1. Initial Local Backup & Storage Setup
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      const seed = getInitialSeedData();
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(seed.users));
      localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(seed.wallets));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(seed.transactions));
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(seed.auditLogs));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(seed.notifications));
    } else {
      // Create backup of current local data prior to synchronization
      if (!localStorage.getItem(STORAGE_KEYS.BACKUP)) {
        try {
          const snapshot = {
            users: localStorage.getItem(STORAGE_KEYS.USERS),
            wallets: localStorage.getItem(STORAGE_KEYS.WALLETS),
            transactions: localStorage.getItem(STORAGE_KEYS.TRANSACTIONS),
            timestamp: new Date().toISOString()
          };
          localStorage.setItem(STORAGE_KEYS.BACKUP, JSON.stringify(snapshot));
        } catch {}
      }
    }

    // 2. Start Live Market Prices Stream
    marketPriceService.start();

    // 3. Ensure Firebase Auth session exists anonymously or via user
    this.ensureFirebaseAuth();

    // 4. Start Firestore Live Synchronization
    this.startFirestoreSync();

    this.initDone = true;
  }

  // Ensure Firebase Auth session for Firestore security rule enforcement
  private static async ensureFirebaseAuth(): Promise<void> {
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
    } catch {
      // Fallback
    }
  }

  // Active bi-directional sync with Cloud Firestore
  public static startFirestoreSync(): void {
    if (this.firestoreSyncActive || typeof window === 'undefined') return;
    this.firestoreSyncActive = true;

    // Synchronize initial baseline seed data to Firestore if not already present
    this.seedFirestoreInitialData().catch(() => {});

    // 1. Listen to Users Collection
    try {
      const usersCol = collection(db, 'users');
      const unsubUsers = onSnapshot(usersCol, (snap) => {
        if (!snap.empty) {
          const cloudUsers: User[] = [];
          snap.forEach(d => cloudUsers.push(d.data() as User));
          
          const localUsers = this.getUsers();
          const merged = this.mergeEntities(localUsers, cloudUsers, 'userId');
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(merged));
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'users');
      });
      this.firestoreUnsubscribers.push(unsubUsers);
    } catch {}

    // 2. Listen to Wallets Collection
    try {
      const walletsCol = collection(db, 'wallets');
      const unsubWallets = onSnapshot(walletsCol, (snap) => {
        if (!snap.empty) {
          const cloudWallets: Wallet[] = [];
          snap.forEach(d => cloudWallets.push(d.data() as Wallet));
          
          const localWallets = this.getWallets();
          const merged = this.mergeEntities(localWallets, cloudWallets, 'walletId');
          localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(merged));
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'wallets');
      });
      this.firestoreUnsubscribers.push(unsubWallets);
    } catch {}

    // 3. Listen to Transactions Collection
    try {
      const txsCol = collection(db, 'transactions');
      const unsubTxs = onSnapshot(txsCol, (snap) => {
        if (!snap.empty) {
          const cloudTxs: Transaction[] = [];
          snap.forEach(d => cloudTxs.push(d.data() as Transaction));
          
          const localTxs = this.getTransactions();
          const merged = this.mergeEntities(localTxs, cloudTxs, 'transactionId');
          // Sort descending by date
          merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(merged));
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'transactions');
      });
      this.firestoreUnsubscribers.push(unsubTxs);
    } catch {}
  }

  // Merge local and cloud arrays without duplicates
  private static mergeEntities<T>(local: T[], cloud: T[], idKey: keyof T): T[] {
    const map = new Map<any, T>();
    local.forEach(item => map.set(item[idKey], item));
    cloud.forEach(item => map.set(item[idKey], item)); // cloud overwrites or adds
    return Array.from(map.values());
  }

  // Initial cloud seeding for user accounts, historical transactions & wallets
  private static async seedFirestoreInitialData(): Promise<void> {
    try {
      await this.ensureFirebaseAuth();
      const localUsers = this.getUsers();
      const localWallets = this.getWallets();
      const localTxs = this.getTransactions();

      // Check if users collection already seeded
      const snap = await getDocs(collection(db, 'users'));
      if (snap.empty) {
        // Seed users
        for (const u of localUsers) {
          await setDoc(doc(db, 'users', u.userId), u, { merge: true });
        }
        // Seed wallets
        for (const w of localWallets) {
          await setDoc(doc(db, 'wallets', w.walletId), w, { merge: true });
        }
        // Seed transactions
        for (const t of localTxs) {
          await setDoc(doc(db, 'transactions', t.transactionId), t, { merge: true });
        }
      }
    } catch {
      // Safe fallback if offline
    }
  }

  public static resetToSeed(): void {
    const seed = getInitialSeedData();
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(seed.users));
    localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(seed.wallets));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(seed.transactions));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(seed.auditLogs));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(seed.notifications));
  }

  // Users
  public static getUsers(): User[] {
    this.initialize();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static getUserById(userId: string): User | undefined {
    return this.getUsers().find(u => u.userId === userId);
  }

  public static getUserByUsername(username: string): User | undefined {
    const normalized = username.trim().toLowerCase();
    return this.getUsers().find(u => u.username.toLowerCase() === normalized);
  }

  public static getUserByAddress(address: string): User | undefined {
    const normalized = address.trim().toLowerCase();
    return this.getUsers().find(u => u.demoAddress.toLowerCase() === normalized);
  }

  // Wallets
  public static getWallets(): Wallet[] {
    this.initialize();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WALLETS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static getWalletByUserId(userId: string): Wallet | undefined {
    this.checkAndReleaseExpiredLocks();
    const wallet = this.getWallets().find(w => w.ownerUserId === userId);
    if (!wallet) return undefined;

    // Dynamically update assets with current live market prices
    const livePrices = marketPriceService.getPrices();
    const refreshedAssets = createDefaultAssets(wallet.totalDemoBalance, livePrices);
    return {
      ...wallet,
      assets: refreshedAssets
    };
  }

  public static saveWallets(wallets: Wallet[]): void {
    localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
    // Asynchronously sync to Firestore
    wallets.forEach(w => {
      setDoc(doc(db, 'wallets', w.walletId), w, { merge: true }).catch(() => {});
    });
  }

  public static saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    users.forEach(u => {
      setDoc(doc(db, 'users', u.userId), u, { merge: true }).catch(() => {});
    });
  }

  // Transactions
  public static getTransactions(): Transaction[] {
    this.initialize();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static getUserTransactions(userId: string): Transaction[] {
    this.checkAndReleaseExpiredLocks();
    const all = this.getTransactions();
    return all.filter(t => 
      t.senderUserId === userId || 
      t.receiverUserId === userId ||
      (t.transactionType === 'refund' && (userId === 'usr_eslam_alqadasi' || t.senderUserId === userId || t.receiverUserId === userId))
    );
  }

  public static saveTransactions(txs: Transaction[]): void {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
    txs.forEach(t => {
      setDoc(doc(db, 'transactions', t.transactionId), t, { merge: true }).catch(() => {});
    });
  }

  // Audit Logs
  public static getAuditLogs(): AdminAuditLog[] {
    this.initialize();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static addAuditLog(log: Omit<AdminAuditLog, 'logId' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    const newLog: AdminAuditLog = {
      ...log,
      logId: 'LOG_' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase(),
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  }

  // Notifications
  public static getNotifications(userId: string): AppNotification[] {
    this.initialize();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      const all: AppNotification[] = data ? JSON.parse(data) : [];
      return all.filter(n => n.recipientUserId === userId);
    } catch {
      return [];
    }
  }

  public static addNotification(notif: Omit<AppNotification, 'notificationId' | 'createdAt' | 'read'>): void {
    const allNotifications: AppNotification[] = (() => {
      try {
        const d = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
        return d ? JSON.parse(d) : [];
      } catch {
        return [];
      }
    })();

    const newNotif: AppNotification = {
      ...notif,
      notificationId: 'NTF_' + Date.now().toString(36),
      createdAt: new Date().toISOString(),
      read: false
    };

    allNotifications.unshift(newNotif);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(allNotifications));

    this.sendSystemNotification(newNotif.titleAr || newNotif.title, newNotif.bodyAr || newNotif.body);
  }

  public static markNotificationRead(notificationId: string): void {
    try {
      const d = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (!d) return;
      const all: AppNotification[] = JSON.parse(d);
      const target = all.find(n => n.notificationId === notificationId);
      if (target) {
        target.read = true;
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
      }
    } catch {}
  }

  public static markAllNotificationsRead(userId: string): void {
    try {
      const d = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (!d) return;
      const all: AppNotification[] = JSON.parse(d);
      all.forEach(n => {
        if (n.recipientUserId === userId) n.read = true;
      });
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
    } catch {}
  }

  // Outside notifications
  public static async requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }

  public static sendSystemNotification(title: string, body: string): void {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'trust-wallet-pro-transfer'
        });
      } catch {}
    }
  }

  // Session persistence
  public static getCurrentUser(): User | null {
    this.initialize();
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (!raw || raw === 'logged_out') return null;
      const session = JSON.parse(raw);
      if (!session?.userId) return null;
      const freshUser = this.getUserById(session.userId);
      return freshUser || null;
    } catch {
      return null;
    }
  }

  public static setCurrentUser(user: User | null): void {
    if (!user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, 'logged_out');
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify({ userId: user.userId }));
    }
  }

  // Generate unique demo address
  public static generateDemoAddress(): string {
    const chars = '0123456789abcdef';
    let addr = '0x';
    for (let i = 0; i < 40; i++) {
      addr += chars[Math.floor(Math.random() * chars.length)];
    }
    return addr;
  }

  // Atomic Registration with Firestore Sync
  public static registerUser(username: string, password: string, displayName?: string): { success: boolean; message: string; user?: User } {
    this.initialize();
    const cleanUsername = username.trim();

    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, message: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل.' };
    }

    if (!password || password.length < 4) {
      return { success: false, message: 'كلمة المرور يجب أن تكون 4 أحرف أو أرقام على الأقل.' };
    }

    if (cleanUsername.toLowerCase() === 'sami') {
      return { success: false, message: 'لا يمكن إنشاء حساب المالك من خلال شاشة التسجيل العادية.' };
    }

    const existing = this.getUserByUsername(cleanUsername);
    if (existing) {
      return { success: false, message: 'اسم المستخدم مسجل مسبقاً، يرجى اختيار اسم آخر.' };
    }

    const userId = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const walletId = 'wlt_' + Date.now().toString(36);
    const demoAddress = this.generateDemoAddress();
    const nowIso = new Date().toISOString();

    const newUser: User = {
      userId,
      username: cleanUsername,
      displayName: displayName?.trim() || cleanUsername,
      role: 'user',
      accountStatus: 'active',
      createdAt: nowIso,
      lastActivityAt: nowIso,
      walletId,
      demoAddress,
      passwordHash: password
    };

    const initialBalance = 0.00;
    const newWallet: Wallet = {
      walletId,
      ownerUserId: userId,
      networkType: 'BEP20',
      demoAddress,
      totalDemoBalance: initialBalance,
      availableDemoBalance: initialBalance,
      lockedDemoBalance: 0.00,
      assets: createDefaultAssets(initialBalance)
    };

    const users = this.getUsers();
    users.push(newUser);
    this.saveUsers(users);

    const wallets = this.getWallets();
    wallets.push(newWallet);
    this.saveWallets(wallets);

    this.addNotification({
      recipientUserId: userId,
      title: 'تم إنشاء المحفظة بنجاح',
      titleAr: 'تم إنشاء المحفظة بنجاح',
      body: `مرحباً بك! تم تجهيز محفظتك بنجاح وبدء تشغيل الحساب ومزامنته عبر Firebase.`,
      bodyAr: `مرحباً بك! تم تجهيز محفظتك بنجاح وبدء تشغيل الحساب ومزامنته عبر Firebase.`,
      type: 'incoming_transfer'
    });

    this.setCurrentUser(newUser);

    return { success: true, message: 'تم إنشاء الحساب بنجاح.', user: newUser };
  }

  // Sign In
  public static loginUser(username: string, password: string): { success: boolean; message: string; user?: User } {
    this.initialize();
    const cleanUsername = username.trim();
    const user = this.getUserByUsername(cleanUsername);

    if (!user) {
      return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة.' };
    }

    if (user.accountStatus === 'suspended') {
      return { success: false, message: 'تم إيقاف هذا الحساب من قبل الإدارة.' };
    }

    if (user.passwordHash !== password) {
      return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة.' };
    }

    user.lastActivityAt = new Date().toISOString();
    const users = this.getUsers().map(u => u.userId === user.userId ? user : u);
    this.saveUsers(users);

    this.setCurrentUser(user);
    return { success: true, message: 'تم تسجيل الدخول بنجاح.', user };
  }

  // Atomic Send Transfer with optional Time-Locking
  public static executeSendTransfer(params: {
    senderUserId: string;
    recipientIdentifier: string;
    amount: number;
    currency?: string;
    lockDurationMinutes?: number;
    notes?: string;
  }): { success: boolean; message: string; transaction?: Transaction } {
    this.initialize();
    this.checkAndReleaseExpiredLocks();

    const { senderUserId, recipientIdentifier, amount, currency = 'USD', lockDurationMinutes = 0, notes } = params;

    if (!amount || isNaN(amount) || amount <= 0) {
      return { success: false, message: 'يرجى إدخال مبلغ صحيح أكبر من الصفر.' };
    }

    const sender = this.getUserById(senderUserId);
    if (!sender) {
      return { success: false, message: 'حساب المرسل غير موجود.' };
    }

    if (sender.accountStatus === 'suspended') {
      return { success: false, message: 'حسابك موقوف مؤقتاً، لا يمكنك إجراء تحويلات.' };
    }

    let recipient = this.getUserByUsername(recipientIdentifier);
    if (!recipient) {
      recipient = this.getUserByAddress(recipientIdentifier);
    }

    if (!recipient) {
      return { success: false, message: 'لم يتم العثور على المستلم (تحقق من اسم المستخدم أو العنوان التجريبي).' };
    }

    if (recipient.userId === sender.userId) {
      return { success: false, message: 'لا يمكنك إرسال الأموال إلى محفظتك الخاصة.' };
    }

    const wallets = this.getWallets();
    const senderWallet = wallets.find(w => w.ownerUserId === sender.userId);
    const recipientWallet = wallets.find(w => w.ownerUserId === recipient.userId);

    if (!senderWallet || !recipientWallet) {
      return { success: false, message: 'تعذر الوصول إلى سجلات المحافظ.' };
    }

    if (senderWallet.availableDemoBalance < amount) {
      return { 
        success: false, 
        message: `الرصيد المتاح غير كافٍ. رصيدك المتاح حالياً هو $${senderWallet.availableDemoBalance.toFixed(2)} (المقيد لا يمكن إرساله).` 
      };
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const isLocked = lockDurationMinutes > 0;
    const lockUntil = isLocked ? new Date(now.getTime() + lockDurationMinutes * 60 * 1000).toISOString() : undefined;

    // Deduct from sender
    senderWallet.availableDemoBalance = Math.round((senderWallet.availableDemoBalance - amount) * 100) / 100;
    senderWallet.totalDemoBalance = Math.round((senderWallet.totalDemoBalance - amount) * 100) / 100;
    senderWallet.assets = createDefaultAssets(senderWallet.totalDemoBalance);

    // Credit to recipient
    recipientWallet.totalDemoBalance = Math.round((recipientWallet.totalDemoBalance + amount) * 100) / 100;
    if (isLocked) {
      recipientWallet.lockedDemoBalance = Math.round((recipientWallet.lockedDemoBalance + amount) * 100) / 100;
    } else {
      recipientWallet.availableDemoBalance = Math.round((recipientWallet.availableDemoBalance + amount) * 100) / 100;
    }
    recipientWallet.assets = createDefaultAssets(recipientWallet.totalDemoBalance);

    this.saveWallets(wallets);

    const transactionId = 'TX_' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();

    const transaction: Transaction = {
      transactionId,
      senderUserId: sender.userId,
      senderUsername: sender.username,
      senderAddress: sender.demoAddress,
      receiverUserId: recipient.userId,
      receiverUsername: recipient.username,
      receiverAddress: recipient.demoAddress,
      amount,
      currency,
      network: 'BEP20',
      transactionType: 'send',
      status: isLocked ? 'locked' : 'completed',
      statusTextAr: isLocked ? 'قيد التقييد' : 'مكتملة',
      createdAt: nowIso,
      lockUntil,
      lockDurationMinutes: isLocked ? lockDurationMinutes : undefined,
      isSimulated: false,
      notes: notes?.trim() || (isLocked ? `مبلغ مقيد لمدة ${lockDurationMinutes} دقيقة` : undefined),
      networkTxHash: ''
    };

    const transactions = this.getTransactions();
    transactions.unshift(transaction);
    this.saveTransactions(transactions);

    const lockNoticeAr = isLocked ? ` (مبلغ مقيد مؤقتاً لمدة ${lockDurationMinutes} دقيقة)` : '';
    this.addNotification({
      recipientUserId: recipient.userId,
      transactionId,
      title: 'تم استلام مبلغ جديد',
      titleAr: 'تم استلام مبلغ جديد',
      body: `استلمت ${amount}$ في محفظتك من ${sender.username}${lockNoticeAr}`,
      bodyAr: `استلمت ${amount}$ في محفظتك من ${sender.username}${lockNoticeAr}`,
      type: isLocked ? 'locked_transfer' : 'incoming_transfer'
    });

    return { 
      success: true, 
      message: isLocked 
        ? `تم إرسال $${amount} بنجاح مع تقييد المبلغ لمدة ${lockDurationMinutes} دقيقة.` 
        : `تم إرسال $${amount} بنجاح إلى ${recipient.username}.`,
      transaction 
    };
  }

  // Periodic expiration checker for time-locked transactions
  public static checkAndReleaseExpiredLocks(): { releasedCount: number } {
    if (typeof window === 'undefined') return { releasedCount: 0 };
    const now = Date.now();
    const transactions = this.getTransactions();
    const wallets = this.getWallets();
    let releasedCount = 0;
    let walletsModified = false;
    let txsModified = false;

    transactions.forEach(tx => {
      if (tx.status === 'locked' && tx.lockUntil) {
        const lockExpiryTime = new Date(tx.lockUntil).getTime();
        if (now >= lockExpiryTime) {
          tx.status = 'completed';
          tx.statusTextAr = 'متاحة للتصرف (انتهى التقييد)';
          txsModified = true;
          releasedCount++;

          const recipientWallet = wallets.find(w => w.ownerUserId === tx.receiverUserId);
          if (recipientWallet) {
            const releaseAmount = Math.min(recipientWallet.lockedDemoBalance, tx.amount);
            recipientWallet.lockedDemoBalance = Math.max(0, Math.round((recipientWallet.lockedDemoBalance - releaseAmount) * 100) / 100);
            recipientWallet.availableDemoBalance = Math.round((recipientWallet.availableDemoBalance + releaseAmount) * 100) / 100;
            recipientWallet.assets = createDefaultAssets(recipientWallet.totalDemoBalance);
            walletsModified = true;
          }

          this.addNotification({
            recipientUserId: tx.receiverUserId,
            transactionId: tx.transactionId,
            title: 'انتهت مدة تقييد المبلغ',
            titleAr: 'انتهت مدة تقييد المبلغ',
            body: `أصبح مبلغ ${tx.amount}$ متاحاً بالكامل للتصرف والإرسال في محفظتك.`,
            bodyAr: `أصبح مبلغ ${tx.amount}$ متاحاً بالكامل للتصرف والإرسال في محفظتك.`,
            type: 'lock_unlocked'
          });
        }
      }
    });

    if (txsModified) {
      this.saveTransactions(transactions);
    }
    if (walletsModified) {
      this.saveWallets(wallets);
    }

    return { releasedCount };
  }

  // Admin adjustments
  public static adminAdjustBalance(params: {
    adminUserId: string;
    targetUserId: string;
    amountDelta: number;
    reason: string;
  }): { success: boolean; message: string } {
    this.initialize();
    const { adminUserId, targetUserId, amountDelta, reason } = params;

    const admin = this.getUserById(adminUserId);
    if (!admin || admin.role !== 'owner') {
      return { success: false, message: 'غير مصرح لك بإجراء هذه العملية الإدارية.' };
    }

    if (!reason || reason.trim().length < 4) {
      return { success: false, message: 'يجب كتابة سبب واضح وموثق للتعديل الإداري.' };
    }

    const targetUser = this.getUserById(targetUserId);
    if (!targetUser) {
      return { success: false, message: 'المستخدم المستهدف غير موجود.' };
    }

    const wallets = this.getWallets();
    const targetWallet = wallets.find(w => w.ownerUserId === targetUserId);
    if (!targetWallet) {
      return { success: false, message: 'محفظة المستخدم غير موجودة.' };
    }

    const prevBalance = targetWallet.totalDemoBalance;
    const newBalance = Math.max(0, Math.round((prevBalance + amountDelta) * 100) / 100);

    if (amountDelta < 0 && targetWallet.availableDemoBalance < Math.abs(amountDelta)) {
      return { success: false, message: 'الرصيد المتاح لدى المستخدم لا يكفي للخصم المطلوب.' };
    }

    targetWallet.totalDemoBalance = newBalance;
    if (amountDelta >= 0) {
      targetWallet.availableDemoBalance = Math.round((targetWallet.availableDemoBalance + amountDelta) * 100) / 100;
    } else {
      targetWallet.availableDemoBalance = Math.max(0, Math.round((targetWallet.availableDemoBalance + amountDelta) * 100) / 100);
    }
    targetWallet.assets = createDefaultAssets(newBalance);

    this.saveWallets(wallets);

    this.addAuditLog({
      adminUserId,
      adminUsername: admin.username,
      actionType: amountDelta >= 0 ? 'balance_add' : 'balance_deduct',
      targetUserId,
      targetUsername: targetUser.username,
      reason: reason.trim(),
      previousValue: `$${prevBalance.toFixed(2)}`,
      newValue: `$${newBalance.toFixed(2)}`
    });

    const tx: Transaction = {
      transactionId: 'TX_ADMIN_' + Date.now().toString(36).toUpperCase(),
      senderUserId: adminUserId,
      senderUsername: `Admin (${admin.username})`,
      senderAddress: admin.demoAddress,
      receiverUserId: targetUserId,
      receiverUsername: targetUser.username,
      receiverAddress: targetUser.demoAddress,
      amount: Math.abs(amountDelta),
      currency: 'USD',
      network: 'BEP20',
      transactionType: 'admin_adjustment',
      status: 'completed',
      statusTextAr: amountDelta >= 0 ? 'إضافة إدارية موثقة' : 'خصم إداري موثق',
      createdAt: new Date().toISOString(),
      isSimulated: true,
      notes: `تعديل إداري: ${reason}`
    };

    const txs = this.getTransactions();
    txs.unshift(tx);
    this.saveTransactions(txs);

    this.addNotification({
      recipientUserId: targetUserId,
      transactionId: tx.transactionId,
      title: 'تعديل رصيد من الإدارة',
      titleAr: 'تعديل رصيد من الإدارة',
      body: `تم ${amountDelta >= 0 ? 'إضافة' : 'خصم'} ${Math.abs(amountDelta)}$ في رصيدك. السبب: ${reason}`,
      bodyAr: `تم ${amountDelta >= 0 ? 'إضافة' : 'خصم'} ${Math.abs(amountDelta)}$ في رصيدك. السبب: ${reason}`,
      type: 'admin'
    });

    return { 
      success: true, 
      message: `تم تحديث رصيد ${targetUser.username} بنجاح من $${prevBalance} إلى $${newBalance}.` 
    };
  }

  // Admin toggle user status
  public static adminToggleUserStatus(adminUserId: string, targetUserId: string, reason: string): { success: boolean; message: string } {
    this.initialize();
    const admin = this.getUserById(adminUserId);
    if (!admin || admin.role !== 'owner') {
      return { success: false, message: 'غير مصرح لك بإجراء هذه العملية.' };
    }

    if (adminUserId === targetUserId) {
      return { success: false, message: 'لا يمكن إيقاف حساب المالك.' };
    }

    const users = this.getUsers();
    const target = users.find(u => u.userId === targetUserId);
    if (!target) return { success: false, message: 'المستخدم غير موجود.' };

    const newStatus = target.accountStatus === 'active' ? 'suspended' : 'active';
    target.accountStatus = newStatus;
    this.saveUsers(users);

    this.addAuditLog({
      adminUserId,
      adminUsername: admin.username,
      actionType: newStatus === 'suspended' ? 'user_suspend' : 'user_activate',
      targetUserId,
      targetUsername: target.username,
      reason: reason || 'تغيير حالة الحساب من لوحة الإدارة',
      previousValue: target.accountStatus === 'active' ? 'suspended' : 'active',
      newValue: newStatus
    });

    return { 
      success: true, 
      message: `تم ${newStatus === 'suspended' ? 'إيقاف' : 'تنشيط'} حساب ${target.username} بنجاح.` 
    };
  }

  // Admin release lock prematurely
  public static adminReleaseLock(adminUserId: string, transactionId: string, reason: string): { success: boolean; message: string } {
    this.initialize();
    const admin = this.getUserById(adminUserId);
    if (!admin || admin.role !== 'owner') {
      return { success: false, message: 'غير مصرح لك بإجراء هذه العملية.' };
    }

    const transactions = this.getTransactions();
    const tx = transactions.find(t => t.transactionId === transactionId);
    if (!tx || tx.status !== 'locked') {
      return { success: false, message: 'المعاملة غير مقيدة أو غير موجودة.' };
    }

    const wallets = this.getWallets();
    const recipientWallet = wallets.find(w => w.ownerUserId === tx.receiverUserId);
    if (recipientWallet) {
      recipientWallet.lockedDemoBalance = Math.max(0, Math.round((recipientWallet.lockedDemoBalance - tx.amount) * 100) / 100);
      recipientWallet.availableDemoBalance = Math.round((recipientWallet.availableDemoBalance + tx.amount) * 100) / 100;
      recipientWallet.assets = createDefaultAssets(recipientWallet.totalDemoBalance);
      this.saveWallets(wallets);
    }

    tx.status = 'completed';
    tx.statusTextAr = 'متاحة للتصرف (فك تقييد إداري)';
    tx.notes = (tx.notes ? tx.notes + ' - ' : '') + `تم فك التقييد مبكراً من الإدارة: ${reason}`;
    this.saveTransactions(transactions);

    this.addAuditLog({
      adminUserId,
      adminUsername: admin.username,
      actionType: 'lock_release',
      targetUserId: tx.receiverUserId,
      targetUsername: tx.receiverUsername,
      reason: reason || 'فك تقييد مبكر بقرار إداري',
      previousValue: 'locked',
      newValue: 'completed'
    });

    this.addNotification({
      recipientUserId: tx.receiverUserId,
      transactionId: tx.transactionId,
      title: 'فك تقييد إداري للمبلغ',
      titleAr: 'فك تقييد إداري للمبلغ',
      body: `قام المالك بفك تقييد مبلغ ${tx.amount}$ مبكراً، وأصبح متاحاً بالكامل في محفظتك.`,
      bodyAr: `قام المالك بفك تقييد مبلغ ${tx.amount}$ مبكراً، وأصبح متاحاً بالكامل في محفظتك.`,
      type: 'lock_unlocked'
    });

    return { success: true, message: 'تم فك تقييد المعاملة بنجاح.' };
  }
}
