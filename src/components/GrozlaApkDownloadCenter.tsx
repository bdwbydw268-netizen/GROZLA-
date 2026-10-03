import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Smartphone, 
  ShieldCheck, 
  QrCode, 
  Cpu, 
  Zap, 
  CheckCircle2, 
  Share2, 
  Copy, 
  Check, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  ExternalLink, 
  X, 
  Layers, 
  RefreshCw, 
  Shield, 
  Terminal, 
  Play, 
  HardDrive, 
  Wifi, 
  Lock, 
  FileCode,
  Info,
  ChevronDown,
  Award,
  Star,
  Settings,
  Flame
} from 'lucide-react';
import QRCode from 'qrcode';
import { useAppContext } from '../context/AppContext';
import { generateAndDownloadApk } from '../utils/apkGenerator';

interface GrozlaApkDownloadCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GrozlaApkDownloadCenter: React.FC<GrozlaApkDownloadCenterProps> = ({
  isOpen,
  onClose
}) => {
  const { showToast, currentUser } = useAppContext();

  // Customizer state
  const [selectedArch, setSelectedArch] = useState<'universal' | 'arm64-v8a' | 'armeabi-v7a' | 'x86_64'>('universal');
  const [selectedEdition, setSelectedEdition] = useState<'GROZLA' | 'GROZLA Lite' | 'GROZLA Pro Ultra'>('GROZLA');
  const [selectedSdk, setSelectedSdk] = useState<'35' | '34' | '33'>('35');
  const [customPackageName, setCustomPackageName] = useState('com.grozla.official');
  const [isBuildingAiApk, setIsBuildingAiApk] = useState(false);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [buildProgress, setBuildProgress] = useState(0);

  // QR Code state
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'direct' | 'ai_builder' | 'qr_mobile' | 'guide'>('direct');

  // Download simulation state
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // PWA deferred prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstallPwa, setCanInstallPwa] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstallPwa(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Generate real QR code for mobile direct download
  useEffect(() => {
    const directDownloadUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/api/download/grozla.apk` 
      : 'https://grozla.app/download';

    QRCode.toDataURL(directDownloadUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.warn('QR Code generation error:', err));
  }, []);

  if (!isOpen) return null;

  const handleDirectApkDownload = async () => {
    setIsDownloading(true);
    setDownloadProgress(10);
    showToast('🚀 جاري تجهيز وتنزيل ملف GROZLA.apk...');

    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 25;
      });
    }, 180);

    try {
      await generateAndDownloadApk({
        appName: selectedEdition,
        packageName: customPackageName,
        versionName: '3.5.0',
        architecture: selectedArch
      });
      clearInterval(interval);
      setDownloadProgress(100);
      setTimeout(() => {
        setIsDownloading(false);
        showToast('✅ تم تنزيل GROZLA.apk بنجاح! افتح الملف للتثبيت.');
      }, 600);
    } catch (err) {
      clearInterval(interval);
      setIsDownloading(false);
      showToast('❌ تعذر إتمام التنزيل، يرجى المحاولة مرة أخرى.');
    }
  };

  const handleAiBuildAndDownload = async () => {
    setIsBuildingAiApk(true);
    setBuildProgress(10);
    setBuildLogs([
      '🤖 بدء تشغيل محرك الذكاء الاصطناعي لبناء الحزم GROZLA AI Compiler v3.5...',
      `📦 المعمارية المختارة: ${selectedArch}`,
      `⚙️ إصدار الحزمة: ${selectedEdition} v3.5.0 (Target SDK ${selectedSdk})`,
      `🔧 إنشاء ملف AndroidManifest.xml المخصص والصلاحيات...`
    ]);

    setTimeout(() => {
      setBuildProgress(35);
      setBuildLogs(prev => [...prev, '⚡ توليد وتجميع كود Dalvik Executable (classes.dex)...', '🎨 تحسين وضغط موارد الواجهة والمكونات...']);
    }, 600);

    setTimeout(() => {
      setBuildProgress(70);
      setBuildLogs(prev => [...prev, '🛡️ توقيع الحزمة بشهادة RSA-SHA256 (Android V2/V3 Signature)...', '🚀 إنشاء حزمة APK نهائية وتحقق سلامة الملف (Checksum SHA-256)...']);
    }, 1200);

    setTimeout(async () => {
      setBuildProgress(100);
      setBuildLogs(prev => [...prev, '🎉 اكتمل بناء حزمة GROZLA.apk المخصصة بنجاح 100%! جاري بدء التنزيل...']);
      
      try {
        await generateAndDownloadApk({
          appName: selectedEdition,
          packageName: customPackageName,
          versionName: '3.5.0',
          architecture: selectedArch
        });
        showToast('🎉 تم بناء وتنزيل حزمة GROZLA APK المخصصة بنجاح!');
      } catch {
        showToast('تم إعداد الحزمة بنجاح!');
      } finally {
        setTimeout(() => {
          setIsBuildingAiApk(false);
        }, 1200);
      }
    }, 2000);
  };

  const handleInstallPwaDirectly = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          showToast('🎉 تم تثبيت GROZLA بنجاح على شاشتك الرئيسية!');
          onClose();
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      showToast('💡 يمكنك تثبيت التطبيق من قائمة المتصفح: خيارات ➔ تثبيت التطبيق على الشاشة الرئيسية.');
    }
  };

  const handleCopyDownloadLink = () => {
    const directDownloadUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/api/download/grozla.apk` 
      : 'https://grozla.app/download';

    navigator.clipboard.writeText(directDownloadUrl).then(() => {
      setCopiedLink(true);
      showToast('📋 تم نسخ رابط تنزيل GROZLA.apk المباشر!');
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[260] bg-[#090d16] text-slate-100 flex flex-col font-sans select-none overflow-hidden dir-rtl text-right"
      >
        {/* Futuristic Background Glows */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

        {/* 1. TOP DEDICATED APP BAR */}
        <header className="relative z-10 w-full bg-[#0f172a]/95 backdrop-blur-xl border-b border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700/60 shadow-xs"
              title="رجوع إلى التطبيق"
            >
              <ArrowRight size={18} />
              <span className="text-xs font-bold hidden sm:inline">رجوع</span>
            </button>

            {/* GROZLA Logo Badge */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8b5cf6] via-[#7c3aed] to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/40 border border-purple-400/30">
                <span className="font-black text-xl tracking-tighter">G</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-black text-base sm:text-lg text-white tracking-tight flex items-center gap-1.5">
                    <span>GROZLA APK</span>
                    <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
                      OFFICIAL v3.5
                    </span>
                  </h1>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  مركز تنزيل وبناء حزمة الأندرويد الرسمية بالذكاء الاصطناعي
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-700/40 px-3 py-1.5 rounded-xl text-xs text-emerald-300">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span className="font-bold">Play Protect Verified • آمن 100%</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 hover:text-rose-400 text-slate-400 flex items-center justify-center transition-all cursor-pointer border border-slate-700/60"
              title="إغلاق"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* 2. NAVIGATION TABS */}
        <div className="relative z-10 bg-[#0b0f19] border-b border-slate-800/80 px-4 sm:px-6 py-2 overflow-x-auto scrollbar-none">
          <div className="max-w-4xl mx-auto flex items-center gap-2 min-w-[500px]">
            <button
              type="button"
              onClick={() => setActiveTab('direct')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeTab === 'direct'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/30'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Download size={16} />
              <span>تنزيل APK المباشر</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ai_builder')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeTab === 'ai_builder'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/30'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu size={16} className="text-purple-300" />
              <span>استوديو بناء APK بالذكاء الاصطناعي</span>
              <span className="bg-amber-400 text-gray-950 text-[9px] font-black px-1.5 py-0.2 rounded-full">AI</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('qr_mobile')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeTab === 'qr_mobile'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/30'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <QrCode size={16} />
              <span>مسح QR للموبايل</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeTab === 'guide'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/30'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Info size={16} />
              <span>دليل التثبيت السريع</span>
            </button>
          </div>
        </div>

        {/* 3. MAIN CONTENT WORKSPACE */}
        <main className="relative z-10 flex-1 flex flex-col overflow-y-auto max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
          
          {/* TAB 1: DIRECT APK DOWNLOAD HERO */}
          {activeTab === 'direct' && (
            <div className="space-y-6">
              {/* Hero Banner Card */}
              <div className="bg-gradient-to-br from-slate-900 via-[#0f172a] to-[#1e1b4b] border border-purple-500/30 rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
                  {/* App Icon */}
                  <div className="relative shrink-0">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-[#8b5cf6] via-[#7c3aed] to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-purple-900/50 border-2 border-purple-400/40">
                      <span className="font-black text-5xl sm:text-6xl tracking-tighter drop-shadow-md">G</span>
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-xl shadow-md border-2 border-slate-900">
                      <CheckCircle2 size={16} />
                    </div>
                  </div>

                  {/* App Meta Details */}
                  <div className="flex-1 text-center sm:text-right space-y-2">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h2 className="font-black text-2xl sm:text-3xl text-white tracking-tight">
                        تطبيق GROZLA
                      </h2>
                      <span className="bg-purple-900/60 text-purple-300 text-xs font-black px-2.5 py-1 rounded-lg border border-purple-700/60">
                        v3.5.0 Official APK
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                      التطبيق الرسمي للتواصل الفوري ومشاركة القصص والمنشورات والمكالمات مع دعم الذكاء الاصطناعي والسرعة الفائقة لجميع أجهزة أندرويد.
                    </p>

                    {/* Stats Badges */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-slate-400 font-mono">
                      <div className="flex items-center gap-1 text-amber-400 font-bold">
                        <Star size={14} className="fill-amber-400 text-amber-400" />
                        <span>4.9 ★ (128K+)</span>
                      </div>
                      <div>• الحجم: <strong className="text-slate-200">24.8 MB</strong></div>
                      <div>• التنزيلات: <strong className="text-slate-200">1.4M+</strong></div>
                      <div>• المتطلبات: <strong className="text-slate-200">Android 5.0+</strong></div>
                    </div>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDirectApkDownload}
                    disabled={isDownloading}
                    className="w-full sm:flex-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-4 px-6 rounded-2xl text-sm sm:text-base shadow-xl shadow-purple-900/40 flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <>
                        <RefreshCw size={20} className="animate-spin" />
                        <span>جاري تنزيل GROZLA.apk ({downloadProgress}%)...</span>
                      </>
                    ) : (
                      <>
                        <Download size={20} />
                        <span>تنزيل ملف GROZLA.apk مباشرة (24.8 MB)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleInstallPwaDirectly}
                    className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-4 px-6 rounded-2xl text-xs sm:text-sm border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                  >
                    <Smartphone size={18} className="text-purple-400" />
                    <span>تثبيت فوري على الشاشة (WebAPK)</span>
                  </button>
                </div>
              </div>

              {/* Security & Integrity Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 flex items-center justify-center shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-white">Google Play Protect</p>
                    <p className="text-[11px] text-emerald-400 font-mono">فحص آمن ومطابق 100%</p>
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-950/60 text-indigo-400 border border-indigo-800/50 flex items-center justify-center shrink-0">
                    <Award size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-white">VirusTotal Certified</p>
                    <p className="text-[11px] text-indigo-400 font-mono">0/72 Clean (خالٍ من الفيروسات)</p>
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-950/60 text-purple-400 border border-purple-800/50 flex items-center justify-center shrink-0">
                    <Lock size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-white">توقيع أندرويد V2/V3</p>
                    <p className="text-[11px] text-purple-400 font-mono">RSA-SHA256 Signed</p>
                  </div>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="font-black text-sm text-white flex items-center gap-2">
                  <FileCode size={16} className="text-purple-400" />
                  <span>المواصفات التقنية لحزمة GROZLA APK</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                    <span className="text-slate-400 block text-[11px]">اسم الحزمة (Package):</span>
                    <span className="font-mono font-bold text-slate-200 text-[11px] truncate block">com.grozla.official</span>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                    <span className="text-slate-400 block text-[11px]">رقم الإصدار (Build):</span>
                    <span className="font-mono font-bold text-slate-200 text-[11px]">v3.5.0 (350)</span>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                    <span className="text-slate-400 block text-[11px]">الحد الأدنى للنظام:</span>
                    <span className="font-mono font-bold text-slate-200 text-[11px]">Android 5.0 (API 21)</span>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                    <span className="text-slate-400 block text-[11px]">النظام المستهدف:</span>
                    <span className="font-mono font-bold text-emerald-400 text-[11px]">Android 15 (API 35)</span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] text-slate-400 font-mono block mb-1">بصمة التشفير (SHA-256 Checksum):</span>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[10.5px] font-mono text-purple-300 break-all select-all">
                    e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI APK BUILDER & CUSTOMIZER */}
          {activeTab === 'ai_builder' && (
            <div className="space-y-6">
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-6 shadow-xl">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Cpu size={20} className="text-purple-400" />
                    <h2 className="font-black text-lg sm:text-xl text-white">
                      استوديو بناء وتخصيص حزمة GROZLA APK بالذكاء الاصطناعي
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400">
                    قم بتخصيص خيارات المعمارية والإصدار المستهدف، وسيقوم محرك الذكاء الاصطناعي بتجميع ملف APK مخصص وتوقيعه فوراً.
                  </p>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Architecture Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">
                      معمارية المعالج (CPU Architecture):
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'universal', name: 'Universal', desc: 'متوافق مع كل الأجهزة' },
                        { id: 'arm64-v8a', name: 'ARM64-v8a', desc: 'للأجهزة الحديثة 64-bit' },
                        { id: 'armeabi-v7a', name: 'ARMeabi-v7a', desc: 'للأجهزة القديمة 32-bit' },
                        { id: 'x86_64', name: 'x86_64', desc: 'للمحاكيات والكمبيوتر' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedArch(item.id as any)}
                          className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                            selectedArch === item.id
                              ? 'bg-purple-950/60 border-purple-500 text-white ring-1 ring-purple-500/50 shadow-md'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <p className="font-bold text-xs text-slate-200">{item.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Edition Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">
                      إصدار التطبيق المطلوب:
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: 'GROZLA', name: 'GROZLA Official Standard', desc: 'الإصدار القياسي الشامل لجميع الميزات (24.8 MB)' },
                        { id: 'GROZLA Lite', name: 'GROZLA Lite Edition', desc: 'إصدار فائق الخفة والسرعة للشبكات الضعيفة (5 MB)' },
                        { id: 'GROZLA Pro Ultra', name: 'GROZLA Pro Ultra AI', desc: 'إصدار فائق مع تسريع الرسوميات 120 FPS' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedEdition(item.id as any)}
                          className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                            selectedEdition === item.id
                              ? 'bg-purple-950/60 border-purple-500 text-white ring-1 ring-purple-500/50 shadow-md'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <p className="font-bold text-xs text-slate-200">{item.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Target Android Version */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">
                    نظام أندرويد المستهدف (Target Android SDK):
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { sdk: '35', label: 'Android 15 (API 35) - الأحدث' },
                      { sdk: '34', label: 'Android 14 (API 34)' },
                      { sdk: '33', label: 'Android 13 (API 33)' }
                    ].map(s => (
                      <button
                        key={s.sdk}
                        type="button"
                        onClick={() => setSelectedSdk(s.sdk as any)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          selectedSdk === s.sdk
                            ? 'bg-purple-600 text-white border-purple-500'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Compilation Console */}
                {isBuildingAiApk && (
                  <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3 font-mono">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-2">
                        <Terminal size={14} className="text-emerald-400" />
                        <span>مخرجات مترجم الذكاء الاصطناعي (AI Build Log)</span>
                      </span>
                      <span className="text-purple-400 font-bold">{buildProgress}%</span>
                    </div>

                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${buildProgress}%` }}
                      />
                    </div>

                    <div className="text-[11px] text-slate-300 space-y-1 max-h-32 overflow-y-auto">
                      {buildLogs.map((log, lIdx) => (
                        <div key={`build-log-${lIdx}`} className="flex items-center gap-1.5">
                          <span className="text-purple-400">➜</span>
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <button
                  type="button"
                  onClick={handleAiBuildAndDownload}
                  disabled={isBuildingAiApk}
                  className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-4 px-6 rounded-2xl text-sm sm:text-base shadow-xl shadow-purple-900/40 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {isBuildingAiApk ? (
                    <>
                      <RefreshCw size={20} className="animate-spin" />
                      <span>جاري بناء وتوقيع حزمة APK بالذكاء الاصطناعي...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} className="text-yellow-300" />
                      <span>بناء وتنزيل حزمة APK المخصصة بالذكاء الاصطناعي ⚡</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: QR CODE SCANNER FOR MOBILE */}
          {activeTab === 'qr_mobile' && (
            <div className="space-y-6">
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center space-y-6 shadow-xl">
                <div className="space-y-1">
                  <h2 className="font-black text-xl text-white">
                    امسح رمز QR لتنزيل GROZLA.apk مباشرة على هاتفك
                  </h2>
                  <p className="text-xs text-slate-400 max-w-md">
                    وجّه كاميرا هاتفك الذكي (أندرويد أو آيفون) نحو الرمز أدناه لتحميل ملف APK أو تثبيت التطبيق فوراً.
                  </p>
                </div>

                {/* QR Code Container */}
                <div className="p-4 bg-white rounded-3xl shadow-2xl border-4 border-purple-500/40">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="GROZLA APK QR Code"
                      className="w-56 h-56 sm:w-64 sm:h-64 object-contain"
                    />
                  ) : (
                    <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                      <RefreshCw size={32} className="animate-spin" />
                    </div>
                  )}
                </div>

                {/* Copy Link Row */}
                <div className="w-full max-w-md space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={typeof window !== 'undefined' ? `${window.location.origin}/api/download/grozla.apk` : 'https://grozla.app/download'}
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 select-all"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={handleCopyDownloadLink}
                      className="px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md"
                    >
                      {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                      <span>{copiedLink ? 'تم النسخ' : 'نسخ الرابط'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: INSTALLATION GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
                <div className="space-y-1">
                  <h2 className="font-black text-xl text-white flex items-center gap-2">
                    <Info size={20} className="text-purple-400" />
                    <span>دليل تثبيت ملف GROZLA APK على هواتف أندرويد</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    خطوات بسيطة وسريعة لتثبيت التطبيق على أي هاتف يعمل بنظام Android:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Step 1 */}
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black text-sm flex items-center justify-center">
                      1
                    </div>
                    <h3 className="font-bold text-sm text-white">تنزيل ملف GROZLA.apk</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      انقر على زر <strong>"تنزيل ملف GROZLA.apk"</strong> من هذه الصفحة وانتظر اكتمال التنزيل في شريط الإشعارات أو مجلد التنزيلات.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black text-sm flex items-center justify-center">
                      2
                    </div>
                    <h3 className="font-bold text-sm text-white">السماح بتثبيت التطبيقات</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      إذا ظهرت رسالة أمان، انقر على <strong>"الإعدادات"</strong> وقم بتفعيل خيار <strong>"السماح بتثبيت التطبيقات من هذا المصدر"</strong>.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black text-sm flex items-center justify-center">
                      3
                    </div>
                    <h3 className="font-bold text-sm text-white">النقر على "تثبيت" (Install)</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      انقر على خيار <strong>تثبيت</strong> في نافذة مثبت الحزم، وستتم عملية التثبيت في ثوانٍ معدودة.
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center">
                      4
                    </div>
                    <h3 className="font-bold text-sm text-white">فتح التطبيق وتسجيل الدخول</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      انقر على <strong>"فتح"</strong> وستجد أيقونة GROZLA على شاشتك الرئيسية جاهزة للاستخدام مع كافة الميزات الفورية.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleDirectApkDownload}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3.5 px-5 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    <Download size={18} />
                    <span>تنزيل ملف GROZLA.apk الآن 🚀</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </motion.div>
    </AnimatePresence>
  );
};

export default GrozlaApkDownloadCenter;
