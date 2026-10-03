import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, Search, Camera, Edit3, Phone, Video, Info, 
  Send, ThumbsUp, Mic, Image as ImageIcon, Smile, Plus, 
  Sparkles, Bot, Check, CheckCheck, MoreVertical, X,
  Heart, Laugh, AlertCircle, Play, Pause, ChevronLeft,
  Volume2, VolumeX, MessageCircle, Users, BookOpen, 
  Settings, LogOut, Globe, PhoneOff, VideoOff, RefreshCw,
  HelpCircle, ShieldCheck, Share2, Flame, Pin
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface SkyMessengerAppProps {
  onBackToFacebook: () => void;
  onLogout: () => void;
}

interface MessageReaction {
  userId: string;
  emoji: string;
}

export default function SkyMessengerApp({ onBackToFacebook, onLogout }: SkyMessengerAppProps) {
  const { 
    currentUser, users, messages, sendMessage, reactToMessage, 
    deleteMessage, updateUserNote, showToast, setCurrentView,
    activeChat, setActiveChat
  } = useAppContext();

  // Navigation tabs in Google Play Messenger: 'chats' | 'people' | 'stories'
  const [currentTab, setCurrentTab] = useState<'chats' | 'people' | 'stories'>('chats');
  
  // Selected conversation (null = chat list view, object = inside a chat room)
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  
  // Search query
  const [searchQuery, setSearchQuery] = useState('');
  
  // Chat input states
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; text: string; senderName: string } | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const recordingTimerRef = useRef<any>(null);
  
  // AI Bot specific typing state
  const [isAiTyping, setIsAiTyping] = useState(false);
  
  // Call simulation states (Audio / Video)
  const [activeCall, setActiveCall] = useState<{ type: 'voice' | 'video'; contact: any; status: 'calling' | 'connected' } | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const callTimerRef = useRef<any>(null);

  // User Note modal (ملاحظة مسنجر)
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [userNoteText, setUserNoteText] = useState(currentUser?.note?.text || '');

  // Media upload input
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Audio preview playing
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // AI Smart Replies chips
  const aiQuickSuggestions = [
    'أهلاً بك! 👋',
    'كيف حالك اليوم؟',
    'أنا بخير، شكراً لك 😊',
    'فكرة ممتازة جداً 💡',
    'سأتواصل معك لاحقاً ✨'
  ];

  // AI Assistant virtual user definition
  const skyAiUser = {
    id: 'ai-bot',
    name: 'مساعد SKY الذكي (Gemini AI)',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    isAi: true,
    bio: 'مساعد ذكي مباشر مدعوم بـ Google Gemini لتقديم إجابات فورية واقتراحات ذكية.'
  };

  // Contacts list: Sky AI at top, then existing users
  const allContacts = [
    skyAiUser,
    ...users.filter(u => u.id !== currentUser?.id && u.id !== 'ai-bot')
  ];

  // Filtered contacts based on search
  const filteredContacts = allContacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Active contact for the open chat
  const activeContact = selectedContactId 
    ? (selectedContactId === 'ai-bot' ? skyAiUser : users.find(u => u.id === selectedContactId) || skyAiUser)
    : null;

  // Filter messages for current chat
  const currentConversationMessages = selectedContactId && currentUser
    ? messages.filter(m => 
        (m.senderId === currentUser.id && m.receiverId === selectedContactId) ||
        (m.senderId === selectedContactId && m.receiverId === currentUser.id) ||
        (selectedContactId === 'ai-bot' && (m.senderId === 'ai-bot' || m.receiverId === 'ai-bot'))
      )
    : [];

  // Scroll to bottom when messages update
  useEffect(() => {
    if (selectedContactId) {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentConversationMessages.length, selectedContactId, isAiTyping]);

  // Voice recording timer
  useEffect(() => {
    if (isRecordingVoice) {
      recordingTimerRef.current = setInterval(() => {
        setVoiceDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(recordingTimerRef.current);
      setVoiceDuration(0);
    }
    return () => clearInterval(recordingTimerRef.current);
  }, [isRecordingVoice]);

  // Call duration timer
  useEffect(() => {
    if (activeCall && activeCall.status === 'connected') {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(callTimerRef.current);
      setCallDuration(0);
    }
    return () => clearInterval(callTimerRef.current);
  }, [activeCall?.status]);

  // Handle Send Text Message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!text && !replyingTo) return;
    if (!selectedContactId || !currentUser) return;

    setInputText('');
    const replyMeta = replyingTo || undefined;
    setReplyingTo(null);

    // Send through standard AppContext
    sendMessage(text, selectedContactId, undefined, undefined, undefined, undefined, replyMeta);

    // If chatting with AI Assistant, call /api/ai-chat for Gemini intelligence
    if (selectedContactId === 'ai-bot') {
      setIsAiTyping(true);
      try {
        const resp = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history: currentConversationMessages.slice(-6).map(m => ({
              role: m.senderId === 'ai-bot' ? 'ai' : 'user',
              text: m.text
            }))
          })
        });

        if (resp.ok) {
          const data = await resp.json();
          const aiReply = data.reply || 'أهلاً بك! أنا مساعد SKY الذكي، يسعدني التحدث معك 🤖✨';
          setTimeout(() => {
            sendMessage(aiReply, currentUser.id);
            setIsAiTyping(false);
          }, 600);
        } else {
          // Heuristic fallback
          setTimeout(() => {
            sendMessage(`أهلاً بك يا ${currentUser.name}! 👋✨ أنا مساعد SKY الذكي، رسالتك وصلت بنجاح! 🚀`, currentUser.id);
            setIsAiTyping(false);
          }, 800);
        }
      } catch (err) {
        setTimeout(() => {
          sendMessage(`أهلاً بك يا ${currentUser.name}! 👋✨ أنا مساعدك الذكي في مسنجر SKY.`, currentUser.id);
          setIsAiTyping(false);
        }, 800);
      }
    }
  };

  // Handle Send Like Thumbs Up
  const handleSendThumbsUp = () => {
    if (!selectedContactId || !currentUser) return;
    sendMessage('👍', selectedContactId);
  };

  // Handle Send Voice Note
  const handleStopAndSendVoice = () => {
    if (!selectedContactId || !currentUser) return;
    setIsRecordingVoice(false);
    const simulatedAudioUrl = 'https://actions.google.com/sounds/v1/water/water_bubble.ogg';
    sendMessage('🎙️ تسجيل صوتي', selectedContactId, undefined, undefined, simulatedAudioUrl, voiceDuration || 3);
    showToast('تم إرسال التسجيل الصوتي بنجاح 🎙️');
  };

  // Handle Image Upload
  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedContactId || !currentUser) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        sendMessage('📷 صورة مرفقة', selectedContactId, undefined, reader.result);
        showToast('تمت مشاركة الصورة بنجاح 📸');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle Note Save (Messenger Notes feature)
  const handleSaveUserNote = () => {
    updateUserNote(userNoteText.trim());
    setShowNoteModal(false);
    showToast('تم تحديث ملاحظة مسنجر الخاصة بك بنجاح 💭');
  };

  // Start Call Simulation
  const startCall = (type: 'voice' | 'video') => {
    if (!activeContact) return;
    setActiveCall({ type, contact: activeContact, status: 'calling' });
    setTimeout(() => {
      setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
    }, 2000);
  };

  // End Call
  const endCall = () => {
    setActiveCall(null);
  };

  // Format Call Timer (00:00)
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col font-sans select-none overflow-hidden" dir="rtl">
      {/* ============================================================== */}
      {/* 1. TOP GLOBAL MESSENGER BAR (Android Google Play Style) */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-150 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between shadow-2xs z-30">
        <div className="flex items-center gap-3">
          {/* User Profile Avatar with Note Bubble */}
          <div className="relative cursor-pointer" onClick={() => setShowNoteModal(true)} title="تحديث ملاحظة مسنجر">
            <img
              src={currentUser?.avatar || '/default-avatar.png'}
              alt={currentUser?.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-[#0084ff]"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
            
            {/* Note Bubble above Avatar if set */}
            {currentUser?.note?.text && (
              <span className="absolute -top-3 -right-2 max-w-[85px] truncate px-1.5 py-0.5 rounded-full bg-slate-800 text-white text-[9px] font-bold shadow-xs border border-white/40">
                💭 {currentUser.note.text}
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-gray-950 dark:text-white tracking-tight">
                {selectedContactId ? activeContact?.name : 'دردشات'}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-[#0084ff] text-[10px] font-bold border border-sky-200 dark:border-sky-800">
                SKY Messenger
              </span>
            </div>
            {!selectedContactId && (
              <p className="text-[11px] text-gray-500 font-medium">
                {allContacts.length} جهة اتصال متصلة الآن عبر السحابة
              </p>
            )}
          </div>
        </div>

        {/* Action Controls & Exit to Facebook */}
        <div className="flex items-center gap-1.5">
          {/* Back to Facebook Button */}
          <button
            type="button"
            onClick={onBackToFacebook}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 text-[#0084ff] text-xs font-bold transition-all cursor-pointer border border-blue-200/60 dark:border-slate-700"
            title="الانتقال إلى واجهة فيسبوك الرئيسية"
          >
            <Globe size={14} />
            <span className="hidden sm:inline">فيسبوك</span>
          </button>

          {/* Logout / Switch */}
          <button
            type="button"
            onClick={onLogout}
            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
            title="تسجيل الخروج"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. MAIN BODY: EITHER CHAT LIST OR ACTIVE CHAT ROOM */}
      {/* ============================================================== */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* VIEW A: CHAT LIST (When no contact is selected on mobile/single view) */}
        <div className={`flex-1 flex flex-col bg-white dark:bg-slate-950 overflow-y-auto ${selectedContactId ? 'hidden md:flex md:w-80 md:border-l md:border-gray-200 dark:md:border-slate-800' : 'flex'}`}>
          {/* Search Pill Bar */}
          <div className="p-3">
            <div className="relative">
              <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في المحادثات والرسائل..."
                className="w-full pr-10 pl-4 py-2.5 rounded-full bg-gray-100 dark:bg-slate-900 border-none text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#0084ff]/30 font-medium placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Active Now & Stories Horizontal Carousel (Like Google Play Messenger) */}
          <div className="border-b border-gray-100 dark:border-slate-900 pb-3">
            <div className="flex items-center gap-3.5 px-4 overflow-x-auto hide-scrollbar pt-1">
              {/* Add Story Button */}
              <div 
                className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
                onClick={() => setShowNoteModal(true)}
              >
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-300 dark:border-slate-700 flex items-center justify-center bg-gray-50 dark:bg-slate-900 group-hover:border-[#0084ff] transition-colors relative">
                  <Plus size={22} className="text-[#0084ff]" />
                </div>
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">ملاحظتك</span>
              </div>

              {/* Contacts with Active Circles */}
              {allContacts.map((contact, idx) => (
                <div
                  key={contact.id ? `sky-contact-circle-${contact.id}-${idx}` : `sky-contact-circle-${idx}`}
                  onClick={() => setSelectedContactId(contact.id)}
                  className="flex flex-col items-center gap-1 shrink-0 cursor-pointer relative group"
                >
                  <div className="relative">
                    <img
                      src={contact.avatar || '/default-avatar.png'}
                      alt={contact.name}
                      className="w-14 h-14 rounded-full object-cover p-0.5 border-2 border-[#0084ff] group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full" />
                    {contact.isAi && (
                      <span className="absolute -top-1 -left-1 p-1 bg-gradient-to-r from-amber-500 to-indigo-600 rounded-full text-white shadow-xs">
                        <Sparkles size={10} />
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 max-w-[60px] truncate text-center">
                    {contact.name.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 divide-y divide-gray-100 dark:divide-slate-900">
            {filteredContacts.map((contact, idx) => {
              // Find last message with this contact
              const contactMsgs = messages.filter(m => 
                (m.senderId === currentUser?.id && m.receiverId === contact.id) ||
                (m.senderId === contact.id && m.receiverId === currentUser?.id)
              );
              const lastMsg = contactMsgs[contactMsgs.length - 1];
              const isSelected = selectedContactId === contact.id;

              return (
                <div
                  key={contact.id ? `sky-chat-item-${contact.id}-${idx}` : `sky-chat-item-${idx}`}
                  onClick={() => setSelectedContactId(contact.id)}
                  className={`flex items-center gap-3.5 px-4 py-3 cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-blue-50/70 dark:bg-slate-900' 
                      : 'hover:bg-gray-50 dark:hover:bg-slate-900/60'
                  }`}
                >
                  {/* Contact Avatar */}
                  <div className="relative shrink-0">
                    <img
                      src={contact.avatar || '/default-avatar.png'}
                      alt={contact.name}
                      className="w-13 h-13 rounded-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full" />
                    {contact.isAi && (
                      <span className="absolute -top-1 -left-1 p-1 rounded-full bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 text-white shadow-xs">
                        <Sparkles size={10} />
                      </span>
                    )}
                  </div>

                  {/* Conversation Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                        <span>{contact.name}</span>
                        {contact.isAi && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md font-bold">
                            AI
                          </span>
                        )}
                      </h4>
                      <span className="text-[10px] text-gray-400 font-medium shrink-0">
                        {lastMsg ? new Date(lastMsg.timestamp || Date.now()).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : 'نشط'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {contact.isAi && !lastMsg ? (
                          <span className="text-sky-600 dark:text-sky-400 font-medium">
                            انقر للتحدث مع الذكاء الاصطناعي الفوري ✨
                          </span>
                        ) : (
                          lastMsg?.text || contact.bio || 'انقر لبدء المحادثة...'
                        )}
                      </p>
                      {lastMsg?.senderId === currentUser?.id && (
                        <CheckCheck size={14} className="text-[#0084ff] shrink-0 mr-1" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* VIEW B: CHAT ROOM (نافذة المحادثة النشطة) */}
        {selectedContactId ? (
          <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 z-20">
            {/* Chat Room Top Bar */}
            <div className="p-3 border-b border-gray-150 dark:border-slate-800 flex items-center justify-between bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-2xs">
              <div className="flex items-center gap-2.5">
                {/* Back to List on Mobile */}
                <button
                  type="button"
                  onClick={() => setSelectedContactId(null)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  <ArrowRight size={20} />
                </button>

                {/* Contact Avatar */}
                <div className="relative">
                  <img
                    src={activeContact?.avatar || '/default-avatar.png'}
                    alt={activeContact?.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                </div>

                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                    <span>{activeContact?.name}</span>
                    {activeContact?.isAi && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold">
                        Gemini AI
                      </span>
                    )}
                  </h3>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                    {isAiTyping ? 'يكتب الآن...' : 'نشط الآن'}
                  </span>
                </div>
              </div>

              {/* Call Controls & Info */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => startCall('voice')}
                  className="p-2 text-[#0084ff] hover:bg-blue-50 dark:hover:bg-slate-800 rounded-full cursor-pointer transition-colors"
                  title="مكالمة صوتية"
                >
                  <Phone size={19} />
                </button>
                <button
                  type="button"
                  onClick={() => startCall('video')}
                  className="p-2 text-[#0084ff] hover:bg-blue-50 dark:hover:bg-slate-800 rounded-full cursor-pointer transition-colors"
                  title="مكالمة فيديو"
                >
                  <Video size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => showToast(`معلومات المحادثة مع ${activeContact?.name}`)}
                  className="p-2 text-[#0084ff] hover:bg-blue-50 dark:hover:bg-slate-800 rounded-full cursor-pointer transition-colors"
                  title="خيارات المحادثة"
                >
                  <Info size={19} />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f0f2f5]/50 dark:bg-slate-950">
              {/* Contact Profile Header in Chat */}
              <div className="text-center py-6 space-y-2">
                <img
                  src={activeContact?.avatar || '/default-avatar.png'}
                  alt={activeContact?.name}
                  className="w-20 h-20 rounded-full object-cover mx-auto shadow-md border-2 border-white dark:border-slate-800"
                />
                <h3 className="text-base font-black text-gray-900 dark:text-white">
                  {activeContact?.name}
                </h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  {activeContact?.bio || 'أنتما متصلان على مسنجر عبر خوادم SKY السحابية المشفرة.'}
                </p>
                {activeContact?.isAi && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 text-xs font-bold border border-sky-300">
                    <Sparkles size={13} className="text-amber-500" />
                    <span>جاهز للإجابة، تلخيص الرسائل، والدردشة الذكية</span>
                  </div>
                )}
              </div>

              {/* Message Bubbles with Framer Motion Spring Animations */}
              <AnimatePresence initial={false}>
                {currentConversationMessages.map((msg, mIdx) => {
                  const isMe = msg.senderId === currentUser?.id;

                  return (
                    <motion.div
                      key={msg.id ? `sky-msg-${msg.id}-${mIdx}` : `sky-msg-idx-${mIdx}`}
                      initial={{ opacity: 0, y: 16, scale: 0.93 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 420, 
                        damping: 24, 
                        mass: 0.7 
                      }}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group mb-1`}
                    >
                      {/* Quoted Message / Reply Preview */}
                      {msg.replyTo && (
                        <div className="text-[10px] px-2.5 py-1 mb-1 rounded-xl bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-r-2 border-[#0084ff] max-w-xs truncate">
                          <span className="font-bold">{msg.replyTo.senderName}: </span>
                          <span>{msg.replyTo.text}</span>
                        </div>
                      )}

                      <div className="flex items-end gap-1.5 max-w-[80%]">
                        {/* Received Avatar */}
                        {!isMe && (
                          <motion.img
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            src={activeContact?.avatar || '/default-avatar.png'}
                            alt={activeContact?.name}
                            className="w-7 h-7 rounded-full object-cover shrink-0 mb-1 shadow-xs"
                          />
                        )}

                        {/* Bubble */}
                        <motion.div
                          whileHover={{ scale: 1.015 }}
                          whileTap={{ scale: 0.985 }}
                          className={`rounded-2xl px-3.5 py-2.5 text-xs font-medium leading-relaxed relative transition-shadow ${
                            isMe
                              ? 'bg-gradient-to-r from-[#0084ff] to-[#0099ff] text-white rounded-bl-sm shadow-sm'
                              : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-br-sm shadow-sm border border-gray-150 dark:border-slate-700'
                          }`}
                        >
                          {/* Image message */}
                          {msg.image && (
                            <img
                              src={msg.image}
                              alt="Attachment"
                              className="rounded-xl max-h-60 w-auto mb-1.5 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                              onClick={() => window.open(msg.image, '_blank')}
                            />
                          )}

                          {/* Audio voice note player */}
                          {msg.audio && (
                            <div className="flex items-center gap-2 py-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setPlayingAudioId(playingAudioId === msg.id ? null : msg.id);
                                  const audioEl = new Audio(msg.audio);
                                  audioEl.play().catch(() => {});
                                }}
                                className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform active:scale-90 ${isMe ? 'bg-white text-[#0084ff]' : 'bg-[#0084ff] text-white'}`}
                              >
                                {playingAudioId === msg.id ? <Pause size={14} /> : <Play size={14} />}
                              </button>
                              <div className="flex-1 space-y-1">
                                <div className="h-1.5 bg-black/20 rounded-full w-28 overflow-hidden">
                                  <div className="h-full bg-white rounded-full w-2/3 animate-pulse" />
                                </div>
                                <span className="text-[9px] opacity-80 block font-mono">
                                  00:{msg.audioDuration ? msg.audioDuration.toString().padStart(2, '0') : '05'}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Text Content */}
                          {msg.text && (
                            <p className="whitespace-pre-wrap select-text">{msg.text}</p>
                          )}

                          {/* Reaction Display */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <motion.div 
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="absolute -bottom-2.5 left-2 px-1.5 py-0.5 rounded-full bg-white dark:bg-slate-900 shadow-md border border-gray-200 dark:border-slate-700 flex items-center gap-0.5 text-[11px]"
                            >
                              {msg.reactions.map((r, rIdx) => (
                                <span key={`sky-react-${r.userId || rIdx}-${r.emoji}-${rIdx}`}>{r.emoji}</span>
                              ))}
                            </motion.div>
                          )}
                        </motion.div>

                        {/* Quick Reaction Button on Hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => reactToMessage(msg.id, '❤️')}
                            className="p-1 hover:scale-125 transition-transform text-xs cursor-pointer"
                            title="إعجاب بالقلب"
                          >
                            ❤️
                          </button>
                          <button
                            type="button"
                            onClick={() => reactToMessage(msg.id, '👍')}
                            className="p-1 hover:scale-125 transition-transform text-xs cursor-pointer"
                            title="إعجاب"
                          >
                            👍
                          </button>
                          <button
                            type="button"
                            onClick={() => setReplyingTo({ id: msg.id, text: msg.text || 'مرفق', senderName: isMe ? 'أنت' : activeContact?.name || 'مستخدم' })}
                            className="p-1 text-gray-400 hover:text-gray-700 text-xs cursor-pointer"
                            title="رد مقتبس"
                          >
                            ↩️
                          </button>
                        </div>
                      </div>

                      {/* Timestamp */}
                      <span className="text-[9px] text-gray-400 mt-0.5 px-1 font-mono">
                        {new Date(msg.timestamp || Date.now()).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* AI Typing Indicator */}
              {isAiTyping && (
                <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 flex items-center justify-center text-white">
                    <Sparkles size={12} className="animate-spin" />
                  </div>
                  <span className="font-bold text-[#0084ff]">يقوم مساعد SKY الذكي بصياغة الرد...</span>
                </div>
              )}

              <div ref={chatMessagesEndRef} />
            </div>

            {/* Smart AI Quick Suggestions Bar */}
            <div className="px-3 py-1.5 bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
              <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1 shrink-0">
                <Sparkles size={12} />
                <span>ردود ذكية:</span>
              </span>
              {aiQuickSuggestions.map((suggestion, sIdx) => (
                <button
                  key={`sky-ai-sug-${sIdx}`}
                  type="button"
                  onClick={() => handleSendMessage(suggestion)}
                  className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-sky-300 dark:border-sky-800 hover:border-[#0084ff] text-[11px] font-medium text-gray-700 dark:text-gray-200 shrink-0 cursor-pointer shadow-2xs hover:bg-sky-50 transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Replying Banner (if set) */}
            {replyingTo && (
              <div className="px-4 py-2 bg-blue-50 dark:bg-slate-800 border-t border-blue-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <div className="truncate">
                  <span className="font-bold text-[#0084ff]">الرد على {replyingTo.senderName}: </span>
                  <span className="text-gray-600 dark:text-gray-300">{replyingTo.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="text-gray-400 hover:text-gray-700 font-bold ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Chat Input Bar (Signature Google Play Messenger Style) */}
            <div className="p-2.5 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex items-center gap-2">
              {/* Media Attachments */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageSelected}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-[#0084ff] hover:bg-blue-50 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                title="إرفاق صورة"
              >
                <ImageIcon size={20} />
              </button>

              {/* Voice Note Record Button */}
              {isRecordingVoice ? (
                <div className="flex-1 flex items-center justify-between px-3 py-2 bg-rose-50 border border-rose-200 rounded-full text-rose-600 text-xs font-bold animate-pulse">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                    <span>جاري التسجيل: 00:{voiceDuration.toString().padStart(2, '0')}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRecordingVoice(false)}
                      className="text-gray-500 hover:text-gray-800 text-xs"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={handleStopAndSendVoice}
                      className="px-2.5 py-1 rounded-full bg-rose-600 text-white font-black text-xs shadow-xs"
                    >
                      إرسال
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsRecordingVoice(true)}
                    className="p-2 text-[#0084ff] hover:bg-blue-50 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                    title="تسجيل صوتي"
                  >
                    <Mic size={20} />
                  </button>

                  {/* Text Input */}
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSendMessage();
                        }
                      }}
                      placeholder="أرسل رسالة..."
                      className="w-full px-4 py-2.5 rounded-full bg-gray-100 dark:bg-slate-800 border-none text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#0084ff]/30 font-medium placeholder:text-gray-400"
                    />
                  </div>

                  {/* Send Button or Thumbs Up */}
                  {inputText.trim() ? (
                    <button
                      type="button"
                      onClick={() => handleSendMessage()}
                      className="w-9 h-9 rounded-full bg-[#0084ff] hover:bg-[#0073e6] text-white flex items-center justify-center transition-transform active:scale-90 shadow-md cursor-pointer shrink-0"
                      title="إرسال"
                    >
                      <Send size={16} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendThumbsUp}
                      className="p-2 text-[#0084ff] hover:scale-125 transition-transform cursor-pointer"
                      title="إعجاب سريع"
                    >
                      <ThumbsUp size={20} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          /* Empty state on large screen when no chat is open */
          <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-gray-50 dark:bg-slate-950 text-center p-6 space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-sky-500/20">
              <MessageCircle size={38} />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">
                تطبيق مسنجر SKY - Google Play Edition
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mt-1">
                اختر محادثة من القائمة للبدء في الدردشة الفورية أو التحدث مع مساعد SKY الذكي مدعوماً بـ Gemini.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedContactId('ai-bot')}
              className="px-4 py-2 rounded-full bg-[#0084ff] hover:bg-[#0073e6] text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer transition-all"
            >
              <Sparkles size={14} />
              <span>محادثة مساعد SKY الذكي (Gemini)</span>
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 3. BOTTOM TAB NAVIGATION (Like Google Play Messenger) */}
      {/* ============================================================== */}
      {!selectedContactId && (
        <div className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex justify-around py-2 shadow-sm z-30">
          <button
            type="button"
            onClick={() => setCurrentTab('chats')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
              currentTab === 'chats' ? 'text-[#0084ff]' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <MessageCircle size={22} strokeWidth={currentTab === 'chats' ? 2.6 : 2} />
            <span className="text-[10px] font-bold">الدردشات</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('people')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
              currentTab === 'people' ? 'text-[#0084ff]' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Users size={22} strokeWidth={currentTab === 'people' ? 2.6 : 2} />
            <span className="text-[10px] font-bold">الأشخاص ({allContacts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('stories')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
              currentTab === 'stories' ? 'text-[#0084ff]' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <BookOpen size={22} strokeWidth={currentTab === 'stories' ? 2.6 : 2} />
            <span className="text-[10px] font-bold">القصص</span>
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. MODALS: MESSENGER NOTE MODAL (ملاحظة مسنجر) */}
      {/* ============================================================== */}
      <AnimatePresence>
        {showNoteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-gray-150 dark:border-slate-800 space-y-4 text-right"
            >
              <div className="flex items-center justify-between border-b border-gray-150 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-gray-900 dark:text-white font-black text-sm">
                  <span>💭 ملاحظة مسنجر (Messenger Note)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500 hover:text-gray-900 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="text-center space-y-2 py-2">
                <div className="relative inline-block">
                  <img
                    src={currentUser?.avatar || '/default-avatar.png'}
                    alt={currentUser?.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#0084ff]"
                  />
                  <div className="absolute -top-3 -right-3 px-2 py-0.5 rounded-full bg-slate-800 text-white text-[10px] font-bold border border-white">
                    {userNoteText || 'مشاركة فكرة...'}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  تظهر ملاحظتك لأصدقائك في الجزء العلوي من مسنجر لمدة 24 ساعة.
                </p>
              </div>

              <input
                type="text"
                maxLength={60}
                value={userNoteText}
                onChange={(e) => setUserNoteText(e.target.value)}
                placeholder="شارك ما يدور في ذهنك (مثال: أستمع للموسيقى 🎵)..."
                className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-[#0084ff]"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveUserNote}
                  className="flex-1 py-2.5 rounded-xl bg-[#0084ff] hover:bg-[#0073e6] text-white text-xs font-black shadow-md cursor-pointer transition-all"
                >
                  نشر الملاحظة
                </button>
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* 5. MODAL: CALL SIMULATION (صوتية أو فيديو) */}
      {/* ============================================================== */}
      <AnimatePresence>
        {activeCall && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl p-6 text-center space-y-6 text-white"
            >
              <div className="space-y-3">
                <div className="relative inline-block">
                  <img
                    src={activeCall.contact?.avatar || '/default-avatar.png'}
                    alt={activeCall.contact?.name}
                    className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-[#0084ff] shadow-xl animate-pulse"
                  />
                  <span className="absolute bottom-1 right-1 p-2 bg-[#0084ff] rounded-full text-white shadow-md">
                    {activeCall.type === 'video' ? <Video size={16} /> : <Phone size={16} />}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black">{activeCall.contact?.name}</h3>
                  <p className="text-xs text-sky-300 font-mono mt-1">
                    {activeCall.status === 'calling' ? 'جاري الاتصال...' : `متصل (${formatTimer(callDuration)})`}
                  </p>
                </div>
              </div>

              {/* Video Call Simulation Screen */}
              {activeCall.type === 'video' && activeCall.status === 'connected' && (
                <div className="w-full h-44 rounded-2xl bg-slate-900 border border-slate-700 relative overflow-hidden flex items-center justify-center shadow-inner">
                  <img
                    src={activeCall.contact?.avatar}
                    alt="Video Stream"
                    className="w-full h-full object-cover filter brightness-90"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-[10px] font-mono text-emerald-400">
                    HD 1080p 60fps
                  </div>
                  {/* Pip selfie */}
                  <div className="absolute bottom-2 right-2 w-14 h-18 rounded-lg overflow-hidden border-2 border-white shadow-md">
                    <img
                      src={currentUser?.avatar}
                      alt="Self"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Call Controls */}
              <div className="flex items-center justify-center gap-6 pt-4">
                <button
                  type="button"
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                >
                  <Volume2 size={20} />
                </button>

                {/* End Call Button */}
                <button
                  type="button"
                  onClick={endCall}
                  className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 flex items-center justify-center text-white shadow-lg shadow-rose-600/50 cursor-pointer active:scale-95 transition-transform"
                  title="إنهاء المكالمة"
                >
                  <PhoneOff size={26} />
                </button>

                <button
                  type="button"
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                >
                  <Mic size={20} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
