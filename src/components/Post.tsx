import { compressImage, validateImageFile } from '../utils/imageUtils';
import { formatRelativeTime } from '../utils/timeUtils';
import React, { useState, useRef } from 'react';
import { ThumbsUp, MessageSquare, Share2, Image as ImageIcon, MoreHorizontal, Globe, Send, Trash2, X, Edit2, Music, CornerDownRight, Heart, Copy, Check, Bookmark, ShieldAlert, Archive, Sparkles, ChevronRight, ShieldCheck } from 'lucide-react';
import { PostType, ReactionType, User } from '../types';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmModal from './ConfirmModal';
import AiImagePickerModal from './AiImagePickerModal';

const REACTION_EMOJIS: Record<ReactionType, { emoji: string, label: string, color: string }> = {
  like: { emoji: '👍', label: 'أعجبني', color: 'text-[#8b5cf6]' },
  love: { emoji: '❤️', label: 'أحببته', color: 'text-red-500' },
  haha: { emoji: '😆', label: 'أضحكني', color: 'text-amber-500' },
  wow: { emoji: '😮', label: 'أدهشني', color: 'text-amber-500' },
  sad: { emoji: '😢', label: 'أحزنني', color: 'text-amber-500' },
  angry: { emoji: '😡', label: 'أغضبني', color: 'text-orange-600' },
};

interface PostProps {
  post: PostType;
  key?: string | number;
}

