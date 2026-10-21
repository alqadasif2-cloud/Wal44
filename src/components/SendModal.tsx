import React, { useState } from 'react';
import { User, Wallet } from '../types/wallet';
import { WalletDatabase } from '../services/walletDb';
import { formatCurrency } from '../utils/formatters';
import { X, Send, Lock, AlertCircle } from 'lucide-react';

interface SendModalProps {
  currentUser: User;
  wallet: Wallet | null;
  isArabic: boolean;
  initialRecipient?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const LOCK_DURATIONS = [
  { labelAr: 'دون تقييد', labelEn: 'No Lock', minutes: 0 },
  { labelAr: '5 دقائق', labelEn: '5 min', minutes: 5 },
  { labelAr: '15 دقيقة', labelEn: '15 min', minutes: 15 },
  { labelAr: '30 دقيقة', labelEn: '30 min', minutes: 30 },
  { labelAr: 'ساعة واحدة', labelEn: '1 hour', minutes: 60 },
  { labelAr: '6 ساعات', labelEn: '6 hours', minutes: 360 },
  { labelAr: '12 ساعة', labelEn: '12 hours', minutes: 720 },
  { labelAr: '24 ساعة', labelEn: '24 hours', minutes: 1440 },
  { labelAr: 'مدة مخصصة', labelEn: 'Custom', minutes: -1 }
];

export const SendModal: React.FC<SendModalProps> = ({
  currentUser,
  wallet,
  isArabic,
  initialRecipient = '',
  onClose,
  onSuccess
}) => {
  const [recipient, setRecipient] = useState(initialRecipient);
  const [amountStr, setAmountStr] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<number>(0);
  const [customMinutes, setCustomMinutes] = useState<string>('45');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableBalance = wallet?.availableDemoBalance ?? 0;

  const handleSetMax = () => {
    setAmountStr(availableBalance.toString());
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg(isArabic ? 'يرجى إدخال مبلغ صحيح أكبر من 0' : 'Please enter a valid amount');
      return;
    }

    if (amount > availableBalance) {
      setErrorMsg(
        isArabic
          ? `المبلغ يتجاوز الرصيد المتاح ($${availableBalance.toFixed(2)}). الرصيد المقيد لا يمكن إرساله.`
          : `Amount exceeds available balance ($${availableBalance.toFixed(2)}).`
      );
      return;
    }

    if (!recipient.trim()) {
      setErrorMsg(isArabic ? 'يرجى تحديد اسم المستلم أو عنوان المحفظة' : 'Please specify a recipient');
      return;
    }

    let finalLockMinutes = selectedDuration;
    if (selectedDuration === -1) {
      const parsedCustom = parseInt(customMinutes, 10);
      if (isNaN(parsedCustom) || parsedCustom <= 0) {
        setErrorMsg(isArabic ? 'يرجى إدخال مدة تقييد مخصصة صحيحة بالدقائق' : 'Please enter valid custom minutes');
        return;
      }
      finalLockMinutes = parsedCustom;
    }

    setIsSubmitting(true);

    try {
      const res = WalletDatabase.executeSendTransfer({
        senderUserId: currentUser.userId,
        recipientIdentifier: recipient.trim(),
        amount,
        lockDurationMinutes: finalLockMinutes,
        notes: notes.trim()
      });

      if (!res.success) {
        setErrorMsg(res.message);
        setIsSubmitting(false);
        return;
      }

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || (isArabic ? 'حدث خطأ أثناء تنفيذ التحويل' : 'Transfer error'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0d1424] border border-slate-800 p-6 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">
              {isArabic ? 'إرسال أموال' : 'Send Funds'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Recipient Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                {isArabic ? 'عنوان المحفظة أو اسم المستلم' : 'Recipient Address or Username'}
              </label>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) setRecipient(text.trim());
                  } catch {
                    // Ignore
                  }
                }}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
              >
                {isArabic ? 'لصق' : 'Paste'}
              </button>
            </div>

            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={isArabic ? '0x... أو اسم المستلم' : '0x... or recipient identifier'}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-white placeholder-slate-500 outline-none transition-colors font-mono text-xs"
              dir="ltr"
            />
          </div>

          {/* Amount Input with Max Button */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                {isArabic ? 'المبلغ المراد إرساله ($)' : 'Amount ($)'}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">
                  {isArabic ? 'المتاح:' : 'Available:'}{' '}
                  <span className="font-bold text-emerald-400 font-mono-numbers">
                    {formatCurrency(availableBalance)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleSetMax}
                  className="text-[11px] font-bold text-blue-400 hover:text-blue-300 px-1.5 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20"
                >
                  {isArabic ? 'الحد الأقصى' : 'MAX'}
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-base font-bold text-white placeholder-slate-600 outline-none font-mono-numbers"
              />
              <span className="absolute left-3 top-3 text-xs font-bold text-slate-400 font-mono">
                USD
              </span>
            </div>
          </div>

          {/* Time Lock Feature (مدة تقييد المبلغ) */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 mb-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <label className="text-xs font-bold text-slate-200">
                {isArabic ? 'مدة تقييد المبلغ (اختياري)' : 'Lock Duration (Optional)'}
              </label>
            </div>
            
            <p className="text-[11px] text-slate-400 mb-2.5">
              {isArabic
                ? 'عند تفعيل التقييد، يظهر المبلغ في رصيد المستلم الإجمالي ولكنه لا يستطيع إعادة إرساله حتى انتهاء المدة.'
                : 'Locked funds appear in recipient total balance but cannot be re-sent until timer expires.'}
            </p>

            {/* Duration pill buttons */}
            <div className="grid grid-cols-3 gap-1.5">
              {LOCK_DURATIONS.map((dur) => (
                <button
                  key={dur.minutes}
                  type="button"
                  onClick={() => setSelectedDuration(dur.minutes)}
                  className={`py-1.5 px-2 text-xs font-semibold rounded-xl border transition-all ${
                    selectedDuration === dur.minutes
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {isArabic ? dur.labelAr : dur.labelEn}
                </button>
              ))}
            </div>

            {/* Custom Minutes Input */}
            {selectedDuration === -1 && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  placeholder="30"
                  className="w-24 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white outline-none font-mono"
                />
                <span className="text-xs text-slate-400">
                  {isArabic ? 'دقيقة (التحقق من الخادم)' : 'Minutes'}
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
              {isArabic ? 'ملاحظات إضافية (اختياري)' : 'Notes (Optional)'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isArabic ? 'ملاحظات المعاملة' : 'Transaction notes'}
              className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>{isArabic ? 'جاري التحقق والخصم الذري...' : 'Processing...'}</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{isArabic ? 'تأكيد الإرسال الفوري' : 'Confirm & Send'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
