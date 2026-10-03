import React, { useRef, useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, ChevronLeft, ChevronRight, Trash2, Music, Video, Volume2, VolumeX, Sparkles, Archive } from 'lucide-react';
import FacebookStoryStudio from './FacebookStoryStudio';

export default function Stories() {
  const { users, currentUser, stories, addStory, deleteStory, archiveStory, reportUser, loadingStates, showToast } = useAppContext();
  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);
  const [currentStorySubIndex, setCurrentStorySubIndex] = useState(0);
  const [showStoryStudio, setShowStoryStudio] = useState(false);
  const [isViewerAudioMuted, setIsViewerAudioMuted] = useState(false);

  const viewerAudioRef = useRef<HTMLAudioElement | null>(null);

  // Group stories by user
  const groupedStories = stories.reduce((acc, story) => {
    if (!acc[story.authorId]) {
      acc[story.authorId] = [];
    }
    acc[story.authorId].push(story);
    return acc;
  }, {} as Record<string, typeof stories>);

  // Get unique users who have stories (friends + current user)
  const storyUsers = Object.keys(groupedStories)
    .filter(id => {
      if (!currentUser) return false;
      const isMe = id === currentUser.id;
      const isFriend = currentUser.friends?.includes(id);
      const isBlockedByMe = currentUser.blockedUsers?.includes(id);
      const userObj = users.find(u => u.id === id);
      const isInactive = !isMe && userObj?.status !== 'active';
      const hasBlockedMe = userObj?.blockedUsers?.includes(currentUser.id);
      
      return (isMe || isFriend) && !isBlockedByMe && !hasBlockedMe && !isInactive;
    })
    .map(id => users.find(u => u.id === id))
    .filter(Boolean) as typeof users;

  // Sort so current user is last (since Add Story button is at the end)
  storyUsers.sort((a, b) => {
    if (!currentUser) return 0;
    if (a.id === currentUser.id) return 1;
    if (b.id === currentUser.id) return -1;
    return 0;
  });

  // Current active story being viewed
  const currentViewingUser = viewingStoryIndex !== null ? storyUsers[viewingStoryIndex] : null;
  const currentUserStories = currentViewingUser ? groupedStories[currentViewingUser.id] || [] : [];
  const currentStory = currentUserStories[currentStorySubIndex] || null;

  // Handle music playback in story viewer
  useEffect(() => {
    if (currentStory?.music && viewingStoryIndex !== null) {
      if (!viewerAudioRef.current) {
        viewerAudioRef.current = new Audio(currentStory.music);
        viewerAudioRef.current.loop = true;
      } else {
        viewerAudioRef.current.src = currentStory.music;
      }
      if (!isViewerAudioMuted) {
        viewerAudioRef.current.play().catch(err => console.warn('Viewer audio play error:', err));
      } else {
        viewerAudioRef.current.pause();
      }
    } else {
      if (viewerAudioRef.current) {
        viewerAudioRef.current.pause();
      }
    }

    return () => {
      if (viewerAudioRef.current) {
        viewerAudioRef.current.pause();
      }
    };
  }, [currentStory, viewingStoryIndex, isViewerAudioMuted]);

  if (!currentUser) return null;

  const handlePublishStory = (storyData: {
    image?: string;
    video?: string;
    music?: string;
    songTitle?: string;
    songArtist?: string;
    songCover?: string;
    text?: string;
    textColor?: string;
    textSize?: 'small' | 'normal' | 'large';
  }) => {
    addStory(
      storyData.image,
      storyData.video,
      storyData.music,
      storyData.songTitle,
      storyData.songArtist,
      storyData.songCover,
      storyData.text,
      storyData.textColor,
      storyData.textSize
    );
    setShowStoryStudio(false);
  };

  const handleNextUser = () => {
    if (viewingStoryIndex !== null && viewingStoryIndex < storyUsers.length - 1) {
      setViewingStoryIndex(viewingStoryIndex + 1);
      setCurrentStorySubIndex(0);
    } else {
      setViewingStoryIndex(null);
    }
  };

  const handlePrevUser = () => {
    if (viewingStoryIndex !== null && viewingStoryIndex > 0) {
      setViewingStoryIndex(viewingStoryIndex - 1);
      setCurrentStorySubIndex(0);
    }
  };

  const handleNextStory = () => {
    if (viewingStoryIndex !== null) {
      const userStories = groupedStories[storyUsers[viewingStoryIndex].id];
      if (currentStorySubIndex < userStories.length - 1) {
        setCurrentStorySubIndex(currentStorySubIndex + 1);
      } else {
        handleNextUser();
      }
    }
  };

  const handlePrevStory = () => {
    if (viewingStoryIndex !== null) {
      if (currentStorySubIndex > 0) {
        setCurrentStorySubIndex(currentStorySubIndex - 1);
      } else {
        handlePrevUser();
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Stories Horizontal Tray (Facebook Style مع إظهار خلفية الحفلة بوضوح) */}
      <div className="bg-white/90 p-4 md:rounded-2xl shadow-md overflow-x-auto border border-white/80">
        <div className="flex gap-3 min-w-max items-center">
          {/* Add Story Card - Facebook Signature Look */}
          <div 
            onClick={() => setShowStoryStudio(true)}
            className="flex flex-col items-center w-26 h-44 rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group relative bg-gray-50 shrink-0"
          >
            {/* Top 65% User Profile Picture */}
            <div className="w-full h-[65%] overflow-hidden bg-gray-200 relative">
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                referrerPolicy="no-referrer" 
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
            </div>

            {/* Bottom 35% Action Info */}
            <div className="w-full h-[35%] bg-white relative flex flex-col items-center justify-end pb-2 pt-4 px-1">
              {/* Overlapping Purple Plus Button */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#8b5cf6] text-white rounded-full p-2 border-[3px] border-white shadow-md group-hover:bg-[#7c3aed] transition-colors">
                {loadingStates.addingStory ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus size={16} strokeWidth={3} />
                )}
              </div>
              <span className="text-[11px] font-bold text-gray-800 leading-tight">إنشاء قصة</span>
            </div>

            {/* Quick action shortcuts */}
            <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowStoryStudio(true); }}
                className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-purple-700 transition-colors"
                title="إضافة قصة بموسيقى"
              >
                <Music size={11} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowStoryStudio(true); }}
                className="w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-rose-700 transition-colors"
                title="إضافة قصة فيديو"
              >
                <Video size={11} />
              </button>
            </div>
          </div>

          {/* Published Stories Cards */}
          {storyUsers.map((user, index) => {
            const userStories = groupedStories[user.id];
            const latestStory = userStories[0];
            const hasMusic = userStories.some(s => !!s.music);
            const hasVideo = userStories.some(s => !!s.video);
            
            return (
              <div 
                key={`story-user-${user.id}-${index}`} 
                onClick={() => { setViewingStoryIndex(index); setCurrentStorySubIndex(0); }}
                className="w-[110px] h-[180px] rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer relative group bg-neutral-900 shrink-0"
              >
                {/* Story preview image / background */}
                {latestStory.image ? (
                  <img 
                    src={latestStory.image} 
                    alt={user.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    referrerPolicy="no-referrer" 
                  />
                ) : latestStory.video ? (
                  <video 
                    src={latestStory.video} 
                    className="w-full h-full object-cover" 
                    muted 
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-purple-700 via-pink-600 to-indigo-600 flex items-center justify-center p-2 text-center text-white">
                    <Music size={28} className="animate-pulse opacity-80" />
                  </div>
                )}

                {/* Gradient for legibility */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

                {/* Story count badge (like screenshot) */}
                <div className="absolute top-2 left-2 bg-[#8b5cf6] text-white text-xs font-bold px-2 py-0.5 rounded-sm z-10 shadow-sm rounded-br-lg">
                  {userStories.length}
                </div>

                {/* User Avatar */}
                <div className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full border-[2.5px] border-[#8b5cf6] p-[1.5px] overflow-hidden bg-white shadow-md z-10">
                  <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                </div>

                {/* User Name at bottom */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10">
                  <span className="text-xs font-black text-white line-clamp-2 leading-tight drop-shadow-md text-right block">
                    {user.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          FULL-SCREEN FACEBOOK STORY STUDIO (CREATOR)
         ======================================================== */}
      <FacebookStoryStudio
        isOpen={showStoryStudio}
        onClose={() => setShowStoryStudio(false)}
        onPublish={handlePublishStory}
        isPublishing={loadingStates.addingStory}
      />

      {/* ========================================================
          FULL-SCREEN STORY VIEWER MODAL
         ======================================================== */}
      <AnimatePresence>
        {viewingStoryIndex !== null && currentViewingUser && currentStory && (
          <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center select-none overflow-hidden" dir="rtl">
            {/* Close button */}
            <button 
              onClick={() => setViewingStoryIndex(null)} 
              className="absolute top-4 right-4 text-white p-2.5 z-50 bg-black/60 backdrop-blur-md rounded-full hover:bg-black/80 transition-colors cursor-pointer border border-white/10"
              title="إغلاق"
            >
              <X size={22} />
            </button>
            
            {/* Story Container 9:16 Canvas */}
            <div className="relative w-full max-w-[420px] h-full sm:h-[92vh] sm:rounded-3xl overflow-hidden bg-neutral-950 flex flex-col justify-between shadow-2xl border border-neutral-800">
              {/* Story Top Progress Bars */}
              <div className="absolute top-2.5 left-3 right-3 z-30 flex gap-1.5">
                {currentUserStories.map((_, i) => (
                  <div key={i} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                    <div className={`h-full bg-white transition-all duration-300 ${i === currentStorySubIndex ? 'w-full' : i < currentStorySubIndex ? 'w-full' : 'w-0'}`} />
                  </div>
                ))}
              </div>

              {/* Story Header (Avatar, Name, Actions) */}
              <div className="relative z-20 p-4 pt-6 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full border-2 border-[#1877f2] overflow-hidden bg-neutral-800">
                    <img src={currentViewingUser.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm drop-shadow-md leading-tight">{currentViewingUser.name}</h4>
                    <span className="text-[11px] text-neutral-300 drop-shadow-sm font-medium">منذ قليل</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Sound mute/unmute toggle if music attached */}
                  {currentStory.music && (
                    <button
                      onClick={() => setIsViewerAudioMuted(!isViewerAudioMuted)}
                      className="p-2 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-colors cursor-pointer border border-white/10"
                      title={isViewerAudioMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
                    >
                      {isViewerAudioMuted ? <VolumeX size={16} className="text-red-400" /> : <Volume2 size={16} className="text-emerald-400" />}
                    </button>
                  )}

                  {/* Archive (if owner) */}
                  {currentViewingUser.id === currentUser.id && (
                    <button 
                      onClick={() => {
                        archiveStory(currentStory.id);
                        if (currentUserStories.length === 1) {
                          setViewingStoryIndex(null);
                        } else {
                          handleNextStory();
                        }
                      }}
                      className="text-white p-2 bg-black/50 backdrop-blur-md rounded-full hover:bg-blue-600 transition-colors cursor-pointer border border-white/10"
                      title="نقل القصة إلى الأرشيف"
                    >
                      <Archive size={16} />
                    </button>
                  )}

                  {/* Delete (if owner or admin) */}
                  {(currentViewingUser.id === currentUser.id || currentUser.email === 'bda43535@gmail.com') ? (
                    <button 
                      onClick={() => {
                        if (window.confirm('هل أنت متأكد من حذف هذه القصة؟')) {
                          deleteStory(currentStory.id);
                          if (currentUserStories.length === 1) {
                            setViewingStoryIndex(null);
                          } else {
                            handleNextStory();
                          }
                        }
                      }}
                      className="text-white p-2 bg-black/50 backdrop-blur-md rounded-full hover:bg-red-500 transition-colors cursor-pointer border border-white/10"
                      title="حذف القصة"
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        if (window.confirm('هل أنت متأكد من الإبلاغ عن هذه القصة؟')) {
                          reportUser(currentViewingUser.id);
                          showToast('تم إرسال البلاغ بنجاح ✨');
                          setViewingStoryIndex(null);
                        }
                      }}
                      className="text-white p-2 bg-black/50 backdrop-blur-md rounded-full hover:bg-amber-500 transition-colors cursor-pointer border border-white/10"
                      title="إبلاغ"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Story Primary Media Content - Normal image ratio like normal post */}
              <div className="absolute inset-0 z-0 flex items-center justify-center bg-neutral-950 p-2">
                {currentStory.image ? (
                  <img 
                    src={currentStory.image} 
                    alt="Story" 
                    className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-xl"
                    referrerPolicy="no-referrer"
                  />
                ) : currentStory.video ? (
                  <video 
                    src={currentStory.video} 
                    autoPlay 
                    loop 
                    playsInline
                    className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-xl"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-700 via-indigo-800 to-neutral-950 flex flex-col items-center justify-center p-6 text-center">
                    {!currentStory.text && <Music size={36} className="text-pink-400 mb-3 animate-bounce" />}
                    {currentStory.songTitle && (
                      <h3 className="text-sm font-bold text-white mb-1">{currentStory.songTitle}</h3>
                    )}
                    {currentStory.songArtist && (
                      <p className="text-xs font-medium text-neutral-300">{currentStory.songArtist}</p>
                    )}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none" />
              </div>

              {/* STORY TEXT OVERLAY - Normal, readable, non-giant size (حجم عادي غير مبالغ فيه) */}
              {currentStory.text && (
                <div className="relative z-20 px-4 my-auto flex justify-center pointer-events-none">
                  <div 
                    className="bg-black/60 backdrop-blur-xs px-3.5 py-1.5 rounded-xl max-w-[85%] text-center shadow-md border border-white/10 pointer-events-auto"
                    style={{ color: currentStory.textColor || '#ffffff' }}
                  >
                    <p className={`leading-relaxed break-words ${
                      currentStory.textSize === 'small' ? 'text-xs font-normal' :
                      currentStory.textSize === 'large' ? 'text-base font-semibold' :
                      'text-sm font-normal'
                    }`}>
                      {currentStory.text}
                    </p>
                  </div>
                </div>
              )}

              {/* AUTHENTIC FACEBOOK MUSIC STICKER (if music is attached) */}
              {currentStory.music && (
                <div className="relative z-20 px-4 pb-8 flex justify-center pointer-events-none">
                  <div className="bg-black/60 backdrop-blur-md text-white rounded-full px-4 py-2 border border-white/20 flex items-center gap-3 shadow-2xl pointer-events-auto">
                    {/* Album Art or Disc */}
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-800 border border-white/30 shrink-0">
                      {currentStory.songCover ? (
                        <img src={currentStory.songCover} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white">
                          <Music size={14} />
                        </div>
                      )}
                    </div>

                    {/* Track info */}
                    <div className="text-right min-w-0 max-w-[180px] sm:max-w-[220px]">
                      <p className="text-xs font-black text-white truncate leading-tight">
                        {currentStory.songTitle || 'موسيقى القصة'}
                      </p>
                      <p className="text-[10px] text-neutral-300 truncate mt-0.5">
                        {currentStory.songArtist || 'فيسبوك ميوزك'}
                      </p>
                    </div>

                    {/* Animated Equalizer Wave Bars */}
                    <div className="flex items-end gap-0.5 h-3.5 text-blue-400 shrink-0">
                      <span className="w-0.5 h-2 bg-blue-400 animate-pulse rounded-full" />
                      <span className="w-0.5 h-3.5 bg-blue-400 animate-pulse rounded-full delay-75" />
                      <span className="w-0.5 h-1.5 bg-blue-400 animate-pulse rounded-full delay-150" />
                    </div>
                  </div>
                </div>
              )}

              {/* Left & Right Tap zones to navigate */}
              <div className="absolute inset-0 z-10 flex">
                <div className="flex-1 cursor-pointer" onClick={handlePrevStory} />
                <div className="flex-1 cursor-pointer" onClick={handleNextStory} />
              </div>

              {/* Navigation Arrows for Desktop */}
              <div className="absolute inset-0 z-20 flex justify-between items-center px-3 pointer-events-none">
                <button 
                  onClick={handlePrevStory}
                  className={`p-2 bg-black/40 backdrop-blur-md rounded-full text-white pointer-events-auto transition-opacity ${viewingStoryIndex === 0 && currentStorySubIndex === 0 ? 'opacity-0' : 'opacity-70 hover:opacity-100'}`}
                >
                  <ChevronRight size={22} />
                </button>
                <button 
                  onClick={handleNextStory}
                  className={`p-2 bg-black/40 backdrop-blur-md rounded-full text-white pointer-events-auto transition-opacity ${viewingStoryIndex === storyUsers.length - 1 && currentStorySubIndex === currentUserStories.length - 1 ? 'opacity-0' : 'opacity-70 hover:opacity-100'}`}
                >
                  <ChevronLeft size={22} />
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
