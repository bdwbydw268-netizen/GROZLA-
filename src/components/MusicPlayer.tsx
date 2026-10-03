import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Play, 
  Pause, 
  Music, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Headphones, 
  PlusCircle, 
  Share2, 
  Disc, 
  RotateCw, 
  ArrowLeft, 
  ArrowRight, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Heart, 
  Sliders, 
  Radio, 
  Zap, 
  Layers, 
  Check, 
  Flame, 
  Coffee, 
  Moon, 
  Square,
  Bookmark,
  ChevronDown,
  X,
  Compass
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { aiMusicEngine } from '../utils/aiMusicSynth';
import { REAL_SONGS, Song } from '../constants/music';

// Uploaded aesthetic images
const BG_BEDROOM_GUITAR = '/music_bg_bedroom.jpg';
const BG_NEON_SYNTH = '/music_bg_synth.jpg';

interface TrackItem {
  id: string;
  title: string;
  artist: string;
  url: string;
  cover: string;
  duration: number; // in seconds
  genre: string;
  mood: string;
  isAiGenerated?: boolean;
  aiPrompt?: string;
  synthGenre?: 'lofi' | 'synthwave' | 'acoustic' | 'romantic' | 'ambient';
}

const INITIAL_AI_PLAYLIST: TrackItem[] = [
  {
    id: 'ai-1',
    title: 'Purple Velvet Guitar (سكون الأوتار)',
    artist: 'GROZLA AI Composer 🎸',
    url: 'synth://acoustic',
    cover: BG_BEDROOM_GUITAR,
    duration: 195,
    genre: 'Acoustic / Lo-Fi',
    mood: 'روقان وهدوء بنفسجي',
    isAiGenerated: true,
    aiPrompt: 'أوتار جيتار دافئة في غرفة ليلية بنفسجية مريحة للأعصاب',
    synthGenre: 'acoustic'
  },
  {
    id: 'ai-2',
    title: 'Neon Synthwave Dream (أضواء النيون)',
    artist: 'GROZLA AI Studio 🎹',
    url: 'synth://synthwave',
    cover: BG_NEON_SYNTH,
    duration: 210,
    genre: 'Synthwave / Retro',
    mood: 'حماسي ونبض إلكتروني',
    isAiGenerated: true,
    aiPrompt: 'إيقاعات سينث ويف ليلية متوهجة مع أنغام بيانو نيون ساحرة',
    synthGenre: 'synthwave'
  },
  {
    id: 'ai-3',
    title: 'Lo-Fi Midnight Study (مذاكرة منتصف الليل)',
    artist: 'AI Beatmaker 🌙',
    url: 'synth://lofi',
    cover: BG_BEDROOM_GUITAR,
    duration: 180,
    genre: 'Lo-Fi Chill',
    mood: 'استرخاء وتركيز',
    isAiGenerated: true,
    aiPrompt: 'لو فاي هادئ للدراسة والاسترخاء مع لمسات بيانو وجيتار خافت',
    synthGenre: 'lofi'
  },
  {
    id: 'ai-4',
    title: 'Romantic Purple Mist (شجن بنفسجي)',
    artist: 'AI Orchestra ✨',
    url: 'synth://romantic',
    cover: BG_NEON_SYNTH,
    duration: 225,
    genre: 'Romantic Melody',
    mood: 'رومانسي شجي',
    isAiGenerated: true,
    aiPrompt: 'ألحان رومانسية شجية متناغمة تعبر عن المشاعر الصادقة',
    synthGenre: 'romantic'
  }
];

const POPULAR_ARABIC_SEARCH_TAGS = [
  { label: 'عمرو دياب 🎤', query: 'عمرو دياب' },
  { label: 'تامر حسني ✨', query: 'تامر حسني' },
  { label: 'فيروز ☕', query: 'فيروز' },
  { label: 'أحمد سعد ⚡', query: 'أحمد سعد' },
  { label: 'شيرين ❤️', query: 'شيرين' },
  { label: 'سولكينغ 🎵', query: 'Soolking' },
  { label: 'طرب أصيل 📻', query: 'طرب كلاسيكي' },
  { label: 'راي ومغاربي 🔥', query: 'Didine Canon 16 Mouh Milano' },
  { label: 'إليسا 🌙', query: 'إليسا' },
  { label: 'ويجز 🎧', query: 'ويجز' },
  { label: 'حسين الجسمي 🌟', query: 'حسين الجسمي' },
  { label: 'كاظم الساهر 🎻', query: 'كاظم الساهر' }
];

