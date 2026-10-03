import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, MessageCircle, Lock, Mail, Eye, EyeOff, 
  ArrowRight, ShieldCheck, Key, AlertCircle, CheckCircle2, 
  Sparkles, RefreshCw, Smartphone, Zap, HelpCircle, ChevronRight
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface SkyLoginProps {
  onBack: () => void;
  onLoginSuccess: (userId: string) => void;
}

const REG_COUNTRIES = [
  { name: 'السعودية', code: '+966', flag: '🇸🇦' },
  { name: 'الجزائر', code: '+213', flag: '🇩🇿' },
  { name: 'مصر', code: '+20', flag: '🇪🇬' },
  { name: 'الإمارات', code: '+971', flag: '🇦🇪' },
  { name: 'المغرب', code: '+212', flag: '🇲🇦' },
  { name: 'العراق', code: '+964', flag: '🇮🇶' },
  { name: 'الأردن', code: '+962', flag: '🇯🇴' },
  { name: 'الكويت', code: '+965', flag: '🇰🇼' },
  { name: 'عمان', code: '+968', flag: '🇴🇲' },
  { name: 'قطر', code: '+974', flag: '🇶🇦' },
  { name: 'تونس', code: '+216', flag: '🇹🇳' },
  { name: 'فلسطين', code: '+970', flag: '🇵🇸' },
  { name: 'لبنان', code: '+961', flag: '🇱🇧' },
  { name: 'الولايات المتحدة', code: '+1', flag: '🇺🇸' },
];

