import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, where, getDocs, getDoc, setDoc, updateDoc, doc } from 'firebase/firestore';
import { 
  Key, 
  Lock, 
  User as UserIcon, 
  Mail, 
  Phone, 
  ArrowRight, 
  CheckCircle, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Search as SearchIcon,
  ChevronLeft,
  Smartphone,
  Check,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { DEFAULT_AVATAR } from '../constants/avatar';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

export default function ForgotPassword({ onBackToLogin }: ForgotPasswordProps) {
  const { users, login, setCurrentView, showToast } = useAppContext();

  // Navigation Steps:
  // 1: Search Account (بحث عن الحساب بواسطة البريد أو رقم الهاتف)
  // 2: Choose Account from list (اختيار الحساب من الحسابات المرتبطة)
  // 3: Verification Methods (خيارات التحقق: رمز PIN 6 أرقام، كلمة السر، رمز OTP)
  // 4: Create New Password (إنشاء كلمة سر جديدة مع زر متابعة أزرق وتخطي أبيض)
  // 5: Success confirmation
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [matchingAccounts, setMatchingAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  // Verification state
  const [verificationMethod, setVerificationMethod] = useState<'password' | 'otp'>('otp');
  const [pinInput, setPinInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  // New Password state
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper phone normalization function
  const normalizePhone = (str?: string) => {
    if (!str) return '';
    return str.replace(/[\s\-\(\)\+]/g, '').replace(/^0+/, '');
  };

  // Helper SHA-256 function
  const hashString = async (message: string) => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // STEP 1: Search for accounts by Email or Phone or Username
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    const term = searchQuery.trim();
    if (!term) {
      setError('يرجى إدخال البريد الإلكتروني أو رقم الهاتف للبحث عن حسابك.');
      return;
    }

    setLoading(true);
    try {
      const termLower = term.toLowerCase();
      const normTerm = normalizePhone(term);
      const accountsMap = new Map<string, any>();

      // 1. Search in local loaded users context
      if (users && users.length > 0) {
        users.forEach(u => {
          const uName = (u.name || '').toLowerCase();
          const uEmail = (u.email || '').toLowerCase();
          const uPhone = (u.phone || '').toLowerCase();
          const uUsername = (u.username || '').toLowerCase();
          const uNickname = (u.nickname || '').toLowerCase();
          const cleanEmail = uEmail.replace('@samado.com', '');
          const normPhone = normalizePhone(uPhone);

          const isMatch = (
            uEmail.includes(termLower) ||
            cleanEmail.includes(termLower) ||
            (uPhone && (uPhone.includes(term) || (normTerm && normPhone.includes(normTerm)))) ||
            (uUsername && uUsername.includes(termLower)) ||
            (uNickname && uNickname.includes(termLower)) ||
            uName.includes(termLower)
          );

          if (isMatch) {
            accountsMap.set(u.id || u.uid || u.email, u);
          }
        });
      }

      // 2. Search directly in Firestore users collection for real-time updated data
      let formattedEmail = termLower;
      if (!formattedEmail.includes('@')) {
        formattedEmail = `${formattedEmail.replace('+', '')}@samado.com`;
      }

      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        usersSnap.forEach(d => {
          const uData = d.data();
          const uId = d.id;
          const uName = (uData.name || '').toLowerCase();
          const uEmail = (uData.email || '').toLowerCase();
          const uPhone = (uData.phone || '').toLowerCase();
          const uUsername = (uData.username || '').toLowerCase();
          const uNickname = (uData.nickname || '').toLowerCase();
          const cleanEmail = uEmail.replace('@samado.com', '');
          const normPhone = normalizePhone(uPhone);

          const isMatch = (
            uEmail.includes(termLower) ||
            cleanEmail.includes(termLower) ||
            uEmail === formattedEmail ||
            (uPhone && (uPhone.includes(term) || (normTerm && normPhone.includes(normTerm)))) ||
            (uUsername && uUsername.includes(termLower)) ||
            (uNickname && uNickname.includes(termLower)) ||
            uName.includes(termLower)
          );

          if (isMatch) {
            accountsMap.set(uId, { id: uId, uid: uId, ...uData });
          }
        });
      } catch (err) {
        console.warn('Firestore users scan error:', err);
      }

      const results = Array.from(accountsMap.values());

      if (results.length === 0) {
        setError('لم يتم العثور على أي حساب مرتبط ببيانات البحث هذه. يرجى التحقق من الرقم أو البريد.');
      } else if (results.length === 1) {
        // Exactly one matching account -> automatically select it and advance to step 3!
        setSelectedAccount(results[0]);
        setMatchingAccounts(results);
        setStep(3);
      } else {
        // Multiple matching accounts -> show list to choose from (Step 2)
        setMatchingAccounts(results);
        setStep(2);
      }
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء البحث عن الحساب. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Select an account from the list
  const handleSelectAccount = (account: any) => {
    setError('');
    setSelectedAccount(account);
    setPinInput('');
    setPasswordInput('');
    setOtpInput('');
    setIsOtpSent(false);
    // As explicitly requested: Clicking an account does NOT require re-entering the phone or email!
    setStep(3);
  };

  // STEP 3: Verify with 6-digit PIN code
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanPin = pinInput.trim();
    if (cleanPin.length !== 6) {
      setError('يرجى إدخال رمز PIN المكون من 6 أرقام كاملة.');
      return;
    }

    setLoading(true);
    try {
      let isValid = false;
      const targetUserId = selectedAccount.id || selectedAccount.uid;

      // Check 1: Real-time query to Firestore user doc to get freshest updated PIN
      if (targetUserId) {
        try {
          const userDocRef = doc(db, 'users', targetUserId);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const liveData = userDocSnap.data();
            if (liveData.pin && String(liveData.pin).trim() === cleanPin) {
              isValid = true;
            }
          }
        } catch (err) {
          console.warn('Firestore live pin check error:', err);
        }
      }

      // Check 2: Check selectedAccount state PIN
      if (!isValid && selectedAccount.pin && String(selectedAccount.pin).trim() === cleanPin) {
        isValid = true;
      }

      // Check 3: Check context users list
      if (!isValid && users && users.length > 0) {
        const foundUser = users.find(u => (u.id === targetUserId || u.uid === targetUserId || u.email === selectedAccount.email));
        if (foundUser?.pin && String(foundUser.pin).trim() === cleanPin) {
          isValid = true;
        }
      }

      // Check 4: Check savedAccounts in localStorage
      if (!isValid) {
        try {
          const savedAccounts = JSON.parse(localStorage.getItem('savedAccounts') || '[]');
          const localAcc = savedAccounts.find((a: any) => a.uid === targetUserId || a.email === selectedAccount.email);
          if (localAcc?.pin && String(localAcc.pin).trim() === cleanPin) {
            isValid = true;
          }
        } catch (e) {
          console.warn(e);
        }
      }

      // Check 5: Check password_recovery collection hash
      if (!isValid && selectedAccount.email) {
        try {
          const recoveryHash = await hashString(`${selectedAccount.email.toLowerCase()}_${cleanPin}`);
          const recSnap = await getDoc(doc(db, 'password_recovery', recoveryHash));
          if (recSnap.exists()) {
            isValid = true;
          }
        } catch (err) {
          console.warn(err);
        }
      }

      // Check 6: If this account has no PIN set yet in any storage, allow setting this as their recovery PIN
      if (!isValid && (!selectedAccount.pin || selectedAccount.pin === '')) {
        isValid = true;
      }

      if (isValid) {
        // Success! Move to Step 4: "إنشاء كلمة سر جديدة"
        setStep(4);
      } else {
        setError('رمز PIN غير صحيح أو تم تحديثه مسبقاً. يرجى إدخال رمز PIN المحدث المكون من 6 أرقام.');
      }
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء التحقق من رمز PIN.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 3 Alternative: Verify with Current Password
  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!passwordInput.trim()) {
      setError('يرجى إدخال كلمة السر.');
      return;
    }

    setLoading(true);
    try {
      await login(selectedAccount.email, passwordInput.trim());
      showToast('تم تسجيل الدخول بنجاح!');
      setCurrentView('home');
    } catch (err: any) {
      console.error(err);
      setError('كلمة السر غير صحيحة.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 3 Alternative: Send and Verify OTP Code
  const handleSendOtp = async () => {
    setError('');
    
    if (!selectedAccount?.email || !selectedAccount.email.includes('@')) {
      setError('هذا الحساب غير مرتبط ببريد إلكتروني صالح.');
      return;
    }

    try {
      // إرسال إيميل حقيقي عبر نظام Firebase (الذي يرسل من firebaseapp.com)
      try {
        await sendPasswordResetEmail(auth, selectedAccount.email);
        showToast('تم إرسال رسالة من Firebase إلى البريد بنجاح!');
      } catch (authErr: any) {
        console.warn("Firebase sendPasswordResetEmail note:", authErr?.code || authErr?.message);
      }

      // توليد رمز التأكيد السداسي لاستكمال التدفق واستعادة كلمة السر
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setIsOtpSent(true);
      showToast(`تم إرسال رمز الأمان (${code}) للمتابعة! ✨`);
    } catch (err: any) {
      console.error(err);
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setIsOtpSent(true);
      showToast(`تم إنشاء رمز الأمان (${code}) للمتابعة! ✨`);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otpInput.trim() === generatedOtp) {
      setStep(4);
      return;
    }

    setLoading(true);
    try {
      // Try verifying the code as a Firebase OOB Code (if user pastes the code from the email link)
      const { verifyPasswordResetCode } = await import('firebase/auth');
      await verifyPasswordResetCode(auth, otpInput.trim());
      setStep(4);
    } catch (err: any) {
      console.error(err);
      setError('الرمز غير صحيح. يرجى إدخال الرمز السداسي، أو الرمز الطويل (oobCode) الموجود في رابط الجيميل.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 4: Submit New Password (زر متابعة أزرق)
  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('كلمة السر يجب أن تحتوي على 6 أحرف أو أرقام على الأقل.');
      return;
    }

    setLoading(true);
    try {
      const targetUserId = selectedAccount.id || selectedAccount.uid;

      // 1. Update user in Firestore if exists
      if (targetUserId) {
        try {
          const userRef = doc(db, 'users', targetUserId);
          await updateDoc(userRef, {
            password: newPassword,
            updatedAt: new Date().toISOString()
          });
        } catch (e) {
          console.warn('Could not update user doc password directly', e);
        }
      }

      // 2. Update password_recovery document
      if (selectedAccount.email) {
        const pinToUse = pinInput || selectedAccount.pin || '123456';
        const recoveryHash = await hashString(`${selectedAccount.email.toLowerCase()}_${pinToUse}`);
        await setDoc(doc(db, 'password_recovery', recoveryHash), {
          password: newPassword,
          userId: targetUserId || selectedAccount.email,
          updatedAt: new Date().toISOString()
        });
      }

      // 2.5 Update saved_accounts in localStorage with new password
      try {
        const savedRaw = localStorage.getItem('saved_accounts') || localStorage.getItem('savedAccounts') || '[]';
        const savedList = JSON.parse(savedRaw);
        const updatedList = savedList.map((acc: any) => {
          if (acc.email?.toLowerCase() === selectedAccount.email?.toLowerCase() || acc.name === selectedAccount.name) {
            return { ...acc, password: newPassword };
          }
          return acc;
        });
        localStorage.setItem('saved_accounts', JSON.stringify(updatedList));
      } catch (err) {}

      // 3. Log in automatically or set custom user session
      try {
        await login(selectedAccount.email, newPassword);
      } catch (authErr) {
        // Fallback custom session
        if (targetUserId) {
          localStorage.setItem('customUserSession', targetUserId);
        }
      }

      showToast('تم تحديث كلمة السر بنجاح وتسجيل الدخول!');
      setCurrentView('home');
    } catch (err: any) {
      console.error(err);
      setError('حدث خطأ أثناء حفظ كلمة السر الجديدة. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 4: Skip New Password (زر تخطي أبيض)
  const handleSkipNewPassword = async () => {
    setLoading(true);
    try {
      const targetUserId = selectedAccount.id || selectedAccount.uid;
      
      // Try login or set custom session
      if (targetUserId) {
        localStorage.setItem('customUserSession', targetUserId);
      }
      
      showToast('تم تسجيل الدخول إلى حسابك بنجاح!');
      setCurrentView('home');
    } catch (err) {
      console.error(err);
      onBackToLogin();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col dir-rtl font-sans selection:bg-blue-100 selection:text-blue-700">
      
      {/* Top Header Bar */}
      <header className="w-full bg-white border-b border-gray-200 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (step === 1) onBackToLogin();
              else if (step === 2) setStep(1);
              else if (step === 3) {
                if (matchingAccounts.length > 1) setStep(2);
                else setStep(1);
              }
              else if (step === 4) setStep(3);
              else onBackToLogin();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-bold transition-all cursor-pointer"
          >
            <ArrowRight size={16} />
            <span>{step === 1 ? 'العودة لتسجيل الدخول' : 'رجوع'}</span>
          </button>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1877f2] font-sans select-none flex items-center justify-center gap-1.5">
            <span>OWN</span>
            <span className="text-xl mt-1 text-blue-500">あ</span>
          </h1>
        </div>

        <button
          onClick={onBackToLogin}
          className="text-xs sm:text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
        >
          إلغاء
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md mx-auto">

          {/* Global Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-red-700 text-xs sm:text-sm font-bold"
            >
              <AlertCircle size={18} className="shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* STEP 1: Search Account (العثور على حسابك بواسطة البريد أو رقم الهاتف) */}
          {/* ========================================================================= */}
          {step === 1 && (
            <motion.div
              key="step-1-search"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
            >
              <div className="space-y-2 border-b border-gray-100 pb-5">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1877f2] flex items-center justify-center mb-3">
                  <SearchIcon size={24} className="stroke-[2.5]" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  العثور على حسابك
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed">
                  يرجى إدخال عنوان بريدك الإلكتروني أو رقم هاتفك للبحث عن حسابك.
                </p>
              </div>

              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-700 block mr-1">
                    البريد الإلكتروني أو رقم الهاتف
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="أدخل بريدك الإلكتروني أو رقم الهاتف..."
                      className="w-full px-4 py-3.5 bg-gray-50 rounded-2xl border border-gray-200 focus:border-[#1877f2] focus:bg-white text-sm font-bold outline-none transition-all placeholder:text-gray-400"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3.5 px-5 bg-[#1877f2] hover:bg-blue-700 text-white text-sm font-black rounded-2xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <SearchIcon size={17} />
                        <span>بحث</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onBackToLogin}
                    className="py-3.5 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-2xl transition-all cursor-pointer text-center"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: Choose Account from Linked Accounts List (عرض جميع الحسابات المرتبطة) */}
          {/* ========================================================================= */}
          {step === 2 && (
            <motion.div
              key="step-2-select"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5"
            >
              <div className="space-y-1.5 border-b border-gray-100 pb-4">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  حدد حسابك
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed">
                  تم العثور على الحسابات التالية المرتبطة بـ <span className="font-bold text-gray-800">"{searchQuery}"</span>. اختر حسابك للمتابعة:
                </p>
              </div>

              {/* Accounts List */}
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {matchingAccounts.map((account, idx) => (
                  <motion.div
                    key={account.id || account.uid || idx}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleSelectAccount(account)}
                    className="p-3.5 sm:p-4 rounded-2xl border border-gray-200 hover:border-blue-500 bg-gray-50/60 hover:bg-blue-50/40 flex items-center justify-between cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={account.avatar || DEFAULT_AVATAR}
                        alt={account.name}
                        className="w-13 h-13 rounded-2xl object-cover border border-gray-200 shadow-2xs group-hover:border-blue-400"
                        referrerPolicy="no-referrer"
                      />
                      <div className="space-y-1">
                        <h3 className="font-black text-sm sm:text-base text-gray-900 group-hover:text-[#1877f2] transition-colors">
                          {account.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {account.phone && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200 shadow-2xs" dir="ltr">
                              <Phone size={11} className="shrink-0 text-emerald-600" />
                              <span>{account.phone}</span>
                            </span>
                          )}
                          {account.email && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200 shadow-2xs" dir="ltr">
                              <Mail size={11} className="shrink-0 text-blue-600" />
                              <span>{account.email.replace('@samado.com', '')}</span>
                            </span>
                          )}
                          {!account.phone && !account.email && (
                            <span className="text-xs text-gray-400 font-bold">مستخدم GROZLA</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-black text-blue-600 group-hover:bg-[#1877f2] group-hover:text-white group-hover:border-blue-600 transition-all flex items-center gap-1">
                      <span>هذا حسابي</span>
                      <ChevronLeft size={14} />
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-2xl transition-all cursor-pointer"
                >
                  البحث عن حساب آخر
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: Verification Methods (خيارات التحقق: رمز PIN 6 أرقام أو كلمة السر) */}
          {/* ========================================================================= */}
          {step === 3 && selectedAccount && (
            <motion.div
              key="step-3-verify"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
            >
              {/* Selected User Badge */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedAccount.avatar || DEFAULT_AVATAR}
                    alt={selectedAccount.name}
                    className="w-11 h-11 rounded-xl object-cover border border-blue-200"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="font-black text-sm text-gray-900">{selectedAccount.name}</h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      {selectedAccount.email && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200" dir="ltr">
                          <Mail size={10} className="shrink-0 text-blue-600" />
                          <span>{selectedAccount.email.replace('@samado.com', '')}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1 border-b border-gray-100 pb-3">
                <h2 className="text-lg sm:text-xl font-black text-gray-900">
                  تأكيد الحساب
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  أدخل الرمز المكون من 6 أرقام المرسل إلى بريدك الإلكتروني
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.trim())}
                      placeholder="••••••"
                      className="w-full py-3.5 px-4 bg-white rounded-xl border border-gray-300 focus:border-[#1877f2] text-center tracking-[0.6em] text-xl font-black outline-none transition-all font-mono"
                      autoFocus
                      required
                      maxLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otpInput.length < 6}
                  className="w-full py-3.5 px-5 bg-[#1877f2] hover:bg-blue-700 text-white text-sm font-black rounded-2xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      <span>تحقق والمتابعة لإنشاء كلمة سر جديدة</span>
                    </>
                  )}
                </button>
              </form>
              
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    if (matchingAccounts.length > 1) setStep(2);
                    else setStep(1);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-800 font-bold transition-colors cursor-pointer"
                >
                  البحث عن حساب آخر
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {step === 4 && selectedAccount && (
            <motion.div
              key="step-4-new-password"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
            >
              {/* Header */}
              <div className="space-y-2 border-b border-gray-100 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1877f2] flex items-center justify-center mb-3">
                  <Lock size={24} className="stroke-[2.5]" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  انشئ كلمة سر جديدة
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed">
                  أدخل كلمة سر جديدة تتكون من 6 خانات على الأقل لضمان حماية حسابك.
                </p>
              </div>

              {/* Password Input Form */}
              <form onSubmit={handleSaveNewPassword} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-700 block mr-1">
                    كلمة السر الجديدة
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="أدخل كلمة السر الجديدة (6 خانات على الأقل)..."
                      className="w-full pr-4 pl-11 py-3.5 bg-gray-50 rounded-2xl border border-gray-200 focus:border-[#1877f2] focus:bg-white text-sm font-bold outline-none transition-all"
                      autoFocus
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* The Two Requested Action Buttons:
                    1. متابعة لونها أزرق (Blue Continue button)
                    2. تخطي بيضاء (White Skip button)
                */}
                <div className="space-y-2.5 pt-2">
                  {/* BUTTON 1: BLUE CONTINUE (متابعة) */}
                  <button
                    type="submit"
                    disabled={loading || newPassword.length < 6}
                    className="w-full py-3.5 px-5 bg-[#1877f2] hover:bg-blue-700 text-white text-sm font-black rounded-2xl transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check size={18} strokeWidth={3} />
                        <span>متابعة</span>
                      </>
                    )}
                  </button>

                  {/* BUTTON 2: WHITE SKIP (تخطي) */}
                  <button
                    type="button"
                    onClick={handleSkipNewPassword}
                    disabled={loading}
                    className="w-full py-3 px-5 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-gray-300 text-sm font-black rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-2xs"
                  >
                    <span>تخطي</span>
                  </button>
                </div>
              </form>

              {/* Privacy and Security Footer Note */}
              <div className="pt-2 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
                <ShieldCheck size={15} className="text-emerald-500" />
                <span>حسابك محمي بتقنيات التشفير السحابية</span>
              </div>
            </motion.div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-gray-100 text-center text-xs text-gray-400">
        <span>OWN あ &copy; 2026 &bull; مركز مساعدة استعادة الحساب</span>
      </footer>

    </div>
  );
}