export default function MusicPlayer() {
  const { showToast, addPost, updateUserNote } = useAppContext();

  // Background Theme: 'bedroom' (Guitar Room) or 'synth' (Neon Synth Room)
  const [selectedBgTheme, setSelectedBgTheme] = useState<'bedroom' | 'synth'>('bedroom');
  const activeBgImage = selectedBgTheme === 'bedroom' ? BG_BEDROOM_GUITAR : BG_NEON_SYNTH;

  // View state: 'browser' (list/studio) or 'dedicated_player' (full dedicated interface)
  const [viewState, setViewState] = useState<'browser' | 'dedicated_player'>('browser');

  // Playlist state
  const [playlist, setPlaylist] = useState<TrackItem[]>(() => {
    const combined: TrackItem[] = [
      ...INITIAL_AI_PLAYLIST,
      ...REAL_SONGS.map(s => ({
        id: s.id,
        title: s.title,
        artist: s.artist,
        url: s.url,
        cover: s.cover || BG_BEDROOM_GUITAR,
        duration: s.duration || 30,
        genre: s.genre || 'Music',
        mood: s.mood || 'طاقة'
      }))
    ];
    return combined;
  });

  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const currentTrack = playlist[currentTrackIndex] || playlist[0];

  // Playback States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(180);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'all' | 'one'>('all');
  const [likedTracks, setLikedTracks] = useState<Record<string, boolean>>({});
  const [audioQuality, setAudioQuality] = useState<'HD 320k' | 'Lossless AI'>('Lossless AI');

  // AI Music Generator State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSelectedMood, setAiSelectedMood] = useState<'lofi' | 'synthwave' | 'acoustic' | 'romantic' | 'ambient'>('acoustic');
  const [isGeneratingAiMusic, setIsGeneratingAiMusic] = useState(false);
  const [aiGenStage, setAiGenStage] = useState<string | null>(null);

  // Search & Global Tracks State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeSearchFilter, setActiveSearchFilter] = useState<string | null>(null);

  // Audio elements
  const htmlAudioRef = useRef<HTMLAudioElement | null>(null);

  // Helper: Format seconds into MM:SS
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Sync Duration when track changes
  useEffect(() => {
    if (currentTrack) {
      setDuration(currentTrack.duration || 180);
      setCurrentTime(0);
    }
  }, [currentTrack?.id]);

  // Handle Playback Start / Stop / Resume
  const playTrack = (trackIndex: number) => {
    const target = playlist[trackIndex];
    if (!target) return;

    setCurrentTrackIndex(trackIndex);
    setCurrentTime(0);
    setDuration(target.duration || 180);
    setIsPlaying(true);

    // If it's a synthesizer generated track
    if (target.url.startsWith('synth://') || target.isAiGenerated) {
      if (htmlAudioRef.current) {
        htmlAudioRef.current.pause();
      }
      aiMusicEngine.stop();
      aiMusicEngine.setGenre(target.synthGenre || 'lofi', target.duration || 180);
      aiMusicEngine.start((elapsed) => {
        setCurrentTime(elapsed);
      });
    } else {
      // Standard HTTP / iTunes audio preview
      aiMusicEngine.stop();
      if (htmlAudioRef.current) {
        htmlAudioRef.current.src = target.url;
        htmlAudioRef.current.currentTime = 0;
        htmlAudioRef.current.play().catch(() => {
          showToast('لا يمكن تشغيل هذا المقطع الصوتي');
          setIsPlaying(false);
        });
      }
    }
  };

  // Toggle Play / Pause
  const togglePlayPause = () => {
    if (!currentTrack) return;

    if (isPlaying) {
      setIsPlaying(false);
      if (currentTrack.url.startsWith('synth://') || currentTrack.isAiGenerated) {
        aiMusicEngine.pause();
      } else if (htmlAudioRef.current) {
        htmlAudioRef.current.pause();
      }
    } else {
      setIsPlaying(true);
      if (currentTrack.url.startsWith('synth://') || currentTrack.isAiGenerated) {
        aiMusicEngine.start((elapsed) => {
          setCurrentTime(elapsed);
        });
      } else if (htmlAudioRef.current) {
        htmlAudioRef.current.play().catch(() => {
          showToast('تعذر تشغيل المقطع');
          setIsPlaying(false);
        });
      }
    }
  };

  // Stop Playback completely
  const stopPlayback = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (currentTrack.url.startsWith('synth://') || currentTrack.isAiGenerated) {
      aiMusicEngine.stop();
    } else if (htmlAudioRef.current) {
      htmlAudioRef.current.pause();
      htmlAudioRef.current.currentTime = 0;
    }
  };

  // Next Track Handler
  const handleNextTrack = () => {
    if (playlist.length === 0) return;
    let nextIdx = currentTrackIndex + 1;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * playlist.length);
    } else if (nextIdx >= playlist.length) {
      nextIdx = 0;
    }
    playTrack(nextIdx);
  };

  // Previous Track Handler
  const handlePrevTrack = () => {
    if (playlist.length === 0) return;
    if (currentTime > 3) {
      handleSeek(0);
      return;
    }
    let prevIdx = currentTrackIndex - 1;
    if (prevIdx < 0) {
      prevIdx = playlist.length - 1;
    }
    playTrack(prevIdx);
  };

  // Seek Handler (Timeline progress line scrub)
  const handleSeek = (newSec: number) => {
    setCurrentTime(newSec);
    if (currentTrack.url.startsWith('synth://') || currentTrack.isAiGenerated) {
      aiMusicEngine.seek(newSec);
    } else if (htmlAudioRef.current) {
      htmlAudioRef.current.currentTime = newSec;
    }
  };

  // HTML Audio listeners
  const onHtmlTimeUpdate = () => {
    if (htmlAudioRef.current && !currentTrack.url.startsWith('synth://')) {
      setCurrentTime(htmlAudioRef.current.currentTime);
      if (htmlAudioRef.current.duration && !isNaN(htmlAudioRef.current.duration)) {
        setDuration(htmlAudioRef.current.duration);
      }
    }
  };

  const onHtmlEnded = () => {
    if (repeatMode === 'one') {
      playTrack(currentTrackIndex);
    } else if (repeatMode === 'all' || isShuffle) {
      handleNextTrack();
    } else {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  // Like Toggle
  const toggleLike = (id: string) => {
    setLikedTracks(prev => {
      const next = !prev[id];
      showToast(next ? '❤️ تمت إضافة المقطع للمفضلة' : 'تمت إزالة المقطع من المفضلة');
      return { ...prev, [id]: next };
    });
  };

  // Generate AI Music Function
  const handleGenerateAiMusic = async () => {
    const promptText = aiPrompt.trim() || 'لحن بنفسجي هادئ مع أوتار جيتار وسينث ويف ساحر';
    setIsGeneratingAiMusic(true);
    setAiGenStage('المرحلة 1/3: الذكاء الاصطناعي يقوم بتأليف السلالم الموسيقية والهارموني...');

    try {
      await new Promise(r => setTimeout(r, 700));
      setAiGenStage('المرحلة 2/3: هندسة الصوت وتوليد النبضات وإيقاع الأوتار البيانو...');
      await new Promise(r => setTimeout(r, 800));
      setAiGenStage('المرحلة 3/3: تصميم الغلاف وتجهيز الماسترينغ النهائي...');
      await new Promise(r => setTimeout(r, 600));

      const newId = `ai-gen-${Date.now()}`;
      const genreLabels: Record<string, string> = {
        acoustic: 'Acoustic Guitar',
        synthwave: 'Neon Synthwave',
        lofi: 'Lo-Fi Chillout',
        romantic: 'Romantic Symphony',
        ambient: 'Deep Ambient'
      };

      const newTrack: TrackItem = {
        id: newId,
        title: promptText.length > 28 ? promptText.slice(0, 28) + '...' : promptText,
        artist: 'GROZLA AI Composer 🤖✨',
        url: `synth://${aiSelectedMood}`,
        cover: aiSelectedMood === 'synthwave' ? BG_NEON_SYNTH : BG_BEDROOM_GUITAR,
        duration: 210,
        genre: genreLabels[aiSelectedMood] || 'AI Masterpiece',
        mood: 'توليد ذكاء اصطناعي حصري',
        isAiGenerated: true,
        aiPrompt: promptText,
        synthGenre: aiSelectedMood
      };

      setPlaylist(prev => [newTrack, ...prev]);
      setAiPrompt('');
      showToast('🎉 تم تأليف وإنشاء المقطع الموسيقي بالذكاء الاصطناعي بنجاح!');

      // Immediately switch to dedicated player and play
      setCurrentTrackIndex(0);
      playTrack(0);
      setViewState('dedicated_player');
    } catch (e) {
      showToast('تعذر توليد المقطع الموسيقي');
    } finally {
      setIsGeneratingAiMusic(false);
      setAiGenStage(null);
    }
  };

  // Search Global & Arabic Tracks
  const handleSearchTracks = async (termToSearch?: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = (termToSearch !== undefined ? termToSearch : searchQuery).trim();
    if (!query) return;

    setIsSearching(true);
    setActiveSearchFilter(query);

    try {
      // 1. Check local REAL_SONGS first for instant instant search
      const localMatches = REAL_SONGS.filter(s => 
        s.title.toLowerCase().includes(query.toLowerCase()) || 
        s.artist.toLowerCase().includes(query.toLowerCase()) ||
        (s.mood && s.mood.toLowerCase().includes(query.toLowerCase())) ||
        (s.genre && s.genre.toLowerCase().includes(query.toLowerCase()))
      ).map(s => ({
        id: s.id,
        title: s.title,
        artist: s.artist,
        url: s.url,
        cover: s.cover || BG_BEDROOM_GUITAR,
        duration: s.duration || 30,
        genre: s.genre || 'Arabic Music',
        mood: s.mood || 'موسيقى'
      }));

      // 2. Fetch from iTunes proxy with Arabic regional endpoints
      const response = await fetch(`/api/music/itunes-proxy?term=${encodeURIComponent(query)}&limit=25`);
      let fetchedTracks: TrackItem[] = [];

      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          fetchedTracks = data.results.map((r: any) => ({
            id: String(r.trackId),
            title: r.trackName,
            artist: r.artistName,
            url: r.previewUrl,
            cover: r.artworkUrl100 ? r.artworkUrl100.replace('100x100', '600x600') : BG_BEDROOM_GUITAR,
            duration: Math.round((r.trackTimeMillis || 30000) / 1000),
            genre: r.primaryGenreName || 'Arabic / Global Music',
            mood: 'بحث عربي'
          }));
        }
      }

      // Combine results without duplicates
      const seen = new Set<string>();
      const combined: TrackItem[] = [];

      [...localMatches, ...fetchedTracks].forEach(t => {
        if (!seen.has(t.id)) {
          seen.add(t.id);
          combined.push(t);
        }
      });

      if (combined.length > 0) {
        setPlaylist(combined);
        showToast(`🔍 تم العثور على ${combined.length} أغنية ومقطع باللغة العربية!`);
      } else {
        showToast(`لم يتم العثور على نتائج لـ "${query}"`);
      }
    } catch {
      showToast('فشل البحث في الموسيقى');
    } finally {
      setIsSearching(false);
    }
  };

  // Reset Search to full library
  const handleResetSearch = () => {
    setSearchQuery('');
    setActiveSearchFilter(null);
    const combined: TrackItem[] = [
      ...INITIAL_AI_PLAYLIST,
      ...REAL_SONGS.map(s => ({
        id: s.id,
        title: s.title,
        artist: s.artist,
        url: s.url,
        cover: s.cover || BG_BEDROOM_GUITAR,
        duration: s.duration || 30,
        genre: s.genre || 'Music',
        mood: s.mood || 'طاقة'
      }))
    ];
    setPlaylist(combined);
    showToast('تمت استعادة القائمة الكاملة 🔄');
  };

  // Attach to User Note (24 Hours)
  const handleAttachToProfileNote = (track: TrackItem) => {
    try {
      updateUserNote(`أستمع الآن: ${track.title}`, {
        id: track.id,
        title: track.title,
        artist: track.artist,
        url: track.url,
        cover: track.cover,
        duration: track.duration,
        genre: track.genre
      });
      showToast('📌 تم تعيين الأغنية في ملاحظات ملفك الشخصي بنجاح!');
    } catch {
      showToast('تعذر تعيين الأغنية كحالة');
    }
  };

  // Share as Feed Post
  const handleShareAsPost = (track: TrackItem) => {
    try {
      addPost(`🎵 أستمع الآن إلى مقطع: "${track.title}" - ${track.artist} عبر نظام الموسيقى والذكاء الاصطناعي 🎧✨`, track.cover, undefined, track.url);
      showToast('✅ تم نشر الأغنية كمنشور في ملفك الشخصي!');
    } catch {
      showToast('تعذر نشر الأغنية');
    }
  };

  return (
    <div className="relative min-h-[90vh] rounded-3xl overflow-hidden shadow-2xl border border-purple-500/40 text-white font-sans selection:bg-purple-500 selection:text-white pb-24 md:pb-12">
      
      {/* CRYSTAL CLEAR HIGH DEFINITION BACKGROUND - NO BLUR / NO FOG (بدون ضبابية وفائقة الوضوح) */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{ backgroundImage: `url(${activeBgImage})` }}
      >
        {/* Crisp gentle contrast gradient without blur or fog */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-purple-950/25 to-black/80" />
      </div>

      {/* Hidden HTML Audio Element */}
      <audio 
        ref={htmlAudioRef}
        onTimeUpdate={onHtmlTimeUpdate}
        onEnded={onHtmlEnded}
      />

      {/* ========================================================= */}
      {/* 1. DEDICATED FULL PLAYER VIEW (الواجهة الخاصة المستقلة) */}
      {/* ========================================================= */}
      <AnimatePresence mode="wait">
        {viewState === 'dedicated_player' ? (
          <motion.div
            key="dedicated_player"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="relative z-10 p-4 sm:p-8 flex flex-col justify-between min-h-[85vh] max-w-xl mx-auto"
          >
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between gap-3 border-b border-white/20 pb-4 bg-black/30 px-4 py-3 rounded-2xl">
              <button
                onClick={() => setViewState('browser')}
                className="flex items-center gap-2 py-2 px-3.5 rounded-2xl bg-white/20 hover:bg-white/30 border border-white/30 text-white font-black text-xs transition-all active:scale-95 cursor-pointer shadow-md"
              >
                <ArrowLeft size={16} />
                <span>العودة للقائمة والمكتبة</span>
              </button>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] bg-purple-500/50 text-white border border-purple-300/50 font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <Sparkles size={12} className="text-yellow-300" />
                  <span>{audioQuality}</span>
                </span>
                
                {/* Background switcher */}
                <button
                  onClick={() => {
                    const next = selectedBgTheme === 'bedroom' ? 'synth' : 'bedroom';
                    setSelectedBgTheme(next);
                    showToast(next === 'bedroom' ? '🎸 تم تفعيل خلفية غرفة الجيتار' : '🎹 تم تفعيل خلفية استوديو النيون');
                  }}
                  className="p-2 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white transition-all cursor-pointer shadow-sm"
                  title="تبديل الخلفية الموسيقية"
                >
                  <Layers size={16} />
                </button>
              </div>
            </div>

            {/* Central Vinyl Artwork Section (صورة موسيقية بهذه الصورة فائقة الوضوح) */}
            <div className="my-6 sm:my-8 flex flex-col items-center justify-center text-center">
              <div className="relative group cursor-pointer" onClick={togglePlayPause}>
                {/* Outer Glow Ring */}
                <div className={`absolute -inset-4 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-indigo-500 transition-all duration-700 ${isPlaying ? 'scale-105 opacity-90 animate-pulse' : 'scale-95 opacity-30'}`} />

                {/* Rotating Vinyl Record Artwork */}
                <div className={`relative w-64 h-64 sm:w-72 sm:h-72 rounded-full p-2 bg-gradient-to-tr from-slate-900 via-purple-950 to-black border-4 border-purple-400 shadow-2xl overflow-hidden flex items-center justify-center transition-all ${isPlaying ? 'animate-[spin_12s_linear_infinite]' : ''}`}>
                  {/* Vinyl Grooves Texture */}
                  <div className="absolute inset-0 rounded-full border border-white/20 opacity-50 pointer-events-none" />
                  <div className="absolute inset-4 rounded-full border border-white/20 opacity-40 pointer-events-none" />
                  <div className="absolute inset-10 rounded-full border border-white/20 opacity-30 pointer-events-none" />

                  {/* Artwork Image in Center */}
                  <div className="w-48 h-48 sm:w-52 sm:h-52 rounded-full overflow-hidden border-4 border-purple-300 shadow-inner relative">
                    <img 
                      src={currentTrack.cover || activeBgImage} 
                      alt={currentTrack.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-black/90 border-2 border-white/60 shadow-sm" />
                    </div>
                  </div>
                </div>

                {/* Play/Pause Overlay Indicator on Hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 rounded-full bg-black/75 flex items-center justify-center text-white border border-white/30 shadow-lg">
                    {isPlaying ? <Pause size={30} /> : <Play size={30} className="ml-1" />}
                  </div>
                </div>
              </div>

              {/* Track Title & Artist Info */}
              <div className="mt-6 space-y-1.5 max-w-md bg-black/40 px-5 py-3 rounded-2xl border border-white/15 shadow-md">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                    {currentTrack.title}
                  </h2>
                  {currentTrack.isAiGenerated && (
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs">
                      AI 🤖
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-purple-200 truncate">
                  {currentTrack.artist}
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <span className="text-[10px] bg-white/20 px-2.5 py-0.5 rounded-full text-white font-bold border border-white/20">
                    {currentTrack.genre}
                  </span>
                  <span className="text-[10px] bg-pink-500/30 px-2.5 py-0.5 rounded-full text-pink-200 font-bold border border-pink-400/30">
                    {currentTrack.mood}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline Progress Bar & Timers (سطر وعداد ثواني ودقائق) */}
            <div className="space-y-2 bg-black/60 p-4 rounded-2xl border border-white/20 shadow-xl">
              {/* Scrubbable Timeline Track */}
              <div className="relative flex items-center group">
                <input 
                  type="range"
                  min={0}
                  max={duration || 180}
                  step={0.5}
                  value={currentTime}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="w-full h-3 bg-white/25 rounded-full appearance-none cursor-pointer accent-purple-300 focus:outline-none"
                  style={{
                    background: `linear-gradient(to right, #d8b4fe 0%, #a855f7 ${(currentTime / (duration || 180)) * 100}%, rgba(255, 255, 255, 0.25) ${(currentTime / (duration || 180)) * 100}%, rgba(255, 255, 255, 0.25) 100%)`
                  }}
                />
              </div>

              {/* Seconds & Minutes Counters */}
              <div className="flex items-center justify-between text-xs font-mono font-black text-purple-100">
                <span className="bg-purple-900/90 px-2.5 py-1 rounded-md border border-purple-400/40">
                  {formatTime(currentTime)}
                </span>
                <div className="flex items-center gap-1 text-[11px] text-purple-200 font-sans font-bold">
                  {isPlaying && (
                    <span className="flex gap-0.5 items-end h-3">
                      <span className="w-0.5 bg-purple-300 h-full animate-[bounce_0.8s_infinite]"></span>
                      <span className="w-0.5 bg-purple-300 h-2/3 animate-[bounce_0.8s_infinite_0.2s]"></span>
                      <span className="w-0.5 bg-purple-300 h-1/2 animate-[bounce_0.8s_infinite_0.4s]"></span>
                    </span>
                  )}
                  <span>{isPlaying ? 'جاري التشغيل' : 'متوقف'}</span>
                </div>
                <span className="bg-purple-900/90 px-2.5 py-1 rounded-md border border-purple-400/40">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Playback Controls & Changing Icons (أيقونات تغيير وزر إيقاف) */}
            <div className="mt-4 flex flex-col gap-4">
              <div className="flex items-center justify-between sm:justify-around gap-2 bg-black/50 p-3 rounded-2xl border border-white/20 shadow-md">
                {/* Shuffle Button */}
                <button
                  onClick={() => {
                    setIsShuffle(!isShuffle);
                    showToast(isShuffle ? 'تم إيقاف التشغيل العشوائي' : '🔀 تم تفعيل التشغيل العشوائي');
                  }}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${isShuffle ? 'bg-purple-500/60 text-white border border-purple-300' : 'text-gray-300 hover:text-white'}`}
                  title="تشغيل عشوائي"
                >
                  <Shuffle size={18} />
                </button>

                {/* Previous Track Button */}
                <button
                  onClick={handlePrevTrack}
                  className="p-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white transition-all active:scale-90 cursor-pointer shadow-md"
                  title="المقطع السابق"
                >
                  <SkipBack size={22} />
                </button>

                {/* Main Stop/Pause & Play Central Button */}
                <button
                  onClick={togglePlayPause}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white flex items-center justify-center shadow-xl shadow-purple-600/50 transition-all active:scale-95 cursor-pointer border-2 border-white/60"
                  title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                >
                  {isPlaying ? (
                    <Pause size={30} className="fill-white" />
                  ) : (
                    <Play size={30} className="fill-white ml-1" />
                  )}
                </button>

                {/* Complete Stop Button */}
                <button
                  onClick={stopPlayback}
                  className="p-2.5 rounded-xl bg-white/20 hover:bg-rose-500/50 text-gray-200 hover:text-white border border-white/20 transition-all cursor-pointer"
                  title="إيقاف كلي"
                >
                  <Square size={16} />
                </button>

                {/* Next Track Button */}
                <button
                  onClick={handleNextTrack}
                  className="p-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white transition-all active:scale-90 cursor-pointer shadow-md"
                  title="المقطع التالي"
                >
                  <SkipForward size={22} />
                </button>

                {/* Repeat Button */}
                <button
                  onClick={() => {
                    const nextMode = repeatMode === 'all' ? 'one' : repeatMode === 'one' ? 'none' : 'all';
                    setRepeatMode(nextMode);
                    showToast(nextMode === 'one' ? '🔂 تكرار المقطع الحالي' : nextMode === 'all' ? '🔁 تكرار القائمة' : 'إيقاف التكرار');
                  }}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${repeatMode !== 'none' ? 'bg-purple-500/60 text-white border border-purple-300' : 'text-gray-300 hover:text-white'}`}
                  title="نمط التكرار"
                >
                  <Repeat size={18} />
                </button>
              </div>

              {/* Extra Interactive Action Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => toggleLike(currentTrack.id)}
                  className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold text-xs transition-all cursor-pointer ${likedTracks[currentTrack.id] ? 'bg-rose-500/40 text-rose-200 border-rose-400' : 'bg-black/40 hover:bg-black/60 text-gray-200 border-white/20'}`}
                >
                  <Heart size={15} className={likedTracks[currentTrack.id] ? 'fill-rose-400 text-rose-400' : ''} />
                  <span>{likedTracks[currentTrack.id] ? 'مفضلة' : 'إعجاب'}</span>
                </button>

                <button
                  onClick={() => handleAttachToProfileNote(currentTrack)}
                  className="py-2.5 px-3 rounded-xl bg-black/40 hover:bg-black/60 text-purple-200 border border-white/20 flex items-center justify-center gap-1.5 font-bold text-xs transition-all cursor-pointer"
                  title="تعيين كموسيقى لملفك الشخصي"
                >
                  <Bookmark size={15} className="text-purple-300" />
                  <span>موسيقى للملف</span>
                </button>

                <button
                  onClick={() => handleShareAsPost(currentTrack)}
                  className="py-2.5 px-3 rounded-xl bg-black/40 hover:bg-black/60 text-blue-200 border border-white/20 flex items-center justify-center gap-1.5 font-bold text-xs transition-all cursor-pointer"
                  title="نشر في منشورات الحساب"
                >
                  <Share2 size={15} className="text-blue-300" />
                  <span>مشاركة كمنشور</span>
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ========================================================= */
          /* 2. BROWSER & ARABIC SEARCH VIEW (المكتبة والبحث باللغة العربية) */
          /* ========================================================= */
          <motion.div
            key="browser_view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 p-4 sm:p-6 space-y-5"
          >
            {/* Header with Background Switcher */}
            <div className="flex items-center justify-between gap-3 bg-black/40 p-4 rounded-3xl border border-white/20 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 via-pink-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                  <Headphones size={24} />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-black text-white">نظام الموسيقى والبحث العربي 🎶</h1>
                  <p className="text-xs text-purple-200 font-bold">استماع، بحث ذكي باللغة العربية، وتأليف بالذكاء الاصطناعي</p>
                </div>
              </div>

              {/* Theme toggle */}
              <div className="flex items-center gap-1.5 bg-black/60 p-1.5 rounded-2xl border border-white/20">
                <button
                  onClick={() => {
                    setSelectedBgTheme('bedroom');
                    showToast('🎸 تم تطبيق خلفية غرفة الجيتار البنفسجية فائقة الوضوح');
                  }}
                  className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${selectedBgTheme === 'bedroom' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-300 hover:text-white'}`}
                >
                  <span>غرفة الجيتار</span>
                  <span>🎸</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedBgTheme('synth');
                    showToast('🎹 تم تطبيق خلفية استوديو النيون والسينث فائقة الوضوح');
                  }}
                  className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${selectedBgTheme === 'synth' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-300 hover:text-white'}`}
                >
                  <span>استوديو النيون</span>
                  <span>🎹</span>
                </button>
              </div>
            </div>

            {/* ARABIC SEARCH SECTION (نظام البحث الشامل باللغة العربية) */}
            <div className="bg-black/45 p-4 rounded-3xl border border-white/20 shadow-xl space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search size={18} className="text-purple-300" />
                  <h3 className="font-black text-sm text-white">بحث الموسيقى باللغة العربية</h3>
                </div>
                {activeSearchFilter && (
                  <button
                    onClick={handleResetSearch}
                    className="text-[11px] bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-full font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <X size={12} />
                    <span>إلغاء تصفية البحث</span>
                  </button>
                )}
              </div>

              {/* Search Form */}
              <form onSubmit={(e) => handleSearchTracks(undefined, e)} className="flex gap-2">
                <div className="relative flex-1">
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value.trim().length >= 2) {
                        handleSearchTracks(e.target.value);
                      }
                    }}
                    placeholder="ابحث عن أي فنان أو أغنية بالعربية (عمرو دياب، تامر حسني، فيروز، راي، طرب)..."
                    className="w-full py-3.5 pl-4 pr-11 bg-white/15 border border-white/25 rounded-2xl text-white placeholder-purple-200/70 text-sm font-bold focus:outline-none focus:border-purple-300 focus:bg-white/25 transition-all"
                  />
                  <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-purple-300" />
                </div>
                <button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-black text-sm transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-purple-600/30 flex items-center gap-1.5"
                >
                  {isSearching ? <RotateCw size={16} className="animate-spin" /> : <Search size={16} />}
                  <span>{isSearching ? 'جاري...' : 'بحث'}</span>
                </button>
              </form>

              {/* Quick Arabic Search Chips */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-1 text-[11px] text-purple-200 font-bold">
                  <Compass size={13} className="text-yellow-300" />
                  <span>اقتراحات البحث العربي السريع:</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {POPULAR_ARABIC_SEARCH_TAGS.map((tag, tIdx) => (
                    <button
                      key={`music-tag-${tag.label}-${tIdx}`}
                      type="button"
                      onClick={() => {
                        setSearchQuery(tag.query);
                        handleSearchTracks(tag.query);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${activeSearchFilter === tag.query ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-300 shadow-md' : 'bg-white/10 hover:bg-white/20 text-purple-100 border-white/15'}`}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI MUSIC GENERATION STUDIO (استعادة نظام موسيقى بالذكاء الاصطناعي) */}
            <div className="bg-black/45 p-5 rounded-3xl border-2 border-purple-400/50 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={20} className="text-yellow-300 animate-spin-slow" />
                  <h3 className="font-black text-base text-white">تأليف وتوليد موسيقى بالذكاء الاصطناعي</h3>
                </div>
                <span className="text-[10px] bg-purple-500/40 text-purple-100 border border-purple-300/40 px-2.5 py-1 rounded-full font-bold">
                  AI Music Studio
                </span>
              </div>

              {/* Prompt Input */}
              <div className="space-y-2">
                <div className="relative">
                  <input 
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="اكتب وصف اللحن بالعربية (مثال: أوتار جيتار هادئة مع إيقاع لو فاي وسينث بنفسجي)..."
                    className="w-full py-3.5 px-4 bg-white/15 border border-purple-300/40 rounded-2xl text-white placeholder-purple-200/60 text-sm font-bold focus:outline-none focus:border-purple-300 focus:bg-white/20 transition-all"
                  />
                </div>

                {/* Mood Selectors */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {[
                    { key: 'acoustic', label: 'جيتار كلاسيكي 🎸', synth: 'acoustic' },
                    { key: 'synthwave', label: 'نيون سينث ويف 🎹', synth: 'synthwave' },
                    { key: 'lofi', label: 'لو فاي هادئ 🌙', synth: 'lofi' },
                    { key: 'romantic', label: 'رومانسي شجي ✨', synth: 'romantic' },
                    { key: 'ambient', label: 'استرخاء عميق ☕', synth: 'ambient' },
                  ].map((m, mIdx) => (
                    <button
                      key={`music-mood-${m.key}-${mIdx}`}
                      type="button"
                      onClick={() => setAiSelectedMood(m.synth as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer border ${aiSelectedMood === m.synth ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-300 shadow-md' : 'bg-white/10 hover:bg-white/20 text-purple-200 border-white/15'}`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generation Progress */}
              {isGeneratingAiMusic && (
                <div className="p-3.5 bg-purple-900/60 border border-purple-400/50 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-purple-100">
                    <RotateCw size={15} className="animate-spin text-yellow-300" />
                    <span>{aiGenStage}</span>
                  </div>
                  <div className="w-full bg-purple-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-300 h-full w-full animate-pulse" />
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGenerateAiMusic}
                disabled={isGeneratingAiMusic}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-purple-600/40 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <Sparkles size={18} />
                <span>{isGeneratingAiMusic ? 'جاري التأليف والتوليد...' : 'تأليف وإنشاء المقطع فوراً بالذكاء الاصطناعي ✨'}</span>
              </button>
            </div>

            {/* PLAYLIST SECTION (قائمة الأغاني المتاحة) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1 bg-black/40 p-2.5 rounded-2xl border border-white/15">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <Disc size={18} className="text-purple-300" />
                  <span>نتائج وقائمة الأغاني المتاحة</span>
                </h3>
                <span className="text-xs text-purple-200 font-bold bg-white/20 px-2.5 py-0.5 rounded-full">
                  {playlist.length} مقطع
                </span>
              </div>

              <div className="space-y-2">
                {playlist.map((track, idx) => {
                  const isCurrent = currentTrackIndex === idx;
                  const isCurrentPlaying = isCurrent && isPlaying;

                  return (
                    <div
                      key={`playlist-track-${track.id}-${idx}`}
                      onClick={() => {
                        playTrack(idx);
                        setViewState('dedicated_player');
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${isCurrent ? 'bg-purple-600/60 border-purple-300 shadow-xl shadow-purple-900/40' : 'bg-black/40 hover:bg-black/60 border-white/15'}`}
                    >
                      {/* Left Track Info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Cover Image Thumbnail */}
                        <div className="relative w-13 h-13 rounded-xl overflow-hidden shrink-0 border border-white/30 shadow-md">
                          <img 
                            src={track.cover || activeBgImage} 
                            alt={track.title} 
                            className="w-full h-full object-cover"
                          />
                          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isCurrentPlaying ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}>
                            {isCurrentPlaying ? (
                              <Volume2 size={20} className="text-purple-300 animate-pulse" />
                            ) : (
                              <Play size={20} className="text-white fill-white ml-0.5" />
                            )}
                          </div>
                        </div>

                        {/* Title & Artist */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className={`font-black text-sm truncate ${isCurrent ? 'text-white font-extrabold' : 'text-white'}`}>
                              {track.title}
                            </h4>
                            {track.isAiGenerated && (
                              <span className="bg-purple-500/60 text-[9px] font-black px-1.5 py-0.5 rounded text-white shrink-0">
                                AI
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-purple-200 font-bold truncate mt-0.5">
                            {track.artist}
                          </p>
                        </div>
                      </div>

                      {/* Right Meta & Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono text-purple-200 hidden sm:inline bg-black/30 px-2 py-0.5 rounded-md">
                          {formatTime(track.duration || 180)}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(track.id);
                          }}
                          className={`p-2 rounded-xl transition-all ${likedTracks[track.id] ? 'text-rose-400' : 'text-gray-300 hover:text-white'}`}
                        >
                          <Heart size={16} className={likedTracks[track.id] ? 'fill-rose-400' : ''} />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playTrack(idx);
                            setViewState('dedicated_player');
                          }}
                          className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-xs transition-all shadow-md flex items-center gap-1"
                        >
                          <Play size={12} className="fill-white" />
                          <span>تشغيل بالواجهة</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
