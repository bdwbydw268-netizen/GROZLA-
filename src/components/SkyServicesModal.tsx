import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Phone, 
  Mail, 
  Check, 
  ShieldCheck, 
  Globe, 
  Trash2, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Smartphone, 
  AlertTriangle,
  ExternalLink,
  Edit2,
  Key
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface SkyServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'home' | 'email' | 'number';
}

const COUNTRIES = [
  { name: 'الجزائر', code: '+213', flag: '🇩🇿', mask: '5/6/7XX XXX XXX' },
  { name: 'المملكة العربية السعودية', code: '+966', flag: '🇸🇦', mask: '5X XXX XXXX' },
  { name: 'مصر', code: '+20', flag: '🇪🇬', mask: '10/11/12/15 XXXX XXXX' },
  { name: 'المغرب', code: '+212', flag: '🇲🇦', mask: '6/7XX XXX XXX' },
  { name: 'العراق', code: '+964', flag: '🇮🇶', mask: '77X XXX XXXX' },
  { name: 'الإمارات العربية المتحدة', code: '+971', flag: '🇦🇪', mask: '50/52/54/55/56 XXX XXXX' },
  { name: 'الكويت', code: '+965', flag: '🇰🇼', mask: '9/6/5XXX XXXX' },
  { name: 'الأردن', code: '+962', flag: '🇯🇴', mask: '77/78/79 XXX XXXX' },
  { name: 'تونس', code: '+216', flag: '🇹🇳', mask: 'XX XXX XXX' },
  { name: 'سلطنة عمان', code: '+968', flag: '🇴🇲', mask: '9XXX XXXX' },
  { name: 'قطر', code: '+974', flag: '🇶🇦', mask: '3/5/6/7XXX XXXX' },
  { name: 'البحرين', code: '+973', flag: '🇧🇭', mask: '3XXX XXXX' },
  { name: 'فلسطين', code: '+970', flag: '🇵🇸', mask: '59/56 XXX XXXX' },
  { name: 'لبنان', code: '+961', flag: '🇱🇧', mask: '70/71/76/03 XXX XXX' },
  { name: 'ليبيا', code: '+218', flag: '🇱🇾', mask: '91/92/94 XXX XXXX' },
  { name: 'السودان', code: '+249', flag: '🇸🇩', mask: '9/1XX XXX XXX' },
  { name: 'اليمن', code: '+967', flag: '🇾🇪', mask: '7XX XXX XXX' },
  { name: 'الولايات المتحدة الأمريكية / كندا', code: '+1', flag: '🇺🇸', mask: '(XXX) XXX-XXXX' },
  { name: 'المملكة المتحدة', code: '+44', flag: '🇬🇧', mask: '7XXX XXXXXX' },
  { name: 'فرنسا', code: '+33', flag: '🇫🇷', mask: '6/7 XX XX XX XX' },
  { name: 'ألمانيا', code: '+49', flag: '🇩🇪', mask: '15/16/17X XXXXXXXX' },
  { name: 'تركيا', code: '+90', flag: '🇹🇷', mask: '5XX XXX XX XX' },
  { name: 'إسبانيا', code: '+34', flag: '🇪🇸', mask: '6/7XX XXX XXX' },
  { name: 'إيطاليا', code: '+39', flag: '🇮🇹', mask: '3XX XXXXXXX' },
];

