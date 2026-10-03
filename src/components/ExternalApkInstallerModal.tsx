import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  Download, 
  ArrowDownToLine, 
  QrCode, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  ShieldCheck, 
  Zap, 
  Layers, 
  Share2, 
  Sparkles, 
  HardDrive, 
  Wifi, 
  ChevronRight, 
  Info, 
  Cpu, 
  FileCode2 
} from 'lucide-react';
import QRCode from 'qrcode';
import { generateAndDownloadApk } from '../utils/apkGenerator';
import { useAppContext } from '../context/AppContext';

interface ExternalApkInstallerModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
}

export default function ExternalApkInstallerModal({
  isOpen,
  onClose,
  deferredPrompt: initialPrompt
}: ExternalApkInstallerModalProps) {
  const { showToast } = useAppContext();
  const [activeTab, setActiveTab] = useState<'install' | 'download_apk' | 'qr_mobile' | 'guide'>('install');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(initialPrompt || null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isGeneratingApk, setIsGeneratingApk] = useState(false);
  const [apkDownloadProgress, setApkDownloadProgress] = useState(0);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [hasCopiedUrl, setHasCopiedUrl] = useState(false);
  const [isInstalledStandalone, setIsInstalledStandalone] = useState(false);

  // Determine current top-level URL
  const appUrl = typeof window !== 'undefined' ? window.location.href : 'https://grozla.app';

  useEffect(() => {
    // Check if running in standalone mode (already installed like native app)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    setIsInstalledStandalone(isStandalone);

    // Listen for beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Generate high-resolution QR code
    QRCode.toDataURL(appUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#1877f2',
        light: '#ffffff'
      }
    }).then((url) => {
      setQrCodeDataUrl(url);
    }).catch((err) => {
      console.error('QR code generation error:', err);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [appUrl]);

  if (!isOpen) return null;

  // Trigger Native WebAPK / PWA installation on mobile
  const handleTriggerNativeInstall = async () => {
    setIsInstalling(true);
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          showToast('🎉 تم قبول التثبيت! جاري تثبيت حزمة GROZLA على هاتفك...');
          setDeferredPrompt(null);
        } else {
          showToast('ℹ️ تم إلغاء التثبيت من قِبل المستخدم.');
        }
      } catch (err) {
        console.error('Install prompt error:', err);
        showToast('🚀 يرجى النقر على زر فتح في متصفح خارجي لإتمام التثبيت.');
      }
      setIsInstalling(false);
    } else {
      // If inside iframe or prompt unavailable, open standalone URL in new tab to prompt
      setTimeout(() => {
        setIsInstalling(false);
        const newWindow = window.open(appUrl, '_blank');
        if (!newWindow) {
          window.location.href = appUrl;
        }
        showToast('📱 تم فتح التطبيق في المتصفح الخارجي لتثبيته مباشرة!');
      }, 500);
    }
  };

  // Download genuine APK binary archive
  const handleDownloadApk = async () => {
    setIsGeneratingApk(true);
    setApkDownloadProgress(15);
    
    const progressTimer = setInterval(() => {
      setApkDownloadProgress((prev) => {
        if (prev >= 85) {
          clearInterval(progressTimer);
          return 90;
        }
        return prev + 25;
      });
    }, 200);

    try {
      await generateAndDownloadApk({
        appName: 'GROZLA',
        packageName: 'com.grozla.app',
        versionName: '1.0.0',
        versionCode: 100
      });
      clearInterval(progressTimer);
      setApkDownloadProgress(100);
      showToast('✅ تم تنزيل حزمة GROZLA_v1.0.0_Official.apk بنجاح!');
    } catch (error) {
      console.error('APK generation failed:', error);
      showToast('❌ حدث خطأ أثناء تجهيز ملف APK.');
    } finally {
      setTimeout(() => {
        setIsGeneratingApk(false);
        setApkDownloadProgress(0);
      }, 1500);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setHasCopiedUrl(true);
    showToast('📋 تم نسخ رابط التثبيت المباشر بنجاح!');
    setTimeout(() => setHasCopiedUrl(false), 2500);
  };

  return (
    <AnimatePresence>
      <div 
        id="external-apk-modal-overlay"
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-2 sm:p-4 dir-rtl font-sans select-none overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22 }}
          className="bg-[#1e2024] text-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-blue-500/30 flex flex-col max-h-[92vh]"
        >
          {/* Top Header */}
          <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 px-5 py-4 border-b border-gray-700/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/40">
                <Smartphone size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white">نظام تثبيت حزم APK الخارجية</h3>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                    MOBILE
                  </span>
                </div>
                <p className="text-[11px] text-gray-300 font-medium">
                  تثبيت وتشغيل GROZLA على الموبايل كتطبيق عادي رسمي
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-800 bg-[#16171a] p-1.5 gap-1 text-xs font-bold shrink-0 overflow-x-auto">
            <button
              onClick={() => setActiveTab('install')}
              className={`flex-1 min-w-[100px] py-2.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'install'
                  ? 'bg-[#1877f2] text-white shadow-md shadow-blue-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Zap size={14} />
              <span>التثبيت الفوري</span>
            </button>
            <button
              onClick={() => setActiveTab('download_apk')}
              className={`flex-1 min-w-[100px] py-2.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'download_apk'
                  ? 'bg-[#1877f2] text-white shadow-md shadow-blue-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <ArrowDownToLine size={14} />
              <span>تنزيل APK</span>
            </button>
            <button
              onClick={() => setActiveTab('qr_mobile')}
              className={`flex-1 min-w-[100px] py-2.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'qr_mobile'
                  ? 'bg-[#1877f2] text-white shadow-md shadow-blue-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <QrCode size={14} />
              <span>مسح بالهاتف</span>
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`flex-1 min-w-[100px] py-2.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'guide'
                  ? 'bg-[#1877f2] text-white shadow-md shadow-blue-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Info size={14} />
              <span>دليل التثبيت</span>
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
            {/* TAB 1: INSTANT ONE-CLICK INSTALL */}
            {activeTab === 'install' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {/* App Showcase Card */}
                <div className="bg-[#26282e] p-4 rounded-2xl border border-gray-700 flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 bg-[#1877f2] rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-blue-500/40 border border-white/20">
                      G
                    </div>
                    <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded border border-[#26282e]">
                      PRO
                    </span>
                  </div>
                  <div className="space-y-1 text-right">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-white">GROZLA Lite Mobile</h4>
                      <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        v1.0.0
                      </span>
                    </div>
                    <p className="text-xs font-mono text-gray-400">حزمة النظام: com.grozla.app</p>
                    <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-bold">
                      <ShieldCheck size={13} />
                      <span>جاهز للتثبيت والاستخدام المباشر مثل التطبيقات العادية</span>
                    </div>
                  </div>
                </div>

                {/* Standalone Status Notice */}
                {isInstalledStandalone ? (
                  <div className="bg-emerald-900/30 border border-emerald-500/50 p-3 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs">
                    <ShieldCheck size={20} className="shrink-0 text-emerald-400" />
                    <span>أنت الآن تشغّل تطبيق GROZLA في وضع التطبيق المستقل (Standalone)! التطبيق مثبت ويعمل بكامل طاقته.</span>
                  </div>
                ) : (
                  <div className="bg-blue-950/40 border border-blue-500/40 p-3.5 rounded-2xl text-xs text-blue-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-white">
                      <Smartphone size={16} className="text-blue-400" />
                      <span>كيف يعمل التطبيق على موبايلك مثل التطبيقات الأخرى؟</span>
                    </div>
                    <p className="text-gray-300 text-[11px] leading-relaxed">
                      عند تثبيت التطبيق عبر زر التثبيت، يتم دمجه في نظام تشغيل هاتفك (Android / iOS): تظهر أيقونة التطبيق في قائمة التطبيقات والشاشة الرئيسية، ويفتح بملء الشاشة بدون شريط متصفح وبسرعة استجابة فائقة مع حفظ البيانات للعمل أوفلاين.
                    </p>
                  </div>
                )}

                {/* Native Actions */}
                <div className="space-y-2.5 pt-1">
                  <button
                    id="trigger-webapk-install-btn"
                    onClick={handleTriggerNativeInstall}
                    disabled={isInstalling}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 active:scale-98 rounded-2xl font-black text-sm text-white shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-75"
                  >
                    <Smartphone size={18} className={isInstalling ? 'animate-bounce' : ''} />
                    <span>{isInstalling ? 'جاري تهيئة التثبيت...' : 'تثبيت التطبيق على هاتفك الآن'}</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => window.open(appUrl, '_blank')}
                      className="py-3 px-3 bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-gray-700 cursor-pointer"
                      title="فتح الرابط في نافذة خارجية للمتصفح"
                    >
                      <ExternalLink size={14} />
                      <span>فتح بمتصفح خارجي</span>
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="py-3 px-3 bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-gray-700 cursor-pointer"
                      title="نسخ رابط التطبيق لمشاركته على الهاتف"
                    >
                      {hasCopiedUrl ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{hasCopiedUrl ? 'تم النسخ!' : 'نسخ رابط الهاتف'}</span>
                    </button>
                  </div>
                </div>

                {/* System Permissions Included */}
                <div className="bg-[#24252a] p-3 rounded-2xl border border-gray-800 space-y-2 text-xs">
                  <span className="text-gray-400 font-bold block text-[11px]">مزايا التثبيت المكتملة:</span>
                  <div className="grid grid-cols-2 gap-2 text-gray-300 text-[11px]">
                    <div className="flex items-center gap-1.5 bg-[#1b1c20] p-2 rounded-xl">
                      <Zap size={13} className="text-amber-400" />
                      <span>أداء 120 FPS فائق الخفة</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#1b1c20] p-2 rounded-xl">
                      <Wifi size={13} className="text-blue-400" />
                      <span>يعمل مع أو بدون إنترنت</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#1b1c20] p-2 rounded-xl">
                      <HardDrive size={13} className="text-emerald-400" />
                      <span>حجم فائق الصغر (&lt; 2 MB)</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#1b1c20] p-2 rounded-xl">
                      <Layers size={13} className="text-purple-400" />
                      <span>ملء الشاشة بدون متصفح</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 2: DOWNLOAD APK FILE */}
            {activeTab === 'download_apk' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900 p-4 rounded-2xl border border-emerald-500/40 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-600/30">
                      <ArrowDownToLine size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">حزمة أندرويد المستقلة (APK)</h4>
                      <p className="text-[11px] text-emerald-300">GROZLA_v1.0.0_Official.apk</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    ملف حزمة تطبيق أندرويد حقيقي يحتوي على بيان التطبيق (AndroidManifest.xml) وتوقيع الأمان وواجهة النظام لتثبيتها على نظام أندرويد واستخدام التطبيق كأي تطبيق مثبت على جهازك.
                  </p>
                </div>

                {/* Live Download Button */}
                <div className="space-y-2">
                  <button
                    id="download-official-apk-btn"
                    onClick={handleDownloadApk}
                    disabled={isGeneratingApk}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 rounded-2xl font-black text-sm text-white shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-75"
                  >
                    <ArrowDownToLine size={18} className={isGeneratingApk ? 'animate-bounce' : ''} />
                    <span>{isGeneratingApk ? `جاري تجهيز وتنزيل الحزمة (${apkDownloadProgress}%)...` : 'تنزيل ملف حزمة APK الآن'}</span>
                  </button>
                  
                  {isGeneratingApk && (
                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-emerald-400 h-full rounded-full transition-all duration-200"
                        style={{ width: `${apkDownloadProgress}%` }}
                      ></div>
                    </div>
                  )}
                </div>

                {/* Package Specifications Table */}
                <div className="bg-[#24252a] p-3.5 rounded-2xl border border-gray-800 text-xs space-y-2">
                  <span className="text-gray-400 font-bold block text-[11px]">مواصفات حزمة الـ APK:</span>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between py-1 border-b border-gray-800">
                      <span className="text-gray-400">اسم الحزمة (Package ID):</span>
                      <span className="font-mono text-blue-400 font-bold">com.grozla.app</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-800">
                      <span className="text-gray-400">الإصدار (Version):</span>
                      <span className="text-gray-200 font-bold">1.0.0 (Build 100)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-800">
                      <span className="text-gray-400">التوافق:</span>
                      <span className="text-emerald-400 font-bold">Android 5.0+ حتى Android 15</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-400">نوع الترخيص:</span>
                      <span className="text-amber-400 font-bold">موقع وموثق رسمي (Official Signed)</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 3: SCAN QR WITH MOBILE CAMERA */}
            {activeTab === 'qr_mobile' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-center">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-white">امسح الكود بكاميرا هاتفك</h4>
                  <p className="text-xs text-gray-400">
                    وجّه كاميرا هاتفك المحمول نحو الرمز أدناه لفتح التطبيق وتثبيته في ثانيتين!
                  </p>
                </div>

                {/* QR Display */}
                <div className="inline-block p-4 bg-white rounded-3xl shadow-2xl border-4 border-blue-500/40">
                  {qrCodeDataUrl ? (
                    <img 
                      src={qrCodeDataUrl} 
                      alt="GROZLA Mobile App QR Code" 
                      className="w-52 h-52 sm:w-60 sm:h-60 rounded-xl"
                    />
                  ) : (
                    <div className="w-52 h-52 flex items-center justify-center text-gray-500">
                      جاري توليد الكود...
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="py-2.5 px-4 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-gray-700 cursor-pointer"
                  >
                    {hasCopiedUrl ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{hasCopiedUrl ? 'تم نسخ الرابط!' : 'نسخ رابط الهاتف'}</span>
                  </button>
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: 'GROZLA Mobile App',
                          text: 'تطبيق GROZLA الرسمي للهواتف المحمولة',
                          url: appUrl
                        }).catch(() => {});
                      } else {
                        handleCopyLink();
                      }
                    }}
                    className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Share2 size={14} />
                    <span>مشاركة الرابط</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* TAB 4: STEP BY STEP GUIDE */}
            {activeTab === 'guide' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-xs">
                {/* Android Chrome Guide */}
                <div className="bg-[#24262b] p-4 rounded-2xl border border-gray-700 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
                    <Smartphone size={16} />
                    <span>طريقة التثبيت على أجهزة Android (سامسونج، شاومي، وغيرها):</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-gray-300 text-[11px] leading-relaxed pr-1">
                    <li>افتح الرابط في متصفح <span className="text-blue-400 font-bold">Google Chrome</span> أو متصفح سامسونج على هاتفك.</li>
                    <li>انقر على زر <span className="text-white font-bold">"تثبيت التطبيق"</span> الذي يظهر أسفل الشاشة أو في القائمة العلوية.</li>
                    <li>أو اضغط على قائمة الثلاث نقاط <span className="text-white font-bold">(⋮)</span> بالأعلى واختر <span className="text-emerald-300 font-bold">"تثبيت التطبيق"</span> أو <span className="text-emerald-300 font-bold">"إضافة إلى الشاشة الرئيسية"</span>.</li>
                    <li>اضغط على <span className="text-white font-bold">"تثبيت"</span>. ستظهر أيقونة GROZLA فوراً في درج التطبيقات والشاشة الرئيسية، وستتمكن من تشغيله كأي تطبيق عادي بدون أي متصفح!</li>
                  </ol>
                </div>

                {/* iPhone Safari Guide */}
                <div className="bg-[#24262b] p-4 rounded-2xl border border-gray-700 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-blue-400 text-sm">
                    <Smartphone size={16} />
                    <span>طريقة التثبيت على أجهزة iPhone (Apple Safari):</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-gray-300 text-[11px] leading-relaxed pr-1">
                    <li>افتح رابط التطبيق عبر متصفح <span className="text-blue-400 font-bold">Safari</span> على الآيفون.</li>
                    <li>اضغط على زر المشاركة أسفل الشاشة <span className="text-white font-bold">(مربع بسهم للأعلى ⎋)</span>.</li>
                    <li>مرر للأسفل واختر <span className="text-amber-300 font-bold">"إضافة إلى الشاشة الرئيسية" (Add to Home Screen)</span>.</li>
                    <li>اضغط على <span className="text-white font-bold">"إضافة" (Add)</span> في الزاوية العلوية، وسيتحول GROZLA إلى تطبيق هاتف نظامي كامل الشاشة.</li>
                  </ol>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-3 bg-[#17181a] border-t border-gray-800 flex items-center justify-between">
            <span className="text-[11px] text-gray-400 font-medium">
              حزمة GROZLA Mobile الرسمية • إصدار 1.0.0
            </span>
            <button
              onClick={onClose}
              className="py-2 px-5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
