import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Info, 
  Flag, 
  Sparkles, 
  ExternalLink,
  ChevronLeft,
  Search,
  Eye,
  Camera,
  Layers
} from 'lucide-react';
import { FACEBOOK_COMMUNITY_STANDARDS, CommunityStandardSystem, CommunityViolationCategory } from '../utils/photoSafetyReview';

interface ProfileCommunityStandardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSystemId?: CommunityViolationCategory;
}

export const ProfileCommunityStandardsModal: React.FC<ProfileCommunityStandardsModalProps> = ({
  isOpen,
  onClose,
  initialSystemId = 'sexual_activity'
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CommunityViolationCategory>(initialSystemId);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const currentSystem: CommunityStandardSystem = 
    FACEBOOK_COMMUNITY_STANDARDS.find(s => s.id === selectedCategory) || FACEBOOK_COMMUNITY_STANDARDS[0];

  const filteredSystems = FACEBOOK_COMMUNITY_STANDARDS.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nameEn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/75 z-[230] flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm dir-rtl">
        <motion.div 
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-200"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/50">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#1877f2] text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                <ShieldCheck size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-gray-900">معايير مجتمع OWN あ</h3>
                  <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                    لصور الملف الشخصي
                  </span>
                </div>
                <p className="text-xs text-gray-600 font-bold mt-0.5">
                  جميع أنظمة وإرشادات الأمان وشروط OWN المطبقة على الصور الشخصية
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 text-gray-500 flex items-center justify-center transition-all cursor-pointer shadow-xs border border-gray-200"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search bar & quick stats */}
          <div className="p-3.5 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <input 
                type="text"
                placeholder="ابحث في أنظمة المعايير (عُري، عنف، أطفال...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 text-gray-800 text-xs rounded-xl pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-600 shrink-0">
              <span className="flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg">
                <Sparkles size={12} />
                فحص فوري ذكي
              </span>
              <span className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2.5 py-1 rounded-lg">
                <Lock size={12} />
                حماية تلقائية 24/7
              </span>
            </div>
          </div>

          {/* Systems Horizontal List */}
          <div className="p-3 border-b border-gray-100 flex gap-2 overflow-x-auto no-scrollbar bg-white">
            {filteredSystems.map((system, sIdx) => {
              const isSelected = system.id === selectedCategory;
              return (
                <button
                  key={`std-sys-${system.id}-${sIdx}`}
                  onClick={() => setSelectedCategory(system.id)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#8b5cf6] text-white border-purple-600 shadow-md shadow-purple-500/20 scale-102'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'
                  }`}
                >
                  <span className="text-base">{system.icon}</span>
                  <span className="truncate max-w-[130px]">{system.name}</span>
                </button>
              );
            })}
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
            {/* System Header Banner */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 text-white shadow-lg space-y-2 relative overflow-hidden">
              <div className="absolute -left-6 -bottom-6 text-7xl opacity-10 select-none pointer-events-none">
                {currentSystem.icon}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{currentSystem.icon}</span>
                  <div>
                    <h4 className="text-base font-black tracking-tight">{currentSystem.name}</h4>
                    <p className="text-[11px] text-slate-300 font-semibold">{currentSystem.nameEn}</p>
                  </div>
                </div>
                <span className="text-[10px] font-black bg-blue-500/30 border border-blue-400/40 text-blue-200 px-2.5 py-1 rounded-full">
                  {currentSystem.policyArticle}
                </span>
              </div>

              <p className="text-xs text-slate-200 font-bold leading-relaxed pt-1">
                {currentSystem.description}
              </p>
            </div>

            {/* Allowed vs Prohibited Bento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Allowed */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-emerald-800 font-black text-xs">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <span>ما يُسمح به في الصور الشخصية:</span>
                </div>
                <ul className="space-y-2 text-xs text-emerald-950 font-bold">
                  {currentSystem.allowed.map((item, idx) => (
                    <li key={`std-allowed-${idx}`} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-black mt-0.5">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Prohibited */}
              <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-rose-800 font-black text-xs">
                  <AlertTriangle size={18} className="text-rose-600 shrink-0" />
                  <span>المحظورات والإجراءات الصارمة:</span>
                </div>
                <ul className="space-y-2 text-xs text-rose-950 font-bold">
                  {currentSystem.prohibited.map((item, idx) => (
                    <li key={`std-prohibited-${idx}`} className="flex items-start gap-2">
                      <span className="text-rose-600 font-black mt-0.5">✗</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* AI Review & Enforcement Workflow Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2.5">
              <h5 className="text-xs font-black text-gray-900 flex items-center gap-2">
                <ShieldAlert size={16} className="text-blue-600" />
                <span>كيف يعمل نظام الفحص التلقائي لصور الملف الشخصي؟</span>
              </h5>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] font-bold">
                <div className="bg-white p-3 rounded-xl border border-gray-150 shadow-2xs space-y-1">
                  <p className="text-blue-700 font-black flex items-center gap-1">
                    <span>1. فحص فوري</span>
                  </p>
                  <p className="text-gray-600">فحص بكسلات الصورة ومطابقتها مع خوارزميات شروط OWN قبل حفظها.</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-gray-150 shadow-2xs space-y-1">
                  <p className="text-rose-700 font-black flex items-center gap-1">
                    <span>2. الحذف الفوري</span>
                  </p>
                  <p className="text-gray-600">عند رصد أي انتهاك، تُحذف الصورة فوراً ولا تُحفظ في الحساب إطلاقاً.</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-gray-150 shadow-2xs space-y-1">
                  <p className="text-amber-700 font-black flex items-center gap-1">
                    <span>3. حماية الحساب</span>
                  </p>
                  <p className="text-gray-600">تعطيل أو قفل الحساب مع واجهة إرشادات المجتمع وإتاحة الطعن.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-[11px] text-gray-500 font-bold">
              معايير OWN あ لشروط OWN والأمان الرقمي © 2026
            </span>
            <button
              onClick={onClose}
              className="bg-[#1877f2] hover:bg-blue-700 text-white font-black text-xs px-6 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              فهمت المعايير
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

interface ReportProfilePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserName: string;
  targetUserAvatar: string;
  onSubmitReport: (category: CommunityViolationCategory, reason: string) => void;
}

export const ReportProfilePhotoModal: React.FC<ReportProfilePhotoModalProps> = ({
  isOpen,
  onClose,
  targetUserName,
  targetUserAvatar,
  onSubmitReport
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CommunityViolationCategory>('sexual_activity');
  const [customDetails, setCustomDetails] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReport(selectedCategory, customDetails);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/75 z-[235] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm dir-rtl">
        <motion.div 
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          className="bg-white rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl overflow-hidden border border-gray-200 text-right"
        >
          {isSubmitted ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-lg font-black text-gray-900">شكراً لمساعدتنا في حماية المجتمع</h3>
              <p className="text-xs text-gray-600 font-bold max-w-xs leading-relaxed">
                تم استلام بلاغك بشأن مخالفة الصورة الشخصية لمعايير مجتمع OWN あ. سيقوم فريق السلامة بمراجعتها فوراً واتخاذ الإجراء المناسب.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2 text-rose-600">
                  <Flag size={22} />
                  <h3 className="text-base font-black text-gray-900">إبلاغ عن صورة الملف الشخصي</h3>
                </div>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
                  <X size={18} />
                </button>
              </div>

              {/* Reported Target Card */}
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-200">
                <img 
                  src={targetUserAvatar} 
                  alt={targetUserName} 
                  className="w-12 h-12 rounded-full object-cover border border-gray-300"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 font-bold">الحساب المُبلّغ عنه:</p>
                  <p className="text-sm font-black text-gray-900 truncate">{targetUserName}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-800 mb-2">
                  ما سبب مخالفة هذه الصورة لمعايير مجتمع OWN あ؟
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {FACEBOOK_COMMUNITY_STANDARDS.map((standard, stIdx) => (
                    <label 
                      key={`std-cat-${standard.id}-${stIdx}`}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                        selectedCategory === standard.id
                          ? 'bg-blue-50/80 border-blue-500 text-blue-900 shadow-2xs'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{standard.icon}</span>
                        <span>{standard.name}</span>
                      </div>
                      <input 
                        type="radio" 
                        name="violation_category" 
                        value={standard.id}
                        checked={selectedCategory === standard.id}
                        onChange={() => setSelectedCategory(standard.id)}
                        className="accent-blue-600"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 mb-1">
                  تفاصيل إضافية (اختياري):
                </label>
                <textarea 
                  rows={2}
                  value={customDetails}
                  onChange={(e) => setCustomDetails(e.target.value)}
                  placeholder="وضح أي تفاصيل إضافية تساعد فريق المراجعة..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none font-bold"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-black text-xs transition-all shadow-md cursor-pointer"
                >
                  إرسال البلاغ لمراجعة المعايير
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-4 rounded-xl font-bold text-xs transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
