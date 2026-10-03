import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle, 
  UserX, 
  Lock, 
  AlertOctagon, 
  FileText, 
  Clock, 
  ChevronRight, 
  EyeOff, 
  UserCheck, 
  ExternalLink,
  Info,
  Scale
} from 'lucide-react';
import { Notification } from '../types';
import { useAppContext } from '../context/AppContext';

interface ReportActionViewProps {
  notification: Notification | null;
  onBack: () => void;
}

export default function ReportActionView({ notification, onBack }: ReportActionViewProps) {
  const { setCurrentView } = useAppContext();
  const [activeTab, setActiveTab] = useState<'decision' | 'standards' | 'safeguards'>('decision');

  if (!notification) {
    return (
      <div className="min-h-screen p-4 sm:p-6 dir-rtl text-right font-sans flex flex-col items-center justify-center bg-gray-50 text-gray-800">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-bold mb-2">لا يوجد بلاغ محدد</h2>
        <p className="text-gray-500 text-sm mb-4">يرجى اختيار إشعار إبلاغ من قائمة الإشعارات</p>
        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-500 transition-colors cursor-pointer"
        >
          العودة إلى الإشعارات
        </button>
      </div>
    );
  }

  const metadata = notification.metadata;
  const reportedName = metadata?.reportedUserName || notification.fromName || 'المستخدم';
  const reportedAvatar = metadata?.reportedUserAvatar || notification.fromAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
  const reason = metadata?.reason || 'انتهاك معايير مجتمع فيسبوك وسياسات الأمان والسلامة';
  const caseId = notification.id.slice(0, 8).toUpperCase();
  const formattedDate = notification.time ? new Date(notification.time).toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'اليوم';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="min-h-screen bg-slate-950 text-white dir-rtl text-right font-sans rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden border border-slate-800"
    >
      {/* 1. Official Top Navigation Bar */}
      <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3.5 sm:px-6 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -mr-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold active:scale-95"
            title="العودة إلى الإشعارات"
          >
            <ArrowRight size={18} />
            <span className="hidden sm:inline">العودة للإشعارات</span>
          </button>
          
          <div className="h-6 w-px bg-slate-700 mx-1 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white leading-tight">
                صندوق دعم فيسبوك • مركز الإبلاغات
              </h1>
              <p className="text-[11px] text-gray-400 font-mono">
                رقم الحالة: #{caseId}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-500/15 border border-rose-500/30 text-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            تم اتخاذ إجراء حاسم
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
        {/* 2. Hero Action Banner: Displays the exact required phrase */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-950/70 via-slate-900 to-slate-900 border border-rose-500/40 p-5 sm:p-7 shadow-2xl">
          <div className="absolute top-0 left-0 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center text-white shadow-xl shadow-rose-900/40 shrink-0">
              <UserX size={36} />
            </div>

            <div className="space-y-2 flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black bg-rose-500/20 border border-rose-500/40 text-rose-200">
                <ShieldAlert size={14} />
                قرار إنفاذ الأمان الصارم
              </div>

              {/* Exact required wording displayed boldly */}
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight">
                لقد قمنا بإزالة حساب <span className="text-rose-400 underline decoration-rose-500/60 underline-offset-4">{reportedName}</span> الذي أبلغت عنه
              </h2>

              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-2xl pt-1">
                شكراً لمساعدتنا في الحفاظ على أمان مجتمعنا. بناءً على البلاغ الذي قدمته واكتمال 10 إبلاغات مؤكدة، بالإضافة إلى فحص سجل المحتوى والمراسلات عبر أنظمة الذكاء الاصطناعي الأمني، تقرر رسمياً تعليق هذا الحساب وإزالته نهائياً لحماية المستخدمين.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Reported Account Dossier Card */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
              <FileText size={15} className="text-blue-400" />
              بيانات الحساب المعني بالإجراء
            </span>
            <span className="text-[11px] text-gray-500 font-mono">
              تاريخ صدور القرار: {formattedDate}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={reportedAvatar}
                  alt={reportedName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-rose-500/60 grayscale-[40%]"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-1 -left-1 p-1 bg-rose-600 text-white rounded-full shadow-md" title="تمت الإزالة">
                  <AlertOctagon size={16} />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white">{reportedName}</h3>
                  <span className="text-[11px] font-black bg-rose-600/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-md">
                    تمت الإزالة والتعليق
                  </span>
                </div>
                
                {/* Clear badge highlighting: الحساب الذي أبلغت عنه */}
                <p className="text-xs font-bold text-rose-300 mt-1 flex items-center gap-1">
                  <span>🎯</span>
                  <span>الحساب الذي أبلغت عنه</span>
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  سبب المخالفة: <span className="text-gray-200 font-semibold">{reason}</span>
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800/80 gap-1.5">
              <span className="text-[11px] text-gray-400 font-medium">سجل الإبلاغات:</span>
              <span className="text-xs font-black text-rose-400 bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-800/50">
                10 / 10 إبلاغات (الحد الأقصى)
              </span>
            </div>
          </div>
        </div>

        {/* 4. Tab Selector */}
        <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('decision')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-2 ${
              activeTab === 'decision'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                : 'bg-slate-900 text-gray-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CheckCircle size={15} />
            تفاصيل القرار والخطوات المتخذة
          </button>
          
          <button
            onClick={() => setActiveTab('standards')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-2 ${
              activeTab === 'standards'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                : 'bg-slate-900 text-gray-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Scale size={15} />
            معايير المجتمع التي تم انتهاكها
          </button>

          <button
            onClick={() => setActiveTab('safeguards')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-2 ${
              activeTab === 'safeguards'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                : 'bg-slate-900 text-gray-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Lock size={15} />
            حماية خصوصيتك وسريتك
          </button>
        </div>

        {/* 5. Tab Content */}
        {activeTab === 'decision' && (
          <div className="space-y-4">
            {/* Timeline */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Clock size={16} className="text-blue-400" />
                المسار الزمني لمراجعة وإنفاذ البلاغ
              </h4>

              <div className="relative pr-6 space-y-6 before:content-[''] before:absolute before:right-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                <div className="relative">
                  <div className="absolute -right-6 top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" />
                  <p className="text-xs font-bold text-white">1. استلام وتوثيق بلاغك</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    تم استلام تقريرك وتشفير بيانات هويتك بالكامل لحماية خصوصيتك التامة.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -right-6 top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" />
                  <p className="text-xs font-bold text-white">2. تدقيق الذكاء الاصطناعي الأمني</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    فحصت الخوارزميات سجل المحادثات والمنشورات والصور، ورصدت مؤشرات مخالفة واضحة.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -right-6 top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" />
                  <p className="text-xs font-bold text-white">3. اكتمال نصاب الإبلاغات (10 إبلاغات)</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    تلقى النظام 10 إبلاغات متتالية من المستخدمين ضد هذا الحساب، مما استوجب تعليقاً فورياً وإلزامياً.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -right-6 top-0.5 w-4 h-4 rounded-full bg-rose-500 border-2 border-slate-900" />
                  <p className="text-xs font-bold text-rose-400">4. صدور قرار الإزالة والتعليق الدائم</p>
                  <p className="text-[11px] text-gray-300 mt-0.5">
                    تم منع الحساب من الوصول إلى فيسبوك وماسنجر وحجب كافة أنشطته ومحتواه نهائياً.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions Taken Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-rose-400">
                  <UserX size={18} />
                  <h5 className="text-xs font-black">حظر الحساب وتعليقه</h5>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  تم حرمان صاحب الحساب من تسجيل الدخول أو استخدام فيسبوك أو ماسنجر، وتم وضعه في وضع الحساب المعلق.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-blue-400">
                  <EyeOff size={18} />
                  <h5 className="text-xs font-black">حجب المحتوى المسيء</h5>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  تمت إزالة وحجب المنشورات والمراسلات والتعليقات المخالفة التي تم الإبلاغ عنها لمنع انتشار أي ضرر.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Lock size={18} />
                  <h5 className="text-xs font-black">سرية المُبلّغ 100%</h5>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  هويتك سرية تماماً. لا يتم إخطار صاحب الحساب باسمك أو هويتك أو معلوماتك تحت أي ظرف.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-400">
                  <ShieldCheck size={18} />
                  <h5 className="text-xs font-black">حماية مجتمعنا</h5>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  مشاركتك في الإبلاغ تحمي مجتمعنا من الحسابات الوهمية والاحتيال والمضايقات والتصرفات المؤذية.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'standards' && (
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Scale size={16} className="text-amber-400" />
              السياسات والمعايير المطبقة في هذا القرار
            </h4>
            <div className="space-y-3 text-xs text-gray-300">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <p className="font-bold text-white mb-1">١. مكافحة المضايقة والتنمر والسلوك غير اللائق</p>
                <p className="text-gray-400">
                  لا يُسمح باستهداف الأفراد بالإساءة اللفظية أو التهديد أو نشر محتوى ينتهك حرمة الحياة الخاصة.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <p className="font-bold text-white mb-1">٢. النزاهة والأصالة ومنع الانتحال</p>
                <p className="text-gray-400">
                  نحظر إنشاء حسابات وهمية أو انتحال هويات الآخرين أو استخدام المنصة في النصب والاحتيال والرسائل المزعجة.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <p className="font-bold text-white mb-1">٣. نظام الإنفاذ التلقائي لـ 10 إبلاغات</p>
                <p className="text-gray-400">
                  عند وصول الحساب إلى 10 إبلاغات موثقة من مستخدمين مختلفين، يفعل النظام تعليقاً آلياً صارماً لا يمكن رفعه إلا بمراجعة دقيقة.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'safeguards' && (
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Lock size={16} className="text-emerald-400" />
              ضمانات السرية وحماية المُبلّغ
            </h4>
            
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs leading-relaxed space-y-2">
              <p className="font-black text-sm text-emerald-300">
                🔒 هويتك كمُبلّغ مشفرة ومحفوظة بسرية تامة
              </p>
              <p>
                نؤكد لك بشكل قاطع أن الشخص المعلق حسابه لا يعلم ولا يمكنه معرفة من قام بالإبلاغ عنه. النظام يظهر له فقط سبب التعليق العام دون أي كشف لهوية المُبلّغين.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-gray-300 space-y-2">
              <p className="font-bold text-white">خطوات إضافية يمكنك اتخاذها لحماية نفسك:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li>حظر أي حسابات بديلة يشتبه في ارتباطها بنفس الشخص.</li>
                <li>مراجعة خصوصية ملفك الشخصي ومن يستطيع إرسال طلبات صداقة لك.</li>
                <li>تفعيل ميزة التوثيق الثنائي لحماية حسابك الخاص.</li>
              </ul>
            </div>
          </div>
        )}

        {/* 6. Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-blue-400" />
            <span>نظام الحماية والسلامة والذكاء الاصطناعي الأمني في فيسبوك</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onBack}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
            >
              العودة إلى الإشعارات
            </button>
            <button
              onClick={() => setCurrentView('home')}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white font-bold text-xs transition-all border border-slate-700 cursor-pointer"
            >
              الصفحة الرئيسية
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
