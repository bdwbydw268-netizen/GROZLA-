import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Smartphone, CheckCircle2, ShieldCheck, HardDrive, Wifi, Camera, Bell, ExternalLink, X, ArrowRight } from 'lucide-react';

interface AndroidPackageInstallerProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onDownloadApkFile: () => void;
}

type InstallStep = 'confirm' | 'installing' | 'completed';

export default function AndroidPackageInstaller({
  isOpen,
  onClose,
  deferredPrompt,
  onDownloadApkFile
}: AndroidPackageInstallerProps) {
  const [step, setStep] = useState<InstallStep>('confirm');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setStep('confirm');
      setProgress(0);
    }
  }, [isOpen]);

  const handleStartInstallation = () => {
    setStep('installing');
    setProgress(10);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 20) + 10;
      });
    }, 250);

    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setStep('completed');
      
      // Also trigger APK download automatically in background for the file
      onDownloadApkFile();
    }, 2200);
  };

  const handleOpenApp = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
      } catch (e) {
        console.error(e);
      }
    }
    onClose();
    window.location.href = window.location.origin;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-[100] flex items-center justify-center p-3 dir-rtl font-sans select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-[#202124] text-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-gray-700/80"
        >
          {/* Android System Header Bar */}
          <div className="bg-[#2c2d30] px-4 py-3 border-b border-gray-700 flex items-center justify-between text-xs text-gray-300">
            <div className="flex items-center gap-2 font-medium">
              <div className="w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                <ShieldCheck size={12} />
              </div>
              <span>أداة تثبيت حزم Android</span>
            </div>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* App Info Card */}
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-4">
              {/* App Icon matching screenshot */}
              <div className="flex flex-col items-center shrink-0">
                <div className="relative">
                  <div className="w-16 h-16 bg-[#1877f2] rounded-[22px] flex items-center justify-center text-white font-sans font-black text-3xl shadow-xl shadow-blue-500/30 border border-blue-400/40 select-none">
                    G
                  </div>
                  <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-[9px] text-white px-1.5 py-0.2 rounded font-mono font-bold uppercase border border-[#202124]">
                    APK
                  </span>
                </div>
                <span className="text-xs font-bold text-white mt-1 tracking-wide uppercase">GROZLA</span>
              </div>

              {/* Title & Package Details */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white tracking-tight">GROZLA</h3>
                  <span className="bg-blue-500/20 text-blue-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-blue-500/30">
                    APK
                  </span>
                </div>
                <p className="text-xs font-mono text-blue-400">com.grozla.app</p>
                <div className="flex items-center gap-2 text-[11px] text-gray-400 pt-0.5">
                  <span>الإصدار الرسمي v1.0.0</span>
                  <span>•</span>
                  <span>1.8 MB</span>
                </div>
              </div>
            </div>

            {/* STEP 1: CONFIRMATION */}
            {step === 'confirm' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pt-1">
                <div className="bg-[#2a2b2e] p-3.5 rounded-2xl border border-gray-700/60 text-xs text-gray-300 space-y-2">
                  <p className="font-semibold text-white">هل تريد تثبيت هذا التطبيق؟</p>
                  <p className="text-gray-400 text-[11px] leading-relaxed">
                    لا يتطلب التطبيق أي وصول خاص أو أذونات معقدة. سيتم تثبيت حزمة أندرويد الرسمية مباشرة على نظام التشغيل.
                  </p>
                </div>

                {/* Permissions List */}
                <div className="space-y-2 text-xs">
                  <span className="text-gray-400 font-semibold block text-[11px]">الأذونات المطلوبة:</span>
                  <div className="grid grid-cols-2 gap-2 text-gray-300">
                    <div className="flex items-center gap-2 bg-[#28292c] p-2 rounded-xl border border-gray-700/40">
                      <Wifi size={14} className="text-blue-400" />
                      <span>اتصال الشبكة</span>
                    </div>
                    <div className="flex items-center gap-2 bg-[#28292c] p-2 rounded-xl border border-gray-700/40">
                      <Bell size={14} className="text-amber-400" />
                      <span>الإشعارات</span>
                    </div>
                    <div className="flex items-center gap-2 bg-[#28292c] p-2 rounded-xl border border-gray-700/40">
                      <Camera size={14} className="text-purple-400" />
                      <span>الكاميرا والوسائط</span>
                    </div>
                    <div className="flex items-center gap-2 bg-[#28292c] p-2 rounded-xl border border-gray-700/40">
                      <HardDrive size={14} className="text-emerald-400" />
                      <span>مساحة التخزين</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-700/80">
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 text-xs font-bold text-gray-300 hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleStartInstallation}
                    className="px-6 py-2.5 text-xs font-bold text-white bg-[#1877f2] hover:bg-blue-600 active:scale-95 rounded-xl transition-all shadow-md shadow-blue-600/30 cursor-pointer flex items-center gap-2"
                  >
                    <span>تثبيت</span>
                    <ArrowRight size={14} className="rotate-180" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: INSTALLING... */}
            {step === 'installing' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 py-3">
                <div className="space-y-2 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl mb-1 animate-pulse">
                    <Smartphone size={28} />
                  </div>
                  <h4 className="text-sm font-bold text-white">جاري تثبيت GROZLA...</h4>
                  <p className="text-xs text-gray-400">يرجى الانتظار لحين اكتمال كتابة الحزمة على الذاكرة</p>
                </div>

                {/* Android Native Style Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-gray-700">
                    <motion.div
                      className="bg-[#1877f2] h-full rounded-full transition-all duration-300 bg-gradient-to-r from-blue-500 to-emerald-400"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                    <span>تحقيق الأمان...</span>
                    <span>{progress}%</span>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <span className="text-[11px] text-gray-500 animate-pulse">لا تقم بترك الشاشة أثناء التثبيت</span>
                </div>
              </motion.div>
            )}

            {/* STEP 3: COMPLETED */}
            {step === 'completed' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 py-2">
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl mx-auto border border-emerald-500/30">
                    <CheckCircle2 size={28} />
                  </div>
                  <h4 className="text-base font-bold text-white">تم تثبيت التطبيق بنجاح</h4>
                  <p className="text-xs text-emerald-400 font-medium">
                    تمت إضافة أيقونة GROZLA للشاشة الرئيسية
                  </p>
                </div>

                {/* Smartphone Screen Preview Card */}
                <div className="bg-gradient-to-b from-[#2a1b28] via-[#1c131a] to-[#2b1f1d] p-4 rounded-2xl border border-amber-500/20 shadow-inner flex flex-col items-center justify-center gap-1 py-5">
                  <div className="w-16 h-16 bg-[#1877f2] rounded-[22px] flex items-center justify-center text-white font-sans font-black text-3xl shadow-2xl shadow-blue-500/50 border border-white/20 select-none transform hover:scale-105 transition-transform">
                    G
                  </div>
                  <span className="text-sm font-extrabold text-white tracking-wide text-shadow drop-shadow-md uppercase">
                    GROZLA
                  </span>
                </div>

                <div className="bg-[#28292c] p-3 rounded-xl border border-gray-700/60 text-xs text-gray-300 text-center">
                  حزمة <span className="font-mono text-blue-400">com.grozla.app</span> جاهزة للاستخدام بدون أخطاء.
                </div>

                {/* Android Native Success Action Buttons */}
                <div className="flex items-center gap-3 pt-2 border-t border-gray-700/80">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 text-xs font-bold text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors cursor-pointer text-center"
                  >
                    تم
                  </button>
                  <button
                    onClick={handleOpenApp}
                    className="flex-1 py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-xl transition-all shadow-md shadow-emerald-600/30 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>فتح التطبيق</span>
                    <ExternalLink size={14} />
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
