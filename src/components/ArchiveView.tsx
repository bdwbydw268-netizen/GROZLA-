import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Archive, FileText, Sparkles, X, RotateCcw, Trash2, 
  Copy, Eye, Clock, Calendar, AlertCircle, Share2, Music, Check, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { PostType, Story } from '../types';

export default function ArchiveView() {
  const { 
    posts, 
    archivedStories, 
    currentUser, 
    unarchivePost, 
    deletePost, 
    unarchiveStory, 
    deleteStory, 
    showToast,
    setCurrentView,
    direction
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<'posts' | 'stories'>('posts');

  // Filter current user's archived posts
  const myArchivedPosts = posts.filter(
    p => p.authorId === currentUser?.id && p.isArchived === true
  );

  // Current user's archived stories
  const myArchivedStories = archivedStories.filter(
    s => s.authorId === currentUser?.id
  );

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[#f0f2f5] min-h-screen p-2 sm:p-4 space-y-3 pb-16 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}
      dir={direction}
    >
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#1877f2] text-white flex items-center justify-center shadow-md shadow-blue-200 shrink-0">
            <Archive size={22} />
          </div>
          <div>
            <h3 className="font-black text-gray-900 text-base sm:text-lg flex items-center gap-2">
              <span>الأرشيف</span>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg font-extrabold">
                خاص بك فقط 🔒
              </span>
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              المنشورات والقصص المحفوظة في الأرشيف
            </p>
          </div>
        </div>
        <button 
          onClick={() => setCurrentView('menu')}
          className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
        >
          {direction === 'rtl' ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
        {/* Tab Navigation */}
        <div className="p-3 bg-gray-50/80 border-b border-gray-100 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'posts'
                ? 'bg-white text-blue-600 shadow-sm border border-gray-200/80'
                : 'text-gray-600 hover:bg-gray-100/80'
            }`}
          >
            <FileText size={16} />
            <span>أرشيف المنشورات</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
              activeTab === 'posts' ? 'bg-blue-50 text-blue-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {myArchivedPosts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('stories')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'stories'
                ? 'bg-white text-blue-600 shadow-sm border border-gray-200/80'
                : 'text-gray-600 hover:bg-gray-100/80'
            }`}
          >
            <Sparkles size={16} />
            <span>أرشيف القصص</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
              activeTab === 'stories' ? 'bg-blue-50 text-blue-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {myArchivedStories.length}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-5">
          {/* 1. أرشيف المنشورات */}
          {activeTab === 'posts' && (
            <div className="space-y-3">
              {myArchivedPosts.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                    <Archive size={30} />
                  </div>
                  <h4 className="font-black text-gray-800 text-base mb-1">لا توجد منشورات في الأرشيف</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                    عندما تنقل منشوراً إلى الأرشيف من قائمة الخيارات (نقاط المنشور الثلاث)، سيتم حفظه هنا بعيداً عن ملفك الشخصي ويمكنك استعادته في أي وقت.
                  </p>
                </div>
              ) : (
                myArchivedPosts.map((post, pIdx) => (
                  <div 
                    key={post.id ? `arch-post-${post.id}-${pIdx}` : `arch-post-${pIdx}`}
                    className="bg-white rounded-2xl border border-gray-200/90 p-4 hover:shadow-md transition-shadow space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={currentUser?.avatar} 
                          alt={currentUser?.name} 
                          className="w-10 h-10 rounded-full object-cover border border-gray-200"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h5 className="font-black text-gray-900 text-xs sm:text-sm">{currentUser?.name}</h5>
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                            <Calendar size={12} />
                            <span>نُشر: {formatDate(post.time)}</span>
                            {post.archivedAt && (
                              <span className="text-blue-500 font-bold mr-1">
                                • أرشفة: {formatDate(post.archivedAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span className="text-[11px] bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 border border-blue-100">
                        <Archive size={12} />
                        مؤرشف
                      </span>
                    </div>

                    {/* Post Content */}
                    {post.content && (
                      <p className="text-xs sm:text-sm text-gray-800 font-medium whitespace-pre-wrap leading-relaxed">
                        {post.content}
                      </p>
                    )}

                    {/* Post Media Preview */}
                    {post.image && (
                      <div className="rounded-xl overflow-hidden max-h-56 bg-gray-100 border border-gray-100 flex items-center justify-center">
                        <img 
                          src={post.image} 
                          alt="Post media" 
                          className="w-full h-full object-cover max-h-56"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          unarchivePost(post.id);
                        }}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RotateCcw size={14} />
                        <span>إلغاء الأرشفة</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا المنشور نهائياً من الأرشيف؟')) {
                              deletePost(post.id);
                              showToast('🗑️ تم حذف المنشور نهائياً');
                            }
                          }}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                          <span>حذف نهائي</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 2. أرشيف القصص */}
          {activeTab === 'stories' && (
            <div className="space-y-3">
              {myArchivedStories.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                    <Sparkles size={30} />
                  </div>
                  <h4 className="font-black text-gray-800 text-base mb-1">لا توجد قصص في الأرشيف</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                    القصص التي تقوم بحفظها في الأرشيف أو تنتهي صلاحيتها المحفوظة تظهر هنا دائماً، ويمكنك إعادة نشرها في أي وقت.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {myArchivedStories.map((story, sIdx) => (
                    <div 
                      key={story.id ? `arch-story-${story.id}-${sIdx}` : `arch-story-${sIdx}`}
                      className="bg-white rounded-2xl border border-gray-200/90 p-3.5 hover:shadow-md transition-all flex flex-col justify-between gap-3"
                    >
                      <div className="relative rounded-xl overflow-hidden bg-gray-950 aspect-4/5 flex items-center justify-center border border-gray-100">
                        {story.image ? (
                          <img 
                            src={story.image} 
                            alt="Story" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="p-4 text-center text-white font-bold text-xs">
                            {story.text || 'قصة نصية'}
                          </div>
                        )}

                        <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
                          <Clock size={10} />
                          <span>{formatDate(story.time)}</span>
                        </div>

                        {story.music && (
                          <div className="absolute bottom-2 right-2 left-2 bg-black/70 text-white text-[10px] font-medium px-2 py-1 rounded-md backdrop-blur-xs flex items-center gap-1.5 truncate">
                            <Music size={11} className="text-emerald-400 shrink-0" />
                            <span className="truncate">{story.songTitle || 'موسيقى مضافة'}</span>
                          </div>
                        )}
                      </div>

                      {/* Story Text / Info */}
                      {story.text && (
                        <p className="text-xs text-gray-800 font-bold line-clamp-2">
                          {story.text}
                        </p>
                      )}

                      {/* Story Action Buttons */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
                        <button
                          onClick={() => unarchiveStory(story.id)}
                          className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-black text-xs rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Share2 size={13} />
                          <span>إعادة نشر لقصتي</span>
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm('هل تريد حذف هذه القصة من الأرشيف نهائياً؟')) {
                              deleteStory(story.id);
                              showToast('🗑️ تم حذف القصة من الأرشيف');
                            }
                          }}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs transition-colors cursor-pointer"
                          title="حذف من الأرشيف"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer info */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-500 font-medium">
          <AlertCircle size={15} className="text-blue-600" />
          <span>أرشيفك مشفر وآمن ولا يستطيع أحد غيرك مشاهدته</span>
        </div>
      </div>
    </motion.div>
  );
}
