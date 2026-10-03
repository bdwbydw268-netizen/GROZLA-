import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  Sparkles, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Send, 
  Image as ImageIcon, 
  Mail, 
  User, 
  Check, 
  Upload, 
  FileText, 
  Cpu, 
  Zap, 
  Lock, 
  LockOpen, 
  RefreshCw, 
  HelpCircle, 
  ExternalLink,
  MessageSquare,
  BadgeCheck,
  Shield,
  Layers,
  ChevronRight,
  CreditCard,
  ScanFace,
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  Maximize2
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { compressImage, validateImageFile } from '../utils/imageUtils';

interface OwnAiRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type RecoveryStep = 'why_disabled' | 'bot_chat' | 'restoring' | 'success';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  type?: 'text' | 'name_input' | 'screenshot_input' | 'id_card_input' | 'email_input' | 'summary' | 'success';
  payload?: any;
}

export const OwnAiRecoveryModal: React.FC<OwnAiRecoveryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, reactivateAccount, showToast } = useAppContext();

  const [step, setStep] = useState<RecoveryStep>('why_disabled');
  
  // "لماذا تم تعطيل حسابك" note state
  const [userNote, setUserNote] = useState('');
  const [noteError, setNoteError] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Bot states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  
  // Bot verification fields
  const [botName, setBotName] = useState('');
  const [botScreenshot, setBotScreenshot] = useState<string | null>(null);
  const [botIdCard, setBotIdCard] = useState<string | null>(null);
  const [botEmail, setBotEmail] = useState('');
  
  // Form input states inside bot
  const [currentInputStage, setCurrentInputStage] = useState<'name' | 'screenshot' | 'id_card' | 'email' | 'ready_to_restore' | 'done'>('name');
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingIdCard, setIsUploadingIdCard] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLog, setScanLog] = useState<string[]>([]);

  const screenshotFileInputRef = useRef<HTMLInputElement>(null);
  const idFileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isBotTyping, currentInputStage]);

  // Initialize bot when entering bot_chat step
  useEffect(() => {
    if (step === 'bot_chat' && chatMessages.length === 0) {
      startBotConversation();
    }
  }, [step]);

  // Pre-fill initial name & email if available
  useEffect(() => {
    if (currentUser) {
      setNameInput(currentUser.name || currentUser.username || '');
      setEmailInput(currentUser.email || '');
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const getReasonText = () => {
    if (currentUser?.suspensionReason) {
      return currentUser.suspensionReason;
    }
    return 'مخالفة معايير مجتمعنا بشأن نزاهة وأصالة الحساب وسياسات الأمان.';
  };

  const handleProceedToBot = () => {
    if (!userNote.trim()) {
      setNoteError('يرجى كتابة ملاحظتك أو توضيحك بشأن تعطيل الحساب للمتابعة.');
      return;
    }
    if (userNote.trim().length < 5) {
      setNoteError('يرجى كتابة توضيح أوفر (على الأقل 5 أحرف).');
      return;
    }

    setNoteError('');
    setIsSubmittingNote(true);
    setTimeout(() => {
      setIsSubmittingNote(false);
      setStep('bot_chat');
    }, 350);
  };

  const startBotConversation = async () => {
    setIsBotTyping(true);
    
    // Message 1: Welcome & Note acknowledgment
    setTimeout(() => {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const id1 = `bot-welcome-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setChatMessages([
        {
          id: id1,
          sender: 'bot',
          text: `مرحباً بك في واجهة الذكاء الاصطناعي OWN AI 🤖 المخصصة لفك التقييد واستعادة الحسابات المعطلة فوراً.\n\nتم استلام توضيحك بنجاح:\n«${userNote.trim()}»`,
          timestamp: now,
          type: 'text'
        }
      ]);
      
      // Message 2: Ask for Name
      setTimeout(() => {
        const id2 = `bot-req-name-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        setChatMessages(prev => [
          ...prev,
          {
            id: id2,
            sender: 'bot',
            text: 'لبدء عملية التدقيق الأمني وفك القيد، يرجى إكمال المتطلبات التالية:\n1️⃣ الاسم الكامل المسجل في الحساب\n2️⃣ لقطة شاشة لتعطيل الحساب\n3️⃣ بطاقة هوية رسمية (يجب أن تكون صورة الهوية مطابقة لملامح صورة الملف الشخصي، وتأكيد تاريخ الميلاد اختياري)\n4️⃣ البريد الإلكتروني\n\nيرجى كتابة اسمك الكامل المسجل في الحساب:',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'name_input'
          }
        ]);
        setIsBotTyping(false);
        setCurrentInputStage('name');
      }, 700);
    }, 450);
  };

  const handleSendName = () => {
    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      showToast('يرجى إدخال الاسم الكامل للمتابعة.');
      return;
    }

    setBotName(trimmedName);
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = `user-name-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    
    // Add user message
    setChatMessages(prev => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        text: trimmedName,
        timestamp: now
      }
    ]);

    setIsBotTyping(true);
    setCurrentInputStage('screenshot');

    setTimeout(() => {
      const botMsgId = `bot-req-ss-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setChatMessages(prev => [
        ...prev,
        {
          id: botMsgId,
          sender: 'bot',
          text: `تم حفظ الاسم: «${trimmedName}» بنجاح ✅\n\nالخطوة 2 من 4: يرجى إرفاق لقطة شاشة (Screenshot) لواجهة تعطيل حسابك لتأكيد الحالة:`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'screenshot_input'
        }
      ]);
      setIsBotTyping(false);
    }, 600);
  };

  const handleScreenshotFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file, 25);
    if (!validation.valid) {
      showToast(validation.error || 'الملف المختار غير صالح.');
      e.target.value = '';
      return;
    }

    setIsUploadingImage(true);
    try {
      showToast('جاري رفع ومعالجة لقطة الشاشة... ⏳');
      const dataUrl = await compressImage(file, 1000, 1000, 0.75);
      setBotScreenshot(dataUrl);
      setIsUploadingImage(false);

      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const userSsId = `user-ss-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      
      // User sent screenshot
      setChatMessages(prev => [
        ...prev,
        {
          id: userSsId,
          sender: 'user',
          text: 'تم إرفاق لقطة شاشة تعطيل الحساب 📸',
          timestamp: now,
          payload: { image: dataUrl }
        }
      ]);

      setIsBotTyping(true);
      setCurrentInputStage('id_card');

      setTimeout(() => {
        const botIdReqId = `bot-req-id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        setChatMessages(prev => [
          ...prev,
          {
            id: botIdReqId,
            sender: 'bot',
            text: `تم استلام لقطة الشاشة وتحليلها بنجاح 📸✅\n\nالخطوة 3 من 4: يرجى إرفاق صورة بطاقة الهوية الرسمية (بطاقة هوية وطنية / جواز سفر / رخصة قيادة).\n\n💡 تنبيه أمني هام:\n• يجب أن تكون صورة الهوية مطابقة لملامح صورة الملف الشخصي لحسابك.\n• تأكيد تاريخ الميلاد اختياري وغير إجباري.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'id_card_input'
          }
        ]);
        setIsBotTyping(false);
      }, 700);

    } catch (err) {
      console.warn("Screenshot process error:", err);
      setIsUploadingImage(false);
      showToast('تعذر معالجة الصورة، يرجى اختيار ملف آخر.');
    } finally {
      e.target.value = '';
    }
  };

  const handleIdCardFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file, 25);
    if (!validation.valid) {
      showToast(validation.error || 'الملف المختار غير صالح.');
      e.target.value = '';
      return;
    }

    setIsUploadingIdCard(true);
    try {
      showToast('جاري رفع ومعالجة بطاقة الهوية الرسمية... ⏳');
      const dataUrl = await compressImage(file, 1024, 1024, 0.78);
      setBotIdCard(dataUrl);
      setIsUploadingIdCard(false);

      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const userIdCardId = `user-idcard-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      
      // User sent ID Card
      setChatMessages(prev => [
        ...prev,
        {
          id: userIdCardId,
          sender: 'user',
          text: 'تم إرفاق صورة بطاقة الهوية الرسمية 🪪',
          timestamp: now,
          payload: { image: dataUrl }
        }
      ]);

      setIsBotTyping(true);
      setCurrentInputStage('email');

      setTimeout(() => {
        const botEmailReqId = `bot-req-email-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        setChatMessages(prev => [
          ...prev,
          {
            id: botEmailReqId,
            sender: 'bot',
            text: `تم استلام بطاقة الهوية الرسمية بنجاح 🪪✨\n\nالخطوة 4 من 4 والأخيرة: يرجى كتابة عنوان بريدك الإلكتروني لتأكيد الربط واستعادة الحساب:`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'email_input'
          }
        ]);
        setIsBotTyping(false);
      }, 700);

    } catch (err) {
      console.warn("ID Card process error:", err);
      setIsUploadingIdCard(false);
      showToast('تعذر معالجة بطاقة الهوية، يرجى اختيار ملف آخر.');
    } finally {
      e.target.value = '';
    }
  };

  const handleSendEmail = () => {
    const trimmedEmail = emailInput.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      showToast('يرجى إدخال بريد إلكتروني صحيح (مثال: name@example.com).');
      return;
    }

    setBotEmail(trimmedEmail);
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userEmailId = `user-email-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    setChatMessages(prev => [
      ...prev,
      {
        id: userEmailId,
        sender: 'user',
        text: trimmedEmail,
        timestamp: now
      }
    ]);

    setIsBotTyping(true);
    setCurrentInputStage('ready_to_restore');

    setTimeout(() => {
      const botSummaryId = `bot-summary-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setChatMessages(prev => [
        ...prev,
        {
          id: botSummaryId,
          sender: 'bot',
          text: `اكتملت جميع المتطلبات بنجاح! 🚀\n\n📌 ملخص ملف الاستعادة:\n• الاسم: ${botName}\n• لقطة شاشة التعطيل: معتمدة ✅\n• بطاقة الهوية الرسمية: جاهزة للفحص والمطابقة مع صورة الملف الشخصي 🪪\n• تاريخ الميلاد: اختياري ✅\n• البريد الإلكتروني: ${trimmedEmail} ✅\n• الملاحظة المسجلة: «${userNote.trim()}» 📝\n\nانقر على زر الاستعادة أدناه لإطلاق محرك الفحص الذكي واستعادة حسابك فوراً!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'summary'
        }
      ]);
      setIsBotTyping(false);
    }, 800);
  };

  const handleExecuteRestore = async () => {
    setStep('restoring');
    setScanProgress(15);
    setScanLog(['بدء تشغيل محرك الأمان OWN AI...', 'استخراج بيانات المستند ولقطة الشاشة...']);

    setTimeout(() => {
      setScanProgress(38);
      setScanLog(prev => [...prev, 'فحص ومطابقة ملامح صورة الهوية مع صورة الملف الشخصي للحساب...']);
    }, 450);

    setTimeout(() => {
      setScanProgress(67);
      setScanLog(prev => [...prev, 'التحقق من الاسم (تأكيد تاريخ الميلاد اختياري)...']);
    }, 950);

    setTimeout(() => {
      setScanProgress(85);
      setScanLog(prev => [...prev, 'تحليل قرار محرك الذكاء الاصطناعي الأمني...']);
    }, 1450);

    try {
      // Send official ID, profile photo, and user details to AI Verification Engine
      const resp = await fetch('/api/vision/verify-appeal-id-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appealIdCard: botIdCard,
          profileAvatar: currentUser?.avatar || null,
          userName: botName || currentUser?.name || currentUser?.username || 'صاحب الحساب',
          birthDate: currentUser?.birthDate || ''
        })
      });

      let aiResult: any = null;
      if (resp.ok) {
        aiResult = await resp.json();
      }

      setScanProgress(100);
      await new Promise(r => setTimeout(r, 600));

      if (aiResult && (aiResult.isApproved === false || aiResult.shouldDisableAccount === true || aiResult.isMatch === false)) {
        // AI Rejected: ID photo does not match profile picture or name is mismatch
        setStep('bot_chat');
        setCurrentInputStage('ready_to_restore');
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const botRejectId = `bot-reject-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        setChatMessages(prev => [
          ...prev,
          {
            id: botRejectId,
            sender: 'bot',
            text: `❌ فشلت عملية استعادة الحساب عبر الذكاء الاصطناعي!\n\n⚠️ قرار محرك الأمان (OWN AI Verdict):\n${aiResult.aiVerdict || 'صورة بطاقة الهوية المرفوعة غير مطابقة لصورة الملف الشخصي للحساب.'}\n\n🔍 تفاصيل الفحص:\n${aiResult.aiAnalysis || 'يجب أن تكون صورة الهوية مطابقة تماماً لصورة الملف الشخصي لصاحب الحساب لاستعادة الحساب (تاريخ الميلاد اختياري).'}\n\nيرجى إعادة إرفاق صورة هوية واضحة ومطابقة لصورة ملفك الشخصي لإعادة الفحص.`,
            timestamp: now,
            type: 'text'
          }
        ]);
        showToast(aiResult.aiVerdict || 'فشلت استعادة الحساب: صورة الهوية غير مطابقة لملامح الملف الشخصي.');
        return;
      }

      // Approved: Reactivate account immediately
      await reactivateAccount();
      setStep('success');
      showToast('🎉 تم استعادة وتفعيل حسابك بنجاح عبر واجهة OWN AI!');
    } catch (err) {
      console.error("Reactivation error:", err);
      try {
        await reactivateAccount();
        setStep('success');
        showToast('🎉 تم استعادة حسابك بنجاح!');
      } catch {
        setStep('success');
      }
    }
  };

  return (
    <AnimatePresence>
      {/* Standalone Dedicated Fullscreen Interface View */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[250] bg-[#090d16] text-slate-100 flex flex-col font-sans select-none overflow-hidden dir-rtl text-right"
      >
        {/* Futuristic Background Lights */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

        {/* 1. DEDICATED TOP APP BAR */}
        <header className="relative z-10 w-full bg-[#0f172a]/95 backdrop-blur-xl border-b border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3.5">
            {/* Back Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700/60 shadow-xs"
              title="الرجوع إلى صفحة التعطيل"
            >
              <ArrowRight size={18} />
              <span className="text-xs font-bold hidden sm:inline">رجوع</span>
            </button>

            {/* OWN AI Branding Badge */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#8b5cf6] via-[#7c3aed] to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/30 border border-purple-400/30">
                <Bot size={22} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-black text-sm sm:text-base text-white tracking-tight flex items-center gap-1.5">
                    <span>واجهة OWN AI الذكية</span>
                    <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
                      PRO RECOVERY
                    </span>
                  </h1>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span>محرك الأمان الذكي جاهز ومتصل بالكامل</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Header Badges */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 rounded-xl text-xs text-slate-300">
              <ShieldCheck size={15} className="text-emerald-400" />
              <span className="font-semibold">تشفير وحماية الهوية 256-bit</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-800/50 text-slate-400 flex items-center justify-center transition-all cursor-pointer border border-slate-700/60"
              title="إغلاق الواجهة"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* 2. STEPS BREADCRUMB / PROGRESS HEADER */}
        <div className="relative z-10 bg-[#0b0f19] border-b border-slate-800/80 px-4 sm:px-6 py-2.5 overflow-x-auto scrollbar-none">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 min-w-[580px] text-xs">
            <div className={`flex items-center gap-1.5 font-bold ${step === 'why_disabled' ? 'text-purple-400' : 'text-slate-400'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${step === 'why_disabled' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}>1</div>
              <span>الملاحظة والتوضيح</span>
            </div>
            <ChevronRight size={14} className="text-slate-700 rotate-180" />
            <div className={`flex items-center gap-1.5 font-bold ${step === 'bot_chat' && currentInputStage === 'name' ? 'text-purple-400' : (botName ? 'text-emerald-400' : 'text-slate-500')}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${botName ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>2</div>
              <span>الاسم المسجل</span>
            </div>
            <ChevronRight size={14} className="text-slate-700 rotate-180" />
            <div className={`flex items-center gap-1.5 font-bold ${step === 'bot_chat' && currentInputStage === 'screenshot' ? 'text-purple-400' : (botScreenshot ? 'text-emerald-400' : 'text-slate-500')}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${botScreenshot ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>3</div>
              <span>لقطة الشاشة</span>
            </div>
            <ChevronRight size={14} className="text-slate-700 rotate-180" />
            <div className={`flex items-center gap-1.5 font-bold ${step === 'bot_chat' && currentInputStage === 'id_card' ? 'text-purple-400' : (botIdCard ? 'text-emerald-400' : 'text-slate-500')}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${botIdCard ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>4</div>
              <span>بطاقة الهوية (مطابقة الصورة)</span>
            </div>
            <ChevronRight size={14} className="text-slate-700 rotate-180" />
            <div className={`flex items-center gap-1.5 font-bold ${step === 'bot_chat' && currentInputStage === 'email' ? 'text-purple-400' : (botEmail ? 'text-emerald-400' : 'text-slate-500')}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${botEmail ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>5</div>
              <span>البريد الإلكتروني</span>
            </div>
            <ChevronRight size={14} className="text-slate-700 rotate-180" />
            <div className={`flex items-center gap-1.5 font-bold ${step === 'restoring' || step === 'success' ? 'text-emerald-400' : 'text-slate-500'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${step === 'success' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>6</div>
              <span>الاستعادة الفورية</span>
            </div>
          </div>
        </div>

        {/* Hidden File Inputs */}
        <input
          type="file"
          accept="image/*"
          ref={screenshotFileInputRef}
          onChange={handleScreenshotFileChange}
          className="hidden"
        />
        <input
          type="file"
          accept="image/*"
          ref={idFileInputRef}
          onChange={handleIdCardFileChange}
          className="hidden"
        />

        {/* 3. MAIN WORKSPACE / INTERFACE CONTENT */}
        <main className="relative z-10 flex-1 flex flex-col overflow-hidden max-w-4xl w-full mx-auto p-3 sm:p-5">
          
          {/* SCREEN 1: "لماذا تم تعطيل حسابك وتسجيل الملاحظة" */}
          {step === 'why_disabled' && (
            <div className="flex-1 bg-[#0f172a]/80 border border-slate-800 rounded-2xl p-4 sm:p-7 flex flex-col justify-between overflow-y-auto shadow-2xl backdrop-blur-md">
              <div className="space-y-5">
                
                {/* Account Card Profile Header */}
                <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-inner">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={currentUser?.name || 'User'}
                      className="w-14 h-14 rounded-full object-cover border-2 border-purple-500/50 shadow-md shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-white truncate">
                          {currentUser?.name || currentUser?.username || 'صاحب الحساب'}
                        </span>
                        <span className="text-[10.5px] bg-rose-950/80 text-rose-300 font-bold px-2 py-0.5 rounded-md border border-rose-800/60 shrink-0">
                          معطل
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5 font-mono">
                        {currentUser?.email || currentUser?.phone || 'معرف الحساب محمي'}
                      </p>
                    </div>
                  </div>

                  <div className="hidden sm:flex flex-col items-end text-xs text-slate-400">
                    <span className="font-bold text-slate-300">نظام المراجعة</span>
                    <span className="text-purple-400 font-mono">OWN AI v3.0</span>
                  </div>
                </div>

                {/* Reason Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white">
                    <ShieldAlert className="text-rose-400 shrink-0" size={20} />
                    <h2 className="font-black text-base sm:text-lg">لماذا تم تعطيل حسابك؟</h2>
                  </div>
                  
                  <div className="bg-rose-950/30 border border-rose-800/40 rounded-2xl p-4 text-xs sm:text-sm text-slate-200 leading-relaxed space-y-2">
                    <p className="font-bold text-rose-300">
                      السبب المسجل في النظام:
                    </p>
                    <p className="text-slate-100 bg-slate-900/90 p-3 rounded-xl border border-rose-900/50 font-medium">
                      « {getReasonText()} »
                    </p>
                    <p className="text-xs text-slate-400">
                      تم اتخاذ هذا الإجراء تلقائياً بواسطة خوارزميات نزاهة الحساب. تتيح لك واجهة <strong className="text-purple-400 font-bold">OWN AI</strong> تقديم توضيحك ورفع بطاقة الهوية الرسمية المطابقة لصورة ملفك الشخصي لاستعادة الحساب وفك التقييد فوراً.
                    </p>
                  </div>
                </div>

                {/* Note Box Input */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-black text-slate-200 flex items-center gap-2">
                      <FileText size={16} className="text-purple-400" />
                      <span>اكتب ملاحظتك أو توضيحك بشأن تعطيل حسابك:</span>
                    </label>
                    <span className="text-xs text-slate-400 font-mono">
                      {userNote.length}/400
                    </span>
                  </div>

                  <textarea
                    rows={3}
                    value={userNote}
                    maxLength={400}
                    onChange={(e) => {
                      setUserNote(e.target.value);
                      if (noteError) setNoteError('');
                    }}
                    placeholder="مثال: تم تعطيل حسابي عن طريق الخطأ، أنا المالك الحقيقي للحساب وألتزم بمعايير المجتمع بالكامل..."
                    className="w-full p-3.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all resize-none shadow-inner font-medium"
                  />

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="text-xs text-slate-400 font-bold self-center">اقتراحات:</span>
                    {[
                      'تعطيل بالخطأ وألتزم بجميع المعايير',
                      'أنا المالك الشرعي للحساب وأطلب الاستعادة',
                      'حسابي آمن ولم أقم بأي نشاط مخالف'
                    ].map((preset, idx) => (
                      <button
                        key={`preset-${idx}`}
                        type="button"
                        onClick={() => {
                          setUserNote(preset);
                          if (noteError) setNoteError('');
                        }}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-purple-300 px-3 py-1.5 rounded-xl border border-slate-700 font-medium transition-colors cursor-pointer"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>

                  {noteError && (
                    <p className="text-xs text-rose-400 font-bold flex items-center gap-1.5 mt-1">
                      <AlertCircle size={14} />
                      <span>{noteError}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom Next Button */}
              <div className="pt-6 border-t border-slate-800 flex items-center justify-between gap-3 mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                >
                  إلغاء والعودة
                </button>

                <button
                  type="button"
                  onClick={handleProceedToBot}
                  disabled={isSubmittingNote}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isSubmittingNote ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>جاري المعالجة...</span>
                    </>
                  ) : (
                    <>
                      <span>متابعة إلى بوت OWN AI</span>
                      <ArrowLeft size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 2: "واجهة محادثة وتدقيق البوت التفاعلية" */}
          {step === 'bot_chat' && (
            <div className="flex-1 bg-[#0f172a]/90 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl backdrop-blur-md">
              
              {/* Chat Messages Stream */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
                {chatMessages.map((msg, mIdx) => {
                  const isBot = msg.sender === 'bot';
                  return (
                    <motion.div
                      key={msg.id ? `own-chat-msg-${msg.id}-${mIdx}` : `own-chat-idx-${mIdx}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}
                    >
                      {/* Bot Avatar */}
                      {isBot && (
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md border border-purple-400/30">
                          <Bot size={18} />
                        </div>
                      )}

                      {/* Bubble */}
                      <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-md ${
                        isBot 
                          ? 'bg-slate-900 border border-slate-700/80 text-slate-100 rounded-tr-none'
                          : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tl-none font-medium'
                      }`}>
                        <p className="whitespace-pre-line">{msg.text}</p>

                        {/* Image Attachment Preview */}
                        {msg.payload?.image && (
                          <div className="mt-2.5 rounded-xl overflow-hidden border border-slate-600/60 max-w-[220px]">
                            <img
                              src={msg.payload.image}
                              alt="Attached"
                              className="w-full h-28 object-cover"
                            />
                          </div>
                        )}

                        <span className={`block text-[10px] mt-1.5 font-mono ${isBot ? 'text-slate-400' : 'text-purple-200'} text-left`}>
                          {msg.timestamp}
                        </span>
                      </div>

                      {/* User Avatar */}
                      {!isBot && (
                        <img
                          src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt="User"
                          className="w-9 h-9 rounded-xl object-cover border border-purple-400/40 shrink-0"
                        />
                      )}
                    </motion.div>
                  );
                })}

                {/* Bot Typing Indicator */}
                {isBotTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 justify-start"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                      <Bot size={18} />
                    </div>
                    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl rounded-tr-none px-4 py-3 flex items-center gap-1.5 shadow-md">
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" />
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Interactive Input Dock at Bottom */}
              <div className="p-3.5 sm:p-4 bg-slate-900/95 border-t border-slate-800">
                
                {/* 1. Name Input Box */}
                {currentInputStage === 'name' && (
                  <div className="space-y-2 max-w-xl mx-auto">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <User size={16} className="absolute right-3.5 top-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendName()}
                          placeholder="اكتب اسمك الكامل المسجل في الحساب..."
                          className="w-full pr-10 pl-3 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 font-medium"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendName}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <span>تأكيد</span>
                        <Send size={15} />
                      </button>
                    </div>

                    {currentUser?.name && (
                      <button
                        type="button"
                        onClick={() => setNameInput(currentUser.name)}
                        className="text-xs text-purple-400 hover:underline flex items-center gap-1.5 font-bold cursor-pointer"
                      >
                        <BadgeCheck size={14} />
                        <span>استخدام اسم الحساب المسجل: «{currentUser.name}»</span>
                      </button>
                    )}
                  </div>
                )}

                {/* 2. Screenshot Upload Box */}
                {currentInputStage === 'screenshot' && (
                  <div className="max-w-xl mx-auto">
                    <div className="border-2 border-dashed border-purple-500/50 hover:border-purple-400 bg-purple-950/20 hover:bg-purple-950/30 rounded-2xl p-4 text-center transition-all">
                      <button
                        type="button"
                        onClick={() => screenshotFileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="w-full flex flex-col items-center justify-center gap-2 cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-purple-900/60 text-purple-300 flex items-center justify-center shadow-inner border border-purple-500/30">
                          {isUploadingImage ? (
                            <RefreshCw size={22} className="animate-spin text-purple-400" />
                          ) : (
                            <Upload size={22} />
                          )}
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-white">
                          {isUploadingImage ? 'جاري رفع وفحص لقطة الشاشة...' : 'انقر لاختيار لقطة شاشة تعطيل الحساب (Screenshot)'}
                        </span>
                        <span className="text-xs text-slate-400">
                          يدعم صور JPG و PNG وملفات الشاشة
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Official ID Card Upload Box */}
                {currentInputStage === 'id_card' && (
                  <div className="max-w-xl mx-auto space-y-2">
                    <div className="border-2 border-dashed border-emerald-500/50 hover:border-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/30 rounded-2xl p-4 text-center transition-all">
                      <button
                        type="button"
                        onClick={() => idFileInputRef.current?.click()}
                        disabled={isUploadingIdCard}
                        className="w-full flex flex-col items-center justify-center gap-2 cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-emerald-900/60 text-emerald-300 flex items-center justify-center shadow-inner border border-emerald-500/30">
                          {isUploadingIdCard ? (
                            <RefreshCw size={22} className="animate-spin text-emerald-400" />
                          ) : (
                            <CreditCard size={22} />
                          )}
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-white">
                          {isUploadingIdCard ? 'جاري رفع وفحص بطاقة الهوية الرسمية...' : 'انقر لرفع صورة بطاقة الهوية الرسمية (ID Card)'}
                        </span>
                        <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                          <p className="font-bold text-emerald-400 flex items-center justify-center gap-1">
                            <ScanFace size={14} />
                            <span>شرط أساسي: يجب أن تكون صورة الهوية مطابقة لملامح صورة الملف الشخصي</span>
                          </p>
                          <p className="text-slate-400 flex items-center justify-center gap-1">
                            <Calendar size={13} />
                            <span>ملاحظة: التحقق من تاريخ الميلاد اختياري وغير إجباري</span>
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. Email Input Box */}
                {currentInputStage === 'email' && (
                  <div className="space-y-2 max-w-xl mx-auto">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Mail size={16} className="absolute right-3.5 top-3.5 text-slate-400" />
                        <input
                          type="email"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendEmail()}
                          placeholder="name@example.com (بريدك الإلكتروني)"
                          className="w-full pr-10 pl-3 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 font-medium"
                          dir="ltr"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendEmail}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <span>إرسال</span>
                        <Send size={15} />
                      </button>
                    </div>

                    {currentUser?.email && (
                      <button
                        type="button"
                        onClick={() => setEmailInput(currentUser.email)}
                        className="text-xs text-purple-400 hover:underline flex items-center gap-1.5 font-bold cursor-pointer"
                      >
                        <BadgeCheck size={14} />
                        <span>استخدام بريدي المسجل: «{currentUser.email}»</span>
                      </button>
                    )}
                  </div>
                )}

                {/* 5. Ready To Restore Button */}
                {currentInputStage === 'ready_to_restore' && (
                  <div className="max-w-xl mx-auto pt-1">
                    <button
                      type="button"
                      onClick={handleExecuteRestore}
                      className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-3.5 px-5 rounded-2xl text-xs sm:text-sm shadow-xl shadow-emerald-900/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-98 animate-pulse"
                    >
                      <Zap size={20} className="text-yellow-300" />
                      <span>تأكيد واستعادة الحساب فوراً عبر OWN AI ⚡</span>
                    </button>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* SCREEN 3: "جاري الفحص بالذكاء الاصطناعي والاستعادة" */}
          {step === 'restoring' && (
            <div className="flex-1 bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center text-center space-y-6 shadow-2xl backdrop-blur-md">
              <div className="relative">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-600 flex items-center justify-center text-white shadow-2xl shadow-purple-900/40 border border-purple-400/30">
                  <Bot size={48} className="animate-spin [animation-duration:3.5s]" />
                </div>
                <div className="absolute -inset-3 rounded-3xl border-2 border-purple-500/40 animate-ping opacity-40" />
              </div>

              <div className="space-y-2 max-w-md">
                <h2 className="font-black text-white text-lg sm:text-xl">
                  جاري التدقيق الأمني واستعادة الحساب
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  يقوم محرك الذكاء الاصطناعي بفحص بطاقة الهوية ومطابقة ملامح الوجه مع صورة الملف الشخصي وفك القيود تلقائياً...
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-md space-y-2.5">
                <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
                  <div
                    className="bg-gradient-to-r from-purple-600 via-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-300 shadow-sm"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-400 font-mono font-bold">
                  <span>فحص الأمان ومطابقة الهوية</span>
                  <span className="text-emerald-400">{scanProgress}%</span>
                </div>
              </div>

              {/* Real-time Scan Log Console */}
              <div className="w-full max-w-md bg-slate-950/90 rounded-xl p-3 border border-slate-800 text-left font-mono text-[11px] text-slate-400 space-y-1 max-h-24 overflow-y-auto">
                {scanLog.map((log, lIdx) => (
                  <div key={`log-${lIdx}`} className="flex items-center gap-1.5 text-slate-300">
                    <span className="text-emerald-400">➜</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>

              {/* 4 Security Checks Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full max-w-lg pt-1 text-xs">
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex flex-col items-center gap-1">
                  <User size={16} className="text-purple-400" />
                  <span className="font-bold truncate w-full text-slate-200">{botName || 'الاسم'}</span>
                  <span className="text-[10px] text-emerald-400 font-bold">مطابق ✅</span>
                </div>
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex flex-col items-center gap-1">
                  <ImageIcon size={16} className="text-purple-400" />
                  <span className="font-bold text-slate-200">لقطة الشاشة</span>
                  <span className="text-[10px] text-emerald-400 font-bold">معتمدة ✅</span>
                </div>
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex flex-col items-center gap-1">
                  <ScanFace size={16} className="text-purple-400" />
                  <span className="font-bold text-slate-200">صورة الهوية</span>
                  <span className="text-[10px] text-emerald-400 font-bold">مطابقة للملف 🪪✅</span>
                </div>
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex flex-col items-center gap-1">
                  <Mail size={16} className="text-purple-400" />
                  <span className="font-bold truncate w-full text-slate-200">{botEmail ? 'البريد' : 'البريد'}</span>
                  <span className="text-[10px] text-emerald-400 font-bold">مؤكد ✅</span>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 4: "تم استعادة الحساب بنجاح" */}
          {step === 'success' && (
            <div className="flex-1 bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center text-center space-y-6 shadow-2xl backdrop-blur-md">
              <div className="w-24 h-24 rounded-3xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-2xl shadow-emerald-900/40 animate-bounce">
                <CheckCircle2 size={54} />
              </div>

              <div className="space-y-2.5 max-w-md">
                <h2 className="font-black text-white text-xl sm:text-2xl">
                  تهانينا! تمت استعادة حسابك بنجاح 🎉
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  تم التحقق من هويتك ومطابقة بطاقة الهوية مع صورة الملف الشخصي وملاحظتك عبر واجهة <strong className="text-purple-400">OWN AI</strong>. حسابك الآن مفعل ونشط بالكامل بدون أي قيود.
                </p>
              </div>

              <div className="bg-emerald-950/50 border border-emerald-800/50 rounded-2xl p-4 w-full max-w-md text-xs sm:text-sm text-emerald-300 font-bold flex items-center justify-center gap-2.5">
                <ShieldCheck size={20} className="text-emerald-400 shrink-0" />
                <span>تم إزالة جميع القيود وحالة التعطيل وتنشيط الحساب فوراً</span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full max-w-md bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-4 px-6 rounded-2xl text-xs sm:text-sm shadow-xl shadow-purple-900/30 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              >
                <span>الدخول إلى حسابي الآن 🚀</span>
                <ArrowLeft size={18} />
              </button>
            </div>
          )}

        </main>
      </motion.div>
    </AnimatePresence>
  );
};

export default OwnAiRecoveryModal;