export default function Post({ post }: PostProps) {
  const { users, currentUser, handleReaction, addComment, deleteComment, deletePost, editPost, archivePost, removeMediaFromPost, setCurrentView, savePost, blockUser, reportUser, reportContent, loadingStates, showToast, unrestrictKeyboard } = useAppContext();
  const [showComments, setShowComments] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [commentImage, setCommentImage] = useState<string | null>(null);
  const [showAiCommentModal, setShowAiCommentModal] = useState<boolean>(false);
  const commentImageInputRef = useRef<HTMLInputElement>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string, name: string } | null>(null);
  const [commentLikes, setCommentLikes] = useState<Record<string, { liked: boolean, count: number }>>({});
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showReactorsModal, setShowReactorsModal] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isDeletingComment, setIsDeletingComment] = useState<string | null>(null);

  // Long press timer for reaction picker
  const reactionLongPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isReactionLongPressRef = useRef(false);

  const startReactionPress = () => {
    isReactionLongPressRef.current = false;
    if (reactionLongPressTimerRef.current) {
      clearTimeout(reactionLongPressTimerRef.current);
    }
    reactionLongPressTimerRef.current = setTimeout(() => {
      isReactionLongPressRef.current = true;
      setShowReactionPicker(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(35);
        } catch {}
      }
    }, 400);
  };

  const endReactionPress = () => {
    if (reactionLongPressTimerRef.current) {
      clearTimeout(reactionLongPressTimerRef.current);
      reactionLongPressTimerRef.current = null;
    }
  };
  
  // Modal states
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    type: 'post' | 'comment';
    contentId: string;
    authorId: string;
  }>({ isOpen: false, type: 'post', contentId: '', authorId: '' });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const openConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const openReportModal = (type: 'post' | 'comment', contentId: string, authorId: string) => {
    setReportModal({
      isOpen: true,
      type,
      contentId,
      authorId
    });
  };

  const author = users.find(u => u.id === post.authorId) || (post.authorId === 'ai-bot' ? {
    id: 'ai-bot',
    uid: 'ai-bot',
    name: (typeof window !== 'undefined' && localStorage.getItem('own_ai_name')) || 'OWN AI',
    avatar: (typeof window !== 'undefined' && localStorage.getItem('own_ai_avatar')) || 'https://ui-avatars.com/api/?name=OWN+AI&background=6366f1&color=fff',
    status: 'active',
    role: 'ai',
    friends: [],
    friendRequests: [],
    savedBy: [],
    reports: [],
    photoHistory: [],
    cover: (typeof window !== 'undefined' && localStorage.getItem('own_ai_cover')) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    bio: (typeof window !== 'undefined' && localStorage.getItem('own_ai_bio')) || 'مساعدك الذكي OWN AI'
  } as User : undefined);
  const safeReactions = post.reactions || {};
  const userReaction = currentUser ? safeReactions[currentUser.id] : null;
  const isSaved = currentUser && post.savedBy?.includes(currentUser.id);
  const reactionKeys = Object.keys(safeReactions);
  const reactionCount = reactionKeys.length;
  const reactionCounts = Object.values(safeReactions).reduce((acc, rType) => {
    acc[rType] = (acc[rType] || 0) + 1;
    return acc;
  }, {} as Record<ReactionType, number>);

  if (!author || !currentUser) return null;
  // If author is locked, suspended, or disabled, do not show post to other users
  if (author.id !== currentUser.id && author.status !== 'active') return null;

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim() || commentImage) {
      await addComment(post.id, commentText.trim(), commentImage || undefined);
      setCommentText('');
      setCommentImage(null);
    }
  };
  
  const handleCommentImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateImageFile(file, 25);
      if (!validation.valid) {
        showToast(validation.error || 'الملف المختار غير صالح.');
        e.target.value = '';
        return;
      }
      try {
        const compressed = await compressImage(file, 600, 600, 0.72);
        setCommentImage(compressed);
      } catch (err) {
        console.warn("Comment image compression warning", err);
        showToast('تعذر معالجة صورة التعليق.');
      }
    }
    e.target.value = '';
  };

  const handleDeleteComment = async (commentId: string) => {
    openConfirm(
      'حذف التعليق',
      'هل أنت متأكد من حذف هذا التعليق؟',
      async () => {
        setIsDeletingComment(commentId);
        await deleteComment(post.id, commentId);
        setIsDeletingComment(null);
      }
    );
  };

  const handleEditSubmit = async () => {
    if (editContent.trim() && editContent !== post.content) {
      await editPost(post.id, editContent.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className="bg-white/90 mb-4 shadow-md md:rounded-2xl overflow-visible relative border border-white/80 transition-shadow hover:shadow-lg">
      {/* Post Header */}
      <div className="p-4 flex justify-between items-start relative">
        <div className="flex gap-2 items-center cursor-pointer" onClick={() => setCurrentView('profile', author.id)}>
          <img
            src={author.avatar}
            alt={author.name}
            className="w-10 h-10 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div>
            <h3 className="font-bold text-gray-900 text-[15px] hover:underline flex items-center gap-1">
              {author.name}
              {(author.id === 'ai-bot' || author.name === 'OWN AI') && (
                <span className="bg-[#8b5cf6] text-white rounded-full w-3.5 h-3.5 inline-flex items-center justify-center text-[9px] font-bold shrink-0" title="موثق">✓</span>
              )}
            </h3>
            <div className="flex items-center gap-1 text-gray-500 text-xs">
              <span>{formatRelativeTime(post.time)}</span>
              <span>•</span>
              <Globe size={12} />
            </div>
          </div>
        </div>
        <div className="flex gap-2 relative">
          <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={() => setShowOptions(!showOptions)}
            className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <MoreHorizontal size={20} />
          </motion.button>
          
          <AnimatePresence>
            {showOptions && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10"
              >
                {(currentUser.id === post.authorId || currentUser.email === 'bda43535@gmail.com') && (
                  <>
                    {currentUser.id === post.authorId && (
                      <>
                        <button 
                          onClick={() => { setIsEditing(true); setShowOptions(false); }}
                          className="w-full text-right px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Edit2 size={16} /> تعديل المنشور
                        </button>
                        <button 
                          onClick={() => {
                            archivePost(post.id);
                            setShowOptions(false);
                          }}
                          className="w-full text-right px-4 py-2 text-sm hover:bg-blue-50 text-blue-600 flex items-center gap-2 cursor-pointer font-bold"
                        >
                          <Archive size={16} /> نقل إلى الأرشيف
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => {
                        deletePost(post.id);
                        setShowOptions(false);
                        showToast('تم حذف المنشور بنجاح');
                      }}
                      className="w-full text-right px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer"
                    >
                      <Trash2 size={16} /> حذف المنشور {currentUser.email === 'bda43535@gmail.com' && currentUser.id !== post.authorId && '(إدارة)'}
                    </button>
                  </>
                )}
                {currentUser.id !== post.authorId && (
                  <>
                    <button 
                      onClick={() => { savePost(post.id); setShowOptions(false); }}
                      className="w-full text-right px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                      {isSaved ? 'إلغاء الحفظ' : 'حفظ المنشور'}
                    </button>
                    <button 
                      onClick={() => {
                        openConfirm(
                          'حظر المستخدم',
                          'هل أنت متأكد من حظر هذا المستخدم؟ لن يتمكن من رؤية منشوراتك أو مراسلتك.',
                          () => blockUser(post.authorId)
                        );
                        setShowOptions(false);
                      }}
                      className="w-full text-right px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                      حظر المستخدم
                    </button>
                    <button 
                      onClick={() => {
                        openReportModal('post', post.id, post.authorId);
                        setShowOptions(false);
                      }}
                      className="w-full text-right px-4 py-2 text-sm hover:bg-orange-50 text-orange-600 flex items-center gap-2"
                    >
                      <ShieldAlert size={16} />
                      إبلاغ عن المنشور
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-3 pb-2 text-[15px] text-gray-800 whitespace-pre-wrap">
        {isEditing ? (
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-md p-2 outline-none focus:border-blue-500 min-h-[100px] resize-y mb-2"
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => { setIsEditing(false); setEditContent(post.content); }}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
              >
                إلغاء
              </button>
              <button 
                onClick={handleEditSubmit}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                حفظ التعديلات
              </button>
            </div>
          </div>
        ) : (
          post.content
        )}
      </div>

      {/* Post Image/Video/Music */}
      {post.image && (
        <div className="w-full relative group">
          <img
            src={post.image}
            alt="Post content"
            className="w-full h-auto max-h-[500px] object-cover"
            referrerPolicy="no-referrer"
          />
          {isEditing && (
            <div className="absolute top-2 right-2">
              <button
                onClick={() => {
                  openConfirm(
                    'حذف الصورة',
                    'هل أنت متأكد من حذف هذه الصورة؟',
                    () => removeMediaFromPost(post.id, 'image')
                  );
                }}
                className="bg-red-500 text-white p-2 rounded-full shadow-md hover:bg-red-600 transition-colors"
                title="حذف الصورة"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      )}
      {post.video && (
        <div className="w-full bg-black relative group">
          <video
            src={post.video}
            controls
            playsInline
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.dataset.fallback) {
                target.dataset.fallback = 'true';
                target.src = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
              }
            }}
            className="w-full h-auto max-h-[500px] object-contain"
          />
          {isEditing && (
            <div className="absolute top-2 right-2 z-10">
              <button
                onClick={() => {
                  openConfirm(
                    'حذف الفيديو',
                    'هل أنت متأكد من حذف هذا الفيديو؟',
                    () => removeMediaFromPost(post.id, 'video')
                  );
                }}
                className="bg-red-500 text-white p-2 rounded-full shadow-md hover:bg-red-600 transition-colors"
                title="حذف الفيديو"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      )}
      {post.music && (
        <div className="w-full px-3 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-y border-blue-100 flex flex-col items-center justify-center relative group">
          <div className="flex items-center gap-3 mb-3 text-blue-600">
            <Music size={24} className="animate-pulse" />
            <span className="font-medium text-sm">مقطع صوتي</span>
          </div>
          <audio src={post.music} controls className="w-full max-w-md" />
          {isEditing && (
            <div className="absolute top-2 right-2">
              <button
                onClick={() => {
                  openConfirm(
                    'حذف المقطع الصوتي',
                    'هل أنت متأكد من حذف هذا المقطع الصوتي؟',
                    () => removeMediaFromPost(post.id, 'music')
                  );
                }}
                className="bg-red-500 text-white p-2 rounded-full shadow-md hover:bg-red-600 transition-colors"
                title="حذف المقطع الصوتي"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Post Stats */}
      <div className="px-3 py-2 flex justify-between items-center text-gray-500 text-xs sm:text-sm border-b border-gray-150 bg-gray-50/50">
        <div 
          className="flex items-center gap-1.5 cursor-pointer hover:underline"
          onClick={() => reactionCount > 0 && setShowReactorsModal(true)}
        >
          {reactionCount > 0 ? (
            <div className="flex items-center gap-1">
              <div className="flex -space-x-1 space-x-reverse items-center">
                {Object.keys(reactionCounts).slice(0, 3).map((rType, rIdx) => (
                  <span key={`reaction-pill-${rType}-${rIdx}`} className="text-sm z-10 drop-shadow-2xs">
                    {REACTION_EMOJIS[rType as ReactionType].emoji}
                  </span>
                ))}
              </div>
              <span className="font-extrabold text-gray-700 text-xs">{reactionCount}</span>
            </div>
          ) : (
            <span className="text-xs font-semibold text-gray-400">كن أول من يعجب بهذا</span>
          )}
        </div>
        <div className="flex gap-3 cursor-pointer text-gray-600 font-bold text-xs" onClick={() => setShowComments(!showComments)}>
          <span className="hover:underline">{post.comments.length} تعليق</span>
          <span className="hover:underline">مشاركة</span>
        </div>
      </div>

      {/* Post Actions (Facebook Lite Style) */}
      <div className="px-1 py-1 flex justify-between relative bg-white border-b border-gray-100">
        <div 
          className="flex-1 relative"
          onMouseEnter={() => setShowReactionPicker(true)}
          onMouseLeave={() => {
            endReactionPress();
            setShowReactionPicker(false);
          }}
        >
          <AnimatePresence>
            {showReactionPicker && (
              <>
                {/* Invisible backdrop to dismiss reaction picker when clicking/touching outside */}
                <div 
                  className="fixed inset-0 z-20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowReactionPicker(false);
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    setShowReactionPicker(false);
                  }}
                />
                <motion.div 
                  initial={{ opacity: 0, y: 8, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.8 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 350 }}
                  className="absolute bottom-full mb-2.5 right-0 bg-white shadow-2xl rounded-full px-2.5 py-1.5 flex items-center gap-1 sm:gap-2 border border-gray-200 z-30 select-none"
                  onClick={(e) => e.stopPropagation()}
                >
                  {Object.entries(REACTION_EMOJIS).map(([type, { emoji, label }]) => (
                    <motion.button
                      key={`post-react-btn-${post.id}-${type}`}
                      whileHover={{ scale: 1.35, originY: 1 }}
                      whileTap={{ scale: 0.85 }}
                      title={label}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReaction(post.id, type as ReactionType);
                        setShowReactionPicker(false);
                      }}
                      className="text-2xl hover:bg-blue-50 rounded-full p-1 transition-transform cursor-pointer"
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onMouseDown={startReactionPress}
            onMouseUp={endReactionPress}
            onMouseLeave={endReactionPress}
            onTouchStart={startReactionPress}
            onTouchEnd={endReactionPress}
            onTouchMove={endReactionPress}
            onContextMenu={(e) => {
              if (isReactionLongPressRef.current) {
                e.preventDefault();
              }
            }}
            onClick={() => {
              if (isReactionLongPressRef.current) {
                isReactionLongPressRef.current = false;
                return;
              }
              handleReaction(post.id, userReaction ? userReaction : 'like');
            }}
            disabled={loadingStates.reacting}
            className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors hover:bg-gray-100 cursor-pointer select-none ${userReaction ? REACTION_EMOJIS[userReaction].color : 'text-gray-600'} ${loadingStates.reacting ? 'opacity-50 cursor-wait' : ''}`}
          >
            {loadingStates.reacting ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : userReaction ? (
              <span className="text-lg leading-none">{REACTION_EMOJIS[userReaction].emoji}</span>
            ) : (
              <ThumbsUp size={18} />
            )}
            <span className="font-extrabold text-xs sm:text-sm">{userReaction ? REACTION_EMOJIS[userReaction].label : 'أعجبني'}</span>
          </motion.button>
        </div>

        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors hover:bg-gray-100 text-gray-600 cursor-pointer"
        >
          <MessageSquare size={18} />
          <span className="font-extrabold text-xs sm:text-sm">تعليق</span>
        </motion.button>

        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowShareModal(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors hover:bg-gray-100 text-gray-600 cursor-pointer"
        >
          <Share2 size={18} />
          <span className="font-extrabold text-xs sm:text-sm">مشاركة</span>
        </motion.button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="px-3 pb-3 pt-2 bg-gray-50/60 border-t border-gray-150"
        >
          {/* Replying banner */}
          {replyingTo && (
            <div className="flex items-center justify-between bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 text-xs font-bold text-blue-800 mb-2">
              <span className="flex items-center gap-1">
                <CornerDownRight size={14} className="text-[#1877f2]" />
                جاري الرد على: <b>{replyingTo.name}</b>
              </span>
              <button 
                onClick={() => {
                  setReplyingTo(null);
                  setCommentText('');
                }}
                className="text-gray-500 hover:text-red-500 p-0.5 rounded-full"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {currentUser?.isKeyboardBanned ? (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 mb-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-rose-800 font-bold">
                <ShieldAlert size={16} className="shrink-0 text-rose-600" />
                <span>الكيبورد وكتابة التعليقات محظورة لمخالفة معايير الصورة.</span>
              </div>
              <button
                type="button"
                onClick={() => unrestrictKeyboard()}
                className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-lg text-[11px] font-black shrink-0 cursor-pointer shadow-xs transition-all"
              >
                فك الحظر (OWN)
              </button>
            </div>
          ) : (
            <form onSubmit={handleCommentSubmit} className="flex flex-col gap-2 mb-3">
              <div className="flex gap-2 items-center">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 relative flex items-center bg-white border border-gray-200 rounded-full shadow-2xs focus-within:border-blue-500 transition-colors">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={replyingTo ? `رد على ${replyingTo.name}...` : "اكتب تعليقاً..."}
                    className="flex-1 bg-transparent px-4 py-2 text-xs sm:text-sm outline-none"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={commentImageInputRef}
                    onChange={handleCommentImageUpload}
                  />
                  <button 
                    type="button"
                    onClick={() => commentImageInputRef.current?.click()}
                    className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer ml-0.5"
                    title="إرفاق صورة من الجهاز"
                  >
                    <ImageIcon size={18} />
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowAiCommentModal(true)}
                    className="p-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-full transition-colors cursor-pointer ml-1"
                    title="توليد أو رفع صورة بالذكاء الاصطناعي للتعليق (في أي مجال)"
                  >
                    <Sparkles size={17} />
                  </button>
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    type="submit" 
                    disabled={(!commentText.trim() && !commentImage) || loadingStates.addingComment}
                    className="p-1.5 mr-1 ml-2 text-[#1877f2] disabled:text-gray-300 cursor-pointer"
                  >
                    {loadingStates.addingComment ? (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send size={15} className="rotate-180" />
                    )}
                  </motion.button>
                </div>
              </div>
              
              {/* Comment image preview */}
              {commentImage && (
                <div className="mr-10 relative inline-block">
                  <img src={commentImage} alt="Comment preview" className="w-24 h-24 object-cover rounded-xl border border-gray-200" />
                  <button
                    type="button"
                    onClick={() => setCommentImage(null)}
                    className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1 hover:bg-gray-700 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </form>
          )}

          <div className="space-y-2.5">
            {post.comments.map((comment, cIdx) => {
              const commentAuthor = users.find(u => u.id === comment.authorId);
              if (!commentAuthor) return null;
              if (commentAuthor.id !== currentUser.id && commentAuthor.status !== 'active') return null;
              
              const isLiked = commentLikes[comment.id]?.liked || false;
              const likesCount = commentLikes[comment.id]?.count || 0;

              return (
                <div key={comment.id ? `comment-${comment.id}-${cIdx}` : `comment-idx-${cIdx}`} className="flex gap-2 group text-right dir-rtl">
                  <img
                    src={commentAuthor.avatar}
                    alt={commentAuthor.name}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover cursor-pointer shrink-0 mt-0.5 border border-gray-200"
                    onClick={() => setCurrentView('profile', commentAuthor.id)}
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1">
                    <div className="bg-white border border-gray-200 rounded-2xl px-3 py-2 inline-block max-w-[90%] shadow-2xs relative">
                      <h4 
                        className="font-black text-xs text-gray-900 cursor-pointer hover:underline"
                        onClick={() => setCurrentView('profile', commentAuthor.id)}
                      >
                        {commentAuthor.name}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-800 font-medium mt-0.5 whitespace-pre-wrap leading-relaxed">{comment.text}</p>
                      {comment.image && (
                        <div className="mt-2 rounded-xl overflow-hidden">
                          <img src={comment.image} alt="Comment image" className="max-w-[200px] max-h-[250px] object-contain rounded-xl border border-gray-100" />
                        </div>
                      )}
                      
                      {likesCount > 0 && (
                        <div className="absolute -bottom-2.5 left-2 bg-white border border-gray-200 rounded-full px-1.5 py-0.5 shadow-2xs flex items-center gap-0.5 text-[10px] text-gray-600 font-bold">
                          <span className="text-red-500">❤️</span>
                          <span>{likesCount}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500 font-extrabold px-2">
                      <button 
                        onClick={() => {
                          const current = commentLikes[comment.id] || { liked: false, count: 0 };
                          setCommentLikes({
                            ...commentLikes,
                            [comment.id]: {
                              liked: !current.liked,
                              count: current.liked ? current.count - 1 : current.count + 1
                            }
                          });
                        }}
                        className={`hover:text-[#1877f2] cursor-pointer ${isLiked ? 'text-[#1877f2] font-black' : ''}`}
                      >
                        {isLiked ? 'أعجبني ❤️' : 'أعجبني'}
                      </button>

                      <span>•</span>

                      <button 
                        onClick={() => {
                          setReplyingTo({ id: comment.id, name: commentAuthor.name });
                          setCommentText(`@${commentAuthor.name} `);
                        }}
                        className="hover:text-[#1877f2] cursor-pointer"
                      >
                        رد
                      </button>

                      <span>•</span>

                      <span>{comment.time}</span>

                      {comment.authorId !== currentUser?.id && (
                        <>
                          <span>•</span>
                          <button 
                            onClick={() => openReportModal('comment', comment.id, comment.authorId)}
                            className="hover:text-orange-500 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            إبلاغ
                          </button>
                        </>
                      )}

                      {comment.authorId === currentUser?.id && (
                        <>
                          <span>•</span>
                          <button 
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={isDeletingComment === comment.id || loadingStates.deletingComment}
                            className={`hover:text-red-500 flex items-center gap-1 cursor-pointer ${isDeletingComment === comment.id ? 'opacity-50 cursor-wait' : ''}`}
                          >
                            {isDeletingComment === comment.id ? 'جاري الحذف...' : 'حذف'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Share Modal (Facebook Lite Style) */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 dir-rtl text-right overflow-hidden space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-[#1877f2] flex items-center justify-center font-bold">
                    <Share2 size={16} />
                  </div>
                  <h3 className="font-black text-gray-900 text-base">مشاركة المنشور</h3>
                </div>
                <button onClick={() => setShowShareModal(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2">
                <button 
                  onClick={() => {
                    setShowShareModal(false);
                    showToast('تمت مشاركة المنشور على يومياتك بنجاح 🚀');
                  }}
                  className="w-full p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-[#1877f2] font-black text-xs sm:text-sm flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Globe size={18} />
                    مشاركة الآن (على اليوميات)
                  </span>
                  <span className="text-[10px] bg-blue-200/60 px-2 py-0.5 rounded-md">عقيدة عامة</span>
                </button>

                <button 
                  onClick={() => {
                    setShowShareModal(false);
                    setCurrentView('messages');
                    showToast('اختر صديقاً لإرسال المنشور إليه عبر الماسنجر');
                  }}
                  className="w-full p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold text-xs sm:text-sm flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <MessageSquare size={18} className="text-blue-600" />
                    إرسال في رسالة (ماسنجر)
                  </span>
                </button>

                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}#post-${post.id}`);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                    showToast('تم نسخ رابط المنشور إلى الحافظة');
                  }}
                  className="w-full p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold text-xs sm:text-sm flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    {copiedLink ? <Check size={18} className="text-green-600" /> : <Copy size={18} className="text-gray-600" />}
                    {copiedLink ? 'تم نسخ الرابط!' : 'نسخ رابط المنشور'}
                  </span>
                </button>
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => setShowShareModal(false)}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Reactors Modal */}
      <AnimatePresence>
        {showReactorsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-lg">التفاعلات</h3>
                <button onClick={() => setShowReactorsModal(false)} className="p-1.5 hover:bg-gray-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="overflow-y-auto p-2 flex-1">
                {Object.entries(REACTION_EMOJIS).map(([rType, { emoji }]) => {
                  const reactors = reactionKeys.filter(userId => (post.reactions || {})[userId] === rType);
                  if (reactors.length === 0) return null;
                  return (
                    <div key={rType} className="mb-4">
                      <h4 className="font-bold text-sm text-gray-500 mb-2 flex items-center gap-2">
                        {emoji} {reactors.length}
                      </h4>
                      {reactors.map((userId, uIdx) => {
                        const u = users.find(user => user.id === userId);
                        if (!u) return null;
                        return (
                          <div key={`reactor-${rType}-${userId}-${uIdx}`} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                            <div 
                              className="flex items-center gap-3 cursor-pointer" 
                              onClick={() => { 
                                setShowReactorsModal(false); 
                                setCurrentView('profile', u.id); 
                              }}
                            >
                              <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                              <span className="font-bold text-[15px] hover:underline">{u.name}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* FULL INTERFACE: REPORT CONTENT (واجهة الإبلاغ عن مخالفة) */}
      <AnimatePresence>
        {reportModal.isOpen && (
          <div className="fixed inset-0 z-[170] bg-gray-100 overflow-y-auto dir-rtl text-right">
            <div className="max-w-2xl mx-auto min-h-screen bg-white shadow-xl flex flex-col">
              {/* Interface Header */}
              <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-3.5 flex items-center justify-between">
                <button 
                  type="button"
                  onClick={() => setReportModal({ ...reportModal, isOpen: false })}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-950 p-2 rounded-xl hover:bg-gray-100 cursor-pointer"
                >
                  <ChevronRight size={20} />
                  <span>العودة للمحتوى</span>
                </button>
                <div className="flex items-center gap-2 text-rose-600">
                  <ShieldAlert size={18} />
                  <h3 className="font-extrabold text-sm text-gray-900">واجهة الإبلاغ عن مخالفة</h3>
                </div>
                <div className="w-16" />
              </div>

              {/* Interface Content */}
              <div className="p-4 sm:p-6 space-y-5 flex-1">
                {/* Target Content Banner */}
                <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-100 shadow-xs">
                  <div className="flex items-center gap-2 text-rose-700 font-black text-sm mb-1">
                    <ShieldAlert size={18} />
                    <span>تقديم إبلاغ عن {reportModal.type === 'post' ? 'منشور مخالف' : 'تعليق مخالف'}</span>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">
                    يتم مراجعة كافة الإبلاغات وتدقيقها أمنياً. إذا وصل حساب الناشر إلى <span className="font-black text-rose-600">10 إبلاغات</span>، سيتم تعليق حسابه وإزالته تلقائياً لحماية المجتمع.
                  </p>
                </div>

                {/* AI Review Notice */}
                <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-2xl text-xs font-medium text-blue-950 space-y-1">
                  <div className="flex items-center gap-1.5 font-black text-blue-800">
                    <Sparkles size={16} />
                    <span>فحص الذكاء الاصطناعي الأمني الصارم</span>
                  </div>
                  <p className="text-blue-900/90 leading-relaxed">
                    يتم التحقق من البلاغ آلياً لضمان عدم وجود بلاغات كيدية ولاتخاذ إجراءات فورية بحق الحسابات المنتهكة.
                  </p>
                </div>

                {/* Reason Selection */}
                <div className="space-y-2">
                  <p className="text-xs font-black text-gray-800">اختر سبب الإبلاغ بدقة:</p>
                  <div className="space-y-2">
                    {[
                      { title: 'عُري أو نشاط جنسي', desc: 'محتوى مخل بالآداب أو مواد غير لائقة' },
                      { title: 'مضايقة أو تنمر', desc: 'استهداف شخص بالإساءة أو الترهيب' },
                      { title: 'عنف أو محتوى يحض على الكراهية', desc: 'الترويج للعنف أو التهديد أو التمييز العنصري' },
                      { title: 'استغلال جنسي للأطفال', desc: 'انتهاك صارم لسلامة القاصرين' },
                      { title: 'محتوى مزعج (سبام)', desc: 'روابط خبيثة أو إعلانات مضللة أو احتيال' },
                      { title: 'معلومات كاذبة', desc: 'تضليل أو أخبار زائفة تؤثر على السلامة' }
                    ].map(({ title, desc }, rIdx) => (
                      <button
                        key={`post-report-btn-${title}-${rIdx}`}
                        onClick={() => {
                          reportContent(reportModal.authorId, reportModal.contentId, reportModal.type, title);
                          setReportModal({ ...reportModal, isOpen: false });
                          showToast('تم إرسال إبلاغك بنجاح للمراجعة الفورية');
                        }}
                        className="w-full text-right p-3.5 rounded-2xl border border-gray-200 hover:border-rose-300 hover:bg-rose-50/50 transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <p className="font-black text-xs text-gray-900 group-hover:text-rose-700">{title}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">{desc}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-rose-100 text-gray-400 group-hover:text-rose-600 flex items-center justify-center transition-colors shrink-0 mr-2">
                          <ChevronRight size={16} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Image Uploader & Generator Modal for Comments */}
      <AiImagePickerModal
        isOpen={showAiCommentModal}
        onClose={() => setShowAiCommentModal(false)}
        context="comment"
        postContent={commentText || post.content}
        title="رفع وتوليد صورة بالذكاء الاصطناعي للتعليق 💬🎨"
        subtitle="ولّد صورة أو ملصقاً ذكياً لأي مجال يناسب تعليقك، أو ارفع صورتك الخاصة مع تدقيق الذكاء الاصطناعي."
        onSelectImage={(url, titleStr) => {
          setCommentImage(url);
          if (!commentText.trim() && titleStr) {
            setCommentText(titleStr);
          }
        }}
      />
    </div>
  );
}
