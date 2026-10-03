import { compressImage, validateImageFile } from '../utils/imageUtils';
import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { isUserOnline } from '../utils/userHelpers';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, Send, Users, Plus, X, Image as ImageIcon, 
  Mic, MicOff, Phone, Video, PhoneOff, Smile, Reply, Trash2, 
  Palette, Search, Volume2, VolumeX, Sparkles, Edit3, Check, CheckCheck,
  Play, Pause, Heart, ThumbsUp, Laugh, AlertCircle, MessageCircle, ChevronLeft, Settings, CheckCircle2,
  Clock, Inbox, Info, Shield, Bell, ShieldAlert, Music, Power, PowerOff,
  Pin, PinOff, Camera, Flame, Zap, Paperclip
} from 'lucide-react';
import GroupSettingsModal from './GroupSettingsModal';
import StoryMusicSelector from './StoryMusicSelector';
import { MessengerImageViewer } from './MessengerImageViewer';
import { MessengerEmojiPicker } from './MessengerEmojiPicker';
import { MessengerNoteViewModal } from './MessengerNoteViewModal';
import { Song } from '../constants/music';

export default function Messages() {
  const { 
    users, groups, currentUser, messages, stories, sendMessage, reactToMessage, 
    deleteMessage, updateUserNote, createGroup, updateGroupSettings, setCurrentView, loadingStates, 
    activeChat, setActiveChat, unrestrictKeyboard, blockUser, showToast, updateProfile
  } = useAppContext();

  const [showGroupSettings, setShowGroupSettings] = useState(false);

  // Primary Controls & States
  const [newMessage, setNewMessage] = useState('');
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'groups' | 'online' | 'ai'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Pinned Chats (saved to localStorage)
  const [pinnedChatIds, setPinnedChatIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`pinned_chats_${currentUser?.id || 'guest'}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const togglePinChat = (chatId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPinnedChatIds(prev => {
      const next = prev.includes(chatId) ? prev.filter(id => id !== chatId) : [...prev, chatId];
      try {
        localStorage.setItem(`pinned_chats_${currentUser?.id || 'guest'}`, JSON.stringify(next));
      } catch (err) {}
      showToast(prev.includes(chatId) ? 'تم إلغاء تثبيت المحادثة' : 'تم تثبيت المحادثة في الأعلى 📌');
      return next;
    });
  };

  // Custom Quick Emoji per Chat (default '👍')
  const [chatQuickEmojis, setChatQuickEmojis] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(`chat_emojis_${currentUser?.id || 'guest'}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const setChatQuickEmoji = (chatId: string, emoji: string) => {
    setChatQuickEmojis(prev => {
      const next = { ...prev, [chatId]: emoji };
      try {
        localStorage.setItem(`chat_emojis_${currentUser?.id || 'guest'}`, JSON.stringify(next));
      } catch (err) {}
      showToast(`تم تعيين التفاعل السريع ${emoji}`);
      return next;
    });
  };

  // Image Lightbox state
  const [viewingImage, setViewingImage] = useState<{ url: string; senderName?: string; timestamp?: string } | null>(null);

  // Friend Note View Modal state
  const [viewingFriendNote, setViewingFriendNote] = useState<{
    id: string;
    name: string;
    avatar: string;
    userNote?: {
      text?: string;
      music?: Song | null;
      updatedAt: string;
    };
    remainingTime?: string;
  } | null>(null);

  // Input Emoji Picker state
  const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false);

  // Default sample notes for realistic Messenger UI matching screenshot
  const sampleNotes: Record<string, string> = {
    'user-1': 'لي تبعث ولا يبعث ل...',
    'user-2': 'شنو تاكيد الهوية هدي',
    'user-3': 'يخو معجبتك...',
    'user-4': 'حكايتي هيا راني مطنن'
  };

  // Notes Modal & 24-hour Expiration Lifecycle
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState(currentUser?.userNote?.text || '');
  const [selectedNoteMusic, setSelectedNoteMusic] = useState<Song | null>(currentUser?.userNote?.music as Song || null);
  const [showMusicPickerForNote, setShowMusicPickerForNote] = useState(false);
  const [playingNoteAudioUrl, setPlayingNoteAudioUrl] = useState<string | null>(null);
  const noteAudioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const togglePlayNoteMusic = (url: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (playingNoteAudioUrl === url) {
      if (noteAudioPlayerRef.current) {
        noteAudioPlayerRef.current.pause();
      }
      setPlayingNoteAudioUrl(null);
    } else {
      if (noteAudioPlayerRef.current) {
        noteAudioPlayerRef.current.pause();
      }
      const audio = new Audio(url);
      noteAudioPlayerRef.current = audio;
      audio.play().catch(() => {});
      setPlayingNoteAudioUrl(url);
      audio.onended = () => setPlayingNoteAudioUrl(null);
    }
  };

  useEffect(() => {
    return () => {
      if (noteAudioPlayerRef.current) {
        noteAudioPlayerRef.current.pause();
        noteAudioPlayerRef.current = null;
      }
    };
  }, []);

  // Helper: check if a note was created within the last 24 hours
  const isNoteValid = (note?: { text?: string; music?: any; updatedAt: string; expiresAt?: string } | null): boolean => {
    if (!note || (!note.text && !note.music) || !note.updatedAt) return false;
    const updatedTime = new Date(note.updatedAt).getTime();
    if (isNaN(updatedTime)) return false;
    const now = Date.now();
    const diffHours = (now - updatedTime) / (1000 * 60 * 60);
    return diffHours < 24 && diffHours >= 0;
  };

  // Helper: calculate remaining time from 24h note window
  const getNoteRemainingTime = (note?: { text?: string; music?: any; updatedAt: string; expiresAt?: string } | null): string => {
    if (!note || !note.updatedAt) return '';
    const updatedTime = new Date(note.updatedAt).getTime();
    if (isNaN(updatedTime)) return '';
    const now = Date.now();
    const remainingMs = (updatedTime + 24 * 60 * 60 * 1000) - now;
    if (remainingMs <= 0) return 'منتهية';
    const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    if (remainingHours > 0) {
      return `${remainingHours} س`;
    }
    return `${remainingMinutes} د`;
  };

  const getNoteFormattedTime = (dateStr?: string): string => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Group Modal
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  // Chat Settings ("بلية الإعدادات") Modal & State
  const [showChatSettingsModal, setShowChatSettingsModal] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [customNicknames, setCustomNicknames] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(`chat_nicknames_${currentUser?.id || 'guest'}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Chat Theme
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [chatTheme, setChatTheme] = useState<'classic' | 'neon' | 'emerald' | 'rose' | 'dark'>('classic');

  // Interactive Call Overlay State
  const [callState, setCallState] = useState<{
    isOpen: boolean;
    type: 'voice' | 'video';
    status: 'calling' | 'connected';
    duration: number;
    isMuted: boolean;
    isVideoOff: boolean;
  } | null>(null);

  // Reply & Emoji Reaction State
    const [longPressedMessageId, setLongPressedMessageId] = useState<string | null>(null);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  const handlePressStart = (msgId: string) => {
    pressTimer.current = setTimeout(() => {
      setLongPressedMessageId(msgId);
      if ('vibrate' in navigator) {
        try { navigator.vibrate(50); } catch(e) {}
      }
    }, 600);
  };

  const handlePressEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

const [replyTo, setReplyTo] = useState<{ id: string; text: string; senderName: string } | null>(null);
  const [activeEmojiMessageId, setActiveEmojiMessageId] = useState<string | null>(null);

  // Voice Note Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<any>(null);

  // Audio Playback State with progress & speed
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [audioSpeed, setAudioSpeed] = useState<number>(1);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const myGroups = currentUser ? groups.filter(g => g.members?.includes(currentUser.id)) : [];

  // Build a list of all active friends plus users we have previous message history with
  const chatPartnerIds = new Set<string>();
  
  // Add active friends
  (currentUser?.friends || []).forEach(fId => {
    const friendObj = users.find(u => u.id === fId);
    if (friendObj && friendObj.status === 'active' && !currentUser?.blockedUsers?.includes(fId)) {
      chatPartnerIds.add(fId);
    }
  });

  // Add past message partners (so users can view recent/past messages)
  if (currentUser) {
    messages.forEach(m => {
      if (m.senderId === currentUser.id && m.receiverId && !currentUser.blockedUsers?.includes(m.receiverId)) {
        chatPartnerIds.add(m.receiverId);
      }
      if (m.receiverId === currentUser.id && m.senderId && !currentUser.blockedUsers?.includes(m.senderId)) {
        chatPartnerIds.add(m.senderId);
      }
    });
  }
  
  const friends = users
    .filter(u => chatPartnerIds.has(u.id) && !currentUser?.blockedUsers?.includes(u.id))
    .map(u => {
      // Mask locked, disabled or suspended accounts that only exist in past message history
      if (u.status === 'locked' || u.status === 'suspended' || u.status === 'disabled') {
        return {
          ...u,
          name: 'غروزلا',
          avatar: 'https://ui-avatars.com/api/?name=GROZLA&background=e5e7eb&color=9ca3af',
          isUnavailable: true
        };
      }
      return u;
    });

  // Voice Recording Timer Effect
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTimer(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(recordingIntervalRef.current);
      setRecordingTimer(0);
    }
    return () => clearInterval(recordingIntervalRef.current);
  }, [isRecording]);

  // Active Call Timer Effect
  useEffect(() => {
    let interval: any;
    if (callState && callState.isOpen) {
      // Transition from calling to connected after 2.5 seconds
      const timeout = setTimeout(() => {
        setCallState(prev => prev ? { ...prev, status: 'connected' } : null);
      }, 2500);

      interval = setInterval(() => {
        setCallState(prev => prev && prev.status === 'connected' ? { ...prev, duration: prev.duration + 1 } : prev);
      }, 1000);

      return () => {
        clearTimeout(timeout);
        clearInterval(interval);
      };
    }
  }, [callState?.isOpen]);

  useEffect(() => {
    if (activeChat) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeChat]);

  // Voice Recording Handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          handleSend(undefined, base64Audio, recordingTimer);
        };
        // Stop stream tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.warn("Microphone access unavailable or denied, simulating voice note:", err);
      // Fallback simulation
      setIsRecording(true);
    }
  };

  const stopAndSendRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      // Fallback simulated voice note sound
      const simulatedDuration = recordingTimer || 5;
      const fakeAudio = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
      handleSend(undefined, fakeAudio, simulatedDuration);
    }
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleSend = (image?: string, audio?: string, audioDuration?: number) => {
    if ((newMessage.trim() || image || audio) && activeChat) {
      const recipientId = activeChat.id;
      const sentText = newMessage.trim();
      if (activeChat.type === 'group') {
        sendMessage(sentText, undefined, activeChat.id, image, audio, audioDuration, replyTo || undefined);
      } else {
        sendMessage(sentText, activeChat.id, undefined, image, audio, audioDuration, replyTo || undefined);
        if (currentUser?.typingIndicatorEnabled ?? true) {
          if (recipientId === 'ai-bot') {
            setIsPartnerTyping(true);
          } else {
            const partner = users.find(u => u.id === recipientId);
            if (partner && isUserOnline(partner)) {
              setTimeout(() => {
                setIsPartnerTyping(true);
                setTimeout(() => {
                  setIsPartnerTyping(false);
                }, 3500);
              }, 1000);
            }
          }
        }
      }
      setNewMessage('');
      setReplyTo(null);
    }
  };

  // Reset partner typing on activeChat change
  useEffect(() => {
    setIsPartnerTyping(false);
  }, [activeChat?.id]);

  // Turn off partner typing if a message arrived from partner
  useEffect(() => {
    if (activeChat && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last && (last.senderId === activeChat.id || (activeChat.id === 'ai-bot' && last.senderId === 'ai-bot'))) {
        setIsPartnerTyping(false);
      }
    }
  }, [messages, activeChat]);

  // Auto-scroll on typing or partner typing
  useEffect(() => {
    if (newMessage.trim().length > 0 || isPartnerTyping) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [newMessage, isPartnerTyping]);

  if (!currentUser) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateImageFile(file, 25);
      if (!validation.valid) {
        showToast(validation.error || 'الملف المختار غير صالح.');
        e.target.value = '';
        return;
      }
      try {
        showToast('جاري تجهيز الصورة وإرسالها... ⏳');
        const compressed = await compressImage(file, 900, 900, 0.72);
        handleSend(compressed);
      } catch (err) {
        console.warn("Message image upload warning:", err);
        showToast('تعذر إرسال الصورة. يرجى اختيار صورة أخرى.');
      }
    }
    e.target.value = '';
  };

  const handleCreateGroup = () => {
    if (newGroupName.trim() && selectedFriends.length > 0) {
      createGroup(newGroupName.trim(), [currentUser.id, ...selectedFriends]);
      setShowCreateGroup(false);
      setNewGroupName('');
      setSelectedFriends([]);
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  const handleSaveNote = () => {
    if (noteText.trim() || selectedNoteMusic) {
      updateUserNote(noteText.trim(), selectedNoteMusic);
      setShowNoteModal(false);
    }
  };

  const handleDeleteNote = () => {
    updateUserNote('', null);
    setNoteText('');
    setSelectedNoteMusic(null);
    setShowNoteModal(false);
  };

  const formatMessageTime = (ts: string) => {
    if (!ts) return '';
    try {
      const date = new Date(ts);
      if (isNaN(date.getTime())) return ts;
      return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    } catch(e) {
      return ts;
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Play audio voice note with real-time waveform progress & speed control
  const togglePlayAudio = (msgId: string, audioUrl?: string) => {
    if (playingAudioId === msgId) {
      audioPlayerRef.current?.pause();
      setPlayingAudioId(null);
      setAudioProgress(0);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.playbackRate = audioSpeed;
        audioPlayerRef.current = audio;
        audio.ontimeupdate = () => {
          if (audio.duration) {
            setAudioProgress(audio.currentTime / audio.duration);
          }
        };
        audio.play().catch(() => {});
        setPlayingAudioId(msgId);
        audio.onended = () => {
          setPlayingAudioId(null);
          setAudioProgress(0);
        };
      }
    }
  };

  const toggleAudioSpeed = () => {
    const nextSpeed = audioSpeed === 1 ? 1.5 : audioSpeed === 1.5 ? 2 : 1;
    setAudioSpeed(nextSpeed);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.playbackRate = nextSpeed;
    }
    showToast(`سرعة الصوت: ${nextSpeed}x`);
  };

  // Theme Styling Helper
  const getThemeClasses = () => {
    switch (chatTheme) {
      case 'neon':
        return {
          header: 'bg-slate-900/95 backdrop-blur-md border-slate-800 text-white shadow-sm',
          body: 'bg-slate-950 text-slate-100',
          myBubble: 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white shadow-sm',
          otherBubble: 'bg-slate-900 border border-slate-800 text-slate-100 shadow-sm',
          inputBg: 'bg-slate-900 border border-slate-800 text-white placeholder-slate-400 focus:border-indigo-500'
        };
      case 'emerald':
        return {
          header: 'bg-emerald-950/95 backdrop-blur-md border-emerald-800 text-white shadow-sm',
          body: 'bg-emerald-950 text-emerald-100',
          myBubble: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm',
          otherBubble: 'bg-emerald-900/80 border border-emerald-800 text-emerald-100 shadow-sm',
          inputBg: 'bg-emerald-900/90 border border-emerald-800 text-white placeholder-emerald-400 focus:border-emerald-400'
        };
      case 'rose':
        return {
          header: 'bg-rose-950/95 backdrop-blur-md border-rose-800 text-white shadow-sm',
          body: 'bg-rose-950/90 text-rose-100',
          myBubble: 'bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 text-white shadow-sm',
          otherBubble: 'bg-rose-900/60 border border-rose-800/80 text-rose-100 shadow-sm',
          inputBg: 'bg-rose-900/80 border border-rose-800 text-white placeholder-rose-400 focus:border-rose-400'
        };
      case 'dark':
        return {
          header: 'bg-zinc-900/95 backdrop-blur-md border-zinc-800 text-white shadow-sm',
          body: 'bg-zinc-950 text-zinc-100',
          myBubble: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm',
          otherBubble: 'bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-sm',
          inputBg: 'bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:border-blue-500'
        };
      default:
        return {
          header: 'bg-white/95 backdrop-blur-md border-gray-200/80 text-gray-900 shadow-2xs',
          body: 'text-gray-800',
          myBubble: 'bg-gradient-to-r from-[#0084ff] to-[#0099ff] text-white shadow-xs',
          otherBubble: 'bg-white border border-gray-100 text-gray-800 shadow-xs',
          inputBg: 'bg-gray-100/90 border border-transparent text-gray-900 placeholder-gray-500 focus:bg-white focus:border-blue-500 shadow-2xs'
        };
    }
  };

  const themeStyle = getThemeClasses();

  // Active Chat Screen View
  if (activeChat) {
    const isGroup = activeChat.type === 'group';
        let chatEntity = isGroup ? groups.find(g => g.id === activeChat.id) : users.find(u => u.id === activeChat.id);

    if (activeChat.id === 'ai-bot') {
      const aiUser = users.find(u => u.id === 'ai-bot');
      const storedAvatar = typeof window !== 'undefined' ? localStorage.getItem('own_ai_avatar') : null;
      chatEntity = {
        id: 'ai-bot',
        name: aiUser?.name || 'OWN AI',
        avatar: aiUser?.avatar || storedAvatar || 'https://ui-avatars.com/api/?name=OWN+AI&background=6366f1&color=fff',
        status: 'active',
        bio: aiUser?.bio || 'مساعدك الذكي OWN AI، سريع وجاهز للإجابة',
      } as any;
    }
    
    // Mask unavailable users (locked, suspended, disabled)
    if (!isGroup && chatEntity && (chatEntity.status === 'locked' || chatEntity.status === 'suspended' || chatEntity.status === 'disabled')) {
      chatEntity = {
        ...chatEntity,
        name: 'غروزلا',
        avatar: 'https://ui-avatars.com/api/?name=GROZLA&background=e5e7eb&color=9ca3af',
        isUnavailable: true
      };
    }

    const chatMessages = messages.filter(m => 
      isGroup 
        ? m.groupId === activeChat.id 
        : ((m.senderId === currentUser?.id && m.receiverId === activeChat.id) || (m.senderId === activeChat.id && m.receiverId === currentUser?.id))
    );

    // إذا تم الضغط على بلية الإعدادات، تظهر مباشرة كواجهة متكاملة ونظيفة بدون أي خلفيات داكنة أو بوب آب
    if (showChatSettingsModal && chatEntity) {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="min-h-[calc(100vh-8rem)] bg-white md:rounded-2xl shadow-xl flex flex-col relative overflow-y-auto text-right dir-rtl"
        >
          {/* Header الواجهة */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-md z-20">
            <button 
              onClick={() => setShowChatSettingsModal(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-1.5 text-gray-800 font-bold text-sm cursor-pointer"
            >
              <ArrowRight size={20} className="rtl:-scale-x-100" />
              <span>رجوع للدردشة</span>
            </button>
            <h2 className="font-black text-base text-gray-900">إعدادات المحادثة</h2>
            <div className="w-10" />
          </div>

          {/* جسم الواجهة - يظهر بدون أي خلفيات داكنة */}
          <div className="flex-1 p-4 sm:p-6 max-w-lg mx-auto w-full space-y-6">
            {/* 1. صورة ملف شخصي مدورة */}
            <div className="flex flex-col items-center justify-center pt-4 pb-2">
              <div className="relative">
                <img 
                  src={chatEntity.avatar || 'https://ui-avatars.com/api/?name=User'} 
                  alt={chatEntity.name} 
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover shadow-lg border-4 border-white bg-gray-100 ring-2 ring-gray-100"
                  referrerPolicy="no-referrer"
                />
                {!isGroup && isUserOnline(chatEntity as any) && (
                  <div className="absolute bottom-1 right-2 bg-[#31a24c] border-2 border-white rounded-full w-6 h-6 shadow-xs z-10" />
                )}
              </div>

              {/* 2. وتحتها اسم حساب بحجم كبير */}
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-3.5 text-center px-4 tracking-tight">
                {(!isGroup && chatEntity.id && customNicknames[chatEntity.id]) ? customNicknames[chatEntity.id] : chatEntity.name}
              </h2>
              {!isGroup && chatEntity.username && (
                <p className="text-xs text-gray-400 font-bold mt-1">@{chatEntity.username}</p>
              )}
            </div>

            {/* 3. وتحتها بحجم صغير تظهر على جهة يمنى مكتوب كنية */}
            <div className="w-full text-right space-y-2">
              <div 
                onClick={() => setIsEditingNickname(!isEditingNickname)}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 hover:bg-gray-100/90 border border-gray-200/70 transition-all cursor-pointer text-right"
              >
                <div className="flex items-center gap-2">
                  <Edit3 size={16} className="text-blue-600 shrink-0" />
                  <span className="text-xs font-bold text-gray-700">
                    كنية
                  </span>
                  {!isGroup && chatEntity.id && customNicknames[chatEntity.id] && (
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md">
                      {customNicknames[chatEntity.id]}
                    </span>
                  )}
                </div>
                <span className="text-xs text-blue-600 font-bold">
                  {isEditingNickname ? 'إلغاء' : (!isGroup && chatEntity.id && customNicknames[chatEntity.id] ? 'تعديل' : 'تعيين')}
                </span>
              </div>

              {/* حقل إدخال وتعديل الكنية */}
              {isEditingNickname && (
                <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                  <input 
                    type="text"
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    placeholder="أدخل كنية لهذا الحساب..."
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-right text-gray-800 focus:outline-hidden focus:border-blue-500 font-medium"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      const trimmed = nicknameInput.trim();
                      const updated = { ...customNicknames, [chatEntity.id]: trimmed };
                      setCustomNicknames(updated);
                      try {
                        localStorage.setItem(`chat_nicknames_${currentUser?.id || 'guest'}`, JSON.stringify(updated));
                      } catch (e) {
                        console.error(e);
                      }
                      if (isGroup) {
                        const existing = (chatEntity as any)?.nicknames || {};
                        updateGroupSettings(chatEntity.id, {
                          nicknames: { ...existing, [currentUser.id]: trimmed }
                        });
                      }
                      setIsEditingNickname(false);
                      showToast(trimmed ? 'تم حفظ الكنية بنجاح' : 'تمت إزالة الكنية');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    حفظ
                  </button>
                </div>
              )}
            </div>

            {/* 4. وتحتها انشاء مجموعة للدردشة */}
            <button
              onClick={() => {
                setShowChatSettingsModal(false);
                if (!isGroup && chatEntity) {
                  setSelectedFriends([chatEntity.id]);
                }
                setShowCreateGroup(true);
              }}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-blue-50/70 border border-gray-200/70 transition-all text-right cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                  <Users size={20} />
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                    انشاء مجموعة للدردشة
                  </div>
                  <div className="text-xs text-gray-500 font-medium">
                    بدء محادثة جماعية وإضافة أصدقاء آخرين
                  </div>
                </div>
              </div>
              <ChevronLeft size={19} className="text-gray-400 group-hover:text-blue-600 group-hover:-translate-x-1 transition-transform" />
            </button>

            {/* 5. وتحتها مكتوب حظر حساب */}
            {!isGroup && chatEntity && chatEntity.id !== currentUser.id && chatEntity.id !== 'ai-bot' && (
              <button
                onClick={() => setShowBlockConfirm(true)}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-rose-50/50 hover:bg-rose-100/70 border border-rose-200/60 transition-all text-right cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors shrink-0">
                    <ShieldAlert size={20} />
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-rose-600">
                      حظر حساب
                    </div>
                    <div className="text-xs text-rose-500/80 font-medium">
                      منع هذا الحساب من إرسال رسائل أو الاتصال بك
                    </div>
                  </div>
                </div>
                <ChevronLeft size={19} className="text-rose-400 group-hover:-translate-x-1 transition-transform" />
              </button>
            )}

            {/* 6. وتحت حظر حساب: جملة مكتوبة مؤشر كتابة مع أيقونة تشغيل وإيقاف */}
            <div className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-gray-100/90 border border-gray-200/70 transition-all text-right shadow-2xs">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                  (currentUser?.typingIndicatorEnabled ?? true)
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  <MessageCircle size={20} />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-gray-900">
                      مؤشر كتابة
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                      (currentUser?.typingIndicatorEnabled ?? true)
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {(currentUser?.typingIndicatorEnabled ?? true) ? 'تشغيل' : 'إيقاف'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 font-medium mt-0.5">
                    إظهار مؤشر الكتابة وتحتها رسالة أثناء كتابة الرسالة لصديق
                  </div>
                </div>
              </div>

              {/* أيقونة تشغيل وإيقاف (On/Off Toggle) */}
              <button
                type="button"
                onClick={() => {
                  const currentVal = currentUser?.typingIndicatorEnabled ?? true;
                  const newVal = !currentVal;
                  updateProfile({ typingIndicatorEnabled: newVal });
                  showToast(newVal ? 'تم تشغيل مؤشر الكتابة ✅' : 'تم إيقاف مؤشر الكتابة ⏸️');
                }}
                className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 flex items-center cursor-pointer shrink-0 ${
                  (currentUser?.typingIndicatorEnabled ?? true) 
                    ? 'bg-blue-600 justify-end' 
                    : 'bg-gray-300 justify-start'
                }`}
                title={(currentUser?.typingIndicatorEnabled ?? true) ? 'إيقاف مؤشر الكتابة' : 'تشغيل مؤشر الكتابة'}
              >
                <motion.div 
                  layout
                  className="w-6 h-6 rounded-full bg-white shadow-xs flex items-center justify-center"
                >
                  {(currentUser?.typingIndicatorEnabled ?? true) ? (
                    <Power size={13} className="text-blue-600" />
                  ) : (
                    <PowerOff size={13} className="text-gray-400" />
                  )}
                </motion.div>
              </button>
            </div>

            {/* خيارات إضافية: تخصيص ثيم الألوان وعرض الملف الشخصي */}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              {/* تخصيص التفاعل السريع */}
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/60 text-right space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">الرمز التعبيري السريع للمحادثة</span>
                  <span className="text-xl">{(chatEntity?.id && chatQuickEmojis[chatEntity.id]) || '👍'}</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {['👍', '❤️', '🔥', '🥰', '😂', '⚡', '👏', '🎉', '🚀', '💯'].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => {
                        if (chatEntity?.id) {
                          setChatQuickEmoji(chatEntity.id, em);
                        }
                      }}
                      className={`text-xl p-1.5 rounded-xl hover:bg-white transition-transform hover:scale-125 cursor-pointer ${
                        (chatEntity?.id && chatQuickEmojis[chatEntity.id] === em) ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setShowThemeModal(true);
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200/60 transition-all text-right cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <Palette size={17} />
                  </div>
                  <div className="text-xs font-bold text-gray-700">
                    تغيير ألوان وثيم المحادثة
                  </div>
                </div>
                <ChevronLeft size={17} className="text-gray-400" />
              </button>

              {!isGroup && !chatEntity?.isUnavailable && (
                <button
                  onClick={() => {
                    setShowChatSettingsModal(false);
                    setCurrentView('profile', chatEntity.id);
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200/60 transition-all text-right cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <Users size={17} />
                    </div>
                    <div className="text-xs font-bold text-gray-700">
                      عرض الملف الشخصي الكامل
                    </div>
                  </div>
                  <ChevronLeft size={17} className="text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* تأكيد حظر الحساب */}
          {showBlockConfirm && (
            <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl text-right dir-rtl animate-in fade-in zoom-in-95 duration-150">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                  <ShieldAlert size={26} />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="font-black text-lg text-gray-900">
                    هل أنت متأكد من حظر حساب {chatEntity.name}؟
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    لن يتمكن هذا الحساب من مراسلتك أو الاتصال بك أو رؤية منشوراتك. يمكنك إلغاء الحظر لاحقاً من الإعدادات.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      blockUser(chatEntity.id);
                      setShowBlockConfirm(false);
                      setShowChatSettingsModal(false);
                      setActiveChat(null);
                      showToast(`تم حظر حساب ${chatEntity.name} بنجاح`);
                    }}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    تأكيد الحظر
                  </button>
                  <button
                    onClick={() => setShowBlockConfirm(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Theme Customizer Modal */}
          {showThemeModal && (
            <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl text-right dir-rtl">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-black text-base text-gray-900 flex items-center gap-2">
                    <Palette size={18} className="text-amber-500" />
                    <span>اختر ثيم ألوان المحادثة</span>
                  </h3>
                  <button onClick={() => setShowThemeModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { id: 'classic', label: 'ماسينجر الأزرق الكلاسيكي', color: 'bg-blue-600' },
                    { id: 'neon', label: 'شفق نيون ليلي (Neon)', color: 'bg-indigo-600' },
                    { id: 'emerald', label: 'غابة زمردية (Emerald)', color: 'bg-emerald-600' },
                    { id: 'rose', label: 'شفق وردي (Rose Bloom)', color: 'bg-rose-600' },
                    { id: 'dark', label: 'أسود داكن (Midnight Dark)', color: 'bg-zinc-800' }
                  ].map((t) => (
                    <button 
                      key={`chat-theme-top-${t.id}`}
                      onClick={() => {
                        setChatTheme(t.id as any);
                        setShowThemeModal(false);
                      }}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${chatTheme === t.id ? 'border-blue-600 bg-blue-50/80 font-black' : 'border-gray-200 hover:bg-gray-50 font-bold text-gray-700'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full ${t.color} shadow-2xs`}></span>
                        <span className="text-xs">{t.label}</span>
                      </div>
                      {chatTheme === t.id && <Check size={18} className="text-blue-600" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      );
    }

    return (
      <motion.div 
        initial={{ opacity: 0, x: -20 }} 
        animate={{ opacity: 1, x: 0 }} 
        className={`min-h-[calc(100vh-8rem)] md:rounded-2xl shadow-xl flex flex-col relative overflow-hidden text-right dir-rtl bg-cover bg-center bg-no-repeat ${themeStyle.body}`}
        style={{
          backgroundImage: "url('/messenger_bg.jpg')",
        }}
      >
        {/* Chat Header */}
        <div className={`flex items-center justify-between p-3 sm:p-4 border-b sticky top-0 z-20 backdrop-blur-md ${themeStyle.header}`}>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveChat(null)} 
              className="p-2 hover:bg-black/10 rounded-full transition-colors cursor-pointer"
            >
              <ArrowRight size={20} className="rtl:-scale-x-100" />
            </button>

            {isGroup ? (
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 overflow-hidden shrink-0 shadow-sm">
                {chatEntity?.avatar ? <img src={chatEntity.avatar} alt={chatEntity.name} className="w-full h-full object-cover" /> : <Users size={20} />}
              </div>
            ) : (
              <div className="relative">
                <img 
                  src={(chatEntity as any)?.avatar} 
                  alt={chatEntity?.name} 
                  className="w-10 h-10 rounded-full object-cover cursor-pointer shrink-0 shadow-sm border border-white/20" 
                  onClick={() => setCurrentView('profile', chatEntity?.id)} 
                  referrerPolicy="no-referrer" 
                />
                {!isGroup && isUserOnline(chatEntity as any) && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>}
              </div>
            )}

            <div>
              <h3 
                className={`font-black text-sm sm:text-base ${!isGroup && !chatEntity?.isUnavailable ? 'cursor-pointer hover:underline' : ''}`} 
                onClick={() => !isGroup && !chatEntity?.isUnavailable && setCurrentView('profile', chatEntity?.id)}
              >
                {(!isGroup && chatEntity?.id && customNicknames[chatEntity.id]) ? customNicknames[chatEntity.id] : chatEntity?.name}
              </h3>
              {isGroup ? (
                <p className="text-[11px] opacity-80 font-medium">{(chatEntity as any)?.members?.length} أعضاء في المجموعة</p>
              ) : chatEntity?.isUnavailable ? (
                <p className="text-[11px] text-rose-500 font-bold flex items-center gap-1">
                  <span>🔒</span>
                  غروزلا • حساب مقفل أو معطل
                </p>
              ) : (
                <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  نشط الآن
                </p>
              )}
            </div>
          </div>

          {/* Header Action Tools: Voice Call, Video Call, Chat Settings ("بلية الإعدادات") */}
          <div className="flex items-center gap-1 sm:gap-2">
            {isGroup && (
              <button 
                onClick={() => setShowGroupSettings(true)}
                className="p-2.5 rounded-full transition-colors cursor-pointer text-blue-600 hover:bg-black/5"
                title="إعدادات المجموعة"
              >
                <Info size={20} />
              </button>
            )}
            {!isGroup && !chatEntity?.isUnavailable && (
              <>
                <button 
                  onClick={() => setCallState({ isOpen: true, type: 'voice', status: 'calling', duration: 0, isMuted: false, isVideoOff: false })}
                  className="p-2.5 rounded-full hover:bg-white/10 text-emerald-400 transition-colors cursor-pointer"
                  title="مكالمة صوتية"
                >
                  <Phone size={19} />
                </button>
                <button 
                  onClick={() => setCallState({ isOpen: true, type: 'video', status: 'calling', duration: 0, isMuted: false, isVideoOff: false })}
                  className="p-2.5 rounded-full hover:bg-white/10 text-blue-400 transition-colors cursor-pointer"
                  title="مكالمة فيديو"
                >
                  <Video size={20} />
                </button>
              </>
            )}

            {/* أيقونة بلية الإعدادات */}
            <button 
              onClick={() => {
                setNicknameInput((!isGroup && chatEntity?.id && customNicknames[chatEntity.id]) ? customNicknames[chatEntity.id] : '');
                setIsEditingNickname(false);
                setShowChatSettingsModal(true);
              }}
              className="p-2.5 rounded-full hover:bg-white/15 text-gray-100 hover:text-white transition-all cursor-pointer group"
              title="إعدادات المحادثة والحساب"
            >
              <Settings size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3.5 max-h-[62vh]">
          {/* Active User Chat Profile Header (Facebook Messenger Style) */}
          {!isGroup && chatEntity && !chatEntity.isUnavailable && (
            <div className="flex flex-col items-center justify-center py-6 px-4 space-y-2 text-center bg-white/95 backdrop-blur-md rounded-3xl shadow-sm border border-white/60 mb-4 max-w-sm mx-auto">
              <div className="relative">
                <img 
                  src={chatEntity.avatar} 
                  alt={chatEntity.name} 
                  className="w-[100px] h-[100px] rounded-full object-cover shadow-sm border border-gray-100"
                  referrerPolicy="no-referrer"
                />
                {chatEntity.status === 'active' && (
                  <div className="absolute bottom-1 right-2 bg-[#31a24c] border-4 border-white rounded-full w-5 h-5 shadow-sm z-10" />
                )}
              </div>
              <h2 className="text-xl font-black text-[#050505] mt-1">
                {(!isGroup && chatEntity?.id && customNicknames[chatEntity.id]) ? customNicknames[chatEntity.id] : chatEntity.name}
              </h2>
              <button 
                onClick={() => setCurrentView('profile', chatEntity.id)}
                className="bg-[#e4e6eb] hover:bg-[#d8dadf] text-[#050505] font-bold px-4 py-1.5 rounded-xl text-xs transition-colors mt-1 cursor-pointer"
              >
                عرض الملف الشخصي
              </button>
            </div>
          )}

          {chatMessages.length === 0 ? (
            isGroup ? (
              <div className="text-center my-12 space-y-3">
                <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
                  <MessageCircle size={32} />
                </div>
                <h4 className="font-black text-base">لا توجد رسائل سابقة في هذه المجموعة</h4>
                <p className="text-xs text-gray-500 font-medium">ابدأ المحادثة الآن!</p>
              </div>
            ) : null
          ) : (
            chatMessages.map((msg, index) => {
              const isMe = msg.senderId === currentUser.id;
              const isLastMessage = index === chatMessages.length - 1;
              const sender = users.find(u => u.id === msg.senderId);
              const isEmojiOpen = activeEmojiMessageId === msg.id;

              return (
                <div key={msg.id ? `msg-${msg.id}-${index}` : `msg-idx-${index}`} className={`flex flex-col ${isMe ? 'items-start' : 'items-end'} group relative`}>
                  <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] ${isMe ? 'flex-row' : 'flex-row-reverse'}`}>
                    {!isMe && (
                      <img 
                        src={sender?.avatar} 
                        alt={sender?.name} 
                        className="w-7 h-7 rounded-full object-cover shrink-0 shadow-2xs mb-1 cursor-pointer"
                        onClick={() => setCurrentView('profile', sender?.id)}
                        referrerPolicy="no-referrer"
                      />
                    )}

                    <div className="relative group/msg" onTouchStart={() => handlePressStart(msg.id)} onTouchEnd={handlePressEnd} onTouchMove={handlePressEnd} onMouseDown={() => handlePressStart(msg.id)} onMouseUp={handlePressEnd} onMouseLeave={handlePressEnd}>
                      {/* Quoted Reply Box if msg replies to another */}
                      {msg.replyTo && (
                        <div className={`text-[11px] px-3 py-1.5 rounded-t-xl mb-0.5 border-r-4 border-blue-500 ${isMe ? 'bg-blue-700/60 text-blue-100' : 'bg-gray-200/80 text-gray-700'}`}>
                          <span className="font-bold block">{msg.replyTo.senderName}</span>
                          <span className="truncate block opacity-90">{msg.replyTo.text}</span>
                        </div>
                      )}

                      {/* Main Message Bubble */}
                      <div className={`rounded-2xl px-4 py-2.5 shadow-xs relative ${isMe ? `${themeStyle.myBubble} rounded-tr-xs` : `${themeStyle.otherBubble} rounded-tl-xs`}`}>
                        {!isMe && isGroup && (
                          <span className="text-[11px] font-black block mb-1 text-blue-500">
                            {(chatEntity as any)?.nicknames?.[sender?.id || ''] || sender?.name}
                          </span>
                        )}

                        {/* Image Attachment */}
                        {msg.image && (
                          <div className="relative group/img overflow-hidden rounded-2xl mb-2 cursor-pointer">
                            <img 
                              src={msg.image} 
                              alt="Sent attachment" 
                              className="max-w-full rounded-2xl hover:scale-[1.02] transition-transform max-h-72 object-cover shadow-sm" 
                              onClick={() => setViewingImage({ 
                                url: msg.image!, 
                                senderName: isMe ? 'أنت' : sender?.name, 
                                timestamp: formatMessageTime(msg.timestamp) 
                              })}
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1 pointer-events-none">
                              <span>انقر للتكبير</span>
                            </div>
                          </div>
                        )}

                        {/* Voice Note Audio Player */}
                        {msg.audio && (
                          <div className="flex items-center gap-3 py-1.5 min-w-[200px]">
                            <button 
                              onClick={() => togglePlayAudio(msg.id, msg.audio)}
                              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md cursor-pointer transition-transform active:scale-95 ${isMe ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}
                            >
                              {playingAudioId === msg.id ? <Pause size={18} /> : <Play size={18} className="translate-x-0.5" />}
                            </button>
                            <div className="flex-1 space-y-1">
                              {/* Waveform Visualization bars with dynamic playback progress */}
                              <div className="flex items-center gap-1 h-5">
                                {[35, 65, 30, 95, 55, 80, 45, 100, 70, 40, 85, 50, 75, 35].map((h, idx) => {
                                  const barProgress = idx / 14;
                                  const isPlayed = playingAudioId === msg.id && audioProgress >= barProgress;
                                  return (
                                    <div 
                                      key={idx} 
                                      className={`w-1 rounded-full transition-all duration-150 ${
                                        isPlayed 
                                          ? (isMe ? 'bg-amber-300' : 'bg-blue-700') 
                                          : (isMe ? 'bg-white/60' : 'bg-blue-400')
                                      } ${playingAudioId === msg.id && Math.abs(audioProgress - barProgress) < 0.1 ? 'scale-y-125' : ''}`}
                                      style={{ height: `${h}%` }}
                                    />
                                  );
                                })}
                              </div>
                              <div className="flex items-center justify-between text-[10px] font-bold">
                                <span className={isMe ? 'text-blue-100' : 'text-gray-500'}>
                                  🎤 {msg.audioDuration ? formatTimer(msg.audioDuration) : '00:08'}
                                </span>
                                {playingAudioId === msg.id && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleAudioSpeed();
                                    }}
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-black cursor-pointer ${
                                      isMe ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                                    }`}
                                  >
                                    {audioSpeed}x
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Text Content */}
                        {msg.text && (
                          <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        )}

                        {/* Time & Read Status */}
                        <div className={`flex items-center gap-1 justify-end mt-1 text-[10px] ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                          <span>{formatMessageTime(msg.timestamp)}</span>
                          {isMe && <CheckCheck size={13} className={isLastMessage ? "text-blue-300" : "text-blue-200"} />}
                        </div>

                        {/* Reactions Badges underneath */}
                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                          <div className={`absolute -bottom-3 ${isMe ? 'right-2' : 'left-2'} bg-white border border-gray-200 rounded-full px-2 py-0.5 shadow-sm flex items-center gap-1.5 text-xs z-20`}>
                            {Array.from(new Set(Object.values(msg.reactions))).map((emoji, idx) => (
                              <span key={`msg-react-${msg.id || index}-${emoji}-${idx}`} className="text-sm scale-105" title="تفاعل">{emoji}</span>
                            ))}
                            <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-1 rounded-full">{Object.keys(msg.reactions).length}</span>
                          </div>
                        )}
                      </div>

                      {/* Quick Action Tools on Hover/Touch */}
                      <div className={`absolute top-1/2 -translate-y-1/2 ${isMe ? '-right-16' : '-left-16'} opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-1 z-10`}>
                        <button 
                          onClick={() => setActiveEmojiMessageId(isEmojiOpen ? null : msg.id)}
                          className="p-1.5 bg-white shadow-sm rounded-full hover:bg-gray-100 text-gray-600 cursor-pointer"
                          title="تفاعل بـ إيموجي (أحببته، اضحكني، أغضبني...)"
                        >
                          <Smile size={16} />
                        </button>
                        <button 
                          onClick={() => setReplyTo({ 
                            id: msg.id, 
                            text: msg.text || 'مقطع وسائط', 
                            senderName: ((isGroup ? (chatEntity as any)?.nicknames?.[sender?.id || ''] : undefined) || sender?.name) || 'مستخدم' 
                          })}
                          className="p-1.5 bg-white shadow-sm rounded-full hover:bg-gray-100 text-gray-600 cursor-pointer"
                          title="رد"
                        >
                          <Reply size={16} />
                        </button>
                        {isMe && (
                          <button 
                            onClick={() => deleteMessage(msg.id)}
                            className="p-1.5 bg-white shadow-sm rounded-full hover:bg-rose-50 text-rose-600 cursor-pointer"
                            title="حذف الرسالة"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      {/* Emoji Selector Popup Bar with explicit labels */}
                      {isEmojiOpen && (
                        <div className={`absolute -top-12 ${isMe ? 'right-0' : 'left-0'} bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-xl flex items-center gap-2.5 z-30 animate-in fade-in zoom-in-95 duration-150`}>
                          {[
                            { emoji: '👍', label: 'أعجبني' },
                            { emoji: '❤️', label: 'أحببته' },
                            { emoji: '😂', label: 'اضحكني' },
                            { emoji: '😮', label: 'أدهشني' },
                            { emoji: '😢', label: 'أحزنني' },
                            { emoji: '😡', label: 'أغضبني' },
                            { emoji: '🔥', label: 'رائع' }
                          ].map((item) => (
                            <button 
                              key={item.emoji}
                              onClick={() => {
                                reactToMessage(msg.id, item.emoji);
                                setActiveEmojiMessageId(null);
                              }}
                              className="hover:scale-125 transition-transform text-lg cursor-pointer p-0.5 relative group/em"
                              title={item.label}
                            >
                              <span>{item.emoji}</span>
                              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] px-1 py-0.5 rounded opacity-0 group-hover/em:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                {item.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Read Status for Message */}
                  {isMe && (
                    <div className="mt-0.5 text-[10px] font-bold text-gray-400 ms-1 mr-1 flex items-center gap-1 justify-end">
                      <CheckCheck size={12} className="text-blue-500" />
                      <span>تمت القراءة</span>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* مؤشر كتابة الشريك/الصديق مع رسالة تحتها */}
          {isPartnerTyping && (currentUser?.typingIndicatorEnabled ?? true) && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              className="flex flex-col items-end my-2 max-w-[85%]"
            >
              <div className="flex items-end gap-2 flex-row-reverse">
                <img
                  src={chatEntity?.avatar || 'https://ui-avatars.com/api/?name=User'}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover shrink-0 shadow-2xs mb-1 border border-gray-200"
                  referrerPolicy="no-referrer"
                />
                {/* فقاعة مؤشر الكتابة (3 نقاط متحركة) */}
                <div className="rounded-2xl px-4 py-2.5 shadow-xs bg-gray-100 border border-gray-200 text-gray-700 rounded-tl-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                </div>
              </div>
              {/* تحتها رسالة: يكتب رسالة لصديق */}
              <div className="flex items-center gap-1.5 mt-1 ml-9 text-[11px] font-bold text-gray-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>{chatEntity?.name || 'صديقك'} يكتب رسالة الآن...</span>
              </div>
            </motion.div>
          )}

          {/* مؤشر كتابة المستخدم أثناء كتابة رسالته لصديقه مع رسالة تحتها */}
          {newMessage.trim().length > 0 && (currentUser?.typingIndicatorEnabled ?? true) && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              className="flex flex-col items-start my-2 max-w-[85%]"
            >
              <div className="flex items-end gap-2 flex-row">
                <img
                  src={currentUser?.avatar || 'https://ui-avatars.com/api/?name=Me'}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover shrink-0 shadow-2xs mb-1 border border-blue-200"
                  referrerPolicy="no-referrer"
                />
                {/* فقاعة مؤشر الكتابة (3 نقاط متحركة) */}
                <div className="rounded-2xl px-4 py-2.5 shadow-xs bg-[#0084ff] text-white rounded-tr-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce" />
                </div>
              </div>
              {/* وتحتها رسالة أثناء ما يكون المستخدم يكتب رسالته لصديقه */}
              <div className="flex items-center gap-1.5 mt-1 mr-1 text-[11px] font-bold text-blue-600">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping shrink-0" />
                <span>أنت تكتب رسالة الآن إلى {chatEntity?.name || 'صديقك'}...</span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Reply Quoted Preview Bar */}
        {replyTo && (
          <div className="bg-blue-50 border-t border-blue-200 px-4 py-2 flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center gap-2 overflow-hidden">
              <Reply size={16} className="text-blue-600 shrink-0" />
              <div className="truncate">
                <span className="font-black text-blue-700">جاري الرد على {replyTo.senderName}:</span>
                <span className="mr-1 text-gray-600 truncate">{replyTo.text}</span>
              </div>
            </div>
            <button onClick={() => setReplyTo(null)} className="text-blue-600 hover:text-blue-800 p-1">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Input Bar */}
        {currentUser?.isKeyboardBanned ? (
          <div className="p-3.5 border-t bg-rose-50 border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sticky bottom-0 z-10">
            <div className="flex items-center gap-2 text-rose-800 font-bold">
              <ShieldAlert size={18} className="shrink-0 text-rose-600" />
              <span>الكيبورد وإرسال الرسائل محظور لمخالفة معايير الصورة الشخصية.</span>
            </div>
            <button
              onClick={() => unrestrictKeyboard()}
              className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-xl font-black text-xs shrink-0 cursor-pointer shadow-xs transition-all"
            >
              فك الحظر عبر OWN
            </button>
          </div>
        ) : chatEntity?.isUnavailable ? (
          <div className="p-4 border-t flex flex-col justify-center items-center gap-1 sticky bottom-0 z-10 bg-gray-50 text-gray-500 text-xs sm:text-sm font-bold text-center">
            <span className="text-rose-600 font-black">🔒 غروزلا (تم قفل أو تعطيل الحساب)</span>
            <span className="text-gray-500 text-xs">لا يمكنك مراسلة هذا الحساب حالياً. يمكنك فقط استعراض سجل الرسائل السابقة.</span>
          </div>
        ) : (
        <div className={`p-3 border-t flex gap-2 items-center sticky bottom-0 z-10 ${themeStyle.header}`}>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={imageInputRef} 
            onChange={handleImageUpload} 
          />

          {/* Voice Recording Mode Bar */}
          {isRecording ? (
            <div className="flex-1 bg-rose-50 rounded-full px-4 py-2 flex items-center justify-between border border-rose-200 text-rose-700 animate-pulse">
              <div className="flex items-center gap-2 text-xs font-black">
                <span className="w-2.5 h-2.5 bg-rose-600 rounded-full animate-ping"></span>
                <span>جاري تسجيل المقطع الصوتي... {formatTimer(recordingTimer)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={cancelRecording}
                  className="px-2.5 py-1 text-xs font-bold bg-white text-gray-700 rounded-lg hover:bg-gray-100 shadow-2xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button 
                  onClick={stopAndSendRecording}
                  className="px-3 py-1 text-xs font-black bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  <Send size={14} />
                  <span>إرسال</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Media Attach Buttons */}
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => imageInputRef.current?.click()}
                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer shrink-0"
                title="إرفاق صورة"
              >
                <ImageIcon size={22} />
              </motion.button>

              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={startRecording}
                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer shrink-0"
                title="تسجيل رسالة صوتية"
              >
                <Mic size={22} />
              </motion.button>

              {/* Text Input Container with embedded Emoji Picker Button */}
              <div className="relative flex-1 flex items-center">
                <input 
                  type="text" 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="اكتب رسالتك..." 
                  className={`w-full rounded-full pl-10 pr-4 py-2.5 text-sm outline-none transition-all ${themeStyle.inputBg}`}
                />
                <button
                  type="button"
                  onClick={() => setShowInputEmojiPicker(!showInputEmojiPicker)}
                  className="absolute left-2.5 p-1 text-gray-400 hover:text-amber-500 rounded-full transition-colors cursor-pointer"
                  title="إيموجي وملصقات"
                >
                  <Smile size={20} />
                </button>
              </div>

              {/* Emoji Picker Popup */}
              {showInputEmojiPicker && (
                <MessengerEmojiPicker
                  onSelectEmoji={(emoji) => {
                    setNewMessage(prev => prev + emoji);
                    setShowInputEmojiPicker(false);
                  }}
                  onClose={() => setShowInputEmojiPicker(false)}
                />
              )}

              {/* Quick Like / Custom Emoji if input is empty */}
              {!newMessage.trim() ? (
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={() => {
                    const currentEmoji = (chatEntity?.id && chatQuickEmojis[chatEntity.id]) || '👍';
                    setNewMessage(currentEmoji);
                    setTimeout(() => handleSend(), 50);
                  }}
                  className="p-2 text-2xl hover:scale-125 transition-transform cursor-pointer shrink-0"
                  title={`إرسال سريع: ${(chatEntity?.id && chatQuickEmojis[chatEntity.id]) || '👍'}`}
                >
                  {(chatEntity?.id && chatQuickEmojis[chatEntity.id]) || '👍'}
                </motion.button>
              ) : (
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleSend()} 
                  disabled={loadingStates.sendingMessage} 
                  className="p-2.5 bg-gradient-to-r from-[#0084ff] to-[#0099ff] text-white rounded-full transition-colors shrink-0 shadow-md hover:opacity-95 cursor-pointer disabled:opacity-50"
                >
                  {loadingStates.sendingMessage ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={19} className="rtl:-scale-x-100" />
                  )}
                </motion.button>
              )}
            </>
          )}
        </div>
        )}

        {/* Call Overlay Modal */}
        {callState?.isOpen && (
          <div className="fixed inset-0 bg-slate-950/90 z-[100] flex flex-col items-center justify-between p-6 text-white backdrop-blur-xl animate-in fade-in duration-200 dir-rtl">
            {/* Call Header */}
            <div className="flex items-center justify-between w-full max-w-md pt-4">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400" />
                <span className="text-xs font-black tracking-wider text-slate-300">
                  {callState.type === 'video' ? 'مكالمة فيديو عالية الدقة' : 'مكالمة صوتية مشفرة'}
                </span>
              </div>
              <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full text-emerald-400">
                {callState.status === 'calling' ? 'جاري الاتصال...' : formatTimer(callState.duration)}
              </span>
            </div>

            {/* Recipient Info & Animated Avatar */}
            <div className="flex flex-col items-center text-center space-y-4 my-auto">
              <div className="relative">
                {/* Ringing Radar Pulses */}
                {callState.status === 'calling' && (
                  <span className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping"></span>
                )}
                <img 
                  src={(chatEntity as any)?.avatar} 
                  alt={chatEntity?.name} 
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-blue-500/80 shadow-2xl relative z-10"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div>
                <h2 className="text-2xl font-black">{chatEntity?.name}</h2>
                <p className="text-sm text-slate-400 mt-1 font-medium">
                  {callState.status === 'calling' ? 'جاري الرنين والاتصال بالمستلم...' : 'المكالمة متصلة الآن 🟢'}
                </p>
              </div>

              {/* Soundwaves visualizer */}
              {callState.status === 'connected' && (
                <div className="flex items-center gap-1.5 h-8 pt-2">
                  {[20, 50, 90, 40, 100, 60, 30, 80, 50, 90, 30].map((h, i) => (
                    <div key={i} className="w-1.5 bg-blue-400 rounded-full animate-bounce" style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              )}
            </div>

            {/* Call Controls Bar */}
            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-3xl backdrop-blur-lg border border-white/10 mb-6">
              <button 
                onClick={() => setCallState(prev => prev ? { ...prev, isMuted: !prev.isMuted } : null)}
                className={`w-14 h-14 rounded-full flex items-center justify-center font-bold transition-all cursor-pointer ${callState.isMuted ? 'bg-rose-600 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
                title="كتم الصوت"
              >
                {callState.isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>

              {callState.type === 'video' && (
                <button 
                  onClick={() => setCallState(prev => prev ? { ...prev, isVideoOff: !prev.isVideoOff } : null)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center font-bold transition-all cursor-pointer ${callState.isVideoOff ? 'bg-amber-600 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
                  title="تعطيل الكاميرا"
                >
                  <Video size={24} />
                </button>
              )}

              <button 
                onClick={() => setCallState(null)}
                className="w-16 h-16 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 transition-transform active:scale-90 shadow-lg cursor-pointer"
                title="إنهاء المكالمة"
              >
                <PhoneOff size={28} />
              </button>
            </div>
          </div>
        )}

        {/* Theme Customizer Modal */}
        {showThemeModal && (
          <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl text-right dir-rtl">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-black text-base text-gray-900 flex items-center gap-2">
                  <Palette size={18} className="text-amber-500" />
                  <span>اختر ثيم ألوان المحادثة</span>
                </h3>
                <button onClick={() => setShowThemeModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { id: 'classic', label: 'ماسينجر الأزرق الكلاسيكي', color: 'bg-blue-600' },
                  { id: 'neon', label: 'شفق نيون ليلي (Neon)', color: 'bg-indigo-600' },
                  { id: 'emerald', label: 'غابة زمردية (Emerald)', color: 'bg-emerald-600' },
                  { id: 'rose', label: 'شفق وردي (Rose Bloom)', color: 'bg-rose-600' },
                  { id: 'dark', label: 'أسود داكن (Midnight Dark)', color: 'bg-zinc-800' }
                ].map((t) => (
                  <button 
                    key={`chat-theme-sheet-${t.id}`}
                    onClick={() => {
                      setChatTheme(t.id as any);
                      setShowThemeModal(false);
                    }}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${chatTheme === t.id ? 'border-blue-600 bg-blue-50/80 font-black' : 'border-gray-200 hover:bg-gray-50 font-bold text-gray-700'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full ${t.color} shadow-2xs`}></span>
                      <span className="text-xs">{t.label}</span>
                    </div>
                    {chatTheme === t.id && <Check size={18} className="text-blue-600" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Group Settings Modal */}
        {showGroupSettings && activeChat?.type === 'group' && chatEntity && (
          <GroupSettingsModal 
            group={chatEntity as any} 
            users={users} 
            currentUid={currentUser.id} 
            onClose={() => setShowGroupSettings(false)} 
            updateGroupSettings={updateGroupSettings} 
          />
        )}
      </motion.div>
    );
  }

  // Chats Overview Screen (الدردشات الرئيسية - واجهة مسنجر المطورة والذكية)
  const filteredFriends = friends.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      f.username?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === 'online') {
      return isUserOnline(f as any);
    }
    if (activeTab === 'unread') {
      const hasUnread = messages.some(m => m.receiverId === currentUser.id && m.senderId === f.id);
      return hasUnread;
    }
    if (activeTab === 'ai') {
      return f.id === 'ai-bot';
    }
    return true;
  }).sort((a, b) => {
    // Pinned chats appear first
    const isAPinned = pinnedChatIds.includes(a.id);
    const isBPinned = pinnedChatIds.includes(b.id);
    if (isAPinned && !isBPinned) return -1;
    if (!isAPinned && isBPinned) return 1;
    return 0;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="min-h-screen p-3 sm:p-4 relative flex flex-col text-right dir-rtl font-sans bg-cover bg-center bg-no-repeat bg-fixed"
      style={{
        backgroundImage: "url('/messenger_bg.jpg')",
      }}
    >
      {/* Top Messenger Header Bar */}
      <div className="flex justify-between items-center mb-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-3xl shadow-sm border border-white/60 dark:border-slate-800">
        {/* Right side: Messenger Logo + Title "الدردشات" */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0084ff] via-[#0099ff] to-[#a033ff] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <MessageCircle size={22} className="fill-white/20" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">الدردشات</h1>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">Facebook Messenger</p>
          </div>
        </div>

        {/* Left side: Action Icons (New Group, Search, Settings) */}
        <div className="flex items-center gap-1.5">
          <motion.button 
            whileTap={{ scale: 0.92 }}
            onClick={() => setShowCreateGroup(true)}
            className="w-9 h-9 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 flex items-center justify-center transition-colors cursor-pointer"
            title="إنشاء مجموعة جديدة"
          >
            <Users size={18} strokeWidth={2.2} />
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.92 }}
            onClick={() => setShowSearchInput(!showSearchInput)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              showSearchInput 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-gray-200'
            }`}
            title="بحث"
          >
            <Search size={18} strokeWidth={2.2} />
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.92 }}
            onClick={() => setShowThemeModal(true)}
            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-gray-200 flex items-center justify-center transition-colors cursor-pointer"
            title="تخصيص ثيم الألوان"
          >
            <Palette size={18} strokeWidth={2.2} />
          </motion.button>
        </div>
      </div>

      {/* Expandable Search Input Bar */}
      {showSearchInput && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mb-3">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl px-3.5 py-2 flex items-center gap-2 border border-blue-200 dark:border-slate-700 shadow-sm">
            <Search size={18} className="text-gray-400 shrink-0" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن أصدقاء، مجموعات، أو رسائل..." 
              className="bg-transparent outline-none text-xs w-full font-bold text-gray-800 dark:text-white" 
              autoFocus
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Filter Tabs Bar (الكل، غير مقروءة، المجموعات، المتصلون، OWN AI) */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none mb-3 px-1 py-1">
        {[
          { id: 'all', label: 'الكل' },
          { id: 'unread', label: 'غير مقروءة' },
          { id: 'online', label: 'المتصلون الآن 🟢' },
          { id: 'groups', label: 'المجموعات' },
          { id: 'ai', label: 'OWN AI 🤖' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white/80 dark:bg-slate-800/80 hover:bg-white text-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Horizontal Notes / Stories Section */}
      <div className="mb-3.5 overflow-x-auto scrollbar-none pb-2 pt-3 px-3 bg-white/90 backdrop-blur-md rounded-3xl shadow-sm border border-white/60">
        <div className="flex items-center gap-4 min-w-max px-1">
          {/* User's Own Note Item */}
          {(() => {
            const isOwnActive = isNoteValid(currentUser.userNote);
            const timeLeft = getNoteRemainingTime(currentUser.userNote);
            const userMusic = isOwnActive ? currentUser.userNote?.music : null;
            const noteContent = isOwnActive 
              ? (currentUser.userNote?.text || (userMusic ? `${userMusic.title} • ${userMusic.artist}` : '')) 
              : '+ مشاركة ملاحظة';

            return (
              <div 
                onClick={() => {
                  setNoteText(isOwnActive ? (currentUser.userNote?.text || '') : '');
                  setSelectedNoteMusic(isOwnActive && currentUser.userNote?.music ? (currentUser.userNote.music as Song) : null);
                  setShowNoteModal(true);
                }}
                className="flex flex-col items-center gap-1.5 cursor-pointer group shrink-0"
              >
                <div className="relative">
                  {/* Note Speech Bubble above avatar */}
                  <div className={`absolute -top-7 left-1/2 -translate-x-1/2 ${isOwnActive ? 'bg-white border-blue-300 text-gray-900 shadow-sm' : 'bg-blue-50/90 border-blue-200 border-dashed text-blue-600'} border text-[10px] font-black px-2 py-0.5 rounded-xl whitespace-nowrap z-10 max-w-[130px] flex items-center gap-1.5`}>
                    {userMusic ? (
                      <>
                        <button
                          type="button"
                          onClick={(e) => togglePlayNoteMusic(userMusic.url, e)}
                          className="w-4 h-4 rounded-full bg-blue-600 hover:scale-110 active:scale-95 text-white flex items-center justify-center shrink-0 cursor-pointer"
                          title="تشغيل المقطع الموسيقي"
                        >
                          {playingNoteAudioUrl === userMusic.url ? (
                            <Pause size={8} className="fill-white" />
                          ) : (
                            <Play size={8} className="fill-white ml-0.5" />
                          )}
                        </button>
                        <Music size={10} className={`shrink-0 ${playingNoteAudioUrl === userMusic.url ? 'text-pink-500 animate-bounce' : 'text-blue-600'}`} />
                        <span className="truncate max-w-[80px]">{noteContent}</span>
                      </>
                    ) : (
                      <>
                        {isOwnActive && <Clock size={10} className="text-blue-500 shrink-0" />}
                        <span className="truncate">{noteContent}</span>
                      </>
                    )}
                  </div>
                  <img 
                    src={currentUser.avatar} 
                    alt="My Note" 
                    className={`w-16 h-16 rounded-full object-cover border-2 ${isOwnActive ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'} shadow-xs group-hover:scale-105 transition-transform`}
                    referrerPolicy="no-referrer"
                  />
                  {isUserOnline(currentUser as any) && <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>}
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-black text-gray-800">ملاحظتك</span>
                  {isOwnActive && (
                    <span className="text-[9px] text-blue-600 font-extrabold flex items-center gap-0.5">
                      <Clock size={9} />
                      <span>{timeLeft}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Friends' Notes Items (Active accounts only) */}
          {friends.filter(f => !(f as any).isUnavailable).slice(0, 8).map((friend, idx) => {
            const isFriendActive = isNoteValid(friend.userNote);
            const friendMusic = isFriendActive ? friend.userNote?.music : null;
            const friendNote = isFriendActive 
              ? (friend.userNote?.text || (friendMusic ? `${friendMusic.title} • ${friendMusic.artist}` : '')) 
              : (sampleNotes?.[friend.id] || (idx === 0 ? 'لي تبعث ولا يبعث ل...' : idx === 1 ? 'شنو تاكيد الهوية هدي' : 'يخو معجبتك...'));

            return (
              <div 
                key={friend.id ? `msg-note-friend-${friend.id}-${idx}` : `msg-note-friend-${idx}`}
                className="flex flex-col items-center gap-1.5 group shrink-0"
              >
                <div className="relative">
                  {/* Note Speech Bubble above avatar - Clicking opens Note View Modal */}
                  <div 
                    onClick={() => {
                      if (isFriendActive) {
                        setViewingFriendNote({
                          id: friend.id,
                          name: friend.name,
                          avatar: friend.avatar,
                          userNote: friend.userNote,
                          remainingTime: getNoteRemainingTime(friend.userNote)
                        });
                      } else {
                        setActiveChat({ id: friend.id, type: 'user' });
                      }
                    }}
                    className="absolute -top-7 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-[10px] font-bold px-2 py-0.5 rounded-xl shadow-xs whitespace-nowrap z-10 max-w-[130px] flex items-center gap-1.5 hover:scale-105 transition-transform cursor-pointer"
                  >
                    {friendMusic ? (
                      <>
                        <button
                          type="button"
                          onClick={(e) => togglePlayNoteMusic(friendMusic.url, e)}
                          className="w-4 h-4 rounded-full bg-blue-600 hover:scale-110 active:scale-95 text-white flex items-center justify-center shrink-0 cursor-pointer"
                          title="تشغيل المقطع الموسيقي"
                        >
                          {playingNoteAudioUrl === friendMusic.url ? (
                            <Pause size={8} className="fill-white" />
                          ) : (
                            <Play size={8} className="fill-white ml-0.5" />
                          )}
                        </button>
                        <Music size={10} className={`shrink-0 ${playingNoteAudioUrl === friendMusic.url ? 'text-pink-500 animate-bounce' : 'text-blue-500'}`} />
                        <span className="truncate max-w-[80px]">{friendNote}</span>
                      </>
                    ) : (
                      <>
                        <Clock size={10} className="text-gray-400 shrink-0" />
                        <span className="truncate max-w-[90px]">{friendNote}</span>
                      </>
                    )}
                  </div>
                  <img 
                    src={friend.avatar} 
                    alt={friend.name} 
                    onClick={() => setActiveChat({ id: friend.id, type: 'user' })}
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 shadow-xs group-hover:scale-105 transition-transform cursor-pointer"
                    referrerPolicy="no-referrer"
                  />
                  {isUserOnline(friend as any) && <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>}
                </div>
                <span 
                  onClick={() => setActiveChat({ id: friend.id, type: 'user' })}
                  className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate max-w-[70px] cursor-pointer hover:underline"
                >
                  {friend.name.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Messages List (مطابق للي في الصورة) */}
      <div className="space-y-1.5 flex-1 overflow-y-auto pb-20">
        {filteredFriends.length > 0 ? (
          filteredFriends.map((friend, idx) => {
            const chatMessages = messages.filter(m => 
              (m.senderId === currentUser.id && m.receiverId === friend.id) || 
              (m.senderId === friend.id && m.receiverId === currentUser.id)
            );
            const lastMessage = chatMessages[chatMessages.length - 1];

            // Sample subtitles matching screenshot look
            const sampleSubtitles = [
              'أنت: نضربلك ترمة',
              'لقد أرسلت صورة.',
              'لقد أرسلت صورة.',
              'لقد أرسلت صورة.',
              'فشل إرسال الرسالة',
              'صديق جديد على GROZLA',
              'تم التفاعل مع رسالتك باستخدام ❤️'
            ];
            const defaultSub = sampleSubtitles[idx % sampleSubtitles.length];

            const isPinned = pinnedChatIds.includes(friend.id);
            const displayName = (!friend.isUnavailable && customNicknames[friend.id]) ? customNicknames[friend.id] : friend.name;

            return (
              <motion.div 
                key={friend.id ? `friend-chat-${friend.id}-${idx}` : `friend-chat-idx-${idx}`}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveChat({ id: friend.id, type: 'user' })}
                className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all group shadow-xs border ${
                  isPinned 
                    ? 'bg-blue-50/60 dark:bg-slate-800/80 border-blue-200/80 dark:border-blue-900/50' 
                    : 'bg-white/95 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800 border-white/60 dark:border-slate-800'
                }`}
              >
                {/* Left Side (RTL left): Pin button & Read Status Checkmark */}
                <div className="flex items-center gap-1.5 pl-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => togglePinChat(friend.id, e)}
                    className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                      isPinned 
                        ? 'text-blue-600 bg-blue-100 dark:bg-blue-950/50' 
                        : 'text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100'
                    }`}
                    title={isPinned ? 'إلغاء التثبيت' : 'تثبيت في الأعلى'}
                  >
                    <Pin size={14} className={isPinned ? 'fill-blue-600' : ''} />
                  </button>

                  <div className="w-5 h-5 rounded-full bg-[#8b5cf6] flex items-center justify-center text-white shadow-2xs">
                    <Check size={12} strokeWidth={3} />
                  </div>
                </div>

                {/* Center Side (RTL middle): Contact Name & Subtitle */}
                <div className="flex-1 px-3 text-right overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <h3 className="font-extrabold text-sm text-gray-900 dark:text-white leading-snug truncate">
                        {displayName}
                      </h3>
                      {isPinned && (
                        <span className="text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-600 font-bold px-1.5 py-0.2 rounded-md">
                          مثبتة
                        </span>
                      )}
                    </div>
                    {lastMessage && (
                      <span className="text-[10px] text-gray-400 font-bold shrink-0">
                        {formatMessageTime(lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-semibold mt-0.5">
                    {lastMessage ? (
                      <span>
                        {lastMessage.senderId === currentUser.id ? 'أنت: ' : ''}
                        {lastMessage.audio ? '🎤 مقطع صوتي' : lastMessage.image ? '📷 صورة' : lastMessage.text || 'لقد أرسلت رسالة.'}
                      </span>
                    ) : defaultSub}
                  </p>
                </div>

                {/* Right Side (RTL right): Contact Avatar + Online Green Dot */}
                <div className="relative shrink-0">
                  <img 
                    src={friend.avatar} 
                    alt={friend.name} 
                    className="w-14 h-14 rounded-full object-cover shadow-2xs group-hover:scale-105 transition-transform border border-gray-100 dark:border-slate-700"
                    referrerPolicy="no-referrer"
                  />
                  {isUserOnline(friend as any) && <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full"></div>}
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center text-gray-500 py-12 font-bold text-xs space-y-2">
            <MessageCircle size={32} className="mx-auto text-gray-300 dark:text-gray-600" />
            <p>لا توجد محادثات تطابق هذا التصنيف</p>
          </div>
        )}

        {/* Group Chats when Groups or All tab is selected */}
        {(activeTab === 'all' || activeTab === 'groups') && myGroups.length > 0 && (
          <div className="pt-3 space-y-1.5">
            <div className="text-xs font-black text-gray-500 dark:text-gray-400 px-2 py-1">
              المجموعات ({myGroups.length})
            </div>
            {myGroups.map((group, gIdx) => {
              const groupMsgs = messages.filter(m => m.groupId === group.id);
              const lastGroupMsg = groupMsgs[groupMsgs.length - 1];
              const isPinned = pinnedChatIds.includes(group.id);

              return (
                <motion.div
                  key={`msg-group-${group.id}-${gIdx}`}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveChat({ id: group.id, type: 'group' })}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all group shadow-xs border ${
                    isPinned
                      ? 'bg-blue-50/60 dark:bg-slate-800/80 border-blue-200/80'
                      : 'bg-white/95 dark:bg-slate-900/90 hover:bg-white border-white/60 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5 pl-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => togglePinChat(group.id, e)}
                      className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                        isPinned 
                          ? 'text-blue-600 bg-blue-100' 
                          : 'text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <Pin size={14} className={isPinned ? 'fill-blue-600' : ''} />
                    </button>
                  </div>

                  <div className="flex-1 px-3 text-right overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-sm text-gray-900 dark:text-white truncate">
                        {group.name}
                      </h3>
                      {lastGroupMsg && (
                        <span className="text-[10px] text-gray-400 font-bold shrink-0">
                          {formatMessageTime(lastGroupMsg.timestamp)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-semibold mt-0.5">
                      {lastGroupMsg ? (lastGroupMsg.audio ? '🎤 مقطع صوتي' : lastGroupMsg.image ? '📷 صورة' : lastGroupMsg.text) : `${group.members?.length || 0} أعضاء في المجموعة`}
                    </p>
                  </div>

                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-2xs shrink-0">
                    {group.avatar ? (
                      <img src={group.avatar} alt={group.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <Users size={24} />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Buttons at Bottom Left (مثل الصورة بالضبط: زر الذكاء الاصطناعي وزر الزائد) */}
      <div className="fixed bottom-16 left-4 z-40 flex flex-col items-center gap-3 dir-ltr">
        {/* Meta AI / Sparkle floating button with X badge */}
        <div className="relative group">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveChat({ id: 'ai-bot', type: 'user' })}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 via-indigo-500 to-pink-500 p-0.5 shadow-lg flex items-center justify-center cursor-pointer"
          >
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
              <Sparkles size={20} className="text-indigo-600" />
            </div>
          </motion.button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="absolute -top-1 -left-1 w-4 h-4 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-[10px] font-bold border border-white hover:bg-gray-300"
          >
            <X size={10} />
          </button>
        </div>

        {/* Big Blue Compose (+) Button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setShowCreateGroup(true)}
          className="w-14 h-14 rounded-full bg-[#1877f2] text-white shadow-xl flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-all"
          title="محادثة جديدة"
        >
          <Plus size={28} strokeWidth={2.5} />
        </motion.button>
      </div>

      {/* Meta Note Modal (24 Hours Lifecycle) */}
      <AnimatePresence>
        {showNoteModal && (() => {
          const isOwnActive = isNoteValid(currentUser.userNote);
          const timeLeft = getNoteRemainingTime(currentUser.userNote);
          const postedTime = getNoteFormattedTime(currentUser.userNote?.updatedAt);

          return (
            <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl text-right dir-rtl"
              >
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="font-black text-base text-gray-900 flex items-center gap-2">
                    <Clock size={20} className="text-[#1877f2]" />
                    <span>ملاحظة Messenger (24 ساعة)</span>
                  </h3>
                  <button onClick={() => setShowNoteModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                    <X size={18} />
                  </button>
                </div>

                {/* 24-hour Expiration Notice Banner */}
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-xs text-blue-900 font-bold space-y-1.5">
                  <div className="flex items-center gap-1.5 font-black text-blue-700">
                    <Clock size={15} />
                    <span>تختفي الملاحظة تلقائياً بعد 24 ساعة</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed font-semibold">
                    تدوم ملاحظتك لمدة 24 ساعة فقط من وقت كتابتها أو تعديلها، وتكون مرئية لأصدقائك في أعلى الرسائل.
                  </p>
                  {isOwnActive && (
                    <div className="pt-1.5 mt-1 border-t border-blue-200/60 flex items-center justify-between text-[11px] font-black">
                      <span className="text-emerald-700">🟢 الملاحظة الحالية نشطة ({timeLeft})</span>
                      {postedTime && <span className="text-gray-500">نُشرت {postedTime}</span>}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-gray-700">اكتب ملاحظتك (حتى 60 حرفاً)</label>
                  <input 
                    type="text" 
                    maxLength={60}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="مثال: نسمع فيروز 🎵، في العمل ☕..."
                    className="w-full bg-gray-50 border border-gray-300 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-blue-600 focus:bg-white transition-all"
                  />
                  <div className="flex justify-between text-[11px] text-gray-400 font-bold px-1">
                    <span>تظهر فوق صورتك الشخصية</span>
                    <span>{noteText.length}/60</span>
                  </div>
                </div>

                {/* Music Selection Section */}
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-gray-700">موسيقى الملاحظة (بحث ذكي بالذكاء الاصطناعي)</label>
                  {selectedNoteMusic ? (
                    <div className="flex items-center justify-between p-2.5 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-200">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow-xs shrink-0 bg-neutral-800">
                          <img 
                            src={selectedNoteMusic.cover} 
                            alt={selectedNoteMusic.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={(e) => togglePlayNoteMusic(selectedNoteMusic.url, e)}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                          >
                            {playingNoteAudioUrl === selectedNoteMusic.url ? (
                              <Pause size={14} className="fill-white" />
                            ) : (
                              <Play size={14} className="fill-white ml-0.5" />
                            )}
                          </button>
                        </div>

                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-black text-gray-900 truncate">
                            {selectedNoteMusic.title}
                          </span>
                          <span className="text-[11px] text-gray-600 font-bold truncate">
                            {selectedNoteMusic.artist}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 mr-2">
                        <button
                          type="button"
                          onClick={() => setShowMusicPickerForNote(true)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs hover:bg-blue-50 transition-colors"
                        >
                          تغيير
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (playingNoteAudioUrl === selectedNoteMusic.url && noteAudioPlayerRef.current) {
                              noteAudioPlayerRef.current.pause();
                              setPlayingNoteAudioUrl(null);
                            }
                            setSelectedNoteMusic(null);
                          }}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="إزالة الموسيقى"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowMusicPickerForNote(true)}
                      className="w-full py-2.5 px-3 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 font-bold text-xs rounded-2xl border border-blue-200/80 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs group"
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                        <Music size={13} />
                      </div>
                      <span>إضافة موسيقى 🎵 (يدعم أسماء الفنانين بالعربية)</span>
                      <Sparkles size={14} className="text-amber-500" />
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowNoteModal(false)}
                      className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-200 cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button 
                      onClick={handleSaveNote}
                      disabled={!noteText.trim() && !selectedNoteMusic}
                      className={`flex-1 py-2.5 ${noteText.trim() || selectedNoteMusic ? 'bg-[#1877f2] text-white hover:bg-blue-600 shadow-xs cursor-pointer' : 'bg-gray-200 text-gray-400 cursor-not-allowed'} font-black text-xs rounded-xl flex items-center justify-center gap-1.5`}
                    >
                      <Clock size={14} />
                      <span>{isOwnActive ? 'تجديد لـ 24 ساعة' : 'مشاركة لـ 24 ساعة'}</span>
                    </button>
                  </div>

                  {isOwnActive && (
                    <button 
                      onClick={handleDeleteNote}
                      className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl border border-rose-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={14} />
                      <span>حذف الملاحظة الآن</span>
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Music Selector Modal for Messenger Note */}
      <StoryMusicSelector
        isOpen={showMusicPickerForNote}
        onClose={() => setShowMusicPickerForNote(false)}
        title="موسيقى الملاحظة (مسنجر)"
        subtitle="ابحث بالذكاء الاصطناعي وباللغة العربية عن أي أغنية أو فنان"
        currentSongUrl={selectedNoteMusic?.url}
        onSelectSong={(song) => {
          setSelectedNoteMusic(song);
          setShowMusicPickerForNote(false);
        }}
      />

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateGroup && (
          <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden shadow-2xl text-right dir-rtl"
            >
              <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h3 className="font-black text-base text-gray-900 flex items-center gap-2">
                  <Users size={18} className="text-blue-600" />
                  <span>إنشاء مجموعة مراسلة جديدة</span>
                </h3>
                <button onClick={() => setShowCreateGroup(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-4 border-b">
                <label className="block text-xs font-extrabold text-gray-700 mb-1">اسم المجموعة</label>
                <input 
                  type="text" 
                  placeholder="أدخل اسم المجموعة..." 
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full bg-gray-100 rounded-2xl px-4 py-2.5 outline-none focus:bg-white focus:border-blue-600 border border-transparent font-bold text-sm"
                />
              </div>

              <div className="overflow-y-auto p-3 flex-1 space-y-1">
                <h4 className="font-extrabold text-xs text-gray-500 px-1 mb-2">اختر الأصدقاء لإضافتهم للمجموعة</h4>
                {friends.map((friend, fIdx) => (
                  <div 
                    key={friend.id ? `grp-friend-${friend.id}-${fIdx}` : `grp-friend-${fIdx}`} 
                    className="flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-2xl cursor-pointer transition-colors"
                    onClick={() => toggleFriendSelection(friend.id)}
                  >
                    <div className="flex items-center gap-3">
                      <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full object-cover shadow-2xs" referrerPolicy="no-referrer" />
                      <span className="font-bold text-sm text-gray-900">{friend.name}</span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedFriends.includes(friend.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                      {selectedFriends.includes(friend.id) && <Check size={12} className="text-white" />}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                <button 
                  onClick={() => setShowCreateGroup(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-xl font-bold text-xs"
                >
                  إلغاء
                </button>
                <button 
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim() || selectedFriends.length === 0}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-black text-xs disabled:opacity-50 hover:bg-blue-700 shadow-xs"
                >
                  إنشاء المجموعة
                </button>
              </div>
            </motion.div>
          
      {/* Long Press Message Context Menu Overlay */}
      <AnimatePresence>
        {longPressedMessageId && (
          <div className="fixed inset-0 z-[9999] flex flex-col justify-end sm:items-center sm:justify-center">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setLongPressedMessageId(null)}
            />
            
            {/* Context Menu Bottom Sheet */}
            <motion.div 
              initial={{ y: '100%', opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: '100%', opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-4 shadow-2xl flex flex-col gap-2"
            >
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-2 sm:hidden" />
              
              <button 
                onClick={() => setLongPressedMessageId(null)}
                className="w-full text-right px-4 py-3 rounded-xl font-bold text-gray-800 hover:bg-gray-100 flex items-center justify-between"
              >
                تمييز كغير مقروء
                <CheckCircle2 size={20} className="text-gray-500" />
              </button>
              
              <button 
                onClick={() => setLongPressedMessageId(null)}
                className="w-full text-right px-4 py-3 rounded-xl font-bold text-gray-800 hover:bg-gray-100 flex items-center justify-between"
              >
                حفظ في ارشيف
                <Inbox size={20} className="text-gray-500" />
              </button>
              
              <button 
                onClick={() => {
                  deleteMessage(longPressedMessageId);
                  setLongPressedMessageId(null);
                }}
                className="w-full text-right px-4 py-3 rounded-xl font-bold text-rose-600 hover:bg-rose-50 flex items-center justify-between"
              >
                حذف رسالة
                <Trash2 size={20} className="text-rose-500" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
</div>
        )}
      </AnimatePresence>

      {/* Messenger Fullscreen Image Lightbox Viewer */}
      {viewingImage && (
        <MessengerImageViewer
          imageUrl={viewingImage.url}
          senderName={viewingImage.senderName}
          timestamp={viewingImage.timestamp}
          onClose={() => setViewingImage(null)}
        />
      )}

      {/* Friend Note View & Quick Reply Modal */}
      {viewingFriendNote && (
        <MessengerNoteViewModal
          user={viewingFriendNote}
          remainingTimeText={viewingFriendNote.remainingTime}
          onClose={() => setViewingFriendNote(null)}
          onOpenChat={(userId) => {
            setActiveChat({ id: userId, type: 'user' });
          }}
          onSendReply={(recipientId, replyText) => {
            sendMessage(replyText, recipientId);
            showToast('تم إرسال ردك على الملاحظة بنجاح');
          }}
        />
      )}
    </motion.div>
  );
}
