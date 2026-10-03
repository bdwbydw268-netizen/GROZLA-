import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import Post from './Post';
import { motion, AnimatePresence } from 'motion/react';
import { REAL_SONGS } from '../constants/music';
import { 
  Search as SearchIcon, 
  Music, 
  Sparkles, 
  Play, 
  Pause, 
  Volume2, 
  Users, 
  FileText, 
  Radio, 
  Disc, 
  Headphones, 
  Share2, 
  Flame, 
  Send,
  PlusCircle,
  RotateCw,
  X
} from 'lucide-react';

interface MusicTrack {
  trackId: number;
  artistName: string;
  trackName: string;
  previewUrl: string;
  artworkUrl100: string;
  collectionName?: string;
  primaryGenreName?: string;
}

interface AiDjResponse {
  djCommentary: string;
  mood?: string;
  recommendations: {
    trackName: string;
    artistName: string;
    genre?: string;
    vibeReason?: string;
  }[];
  suggestedTags?: string[];
}

export default function Search() {
  const { users, posts, currentUser, setCurrentView, showToast, addPost } = useAppContext();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'music' | 'people' | 'posts'>('all');
  
  // Music & AI DJ state
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
  const [isSearchingMusic, setIsSearchingMusic] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // AI DJ state
  const [aiDjData, setAiDjData] = useState<AiDjResponse | null>(null);
  const [isLoadingAiDj, setIsLoadingAiDj] = useState(false);
  const [selectedVibeTag, setSelectedVibeTag] = useState<string | null>(null);

  // Extract profile ID if query is a profile URL
  const extractProfileId = (searchString: string) => {
    try {
      if (searchString.includes('/profile/')) {
        const parts = searchString.split('/profile/');
        if (parts.length > 1) {
          return parts[1].split(/[/?#]/)[0];
        }
      }
    } catch(e) {}
    return null;
  };
  const searchedId = extractProfileId(query.trim());

  // Filtered Users
  const filteredUsers = query.trim() ? users.filter(u =>
    u.status === 'active' &&
    (
      (searchedId && u.id === searchedId) ||
      u.id === query.trim() ||
      u.name.toLowerCase().includes(query.toLowerCase()) || 
      u.bio?.toLowerCase().includes(query.toLowerCase()) ||
      u.username?.toLowerCase().includes(query.toLowerCase().replace('@', ''))
    ) &&
    !currentUser?.blockedUsers?.includes(u.id)
  ) : [];

  // Filtered Posts
  const filteredPosts = query.trim() ? posts.filter(p => {
    const author = users.find(u => u.id === p.authorId);
    if (author && author.status !== 'active') return false;
    return (
      (p.content.toLowerCase().includes(query.toLowerCase()) ||
      p.comments.some(c => c.text.toLowerCase().includes(query.toLowerCase()))) &&
      !currentUser?.blockedUsers?.includes(p.authorId)
    );
  }) : [];

  // Default Music Tracks Fallback
  const getDefaultMusicTracks = (searchTerm: string): MusicTrack[] => {
    const q = searchTerm.toLowerCase();
    const filtered = REAL_SONGS.filter(s =>
      !q.trim() ||
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q) ||
      (s.genre && s.genre.toLowerCase().includes(q))
    );
    const source = filtered.length > 0 ? filtered : REAL_SONGS;
    return source.map((s, idx) => ({
      trackId: Number(s.id) || 1000 + idx,
      artistName: s.artist,
      trackName: s.title,
      previewUrl: s.url,
      artworkUrl100: s.cover,
      collectionName: s.genre || 'أغاني وموسيقى',
      primaryGenreName: s.genre || 'موسيقى'
    }));
  };

  // Fetch Music from iTunes & trigger AI DJ
  const searchMusicTracks = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setIsSearchingMusic(true);
    try {
      const response = await fetch(`/api/music/itunes-proxy?term=${encodeURIComponent(searchTerm)}&limit=15`);
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          setMusicTracks(data.results);
          return;
        }
      }
      setMusicTracks(getDefaultMusicTracks(searchTerm));
    } catch {
      setMusicTracks(getDefaultMusicTracks(searchTerm));
    } finally {
      setIsSearchingMusic(false);
    }
  };

  const getClientAiDjFallback = (searchTerm: string, mood?: string): AiDjResponse => {
    const q = (searchTerm || mood || '').toLowerCase();
    if (q.includes('طرب') || q.includes('كلثوم') || q.includes('عبد الحليم') || q.includes('فيروز') || q.includes('كلاسيك')) {
      return {
        djCommentary: "عشاق النوستالجيا والطرب الأصيل! اخترت لك باقة من روائع الفن الجميل لتعيش أجواء راقية وذكريات دافئة.",
        mood: "طرب كلاسيكي أصيل",
        recommendations: [
          { trackName: "الأماكن", artistName: "محمد عبده", genre: "طرب خليجي", vibeReason: "شجن وأداء طربي أصيل" },
          { trackName: "أنت عمري", artistName: "أم كلثوم", genre: "طرب كلاسيكي", vibeReason: "درة الموسيقى العربية الخالدة" },
          { trackName: "حبيتك بالصيف", artistName: "فيروز", genre: "طرب لبناني", vibeReason: "صوت ملائكي وألحان الرحابنة" },
          { trackName: "أنا لك على طول", artistName: "عبد الحليم حافظ", genre: "طرب رومانسي", vibeReason: "رومانسية الزمن الجميل" },
          { trackName: "مقادير", artistName: "طلال مداح", genre: "طرب سعودي", vibeReason: "ألحان شجية وعذبة" }
        ],
        suggestedTags: ["طرب", "زمن الفن الجميل", "كلاسيكيات", "فيروزيات"]
      };
    }
    
    if (q.includes('حماس') || q.includes('رقص') || q.includes('pop') || q.includes('dance') || q.includes('remix') || q.includes('شعبي')) {
      return {
        djCommentary: "طاقة حماسية 100%! ميكس راقص ومبهج يرفع هرمون السعادة ويبث الحيوية في يومك.",
        mood: "حماسي وراقص",
        recommendations: [
          { trackName: "Shape of You", artistName: "Ed Sheeran", genre: "Pop", vibeReason: "إيقاع حماسي متجدد وعالمي" },
          { trackName: "الغزالة رايقة", artistName: "كريم محمود عبد العزيز", genre: "شعبي بوب", vibeReason: "بهجة وفرحة فورية" },
          { trackName: "حبيبي يا نور العين", artistName: "عمرو دياب", genre: "لاتيني عربي", vibeReason: "طاقة شرقية لاتينية مميزة" },
          { trackName: "Blinding Lights", artistName: "The Weeknd", genre: "Synthwave", vibeReason: "إيقاع عصري سريع ومثالي للحماس" },
          { trackName: "سيبوه", artistName: "مطرف المطرف", genre: "خليجي بوب", vibeReason: "إيقاع سريع وبهيج" }
        ],
        suggestedTags: ["حماسي", "طاقة عالية", "ريمكس", "رقص"]
      };
    }

    if (q.includes('chill') || q.includes('lo-fi') || q.includes('روقان') || q.includes('استرخاء') || q.includes('هدوء')) {
      return {
        djCommentary: "أجواء هادئة ورايقة جداً للاسترخاء، الدراسة أو القهوة الصباحية مع أنغام مريحة للأعصاب.",
        mood: "استرخاء وهدوء (Chill)",
        recommendations: [
          { trackName: "نسم علينا الهوى", artistName: "فيروز", genre: "Chill Tarab", vibeReason: "هدوء ونقاء وراحة نفسية" },
          { trackName: "Sunset Lover", artistName: "Petit Biscuit", genre: "Lo-Fi", vibeReason: "لحن هادئ متناغم" },
          { trackName: "سهرنا يا ليل", artistName: "إليسا", genre: "Romantic", vibeReason: "أجواء ليلية رقيقة" },
          { trackName: "تملي معاك", artistName: "عمرو دياب", genre: "Acoustic Pop", vibeReason: "نغمات جيتار ناعمة ومريحة" }
        ],
        suggestedTags: ["روقان", "استرخاء", "Lo-Fi", "قهوة"]
      };
    }

    return {
      djCommentary: `يا هلا بيك! مادام "${searchTerm || 'الموسيقى'}" في بالك، صممت لك هذه التوليفة الموسيقية الممتعة لتستمتع بها الآن.`,
      mood: mood || "مختارات AI DJ",
      recommendations: [
        { trackName: "تملي معاك", artistName: "عمرو دياب", genre: "Arabic Pop", vibeReason: "لحن كلاسيكي دافئ ومحبوب" },
        { trackName: "Shape of You", artistName: "Ed Sheeran", genre: "Global Pop", vibeReason: "إيقاع حيوي عالمي شهير" },
        { trackName: "يا غايب", artistName: "فضل شاكر", genre: "Classic Arabic", vibeReason: "إحساس رومانسي عالي" },
        { trackName: "Blinding Lights", artistName: "The Weeknd", genre: "Modern Synth", vibeReason: "طاقة شبابية عصرية" },
        { trackName: "قمرين", artistName: "عمرو دياب", genre: "Latin Arabic", vibeReason: "إيقاع راقص مميز" }
      ],
      suggestedTags: ["أكثر استماعاً", "توب هيتس", "موسيقى عالمية", "عربي"]
    };
  };

  // Fetch AI DJ recommendations from Gemini API
  const fetchAiDjSuggestions = async (searchTerm: string, mood?: string) => {
    if (!searchTerm.trim() && !mood) return;
    setIsLoadingAiDj(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch('/api/music/dj-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchTerm, mood }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data: AiDjResponse = await res.json();
        if (data && data.recommendations && data.recommendations.length > 0) {
          setAiDjData(data);
          return;
        }
      }
      setAiDjData(getClientAiDjFallback(searchTerm, mood));
    } catch {
      clearTimeout(timeoutId);
      setAiDjData(getClientAiDjFallback(searchTerm, mood));
    } finally {
      setIsLoadingAiDj(false);
    }
  };

  // Debounced search when query changes
  useEffect(() => {
    if (!query.trim()) {
      setMusicTracks([]);
      setAiDjData(null);
      return;
    }

    const timer = setTimeout(() => {
      searchMusicTracks(query);
      fetchAiDjSuggestions(query);
    }, 450);

    return () => clearTimeout(timer);
  }, [query]);

  // Audio Playback Handler
  const togglePlayTrack = (track: MusicTrack) => {
    if (currentTrack?.trackId === track.trackId) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setCurrentTrack(track);
      setIsPlaying(true);
      setAudioProgress(0);

      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch(() => {
            showToast('تعذر تشغيل المقطع الصوتي');
            setIsPlaying(false);
          });
        }
      }, 50);
    }
  };

  // Play a suggested track from AI DJ by searching its audio preview
  const playAiSuggestedTrack = async (trackName: string, artistName: string) => {
    showToast(`🎧 AI DJ: تشغيل "${trackName}" لـ ${artistName}...`);
    setIsSearchingMusic(true);
    try {
      const queryStr = `${trackName} ${artistName}`;
      const response = await fetch(`/api/music/itunes-proxy?term=${encodeURIComponent(queryStr)}&limit=5`);
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const targetTrack: MusicTrack = data.results[0];
          togglePlayTrack(targetTrack);
          // Add to current track list if not there
          setMusicTracks(prev => {
            if (prev.some(t => t.trackId === targetTrack.trackId)) return prev;
            return [targetTrack, ...prev];
          });
          return;
        }
      }
      showToast(`تم اختيار "${trackName}"`);
    } catch {
      showToast('تعذر تشغيل المقطع');
    } finally {
      setIsSearchingMusic(false);
    }
  };

  // Share song to Feed as Post
  const handleShareAsPost = (track: MusicTrack) => {
    try {
      addPost(`🎵 استمع إلى أغنية: ${track.trackName} - ${track.artistName} عبر AI DJ`, track.artworkUrl100, undefined, track.previewUrl);
      showToast('✅ تم نشر الأغنية في صفحتك الرئيسية بنجاح!');
    } catch (error) {
      showToast('حدث خطأ أثناء نشر الأغنية');
    }
  };

  // Handle Quick Vibe Selection
  const handleQuickVibe = (vibe: string) => {
    setSelectedVibeTag(vibe);
    setQuery(vibe);
    searchMusicTracks(vibe);
    fetchAiDjSuggestions(vibe, vibe);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-100 min-h-screen pb-24"
    >
      {/* Hidden Audio Player */}
      {currentTrack && (
        <audio
          ref={audioRef}
          src={currentTrack.previewUrl}
          onTimeUpdate={(e) => {
            const el = e.currentTarget;
            if (el.duration) {
              setAudioProgress((el.currentTime / el.duration) * 100);
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            setAudioProgress(0);
          }}
          autoPlay
        />
      )}

      {/* Sticky Top Search Header */}
      <div className="bg-white p-3 shadow-xs mb-2 md:rounded-2xl border-b border-gray-200 sticky top-14 z-30 space-y-2">
        {/* Input Row */}
        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن أغنية، فنان، اسم مستخدم، أو منشورات..."
              className="w-full bg-gray-100 rounded-full pl-10 pr-11 py-2.5 text-sm font-bold text-gray-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
              autoFocus
            />
            <SearchIcon size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            
            {query.trim() && (
              <button
                onClick={() => {
                  setQuery('');
                  setMusicTracks([]);
                  setAiDjData(null);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Quick Music / AI DJ Toggle Button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              setActiveTab(activeTab === 'music' ? 'all' : 'music');
              if (activeTab !== 'music' && !query.trim()) {
                setQuery('Top Hits 2026');
                searchMusicTracks('Top Hits 2026');
                fetchAiDjSuggestions('Top Hits 2026');
              }
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-full font-black text-xs transition-all shadow-sm shrink-0 ${
              activeTab === 'music'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white ring-2 ring-blue-300'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
            }`}
            title="وضع الموسيقى والـ AI DJ"
          >
            <Music size={16} className={activeTab === 'music' ? 'animate-bounce' : ''} />
            <span className="hidden sm:inline">AI DJ</span>
          </motion.button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pt-1 pb-0.5">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            الكل
          </button>

          <button
            onClick={() => {
              setActiveTab('music');
              if (!query.trim()) {
                setQuery('أغاني عربية وعالمية');
                searchMusicTracks('أغاني عربية وعالمية');
                fetchAiDjSuggestions('أغاني عربية وعالمية');
              }
            }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black transition-all shrink-0 ${
              activeTab === 'music'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-100'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100'
            }`}
          >
            <Sparkles size={14} className="text-yellow-300 animate-spin-slow" />
            <Music size={14} />
            <span>موسيقى & AI DJ</span>
          </button>

          <button
            onClick={() => setActiveTab('people')}
            className={`flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              activeTab === 'people'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Users size={14} />
            <span>الأشخاص</span>
          </button>

          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              activeTab === 'posts'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FileText size={14} />
            <span>المنشورات</span>
          </button>
        </div>
      </div>

      {/* Floating Active Track Audio Bar */}
      <AnimatePresence>
        {currentTrack && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-3 inset-x-3 max-w-xl mx-auto z-40 bg-gray-900/95 backdrop-blur-md text-white rounded-2xl p-3 shadow-2xl border border-gray-700 flex flex-col gap-2 dir-rtl"
          >
            {/* Top info and play controls */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-md shrink-0 bg-gray-800">
                  <img
                    src={currentTrack.artworkUrl100}
                    alt={currentTrack.trackName}
                    className="w-full h-full object-cover"
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Volume2 size={18} className="text-white animate-pulse" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-xs sm:text-sm text-white truncate">
                    {currentTrack.trackName}
                  </h4>
                  <p className="text-[11px] text-gray-400 font-bold truncate">
                    {currentTrack.artistName}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleShareAsPost(currentTrack)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-blue-400 transition-colors"
                  title="مشاركة كمنشور"
                >
                  <Share2 size={15} />
                </button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => togglePlayTrack(currentTrack)}
                  className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg transition-colors"
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                </motion.button>

                <button
                  onClick={() => {
                    if (audioRef.current) audioRef.current.pause();
                    setCurrentTrack(null);
                    setIsPlaying(false);
                  }}
                  className="text-gray-400 hover:text-white p-1"
                  title="إغلاق المشغل"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-150 rounded-full"
                style={{ width: `${audioProgress}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Search Content Area */}
      <div className="space-y-3">
        {/* Quick AI DJ Mood Presets (when query is empty or in Music tab) */}
        {(!query.trim() || activeTab === 'music') && (
          <div className="bg-white p-3.5 md:rounded-2xl shadow-xs border border-gray-200/80">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-600" />
                <h3 className="font-black text-xs text-gray-800">اقتراحات AI DJ السريعة</h3>
              </div>
              <span className="text-[10px] text-gray-400 font-bold">مراجعة سريعة</span>
            </div>

            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {[
                { label: '🔥 الأكثر استماعاً 2026', query: 'Top Hits 2026' },
                { label: '🎧 طرب عربي كلاسيك', query: 'طرب كلاسيكي' },
                { label: '☕ روقان وهدوء Lo-Fi', query: 'Lo-Fi Chill Arabic' },
                { label: '⚡ حماسي وريمكس', query: 'Arabic Remix Energy' },
                { label: '🌟 عمرو دياب & تامر حسني', query: 'عمرو دياب' }
              ].map((preset, idx) => (
                <button
                  key={`search-preset-${preset.query}-${idx}`}
                  onClick={() => handleQuickVibe(preset.query)}
                  className="px-3 py-1.5 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-800 text-xs font-bold rounded-xl border border-indigo-100 transition-all shrink-0 flex items-center gap-1"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI DJ Smart Card Section */}
        {(activeTab === 'all' || activeTab === 'music') && (aiDjData || isLoadingAiDj) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white p-4 md:rounded-2xl shadow-lg border border-indigo-800/40 relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
                    <Headphones size={18} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                      <span>AI DJ الذكي</span>
                      <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-400/20 font-bold">
                        Gemini AI
                      </span>
                    </h3>
                    <p className="text-[11px] text-indigo-200/80 font-medium">
                      اقتراحات مخصصة فورية بناءً على بحثك: "{query || 'مختارات'}"
                    </p>
                  </div>
                </div>

                {isLoadingAiDj && (
                  <div className="flex items-center gap-1 text-xs text-indigo-300 font-bold">
                    <RotateCw size={14} className="animate-spin" />
                    <span>جاري التوليد...</span>
                  </div>
                )}
              </div>

              {/* AI DJ Commentary */}
              {aiDjData?.djCommentary && (
                <div className="bg-white/10 rounded-xl p-3 text-xs leading-relaxed text-indigo-100 border border-white/10 font-medium backdrop-blur-xs">
                  <p className="flex items-start gap-2">
                    <Sparkles size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                    <span>{aiDjData.djCommentary}</span>
                  </p>
                </div>
              )}

              {/* Suggested Tracks by AI DJ */}
              {aiDjData?.recommendations && aiDjData.recommendations.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-300 px-1">
                    <span>الأغاني المقترحة بواسطة AI DJ</span>
                    <span className="text-[10px] text-indigo-400">انقر للاستماع الفوري</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {aiDjData.recommendations.map((rec, index) => (
                      <motion.div
                        key={`ai-dj-rec-${rec.trackName}-${index}`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => playAiSuggestedTrack(rec.trackName, rec.artistName)}
                        className="bg-white/5 hover:bg-white/15 border border-white/10 rounded-xl p-2.5 flex items-center justify-between gap-2.5 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-indigo-600/40 group-hover:bg-blue-600 flex items-center justify-center text-white shrink-0 transition-colors shadow-xs">
                            <Play size={15} className="fill-white" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-black text-xs text-white truncate group-hover:text-blue-300 transition-colors">
                              {rec.trackName}
                            </h4>
                            <p className="text-[11px] text-indigo-200/70 truncate font-medium">
                              {rec.artistName} {rec.genre ? `• ${rec.genre}` : ''}
                            </p>
                          </div>
                        </div>

                        {rec.vibeReason && (
                          <span className="text-[10px] bg-white/10 text-indigo-200 px-2 py-0.5 rounded-md shrink-0 hidden sm:inline">
                            {rec.vibeReason}
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Music Search Results Section (Direct Audio Playable Stream) */}
        {(activeTab === 'all' || activeTab === 'music') && (
          <div className="bg-white p-4 md:rounded-2xl shadow-xs border border-gray-200">
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Disc size={16} />
                </div>
                <h3 className="font-black text-sm text-gray-900">
                  الأغاني والمقاطع الصوتية ({musicTracks.length})
                </h3>
              </div>
              {isSearchingMusic && (
                <span className="text-xs text-blue-600 font-bold flex items-center gap-1">
                  <RotateCw size={12} className="animate-spin" />
                  جاري جلب المقاطع...
                </span>
              )}
            </div>

            {musicTracks.length > 0 ? (
              <div className="space-y-2">
                {musicTracks.map((track, mIdx) => {
                  const isCurrent = currentTrack?.trackId === track.trackId;
                  return (
                    <div
                      key={`search-track-${track.trackId}-${mIdx}`}
                      className={`flex items-center justify-between gap-3 p-2.5 rounded-xl transition-all border ${
                        isCurrent
                          ? 'bg-blue-50/80 border-blue-200 shadow-xs'
                          : 'bg-gray-50/70 hover:bg-gray-100 border-transparent'
                      }`}
                    >
                      {/* Track artwork + details */}
                      <div
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                        onClick={() => togglePlayTrack(track)}
                      >
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-xs bg-gray-200">
                          <img
                            src={track.artworkUrl100}
                            alt={track.trackName}
                            className="w-full h-full object-cover"
                          />
                          <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                            isCurrent && isPlaying ? 'bg-black/40 opacity-100' : 'bg-black/20 opacity-0 hover:opacity-100'
                          }`}>
                            {isCurrent && isPlaying ? (
                              <Pause size={18} className="text-white fill-white" />
                            ) : (
                              <Play size={18} className="text-white fill-white ml-0.5" />
                            )}
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className={`font-black text-xs sm:text-sm truncate ${
                            isCurrent ? 'text-blue-700' : 'text-gray-900'
                          }`}>
                            {track.trackName}
                          </h4>
                          <p className="text-xs text-gray-500 font-bold truncate mt-0.5">
                            {track.artistName} {track.collectionName ? `• ${track.collectionName}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Controls & Share */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Sound Wave Animation if Playing */}
                        {isCurrent && isPlaying && (
                          <div className="flex gap-0.5 items-end h-4 px-2">
                            <span className="w-1 bg-blue-600 h-full animate-[bounce_1s_infinite]"></span>
                            <span className="w-1 bg-blue-600 h-2/3 animate-[bounce_1s_infinite_0.2s]"></span>
                            <span className="w-1 bg-blue-600 h-1/2 animate-[bounce_1s_infinite_0.4s]"></span>
                          </div>
                        )}

                        <button
                          onClick={() => handleShareAsPost(track)}
                          className="px-2.5 py-1.5 bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-600 border border-gray-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs"
                          title="نشر في منشورك"
                        >
                          <PlusCircle size={14} />
                          <span className="hidden sm:inline">نشر</span>
                        </button>

                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => togglePlayTrack(track)}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                            isCurrent && isPlaying
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                          }`}
                        >
                          {isCurrent && isPlaying ? (
                            <Pause size={16} />
                          ) : (
                            <Play size={16} className="ml-0.5" />
                          )}
                        </motion.button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              !isSearchingMusic && query.trim() && (
                <div className="py-6 text-center text-gray-500 text-xs">
                  لا توجد مقاطع صوتية مباشرة لهذا البحث. جرب الضغط على اقتراحات AI DJ أعلاه.
                </div>
              )
            )}
          </div>
        )}

        {/* Users Results Section */}
        {(activeTab === 'all' || activeTab === 'people') && filteredUsers.length > 0 && (
          <div className="bg-white p-4 md:rounded-2xl shadow-xs border border-gray-200">
            <h3 className="font-bold text-sm text-gray-800 mb-3 border-b border-gray-100 pb-2 flex items-center gap-1.5">
              <Users size={16} className="text-blue-600" />
              <span>الأشخاص ({filteredUsers.length})</span>
            </h3>
            <div className="space-y-3">
              {filteredUsers.map((user, uIdx) => (
                <div 
                  key={user.id ? `search-user-${user.id}-${uIdx}` : `search-user-${uIdx}`} 
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-colors" 
                  onClick={() => setCurrentView('profile', user.id)}
                >
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-12 h-12 rounded-full object-cover border border-gray-200" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-sm text-gray-900 truncate flex items-center gap-1">
                      {user.name}
                      {(user.id === 'ai-bot' || user.name === 'OWN AI') && (
                        <span className="bg-blue-500 text-white rounded-full w-3.5 h-3.5 inline-flex items-center justify-center text-[9px] font-bold shrink-0" title="موثق">✓</span>
                      )}
                    </h4>
                    <p className="text-xs text-gray-500 truncate">{user.bio || 'مستخدم GROZLA'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Posts Results Section */}
        {(activeTab === 'all' || activeTab === 'posts') && filteredPosts.length > 0 && (
          <div>
            <h3 className="font-bold text-sm text-gray-800 mb-2 px-3 md:px-0 flex items-center gap-1.5">
              <FileText size={16} className="text-blue-600" />
              <span>المنشورات ({filteredPosts.length})</span>
            </h3>
            {filteredPosts.map((post, pIdx) => (
              <div key={post.id ? `search-post-${post.id}-${pIdx}` : `search-post-${pIdx}`} className="mb-2">
                <Post post={post} />
              </div>
            ))}
          </div>
        )}

        {/* Empty state when nothing matched */}
        {query.trim() && 
         filteredUsers.length === 0 && 
         filteredPosts.length === 0 && 
         musicTracks.length === 0 && 
         !isLoadingAiDj && (
          <div className="bg-white p-8 text-center text-gray-500 md:rounded-2xl shadow-xs border border-gray-200">
            <SearchIcon size={44} className="mx-auto text-gray-300 mb-3" />
            <p className="text-base font-bold text-gray-700">لم يتم العثور على نتائج لـ "{query}"</p>
            <p className="text-xs text-gray-400 mt-1">جرب كلمات أخرى أو اضغط على اقتراحات AI DJ للموسيقى.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

