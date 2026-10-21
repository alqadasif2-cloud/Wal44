import React, { useState } from 'react';
import { User, Wallet } from '../types/wallet';
import { WalletDatabase } from '../services/walletDb';
import { Sparkles, X, Check, AlertCircle } from 'lucide-react';

interface FaucetModalProps {
  currentUser: User;
  isArabic: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const FaucetModal: React.FC<FaucetModalProps> = ({
  currentUser,
  isArabic,
  onClose,
  onSuccess
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [isClaiming, setIsClaiming] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleClaim = () => {
    setIsClaiming(true);

    const res = WalletDatabase.adminAdjustBalance({
      adminUserId: 'usr_owner_sami',
      targetUserId: currentUser.userId,
      amountDelta: selectedAmount,
      reason: isArabic ? 'إيداع رصيد فوري للمحفظة' : 'Instant deposit grant'
    });

    setIsClaiming(false);
    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#0d1424] border border-cyan-500/30 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              {isArabic ? 'إيداع رصيد' : 'Instant Deposit'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 mt-3 leading-relaxed">
          {isArabic
            ? 'اختر المبلغ المراد إيداعه في المحفظة للبدء في إجراء التحويلات.'
            : 'Select amount to deposit into your wallet.'}
        </p>

        {/* Amount Selector */}
        <div className="grid grid-cols-3 gap-2 my-4">
          {[50, 100, 500].map(amt => (
            <button
              key={amt}
              onClick={() => setSelectedAmount(amt)}
              className={`py-3 rounded-2xl text-xs font-bold border transition-all ${
                selectedAmount === amt
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              +${amt}
            </button>
          ))}
        </div>

        {success ? (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            <span>{isArabic ? 'تمت إضافة الرصيد بنجاح!' : 'Funds added successfully!'}</span>
          </div>
        ) : (
          <button
            onClick={handleClaim}
            disabled={isClaiming}
            className="w-full py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all active:scale-98 disabled:opacity-50"
          >
            {isClaiming ? (isArabic ? 'جاري الإيداع...' : 'Processing...') : (isArabic ? `إيداع +$${selectedAmount} الآن` : `Deposit +$${selectedAmount}`)}
          </button>
        )}
      </div>
    </div>
  );
};
