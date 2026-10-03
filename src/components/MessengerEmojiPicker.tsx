import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Smile, Heart, ThumbsUp, Sparkles, Flame, X } from 'lucide-react';

interface MessengerEmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES = [
  {
    id: 'popular',
    name: 'شائع',
    icon: ThumbsUp,
    emojis: ['👍', '❤️', '😂', '🔥', '🥰', '😍', '👏', '🎉', '😮', '😢', '😡', '💯', '🙏', '✨', '🤍', '💙']
  },
  {
    id: 'smileys',
    name: 'الوجوه',
    icon: Smile,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇',
      '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑',
      '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬',
      '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵'
    ]
  },
  {
    id: 'gestures',
    name: 'الإيماءات',
    icon: ThumbsUp,
    emojis: [
      '👍', '👎', '👌', '🤌', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆',
      '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '💪', '🦾', '🖕', '✍️', '🙏'
    ]
  },
  {
    id: 'love',
    name: 'المشاعر',
    icon: Heart,
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹',
      '💖', '💗', '💓', '💞', '💕', '💌', '💘', '💝', '💟', '💋', '👥', '🫂'
    ]
  },
  {
    id: 'special',
    name: 'احتفال',
    icon: Sparkles,
    emojis: [
      '🔥', '✨', '⭐', '🌟', '💥', '💯', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇',
      '☕', '🍕', '⚽', '🚀', '👑', '⚡', '🌙', '🪄', '💡', '💎', '🌹', '🌸'
    ]
  }
];

export const MessengerEmojiPicker: React.FC<MessengerEmojiPickerProps> = ({
  onSelectEmoji,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('popular');

  const currentCategory = EMOJI_CATEGORIES.find(c => c.id === activeTab) || EMOJI_CATEGORIES[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute bottom-16 right-4 z-40 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-2xl rounded-3xl w-72 sm:w-80 overflow-hidden dir-rtl"
    >
      {/* Header with tabs */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-1">
          {EMOJI_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                    : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
                title={cat.name}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
        >
          <X size={16} />
        </button>
      </div>

      {/* Category Name */}
      <div className="px-3 pt-2 text-[11px] font-bold text-gray-400 dark:text-gray-500">
        {currentCategory.name}
      </div>

      {/* Grid of emojis */}
      <div className="p-3 grid grid-cols-6 sm:grid-cols-7 gap-2 max-h-52 overflow-y-auto scrollbar-thin">
        {currentCategory.emojis.map((emoji, idx) => (
          <button
            key={`emoji-grid-${currentCategory.id}-${emoji}-${idx}`}
            onClick={() => onSelectEmoji(emoji)}
            className="w-9 h-9 flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-transform hover:scale-125 cursor-pointer active:scale-95"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Quick Like Action bar */}
      <div className="p-2 bg-gray-50 dark:bg-slate-800/60 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs text-gray-500 px-3">
        <span className="text-[11px] font-medium">انقر للإدراج السريع</span>
        <button
          onClick={() => onSelectEmoji('👍')}
          className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold hover:underline"
        >
          <ThumbsUp size={13} />
          <span>إعجاب سريع</span>
        </button>
      </div>
    </motion.div>
  );
};
