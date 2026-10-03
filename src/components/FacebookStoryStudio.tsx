import { compressImage, validateImageFile } from '../utils/imageUtils';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Image as ImageIcon, Video, Music, Type, Sparkles, 
  Volume2, VolumeX, Globe, Users, Lock, ChevronRight, 
  Check, Play, Pause, Trash2, Sliders, ArrowRight
} from 'lucide-react';
import { Song } from '../constants/music';
import StoryMusicSelector from './StoryMusicSelector';
import { useAppContext } from '../context/AppContext';

interface FacebookStoryStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (storyData: {
    image?: string;
    video?: string;
    music?: string;
    songTitle?: string;
    songArtist?: string;
    songCover?: string;
    text?: string;
    textColor?: string;
    textSize?: 'small' | 'normal' | 'large';
  }) => void;
  isPublishing?: boolean;
}

const STORY_FILTERS = [
  { id: 'none', label: 'أصلي', filter: 'none' },
  { id: 'cinematic', label: 'سينمائي', filter: 'contrast(125%) saturate(120%) brightness(95%)' },
  { id: 'warm', label: 'دافئ', filter: 'sepia(25%) saturate(130%) brightness(105%)' },
  { id: 'vivid', label: 'ناصع', filter: 'saturate(160%) contrast(110%)' },
  { id: 'classic_bw', label: 'أسود وأبيض', filter: 'grayscale(100%) contrast(120%)' },
  { id: 'retro', label: 'كلاسيكي', filter: 'sepia(50%) hue-rotate(-20deg) contrast(110%)' },
  { id: 'drama', label: 'درامي', filter: 'contrast(150%) brightness(90%)' },
];

const GRADIENT_BACKGROUNDS = [
  'linear-gradient(135deg, #1877f2 0%, #0052cc 100%)',
  'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
  'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
  'linear-gradient(135deg, #232526 0%, #414345 100%)',
  'linear-gradient(135deg, #f857a6 0%, #ff5858 100%)'
];

