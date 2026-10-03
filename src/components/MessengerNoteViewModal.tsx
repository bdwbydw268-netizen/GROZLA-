import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Pause, Music, Send, Clock, Sparkles } from 'lucide-react';
import { Song } from '../constants/music';

interface MessengerNoteViewModalProps {
  user: {
    id: string;
    name: string;
    avatar: string;
    userNote?: {
      text?: string;
      music?: Song | null;
      updatedAt: string;
    };
  } | null;
  onClose: () => void;
  onSendReply: (recipientId: string, replyText: string) => void;
  onOpenChat: (userId: string) => void;
  remainingTimeText?: string;
}

export const MessengerNoteViewModal: React.FC<MessengerNoteViewModalProps> = ({
  user,
  onClose,
  onSendReply,
  onOpenChat,
  remainingTimeText
}) => {
  const [replyText, setReplyText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!user || !user.userNote) return null;

  const noteMusic = user.userNote.music;
  const noteText = user.userNote.text;

  const togglePlay = () => {
    if (!noteMusic?.url) return;
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(noteMusic.url);
        audioRef.current.onended = () => setIsPlaying(false);
      }
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    onClose();
  };

  const handleSend = () => {
    if (!replyText.trim()) return;
    onSendReply(user.id, `رد على ملاحظتك (${noteText || noteMusic?.title}): ${replyText.trim()}`);
    setReplyText('');
    handleClose();
    onOpenChat(user.id);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-gray-100 dark:border-slate-800 space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-blue-600 dark:text-blue-400" />
              <h3 className="font-black text-sm text-gray-900 dark:text-white">ملاحظة مسنجر</h3>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={18} />
            </button>
          </div>

          {/* User info & Avatar with Note Bubble */}
          <div className="flex flex-col items-center text-center space-y-3 pt-2">
            <div className="relative">
              {/* Note Speech Bubble */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black px-3.5 py-1.5 rounded-2xl shadow-md max-w-[220px] mb-2 mx-auto">
                {noteText || '🎵 يشارك موسيقى في ملاحظته'}
              </div>
              <img
                src={user.avatar}
                alt={user.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-slate-800 ring-2 ring-blue-500 shadow-md mx-auto"
                referrerPolicy="no-referrer"
              />
            </div>

            <div>
              <h4 className="font-black text-base text-gray-900 dark:text-white">{user.name}</h4>
              {remainingTimeText && (
                <p className="text-[11px] font-bold text-gray-500 flex items-center justify-center gap-1 mt-0.5">
                  <Clock size={12} />
                  <span>تختفي بعد {remainingTimeText}</span>
                </p>
              )}
            </div>
          </div>

          {/* Music track if available */}
          {noteMusic && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800/80 border border-blue-100 dark:border-slate-700">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md shrink-0 cursor-pointer transition-transform active:scale-95"
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} className="translate-x-0.5" />}
                </button>
                <div className="min-w-0 text-right">
                  <p className="text-xs font-black text-gray-900 dark:text-white truncate">{noteMusic.title}</p>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 font-bold truncate">{noteMusic.artist}</p>
                </div>
              </div>

              {/* Equalizer animation when playing */}
              {isPlaying && (
                <div className="flex items-center gap-1 h-5 shrink-0">
                  <span className="w-1 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s] h-full" />
                  <span className="w-1 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s] h-3/4" />
                  <span className="w-1 bg-purple-600 rounded-full animate-bounce h-full" />
                </div>
              )}
            </div>
          )}

          {/* Reply input */}
          <div className="pt-2">
            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5">
              إرسال رد سريع على الملاحظة
            </label>
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 rounded-2xl px-3 py-2 border border-gray-200 dark:border-slate-700 focus-within:border-blue-500">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={`أرسل رسالة إلى ${user.name.split(' ')[0]}...`}
                className="flex-1 bg-transparent text-xs font-bold text-gray-900 dark:text-white outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!replyText.trim()}
                className="p-1.5 rounded-full bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-700 transition-colors cursor-pointer shrink-0"
              >
                <Send size={14} className="rtl:-scale-x-100" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