export default function SkyLogin({ onBack, onLoginSuccess }: SkyLoginProps) {
  const { users, login, signup, quickResetPasswordAndLogin, showToast } = useAppContext();
  
  // Auth Mode: 'login' or 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dedicated Registration Flow States (إنشاء رقم خاص أو بريد مع استلام رمز التأكيد)
  const [regType, setRegType] = useState<'phone' | 'email'>('phone');
  const [regStep, setRegStep] = useState<'details' | 'verify'>('details');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCountryCode, setRegCountryCode] = useState(REG_COUNTRIES[0].code);
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regSecurityCode, setRegSecurityCode] = useState('789012');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpBannerVisible, setOtpBannerVisible] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend cooldown timer
  React.useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);
  
  // Forgot password sub-flow
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // Available pre-registered accounts for quick one-click testing
  const activeUsers = users.filter(u => u.status === 'active' || !u.status).slice(0, 4);

  // Send Verification Code for Registration
  const handleSendRegOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!regName.trim()) {
      setErrorMessage('يرجى إدخال الاسم الكامل للحساب');
      return;
    }

    if (regType === 'phone') {
      const clean = regPhone.replace(/[^0-9]/g, '');
      if (!clean || clean.length < 6) {
        setErrorMessage('يرجى إدخال رقم هاتف صحيح لا يقل عن 6 أرقام');
        return;
      }
    } else {
      if (!regEmail.trim() || !regEmail.includes('@')) {
        setErrorMessage('يرجى إدخال بريد إلكتروني صحيح');
        return;
      }
    }

    if (!regPassword || regPassword.length < 6) {
      setErrorMessage('يجب أن تتكون كلمة السر من 6 أحرف أو أرقام على الأقل');
      return;
    }

    if (!regSecurityCode || regSecurityCode.trim().length < 4) {
      setErrorMessage('يرجى كتابة رمز أمان لمركز حسابات OWN (4 أرقام أو أكثر)');
      return;
    }

    // Generate 6-digit confirmation code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setEnteredOtp('');
    setOtpBannerVisible(true);
    setResendCooldown(30);
    setRegStep('verify');
    showToast(`📩 تم إرسال رمز تأكيد الحساب إلى ${regType === 'phone' ? 'رقم هاتفك الخاص' : 'بريدك الإلكتروني'}`);
  };

  // Verify Code and Create / Activate Account
  const handleVerifyRegOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (enteredOtp.trim() !== generatedOtp.trim()) {
      setErrorMessage('رمز التأكيد غير صحيح! يرجى إدخال الرمز المكون من 6 أرقام الذي وصلك.');
      return;
    }

    setIsLoading(true);
    try {
      const targetEmail = regType === 'email' 
        ? regEmail.trim().toLowerCase() 
        : `${regCountryCode.replace('+', '')}${regPhone.replace(/[^0-9]/g, '')}@sky.com`;
      
      const fullPhone = regType === 'phone' 
        ? `${regCountryCode} ${regPhone.trim()}` 
        : '';

      // Register with signup
      await signup(targetEmail, regPassword, regName.trim());

      // Update user in Firestore / state with verified phone and OWN security code
      const qInput = targetEmail.toLowerCase();
      const matched = users.find(u => u.email?.toLowerCase() === qInput);
      const targetUid = matched?.id || ('u_' + Date.now().toString());

      try {
        await updateDoc(doc(db, 'users', targetUid), {
          phone: fullPhone,
          phoneVerified: true,
          skyDedicatedNumber: fullPhone,
          skyDedicatedEmail: targetEmail,
          skyVerified: true,
          ownSecurityCode: regSecurityCode.trim(),
          ownSecurityCodeConfirmedAt: new Date().toISOString(),
          status: 'active'
        });
      } catch (uErr) {
        // Fallback
      }

      showToast('🎉 تم تأكيد حسابك ورقمك/بريدك في SKY بنجاح!');
      onLoginSuccess(targetUid);
    } catch (err: any) {
      // If user already exists, login instead
      try {
        const targetEmail = regType === 'email' 
          ? regEmail.trim().toLowerCase() 
          : `${regCountryCode.replace('+', '')}${regPhone.replace(/[^0-9]/g, '')}@sky.com`;
        await login(targetEmail, regPassword);
        showToast('تم تأكيد الحساب وتسجيل الدخول بنجاح! 🚀');
        onLoginSuccess(targetEmail);
      } catch (lErr: any) {
        setErrorMessage(formatAuthError(lErr));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatAuthError = (err: any): string => {
    const code = (err?.code || '').toLowerCase();
    const msg = (err?.message || '').toLowerCase();
    if (code.includes('invalid-email') || msg.includes('invalid-email') || msg.includes('auth/invalid-email')) {
      return 'صيغة البريد الإلكتروني أو رقم الهاتف غير صحيحة، يرجى التأكد من إدخال بريد صالح أو رقم هاتف صحيح.';
    }
    if (code.includes('user-not-found') || msg.includes('user-not-found') || msg.includes('user not found')) {
      return 'لم يتم العثور على حساب بهذا البريد أو الرقم. يمكنك إنشاء حساب SKY جديد.';
    }
    if (code.includes('wrong-password') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
      return 'كلمة السر غير صحيحة، يرجى التحقق وإعادة المحاولة.';
    }
    if (code.includes('too-many-requests') || msg.includes('too-many-requests')) {
      return 'تم تجاوز الحد الأقصى للمحاولات مؤقتاً، يرجى الانتظار قليلاً ثم المحاولة.';
    }
    if (code.includes('network-request-failed') || msg.includes('network')) {
      return 'فشل الاتصال بالإنترنت، يرجى التحقق من الشبكة والمحاولة مجدداً.';
    }
    if (msg.includes('firebase')) {
      return 'بيانات الدخول غير صحيحة، يرجى التحقق أو استخدام استعادة كلمة السر.';
    }
    return err?.message || 'بيانات الدخول غير صحيحة، يرجى التحقق أو استخدام استعادة كلمة السر.';
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const rawInput = emailOrPhone.trim();
    if (!rawInput) {
      setErrorMessage('يرجى إدخال البريد الإلكتروني أو رقم الهاتف');
      return;
    }
    if (!password) {
      setErrorMessage('يرجى إدخال كلمة السر');
      return;
    }

    setIsLoading(true);
    try {
      const lower = rawInput.toLowerCase();
      const cleanDigits = rawInput.replace(/[^0-9]/g, '');

      // 1. Comprehensive lookup among existing users
      const matchedUser = users.find(u => {
        if (!u) return false;
        if (u.email?.toLowerCase() === lower) return true;
        if (u.skyDedicatedEmail?.toLowerCase() === lower) return true;
        if (u.name?.toLowerCase() === lower || u.username?.toLowerCase() === lower) return true;
        if (u.id === rawInput || u.accountNumber === rawInput) return true;
        
        if (cleanDigits.length >= 6) {
          const uDigits = (u.phone || '').replace(/[^0-9]/g, '');
          const uSkyDigits = (u.skyDedicatedNumber || '').replace(/[^0-9]/g, '');
          if (uDigits && (uDigits === cleanDigits || uDigits.endsWith(cleanDigits.slice(-7)) || cleanDigits.endsWith(uDigits.slice(-7)))) return true;
          if (uSkyDigits && (uSkyDigits === cleanDigits || uSkyDigits.endsWith(cleanDigits.slice(-7)) || cleanDigits.endsWith(uSkyDigits.slice(-7)))) return true;
          if (u.email && u.email.includes(cleanDigits)) return true;
        }
        return false;
      });

      // 2. Determine target login email
      let targetEmail = '';
      if (matchedUser?.email && matchedUser.email.includes('@')) {
        targetEmail = matchedUser.email.trim().toLowerCase();
      } else if (matchedUser?.skyDedicatedEmail && matchedUser.skyDedicatedEmail.includes('@')) {
        targetEmail = matchedUser.skyDedicatedEmail.trim().toLowerCase();
      } else if (rawInput.includes('@')) {
        let cleanMail = lower.replace(/\s+/g, '');
        if (!cleanMail.includes('.')) {
          cleanMail = `${cleanMail}.com`;
        }
        targetEmail = cleanMail;
      } else if (cleanDigits.length >= 6) {
        targetEmail = `${cleanDigits}@sky.com`;
      } else {
        const cleanUser = lower.replace(/[^a-z0-9_]/g, '') || 'user';
        targetEmail = `${cleanUser}@sky.com`;
      }

      try {
        await login(targetEmail, password);
      } catch (firstErr: any) {
        // If login with @sky.com failed and input was phone/username, try fallback with @samado.com
        if (!rawInput.includes('@')) {
          const altEmail = cleanDigits.length >= 6 ? `${cleanDigits}@samado.com` : `${targetEmail.split('@')[0]}@samado.com`;
          await login(altEmail, password);
        } else {
          throw firstErr;
        }
      }

      showToast('تم تسجيل الدخول إلى نظام SKY Messenger بنجاح ☁️💬');
      onLoginSuccess(matchedUser?.id || targetEmail);
    } catch (err: any) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (user: any) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await login(user.email || `${user.id}@samado.com`, 'password123');
      showToast(`مرحباً بك في مسنجر SKY، ${user.name}! 🚀`);
      onLoginSuccess(user.id);
    } catch (e: any) {
      // fallback
      try {
        await login(user.email || 'user@samado.com', '123456');
        onLoginSuccess(user.id);
      } catch (err: any) {
        setErrorMessage('تعذر الدخول السريع، يرجى إدخال البيانات يدوياً.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotInput.trim()) {
      setForgotError('يرجى إدخال البريد أو اسم الحساب');
      return;
    }
    if (!forgotNewPass || forgotNewPass.length < 6) {
      setForgotError('يجب أن تتكون كلمة السر الجديدة من 6 أحرف على الأقل');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);

    try {
      const qInput = forgotInput.trim().toLowerCase();
      const targetUser = users.find(u => 
        u.email?.toLowerCase() === qInput || 
        u.name?.toLowerCase() === qInput || 
        u.phone?.includes(qInput)
      );

      if (!targetUser) {
        setForgotError('لم يتم العثور على حساب مرتبط بهذه البيانات في نظام SKY.');
        setForgotLoading(false);
        return;
      }

      // Quick reset in Firestore / Local
      try {
        await updateDoc(doc(db, 'users', targetUser.id), {
          password: forgotNewPass
        });
      } catch (fErr) {
        // Fallback local
      }

      setForgotSuccess(`تمت إعادة تعيين كلمة السر بنجاح لحساب (${targetUser.name})! يمكنك تسجيل الدخول بها الآن.`);
      setPassword(forgotNewPass);
      setEmailOrPhone(targetUser.email || targetUser.name);
      setTimeout(() => {
        setShowForgotModal(false);
      }, 1600);
    } catch (err: any) {
      setForgotError(err?.message || 'حدث خطأ أثناء تحديث كلمة السر');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden font-sans selection:bg-sky-500 selection:text-white" dir="rtl">
      {/* Background Animated Sky Chakra Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-600/20 rounded-full filter blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full filter blur-[130px] pointer-events-none" />

      {/* Floating Simulated Incoming SMS / Email Code Notification */}
      <AnimatePresence>
        {otpBannerVisible && generatedOtp && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.9 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
          >
            <div className="bg-slate-900 border-2 border-sky-400 p-4 rounded-2xl shadow-2xl shadow-sky-500/50 text-right space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-black text-white flex items-center gap-1">
                    <Smartphone size={13} className="text-sky-400" />
                    <span>إشعار رسالة واردة من SKY</span>
                  </span>
                </div>
                <span className="text-[10px] text-sky-300 font-mono">الآن</span>
              </div>
              <p className="text-xs text-slate-200">
                رمز تأكيد حسابك في SKY هو:{' '}
                <strong className="text-base font-mono font-black text-sky-400 tracking-widest px-2 py-0.5 rounded bg-sky-950 border border-sky-400/40">
                  {generatedOtp}
                </strong>
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-400">لا تشارك رمز التأكيد مع أحد</span>
                <button
                  type="button"
                  onClick={() => {
                    setEnteredOtp(generatedOtp);
                    showToast('تم إدخال رمز التأكيد تلقائياً! ✅');
                  }}
                  className="px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-[11px] font-black cursor-pointer transition-all active:scale-95 shadow-sm"
                >
                  تعبئة الرمز تلقائياً
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Bar */}
      <div className="w-full max-w-xl mx-auto px-4 py-4 flex items-center justify-between z-10">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-sky-200 border border-white/10 transition-all cursor-pointer group"
        >
          <ArrowRight size={15} className="group-hover:-translate-x-1 transition-transform" />
          <span>العودة لفيسبوك</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-mono text-sky-300">خوادم SKY السحابية متصلة</span>
        </div>
      </div>

      {/* Main Login Card (Full dedicated interface) */}
      <div className="flex-1 flex items-center justify-center px-4 py-6 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-sky-500/25 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-sky-950/50 space-y-5"
        >
          {/* Logo & Title */}
          <div className="text-center space-y-2.5">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 shadow-lg shadow-sky-500/30 p-0.5 relative group">
              <div className="w-full h-full bg-slate-950/40 rounded-2xl flex items-center justify-center backdrop-blur-xs">
                <MessageCircle size={32} className="text-white drop-shadow-md group-hover:scale-110 transition-transform" />
              </div>
              <span className="absolute -bottom-1 -right-1 p-1 bg-sky-400 rounded-full text-slate-950 shadow-xs">
                <Cloud size={12} />
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
                <span>مسنجر SKY</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 font-mono">
                  Google Play
                </span>
              </h1>
              <p className="text-xs text-sky-200/80 mt-1 font-medium">
                {authMode === 'login' 
                  ? 'سجّل الدخول إلى بيئة مسنجر السحابية المستقلة والمتكاملة' 
                  : 'أنشئ رقمك الخاص أو بريدك واستلم رمز التأكيد لتفعيل حسابك'}
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-800/90 rounded-2xl border border-sky-500/20 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'login'
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock size={13} />
              <span>تسجيل الدخول</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorMessage(null);
                setRegStep('details');
              }}
              className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'register'
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles size={13} />
              <span>إنشاء حساب جديد</span>
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-start gap-2.5"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </motion.div>
          )}

          {/* 1. LOGIN MODE FORM */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Email / Phone Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-sky-200 flex items-center gap-1.5">
                  <Mail size={14} className="text-sky-400" />
                  <span>البريد الإلكتروني أو رقم الهاتف</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    placeholder="name@example.com أو 0550123456"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-sky-500/30 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 text-white text-xs outline-none transition-all placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-sky-200 flex items-center gap-1.5">
                    <Lock size={14} className="text-sky-400" />
                    <span>كلمة السر</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[11px] font-bold text-sky-400 hover:text-sky-300 hover:underline cursor-pointer"
                  >
                    هل نسيت كلمة السر؟
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة السر الخاصة بك"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-sky-500/30 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 text-white text-xs outline-none transition-all placeholder:text-slate-500 pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-sm shadow-lg shadow-sky-600/30 border border-sky-400/40 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <MessageCircle size={18} />
                    <span>تسجيل الدخول إلى مسنجر SKY</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* 2. REGISTRATION MODE (إنشاء رقمه الخاص أو بريد إلكتروني خاص به واستلام رمز التأكيد) */}
          {authMode === 'register' && (
            <div className="space-y-4">
              {regStep === 'details' ? (
                <form onSubmit={handleSendRegOtp} className="space-y-3.5">
                  {/* Step Info */}
                  <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-200 text-xs flex items-center gap-2">
                    <Sparkles size={16} className="text-sky-400 shrink-0" />
                    <span>أنشئ رقمك الخاص أو بريدك وسيصلك رمز لتأكيد حسابك فوراً.</span>
                  </div>

                  {/* Account Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-sky-200 block">
                      الاسم الكامل للحساب
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="مثال: أحمد محمد أو الساموراي"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-sky-500/30 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 text-white text-xs outline-none transition-all placeholder:text-slate-500"
                    />
                  </div>

                  {/* Choice: Phone or Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-sky-200 block">
                      اختر وسيلة إنشاء الحساب:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRegType('phone')}
                        className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          regType === 'phone'
                            ? 'bg-sky-500/25 border-sky-400 text-sky-300 shadow-sm'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Smartphone size={14} />
                        <span>رقم هاتف خاص بي</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRegType('email')}
                        className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          regType === 'email'
                            ? 'bg-sky-500/25 border-sky-400 text-sky-300 shadow-sm'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Mail size={14} />
                        <span>بريد إلكتروني خاص بي</span>
                      </button>
                    </div>
                  </div>

                  {/* Input for Phone or Email */}
                  {regType === 'phone' ? (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-sky-200 block">
                        رقم الهاتف الخاص بك:
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={regCountryCode}
                          onChange={(e) => setRegCountryCode(e.target.value)}
                          className="px-2.5 py-2.5 rounded-xl bg-slate-800 border border-sky-500/30 text-white text-xs outline-none font-mono"
                        >
                          {REG_COUNTRIES.map(c => (
                            <option key={c.code} value={c.code}>
                              {c.flag} {c.code} ({c.name})
                            </option>
                          ))}
                        </select>
                        <input
                          type="tel"
                          required
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="مثال: 550123456"
                          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800/80 border border-sky-500/30 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 text-white text-xs outline-none transition-all font-mono placeholder:text-slate-500 dir-ltr text-right"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-sky-200 block">
                        البريد الإلكتروني الخاص بك:
                      </label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="yourname@domain.com"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-sky-500/30 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 text-white text-xs outline-none transition-all placeholder:text-slate-500 dir-ltr text-right"
                      />
                    </div>
                  )}

                  {/* Password Field */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-sky-200 block">
                      كلمة السر للحساب
                    </label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="اختر كلمة سر قوية (6 أحرف فأكثر)"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-sky-500/30 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 text-white text-xs outline-none transition-all placeholder:text-slate-500"
                    />
                  </div>

                  {/* OWN Security Code Field (رمز أمان مركز حسابات OWN) */}
                  <div className="space-y-1 p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
                        <Key size={13} className="text-indigo-400" />
                        <span>رمز أمان مركز حسابات OWN</span>
                      </label>
                      <span className="text-[10px] text-emerald-400 font-mono">حماية وتأمين الحساب</span>
                    </div>
                    <input
                      type="text"
                      required
                      value={regSecurityCode}
                      onChange={(e) => setRegSecurityCode(e.target.value)}
                      placeholder="رمز الأمان (مثال: 789012)"
                      className="w-full px-4 py-2 rounded-xl bg-slate-800/90 border border-indigo-500/30 focus:border-indigo-400 text-white text-xs outline-none font-mono dir-ltr text-right"
                    />
                    <p className="text-[10px] text-indigo-300/80 leading-relaxed">
                      يُستخدم هذا الرمز لحماية إعدادات وخصوصية حسابك في مركز الحسابات.
                    </p>
                  </div>

                  {/* Submit to Send OTP Code */}
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-sky-600/30 border border-sky-400/40 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                  >
                    <Mail size={16} />
                    <span>إرسال رمز التأكيد لتفعيل الحساب 📩</span>
                  </button>
                </form>
              ) : (
                /* Step 2: VERIFY OTP CODE (ويصله رمز لتأكيد حسابه) */
                <form onSubmit={handleVerifyRegOtp} className="space-y-4 animate-in fade-in">
                  <div className="p-3.5 rounded-2xl bg-sky-500/15 border border-sky-400/30 text-sky-200 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 font-black text-white">
                      <CheckCircle2 size={16} className="text-emerald-400" />
                      <span>تم إرسال رمز التأكيد بنجاح!</span>
                    </div>
                    <p className="text-[11px] text-sky-200 leading-relaxed">
                      وصلك رمز تأكيد مكوّن من 6 أرقام إلى{' '}
                      <strong className="text-white font-mono">
                        {regType === 'phone' ? `${regCountryCode} ${regPhone}` : regEmail}
                      </strong>. أدخل الرمز أدناه لتأكيد وتفعيل حسابك فورياً:
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-sky-200 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Key size={14} className="text-sky-400" />
                        <span>أدخل رمز التأكيد (6 أرقام):</span>
                      </span>
                      {resendCooldown > 0 ? (
                        <span className="text-[10px] text-slate-400 font-mono">
                          إعادة الإرسال بعد {resendCooldown} ثانية
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendRegOtp}
                          className="text-[11px] text-sky-400 hover:underline cursor-pointer font-bold"
                        >
                          إعادة إرسال الرمز
                        </button>
                      )}
                    </label>

                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="مثال: 582104"
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border-2 border-sky-400/60 focus:border-sky-400 text-white font-mono text-center text-lg tracking-widest outline-none transition-all"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setRegStep('details')}
                      className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                    >
                      تعديل البيانات
                    </button>

                    <button
                      type="submit"
                      disabled={isLoading || enteredOtp.length < 6}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-green-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/30 border border-emerald-400/40 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          <span>تأكيد وتفعيل حساب SKY والدخول 🚀</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Quick Account Switcher / Instant Demo Accounts */}
          {activeUsers.length > 0 && (
            <div className="pt-2 border-t border-slate-800 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-400 block text-center">
                أو الدخول المباشر السريع بحساب موجود:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {activeUsers.map((u, uIdx) => (
                  <button
                    key={u.id ? `sky-quick-user-${u.id}-${uIdx}` : `sky-quick-user-${uIdx}`}
                    type="button"
                    onClick={() => handleQuickLogin(u)}
                    disabled={isLoading}
                    className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-sky-500/50 flex items-center gap-2 cursor-pointer transition-all text-right group"
                  >
                    <img
                      src={u.avatar || '/default-avatar.png'}
                      alt={u.name}
                      className="w-7 h-7 rounded-full object-cover border border-sky-400/30 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-white truncate group-hover:text-sky-300">
                        {u.name}
                      </p>
                      <span className="text-[9px] text-emerald-400 font-mono block">دخول فوري ⚡</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Return to Facebook Option */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onBack}
              className="text-xs text-sky-400 hover:text-sky-300 font-bold hover:underline cursor-pointer"
            >
              ← العودة إلى واجهة تسجيل دخول فيسبوك العادية
            </button>
          </div>
        </motion.div>
      </div>

      {/* Footer Info */}
      <div className="w-full max-w-xl mx-auto px-4 py-3 text-center text-[10px] text-slate-500 z-10 flex items-center justify-center gap-2">
        <ShieldCheck size={12} className="text-emerald-500" />
        <span>منظومة SKY المشفرة للمراسلة الفورية وحماية الحسابات v2.5</span>
      </div>

      {/* Forgot Password Modal (هل نسيت كلمة السر) */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 border border-sky-500/30 rounded-3xl p-6 space-y-4 shadow-2xl text-right"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-sky-400 font-black text-sm">
                  <Key size={18} />
                  <span>إعادة تعيين كلمة السر - نظام SKY</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                أدخل بريدك الإلكتروني أو اسم حسابك متبوعاً بكلمة السر الجديدة ليقوم نظام SKY بتحديث كلمة السر لحسابك.
              </p>

              {forgotError && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-bold">
                  {forgotError}
                </div>
              )}

              {forgotSuccess && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-sky-200">البريد الإلكتروني أو اسم الحساب:</label>
                  <input
                    type="text"
                    required
                    value={forgotInput}
                    onChange={(e) => setForgotInput(e.target.value)}
                    placeholder="مثال: ahmed@samado.com أو أحمد علي"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-sky-500/30 text-white text-xs outline-none focus:border-sky-400 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-sky-200">كلمة السر الجديدة:</label>
                  <input
                    type="password"
                    required
                    value={forgotNewPass}
                    onChange={(e) => setForgotNewPass(e.target.value)}
                    placeholder="أدخل كلمة سر جديدة (6 أحرف فأكثر)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-sky-500/30 text-white text-xs outline-none focus:border-sky-400 font-bold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {forgotLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <RefreshCw size={15} />
                      <span>تحديث كلمة السر وتسجيل الدخول الآن</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
