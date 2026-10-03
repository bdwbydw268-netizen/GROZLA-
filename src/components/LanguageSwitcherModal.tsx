import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Globe, Check } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ALL_LANGUAGES, getLanguageInfo } from '../utils/translations';

interface LanguageSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LanguageSwitcherModal({ isOpen, onClose }: LanguageSwitcherModalProps) {
  const { language, setAppLanguage, showToast, direction, t } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');

  const currentLangObj = useMemo(() => getLanguageInfo(language), [language]);

  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) return ALL_LANGUAGES;
    const q = searchQuery.toLowerCase();
    return ALL_LANGUAGES.filter(
      l => l.name.toLowerCase().includes(q) || 
           l.nativeName.toLowerCase().includes(q) || 
           l.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 cursor-default"
        dir={direction}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/80 via-indigo-50/30 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#1877f2] text-white flex items-center justify-center shadow-md shadow-blue-200 shrink-0">
                <Globe size={20} />
              </div>
              <div>
                <h3 className="font-black text-gray-900 text-base">
                  {t('choose_language', 'اختيار لغة التطبيق')}
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  {currentLangObj.nativeName} ({currentLangObj.name})
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-3 border-b border-gray-100 bg-gray-50/60">
            <div className="relative flex items-center">
              <Search size={16} className={`absolute text-gray-400 ${direction === 'rtl' ? 'right-3' : 'left-3'}`} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_language', 'ابحث عن لغة...')}
                className={`w-full py-2 bg-white rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:outline-hidden focus:border-[#1877f2] focus:ring-2 focus:ring-blue-100 transition-all ${
                  direction === 'rtl' ? 'pr-9 pl-8' : 'pl-9 pr-8'
                }`}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className={`absolute p-1 text-gray-400 hover:text-gray-600 ${direction === 'rtl' ? 'left-2.5' : 'right-2.5'}`}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Language List */}
          <div className="p-3 overflow-y-auto flex-1 divide-y divide-gray-100 space-y-2">
            {!searchQuery && (
              <div>
                <p className="text-[11px] font-extrabold text-gray-400 px-3 py-1.5 uppercase tracking-wider">
                  {t('popular_languages', 'اللغات المقترحة')}
                </p>
                <div className="space-y-1">
                  {ALL_LANGUAGES.filter(l => l.popular).map((lang, pIdx) => {
                    const isSelected = language === lang.code;
                    return (
                      <button
                        key={`modal-pop-lang-${lang.code}-${pIdx}`}
                        onClick={() => {
                          setAppLanguage(lang.code);
                          onClose();
                          showToast(`تم تغيير لغة التطبيق إلى ${lang.nativeName} 🌐`);
                        }}
                        className={`w-full p-2.5 rounded-2xl flex items-center justify-between transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-blue-50 border border-blue-200 text-[#1877f2] font-black' 
                            : 'hover:bg-gray-50 text-gray-700 font-bold border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs uppercase ${
                            isSelected ? 'bg-[#1877f2] text-white' : 'bg-gray-100 text-gray-600'
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
            )}

            <div>
              {!searchQuery && (
                <p className="text-[11px] font-extrabold text-gray-400 px-3 py-1.5 uppercase tracking-wider mt-2">
                  {t('all_languages', 'جميع اللغات')}
                </p>
              )}
              <div className="space-y-1">
                {filteredLanguages.map((lang, aIdx) => {
                  const isSelected = language === lang.code;
                  return (
                    <button
                      key={`modal-all-lang-${lang.code}-${aIdx}`}
                      onClick={() => {
                        setAppLanguage(lang.code);
                        onClose();
                        showToast(`تم تغيير لغة التطبيق إلى ${lang.nativeName} 🌐`);
                      }}
                      className={`w-full p-2.5 rounded-2xl flex items-center justify-between transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-blue-50 border border-blue-200 text-[#1877f2] font-black' 
                          : 'hover:bg-gray-50 text-gray-700 font-bold border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs uppercase ${
                          isSelected ? 'bg-[#1877f2] text-white' : 'bg-gray-100 text-gray-600'
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

          {/* Footer */}
          <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
