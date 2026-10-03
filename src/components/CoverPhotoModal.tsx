import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Camera, Download, Eye, Sparkles, Check, 
  Trash2, RefreshCw, Layers, ShieldCheck, ArrowRight,
  Maximize2, Palette, Image as ImageIcon
} from 'lucide-react';
import { COVER_PRESETS, CoverPreset } from '../constants/coverPresets';
import { DEFAULT_COVER } from '../constants/avatar';
import AiImagePickerModal from './AiImagePickerModal';

interface CoverPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCover: string;
  userName: string;
  isOwnProfile: boolean;
  onSelectCover: (newCoverUrl: string) => void;
  onUploadCoverClick: () => void;
  onDeleteCover: () => void;
}

export const CoverPhotoModal: React.FC<CoverPhotoModalProps> = ({
  isOpen,
  onClose,
  currentCover,
  userName,
  isOwnProfile,
  onSelectCover,
  onUploadCoverClick,
  onDeleteCover,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'view' | 'options'>('presets');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('الكل');
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);
  const [showAiCoverModal, setShowAiCoverModal] = useState<boolean>(false);

  if (!isOpen) return null;

  const categories = ['الكل', 'رسمي وفيسبوك', 'غروب وألوان دافئة', 'طبيعة وكون', 'فضاء وخيال', 'تقنية وتصميم', 'فخامة وبساطة'];

  const filteredPresets = activeCategory === 'الكل' 
    ? COVER_PRESETS 
    : COVER_PRESETS.filter(p => p.category === activeCategory);

  const handleApplyPreset = (preset: CoverPreset) => {
    setSelectedPresetId(preset.id);
    onSelectCover(preset.url);
  };

  const handleDownloadCover = () => {
    const a = document.createElement('a');
    a.href = currentCover || DEFAULT_COVER;
    a.download = `cover_${userName || 'facebook'}.jpg`;
    a.click();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 dir-rtl">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-200 text-right overflow-hidden"
        >
          {/* MODAL HEADER */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <Palette size={20} />
              </div>
              <div>
                <h3 className="font-black text-gray-900 text-base">تصميم وإدارة غلاف الملف الشخصي</h3>
                <p className="text-[11px] text-gray-500 font-bold">أغلفة فيسبوك فاخرة تملأ الشاشة بدقة عالية</p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex border-b border-gray-200 bg-white px-2 pt-2 gap-1 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('presets')}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-xs font-black transition-all cursor-pointer border-b-2 ${
                activeTab === 'presets'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Sparkles size={16} />
              <span>معرض الأغلفة الفاخرة</span>
            </button>

            <button
              onClick={() => setActiveTab('view')}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-xs font-black transition-all cursor-pointer border-b-2 ${
                activeTab === 'view'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Eye size={16} />
              <span>معاينة الغلاف الحالي</span>
            </button>

            {isOwnProfile && (
              <button
                onClick={() => setActiveTab('options')}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-xs font-black transition-all cursor-pointer border-b-2 ${
                  activeTab === 'options'
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Camera size={16} />
                <span>خيارات الرفع والضبط</span>
              </button>
            )}
          </div>

          {/* TAB CONTENT AREA */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* TAB 1: PRESETS GALLERY */}
            {activeTab === 'presets' && (
              <div className="space-y-4">
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {categories.map((cat, cIdx) => (
                    <button
                      key={`cover-cat-${cat}-${cIdx}`}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        activeCategory === cat
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Grid of Presets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {filteredPresets.map((preset, pIdx) => {
                    const isSelected = currentCover === preset.url || selectedPresetId === preset.id;
                    return (
                      <div
                        key={`cover-preset-${preset.id}-${pIdx}`}
                        onClick={() => handleApplyPreset(preset)}
                        className={`group relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md ${
                          isSelected 
                            ? 'border-blue-600 ring-2 ring-blue-400/40 scale-[1.01]' 
                            : 'border-gray-200 hover:border-blue-400'
                        }`}
                      >
                        {/* Preset Cover Banner */}
                        <div className="h-32 sm:h-36 w-full relative overflow-hidden bg-slate-900">
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-full object-cover  transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                          
                          {/* Active Badge */}
                          {isSelected && (
                            <div className="absolute top-2.5 right-2.5 bg-blue-600 text-white px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1 shadow-md">
                              <Check size={12} strokeWidth={3} />
                              <span>مفعّل حالياً</span>
                            </div>
                          )}

                          {/* Category Tag */}
                          <div className="absolute top-2.5 left-2.5 bg-black/50 backdrop-blur-xs text-white px-2 py-0.5 rounded-lg text-[9px] font-bold">
                            {preset.category}
                          </div>

                          {/* Info Overlay */}
                          <div className="absolute bottom-2.5 right-2.5 left-2.5 text-white">
                            <h4 className="font-black text-xs sm:text-sm drop-shadow-sm">{preset.name}</h4>
                            <p className="text-[10px] text-gray-200 line-clamp-1 opacity-90">{preset.description}</p>
                          </div>
                        </div>

                        {/* Action Bar */}
                        <div className="p-2.5 bg-white flex items-center justify-between text-xs font-bold">
                          <span className="text-gray-500 text-[11px]">يملأ الشاشة بنسبة 100%</span>
                          <button
                            type="button"
                            className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all ${
                              isSelected 
                                ? 'bg-blue-50 text-blue-600' 
                                : 'bg-gray-100 text-gray-800 group-hover:bg-blue-600 group-hover:text-white'
                            }`}
                          >
                            {isSelected ? '✓ مطبّق' : 'تطبيق الغلاف'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: LIVE FULLSCREEN VIEWER & INSPECTOR */}
            {activeTab === 'view' && (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-black aspect-video flex items-center justify-center shadow-inner group">
                  <div className="w-full h-full flex items-center justify-center">
                    <img
                      src={currentCover || DEFAULT_COVER}
                      alt="Current Cover Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Gradient Overlay & Verified Badge */}
                  <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-blue-400" />
                      <span className="text-xs font-bold">غلاف متوافق مع معايير جودة فيسبوك وملء الشاشة الكامل</span>
                    </div>
                  </div>
                </div>

                {/* Quick Action buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleDownloadCover}
                    className="p-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Download size={16} />
                    <span>تنزيل الغلاف بجودة عالية</span>
                  </button>

                  {isOwnProfile && (
                    <button
                      onClick={() => {
                        onClose();
                        onUploadCoverClick();
                      }}
                      className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                    >
                      <Camera size={16} />
                      <span>تغيير ورفع صورة جديدة</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: UPLOAD & CUSTOMIZATION OPTIONS */}
            {activeTab === 'options' && isOwnProfile && (
              <div className="space-y-3">
                {/* 0. Generate with AI across any field */}
                <div 
                  onClick={() => setShowAiCoverModal(true)}
                  className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 flex items-center justify-between cursor-pointer hover:border-purple-300 transition-all group shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 transition-transform">
                      <Sparkles size={22} className="text-yellow-300" />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 text-sm flex items-center gap-1.5">
                        <span>توليد ورفع غلاف بالذكاء الاصطناعي (في أي مجال)</span>
                        <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full">AI Studio</span>
                      </h4>
                      <p className="text-[11px] text-gray-600 font-medium mt-0.5">صمم غلافاً سينمائياً خيالياً في الطبيعة، الفضاء، السيارات، أو التقنية</p>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-gray-400 rotate-180 group-hover:text-purple-600 transition-colors" />
                </div>

                {/* 1. Upload from Device */}
                <div 
                  onClick={() => {
                    onClose();
                    onUploadCoverClick();
                  }}
                  className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-between cursor-pointer hover:border-blue-300 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20  transition-transform">
                      <Camera size={22} />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 text-sm">رفع صورة غلاف من جهازك</h4>
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5">اختر أي صورة شخصية أو لقطة طبيعية ليتم ضبطها لملء الغلاف بالكامل</p>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-blue-600 rotate-180" />
                </div>

                {/* 2. Reset / Delete Cover */}
                <div 
                  onClick={() => setShowConfirmReset(true)}
                  className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 flex items-center justify-between cursor-pointer hover:border-rose-300 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center  transition-transform">
                      <Trash2 size={22} />
                    </div>
                    <div>
                      <h4 className="font-black text-rose-900 text-sm">استعادة غلاف فيسبوك الافتراضي</h4>
                      <p className="text-[11px] text-rose-600/80 font-medium mt-0.5">إزالة التخصيص الحالي والرجوع للغلاف الرسمي العصري</p>
                    </div>
                  </div>
                  <RefreshCw size={18} className="text-rose-600" />
                </div>

                {/* Reset Confirmation */}
                {showConfirmReset && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-white border-2 border-rose-200 rounded-2xl space-y-3"
                  >
                    <p className="text-xs font-bold text-gray-800">هل أنت متأكد من رغبتك في استعادة غلاف فيسبوك الافتراضي؟</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onDeleteCover();
                          setShowConfirmReset(false);
                          onClose();
                        }}
                        className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                      >
                        نعم، استعادة الافتراضي
                      </button>
                      <button
                        onClick={() => setShowConfirmReset(false)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="p-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
              <Sparkles size={14} className="text-blue-600" />
              <span>تصميم فيسبوك المحسّن - بدون حواف فارغة</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
            >
              تم
            </button>
          </div>
        </motion.div>
      </div>

      {/* AI Cover Generator Modal */}
      <AiImagePickerModal
        isOpen={showAiCoverModal}
        onClose={() => setShowAiCoverModal(false)}
        context="cover"
        title="توليد ورفع غلاف الملف الشخصي بالذكاء الاصطناعي 🌌✨"
        subtitle="ابتكر غلافاً سينمائياً فائق الدقة لأي مجال يعبر عن ذوقك وشخصيتك."
        onSelectImage={(newCoverUrl) => {
          onSelectCover(newCoverUrl);
          setShowAiCoverModal(false);
        }}
      />
    </AnimatePresence>
  );
};