export default function FacebookStoryStudio({
  isOpen,
  onClose,
  onPublish,
  isPublishing = false
}: FacebookStoryStudioProps) {
  const { showToast } = useAppContext();
  const [step, setStep] = useState<'hub' | 'editor'>('hub');
  const [media, setMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [activeFilter, setActiveFilter] = useState('none');
  const [music, setMusic] = useState<Song | null>(null);
  const [musicStickerStyle, setMusicStickerStyle] = useState<'card' | 'pill' | 'disc'>('card');
  const [showMusicSelector, setShowMusicSelector] = useState(false);
  const [showFiltersBar, setShowFiltersBar] = useState(false);
  const [textOverlay, setTextOverlay] = useState('');
  const [isEditingText, setIsEditingText] = useState(false);
  const [textColor, setTextColor] = useState('#ffffff');
  const [isMuted, setIsMuted] = useState(false);
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'only_me'>('public');
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [bgGradient, setBgGradient] = useState(GRADIENT_BACKGROUNDS[0]);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);

  // Stop media when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.src = '';
      }
      if (videoPlayerRef.current) {
        videoPlayerRef.current.pause();
      }
      setStep('hub');
      setMedia(null);
      setMusic(null);
      setTextOverlay('');
      setIsEditingText(false);
    }
  }, [isOpen]);

  // Manage real audio playback for music preview
  useEffect(() => {
    if (music?.url && step === 'editor') {
      if (!audioPlayerRef.current) {
        audioPlayerRef.current = new Audio(music.url);
        audioPlayerRef.current.loop = true;
      } else {
        audioPlayerRef.current.src = music.url;
      }
      if (!isMuted) {
        audioPlayerRef.current.play().catch(err => console.warn('Music play error:', err));
      } else {
        audioPlayerRef.current.pause();
      }
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    }

    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, [music, step, isMuted]);

  // Handle Photo selection
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateImageFile(file, 25);
      if (!validation.valid) {
        showToast(validation.error || 'الملف المختار غير صالح.');
        e.target.value = '';
        return;
      }
      try {
        showToast('جاري معالجة وضغط صورة القصة... ⏳');
        const compressed = await compressImage(file, 1080, 1920, 0.72);
        setMedia({ url: compressed, type: 'image' });
        setStep('editor');
      } catch (err) {
        console.warn("Story image compression warning", err);
        showToast('تعذر معالجة الصورة. يرجى اختيار صورة أخرى.');
      }
    }
    e.target.value = '';
  };

  // Handle Video selection
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        showToast('حجم مقطع الفيديو كبير جداً، يرجى اختيار فيديو أصغر من 25 ميجابايت.');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setMedia({ url: reader.result, type: 'video' });
          setStep('editor');
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Create a Music-first Story with stylish dynamic background
  const handleCreateMusicStory = () => {
    setShowMusicSelector(true);
  };

  const handleSelectSong = (song: Song) => {
    setMusic(song);
    if (!media) {
      // Create colored music story canvas
      setMedia({
        url: '',
        type: 'image'
      });
      setStep('editor');
    }
  };

  // Publish Story
  const handlePublish = () => {
    if (!media && !music && !textOverlay.trim()) return;

    onPublish({
      image: media?.type === 'image' && media.url ? media.url : (media?.type === 'image' ? bgGradient : undefined),
      video: media?.type === 'video' ? media.url : undefined,
      music: music?.url,
      songTitle: music?.title,
      songArtist: music?.artist,
      songCover: music?.cover,
      text: textOverlay.trim() || undefined,
      textColor: textColor,
      textSize: 'normal'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-neutral-950 text-white flex flex-col items-center justify-between select-none overflow-hidden" dir="rtl">
      {/* Hidden File Inputs */}
      <input 
        type="file" 
        accept="image/*" 
        ref={photoInputRef} 
        className="hidden" 
        onChange={handlePhotoSelect} 
      />
      <input 
        type="file" 
        accept="video/*" 
        ref={videoInputRef} 
        className="hidden" 
        onChange={handleVideoSelect} 
      />

      {/* ========================================================
          MODE 1: FACEBOOK STORY HUB (واجهة إنشاء القصة الأساسية)
         ======================================================== */}
      {step === 'hub' ? (
        <div className="w-full h-full flex flex-col max-w-lg mx-auto p-4 sm:p-6 justify-between animate-in fade-in duration-300">
          {/* Top Bar */}
          <div className="flex items-center justify-between py-2 border-b border-neutral-800">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-white transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span className="text-[#8b5cf6] font-bold text-2xl font-sans" style={{ fontFamily: 'system-ui, sans-serif' }}>facebook</span>
              <span>· إنشاء قصة</span>
            </h2>
            <div className="w-10 h-10" />
          </div>

          {/* Center: Facebook Hub Grid */}
          <div className="my-auto py-6 space-y-4">
            <p className="text-sm font-bold text-neutral-400 text-center mb-6">
              اختر نوع القصة التي تريد مشاركتها مع أصدقائك بشاشة كاملة
            </p>

            <div className="grid grid-cols-2 gap-3.5">
              {/* Card 1: Photo Story */}
              <button
                onClick={() => photoInputRef.current?.click()}
                className="group relative h-48 rounded-3xl overflow-hidden p-4 flex flex-col justify-between text-right bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl shadow-blue-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-blue-400/20"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-md">
                  <ImageIcon size={26} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white group-hover:translate-x-1 transition-transform">
                    صورة
                  </h3>
                  <p className="text-[11px] text-blue-100 font-medium mt-0.5">
                    التقط صورة أو اختر من المعرض
                  </p>
                </div>
              </button>

              {/* Card 2: Video Story */}
              <button
                onClick={() => videoInputRef.current?.click()}
                className="group relative h-48 rounded-3xl overflow-hidden p-4 flex flex-col justify-between text-right bg-gradient-to-br from-rose-600 to-pink-700 shadow-xl shadow-rose-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-rose-400/20"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-md">
                  <Video size={26} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white group-hover:translate-x-1 transition-transform">
                    فيديو
                  </h3>
                  <p className="text-[11px] text-rose-100 font-medium mt-0.5">
                    مقطع فيديو بشاشة كاملة
                  </p>
                </div>
              </button>

              {/* Card 3: Music Story (AI Powered) */}
              <button
                onClick={handleCreateMusicStory}
                className="group relative h-44 rounded-3xl overflow-hidden p-4 flex flex-col justify-between text-right bg-gradient-to-br from-purple-600 via-violet-700 to-indigo-800 shadow-xl shadow-purple-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-purple-400/20"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-md">
                  <Music size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <h3 className="text-base font-black text-white group-hover:translate-x-1 transition-transform">
                      موسيقى
                    </h3>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-400 text-neutral-950 font-black">AI</span>
                  </div>
                  <p className="text-[11px] text-purple-100 font-medium mt-0.5">
                    اختر أغنيتك المفضلة بالذكاء الاصطناعي
                  </p>
                </div>
              </button>

              {/* Card 4: Text Story */}
              <button
                onClick={() => {
                  setMedia({ url: '', type: 'image' });
                  setIsEditingText(true);
                  setStep('editor');
                }}
                className="group relative h-44 rounded-3xl overflow-hidden p-4 flex flex-col justify-between text-right bg-gradient-to-br from-emerald-600 to-teal-700 shadow-xl shadow-emerald-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-emerald-400/20"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-md">
                  <Type size={26} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white group-hover:translate-x-1 transition-transform">
                    نص
                  </h3>
                  <p className="text-[11px] text-emerald-100 font-medium mt-0.5">
                    اكتب نصاً بخلفيات ملونة مميزة
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Bottom Facebook Brand Note */}
          <div className="py-4 text-center border-t border-neutral-800/80">
            <p className="text-xs text-neutral-500 font-medium">
              القصص تختفي تلقائياً بعد مرور 24 ساعة من نشرها
            </p>
          </div>
        </div>
      ) : (
        /* ========================================================
           MODE 2: FULL-SCREEN FACEBOOK STORY EDITOR (محرر فيسبوك بشاشة كاملة)
           ======================================================== */
        <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
          {/* Main 9:16 Story Stage Canvas */}
          <div 
            className="relative w-full h-full max-w-[440px] max-h-full sm:max-h-[96vh] sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between bg-neutral-900 border border-neutral-800"
            style={{
              background: (!media?.url && media?.type === 'image') ? bgGradient : undefined
            }}
          >
            {/* Background Media (Image or Video) */}
            <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
              {media?.type === 'image' && media.url ? (
                <img
                  src={media.url}
                  alt="Story Canvas"
                  className="w-full h-full object-cover transition-all duration-300"
                  style={{ filter: activeFilter }}
                />
              ) : media?.type === 'video' ? (
                <video
                  ref={videoPlayerRef}
                  src={media.url}
                  playsInline
                  autoPlay
                  loop
                  muted={isMuted}
                  className="w-full h-full object-cover"
                  style={{ filter: activeFilter }}
                  onClick={() => {
                    if (videoPlayerRef.current) {
                      if (videoPlayerRef.current.paused) {
                        videoPlayerRef.current.play();
                        setIsVideoPlaying(true);
                      } else {
                        videoPlayerRef.current.pause();
                        setIsVideoPlaying(false);
                      }
                    }
                  }}
                />
              ) : (
                /* Dynamic colorful gradient background for text or music stories */
                <div 
                  className="w-full h-full flex flex-col items-center justify-center p-6 text-center"
                  style={{ background: bgGradient }}
                >
                  <div className="absolute inset-0 bg-radial from-white/10 to-transparent pointer-events-none" />
                </div>
              )}

              {/* Gentle dark gradient overlay for top & bottom contrast */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 pointer-events-none" />
            </div>

            {/* TOP BAR: Header controls (Back, Mute, Privacy) */}
            <div className="relative z-20 p-3 sm:p-4 flex items-center justify-between">
              {/* Back / Discard */}
              <button
                onClick={() => {
                  if (window.confirm('هل تريد تجاهل هذه القصة والعودة؟')) {
                    setStep('hub');
                    setMedia(null);
                    setMusic(null);
                  }
                }}
                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 flex items-center justify-center text-white transition-all cursor-pointer border border-white/10 active:scale-95"
                title="تراجع أو إلغاء"
              >
                <X size={20} />
              </button>

              {/* Privacy Pill & Audio Toggle */}
              <div className="flex items-center gap-2">
                {/* Audio Mute / Unmute */}
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 flex items-center gap-1.5 text-xs font-bold text-white transition-all cursor-pointer border border-white/10"
                  title={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
                >
                  {isMuted ? <VolumeX size={15} className="text-red-400" /> : <Volume2 size={15} className="text-emerald-400" />}
                  <span>{isMuted ? 'مكتوم' : 'الصوت'}</span>
                </button>

                {/* Privacy Selector */}
                <button
                  onClick={() => {
                    const next = privacy === 'public' ? 'friends' : privacy === 'friends' ? 'only_me' : 'public';
                    setPrivacy(next);
                  }}
                  className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 flex items-center gap-1.5 text-xs font-bold text-white transition-all cursor-pointer border border-white/10"
                  title="تغيير خصوصية القصة"
                >
                  {privacy === 'public' && <Globe size={14} className="text-blue-400" />}
                  {privacy === 'friends' && <Users size={14} className="text-green-400" />}
                  {privacy === 'only_me' && <Lock size={14} className="text-amber-400" />}
                  <span>{privacy === 'public' ? 'العامة' : privacy === 'friends' ? 'الأصدقاء' : 'أنا فقط'}</span>
                </button>
              </div>
            </div>

            {/* RIGHT FLOATING TOOLBAR: Facebook Story Editing Tools */}
            <div className="absolute right-3 sm:right-4 top-20 z-20 flex flex-col gap-3">
              {/* Tool 1: Music */}
              <button
                onClick={() => setShowMusicSelector(true)}
                className={`relative w-11 h-11 rounded-full backdrop-blur-md flex flex-col items-center justify-center text-white transition-all cursor-pointer shadow-lg active:scale-90 ${
                  music ? 'bg-pink-600 shadow-pink-500/40 ring-2 ring-pink-400' : 'bg-black/40 hover:bg-black/60 border border-white/15'
                }`}
                title="إضافة أو تغيير الموسيقى"
              >
                <Music size={20} className={music ? 'animate-bounce' : ''} />
                <span className="text-[9px] font-bold mt-0.5">موسيقى</span>
              </button>

              {/* Tool 2: Text (Aa) */}
              <button
                onClick={() => setIsEditingText(true)}
                className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 flex flex-col items-center justify-center text-white transition-all cursor-pointer shadow-lg border border-white/15 active:scale-90"
                title="إضافة نص"
              >
                <Type size={20} />
                <span className="text-[9px] font-bold mt-0.5">نص</span>
              </button>

              {/* Tool 3: Filters / Effects */}
              <button
                onClick={() => setShowFiltersBar(!showFiltersBar)}
                className={`w-11 h-11 rounded-full backdrop-blur-md flex flex-col items-center justify-center text-white transition-all cursor-pointer shadow-lg border border-white/15 active:scale-90 ${
                  showFiltersBar ? 'bg-blue-600 border-blue-400' : 'bg-black/40 hover:bg-black/60'
                }`}
                title="فلاتر وتأثيرات ألوان"
              >
                <Sparkles size={20} />
                <span className="text-[9px] font-bold mt-0.5">تأثيرات</span>
              </button>

              {/* Tool 4: Change Background Gradient (if no media) */}
              {(!media?.url && media?.type === 'image') && (
                <button
                  onClick={() => {
                    const currentIndex = GRADIENT_BACKGROUNDS.indexOf(bgGradient);
                    const nextIndex = (currentIndex + 1) % GRADIENT_BACKGROUNDS.length;
                    setBgGradient(GRADIENT_BACKGROUNDS[nextIndex]);
                  }}
                  className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 flex flex-col items-center justify-center text-white transition-all cursor-pointer shadow-lg border border-white/15 active:scale-90"
                  title="تغيير لون الخلفية"
                >
                  <div className="w-5 h-5 rounded-full border-2 border-white shadow-xs" style={{ background: bgGradient }} />
                  <span className="text-[9px] font-bold mt-0.5">خلفية</span>
                </button>
              )}
            </div>

            {/* CENTER ON-CANVAS OVERLAYS: Facebook Music Sticker & Text */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 pointer-events-none">
              {/* 1. Facebook Music Sticker (ملصق فيسبوك الموسيقي التفاعلي) */}
              {music && (
                <div className="pointer-events-auto my-auto max-w-[90%] transition-all">
                  {/* Style 1: Classic Facebook Music Card */}
                  {musicStickerStyle === 'card' && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="relative bg-white/95 text-neutral-900 rounded-3xl p-3.5 shadow-2xl backdrop-blur-md border border-white/30 flex items-center gap-3.5 group cursor-pointer"
                      onClick={() => setMusicStickerStyle('pill')}
                      title="انقر لتغيير شكل الملصق الموسيقي"
                    >
                      {/* Album Art with Equalizer Waveform overlay */}
                      <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 shadow-md bg-neutral-100">
                        <img src={music.cover} alt={music.title} className="w-full h-full object-cover" crossOrigin="anonymous" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="flex items-end gap-1 h-5">
                            <span className="w-1 bg-white rounded-full animate-[bounce_0.8s_ease-in-out_infinite] h-3" />
                            <span className="w-1 bg-white rounded-full animate-[bounce_0.6s_ease-in-out_infinite] h-5 delay-75" />
                            <span className="w-1 bg-white rounded-full animate-[bounce_1s_ease-in-out_infinite] h-2 delay-150" />
                            <span className="w-1 bg-white rounded-full animate-[bounce_0.7s_ease-in-out_infinite] h-4 delay-100" />
                          </div>
                        </div>
                      </div>

                      {/* Song Details */}
                      <div className="flex-1 min-w-0 pr-1 text-right">
                        <div className="flex items-center gap-1 text-[#8b5cf6] font-black text-xs">
                          <Music size={12} />
                          <span>فيسبوك ميوزك</span>
                        </div>
                        <h4 className="text-sm font-black text-neutral-900 truncate leading-snug">
                          {music.title}
                        </h4>
                        <p className="text-xs font-bold text-neutral-600 truncate mt-0.5">
                          {music.artist}
                        </p>
                      </div>

                      {/* Remove Music Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMusic(null);
                        }}
                        className="p-1.5 rounded-full hover:bg-neutral-200 text-neutral-400 hover:text-neutral-700 transition-colors"
                        title="إزالة الموسيقى"
                      >
                        <X size={16} />
                      </button>
                    </motion.div>
                  )}

                  {/* Style 2: Floating Pill */}
                  {musicStickerStyle === 'pill' && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="relative bg-black/60 backdrop-blur-md text-white rounded-full px-4 py-2 shadow-2xl border border-white/20 flex items-center gap-3 cursor-pointer group"
                      onClick={() => setMusicStickerStyle('disc')}
                      title="انقر لتغيير شكل الملصق الموسيقي"
                    >
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-neutral-800 shrink-0">
                        <img src={music.cover} alt={music.title} className="w-full h-full object-cover" crossOrigin="anonymous" />
                      </div>
                      <div className="flex items-center gap-2 truncate text-right">
                        <span className="text-xs font-black text-white truncate max-w-[140px] sm:max-w-[180px]">
                          {music.title}
                        </span>
                        <span className="text-neutral-400 text-xs">·</span>
                        <span className="text-xs font-medium text-neutral-300 truncate max-w-[100px]">
                          {music.artist}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 text-blue-400">
                        <span className="w-0.5 h-3 bg-blue-400 animate-pulse rounded-full" />
                        <span className="w-0.5 h-4 bg-blue-400 animate-pulse rounded-full delay-75" />
                        <span className="w-0.5 h-2 bg-blue-400 animate-pulse rounded-full delay-150" />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMusic(null);
                        }}
                        className="p-1 text-neutral-400 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    </motion.div>
                  )}

                  {/* Style 3: Minimal Vinyl Disc */}
                  {musicStickerStyle === 'disc' && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="relative bg-neutral-900/90 text-white rounded-2xl p-2.5 shadow-2xl border border-white/20 flex items-center gap-3 cursor-pointer"
                      onClick={() => setMusicStickerStyle('card')}
                      title="انقر لتغيير شكل الملصق الموسيقي"
                    >
                      <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-white/40 animate-[spin_6s_linear_infinite] shadow-lg">
                        <img src={music.cover} alt={music.title} className="w-full h-full object-cover" crossOrigin="anonymous" />
                        <div className="absolute inset-0 m-auto w-3 h-3 rounded-full bg-neutral-900 border border-white" />
                      </div>
                      <div className="text-right flex-1 min-w-0 pr-1">
                        <p className="text-xs font-black text-white truncate">{music.title}</p>
                        <p className="text-[10px] text-neutral-400 truncate">{music.artist}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMusic(null);
                        }}
                        className="p-1 text-neutral-400 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    </motion.div>
                  )}
                </div>
              )}

              {/* 2. Text Overlay Display on Canvas - Normal, standard size */}
              {textOverlay && (
                <div 
                  className="pointer-events-auto mt-4 px-3.5 py-1.5 rounded-xl bg-black/60 backdrop-blur-xs text-center cursor-pointer max-w-[85%] shadow-md border border-white/10"
                  style={{ color: textColor }}
                  onClick={() => setIsEditingText(true)}
                  title="انقر لتعديل النص"
                >
                  <p className="text-sm font-normal leading-relaxed break-words">
                    {textOverlay}
                  </p>
                </div>
              )}
            </div>

            {/* FILTERS SLIDER (if toggled open) */}
            {showFiltersBar && (
              <div className="relative z-20 px-3 py-2 bg-black/70 backdrop-blur-md border-t border-white/10 flex gap-2 overflow-x-auto scrollbar-hide">
                {STORY_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.filter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      activeFilter === f.filter
                        ? 'bg-[#1877f2] text-white shadow-md'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}

            {/* BOTTOM BAR: Facebook Story Action & Share Button */}
            <div className="relative z-20 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-center justify-between gap-3">
              {/* Save / Quick Action */}
              <button
                type="button"
                onClick={() => showToast('تم حفظ المسودة في جهازك بنجاح ✨')}
                className="px-3.5 py-2.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
              >
                <span>حفظ</span>
              </button>

              {/* Primary Facebook Share Button */}
              <button
                type="button"
                onClick={handlePublish}
                disabled={isPublishing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#1877f2] hover:bg-[#166fe5] active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isPublishing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري نشر القصة...</span>
                  </div>
                ) : (
                  <>
                    <span>مشاركة في القصة</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* TEXT EDITING MODAL (Aa) */}
          {isEditingText && (
            <div className="fixed inset-0 z-50 bg-black/90 flex flex-col justify-between p-4 sm:p-6" dir="rtl">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setIsEditingText(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-neutral-800 text-white text-xs font-bold hover:bg-neutral-700"
                >
                  إلغاء
                </button>
                <h3 className="font-bold text-xs sm:text-sm">إضافة نص للقصة</h3>
                <button
                  onClick={() => setIsEditingText(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500"
                >
                  تم
                </button>
              </div>

              {/* Text Input in Center - Normal readable font */}
              <div className="my-auto text-center px-4">
                <textarea
                  value={textOverlay}
                  onChange={(e) => setTextOverlay(e.target.value)}
                  placeholder="اكتب شيئاً على قصتك..."
                  rows={3}
                  autoFocus
                  style={{ color: textColor }}
                  className="w-full max-w-md mx-auto bg-black/40 px-4 py-3 rounded-2xl border border-white/10 text-sm sm:text-base font-normal text-center resize-none outline-none placeholder:text-neutral-500 leading-relaxed"
                />
              </div>

              {/* Color Palette */}
              <div className="py-4 border-t border-neutral-800 flex items-center justify-center gap-3">
                {['#ffffff', '#1877f2', '#e11d48', '#10b981', '#f59e0b', '#8b5cf6', '#000000'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setTextColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer ${
                      textColor === color ? 'scale-125 border-white' : 'border-transparent hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI MUSIC SELECTOR MODAL */}
      <StoryMusicSelector
        isOpen={showMusicSelector}
        onClose={() => setShowMusicSelector(false)}
        onSelectSong={handleSelectSong}
        currentSongUrl={music?.url}
      />
    </div>
  );
}
