import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sparkles, Play, Pause, X, Music, Check, Disc, Volume2, Flame, Heart, Compass, Coffee } from 'lucide-react';
import { Song, REAL_SONGS } from '../constants/music';

interface StoryMusicSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSong: (song: Song) => void;
  currentSongUrl?: string;
  title?: string;
  subtitle?: string;
}

const CATEGORIES = [
  { id: 'trending', label: 'الرائج', icon: Flame, query: 'Didine Canon 16 Soolking Amr Diab' },
  { id: 'rai', label: 'راي ومغاربي', icon: Disc, query: 'Didine Canon 16 Soolking Mouh Milano' },
  { id: 'arabic', label: 'شرقي ومصري', icon: Heart, query: 'Amr Diab Tamer Hosny Fairouz' },
  { id: 'global', label: 'بوب وعالمي', icon: Compass, query: 'The Weeknd Billie Eilish Dua Lipa' },
  { id: 'chill', label: 'هدوء واسترخاء', icon: Coffee, query: 'Acoustic Lo-Fi Fairouz instrumental' },
];

export default function StoryMusicSelector({
  isOpen,
  onClose,
  onSelectSong,
  currentSongUrl,
  title = 'إضافة موسيقى',
  subtitle = 'بحث مدعوم بالذكاء الاصطناعي مع دعم كامل للغة العربية'
}: StoryMusicSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('trending');
  const [songs, setSongs] = useState<Song[]>(REAL_SONGS);
  const [loading, setLoading] = useState(false);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [aiNote, setAiNote] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize and stop audio when closed
  useEffect(() => {
    if (!isOpen) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      setPlayingSongId(null);
    }
  }, [isOpen]);

  // Load trending music on open
  useEffect(() => {
    if (!isOpen) return;

    const fetchTrending = async () => {
      try {
        const res = await fetch('/api/music/trending');
        if (res.ok) {
          const data = await res.json();
          if (data.songs && data.songs.length > 0) {
            setSongs(data.songs);
          }
        }
      } catch (err) {
        console.error('Failed to fetch trending music:', err);
      }
    };

    fetchTrending();
  }, [isOpen]);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Search songs with optional AI assist
  const handleSearch = async (query: string, useAi: boolean = false) => {
    const term = query.trim();
    if (!term) {
      setSongs(REAL_SONGS);
      setAiNote(null);
      return;
    }

    setLoading(true);
    if (useAi) setIsAiSearching(true);
    setAiNote(null);

    try {
      const res = await fetch('/api/music/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: term, aiAssist: useAi })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.songs && data.songs.length > 0) {
          setSongs(data.songs);
          if (useAi || data.aiRecommendedCount > 0) {
            setAiNote(`تم العثور على أفضل الأغاني بواسطة الذكاء الاصطناعي لـ "${term}"`);
          }
        } else {
          // Fallback to client-side filter
          const filtered = REAL_SONGS.filter(s => 
            s.title.toLowerCase().includes(term.toLowerCase()) ||
            s.artist.toLowerCase().includes(term.toLowerCase())
          );
          setSongs(filtered.length > 0 ? filtered : REAL_SONGS);
        }
      } else {
        const filtered = REAL_SONGS.filter(s => 
          s.title.toLowerCase().includes(term.toLowerCase()) ||
          s.artist.toLowerCase().includes(term.toLowerCase())
        );
        setSongs(filtered.length > 0 ? filtered : REAL_SONGS);
      }
    } catch (err) {
      const filtered = REAL_SONGS.filter(s => 
        s.title.toLowerCase().includes(term.toLowerCase()) ||
        s.artist.toLowerCase().includes(term.toLowerCase())
      );
      setSongs(filtered.length > 0 ? filtered : REAL_SONGS);
    } finally {
      setLoading(false);
      setIsAiSearching(false);
    }
  };

  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!value.trim()) {
      setSongs(REAL_SONGS);
      setAiNote(null);
      return;
    }

    // Debounce standard keyword search to prevent spamming
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value, false);
    }, 350);
  };

  const handleCategorySelect = (cat: typeof CATEGORIES[0]) => {
    setActiveCategory(cat.id);
    setSearchQuery('');
    handleSearch(cat.query, false);
  };

  const togglePlay = (e: React.MouseEvent, song: Song) => {
    e.stopPropagation();

    if (playingSongId === song.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingSongId(null);
    } else {
      setPlayingSongId(song.id);
      if (!audioRef.current) {
        audioRef.current = new Audio(song.url);
      } else {
        audioRef.current.src = song.url;
      }
      audioRef.current.play().catch(err => {
        console.warn('Audio play failed:', err);
      });
    }
  };

  const selectSong = (song: Song) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayingSongId(null);
    onSelectSong(song);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 select-none">
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-neutral-900 text-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl border border-neutral-800 overflow-hidden"
          dir="rtl"
        >
          {/* Header */}
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-md">
                <Music size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-white">{title}</h3>
                <p className="text-[11px] text-neutral-400 font-medium">{subtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search bar with AI Trigger */}
          <div className="p-4 space-y-3 bg-neutral-950/60 border-b border-neutral-800/80">
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                      handleSearch(searchQuery, true);
                    }
                  }}
                  placeholder="ابحث بالعربية أو الإنجليزية (عمرو دياب، فيروز، راي، هدوء)..."
                  className="w-full bg-neutral-800/90 text-white text-xs sm:text-sm pr-10 pl-9 py-2.5 rounded-2xl border border-neutral-700 focus:border-blue-500 focus:outline-none transition-all placeholder:text-neutral-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                      setSearchQuery('');
                      setSongs(REAL_SONGS);
                      setAiNote(null);
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* AI Smart Search Button */}
              <button
                onClick={() => {
                  if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                  handleSearch(searchQuery || 'أغاني تريند حماسية للقصة', true);
                }}
                disabled={isAiSearching}
                className="px-3.5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20 active:scale-95 transition-all shrink-0 cursor-pointer disabled:opacity-50"
                title="بحث ذكي بالذكاء الاصطناعي لفهم المزاج واقتراح الأغاني"
              >
                <Sparkles size={15} className={isAiSearching ? 'animate-spin' : 'animate-pulse text-yellow-300'} />
                <span className="hidden sm:inline">بحث ذكي</span>
              </button>
            </div>

            {/* Category Chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide text-xs font-semibold">
              {CATEGORIES.map((cat, cIdx) => {
                const Icon = cat.icon;
                const isSelected = activeCategory === cat.id && !searchQuery;
                return (
                  <button
                    key={`story-cat-${cat.id}-${cIdx}`}
                    onClick={() => handleCategorySelect(cat)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm font-bold'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    <Icon size={13} className={isSelected ? 'text-white' : 'text-neutral-400'} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* AI Note / Status */}
            {aiNote && (
              <div className="text-[11px] font-bold text-indigo-300 bg-indigo-950/60 border border-indigo-800/60 px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-in fade-in">
                <Sparkles size={13} className="text-yellow-400 shrink-0" />
                <span>{aiNote}</span>
              </div>
            )}
          </div>

          {/* Songs List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[50vh] sm:max-h-[55vh] custom-scrollbar">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                <p className="text-xs text-neutral-400 font-bold">جاري البحث في مكتبة الأغاني والموسيقى...</p>
              </div>
            ) : songs.length === 0 ? (
              <div className="py-12 text-center text-neutral-400 space-y-2">
                <Music size={40} className="mx-auto opacity-30" />
                <p className="text-sm font-bold">لم يتم العثور على أغانٍ تطابق بحثك</p>
                <button
                  onClick={() => {
                    setSearchQuery('أغاني فيسبوك روجاً');
                    handleSearch('أغاني فيسبوك روجاً', true);
                  }}
                  className="text-xs text-blue-400 font-bold underline cursor-pointer"
                >
                  استكشف اقتراحات الذكاء الاصطناعي
                </button>
              </div>
            ) : (
              songs.map((song, sIdx) => {
                const isCurrentPlaying = playingSongId === song.id;
                const isCurrentlySelected = currentSongUrl === song.url;

                return (
                  <div
                    key={`story-song-${song.id}-${sIdx}`}
                    onClick={() => selectSong(song)}
                    className={`flex items-center gap-3 p-2.5 rounded-2xl transition-all cursor-pointer group ${
                      isCurrentlySelected 
                        ? 'bg-blue-600/20 border border-blue-500/40' 
                        : 'bg-neutral-800/60 hover:bg-neutral-800 border border-transparent hover:border-neutral-700'
                    }`}
                  >
                    {/* Album Art & Play Button */}
                    <div className="relative w-13 h-13 rounded-xl overflow-hidden shrink-0 bg-neutral-900 border border-neutral-700/60 shadow-md">
                      <img
                        src={song.cover}
                        alt={song.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        crossOrigin="anonymous"
                      />
                      <button
                        onClick={(e) => togglePlay(e, song)}
                        className={`absolute inset-0 flex items-center justify-center transition-all ${
                          isCurrentPlaying
                            ? 'bg-black/60 text-white'
                            : 'bg-black/30 text-white opacity-80 group-hover:opacity-100 group-hover:bg-black/50'
                        }`}
                        title={isCurrentPlaying ? 'إيقاف المعاينة' : 'استماع للمعاينة'}
                      >
                        {isCurrentPlaying ? (
                          <div className="flex items-center gap-0.5">
                            <span className="w-1 h-3 bg-blue-400 animate-pulse rounded-full" />
                            <span className="w-1 h-5 bg-blue-400 animate-pulse rounded-full delay-75" />
                            <span className="w-1 h-2 bg-blue-400 animate-pulse rounded-full delay-150" />
                          </div>
                        ) : (
                          <Play size={18} className="fill-white" />
                        )}
                      </button>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                          {song.title}
                        </h4>
                        {isCurrentlySelected && (
                          <span className="p-0.5 rounded-full bg-blue-500 text-white text-[9px] shrink-0">
                            <Check size={10} />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5 font-medium">
                        {song.artist}
                      </p>
                      {song.genre && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] px-2 py-0.5 rounded-md bg-neutral-700/60 text-neutral-300 font-medium">
                            {song.genre}
                          </span>
                          {isCurrentPlaying && (
                            <span className="text-[9px] text-blue-400 font-bold flex items-center gap-1 animate-pulse">
                              <Volume2 size={10} />
                              جاري التشغيل (30ث)
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        selectSong(song);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm ${
                        isCurrentlySelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-neutral-700 hover:bg-blue-600 text-neutral-200 hover:text-white'
                      }`}
                    >
                      {isCurrentlySelected ? 'مختارة' : 'إضافة'}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer status */}
          <div className="p-3 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-[11px] text-neutral-400 px-4">
            <span className="flex items-center gap-1">
              <Disc size={13} className="text-pink-400" />
              أغانٍ حقيقية مع معاينات رسمية عالية الجودة
            </span>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
