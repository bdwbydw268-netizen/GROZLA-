import { compressImage, validateImageFile } from '../utils/imageUtils';
import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Video, MapPin, Send, X, Music, Search, Play, Pause, Smile, Globe, Users, Lock, Sparkles, ShieldAlert, Wand2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { REAL_SONGS, Song } from '../constants/music';
import AiImagePickerModal from './AiImagePickerModal';

export default function CreatePost() {
  const { currentUser, addPost, setCurrentView, loadingStates, unrestrictKeyboard, showToast } = useAppContext();
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [media, setMedia] = useState<{ type: 'image' | 'video' | 'music', url: string } | null>(null);
  const [selectedMusic, setSelectedMusic] = useState<{ url: string, title: string, artist: string } | null>(null);
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('public');
  const [feeling, setFeeling] = useState<string | null>(null);
  const [filter, setFilter] = useState('none');
  const [showMusicSelector, setShowMusicSelector] = useState(false);
  const [showFeelingSelector, setShowFeelingSelector] = useState(false);
  const [showAiImagePicker, setShowAiImagePicker] = useState(false);
  const [musicSearch, setMusicSearch] = useState('');
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

  const feelings = [
    { emoji: '😊', label: 'سعيد' },
    { emoji: '😍', label: 'متحمس' },
    { emoji: '🎉', label: 'يحتفل' },
    { emoji: '😎', label: 'رائع' },
    { emoji: '☕', label: 'يستمتع بوقته' },
    { emoji: '✈️', label: 'يسافر' },
    { emoji: '🎧', label: 'يستمع للموسيقى' },
    { emoji: '📖', label: 'يقرأ' },
    { emoji: '💪', label: 'ممتن' },
  ];


  const handleGenerateAiPost = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingAi(true);
    try {
      // First, get the text from AI
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "اكتب منشوراً لمنصة تواصل اجتماعي عن: " + aiPrompt + ". يجب أن يكون المنشور جاهزاً للنشر ومرفقاً بطلب لتوليد صورة مناسبة (باستخدام generateImage) إذا كان ذلك ملائماً." })
      });
      let data: any = null;
      if (response.ok) {
        try {
          data = await response.json();
        } catch (jsonErr) {
          console.warn("Could not parse AI reply JSON:", jsonErr);
        }
      }
      
      if (data?.reply) {
        setContent(data.reply);
      } else {
        setContent(`✨ ${aiPrompt.trim()}\n\nيسعدني مشاركتكم هذه الفكرة واللحظة المميزة! 🌟`);
      }
      if (data?.image) {
        setMedia({ type: 'image', url: data.image });
      }
      setShowAiModal(false);
      setIsExpanded(true);
      setAiPrompt('');
    } catch (err) {
      console.warn("AI post creation fallback:", err);
      setContent(`✨ ${aiPrompt.trim()}\n\nيسعدني مشاركتكم هذه الفكرة واللحظة المميزة! 🌟`);
      setShowAiModal(false);
      setIsExpanded(true);
      setAiPrompt('');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalContent = feeling ? `${content.trim()}${content.trim() ? ' ' : ''}— يشعر بـ ${feeling}` : content.trim();
    if (finalContent || media || selectedMusic) {
      await addPost(
        finalContent, 
        media?.type === 'image' ? media.url : undefined, 
        media?.type === 'video' ? media.url : undefined,
        selectedMusic?.url || (media?.type === 'music' ? media.url : undefined)
      );
      setContent('');
      setMedia(null);
      setSelectedMusic(null);
      setFeeling(null);
      setFilter('none');
      setIsExpanded(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'image') {
        const validation = validateImageFile(file, 25);
        if (!validation.valid) {
          showToast(validation.error || 'الملف المختار غير صالح.');
          e.target.value = '';
          return;
        }
        try {
          showToast('جاري معالجة الصورة... ⏳');
          const compressed = await compressImage(file, 1024, 1024, 0.72);
          setMedia({ type, url: compressed });
          setIsExpanded(true);
        } catch(e) {
          console.warn("Compression failed", e);
          showToast('حدث خطأ أثناء معالجة الصورة. يرجى اختيار صورة أخرى.');
        }
      } else {
        if (file.size > 2000000) {
          showToast('الفيديو كبير جداً. يرجى اختيار فيديو أصغر من 2 ميجابايت.');
          e.target.value = '';
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setMedia({ type, url: reader.result as string });
          setIsExpanded(true);
        };
        reader.readAsDataURL(file);
      }
    }
    e.target.value = '';
  };

  const handleSelectSong = (song: Song) => {
    setSelectedMusic({ url: song.url, title: song.title, artist: song.artist });
    setShowMusicSelector(false);
    setPlayingSongId(null);
    if (audioRef.current) audioRef.current.pause();
    setIsExpanded(true);
  };

  const togglePlaySong = (song: Song) => {
    if (playingSongId === song.id) {
      setPlayingSongId(null);
      if (audioRef.current) audioRef.current.pause();
    } else {
      setPlayingSongId(song.id);
      if (audioRef.current) {
        audioRef.current.src = song.url;
        audioRef.current.play();
      } else {
        const audio = new Audio(song.url);
        audio.play();
        audioRef.current = audio;
      }
    }
  };

  const filteredSongs = REAL_SONGS.filter(s => 
    s.title.toLowerCase().includes(musicSearch.toLowerCase()) || 
    s.artist.toLowerCase().includes(musicSearch.toLowerCase())
  );

  const filters = [
    { name: 'بدون', value: 'none' },
    { name: 'رمادي', value: 'grayscale(100%)' },
    { name: 'بني', value: 'sepia(100%)' },
    { name: 'عكس', value: 'invert(100%)' },
    { name: 'سطوع', value: 'brightness(150%)' },
    { name: 'تباين', value: 'contrast(150%)' },
  ];

  return (
    <div className="bg-white/90 mb-3 border-y sm:border sm:rounded-2xl border-white/80 shadow-md dir-rtl">
      {/* Hidden file inputs */}
      <input type="file" accept="image/*" ref={imageInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'image')} />
      <input type="file" accept="video/*" ref={videoInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'video')} />

      {/* KEYBOARD BAN RESTRICTION ALERT (إذا كان الكيبورد محظوراً لمخالفة معايير الصورة) */}
      {currentUser.isKeyboardBanned && (
        <div className="bg-rose-50 border-b border-rose-200 p-3 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-rose-700 font-bold">
            <ShieldAlert size={18} className="shrink-0 text-rose-600" />
            <div>
              <span>تم حظر الكيبورد ونشر المنشورات لمخالفة معايير الصورة الشخصية.</span>
            </div>
          </div>
          <button
            onClick={() => unrestrictKeyboard()}
            className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-lg text-[11px] font-black shrink-0 cursor-pointer shadow-xs"
          >
            فك الحظر (OWN)
          </button>
        </div>
      )}

      {/* TOP ROW: User avatar + "What's on your mind?" pill input + Quick Photo icon */}
      <div className="p-3 flex items-center gap-2.5">
        <img
          src={currentUser.avatar}
          alt={currentUser.name}
          className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-85 transition-opacity border border-gray-200 shrink-0"
          onClick={() => setCurrentView('profile', currentUser.id)}
          referrerPolicy="no-referrer"
        />

        <div 
          onClick={() => {
            if (currentUser.isKeyboardBanned) {
              showToast('🔒 الكيبورد محظور لديك لمخالفة إرشادات المجتمع (صورة غير لائقة). يمكنك فك الحظر عبر نظام OWN.');
              return;
            }
            setIsExpanded(true);
          }}
          className={`flex-1 bg-[#f0f2f5] hover:bg-[#e4e6eb] transition-colors rounded-full px-4 py-2.5 cursor-pointer text-xs sm:text-sm font-medium flex items-center justify-between select-none ${
            currentUser.isKeyboardBanned ? 'opacity-60 text-rose-600' : 'text-gray-600'
          }`}
        >
          <span>{currentUser.isKeyboardBanned ? 'الكيبورد محظور مؤقتاً لمخالفة الصورة الشخصية...' : `بم تفكر، ${currentUser.name.split(' ')[0]}؟`}</span>
        </div>


        {/* AI Generate Button */}
        <button
          onClick={() => {
            if (currentUser.isKeyboardBanned) return;
            setShowAiModal(true);
          }}
          className="p-2 text-purple-600 hover:bg-purple-50 rounded-full transition-colors cursor-pointer shrink-0"
          title="توليد منشور بالذكاء الاصطناعي"
        >
          <Sparkles size={22} strokeWidth={2.4} />
        </button>
        {/* Quick Photo Upload Button */}
        <button
          onClick={() => {
            if (currentUser.isKeyboardBanned) {
              showToast('🔒 النشر مقيد لمخالفة إرشادات المجتمع.');
              return;
            }
            imageInputRef.current?.click();
          }}
          className="p-2 text-[#45bd62] hover:bg-green-50 rounded-full transition-colors cursor-pointer shrink-0"
          title="إضافة صورة"
        >
          <ImageIcon size={22} strokeWidth={2.4} />
        </button>
      </div>

      {/* BOTTOM ROW: 4 Quick Action Bar Buttons (Facebook Lite Authentic Style + AI Image System) */}
      <div className="border-t border-gray-150 grid grid-cols-4 divide-x divide-x-reverse divide-gray-150 px-1 py-1 text-xs font-bold text-gray-700">
        {/* 1. بث مباشر (Live) */}
        <button 
          onClick={() => {
            showToast('خاصية البث المباشر ستتوفر قريباً!');
          }}
          className="flex items-center justify-center gap-1 py-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group"
        >
          <Video size={17} className="text-[#f02849] group-hover:scale-110 transition-transform" strokeWidth={2.4} />
          <span className="truncate">بث مباشر</span>
        </button>

        {/* 2. صورة / فيديو (Photo / Video) */}
        <button 
          onClick={() => imageInputRef.current?.click()}
          className="flex items-center justify-center gap-1 py-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group"
        >
          <ImageIcon size={17} className="text-[#45bd62] group-hover:scale-110 transition-transform" strokeWidth={2.4} />
          <span className="truncate">صورة/فيديو</span>
        </button>

        {/* 3. صور الذكاء الاصطناعي في جميع المجالات (AI Images in All Domains) */}
        <button 
          onClick={() => setShowAiImagePicker(true)}
          className="flex items-center justify-center gap-1 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 rounded-lg text-purple-700 transition-all cursor-pointer group font-black"
          title="نظام الذكاء الاصطناعي لإظهار وتوليد صور في جميع المجالات"
        >
          <Wand2 size={16} className="text-purple-600 group-hover:rotate-12 transition-transform" strokeWidth={2.4} />
          <span className="truncate">صور AI 🎨</span>
        </button>

        {/* 4. شعور / نشاط / موسيقى (Feeling / Music) */}
        <button 
          onClick={() => {
            setIsExpanded(true);
            setShowFeelingSelector(true);
          }}
          className="flex items-center justify-center gap-1 py-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group"
        >
          <Smile size={17} className="text-[#f7b125] group-hover:scale-110 transition-transform" strokeWidth={2.4} />
          <span className="truncate">شعور</span>
        </button>
      </div>

      {/* EXPANDED FULL POST COMPOSER MODAL */}
      <AnimatePresence>
        {isExpanded && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-100 dir-rtl"
            >
              {/* Modal Header */}
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between relative">
                <h3 className="font-extrabold text-base text-gray-900 text-center w-full">إنشاء منشور</h3>
                <button 
                  type="button"
                  onClick={() => {
                    setIsExpanded(false);
                    setShowFeelingSelector(false);
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex-1 space-y-3">
                {/* User info and Privacy Selector */}
                <div className="flex items-center gap-3">
                  <img 
                    src={currentUser.avatar} 
                    alt={currentUser.name} 
                    className="w-11 h-11 rounded-full object-cover border border-gray-200"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                      <span>{currentUser.name}</span>
                      {feeling && (
                        <span className="text-xs font-normal text-gray-600">
                          يشعر بـ <span className="font-semibold text-amber-600">{feeling}</span>
                        </span>
                      )}
                    </h4>
                    
                    {/* Privacy Selector Pill */}
                    <div className="flex items-center gap-1 mt-1">
                      <button 
                        type="button"
                        onClick={() => {
                          const next = privacy === 'public' ? 'friends' : privacy === 'friends' ? 'private' : 'public';
                          setPrivacy(next);
                        }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold cursor-pointer"
                      >
                        {privacy === 'public' && <Globe size={11} />}
                        {privacy === 'friends' && <Users size={11} />}
                        {privacy === 'private' && <Lock size={11} />}
                        <span>{privacy === 'public' ? 'العامة' : privacy === 'friends' ? 'الأصدقاء' : 'أنا فقط'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Textarea */}
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`بم تفكر يا ${currentUser.name.split(' ')[0]}؟`}
                  className="w-full text-base placeholder:text-gray-400 text-gray-900 border-none outline-none resize-none min-h-[110px] leading-relaxed"
                  autoFocus
                />

                {/* Media Preview (Image, Video, Music) */}
                {(media || selectedMusic) && (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 p-2.5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-gray-500">معاينة المحتوى المرفق</span>
                      <button 
                        type="button"
                        onClick={() => { setMedia(null); setSelectedMusic(null); setFilter('none'); }} 
                        className="p-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full cursor-pointer transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {media?.type === 'image' && (
                      <div className="space-y-2.5">
                        <div className="relative rounded-lg overflow-hidden bg-black/90 flex items-center justify-center min-h-[180px]">
                          <img 
                            src={media.url} 
                            alt="Preview" 
                            className="max-w-full max-h-64 object-contain transition-all duration-300" 
                            style={{ filter }}
                          />
                        </div>
                        {/* Filter Selection */}
                        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                          {filters.map((f, fIdx) => (
                            <button
                              key={`post-filter-${f.value}-${fIdx}`}
                              type="button"
                              onClick={() => setFilter(f.value)}
                              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                                filter === f.value ? 'bg-[#8b5cf6] text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {f.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {media?.type === 'video' && (
                      <video src={media.url} controls className="w-full max-h-64 object-contain bg-black rounded-lg" />
                    )}

                    {selectedMusic && (
                      <div className="p-3 bg-purple-50 rounded-xl flex items-center gap-3 border border-purple-100">
                        <div className="bg-[#8b5cf6] p-2 rounded-full text-white animate-pulse shrink-0">
                          <Music size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-purple-900 truncate">{selectedMusic.title} - {selectedMusic.artist}</p>
                          <audio src={selectedMusic.url} controls className="w-full h-7 mt-1" />
                        </div>
                        <button 
                          type="button"
                          onClick={() => setSelectedMusic(null)}
                          className="text-purple-400 hover:text-purple-600 p-1 cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Feeling Picker Popup */}
                {showFeelingSelector && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900">اختر شعورك الآن:</span>
                      <button 
                        type="button"
                        onClick={() => setShowFeelingSelector(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {feelings.map((f, feelIdx) => (
                        <button
                          key={`post-feeling-${f.label}-${feelIdx}`}
                          type="button"
                          onClick={() => {
                            setFeeling(f.label);
                            setShowFeelingSelector(false);
                          }}
                          className={`px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                            feeling === f.label ? 'bg-amber-500 text-white' : 'bg-white hover:bg-amber-100 text-gray-800 border border-amber-200/60'
                          }`}
                        >
                          <span>{f.emoji}</span>
                          <span className="truncate">{f.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add to Post Toolbar Box (Facebook Lite Style) */}
                <div className="border border-gray-200 rounded-xl p-3 flex items-center justify-between bg-white shadow-2xs">
                  <span className="text-xs font-black text-gray-700">إضافة إلى منشورك</span>
                  
                  <div className="flex items-center gap-1">
                    {/* Photos */}
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="p-2 rounded-full hover:bg-green-50 text-[#45bd62] transition-colors cursor-pointer"
                      title="صورة من جهازك"
                    >
                      <ImageIcon size={20} />
                    </button>

                    {/* AI Images in all domains */}
                    <button
                      type="button"
                      onClick={() => setShowAiImagePicker(true)}
                      className="p-2 rounded-full hover:bg-purple-50 text-purple-600 transition-colors cursor-pointer flex items-center gap-1 font-bold text-xs"
                      title="صور الذكاء الاصطناعي في جميع المجالات"
                    >
                      <Wand2 size={20} />
                    </button>

                    {/* Video */}
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="p-2 rounded-full hover:bg-red-50 text-[#f02849] transition-colors cursor-pointer"
                      title="فيديو"
                    >
                      <Video size={20} />
                    </button>

                    {/* Feeling */}
                    <button
                      type="button"
                      onClick={() => setShowFeelingSelector(!showFeelingSelector)}
                      className="p-2 rounded-full hover:bg-amber-50 text-[#f7b125] transition-colors cursor-pointer"
                      title="شعور / نشاط"
                    >
                      <Smile size={20} />
                    </button>

                    {/* Music */}
                    <button
                      type="button"
                      onClick={() => setShowMusicSelector(true)}
                      className="p-2 rounded-full hover:bg-purple-50 text-[#8b5cf6] transition-colors cursor-pointer"
                      title="موسيقى"
                    >
                      <Music size={20} />
                    </button>
                  </div>
                </div>

                {/* Submit Post Button */}
                <button 
                  type="submit"
                  disabled={(!content.trim() && !media && !selectedMusic && !feeling) || loadingStates.addingPost}
                  className="w-full bg-[#8b5cf6] hover:bg-purple-700 active:bg-purple-800 text-white py-2.5 rounded-xl font-black text-sm disabled:opacity-45 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  {loadingStates.addingPost ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>جاري النشر...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} className="rtl:-scale-x-100" />
                      <span>نشر</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Music Selector Modal */}
      <AnimatePresence>
        {showMusicSelector && (
          <div className="fixed inset-0 bg-black/75 z-[70] flex items-center justify-center p-3 sm:p-4 dir-rtl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-2xl overflow-hidden flex flex-col max-h-[82vh] shadow-2xl"
            >
              <div className="p-3.5 border-b border-gray-100 flex justify-between items-center bg-[#8b5cf6] text-white">
                <div className="flex items-center gap-2">
                  <Music size={18} />
                  <h3 className="font-extrabold text-sm">اختر مقطعاً صوتياً أو أغنية</h3>
                </div>
                <button 
                  onClick={() => { setShowMusicSelector(false); setPlayingSongId(null); if (audioRef.current) audioRef.current.pause(); }} 
                  className="p-1 hover:bg-white/20 rounded-full cursor-pointer text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-3 bg-gray-50 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="ابحث عن أغنية أو فنان..." 
                    value={musicSearch}
                    onChange={(e) => setMusicSearch(e.target.value)}
                    className="w-full pr-9 pl-4 py-2 bg-white rounded-xl border border-gray-200 outline-none focus:border-[#8b5cf6] text-xs sm:text-sm transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1.5 no-scrollbar">
                {filteredSongs.map((song, sIdx) => (
                  <div 
                    key={`create-song-${song.id}-${sIdx}`}
                    className="flex items-center gap-3 p-2.5 hover:bg-purple-50/70 rounded-xl cursor-pointer transition-colors group border border-transparent hover:border-purple-100"
                  >
                    <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 shadow-2xs">
                      <img src={song.cover} alt={song.title} className="w-full h-full object-cover" />
                      <button 
                        onClick={(e) => { e.stopPropagation(); togglePlaySong(song); }}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {playingSongId === song.id ? <Pause size={18} /> : <Play size={18} />}
                      </button>
                    </div>
                    <div className="flex-1 min-w-0" onClick={() => handleSelectSong(song)}>
                      <h4 className="font-bold text-xs sm:text-sm text-gray-800 truncate">{song.title}</h4>
                      <p className="text-[11px] text-gray-500 truncate">{song.artist}</p>
                    </div>
                    <button 
                      onClick={() => handleSelectSong(song)}
                      className="px-3 py-1 bg-purple-50 hover:bg-[#8b5cf6] text-[#8b5cf6] hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      اختيار
                    </button>
                  </div>
                ))}
                {filteredSongs.length === 0 && (
                  <div className="text-center py-10 text-gray-500">
                    <Music size={40} className="mx-auto mb-2 opacity-20" />
                    <p className="text-xs">لا توجد نتائج للبحث.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* AI Generator Modal */}
      <AnimatePresence>
        {showAiModal && (
          <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 dir-rtl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles size={20} />
                  <h3 className="font-extrabold text-sm">مساعد النشر الذكي 🤖</h3>
                </div>
                <button onClick={() => setShowAiModal(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <p className="text-xs text-gray-600 font-bold">
                  اكتب فكرة وسيقوم الذكاء الاصطناعي (OWN AI) بكتابة المنشور وتوليد صورة أو فيديو مناسب له!
                </p>
                <textarea 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="مثال: قطة رائدة فضاء على كوكب المريخ..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold outline-none focus:border-purple-500 bg-gray-50 resize-none"
                />
                <button 
                  onClick={handleGenerateAiPost}
                  disabled={isGeneratingAi || !aiPrompt.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 transition-colors flex justify-center items-center gap-2 shadow-md cursor-pointer"
                >
                  {isGeneratingAi ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>جاري التوليد (قد يستغرق وقتاً)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>توليد المنشور والصورة</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Domain Image Picker Modal */}
      <AiImagePickerModal
        isOpen={showAiImagePicker}
        onClose={() => setShowAiImagePicker(false)}
        onSelectImage={(imageUrl, title) => {
          setMedia({ type: 'image', url: imageUrl });
          if (!content.trim() && title) {
            setContent(title);
          }
          setIsExpanded(true);
        }}
        postContent={content}
      />

    </div>
  );
}

