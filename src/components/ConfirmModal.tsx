import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, AlertTriangle, X, ShieldCheck } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'تأكيد الحذف',
  cancelText = 'إلغاء',
  isDestructive = true
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 dir-rtl select-none">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col"
        >
          {/* Header Bar */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                <Trash2 size={16} />
              </div>
              <h3 className="font-black text-gray-900 text-base">{title}</h3>
            </div>
            <button
              onClick={onCancel}
              className="w-8 h-8 rounded-full bg-gray-200/80 hover:bg-gray-300 text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 text-center space-y-4">
            <div className="w-20 h-20 bg-rose-50 border-2 border-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              {isDestructive ? <Trash2 size={36} className="animate-bounce" /> : <AlertTriangle size={36} className="animate-bounce" />}
            </div>

            <div className="space-y-2">
              <h4 className="font-extrabold text-gray-900 text-lg">{title}</h4>
              <p className="text-sm font-bold text-gray-600 leading-relaxed bg-gray-50 p-3.5 rounded-2xl border border-gray-200/60">
                {message}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-5 bg-gray-50/80 border-t border-gray-100 flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-extrabold text-xs rounded-2xl transition-all cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Trash2 size={16} />
              <span>{confirmText}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
