import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, ShieldAlert, X, CheckCircle, AlertOctagon, UserX, ExternalLink, Lock } from 'lucide-react';
import { Notification } from '../types';

interface ReportActionTakenModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: Notification | null;
}

export default function ReportActionTakenModal({ isOpen, onClose, notification }: ReportActionTakenModalProps) {
  if (!isOpen || !notification) return null;

  const metadata = notification.metadata;
  const reportedName = metadata?.reportedUserName || notification.fromName || 'المستخدم';
  const reportedAvatar = metadata?.reportedUserAvatar || notification.fromAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
  const reason = metadata?.reason || 'انتهاك معايير المجتمع وسياسات الأمان';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 dir-rtl text-right">
        {/* Backdrop click to close */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl text-white overflow-hidden z-10"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-rose-900/60 via-red-900/40 to-slate-900 p-5 sm:p-6 border-b border-rose-800/30 relative">
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-gray-300 hover:text-white transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-lg">
                <ShieldAlert size={26} />
              </div>
              <div>
                <span className="inline-block text-[11px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-500/30 mb-1">
                  إجراء أمان فيسبوك • معايير المجتمع
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  لقد اتخذنا إجراءً بشأن هذا الحساب
                </h3>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Primary Action Notice with exact required phrase */}
            <div className="bg-gradient-to-b from-rose-950/40 to-slate-800/60 border border-rose-500/30 rounded-2xl p-4 sm:p-5 shadow-inner">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-500/20 rounded-xl text-rose-400 shrink-0 mt-0.5">
                  <UserX size={24} />
                </div>
                <div className="space-y-1">
                  <p className="text-base sm:text-lg font-black text-white leading-snug">
                    لقد قمنا بإزالة حساب <span className="text-rose-400 font-extrabold underline decoration-rose-500/50 underline-offset-4">{reportedName}</span> الذي أبلغت عنه
                  </p>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed pt-1">
                    شكراً لمساعدتنا في الحفاظ على أمان مجتمعنا. بعد مراجعة دقيقة وتلقي 10 بلاغات وفحص المراسلات والحساب عبر أنظمة الذكاء الاصطناعي الأمني، تأكدنا من ارتكاب مخالفات لمعايير المجتمع وتم تعليق وإزالة الحساب بشكل نهائي.
                  </p>
                </div>
              </div>
            </div>

            {/* Reported User Profile Snippet */}
            <div className="flex items-center gap-3.5 p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/60">
              <div className="relative">
                <img
                  src={reportedAvatar}
                  alt={reportedName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-rose-500/60 opacity-80 filter grayscale-[40%]"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-1 -left-1 bg-rose-600 text-white p-1 rounded-full shadow-md" title="تمت الإزالة">
                  <AlertOctagon size={14} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-white truncate">{reportedName}</h4>
                  <span className="text-[10px] font-black bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-md border border-rose-500/30">
                    تمت الإزالة
                  </span>
                </div>
                <p className="text-xs text-rose-300/90 mt-0.5 truncate font-medium">
                  الحساب الذي أبلغت عنه
                </p>
                <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">
                  السبب: {reason}
                </p>
              </div>
            </div>

            {/* Actions Taken Checklist */}
            <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/40 space-y-2.5">
              <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wide flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-400" />
                القرارات والإجراءات المتخذة:
              </h5>
              <div className="space-y-2 text-xs text-gray-300">
                <div className="flex items-start gap-2.5">
                  <CheckCircle size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>تم تعليق وإزالة الحساب ومنع صاحبه من النشر أو التواصل على فيسبوك وماسنجر.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>تم حجب المحتوى والمراسلات المسيئة التي تم الإبلاغ عنها لحماية المستخدمين.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Lock size={15} className="text-blue-400 shrink-0 mt-0.5" />
                  <span>هويتك كمُبلّغ تبقى مجهولة وسرية تماماً ولم يتم إعلام صاحب الحساب بها.</span>
                </div>
              </div>
            </div>

            {/* Time & AI Security Stamp */}
            <div className="text-[11px] text-gray-400 bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <span>تم الفحص والإنفاذ بالذكاء الاصطناعي الأمني</span>
              <span className="text-gray-500 font-mono text-[10px]">
                {notification.time ? new Date(notification.time).toLocaleString('ar-EG') : 'الآن'}
              </span>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-5 bg-slate-950/70 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer text-sm"
            >
              تم الفهم
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