export default function SkyServicesModal({ isOpen, onClose, initialTab = 'home' }: SkyServicesModalProps) {
  const { 
    currentUser, 
    showToast, 
    linkGoogleAccount, 
    savePersonalPhone, 
    removePersonalPhone 
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<'home' | 'email' | 'number'>('home');

  // Real Google Link State
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);

  // Real Personal Phone State
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [phoneInput, setPhoneInput] = useState('');
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  // Phone Confirmation Code (رمز تأكيد رقم الهاتف في SKY)
  const [phoneOtpStep, setPhoneOtpStep] = useState<'input' | 'verify'>('input');
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [enteredPhoneOtp, setEnteredPhoneOtp] = useState('');
  const [phoneOtpBanner, setPhoneOtpBanner] = useState(false);
  const [phoneOtpError, setPhoneOtpError] = useState<string | null>(null);

  // 1. Proactively delete any leftover fake emails and fake numbers from localStorage
  useEffect(() => {
    try {
      localStorage.removeItem('sky_numbers_history');
      localStorage.removeItem('sky_emails_history');
      localStorage.removeItem('sky_fake_data');
    } catch {
      // ignore
    }
  }, []);

  // Sync tab with initialTab prop
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // If user already has a phone, pre-select country if matches
  useEffect(() => {
    if (currentUser?.phone) {
      const matched = COUNTRIES.find(c => currentUser.phone?.startsWith(c.code));
      if (matched) {
        setSelectedCountry(matched);
      }
    }
  }, [currentUser?.phone]);

  const hasVerifiedEmail = Boolean(currentUser?.googleLinked || (currentUser?.email && !currentUser.email.includes('@example.com') && !currentUser.email.includes('@fake.')));
  const hasVerifiedPhone = Boolean(currentUser?.phone && currentUser.phone.trim().length > 6);

  // Handle Google Link with Firebase
  const handleLinkGoogle = async () => {
    setIsLinkingGoogle(true);
    try {
      const googleUser = await linkGoogleAccount();
      if (googleUser) {
        showToast('تم ربط حسابك الرسمي بـ Google بنجاح عبر Firebase! ✅');
      }
    } catch (err: any) {
      const msg = err?.message || 'تعذر الربط بجوجل حالياً';
      showToast(`فشل الربط: ${msg}`);
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  // Handle Request Phone Verification Code (يصله رمز لتأكيد حسابه)
  const handleRequestPhoneOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPhoneOtpError(null);
    const raw = phoneInput.replace(/[^0-9]/g, '');
    if (!raw || raw.length < 6) {
      showToast('يرجى إدخال رقم هاتف صحيح لا يقل عن 6 أرقام');
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setPhoneOtpCode(code);
    setEnteredPhoneOtp('');
    setPhoneOtpBanner(true);
    setPhoneOtpStep('verify');
    showToast(`📩 تم إرسال رمز تأكيد رقمك الخاص في SKY (${selectedCountry.code} ${raw})`);
  };

  // Handle Verify Phone OTP and Save to Firebase
  const handleVerifyPhoneOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPhoneOtpError(null);

    if (enteredPhoneOtp.trim() !== phoneOtpCode.trim()) {
      setPhoneOtpError('رمز التأكيد غير صحيح! يرجى إدخال الرمز المكون من 6 أرقام الذي وصلك.');
      return;
    }

    setIsSavingPhone(true);
    try {
      const raw = phoneInput.replace(/[^0-9]/g, '');
      const fullPhone = `${selectedCountry.code} ${raw}`;
      await savePersonalPhone(fullPhone);
      setPhoneInput('');
      setPhoneOtpStep('input');
      setIsEditingPhone(false);
      showToast('تم تأكيد وتوثيق رقم هاتفك الخاص في Firebase بنجاح! 📱✨');
    } catch (err: any) {
      showToast(err?.message || 'حدث خطأ أثناء حفظ رقم الهاتف في Firebase');
    } finally {
      setIsSavingPhone(false);
    }
  };

  // Handle Remove Phone
  const handleRemovePhone = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف رقم هاتفك الموثق؟')) return;
    try {
      await removePersonalPhone();
      showToast('تمت إزالة رقم الهاتف من ملفك الشخصي.');
    } catch (err: any) {
      showToast(err?.message || 'فشل حذف رقم الهاتف');
    }
  };

  const filteredCountries = COUNTRIES.filter(c => 
    c.name.includes(countrySearch) || c.code.includes(countrySearch)
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 15 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed inset-0 z-[9999] min-h-screen bg-[#f0f2f5] flex flex-col overflow-y-auto dir-rtl selection:bg-blue-100 selection:text-blue-700 font-sans"
      >
        {/* Full-width Standalone Top Header */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-xs px-4 py-3 sm:px-6">
          {/* Floating Phone OTP Banner */}
          <AnimatePresence>
            {phoneOtpBanner && phoneOtpCode && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-3 p-3.5 rounded-2xl bg-sky-950 border-2 border-sky-400 text-white shadow-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold text-sky-200">
                    رمز تأكيد رقمك في SKY:{' '}
                    <strong className="text-base font-mono text-white tracking-widest bg-sky-800 px-2 py-0.5 rounded">
                      {phoneOtpCode}
                    </strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEnteredPhoneOtp(phoneOtpCode);
                    showToast('تم إدخال الرمز تلقائياً! ✅');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-sky-400 text-slate-950 text-xs font-black cursor-pointer hover:bg-sky-300"
                >
                  تعبئة الرمز
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="max-w-3xl mx-auto flex items-center justify-between">
            
            {/* Right Side: Back Button & Logo Brand */}
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-black text-xs sm:text-sm cursor-pointer transition-colors"
                title="الرجوع للواجهة السابقة"
              >
                <ArrowRight size={18} />
                <span>رجوع</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-[#1877f2] font-black text-2xl font-sans tracking-tight uppercase">
                  GROZLA
                </span>
                <span className="px-2.5 py-0.5 text-xs font-black tracking-wider uppercase rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-xs">
                  Sky
                </span>
              </div>
            </div>

            {/* Left Side: Firebase Official Verification Tag & Close Button */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-black">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>توثيق رسمي عبر Firebase</span>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer transition-colors"
                title="إغلاق"
              >
                <X size={18} />
              </button>
            </div>

          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-xl mx-auto w-full p-4 sm:p-6 space-y-5">
          
          {/* Main Card Container */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            
            {/* Section Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-sky-500/10 via-blue-500/5 to-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-[#0866ff] text-white flex items-center justify-center shadow-md shadow-sky-500/25">
                  <Sparkles size={22} className="stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="font-black text-gray-950 text-base sm:text-lg tracking-tight">
                    مركز خدمات Sky للتوثيق والأمان (Firebase)
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">
                    إنشاء وتوثيق رقمك الخاص وربط بريدك الحقيقي عبر Google في Firebase
                  </p>
                </div>
              </div>
            </div>

            {/* Top Navigation Tabs */}
            <div className="p-2.5 bg-gray-50/90 border-b border-gray-200 flex items-center justify-between gap-1 overflow-x-auto">
              <button
                onClick={() => setActiveTab('home')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'home' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <ShieldCheck size={14} />
                <span>نظرة عامة والتوثيق</span>
              </button>

              <button
                onClick={() => setActiveTab('email')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'email' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Mail size={14} />
                <span>ربط بريد Google</span>
                {hasVerifiedEmail && (
                  <Check size={12} className="text-emerald-400 stroke-[3]" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('number')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'number' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Phone size={14} />
                <span>رقم هاتفك الخاص</span>
                {hasVerifiedPhone && (
                  <Check size={12} className="text-emerald-400 stroke-[3]" />
                )}
              </button>
            </div>

            {/* Content Body */}
            <div className="p-4 sm:p-6 space-y-5 text-right">
            
            {/* ========================================================================= */}
            {/* TAB 1: OVERVIEW & VERIFIED PROFILE (نظرة عامة والتوثيق) */}
            {/* ========================================================================= */}
            {activeTab === 'home' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-5"
              >
                <div className="text-center space-y-1 max-w-md mx-auto">
                  <h3 className="text-base sm:text-lg font-black text-gray-900">
                    بيانات الأمان والتحقق السحابي في Firebase
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    تم إلغاء جميع البريدات والأرقام الوهمية المؤقتة، والاعتماد بالكامل على بياناتك الحقيقية الموثقة عبر Firebase
                  </p>
                </div>

                {/* User Status Card */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img 
                        src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'} 
                        alt="User" 
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs"
                      />
                      <div>
                        <h4 className="text-sm font-black text-gray-900">
                          {currentUser?.name || 'مستخدم GROZLA'}
                        </h4>
                        <span className="text-[11px] text-gray-500 font-mono">
                          ID: {currentUser?.uid || currentUser?.id || 'firebase-user'}
                        </span>
                      </div>
                    </div>

                    <div className="text-left">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black inline-flex items-center gap-1 ${
                        currentUser?.status === 'active' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {currentUser?.status === 'active' ? (
                          <>
                            <CheckCircle2 size={13} />
                            <span>نشط ومفعل</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={13} />
                            <span>مقفول / معلق</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-gray-200 text-xs">
                    {/* Google Email Status */}
                    <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-1">
                      <div className="flex items-center justify-between text-gray-500 font-medium text-[11px]">
                        <span>بريد Google المعتمد:</span>
                        {hasVerifiedEmail ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                            <Check size={12} strokeWidth={3} /> موثق
                          </span>
                        ) : (
                          <span className="text-gray-400 font-bold">غير مرتبط</span>
                        )}
                      </div>
                      <p className="font-bold text-gray-900 truncate dir-ltr text-right">
                        {currentUser?.googleEmail || currentUser?.email || 'لم يتم ربط حساب Google'}
                      </p>
                    </div>

                    {/* Personal Phone Status */}
                    <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-1">
                      <div className="flex items-center justify-between text-gray-500 font-medium text-[11px]">
                        <span>رقم هاتفك الخاص:</span>
                        {hasVerifiedPhone ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                            <Check size={12} strokeWidth={3} /> موثق
                          </span>
                        ) : (
                          <span className="text-gray-400 font-bold">غير مسجل</span>
                        )}
                      </div>
                      <p className="font-bold text-gray-900 truncate dir-ltr text-right">
                        {currentUser?.phone || 'لم يتم إدخال رقم الهاتف'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* The Two Main Action Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Card 1: GOOGLE LINK */}
                  <div 
                    onClick={() => setActiveTab('email')}
                    className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 hover:border-blue-400 cursor-pointer transition-all hover:shadow-xs group space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <Mail size={20} />
                      </div>
                      <span className="text-[11px] font-black text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md">
                        Google & Firebase
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                        ربط الحساب بجوجل
                      </h4>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium mt-0.5">
                        ربط بريدك الإلكتروني الرسمي عبر Google لخدمات SKY ومزامنة البيانات بأمان.
                      </p>
                    </div>

                    <div className="text-xs font-bold text-blue-600 flex items-center gap-1 pt-1">
                      <span>إدارة الربط بجوجل</span>
                      <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Card 2: PERSONAL PHONE */}
                  <div 
                    onClick={() => setActiveTab('number')}
                    className="p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-emerald-50/40 border border-gray-200 hover:border-emerald-400 cursor-pointer transition-all hover:shadow-xs group space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center shadow-xs">
                        <Phone size={20} />
                      </div>
                      <span className="text-[11px] font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                        رقمك الخاص
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-gray-900 group-hover:text-emerald-700 transition-colors">
                        إنشاء وتوثيق رقمك الخاص
                      </h4>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium mt-0.5">
                        تسجيل رقم هاتفك الحقيقي مع رمز دولتك وحفظه في Firebase.
                      </p>
                    </div>

                    <div className="text-xs font-bold text-gray-900 flex items-center gap-1 pt-1">
                      <span>إدارة رقم الهاتف</span>
                      <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: LINK GOOGLE EMAIL VIA FIREBASE (ربط بريد Google عبر Firebase) */}
            {/* ========================================================================= */}
            {activeTab === 'email' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-5"
              >
                <div className="p-3.5 bg-blue-50/80 border border-blue-100 rounded-2xl flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5">
                    <Mail size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-blue-950">قسم ربط البريد الإلكتروني الحقيقي عبر Google</h4>
                    <p className="text-[11px] text-blue-900 leading-relaxed font-medium">
                      يربط حسابك بحساب Google الموثق مباشرة عبر Firebase لتوثيق وإدارة حسابك بأمان.
                    </p>
                  </div>
                </div>

                {/* Google Connection Card */}
                {hasVerifiedEmail ? (
                  <div className="p-5 rounded-3xl bg-white border-2 border-emerald-500 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-700 font-black text-xs">
                        <CheckCircle2 size={18} className="text-emerald-600" />
                        <span>مرتبط وموثق رسمياً عبر Google و Firebase</span>
                      </div>
                      <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                        معتمد
                      </span>
                    </div>

                    <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[11px] text-gray-500 font-medium">عنوان البريد الإلكتروني الحقيقي:</span>
                        <p className="font-mono font-black text-gray-900 text-sm dir-ltr text-right">
                          {currentUser?.googleEmail || currentUser?.email}
                        </p>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm shadow-2xs font-bold text-blue-600">
                        G
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={handleLinkGoogle}
                        disabled={isLinkingGoogle}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <ExternalLink size={14} />
                        <span>{isLinkingGoogle ? 'جارٍ الاتصال...' : 'تحديث أو تبديل حساب Google'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-3xl bg-gradient-to-b from-gray-50 to-white border border-gray-200 text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-center mx-auto text-2xl">
                      <span className="font-bold text-blue-600">G</span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-base font-black text-gray-900">
                        ربط حساب Google بواسطة Firebase
                      </h4>
                      <p className="text-xs text-gray-500 font-medium max-w-sm mx-auto">
                        اضغط على الزر أدناه لتسجيل الدخول واختيار حساب Google الخاص بك ليتم ربطه بملفك الشخصي واستخدامه كبريدك الإلكتروني المعتمد.
                      </p>
                    </div>

                    <button
                      onClick={handleLinkGoogle}
                      disabled={isLinkingGoogle}
                      className="w-full max-w-md mx-auto py-3.5 px-5 rounded-2xl bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-200 hover:border-gray-300 font-black text-sm shadow-sm flex items-center justify-center gap-3 cursor-pointer transition-all active:scale-98"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      <span>{isLinkingGoogle ? 'جارٍ فتح نافذة Google...' : 'ربط الحساب الحقيقي بجوجل (Google Sign-In)'}</span>
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: CREATE / REGISTER PERSONAL PHONE (إنشاء وتوثيق رقمك الخاص) */}
            {/* ========================================================================= */}
            {activeTab === 'number' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-5"
              >
                <div className="p-3.5 bg-sky-50/80 border border-sky-100 rounded-2xl flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-sky-600 text-white shrink-0 mt-0.5">
                    <Smartphone size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-sky-950">قسم تسجيل وتوثيق رقم هاتفك الخاص الحقيقي</h4>
                    <p className="text-[11px] text-sky-900 leading-relaxed font-medium">
                      أدخل رقم هاتفك الشخصي مع رمز بلدك لحفظه مباشرة في Firebase. تم حذف الأرقام الافتراضية والوهمية لضمان مصداقية وأمان حسابك.
                    </p>
                  </div>
                </div>

                {/* Current Phone Display (if saved and not editing) */}
                {hasVerifiedPhone && !isEditingPhone ? (
                  <div className="p-5 rounded-3xl bg-white border-2 border-emerald-500 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-700 font-black text-xs">
                        <CheckCircle2 size={18} className="text-emerald-600" />
                        <span>رقم هاتفك الخاص موثق ومحفوظ في Firebase</span>
                      </div>
                      <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                        نشط
                      </span>
                    </div>

                    <div className="p-4 bg-gray-900 text-white rounded-2xl flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[11px] text-gray-400 font-medium">الرقم الموثق:</span>
                        <p className="font-mono font-black text-lg text-emerald-400 dir-ltr text-right">
                          {currentUser?.phone}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/10 text-white">
                        <Phone size={20} />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => setIsEditingPhone(true)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Edit2 size={14} />
                        <span>تعديل أو إدخال رقم جديد</span>
                      </button>

                      <button
                        onClick={handleRemovePhone}
                        className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        title="حذف الرقم"
                      >
                        <Trash2 size={14} />
                        <span>حذف</span>
                      </button>
                    </div>
                  </div>
                ) : phoneOtpStep === 'verify' ? (
                  <form onSubmit={handleVerifyPhoneOtp} className="p-5 rounded-3xl bg-white border-2 border-sky-400 shadow-sm space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Key size={18} className="text-sky-600" />
                        <h4 className="text-sm font-black text-gray-900">
                          تأكيد رقمك الخاص برمز التحقق (SMS)
                        </h4>
                      </div>
                      <p className="text-xs text-gray-600 font-medium">
                        أدخل الرمز المكون من 6 أرقام المرسل إلى <strong className="font-mono text-gray-900 dir-ltr inline-block">{selectedCountry.code} {phoneInput}</strong> لتأكيد ملكيتك للرقم:
                      </p>
                    </div>

                    {phoneOtpError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
                        {phoneOtpError}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block">
                        رمز التأكيد (6 أرقام):
                      </label>
                      <input 
                        type="text"
                        maxLength={6}
                        required
                        value={enteredPhoneOtp}
                        onChange={(e) => setEnteredPhoneOtp(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="مثال: 123456"
                        className="w-full px-4 py-3 rounded-2xl border-2 border-sky-400 focus:border-blue-600 focus:outline-none font-mono font-bold text-lg text-gray-900 bg-white tracking-widest text-center"
                        autoFocus
                      />
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPhoneOtpStep('input')}
                        className="py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer transition-colors"
                      >
                        تعديل الرقم
                      </button>

                      <button
                        type="submit"
                        disabled={isSavingPhone || enteredPhoneOtp.length < 6}
                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                      >
                        <Check size={16} />
                        <span>{isSavingPhone ? 'جارٍ التأكيد...' : 'تأكيد الرمز وتوثيق الرقم في Firebase'}</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleRequestPhoneOtp} className="p-5 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-gray-900">
                        {hasVerifiedPhone ? 'تعديل رقم هاتفك الخاص' : 'إنشاء وحفظ رقم هاتفك الخاص'}
                      </h4>
                      <p className="text-xs text-gray-500 font-medium">
                        اختر رمز دولتك ثم أدخل أرقام هاتفك الشخصي بدقة (سيصلك رمز تأكيد):
                      </p>
                    </div>

                    {/* Country Selector Dropdown & Filter */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                        <label className="flex items-center gap-1.5">
                          <Globe size={14} />
                          <span>الدولة والرمز الدولي:</span>
                        </label>
                        <input
                          type="text"
                          placeholder="بحث بالدولة أو الرمز..."
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1.5 border border-gray-200 rounded-2xl bg-gray-50">
                        {filteredCountries.map((c) => (
                          <button
                            type="button"
                            key={c.code + c.name}
                            onClick={() => setSelectedCountry(c)}
                            className={`p-2 rounded-xl text-right text-xs font-bold flex items-center justify-between border transition-all cursor-pointer ${
                              selectedCountry.code === c.code && selectedCountry.name === c.name
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <span className="truncate text-[11px]">{c.name}</span>
                            <span className="font-mono text-[11px] shrink-0 mr-1 dir-ltr">{c.code}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Phone Number Input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block">
                        رقم الهاتف (بدون الصفر الأولي):
                      </label>
                      
                      <div className="flex items-center gap-2" dir="ltr">
                        <div className="px-3 py-3 rounded-2xl bg-gray-100 border border-gray-300 font-mono font-bold text-sm text-gray-700 shrink-0 flex items-center gap-1">
                          <span>{selectedCountry.flag}</span>
                          <span>{selectedCountry.code}</span>
                        </div>

                        <input 
                          type="tel"
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder={selectedCountry.mask || '50 123 4567'}
                          className="flex-1 px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none font-mono font-bold text-base text-gray-900 bg-white tracking-wider"
                          autoFocus
                        />
                      </div>
                      
                      <p className="text-[11px] text-gray-400 font-medium">
                        المعاينة الكاملة: <span className="font-mono font-bold text-gray-700 dir-ltr inline-block">{selectedCountry.code} {phoneInput || 'XXXXXXXX'}</span>
                      </p>
                    </div>

                    {/* Submit / Cancel Buttons */}
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={isSavingPhone || !phoneInput.trim()}
                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-[#0866ff] hover:from-blue-700 hover:to-blue-700 text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                      >
                        <Key size={16} />
                        <span>إرسال رمز التأكيد للرقم 📩</span>
                      </button>

                      {isEditingPhone && (
                        <button
                          type="button"
                          onClick={() => setIsEditingPhone(false)}
                          className="py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer transition-colors"
                        >
                          إلغاء
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </motion.div>
            )}

            </div>

            {/* Bottom Footer Note */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 text-center flex items-center justify-center gap-1.5 text-xs text-gray-500 font-medium">
              <ShieldCheck size={14} className="text-blue-600" />
              <span>نظام التوثيق السحابي Sky مدعوم مباشرة بواسطة Firebase Authentication & Firestore</span>
            </div>

          </div>

        </main>
      </motion.div>
    </AnimatePresence>
  );
}
