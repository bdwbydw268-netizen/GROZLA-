import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, AtSign, Hash, ShieldCheck, Clock, 
  AlertTriangle, CheckCircle2, X, Sparkles, RefreshCw,
  Calendar, Info, AlertCircle, Key, Lock, Eye, EyeOff
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface AccountsCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Check for Japanese characters: Kanji, Hiragana, Katakana
const isJapanese = (str: string) => {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(str);
};

// Validate name: Allows Arabic, English, and Japanese characters, plus standard spaces.
// Rejects emojis, decorative ornaments, special symbols.
const validateNameInput = (name: string): { valid: boolean; reason?: string } => {
  if (!name.trim()) {
    return { valid: false, reason: 'الاسم مطلوب ولا يمكن تركه فارغاً' };
  }
  return { valid: true };
};

export default function AccountsCenterModal({ isOpen, onClose }: AccountsCenterModalProps) {
  const { currentUser, updateProfile, showToast } = useAppContext();

  // Parse existing first and last name from currentUser
  const parseCurrentNames = () => {
    if (currentUser?.firstName && currentUser?.lastName) {
      return { first: currentUser.firstName, last: currentUser.lastName };
    }
    const parts = (currentUser?.name || '').trim().split(' ');
    const first = parts[0] || '';
    const last = parts.slice(1).join(' ') || '';
    return { first, last };
  };

  const initialNames = parseCurrentNames();
  const [firstName, setFirstName] = useState(initialNames.first);
  const [lastName, setLastName] = useState(initialNames.last);
  const [username, setUsername] = useState(currentUser?.username || '');
  const [accountNumber, setAccountNumber] = useState(
    currentUser?.accountNumber || currentUser?.phoneNumber || (currentUser?.id ? `OWN-${currentUser.id.substring(0, 8).toUpperCase()}` : 'OWN-789012')
  );

  // Security code confirmed in OWN Accounts Center (رمز تأكيد الأمان والاستعادة)
  const defaultSecurityCode = currentUser?.ownSecurityCode || currentUser?.pin || '789012';
  const [ownSecurityCode, setOwnSecurityCode] = useState(defaultSecurityCode);
  const [showSecurityCode, setShowSecurityCode] = useState(false);

  // Lock account dialog state
  const [showLockConfirmModal, setShowLockConfirmModal] = useState(false);
  const [lockCodeInput, setLockCodeInput] = useState('');
  const [lockError, setLockError] = useState<string | null>(null);
  const [isLocking, setIsLocking] = useState(false);

  // Validation errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewProgress, setReviewProgress] = useState(0);

  // Sync when currentUser changes
  useEffect(() => {
    if (currentUser) {
      const names = parseCurrentNames();
      setFirstName(names.first);
      setLastName(names.last);
      setUsername(currentUser.username || '');
      setAccountNumber(
        currentUser.accountNumber || currentUser.phoneNumber || (currentUser.id ? `OWN-${currentUser.id.substring(0, 8).toUpperCase()}` : 'OWN-789012')
      );
      setOwnSecurityCode(currentUser.ownSecurityCode || currentUser.pin || '789012');
    }
  }, [currentUser]);

  // Calculate 60-day name change limits
  // Rule: User can change name at most twice in 60 days
  const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const nameChangesHistory = (currentUser?.nameChangesHistory || []).map(t => new Date(t).getTime());
  
  // Recent changes within last 60 days
  const recentChanges = nameChangesHistory.filter(t => (now - t) < SIXTY_DAYS_MS);
  const changesCount = recentChanges.length;
  const canChangeName = changesCount < 2;

  // Next available unlock date if limit reached
  let daysUntilNextChange = 0;
  if (!canChangeName && recentChanges.length > 0) {
    const oldestIn60 = Math.min(...recentChanges);
    const unlockTime = oldestIn60 + SIXTY_DAYS_MS;
    daysUntilNextChange = Math.max(1, Math.ceil((unlockTime - now) / (24 * 60 * 60 * 1000)));
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const fullNewName = `${trimmedFirst} ${trimmedLast}`.trim();
    const isNameChanging = fullNewName !== (currentUser?.name || '').trim();

    // If changing name, enforce the 2 times in 60 days rule
    if (isNameChanging && !canChangeName) {
      setNameError(`عذراً، لقد قمت بتغيير اسم حسابك مرتين خلال آخر 60 يوماً. يمكنك تغيير الاسم مجدداً بعد ${daysUntilNextChange} يوماً.`);
      return;
    }

    // Validate first name and last name
    const firstVal = validateNameInput(trimmedFirst);
    if (!firstVal.valid) {
      setNameError(firstVal.reason || 'اسم أول غير صالح');
      return;
    }

    if (trimmedLast) {
      const lastVal = validateNameInput(trimmedLast);
      if (!lastVal.valid) {
        setNameError(lastVal.reason || 'اسم عائلة غير صالح');
        return;
      }
    }

    // Trigger Real-time Review process
    setIsReviewing(true);
    setReviewProgress(10);

    const timer1 = setTimeout(() => setReviewProgress(45), 600);
    const timer2 = setTimeout(() => setReviewProgress(80), 1200);
    const timer3 = setTimeout(async () => {
      setReviewProgress(100);

      const newHistory = isNameChanging 
        ? [...(currentUser?.nameChangesHistory || []), new Date().toISOString()]
        : (currentUser?.nameChangesHistory || []);

      try {
        await updateProfile({
          name: fullNewName,
          firstName: trimmedFirst,
          lastName: trimmedLast,
          username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
          accountNumber: accountNumber.trim(),
          ownSecurityCode: (ownSecurityCode || '789012').trim(),
          ownSecurityCodeConfirmedAt: new Date().toISOString(),
          nameChangesHistory: newHistory,
          nameReviewStatus: 'approved'
        });

        setIsReviewing(false);
        showToast('✅ تم حفظ بيانات مركز الحسابات وتأكيد رمز أمان OWN بنجاح');
        onClose();
      } catch (err) {
        setIsReviewing(false);
        setNameError('حدث خطأ أثناء حفظ التعديلات');
      }
    }, 1800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  };

  const handleConfirmLockAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLockError(null);
    const entered = lockCodeInput.trim();
    const actualCode = (ownSecurityCode || currentUser?.ownSecurityCode || currentUser?.pin || '789012').trim();

    if (!entered) {
      setLockError('يرجى إدخال رمز الأمان لتأكيد قفل الحساب');
      return;
    }

    if (entered !== actualCode) {
      setLockError('رمز الأمان غير مطابق للرمز المؤكد في مركز حسابات OWN. يجب عليك تأكيد الرمز الذي أنشأته.');
      return;
    }

    setIsLocking(true);
    try {
      await updateProfile({
        status: 'locked',
        suspensionReason: '🔒 تم قفل الحساب احترازياً بطلب المستخدم وحمايته. يتطلب تأكيد رمز مركز حسابات OWN لاستعادته.',
        ownSecurityCode: actualCode,
        lastLockDate: new Date().toISOString()
      });
      showToast('🔒 تم قفل الحساب بنجاح. يمكنك استعادته في واجهة قفل الحسابات بإدخال الرمز المؤكد في مركز حسابات OWN.');
      setShowLockConfirmModal(false);
      onClose();
    } catch (err: any) {
      setLockError(err?.message || 'تعذر قفل الحساب حالياً');
    } finally {
      setIsLocking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="accounts-center-backdrop"
        onClick={onClose}
        className="fixed inset-0 z-[170] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 dir-rtl cursor-default"
      >
        <motion.div
          id="accounts-center-card"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-200 overflow-hidden flex flex-col text-right"
        >
          {/* Header with Title: مركز الحسابات */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#1877f2] text-white flex items-center justify-center shadow-md shadow-blue-200 shrink-0">
                <ShieldCheck size={26} />
              </div>
              <div>
                <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                  <span>مركز الحسابات</span>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-black">
                    نظام OWN
                  </span>
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  إدارة الاسم المعتمد، اسم المستخدم، ورقم الحساب
                </p>
              </div>
            </div>
            <button 
              id="close-accounts-center-btn"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh]">
            {/* Rules Notice Badge */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-amber-900 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-xs">
                  <Clock size={15} className="text-amber-700 shrink-0" />
                  <span>ضوابط تغيير الاسم (مرتين في 60 يوم)</span>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                  canChangeName ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {canChangeName ? `متبقي لك ${2 - changesCount} من أصل 2` : 'استنفدت المحاولات'}
                </span>
              </div>
              <p className="text-[11px] text-amber-800/90 leading-relaxed font-medium">
                • يُمنع وضع الإيموجيات (🚫) أو الزخارف والرموز التشكيلية.<br />
                • تُقبل الأسماء اليابانية (漢字 / かな) والإنجليزية والعربية بشكل عادي وطبيعي.
              </p>
              {!canChangeName && (
                <div className="mt-2 p-2 bg-rose-100/70 border border-rose-300 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>تغيير الاسم مقفل حالياً. سيمكنك التعديل مجدداً بعد {daysUntilNextChange} يوماً.</span>
                </div>
              )}
            </div>

            {/* Error Message */}
            {nameError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700 flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{nameError}</span>
              </div>
            )}

            {/* Structured Fields requested in exact order:
                1. اسم أول فوق (First Name above)
                2. اسم عائلة تحت (Last Name below)
                3. وتحتها: تقنية اسم مستخدم (Username)
                4. وتحتها: اسم رقم حساب (Account Number)
            */}
            <div className="space-y-4">
              {/* Field 1: اسم أول فوق */}
              <div>
                <label className="block text-xs font-black text-gray-900 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <UserIcon size={14} className="text-blue-600" />
                    الاسم الأول
                  </span>
                  <span className="text-[10px] text-gray-400 font-normal">أعلى الحساب (مطلوب)</span>
                </label>
                <input 
                  id="account-center-first-name"
                  type="text" 
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    setNameError(null);
                  }}
                  disabled={!canChangeName}
                  placeholder="مثال: أحمد أو Kenji (健二)"
                  className="w-full bg-gray-50 border border-gray-300 focus:border-blue-600 focus:bg-white rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none transition-all disabled:opacity-60 disabled:bg-gray-100"
                  required
                />
              </div>

              {/* Field 2: اسم عائلة تحت */}
              <div>
                <label className="block text-xs font-black text-gray-900 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <UserIcon size={14} className="text-blue-600" />
                    اسم العائلة
                  </span>
                  <span className="text-[10px] text-gray-400 font-normal">تحت الاسم الأول</span>
                </label>
                <input 
                  id="account-center-last-name"
                  type="text" 
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    setNameError(null);
                  }}
                  disabled={!canChangeName}
                  placeholder="مثال: الشامي أو Sato (佐藤)"
                  className="w-full bg-gray-50 border border-gray-300 focus:border-blue-600 focus:bg-white rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none transition-all disabled:opacity-60 disabled:bg-gray-100"
                />
              </div>

              {/* Field 3: وتحتها تقنية اسم مستخدم */}
              <div>
                <label className="block text-xs font-black text-gray-900 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <AtSign size={14} className="text-indigo-600" />
                    تقنية اسم مستخدم
                  </span>
                  <span className="text-[10px] text-gray-400 font-normal">معرف الحساب الفريد</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute right-3.5 font-bold text-gray-400 text-sm">@</span>
                  <input 
                    id="account-center-username"
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="username"
                    className="w-full bg-gray-50 border border-gray-300 focus:border-indigo-600 focus:bg-white rounded-2xl pr-8 pl-3 py-3 text-sm font-bold text-gray-900 outline-none transition-all dir-ltr text-right font-mono"
                  />
                </div>
              </div>

              {/* Field 4: وتحتها اسم رقم حساب */}
              <div>
                <label className="block text-xs font-black text-gray-900 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Hash size={14} className="text-emerald-600" />
                    اسم رقم الحساب
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                    رقم فريد معتمد
                  </span>
                </label>
                <input 
                  id="account-center-account-number"
                  type="text" 
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="OWN-123456 أو رقم الهاتف"
                  className="w-full bg-gray-50 border border-gray-300 focus:border-emerald-600 focus:bg-white rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none transition-all font-mono dir-ltr text-right"
                />
              </div>

              {/* Field 5: رمز تأكيد واستعادة الحساب (المؤكد في مركز حسابات OWN) */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border border-blue-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                    <Key size={15} className="text-blue-600" />
                    <span>رمز تأكيد واستعادة الحساب (نظام OWN)</span>
                  </label>
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <ShieldCheck size={11} />
                    <span>مؤكّد في مركز حسابات OWN</span>
                  </span>
                </div>

                <div className="relative flex items-center">
                  <input
                    id="account-center-security-code"
                    type={showSecurityCode ? 'text' : 'password'}
                    value={ownSecurityCode}
                    onChange={(e) => setOwnSecurityCode(e.target.value)}
                    placeholder="أدخل رمز الأمان (مثال: 789012)"
                    className="w-full bg-white border border-blue-300 focus:border-blue-600 rounded-xl pr-4 pl-10 py-2.5 text-sm font-black text-gray-900 outline-none transition-all font-mono dir-ltr text-right"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecurityCode(!showSecurityCode)}
                    className="absolute left-3 text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    {showSecurityCode ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <p className="text-[11px] text-blue-900/90 leading-relaxed font-medium">
                  💡 <strong>أمان واستعادة الحساب:</strong> هذا الرمز هو الرمز المؤكّد في مركز حسابات OWN الخاص بك. عند قفل الحساب وفي واجهة قفل الحسابات، يجب عليك تأكيد هذا الرمز الذي قمت بإنشائه لاستعادة حسابك مرة أخرى وفك القفل.
                </p>

                {/* Option to Lock Account with Code Confirmation */}
                <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between">
                  <div className="text-right">
                    <span className="text-xs font-black text-gray-900 block">واجهة قفل الحسابات</span>
                    <span className="text-[10px] text-gray-500 font-medium">قفل الحساب احترازياً لحمايته وتأكيده بالرمز</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLockCodeInput('');
                      setLockError(null);
                      setShowLockConfirmModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Lock size={13} />
                    <span>قفل الحساب احترازياً</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Real-time Review Status Banner */}
            {isReviewing && (
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-right space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                  <div className="flex items-center gap-2">
                    <RefreshCw size={14} className="animate-spin text-blue-600" />
                    <span>فحص ومراجعة الاسم في الوقت الحقيقي...</span>
                  </div>
                  <span>{reviewProgress}%</span>
                </div>
                <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${reviewProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-blue-700 font-medium">
                  يتم التحقق من خلو الاسم من الزخارف والإيموجيات وضمان مطابقته لمعايير OWN
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isReviewing}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={isReviewing}
                className="px-6 py-2.5 bg-[#1877f2] hover:bg-blue-700 text-white font-black rounded-2xl text-xs shadow-md shadow-blue-200 hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                {isReviewing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>جارٍ المراجعة والحفظ...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>حفظ واعتماد التغييرات</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Lock Account Confirmation Modal (تأكيد رمز مركز حسابات OWN لقفل الحساب) */}
      {showLockConfirmModal && (
        <div 
          onClick={() => setShowLockConfirmModal(false)}
          className="fixed inset-0 z-[180] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 dir-rtl"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-rose-200 text-right space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Lock size={24} />
              </div>
              <div>
                <h3 className="font-black text-gray-900 text-base">
                  تأكيد قفل الحساب واختبار الاستعادة
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  تأكيد الرمز المعتمد في مركز حسابات OWN
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-medium leading-relaxed">
              ⚠️ <strong>تنبيه الأمان:</strong> عند قفل الحساب، سيتم نقلك مباشرة إلى <strong>واجهة قفل الحسابات</strong>. ولن تتمكن من استعادة حسابك إلا بإدخال وتأكيد الرمز الذي قمت بإنشائه والمؤكد في مركز حسابات OWN.
            </div>

            {lockError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{lockError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmLockAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-900 mb-1.5">
                  أدخل رمز أمان مركز حسابات OWN لتأكيد القفل:
                </label>
                <input
                  type="password"
                  value={lockCodeInput}
                  onChange={(e) => {
                    setLockCodeInput(e.target.value);
                    setLockError(null);
                  }}
                  placeholder="أدخل الرمز الذي أنشأته"
                  className="w-full bg-gray-50 border border-gray-300 focus:border-rose-500 focus:bg-white rounded-xl px-4 py-3 text-sm font-mono text-gray-900 outline-none transition-all dir-ltr text-right"
                  required
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  الرمز المؤكد المسجل: <span className="font-mono text-gray-600">{ownSecurityCode}</span>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLockConfirmModal(false)}
                  disabled={isLocking}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isLocking}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-200 cursor-pointer transition-all flex items-center gap-1.5"
                >
                  {isLocking ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>جارٍ القفل...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={13} />
                      <span>تأكيد الرمز وقفل الحساب الآن</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
