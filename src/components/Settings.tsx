import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Key, LogOut, ChevronLeft, Lock, Bookmark, Settings as SettingsIcon, Users, AlertTriangle, Trash2, CheckCircle, XCircle, Ban, Smartphone, Zap, Cpu, Wifi, HardDrive, Type, Radio, BellOff, User as UserIcon, Mail, Phone, AtSign, Camera, Edit3, Save, X, Sparkles, Layers, Maximize2, Minimize2, Globe, Search, Check, LogIn, Rocket, Download, Archive, ArrowDownToLine, ArrowDown, MessageCircle, Power, PowerOff, Moon, Sun, UserPlus, CheckCircle2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ALL_LANGUAGES, getLanguageInfo } from '../utils/translations';
import { DEFAULT_AVATAR } from '../constants/avatar';
import AccountsCenterModal from './AccountsCenterModal';
import JRPOHModal from './JRPOHModal';
import AppLauncherAndSaverModal from './AppLauncherAndSaverModal';
import AndroidPackageInstaller from './AndroidPackageInstaller';
import ExternalApkInstallerModal from './ExternalApkInstallerModal';
import GrozlaApkDownloadCenter from './GrozlaApkDownloadCenter';
import { generateAndDownloadApk } from '../utils/apkGenerator';

export default function Settings() {
  const { logout, setCurrentView, currentUser, users, updateProfile, moderateUser, unblockUser, showToast, language, setAppLanguage, t, direction, switchAccount, removeSavedAccount } = useAppContext();
  const [alertMessage, setAlertMessage] = useState('');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [showGrozlaApkCenter, setShowGrozlaApkCenter] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('app_dark_mode');
    if (saved !== null) return saved === 'true';
    return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  });

  const handleToggleDarkMode = () => {
    const nextVal = !isDarkMode;
    setIsDarkMode(nextVal);
    localStorage.setItem('app_dark_mode', nextVal.toString());
    if (nextVal) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    window.dispatchEvent(new CustomEvent('app_dark_mode_toggle', { detail: nextVal }));
    showToast(nextVal ? 'تم تفعيل الوضع المظلم المريح للعينين 🌙' : 'تم العودة إلى الوضع الفاتح ☀️');
  };
  const [is120FpsEnabled, setIs120FpsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('app_acceleration_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [refreshRate, setRefreshRate] = useState<number>(() => {
    const saved = localStorage.getItem('app_refresh_rate');
    return saved ? parseInt(saved, 10) : 244;
  });

  const handleUpdateRefreshRate = (newRate: number) => {
    setRefreshRate(newRate);
    localStorage.setItem('app_refresh_rate', newRate.toString());
    window.dispatchEvent(new CustomEvent('app_refresh_rate_change', { detail: newRate }));
    showToast(`تم تعيين معدل التسريع إلى ${newRate} هرتز (FPS) ⚡`);
  };

  const handleToggleAcceleration = () => {
    const nextVal = !is120FpsEnabled;
    setIs120FpsEnabled(nextVal);
    localStorage.setItem('app_acceleration_enabled', nextVal.toString());
    window.dispatchEvent(new CustomEvent('app_acceleration_toggle', { detail: nextVal }));
    showToast(nextVal ? `تم تفعيل تسريع الشاشة (${refreshRate} هرتز) 🚀` : 'تم إيقاف التسريع العتادي');
  };
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [languageSearchQuery, setLanguageSearchQuery] = useState('');
  const [showAppEngineModal, setShowAppEngineModal] = useState(false);
  const [showJRPOHModal, setShowJRPOHModal] = useState(false);
  const [appEngineDefaultTab, setAppEngineDefaultTab] = useState<'launcher' | 'saver'>('launcher');

  const currentLangObj = useMemo(() => {
    return getLanguageInfo(language);
  }, [language]);

  const filteredLanguages = useMemo(() => {
    if (!languageSearchQuery.trim()) return ALL_LANGUAGES;
    const q = languageSearchQuery.toLowerCase();
    return ALL_LANGUAGES.filter(
      l => l.name.toLowerCase().includes(q) || 
           l.nativeName.toLowerCase().includes(q) || 
           l.code.toLowerCase().includes(q)
    );
  }, [languageSearchQuery]);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDownloadingApp, setIsDownloadingApp] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showAndroidInstaller, setShowAndroidInstaller] = useState(false);
  const [showExternalApkModal, setShowExternalApkModal] = useState(false);

  const [savedAccountsList, setSavedAccountsList] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('savedAccounts') || localStorage.getItem('saved_accounts') || '[]';
      return JSON.parse(raw);
    } catch {
      return [];
    }
  });

  const refreshSavedAccounts = () => {
    try {
      const raw = localStorage.getItem('savedAccounts') || localStorage.getItem('saved_accounts') || '[]';
      setSavedAccountsList(JSON.parse(raw));
    } catch {
      setSavedAccountsList([]);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleDownloadAppFile = async () => {
    try {
      showToast('🚀 جاري إنشاء وتنزيل حزمة APK الأصلية...');
      await generateAndDownloadApk({
        appName: 'GROZLA',
        packageName: 'com.grozla.app',
        versionName: '1.0.0',
        versionCode: 100
      });
      showToast('✅ تم تنزيل حزمة GROZLA APK بنجاح!');
    } catch (err) {
      console.error('APK download error:', err);
      showToast('❌ تعذر إتمام التنزيل، يرجى المحاولة مرة أخرى.');
    }
  };

  const handleDownloadAppWithArrow = () => {
    setIsDownloadingApp(true);
    setDownloadProgress(20);
    handleDownloadAppFile();

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 100;
        }
        return prev + 25;
      });
    }, 250);

    setTimeout(() => {
      clearInterval(interval);
      setDownloadProgress(100);
      setIsDownloadingApp(false);
      setShowExternalApkModal(true);
    }, 1100);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().then(() => {
          showToast('تم تفعيل وضع ملء الشاشة 📺✨');
        }).catch((err) => {
          console.log("Fullscreen request error:", err);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          showToast('تم الخروج من وضع ملء الشاشة');
        }).catch((err) => {
          console.log("Exit fullscreen error:", err);
        });
      }
    }
  };

  // Facebook Lite Specific Feature States
  const [dataSaverEnabled, setDataSaverEnabled] = useState(true);
  const [activeStatusEnabled, setActiveStatusEnabled] = useState(currentUser?.activeStatusEnabled ?? true);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [cacheSize, setCacheSize] = useState('18.4 MB');
  const [isCleaningCache, setIsCleaningCache] = useState(false);
  const [quietMode, setQuietMode] = useState(false);
  const [showAccountsCenterModal, setShowAccountsCenterModal] = useState(false);

  // Accounts Center (مركز الحسابات) States
  const [isAccountsCenterOpen, setIsAccountsCenterOpen] = useState(false);
  const [accountsCenterTab, setAccountsCenterTab] = useState<'main' | 'edit_profile'>('main');
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const isAdmin = currentUser?.email === 'bda43535@gmail.com';
  const blockedUsersList = users.filter(u => currentUser?.blockedUsers?.includes(u.id));

  const openAccountsCenter = () => {
    setEditName(currentUser?.name || '');
    setEditUsername(currentUser?.username || currentUser?.name?.toLowerCase().replace(/\s+/g, '_') || '');
    setEditPhone(currentUser?.phone || '');
    setEditEmail(currentUser?.email || '');
    setEditAvatar(currentUser?.avatar || '');
    setAccountsCenterTab('main');
    setIsAccountsCenterOpen(true);
  };

  const handleSaveAccountsCenterProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setAlertMessage('يرجى كتابة اسم ملف شخصي صحيح.');
      return;
    }
    setIsSavingProfile(true);
    try {
      await updateProfile({
        name: editName.trim(),
        username: editUsername.trim().replace(/^@/, ''),
        phone: editPhone.trim(),
        email: editEmail.trim(),
        avatar: editAvatar.trim(),
      });
      showToast('تم تحديث بيانات الحساب في مركز الحسابات بنجاح! 💾✨');
      setAccountsCenterTab('main');
    } catch (err) {
      setAlertMessage('حدث خطأ أثناء حفظ التغييرات.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLogoutClick = () => {
    logout();
  };

  

  const suspendUser = async (userId: string) => {
    if (window.confirm('هل أنت متأكد من تعليق هذا الحساب؟')) {
      await moderateUser(userId, { status: 'suspended', suspensionReason: 'تم تعليق حسابك من قبل الإدارة لمراجعة نشاطك.' });
      setAlertMessage('تم تعليق الحساب بنجاح.');
    }
  };

  const disableUser = async (userId: string) => {
    if (window.confirm('هل أنت متأكد من تعطيل هذا الحساب نهائياً؟')) {
      await moderateUser(userId, { status: 'disabled', suspensionReason: 'تم تعطيل حسابك نهائياً من قبل الإدارة لمخالفة صارخة للقوانين.' });
      setAlertMessage('تم تعطيل الحساب نهائياً.');
    }
  };

  const activateUser = async (userId: string) => {
    if (window.confirm('هل أنت متأكد من تفعيل هذا الحساب؟')) {
      await moderateUser(userId, { status: 'active', suspensionReason: null, appealSelfie: null, reports: [] });
      setAlertMessage('تم تفعيل الحساب بنجاح.');
    }
  };

  if (isAccountsCenterOpen) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 15 }} 
        animate={{ opacity: 1, x: 0 }} 
        className="bg-[#f0f2f5] min-h-screen p-2 sm:p-4 space-y-3 pb-16 text-right dir-rtl"
      >
        {/* Top Navigation Bar with Back Button */}
        <div className="bg-white rounded-2xl p-4 shadow-2xs border border-gray-200/80 flex items-center justify-between">
          <button 
            onClick={() => setIsAccountsCenterOpen(false)}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-[#1877f2] font-black rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <ChevronLeft size={18} className="rotate-180" />
            <span>العودة للإعدادات والخصوصية</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-gray-900">مركز الحسابات</span>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Sparkles size={16} />
            </div>
          </div>
        </div>

        {/* Accounts Center Main Card View */}
        <div className="bg-white rounded-3xl shadow-xs border border-gray-200/90 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full font-black text-blue-100 flex items-center gap-1">
                <Sparkles size={12} className="text-amber-300" /> مركز حسابات OWN あ
              </span>
            </div>
            <h2 className="text-2xl font-black text-white">مركز الحسابات</h2>
            <p className="text-xs text-blue-100 mt-1 font-medium">
              إدارة الملف الشخصي والمعلومات الشخصية وتفاصيل الاتصال والأمان في مكان واحد
            </p>
          </div>

          {/* Accounts Center Tab 1: Overview */}
          {accountsCenterTab === 'main' && (
            <div className="p-4 sm:p-6 space-y-5">
              <div className="text-xs font-black text-gray-500 uppercase tracking-wider">
                الحسابات والملفات الشخصية المرتبطة
              </div>

              {/* Profile Box */}
              <div 
                onClick={() => setAccountsCenterTab('edit_profile')}
                className="bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-purple-50/70 hover:from-blue-100 hover:to-indigo-100 rounded-2xl p-4 border border-blue-200/80 transition-all cursor-pointer shadow-xs group flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative shrink-0">
                    <img 
                      src={currentUser?.avatar} 
                      alt={currentUser?.name} 
                      className="w-14 h-14 rounded-full object-cover border-2 border-blue-600 shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-base group-hover:text-blue-700 transition-colors">
                      {currentUser?.name}
                    </h3>
                    <p className="text-xs font-extrabold text-blue-600 dir-ltr text-right">
                      @{currentUser?.username || currentUser?.name?.toLowerCase().replace(/\s+/g, '_') || 'user'}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500 font-medium">
                      {currentUser?.email && <span>📧 {currentUser.email}</span>}
                      {currentUser?.phone && <span>📱 {currentUser.phone}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-black text-blue-600 bg-white px-3 py-1.5 rounded-xl border border-blue-200 shadow-2xs group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                  <Edit3 size={14} />
                  <span>تعديل</span>
                </div>
              </div>

              {/* Quick Info Items */}
              <div className="grid grid-cols-1 gap-3 pt-2">
                {/* 1. Edit Profile */}
                <button 
                  onClick={() => setAccountsCenterTab('edit_profile')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100/80 rounded-2xl border border-gray-200/80 transition-colors text-right group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                      <UserIcon size={22} />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 text-sm">المعلومات الشخصية واسم المستخدم</h4>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">تعديل الاسم الكامل، اسم المستخدم، رقم الهاتف والبريد الإلكتروني</p>
                    </div>
                  </div>
                  <ChevronLeft size={20} className="text-gray-400 group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
                </button>

                {/* 2. Archive */}
                <button 
                  onClick={() => setCurrentView('archive')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100/80 rounded-2xl border border-gray-200/80 transition-colors text-right group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                      <Archive size={22} />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 text-sm">الأرشيف (Archive)</h4>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">حفظ واستعراض المنشورات والقصص المحفوظة في أرشيفك الخاص</p>
                    </div>
                  </div>
                  <ChevronLeft size={20} className="text-gray-400 group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
                </button>

                {/* 3. Account Status */}
                <div className="flex items-center justify-between p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-right">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                      <CheckCircle size={22} />
                    </div>
                    <div>
                      <h4 className="font-black text-emerald-950 text-sm">حالة التحقق والأمان</h4>
                      <p className="text-xs text-emerald-700 mt-0.5 font-bold">حساب موثق ومحمي بواسطة مركز حسابات OWN あ</p>
                    </div>
                  </div>
                  <span className="text-[11px] bg-emerald-600 text-white font-black px-3 py-1 rounded-xl shadow-2xs">
                    نشط وآمن 🟢
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <button 
                  onClick={() => setIsAccountsCenterOpen(false)}
                  className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-2xl text-sm transition-colors cursor-pointer"
                >
                  العودة إلى الإعدادات الرئيسية
                </button>
              </div>
            </div>
          )}

          {/* Accounts Center Tab 2: Edit Form */}
          {accountsCenterTab === 'edit_profile' && (
            <form onSubmit={handleSaveAccountsCenterProfile} className="p-4 sm:p-6 space-y-5">
              <div className="flex items-center justify-between border-b pb-3">
                <button 
                  type="button"
                  onClick={() => setAccountsCenterTab('main')}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3.5 py-2 rounded-xl cursor-pointer"
                >
                  <ChevronLeft size={16} className="rotate-180" />
                  <span>العودة لمركز الحسابات</span>
                </button>
                <h3 className="font-black text-gray-900 text-base">تعديل معلومات الملف الشخصي</h3>
              </div>

              {/* Avatar Image & URL */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-200 flex items-center gap-4">
                <div className="relative shrink-0">
                  <img 
                    src={editAvatar || currentUser?.avatar} 
                    alt="Avatar" 
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-600 shadow-md"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full border border-white">
                    <Camera size={12} />
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <label className="block text-xs font-black text-gray-800">صورة الملف الشخصي (رابط الصورة)</label>
                  <input 
                    type="url" 
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    placeholder="https://..."
                    className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2 outline-none focus:border-blue-600 font-mono dir-ltr"
                  />
                </div>
              </div>

              {/* Inputs */}
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-black text-gray-800 mb-1 flex items-center gap-1.5">
                    <UserIcon size={15} className="text-blue-600" />
                    <span>اسم الملف الشخصي (Profile Name)</span>
                  </label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="أدخل اسمك الكامل..."
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-blue-600 focus:bg-white transition-all"
                    required
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-black text-gray-800 mb-1 flex items-center gap-1.5">
                    <AtSign size={15} className="text-purple-600" />
                    <span>اسم المستخدم (Username)</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute right-3.5 font-bold text-gray-400 text-sm">@</span>
                    <input 
                      type="text" 
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="username"
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl pr-9 pl-3 py-3 text-sm font-bold text-gray-900 outline-none focus:border-purple-600 focus:bg-white transition-all dir-ltr text-right"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">اسم مستخدم فريد لسهولة الإشارة إليك والتواصل معك</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-black text-gray-800 mb-1 flex items-center gap-1.5">
                    <Phone size={15} className="text-emerald-600" />
                    <span>رقم الهاتف (Phone Number)</span>
                  </label>
                  <input 
                    type="tel" 
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="مثال: +966 50 123 4567"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-emerald-600 focus:bg-white transition-all dir-ltr text-right"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-black text-gray-800 mb-1 flex items-center gap-1.5">
                    <Mail size={15} className="text-amber-600" />
                    <span>البريد الإلكتروني (Email Address)</span>
                  </label>
                  <input 
                    type="email" 
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="example@domain.com"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-amber-600 focus:bg-white transition-all dir-ltr text-right"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setAccountsCenterTab('main')}
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold rounded-2xl text-xs transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-2xl text-xs transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save size={16} />
                  <span>{isSavingProfile ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="bg-[#f0f2f5] dark:bg-slate-950 min-h-screen p-2 sm:p-4 space-y-3 pb-16 text-right dir-rtl transition-colors duration-200"
    >
      {/* Facebook Lite Header Banner & Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-2xs border border-gray-200/80 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <img 
            src={currentUser?.avatar} 
            alt={currentUser?.name} 
            className="w-12 h-12 rounded-full object-cover border-2 border-[#1877f2] cursor-pointer"
            onClick={() => setCurrentView('profile', currentUser?.id)}
            referrerPolicy="no-referrer"
          />
          <div>
            <h2 className="font-extrabold text-gray-900 dark:text-white text-base">{currentUser?.name}</h2>
            <p className="text-xs font-bold text-gray-500 dark:text-slate-400">مركز إعدادات GROZLA | الإصدار الرسمي</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* زر تعديل الوضع الليلي في رأس الإعدادات */}
          <button
            id="header-toggle-dark-mode-btn"
            type="button"
            onClick={handleToggleDarkMode}
            title={isDarkMode ? 'استعادة الوضع الفاتح' : 'تفعيل الوضع الليلي'}
            className={`px-3 py-2 rounded-xl border font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs ${
              isDarkMode 
                ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700' 
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            {isDarkMode ? <Moon size={16} className="text-amber-300 fill-amber-300" /> : <Sun size={16} className="text-amber-500 fill-amber-400" />}
            <span>{isDarkMode ? 'استعادة الفاتح ☀️' : 'الوضع الليلي 🌙'}</span>
          </button>

          {/* سهم تنزيل التطبيق في رأس الصفحة */}
          <button 
            id="header-download-app-arrow-btn"
            onClick={handleDownloadAppWithArrow}
            title="تنزيل التطبيق (سهم التنزيل)"
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-black text-xs shadow-sm shadow-emerald-600/30 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 group"
          >
            <ArrowDownToLine size={16} className={`${isDownloadingApp ? 'animate-bounce' : 'group-hover:translate-y-0.5'} transition-transform`} />
            <span className="hidden sm:inline">{isDownloadingApp ? 'جاري التنزيل...' : 'سهم التنزيل'}</span>
          </button>
          <button 
            onClick={() => setCurrentView('profile', currentUser?.id)}
            className="px-3 py-2 bg-blue-50 dark:bg-slate-800 text-[#1877f2] dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
          >
            الملف الشخصي
          </button>
        </div>
      </div>

      {/* Master Download App Arrow Banner (سهم تنزيل التطبيق البارز) */}
      <div 
        id="download-app-arrow-card"
        className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-lg shadow-emerald-950/30 border border-emerald-500/40 relative overflow-hidden"
      >
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute left-10 -bottom-10 w-28 h-28 bg-teal-500/15 rounded-full blur-xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            {/* Big Clickable Download Arrow Button */}
            <button
              type="button"
              id="main-download-arrow-icon-btn"
              onClick={handleDownloadAppWithArrow}
              className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-500 to-emerald-600 hover:from-emerald-300 hover:to-teal-400 text-white flex items-center justify-center font-black shadow-lg shadow-emerald-600/40 shrink-0 border border-white/30 cursor-pointer active:scale-95 group transition-all"
              title="انقر على السهم لبدء تنزيل التطبيق فوراً"
            >
              <ArrowDownToLine 
                size={28} 
                className={`${isDownloadingApp ? 'animate-bounce text-white' : 'group-hover:translate-y-1 text-white'} transition-all`} 
              />
            </button>
            <div className="text-right">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-white text-base sm:text-lg flex items-center gap-1.5">
                  <span>سهم تنزيل التطبيق</span>
                  <span className="text-emerald-300">⬇️</span>
                </h3>
                <span className="bg-emerald-400/25 text-emerald-300 border border-emerald-400/30 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                  حزمة APK الأصلية
                </span>
                <span className="bg-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  2.4 MB
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-1 font-medium leading-relaxed max-w-lg">
                انقر على السهم لتنزيل تطبيق GROZLA على جهازك وتثبيته للاستمتاع بأداء فائق وسرعة تصفح 120 FPS وتنبيهات فورية.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            <button
              id="click-download-app-arrow-cta"
              type="button"
              onClick={handleDownloadAppWithArrow}
              disabled={isDownloadingApp}
              className="w-full sm:w-auto px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-75"
            >
              <ArrowDownToLine size={18} className={isDownloadingApp ? 'animate-bounce' : ''} />
              <span>{isDownloadingApp ? `جاري التنزيل (${downloadProgress}%)...` : 'تنزيل التطبيق من السهم'}</span>
            </button>
            <button
              id="open-grozla-apk-center-btn"
              type="button"
              onClick={() => setShowGrozlaApkCenter(true)}
              title="فتح مركز تنزيل وبناء حزمة GROZLA APK بالذكاء الاصطناعي"
              className="px-4 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md shadow-purple-950/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0 border border-purple-400/30"
            >
              <Sparkles size={16} className="text-yellow-300 animate-pulse" />
              <span>مركز تنزيل GROZLA APK ⚡</span>
            </button>
            <button
              id="open-external-apk-modal-btn"
              type="button"
              onClick={() => setShowExternalApkModal(true)}
              title="فتح نظام تثبيت حزم APK الخارجية للموبايل"
              className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-2xl shadow-md shadow-blue-950/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
            >
              <Smartphone size={16} />
              <span>تثبيت APK خارجي</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAndroidInstaller(true)}
              title="فتح مثبت التطبيقات الذكي"
              className="p-3 bg-white/15 hover:bg-white/25 text-white rounded-2xl border border-white/20 transition-all cursor-pointer flex items-center justify-center shrink-0"
            >
              <Smartphone size={18} />
            </button>
          </div>
        </div>

        {/* Live Download Progress Bar */}
        {isDownloadingApp && (
          <div className="mt-3 pt-3 border-t border-emerald-500/30 relative z-10">
            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-200 mb-1">
              <span>جاري تنزيل ملف GROZLA_v1.0.0_Official.apk...</span>
              <span>{downloadProgress}%</span>
            </div>
            <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-emerald-400 h-full rounded-full transition-all duration-300 shadow-sm shadow-emerald-300"
                style={{ width: `${downloadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Accounts Center & Archive Master Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Accounts Center Card */}
        <div 
          id="accounts-center-settings-card"
          onClick={() => setShowAccountsCenterModal(true)}
          className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200/90 flex items-center justify-between gap-3 hover:border-blue-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-200 shrink-0 group-hover:scale-105 transition-transform">
              <Shield size={24} />
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-gray-900 text-sm sm:text-base group-hover:text-blue-600 transition-colors">
                  مركز الحسابات
                </h3>
                <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                  OWN
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">
                تعديل الاسم الأول والعائلة، اسم المستخدم، ورقم الحساب
              </p>
            </div>
          </div>
          <ChevronLeft size={18} className="text-gray-400 group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
        </div>

        {/* Archive Card */}
        <div 
          id="archive-settings-card"
          onClick={() => setCurrentView('archive')}
          className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200/90 flex items-center justify-between gap-3 hover:border-indigo-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-200 shrink-0 group-hover:scale-105 transition-transform">
              <Archive size={24} />
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-gray-900 text-sm sm:text-base group-hover:text-indigo-600 transition-colors">
                  الأرشيف
                </h3>
                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                  منشورات وقصص
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">
                استعراض واستعادة المنشورات والقصص المحفوظة
              </p>
            </div>
          </div>
          <ChevronLeft size={18} className="text-gray-400 group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
        </div>
      </div>

      <div className="space-y-4">
        {/* Admin Section */}
        {isAdmin && (
          <div>
            <h3 className="text-lg font-bold text-red-600 mb-3 flex items-center gap-2">
              <Shield size={20} className="text-red-600" />
              لوحة تحكم الإدارة (تنفيذ الأوامر)
            </h3>
            
            <div className="bg-red-50 rounded-xl overflow-hidden border border-red-100">
              <button 
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="w-full flex items-center justify-between p-4 hover:bg-red-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-red-200 p-2 rounded-full">
                    <SettingsIcon size={20} className="text-red-700" />
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-800">إدارة المستخدمين والمحتوى</p>
                    <p className="text-sm text-red-600">تعليق، تعطيل، وحذف المحتوى المخالف</p>
                  </div>
                </div>
                <ChevronLeft size={20} className={`text-red-400 transition-transform ${showAdminPanel ? '-rotate-90' : 'rtl:rotate-180'}`} />
              </button>

              {showAdminPanel && (
                <div className="p-4 border-t border-red-100 space-y-4 bg-white/50">
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-700 flex items-center gap-2">
                      <Users size={16} />
                      المستخدمون المبلغ عنهم / المعلقون
                    </h4>
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                      {users.filter(u => u.status !== 'active' || (u.reports && u.reports.length > 0)).map((user, uIdx) => (
                        <div key={user.id ? `rep-user-${user.id}-${uIdx}` : `rep-user-${uIdx}`} className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between gap-3 shadow-sm">
                          <div className="flex items-center gap-2">
                            <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                            <div className="text-right">
                              <p className="text-sm font-bold truncate max-w-[120px]">{user.name}</p>
                              <p className="text-[10px] text-gray-500">الحالة: {user.status}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {user.status !== 'active' && (
                              <button onClick={() => activateUser(user.id)} className="p-1.5 bg-green-100 text-green-600 rounded-md hover:bg-green-200" title="تفعيل">
                                <CheckCircle size={14} />
                              </button>
                            )}
                            {user.status === 'active' && (
                              <button onClick={() => suspendUser(user.id)} className="p-1.5 bg-orange-100 text-orange-600 rounded-md hover:bg-orange-200" title="تعليق">
                                <AlertTriangle size={14} />
                              </button>
                            )}
                            <button onClick={() => disableUser(user.id)} className="p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200" title="تعطيل نهائي">
                              <XCircle size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {users.filter(u => u.status !== 'active' || (u.reports && u.reports.length > 0)).length === 0 && (
                        <p className="text-center text-gray-400 text-sm py-4">لا يوجد مستخدمون للمراجعة حالياً.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* JRPOH Special Section */}
        <div>
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-lg shadow-purple-950/30 mb-5 border border-purple-500/40 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-28 h-28 bg-purple-500/20 rounded-full blur-xl pointer-events-none"></div>
            <div className="flex items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-purple-500 via-indigo-500 to-pink-500 text-white flex items-center justify-center font-black shadow-lg shadow-purple-500/30 shrink-0 border border-white/20">
                  <Sparkles size={26} className="text-white animate-pulse" />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-white text-base sm:text-lg">JRPOH</h3>
                    <span className="bg-purple-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                      أيقونة مميزة ⭐
                    </span>
                  </div>
                  <p className="text-xs text-purple-200 mt-1 font-medium leading-relaxed">
                    لوحة تحكم وخصائص JRPOH المتقدمة لإدارة إعدادات النظام المخصصة
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between relative z-10">
              <span className="text-xs text-purple-300 font-bold">الحالة: مفعل ونشط 🟢</span>
              <button
                onClick={() => {
                  setShowJRPOHModal(true);
                  showToast('جاري فتح محاكي عالم JRPOH ليلاً... 🌌✨');
                }}
                className="py-2 px-4 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Sparkles size={14} />
                <span>تشغيل JRPOH</span>
              </button>
            </div>
          </div>
        </div>
                {/* System-Wide Dark Mode Toggle Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 shadow-xs border border-gray-200/90 dark:border-slate-800 mb-5 relative overflow-hidden transition-all">
          <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-md shrink-0 transition-all ${
                isDarkMode ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-amber-300 shadow-purple-900/30' : 'bg-gradient-to-tr from-amber-400 to-orange-500 text-white shadow-amber-300/30'
              }`}>
                {isDarkMode ? <Moon size={24} className="fill-amber-300" /> : <Sun size={24} className="fill-white" />}
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-gray-900 dark:text-white text-base">
                    تعديل الوضع الليلي (Dark Mode)
                  </h3>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                    isDarkMode ? 'bg-purple-900/60 text-purple-200 border border-purple-700' : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {isDarkMode ? '🌙 مظلم ليلي مفعل' : '☀️ نهار فاتح (طبيعي)'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                  التحكم الكامل في تفعيل الوضع المظلم لراحة العين أو استعادة المظهر الفاتح بلمسة واحدة
                </p>
              </div>
            </div>

            {/* Controls: Quick action buttons + Toggle Switch */}
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-slate-800">
              <button
                type="button"
                id="card-activate-dark-mode-btn"
                onClick={() => {
                  if (!isDarkMode) handleToggleDarkMode();
                }}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                  isDarkMode 
                    ? 'bg-indigo-600 text-white shadow-indigo-600/30' 
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                <Moon size={14} className={isDarkMode ? 'fill-white' : ''} />
                <span>تفعيل المظلم</span>
              </button>

              <button
                type="button"
                id="card-restore-light-mode-btn"
                onClick={() => {
                  if (isDarkMode) handleToggleDarkMode();
                }}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                  !isDarkMode 
                    ? 'bg-amber-500 text-white shadow-amber-500/30' 
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                <Sun size={14} className={!isDarkMode ? 'fill-white' : ''} />
                <span>استعادة الفاتح</span>
              </button>

              {/* Toggle Switch */}
              <button
                type="button"
                id="card-dark-mode-toggle-switch"
                onClick={handleToggleDarkMode}
                className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer flex items-center shrink-0 border ${
                  isDarkMode ? 'bg-indigo-600 border-indigo-500 justify-end' : 'bg-gray-200 border-gray-300 justify-start'
                }`}
                title={isDarkMode ? 'التحويل إلى الوضع الفاتح' : 'التحويل إلى الوضع المظلم'}
              >
                <motion.div
                  layout
                  className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-xs font-bold text-gray-800"
                >
                  {isDarkMode ? '🌙' : '☀️'}
                </motion.div>
              </button>
            </div>
          </div>
        </div>

        {/* 120 FPS High Refresh Rate Section */}
        <div>
          {/* App Engine & Saver Launcher Master Card */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-lg shadow-blue-950/30 mb-5 border border-blue-500/40 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-28 h-28 bg-blue-500/20 rounded-full blur-xl pointer-events-none"></div>
            
            <div className="flex items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 text-white flex items-center justify-center font-black shadow-lg shadow-orange-500/30 shrink-0 border border-white/20">
                  <Rocket size={26} className="text-white" />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-white text-base sm:text-lg">نظام تشغيل وحفظ التطبيق</h3>
                    <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                      GROZLA Engine
                    </span>
                  </div>
                  <p className="text-xs text-blue-200 mt-1 font-medium leading-relaxed">
                    مركز التحكم الشامل لسرعة وأداء المحرك، وتثبيت وحفظ التطبيق والبيانات
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 relative z-10">
              <button
                onClick={() => {
                  setAppEngineDefaultTab('launcher');
                  setShowAppEngineModal(true);
                }}
                className="py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Rocket size={15} />
                <span>🚀 مركز تشغيل التطبيق</span>
              </button>
              <button
                onClick={() => {
                  setAppEngineDefaultTab('saver');
                  setShowAppEngineModal(true);
                }}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Download size={15} />
                <span>💾 تثبيت وحفظ التطبيق</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Zap size={18} className="fill-white" />
              </div>
              أداء السرعة ومعدل التحديث (120Hz - 244Hz)
            </h3>
            <span className="text-[11px] bg-amber-100 text-amber-800 font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200">
              تسريع خارق حتى 244Hz ⚡
            </span>
          </div>
          
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-3xl p-4 sm:p-5 shadow-lg shadow-blue-500/20 mb-5 relative overflow-hidden">
            {/* Background decorative glow */}
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-md text-white p-3 rounded-2xl shadow-inner border border-white/30">
                  <Cpu size={24} className="animate-pulse text-amber-300" />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-white text-sm sm:text-base">وضع السلاسة الفائقة والتسريع العالي</p>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs ${
                      is120FpsEnabled ? (refreshRate >= 240 ? 'bg-amber-300 text-amber-950 font-black' : 'bg-emerald-400 text-emerald-950') : 'bg-white/20 text-white'
                    }`}>
                      {is120FpsEnabled ? `⚡ ${refreshRate}Hz مفعل` : 'متوقف'}
                    </span>
                  </div>
                  <p className="text-xs text-blue-100 mt-1 font-medium leading-relaxed">
                    تسريع العرض بالمعالج الرسومي (GPU Acceleration) بمعدل يصل إلى 244Hz لضمان سرعة واستجابة خارقة
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button 
                onClick={handleToggleAcceleration}
                className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer flex items-center shrink-0 border border-white/20 ${is120FpsEnabled ? 'bg-emerald-400 justify-end' : 'bg-white/30 justify-start'}`}
                title={is120FpsEnabled ? 'إيقاف التسريع' : 'تشغيل التسريع'}
              >
                <motion.div 
                  layout 
                  className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-xs font-bold text-gray-800"
                >
                  {is120FpsEnabled ? '✓' : ''}
                </motion.div>
              </button>
            </div>

            {is120FpsEnabled && (
              <div className="mt-4 pt-3.5 border-t border-white/20 relative z-10 space-y-3.5">
                {/* الأزرار السريعة: 120 هرتز وبجانبها 244 هرتز */}
                <div>
                  <div className="flex items-center justify-between text-xs text-blue-100 font-bold mb-2">
                    <span>اختر معدل التردد السريع:</span>
                    <span className="text-[11px] text-amber-300 font-extrabold">بجانب 120Hz وضع 244Hz التوربو</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* زر 120 هرتز */}
                    <button
                      type="button"
                      onClick={() => handleUpdateRefreshRate(120)}
                      className={`p-3 rounded-2xl border transition-all text-right flex flex-col justify-between cursor-pointer relative overflow-hidden ${
                        refreshRate === 120
                          ? 'bg-white/25 border-white shadow-md shadow-blue-900/30'
                          : 'bg-white/10 border-white/15 hover:bg-white/15'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm sm:text-base font-black flex items-center gap-1.5 text-white">
                          <Zap size={16} className={refreshRate === 120 ? 'text-emerald-300 fill-emerald-300' : 'text-blue-200'} />
                          <span>120 هرتز</span>
                        </span>
                        {refreshRate === 120 && (
                          <span className="text-[10px] font-black bg-emerald-400 text-emerald-950 px-2 py-0.5 rounded-full">
                            نشط ✓
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-[11px] text-blue-100">
                        سلاسة 120 FPS فائقة • استجابة 8.33ms
                      </div>
                    </button>

                    {/* زر 244 هرتز بجانب 120 هرتز */}
                    <button
                      type="button"
                      onClick={() => handleUpdateRefreshRate(244)}
                      className={`p-3 rounded-2xl border transition-all text-right flex flex-col justify-between cursor-pointer relative overflow-hidden ${
                        refreshRate === 244
                          ? 'bg-gradient-to-br from-amber-400/30 to-purple-500/30 border-amber-300 shadow-md shadow-amber-500/30'
                          : 'bg-white/10 border-white/15 hover:bg-white/15'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm sm:text-base font-black flex items-center gap-1.5 text-amber-200">
                          <Rocket size={16} className={refreshRate === 244 ? 'text-amber-300 fill-amber-300 animate-bounce' : 'text-amber-300'} />
                          <span>244 هرتز</span>
                        </span>
                        {refreshRate === 244 && (
                          <span className="text-[10px] font-black bg-amber-300 text-amber-950 px-2 py-0.5 rounded-full">
                            توربو خارق ⚡
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-[11px] text-amber-100">
                        أقصى تسريع 244 FPS • استجابة 4.09ms
                      </div>
                    </button>
                  </div>
                </div>

                {/* سلايدر مدى التسريع حتى 244 هرتز */}
                <div className="bg-black/20 p-3 rounded-2xl border border-white/10 backdrop-blur-xs">
                  <div className="flex items-center justify-between text-xs font-black text-white mb-2">
                    <span className="flex items-center gap-1.5">
                      <span>مدى التسريع المخصص:</span>
                      <b className="text-amber-300 text-sm">{refreshRate} هرتز (FPS)</b>
                    </span>
                    <span className="text-[10px] text-blue-200 bg-white/10 px-2 py-0.5 rounded-lg">
                      المدى: 60Hz ⟵ 120Hz ⟵ 244Hz
                    </span>
                  </div>

                  <input
                    type="range"
                    min="60"
                    max="244"
                    step="1"
                    value={refreshRate}
                    onChange={(e) => handleUpdateRefreshRate(parseInt(e.target.value, 10))}
                    className="w-full h-2.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-300 hover:accent-amber-400 transition-all"
                  />

                  <div className="flex justify-between items-center text-[10px] font-extrabold text-blue-200 mt-1.5 px-0.5">
                    <span onClick={() => handleUpdateRefreshRate(60)} className="cursor-pointer hover:text-white">60Hz قياسي</span>
                    <span onClick={() => handleUpdateRefreshRate(90)} className="cursor-pointer hover:text-white">90Hz</span>
                    <span onClick={() => handleUpdateRefreshRate(120)} className={`cursor-pointer font-black ${refreshRate === 120 ? 'text-emerald-300 text-xs' : 'hover:text-white'}`}>120Hz ⚡</span>
                    <span onClick={() => handleUpdateRefreshRate(144)} className="cursor-pointer hover:text-white">144Hz</span>
                    <span onClick={() => handleUpdateRefreshRate(240)} className="cursor-pointer hover:text-white">240Hz</span>
                    <span onClick={() => handleUpdateRefreshRate(244)} className={`cursor-pointer font-black ${refreshRate === 244 ? 'text-amber-300 text-xs' : 'hover:text-amber-200'}`}>244Hz 🚀</span>
                  </div>
                </div>

                {/* إحصائيات الأداء اللحظية */}
                <div className="flex items-center justify-between text-xs font-black text-white pt-1 flex-wrap gap-2">
                  <span className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-xl backdrop-blur-xs">
                    <span className={`w-2.5 h-2.5 rounded-full ${refreshRate >= 240 ? 'bg-amber-400' : 'bg-emerald-400'} animate-ping`}></span>
                    المعدل الحالي: <b className={refreshRate >= 240 ? 'text-amber-300' : 'text-emerald-300'}>{refreshRate} إطار/ثانية ({(1000 / refreshRate).toFixed(2)}ms)</b>
                  </span>
                  <span className="text-[11px] bg-white/20 text-white px-2.5 py-1.5 rounded-xl border border-white/30 font-bold">
                    {refreshRate >= 240 ? 'سرعة استجابة فائقة 244Hz 🚀' : 'سلاسة 100% بدون تقطيع ⚡'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Fullscreen Setting Card - Placed right under Ultra Smoothness (120 FPS) */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-200/90 shadow-xs mb-5 flex items-center justify-between gap-3 hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-200 shrink-0">
                {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-black text-gray-900 text-sm sm:text-base">وضع ملء الشاشة (Fullscreen Mode)</h4>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isFullscreen ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {isFullscreen ? 'شاشة كاملة مفعلة 📺' : 'عادي'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 font-medium leading-relaxed">
                  إخفاء أشرطة المتصفح وتوسيع تطبيق GROZLA ليغطي كامل شاشة هاتفك أو جهازك
                </p>
              </div>
            </div>

            <button
              onClick={toggleFullscreen}
              className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer flex items-center shrink-0 border border-gray-200 ${isFullscreen ? 'bg-[#1877f2] justify-end' : 'bg-gray-300 justify-start'}`}
            >
              <motion.div
                layout
                className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-xs font-bold text-gray-800"
              >
                {isFullscreen ? '✓' : ''}
              </motion.div>
            </button>
          </div>
        </div>

        {/* GROZLA Essential Tools */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#1877f2] text-white flex items-center justify-center shadow-xs">
                <Smartphone size={18} />
              </div>
              ميزات GROZLA الأساسية (GROZLA Tools)
            </h3>
            <span className="text-[11px] bg-blue-100 text-[#1877f2] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">
              v1.0.0 ⚡
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/90 dark:border-slate-800 divide-y divide-gray-100 dark:divide-slate-800 overflow-hidden shadow-xs mb-6">
            {/* Dark Mode in Settings Menu */}
            <div className="p-4 flex items-center justify-between hover:bg-indigo-50/40 dark:hover:bg-slate-800/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shadow-md shrink-0 transition-all ${
                  isDarkMode 
                    ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-amber-300 shadow-purple-900/30' 
                    : 'bg-gradient-to-tr from-amber-400 to-orange-500 text-white shadow-amber-300/30'
                }`}>
                  {isDarkMode ? <Moon size={22} className="fill-amber-300" /> : <Sun size={22} className="fill-white" />}
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-black text-gray-900 dark:text-white text-sm">تعديل الوضع الليلي (Dark Mode)</h4>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                      isDarkMode 
                        ? 'bg-purple-900/60 text-purple-200 border border-purple-700' 
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {isDarkMode ? '🌙 مفعل' : '☀️ معطل'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 font-medium">
                    تفعيل أو استعادة المظهر المظلم لراحة العين وتوفير البطارية
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  id="menu-dark-mode-action-btn"
                  onClick={handleToggleDarkMode}
                  className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                    isDarkMode 
                      ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
                  }`}
                  title={isDarkMode ? 'استعادة الوضع الفاتح' : 'تفعيل الوضع الليلي'}
                >
                  {isDarkMode ? (
                    <>
                      <Sun size={14} className="fill-white" />
                      <span>استعادة الفاتح</span>
                    </>
                  ) : (
                    <>
                      <Moon size={14} className="fill-white" />
                      <span>تفعيل المظلم</span>
                    </>
                  )}
                </button>
                <button 
                  type="button"
                  id="menu-dark-mode-switch-btn"
                  onClick={handleToggleDarkMode}
                  className={`w-13 h-7 rounded-full p-1 transition-colors duration-200 flex items-center cursor-pointer shrink-0 border ${
                    isDarkMode ? 'bg-indigo-600 border-indigo-500 justify-end' : 'bg-gray-300 border-gray-400 justify-start'
                  }`}
                  title={isDarkMode ? 'التحويل إلى الوضع الفاتح' : 'التحويل إلى الوضع المظلم'}
                >
                  <motion.div layout className="w-5 h-5 rounded-full bg-white shadow-xs flex items-center justify-center text-[10px]">
                    {isDarkMode ? '🌙' : '☀️'}
                  </motion.div>
                </button>
              </div>
            </div>

            {/* 0. Language Selector */}
            <div className="p-4 flex items-center justify-between hover:bg-sky-50/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-sky-200 shrink-0">
                  <Globe size={22} />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-gray-900 text-sm">{t('language', 'اللغة')} (Language)</h4>
                    <span className="text-[10px] bg-sky-100 text-sky-800 font-extrabold px-2 py-0.5 rounded-md">
                      {currentLangObj.nativeName}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">تغيير لغة التطبيق وتطبيقها فوراً على جميع الواجهات</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setLanguageSearchQuery('');
                  setShowLanguageModal(true);
                }}
                className="px-3.5 py-1.5 bg-[#1877f2] hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <Globe size={14} />
                <span>{t('choose_language', 'تغيير')}</span>
              </button>
            </div>

            {/* 1. Data Saver */}
            <div className="p-4 flex items-center justify-between hover:bg-blue-50/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-200 shrink-0">
                  <Wifi size={22} />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-gray-900 text-sm">وضع توفير البيانات (Data Saver)</h4>
                    {dataSaverEnabled && (
                      <span className="text-[10px] bg-blue-100 text-blue-700 font-extrabold px-2 py-0.5 rounded-md">
                        مفعل 📶
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">تقليل استهلاك الإنترنت وضغط الصور والفيديوهات تلقائياً</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setDataSaverEnabled(!dataSaverEnabled);
                  showToast(!dataSaverEnabled ? 'تم تفعيل وضع توفير البيانات 📶' : 'تم إيقاف وضع توفير البيانات');
                }}
                className={`w-13 h-7 rounded-full p-1 transition-colors duration-200 flex items-center cursor-pointer shrink-0 ${dataSaverEnabled ? 'bg-[#1877f2] justify-end' : 'bg-gray-300 justify-start'}`}
              >
                <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
              </button>
            </div>

            {/* 2. Active Status */}
            <div className="p-4 flex items-center justify-between hover:bg-emerald-50/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-200 relative shrink-0">
                  <Radio size={22} />
                  {activeStatusEnabled && (
                    <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-emerald-300 border-2 border-emerald-600 rounded-full animate-pulse"></span>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-gray-900 text-sm">حالة النشاط (Active Status)</h4>
                    {activeStatusEnabled && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-md">
                        متصل الآن 🟢
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">عرض النقطة الخضراء عند وجودك أونلاين للأصدقاء</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  const newValue = !activeStatusEnabled;
                  setActiveStatusEnabled(newValue);
                  updateProfile({ activeStatusEnabled: newValue });
                  showToast(newValue ? 'حالة النشاط معروضة للأصدقاء 🟢' : 'تم إخفاء حالة النشاط');
                }}
                className={`w-13 h-7 rounded-full p-1 transition-colors duration-200 flex items-center cursor-pointer shrink-0 ${activeStatusEnabled ? 'bg-emerald-500 justify-end' : 'bg-gray-300 justify-start'}`}
              >
                <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
              </button>
            </div>

            {/* 3. Cache Cleaner */}
            <div className="p-4 flex items-center justify-between hover:bg-amber-50/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-200 shrink-0">
                  <HardDrive size={22} />
                </div>
                <div className="text-right">
                  <h4 className="font-black text-gray-900 text-sm">تنظيف الذاكرة المؤقتة (Clear Cache)</h4>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">الحجم المستهلك حالياً: <b className="text-amber-700 font-black">{cacheSize}</b></p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsCleaningCache(true);
                  setTimeout(() => {
                    setCacheSize('0.0 MB');
                    setIsCleaningCache(false);
                    showToast('تم تفريغ الذاكرة المؤقتة وتحسين سرعة الهاتف 🧹✨');
                  }, 1200);
                }}
                disabled={isCleaningCache || cacheSize === '0.0 MB'}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-600"
              >
                {isCleaningCache ? 'جاري التنظيف...' : cacheSize === '0.0 MB' ? 'تم التنظيف ✨' : 'تنظيف الآن 🧹'}
              </button>
            </div>

            {/* 4. Font Size Selector */}
            <div className="p-4 flex items-center justify-between hover:bg-purple-50/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-200 shrink-0">
                  <Type size={22} />
                </div>
                <div className="text-right">
                  <h4 className="font-black text-gray-900 text-sm">حجم الخط (Font Size)</h4>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">تخصيص حجم نصوص وقوائم GROZLA</p>
                </div>
              </div>
              <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl border border-gray-200">
                {(['small', 'medium', 'large'] as const).map(size => (
                  <button
                    key={size}
                    onClick={() => {
                      setFontSize(size);
                      showToast(`تم تغيير حجم الخط إلى: ${size === 'small' ? 'صغير' : size === 'medium' ? 'متوسط' : 'كبير'}`);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${fontSize === size ? 'bg-[#1877f2] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    {size === 'small' ? 'صغير' : size === 'medium' ? 'متوسط' : 'كبير'}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Quiet Mode */}
            <div className="p-4 flex items-center justify-between hover:bg-rose-50/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-bold shadow-md shadow-rose-200 shrink-0">
                  <BellOff size={22} />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-gray-900 text-sm">الوضع الهادئ (Quiet Mode)</h4>
                    {quietMode && (
                      <span className="text-[10px] bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 rounded-md">
                        مكتوم 🔕
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">كتم صوت التنبيهات والإشعارات لفترة مؤقتة</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setQuietMode(!quietMode);
                  showToast(!quietMode ? 'تم كتم الإشعارات بالوضع الهادئ 🔕' : 'تم استعادة صوت الإشعارات');
                }}
                className={`w-13 h-7 rounded-full p-1 transition-colors duration-200 flex items-center cursor-pointer shrink-0 ${quietMode ? 'bg-rose-500 justify-end' : 'bg-gray-300 justify-start'}`}
              >
                <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
              </button>
            </div>
          </div>
        </div>

        {/* Privacy & Security Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Shield size={18} />
              </div>
              الخصوصية والأمان (Privacy & Security)
            </h3>
            <span className="text-[11px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
              محمي بالكامل 🔒
            </span>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {/* Saved Posts Card */}
            <button 
              onClick={() => setCurrentView('saved-posts')}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50/80 hover:from-blue-100 hover:to-indigo-100/90 rounded-2xl border border-blue-200/80 transition-all shadow-xs group cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-200 shrink-0">
                  <Bookmark size={22} />
                </div>
                <div className="text-right">
                  <p className="font-black text-gray-900 text-sm">المنشورات المحفوظة</p>
                  <p className="text-xs text-gray-600 mt-0.5 font-medium">عرض واستعراض جميع منشوراتك المحفوظة للمطالعة لاحقاً</p>
                </div>
              </div>
              <ChevronLeft size={20} className="text-blue-600 group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
            </button>

            {/* Accounts Center Card */}


            {/* Blocked Accounts Card */}
            <div className="bg-gradient-to-r from-rose-50 to-orange-50/80 rounded-2xl border border-rose-200/80 overflow-hidden shadow-xs">
              <button 
                onClick={() => setShowBlockedUsers(!showBlockedUsers)}
                className="w-full flex items-center justify-between p-4 hover:bg-rose-100/60 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-200 shrink-0">
                    <Ban size={22} />
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-gray-900 text-sm">الحسابات المحظورة</p>
                      {blockedUsersList.length > 0 && (
                        <span className="bg-rose-200 text-rose-900 font-extrabold text-[10px] px-2 py-0.5 rounded-md">
                          {blockedUsersList.length} حظر
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5 font-medium">إدارة قائمة الأشخاص والحسابات التي قمت بحظرها</p>
                  </div>
                </div>
                <ChevronLeft size={20} className={`text-rose-600 transition-transform ${showBlockedUsers ? '-rotate-90' : 'rtl:rotate-180'}`} />
              </button>

              {showBlockedUsers && (
                <div className="p-4 bg-white/90 border-t border-rose-200 space-y-2.5">
                  {blockedUsersList.length > 0 ? (
                    blockedUsersList.map((user, bIdx) => (
                      <div key={user.id ? `blocked-user-${user.id}-${bIdx}` : `blocked-user-${bIdx}`} className="flex items-center justify-between p-2.5 bg-rose-50/50 border border-rose-100 rounded-xl">
                        <div className="flex items-center gap-2.5">
                          <img src={user.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-rose-200" referrerPolicy="no-referrer" />
                          <span className="font-bold text-xs sm:text-sm text-gray-900">{user.name}</span>
                        </div>
                        <button 
                          onClick={() => {
                            if (window.confirm(`هل أنت متأكد من إلغاء حظر ${user.name}؟`)) {
                              unblockUser(user.id);
                            }
                          }}
                          className="px-3 py-1 bg-white border border-rose-200 text-rose-600 text-xs font-black rounded-lg hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                        >
                          إلغاء الحظر
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 text-xs font-bold py-2">لا توجد حسابات محظورة حالياً في قائمتك.</p>
                  )}
                </div>
              )}
            </div>

            {/* مؤشر كتابة (Typing Indicator) - مباشرة تحت حظر الحساب */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-4 flex items-center justify-between shadow-xs hover:border-blue-300 transition-all">
              <div className="flex items-center gap-3.5">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shadow-md shrink-0 transition-colors ${
                  (currentUser?.typingIndicatorEnabled ?? true)
                    ? 'bg-blue-600 text-white shadow-blue-200'
                    : 'bg-gray-200 text-gray-500 shadow-gray-100'
                }`}>
                  <MessageCircle size={22} />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-gray-900 text-sm">مؤشر كتابة (Typing Indicator)</p>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                      (currentUser?.typingIndicatorEnabled ?? true)
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {(currentUser?.typingIndicatorEnabled ?? true) ? 'مفعل (تشغيل)' : 'معطل (إيقاف)'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5 font-medium">إظهار مؤشر الكتابة التفاعلي وتحته رسالة أثناء كتابة الرسائل في الدردشات</p>
                </div>
              </div>
              
              {/* أيقونة تشغيل وإيقاف */}
              <button
                type="button"
                onClick={() => {
                  const currentVal = currentUser?.typingIndicatorEnabled ?? true;
                  const newVal = !currentVal;
                  updateProfile({ typingIndicatorEnabled: newVal });
                  showToast(newVal ? 'تم تشغيل مؤشر الكتابة ✅' : 'تم إيقاف مؤشر الكتابة ⏸️');
                }}
                className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 flex items-center cursor-pointer shrink-0 ${
                  (currentUser?.typingIndicatorEnabled ?? true)
                    ? 'bg-blue-600 justify-end'
                    : 'bg-gray-300 justify-start'
                }`}
                title={(currentUser?.typingIndicatorEnabled ?? true) ? 'إيقاف مؤشر الكتابة' : 'تشغيل مؤشر الكتابة'}
              >
                <motion.div 
                  layout
                  className="w-6 h-6 rounded-full bg-white shadow-xs flex items-center justify-center text-[10px] font-bold"
                >
                  {(currentUser?.typingIndicatorEnabled ?? true) ? (
                    <Power size={13} className="text-blue-600" />
                  ) : (
                    <PowerOff size={13} className="text-gray-400" />
                  )}
                </motion.div>
              </button>
            </div>
          </div>
        </div>

        {/* Multi-Account Management & Switching (ميزة تبديل الحسابات وإدارتها) */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200/90 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-gray-900">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs border border-blue-100">
                <Users size={20} />
              </div>
              <div>
                <h3 className="font-black text-sm text-gray-900">إدارة الحسابات وتبديل المستخدمين</h3>
                <p className="text-[11px] font-semibold text-gray-500">إدارة وتبديل أكثر من حساب على هذا الجهاز</p>
              </div>
            </div>
            <span className="text-[11px] font-black bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
              {savedAccountsList.length > 0 ? `${savedAccountsList.length} حسابات محفوظة` : 'حساب واحد'}
            </span>
          </div>

          {/* Current Active Account */}
          {currentUser && (
            <div className="p-3.5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-2xl border-2 border-blue-500/40 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <img 
                    src={currentUser.avatar || DEFAULT_AVATAR} 
                    alt={currentUser.name}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-blue-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-black text-sm text-gray-900 truncate">{currentUser.name}</h4>
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">نشط الآن</span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium truncate">{currentUser.email || currentUser.phone || 'الحساب الحالي'}</p>
                </div>
              </div>
              <div className="text-xs font-black text-blue-600 bg-white px-2.5 py-1 rounded-xl shadow-xs border border-blue-100 shrink-0 mr-2">
                الحالي
              </div>
            </div>
          )}

          {/* Other Saved Accounts */}
          {savedAccountsList
            .filter((acc: any) => acc.uid !== (currentUser?.uid || currentUser?.id) && acc.email !== currentUser?.email)
            .length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-bold text-gray-700">حساباتك الأخرى الجاهزة للتبديل الفوري:</p>
              <div className="space-y-2">
                {savedAccountsList
                  .filter((acc: any) => acc.uid !== (currentUser?.uid || currentUser?.id) && acc.email !== currentUser?.email)
                  .map((acc: any, idx: number) => (
                    <div 
                      key={acc.uid || acc.id || idx}
                      className="p-3 bg-gray-50 hover:bg-gray-100/90 rounded-2xl border border-gray-200/90 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img 
                          src={acc.avatar || DEFAULT_AVATAR} 
                          alt={acc.name}
                          className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-300 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <h4 className="font-black text-xs text-gray-900 truncate">{acc.name || 'مستخدم محفوظ'}</h4>
                          <p className="text-[11px] text-gray-500 truncate">{acc.email || acc.phone || 'حساب محفوظ'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 mr-2">
                        <button
                          type="button"
                          onClick={() => {
                            switchAccount(acc.uid || acc.id);
                          }}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <LogIn size={13} />
                          <span>تبديل</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            removeSavedAccount(acc.uid || acc.id || acc.email);
                            refreshSavedAccounts();
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="إزالة الحساب من قائمة التبديل"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Add / Login with Another Account */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                logout();
                showToast('يرجى تسجيل الدخول بحسابك الآخر لإضافته وتبديله في أي وقت');
              }}
              className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 active:scale-98 text-gray-800 font-bold text-xs rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-gray-200"
            >
              <UserPlus size={16} className="text-blue-600" />
              <span>تسجيل الدخول بحساب آخر أو إضافة حساب جديد</span>
            </button>
          </div>
        </div>

        {/* Account Actions & Logout */}
        <div className="pt-2 space-y-2">
          <button 
            onClick={handleLogoutClick}
            className="w-full flex items-center justify-center gap-2 p-3.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-2xl font-black text-sm transition-all shadow-md shadow-red-200 cursor-pointer active:scale-98"
          >
            <LogOut size={20} />
            تسجيل الخروج من الحساب الحالي
          </button>
        </div>
      </div>

      

      {/* Language Selection Modal */}
      <AnimatePresence>
        {showLanguageModal && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[88vh]"
              dir={direction}
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/70 to-indigo-50/70">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#1877f2] text-white flex items-center justify-center shadow-md shadow-blue-200">
                    <Globe size={22} />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-base">{t('choose_language', 'اختيار اللغة')}</h3>
                    <p className="text-[11px] text-gray-500 font-medium">GROZLA Global Languages</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowLanguageModal(false)}
                  className="w-9 h-9 rounded-full bg-white text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Language Search Bar */}
              <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50/60">
                <div className="relative">
                  <Search size={18} className={`absolute ${direction === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} />
                  <input
                    type="text"
                    value={languageSearchQuery}
                    onChange={(e) => setLanguageSearchQuery(e.target.value)}
                    placeholder={t('search_language', 'ابحث عن لغة...')}
                    className={`w-full py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 placeholder-gray-400 outline-none focus:border-[#1877f2] focus:ring-2 focus:ring-blue-100 transition-all ${
                      direction === 'rtl' ? 'pr-9 pl-8 text-right' : 'pl-9 pr-8 text-left'
                    }`}
                  />
                  {languageSearchQuery && (
                    <button
                      onClick={() => setLanguageSearchQuery('')}
                      className={`absolute ${direction === 'rtl' ? 'left-2.5' : 'right-2.5'} top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full`}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Languages List */}
              <div className="flex-1 overflow-y-auto p-2 sm:p-3 divide-y divide-gray-100">
                {/* Popular Languages Section */}
                {!languageSearchQuery && (
                  <div className="pb-3 mb-2">
                    <p className="text-[11px] font-extrabold text-gray-400 px-3 py-1.5 uppercase tracking-wider">
                      {t('popular_languages', 'اللغات الشائعة')}
                    </p>
                    <div className="space-y-1 mt-1">
                      {ALL_LANGUAGES.filter(l => l.popular).map((lang, pIdx) => {
                        const isSelected = language === lang.code || (lang.code === 'en-GB' && language === 'en-GB') || (lang.code === 'ar' && language === 'ar');
                        return (
                          <button
                            key={`settings-pop-lang-${lang.code}-${pIdx}`}
                            onClick={() => {
                              setAppLanguage(lang.code);
                              setShowLanguageModal(false);
                              showToast(`تم تغيير اللغة إلى: ${lang.nativeName} 🌐`);
                            }}
                            className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-purple-50 border border-purple-200/80 text-[#8b5cf6] font-black' 
                                : 'hover:bg-gray-50 text-gray-700 font-bold'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs uppercase ${
                                isSelected ? 'bg-[#8b5cf6] text-white' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {lang.code.slice(0, 2)}
                              </div>
                              <div className={direction === 'rtl' ? 'text-right' : 'text-left'}>
                                <div className="text-sm font-black">{lang.nativeName}</div>
                                <div className="text-[11px] text-gray-400 font-medium">{lang.name}</div>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="w-6 h-6 rounded-full bg-[#8b5cf6] text-white flex items-center justify-center shadow-xs">
                                <Check size={14} strokeWidth={3} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* All / Filtered Languages List */}
                <div className="pt-2">
                  {!languageSearchQuery && (
                    <p className="text-[11px] font-extrabold text-gray-400 px-3 py-1.5 uppercase tracking-wider">
                      {t('all_languages', 'جميع اللغات')}
                    </p>
                  )}
                  <div className="space-y-1 mt-1">
                    {filteredLanguages.map((lang, aIdx) => {
                      const isSelected = language === lang.code;
                      return (
                        <button
                          key={`settings-all-lang-${lang.code}-${aIdx}`}
                          onClick={() => {
                            setAppLanguage(lang.code);
                            setShowLanguageModal(false);
                            showToast(`تم تغيير اللغة إلى: ${lang.nativeName} 🌐`);
                          }}
                          className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-purple-50 border border-purple-200/80 text-[#8b5cf6] font-black' 
                              : 'hover:bg-gray-50 text-gray-700 font-bold'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs uppercase ${
                              isSelected ? 'bg-[#8b5cf6] text-white' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {lang.code.slice(0, 2)}
                            </div>
                            <div className={direction === 'rtl' ? 'text-right' : 'text-left'}>
                              <div className="text-sm font-black">{lang.nativeName}</div>
                              <div className="text-[11px] text-gray-400 font-medium">{lang.name}</div>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-[#1877f2] text-white flex items-center justify-center shadow-xs">
                              <Check size={14} strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Alert Modal */}
      {alertMessage && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl w-full max-w-sm p-5 shadow-2xl text-center"
          >
            <p className="text-lg font-bold text-gray-800 mb-6">{alertMessage}</p>
            <button 
              onClick={() => setAlertMessage('')}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
            >
              حسناً
            </button>
          </motion.div>
        
      {showJRPOHModal && <JRPOHModal onClose={() => setShowJRPOHModal(false)} />}
    </div>
      )}

      {/* App Launcher & Saver Modal */}
      <AppLauncherAndSaverModal
        isOpen={showAppEngineModal}
        onClose={() => setShowAppEngineModal(false)}
        defaultTab={appEngineDefaultTab}
      />

      {/* Dedicated Accounts Center Modal */}
      <AccountsCenterModal
        isOpen={showAccountsCenterModal}
        onClose={() => setShowAccountsCenterModal(false)}
      />

      {/* Android Package Installer Modal */}
      <AndroidPackageInstaller
        isOpen={showAndroidInstaller}
        onClose={() => setShowAndroidInstaller(false)}
        deferredPrompt={deferredPrompt}
        onDownloadApkFile={handleDownloadAppFile}
      />

      {/* External APK Mobile Installer System Modal */}
      <ExternalApkInstallerModal
        isOpen={showExternalApkModal}
        onClose={() => setShowExternalApkModal(false)}
        deferredPrompt={deferredPrompt}
      />

      {/* Dedicated GROZLA APK Official Download & AI Packaging Center */}
      <GrozlaApkDownloadCenter
        isOpen={showGrozlaApkCenter}
        onClose={() => setShowGrozlaApkCenter(false)}
      />
    </motion.div>
  );
}
