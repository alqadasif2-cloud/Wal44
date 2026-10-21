import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { User, Wallet, Transaction } from '../types/wallet';
import { formatCurrency, formatCountdown, shortenAddress } from '../utils/formatters';
import { X, Copy, Check, QrCode, AlertCircle, Clock, ShieldAlert } from 'lucide-react';

interface ReceiveModalProps {
  user: User;
  wallet: Wallet | null;
  lockedTransactions: Transaction[];
  isArabic: boolean;
  onClose: () => void;
}

export const ReceiveModal: React.FC<ReceiveModalProps> = ({
  user,
  wallet,
  lockedTransactions,
  isArabic,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<'BEP20' | 'ERC20' | 'TRC20'>('BEP20');
  const [remainingTimeMap, setRemainingTimeMap] = useState<Record<string, number>>({});

  const address = user.demoAddress;

  // Render QR code onto canvas
  useEffect(() => {
    if (canvasRef.current && address) {
      QRCode.toCanvas(
        canvasRef.current,
        address,
        {
          width: 180,
          margin: 1.5,
          color: {
            dark: '#070b13',
            light: '#ffffff'
          }
        },
        (error) => {
          if (error) console.error('QR code render error', error);
        }
      );
    }
  }, [address]);

  // Update countdown timers every second
  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const map: Record<string, number> = {};
      lockedTransactions.forEach(tx => {
        if (tx.lockUntil) {
          const exp = new Date(tx.lockUntil).getTime();
          map[tx.transactionId] = Math.max(0, exp - now);
        }
      });
      setRemainingTimeMap(map);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lockedTransactions]);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0d1424] border border-slate-800 p-6 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">
              {isArabic ? 'استقبال الأموال' : 'Receive Funds'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Network Selector Tabs */}
        <div className="mt-4 flex items-center justify-center gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800">
          {(['BEP20', 'ERC20', 'TRC20'] as const).map((net) => (
            <button
              key={net}
              onClick={() => setSelectedNetwork(net)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedNetwork === net
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {net}
            </button>
          ))}
        </div>

        {/* QR Code Canvas Frame */}
        <div className="mt-5 flex flex-col items-center">
          <div className="p-3 bg-white rounded-2xl shadow-xl shadow-emerald-500/10">
            <canvas ref={canvasRef} className="rounded-lg block" />
          </div>

          <span className="mt-2 text-xs font-semibold text-slate-300">
            {user.displayName} (@{user.username})
          </span>
        </div>

        {/* Address Card & Copy Button */}
        <div className="mt-4 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              {isArabic ? 'عنوان المحفظة الفريد' : 'Wallet Address'}
            </span>
            <span className="text-xs font-mono text-slate-200 truncate select-all" dir="ltr">
              {address}
            </span>
          </div>

          <button
            onClick={handleCopy}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              copied
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{isArabic ? 'تم النسخ' : 'Copied'}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{isArabic ? 'نسخ' : 'Copy'}</span>
              </>
            )}
          </button>
        </div>

        {/* Prominent Legal Disclaimer */}
        <div className="mt-4 p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-blue-200/90">
            {isArabic
              ? 'تنبيه أمان: يرجى التحقق من مطابقة عنوان الشبكة المختارة عند إرسال أو استلام الأصول الرقمية لتجنب فقدان العملات.'
              : 'Security Notice: Please ensure you verify the matching network when sending or receiving digital assets.'}
          </p>
        </div>

        {/* Locked funds status section if any */}
        {wallet && wallet.lockedDemoBalance > 0 && (
          <div className="mt-4 p-3.5 rounded-2xl bg-blue-950/40 border border-blue-800/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{isArabic ? 'حالة المبالغ المقيدة' : 'Time-Locked Funds'}</span>
              </div>
              <span className="text-xs font-bold text-amber-300 font-mono-numbers">
                {formatCurrency(wallet.lockedDemoBalance)}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mb-2">
              {isArabic 
                ? 'لديك مبالغ مستلمة مقيدة مؤقتاً بواسطة المرسل. ستصبح متاحة تلقائياً عند انتهاء المؤقت.'
                : 'You have incoming funds locked by sender. They will unlock automatically when countdown expires.'}
            </p>

            {/* List active locks */}
            <div className="space-y-2 mt-2">
              {lockedTransactions.map((tx) => {
                const remainingMs = remainingTimeMap[tx.transactionId] || 0;
                return (
                  <div key={tx.transactionId} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-200">
                        {formatCurrency(tx.amount)} {isArabic ? `من ${tx.senderUsername}` : `from ${tx.senderUsername}`}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {tx.notes || tx.transactionId}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[11px]">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{formatCountdown(remainingMs)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Close Button */}
        <div className="mt-5">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-colors"
          >
            {isArabic ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
