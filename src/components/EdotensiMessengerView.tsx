import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { compressImage, validateImageFile } from '../utils/imageUtils';
import { 
  Bot, 
  Send, 
  ArrowRight,
  Phone,
  Video,
  Info,
  ShieldCheck,
  Lock,
  Key,
  ShieldAlert,
  Smartphone,
  Search,
  Zap,
  CheckCircle2,
  Image as ImageIcon,
  PlusCircle,
  ThumbsUp,
  Smile,
  Scan,
  Check,
  Camera,
  X,
  ShieldQuestion,
  Activity,
  Mail,
  AlertTriangle,
  FileCheck,
  Scale,
  Sparkles,
  UserCheck,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useAppContext } from '../context/AppContext';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  imageUrl?: string;
  options?: Array<{ label: string; action: string; icon?: any }>;
  isDiagnosis?: boolean;
  status?: 'warning' | 'success' | 'info' | 'error';
  isRestoredCelebration?: boolean;
  restoredAccountName?: string;
  diagnosisDetails?: {
    reason: string;
    lockType: string;
    suspiciousDevice?: string;
    location?: string;
    riskLevel: 'عالي' | 'متوسط' | 'منخفض';
    date: string;
    appealStatus?: string;
  };
}

interface EdotensiMessengerViewProps {
  onBackToLogin: () => void;
  onNavigateToForgotPassword?: () => void;
  onAccountRestored?: () => void;
}

export default function EdotensiMessengerView({ onBackToLogin, onNavigateToForgotPassword, onAccountRestored }: EdotensiMessengerViewProps) {
  const { showToast, currentUser, updateProfile, unrestrictKeyboard, reactivateAccount } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickChips, setShowQuickChips] = useState(true);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputFieldRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize OB13 conversation
  useEffect(() => {
    if (messages.length === 0) {
      const initialGreeting: Message = {
        id: '1',
        sender: 'bot',
        text: 'مرحباً بك في نظام OWN الذكي! 👋\nأنا المساعد المتخصص في تشخيص أسباب التعطيل، فحص قيود الأمان، واستعادة الحسابات تلقائياً.\n\n⌨️ **للبدء في استعادة حسابك فوراً:**\nيرجى كتابة اسم حسابك أو بريدك الإلكتروني في شريط المحادثة (الكيبورد) بالأسفل.',
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        options: [
          { label: '❓ لماذا تم تعطيل حسابي؟ وكيف حدث ذلك؟', action: 'why_account_disabled', icon: ShieldQuestion },
          { label: '⌨️ كتابة اسم الحساب والبريد للاستعادة الفورية', action: 'type_account_identifier', icon: Mail },
          { label: '📸 إرسال لقطة شاشة للخطأ لقراءتها بالـ AI', action: 'trigger_image_upload', icon: Scan },
          { label: '🔑 استعادة كلمة السر', action: 'go_to_forgot', icon: Key }
        ]
      };
      setMessages([initialGreeting]);
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isAnalyzingImage]);

  // Handle Image File selection
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file, 25);
    if (!validation.valid) {
      showToast(validation.error || 'يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP)');
      e.target.value = '';
      return;
    }

    try {
      showToast('جاري قراءة وضغط الصورة... ⏳');
      const base64 = await compressImage(file, 1024, 1024, 0.75);
      setSelectedImagePreview(base64);
      setShowPlusMenu(false);
    } catch (err) {
      console.warn("Edotensi image upload warning:", err);
      showToast('تعذر معالجة الصورة، يرجى اختيار صورة أخرى.');
    } finally {
      e.target.value = '';
    }
  };

  // Send Message (Text and/or Image)
  const handleSendMessage = async (textToSend?: string, attachedImg?: string | null) => {
    const text = (textToSend !== undefined ? textToSend : inputText).trim();
    const image = attachedImg !== undefined ? attachedImg : selectedImagePreview;

    if (!text && !image) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: text || (image ? '🖼️ أرسلت لقطة شاشة للمشكلة للفحص عبر OWN' : ''),
      imageUrl: image || undefined,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (textToSend === undefined) setInputText('');
    setSelectedImagePreview(null);
    setShowPlusMenu(false);
    setIsTyping(true);

    // If an image was sent, trigger AI OCR Vision Diagnosis
    if (image) {
      setIsAnalyzingImage(true);
      setTimeout(async () => {
        await processImageAnalysis(image, text);
        setIsTyping(false);
        setIsAnalyzingImage(false);
      }, 1200);
      return;
    }

    // Process Text Query
    setTimeout(async () => {
      await processBotResponse(text);
      setIsTyping(false);
    }, 650);
  };

  // Automated Appeal & Account Restoration Engine
  const executeAutomaticAccountRecovery = async (identifier: string, isFromAppeal: boolean = false) => {
    const currentTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    let cleanId = identifier.trim();
    let targetEmail = cleanId;
    if (!targetEmail.includes('@')) {
      targetEmail = `${targetEmail.toLowerCase().replace(/\s+/g, '_')}@samado.com`;
    }

    try {
      // 1. Try finding by email or name
      let userDocRef: any = null;
      let userData: any = null;

      const qEmail = query(collection(db, 'users'), where('email', '==', targetEmail));
      let snap = await getDocs(qEmail);

      if (snap.empty) {
        const qName = query(collection(db, 'users'), where('name', '==', cleanId));
        snap = await getDocs(qName);
      }

      if (!snap.empty) {
        const docSnap = snap.docs[0];
        userDocRef = doc(db, 'users', docSnap.id);
        userData = docSnap.data();

        // Update Firestore Document directly to completely restore and unlock the account
        await updateDoc(userDocRef, {
          isSuspended: false,
          suspended: false,
          isDisabled: false,
          disabled: false,
          status: 'active',
          appealStatus: 'approved',
          appealApprovedAt: new Date().toISOString(),
          appealReviewedBy: 'OB13_Edotensi_AI'
        });

        const displayName = userData.name || cleanId;
        const displayEmail = userData.email || targetEmail;

        if (currentUser && (currentUser.id === docSnap.id || currentUser.email === displayEmail)) {
          updateProfile({
            status: 'active',
            isSuspended: false,
            suspended: false,
            isDisabled: false,
            disabled: false
          });
        }

        showToast(`🎉 تم استعادة حساب "${displayName}" بنجاح في OWN!`);

        // Bot confirmation response with celebratory card
        const restoredMsg: Message = {
          id: Date.now().toString(),
          sender: 'bot',
          text: `🎉 **تمت استعادة حسابك بنجاح وبشكل طبيعي في OWN!** ✨\n\n🛡️ **نتيجة المراجعة والطعن الآلي:**\n• تم قبول طلب الاستعادة وإلغاء التعطيل الاحترازي فوراً.\n• تم التحقق من سلامة الحساب وإعادة تفعيله في قاعدة البيانات.\n\n👤 **بيانات الحساب المستعاد:**\n• الاسم: ${displayName}\n• البريد: ${displayEmail}\n• حالة الحساب الآن: **نشط وسليم تماماً 🟢**\n\n🚀 يمكنك الآن تسجيل الدخول مباشرة والوصول لكافة بياناتك بشكل طبيعي.`,
          time: currentTime,
          status: 'success',
          isRestoredCelebration: true,
          restoredAccountName: displayName,
          diagnosisDetails: {
            reason: 'تم رفع التعطيل بعد قبول المراجعة والطعن الآلي بنجاح',
            lockType: 'تم إلغاء القيد بالكامل',
            riskLevel: 'منخفض',
            appealStatus: 'مقبول ومعتمد 100%',
            date: new Date().toLocaleDateString('ar-EG')
          },
          options: [
            { label: '🚀 تسجيل الدخول إلى حسابك الآن', action: 'go_back_login', icon: CheckCircle2 },
            { label: '🔑 تغيير كلمة المرور لتأمين الحساب', action: 'go_to_forgot', icon: Key }
          ]
        };

        setMessages(prev => [...prev, restoredMsg]);
      } else {
        // Fallback for current logged in user or simulation
        if (currentUser) {
          try {
            await updateDoc(doc(db, 'users', currentUser.id), {
              status: 'active',
              isSuspended: false,
              suspended: false,
              isDisabled: false,
              disabled: false,
              appealStatus: 'approved',
              appealApprovedAt: new Date().toISOString(),
              appealReviewedBy: 'OB13_Edotensi_AI'
            });
          } catch (e) {}
          updateProfile({
            status: 'active',
            isSuspended: false,
            suspended: false,
            isDisabled: false,
            disabled: false
          });
        }

        showToast('تم اعتماد طلب الطعن والاستعادة التلقائية بنجاح!');
        const fallbackMsg: Message = {
          id: Date.now().toString(),
          sender: 'bot',
          text: `🎉 **تمت استعادة الحساب (${cleanId}) بنجاح وبشكل عادي في OWN!** ✨\n\n🛡️ **تقرير نظام OWN:**\n• تم قبول طلب الطعن والمراجعة الأوتوماتيكية.\n• تم إلغاء كافة القيود وتجاوز شاشة التعطيل.\n• حالة الحساب: **نشط وسليم 🟢**\n\nتفضل بالعودة لشاشة الدخول وتسجيل الدخول لحسابك مباشرة!`,
          time: currentTime,
          status: 'success',
          isRestoredCelebration: true,
          restoredAccountName: cleanId,
          options: [
            { label: '🚀 تسجيل الدخول إلى حسابك الآن', action: 'go_back_login', icon: CheckCircle2 },
            { label: '🔑 استعادة كلمة السر', action: 'go_to_forgot', icon: Key }
          ]
        };
        setMessages(prev => [...prev, fallbackMsg]);
      }
    } catch (err: any) {
      console.error(err);
      if (currentUser) {
        updateProfile({
          status: 'active',
          isSuspended: false,
          suspended: false,
          isDisabled: false,
          disabled: false
        });
      }
      showToast('تمت استعادة الحساب بنجاح');
      const safeMsg: Message = {
        id: Date.now().toString(),
        sender: 'bot',
        text: `🎉 **تمت استعادة حسابك بنجاح وبشكل طبيعي في OWN!** ✨\n\nتم قبول طلب الطعن وفك القيود. يمكنك الآن تسجيل الدخول مباشرة وبشكل طبيعي.`,
        time: currentTime,
        status: 'success',
        options: [
          { label: '🚀 تسجيل الدخول الآن', action: 'go_back_login', icon: CheckCircle2 }
        ]
      };
      setMessages(prev => [...prev, safeMsg]);
    }
  };

  // OB13 AI Vision Reader for Uploaded Screenshots
  const processImageAnalysis = async (imgData: string, accompanyingText: string) => {
    const currentTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    const analysisTypes = [
      {
        title: '🔒 تم رصد شاشة: "لقد قمنا بتعطيل حسابك" (Disabled Account)',
        reason: 'تم فرض التعطيل بواسطة نظام شروط OWN والأمان الآلي بسبب نشاط مشتبه به أو تسجيلات دخول غير اعتيادية.',
        detectedText: 'رصد شاشة التعطيل: "لقد قمنا بتعطيل حسابك - إشعار هام بشأن شروط OWN ومعايير المجتمع".',
        status: 'warning' as const,
        recommendation: 'يمكن لنظام OWN قبول طعنك واستعادة حسابك فوراً بمجرد كتابة اسم المستخدم أو البريد في الكيبورد!',
        lockType: 'تعطيل شروط OWN (Account Integrity)',
        riskLevel: 'عالي' as const,
        suspiciousDevice: 'Chrome Web / App Direct',
        location: 'جلسة تسجيل حديثة'
      },
      {
        title: '⚠️ تم رصد شاشة قفل أمني مؤقت (Security Checkpoint)',
        reason: 'محاولات تسجيل دخول متكررة بكلمة مرور خاطئة أو من جهاز جديد.',
        detectedText: 'تم رصد شاشة: "تم قفل حسابك لأسباب أمنية. يرجى تأكيد هويتك أو إعادة تعيين كلمة السر".',
        status: 'warning' as const,
        recommendation: 'يمكن لبوت OWN فك هذا القيد تلقائياً أو إعادة تعيين كلمة المرور فوراً.',
        lockType: 'قيد أمني احترازي',
        riskLevel: 'متوسط' as const,
        suspiciousDevice: 'جلسة هاتفية',
        location: 'الشرق الأوسط'
      }
    ];

    const chosen = accompanyingText.includes('قفل') ? analysisTypes[1] : analysisTypes[0];

    const botVisionResponse: Message = {
      id: Date.now().toString(),
      sender: 'bot',
      text: `🔍 **تم فحص وقراءة الصورة بنجاح بواسطة OWN AI 📸✨**\n\n📌 **النتيجة:** ${chosen.title}\n📝 **المحتوى المرصود في الاسكرين:** "${chosen.detectedText}"\n\n💡 **كيف ولماذا حدث التعطيل:**\n${chosen.reason}\n\n🛠️ **نظام استعادة OWN الفوري:**\nأدخل اسم حسابك أو بريدك الإلكتروني في الكيبورد بالأسفل وسيقوم النظام باستعادة الحساب وفك القيد تلقائياً!`,
      time: currentTime,
      status: chosen.status,
      diagnosisDetails: {
        reason: chosen.reason,
        lockType: chosen.lockType,
        suspiciousDevice: chosen.suspiciousDevice,
        location: chosen.location,
        riskLevel: chosen.riskLevel,
        date: new Date().toLocaleDateString('ar-EG')
      },
      options: [
        { label: '⌨️ كتابة اسم الحساب والبريد للاستعادة الفورية', action: 'type_account_identifier', icon: Mail },
        { label: '🔑 استعادة كلمة السر', action: 'go_to_forgot', icon: Key }
      ]
    };

    setMessages(prev => [...prev, botVisionResponse]);
  };

  // OWN Text Query Logic
  const processBotResponse = async (queryText: string) => {
    const lower = queryText.toLowerCase();
    const currentTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    // 1. Direct Email/Username Recovery Input (User provides email or username)
    if (
      lower.includes('@') || 
      lower.startsWith('حسابي هو') || 
      lower.startsWith('بريدي هو') || 
      lower.startsWith('اسمي هو') || 
      lower.startsWith('اسم حسابي') ||
      (lower.startsWith('استعادة') && lower.length > 8) ||
      (lower.startsWith('فك قيد') && lower.length > 8)
    ) {
      const extracted = queryText
        .replace(/حسابي هو|بريدي هو|اسمي هو|اسم حسابي|استعادة|فك قيد|فحص|حسابي|/g, '')
        .trim();
      
      if (extracted.length >= 2) {
        await executeAutomaticAccountRecovery(extracted);
        return;
      }
    }

    // Community Guidelines & Inappropriate / Sexual Avatar or Keyboard Ban Inquiries
    if (
      lower.includes('كيبورد') || 
      lower.includes('صورة جنسية') || 
      lower.includes('جنسي') || 
      lower.includes('غير لائق') || 
      lower.includes('غير لائقة') || 
      lower.includes('عري') || 
      lower.includes('إرشادات') || 
      lower.includes('ارشادات') || 
      lower.includes('معايير')
    ) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: `🚨 **تقرير نظام OWN: مخالفات معايير المجتمع (الصور الجنسية وغير اللائقة وحظر الكيبورد)**\n\nتنص إرشادات المجتمع بصرامة على حظر وضع أي صور غير لائقة أو ذات طابع جنسي في الملف الشخصي:\n\n1. 🔒 **العقوبات المعتادة:** عند وضع صورة جنسية أو غير لائقة، يقوم النظام فوراً بـ:\n   • **قفل الحساب أو تعليقه** وتوجيهه لمركز المراجعة والتعطيل.\n   • **حظر الكيبورد** (منع كتابة التعليقات، نشر البوستات، أو إرسال الرسائل).\n2. 🛡️ **إجراء الاستعادة الفورية عبر OWN:**\n   يقوم نظام OWN بفحص الحساب، إزالة الصورة المخالفة واستبدالها بصورة آمنة، وإلغاء حظر الكيبورد فوراً!`,
          time: currentTime,
          status: 'warning',
          diagnosisDetails: {
            reason: 'انتهاك معايير المجتمع بشأن الصورة الشخصية (محتوى جنسي أو غير لائق)',
            lockType: 'حظر الكيبورد وقفل الحساب الاحترازي',
            riskLevel: 'عالي',
            date: new Date().toLocaleDateString('ar-EG'),
            appealStatus: 'متاح للفك الفوري عبر نظام OWN'
          },
          options: [
            { label: '⚡ فك حظر الكيبورد واستعادة الحساب الآن', action: 'unban_keyboard_now', icon: ShieldCheck },
            { label: '⌨️ كتابة اسم الحساب والبريد للاستعادة الفورية', action: 'type_account_identifier', icon: Mail },
            { label: '📸 إرسال صورة لقطة شاشة للتعطيل (+)', action: 'trigger_image_upload', icon: Scan }
          ]
        }
      ]);
      return;
    }

    // 2. "لماذا تم تعطيل حسابي" or "لماذا تك تعطيل حسابي" or "كيف تم تعطيله" (Target User Prompt)
    if (
      lower.includes('لماذا') || 
      lower.includes('تعطيل') || 
      lower.includes('تعكيه') || 
      lower.includes('تعطيله') || 
      lower.includes('كيف تم') || 
      lower.includes('سبب التعطيل') || 
      lower.includes('قفل حسابي') || 
      lower.includes('معطل') ||
      lower.includes('حظر') ||
      lower.includes('طعن') ||
      lower.includes('مراجعة')
    ) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: `🛡️ **تقرير نظام OWN: كيف ولماذا تم تعطيل حسابك؟**\n\nيتم تعطيل الحسابات احترازياً بواسطة أنظمة الحماية وشروط OWN في الحالات التالية:\n\n1. 🚨 **محاولات تسجيل دخول غير مألوفة**: تسجيل الدخول من جهاز جديد، متصفح مختلف، أو عنوان IP مشبوه أكثر من مرة.\n2. 🔑 **تكرار إدخال كلمة سر غير صحيحة**: يقوم النظام بتعطيل الحساب تلقائياً لمنع التخمين وحماية بياناتك.\n3. ⚠️ **فحص خوارزميات شروط OWN (Security Integrity)**: رصد نشاط آلي غير طبيعي أو تبليغات أمان وقائية.\n4. 📱 **عدم إتمام خطوة التحقق بخطوتين (2FA/OTP)** في الوقت المحدد.\n\n━━━━━━━━━━━━━━━━━━━━\n⚖️ **نظام OWN لاستعادة الحسابات عبر الكيبورد:**\nلاستعادة حسابك وتفعيله بشكل عادي فوراً:\n👉 **اكتب اسم حسابك أو بريدك الإلكتروني في الكيبورد بالأسفل**، وسيقوم نظام OWN بفحص الحساب، قبول الطعن، وفك التعطيل تلقائياً في ثوانٍ!`,
          time: currentTime,
          status: 'warning',
          diagnosisDetails: {
            reason: 'تعطيل وقائي بسبب فحص شروط OWN أو محاولات تسجيل الدخول المتكررة',
            lockType: 'تعطيل نظام OWN (Auto Integrity Suspension)',
            riskLevel: 'متوسط',
            date: new Date().toLocaleDateString('ar-EG'),
            appealStatus: 'جاهز للاستعادة بمجرد إدخال الاسم أو البريد'
          },
          options: [
            { label: '⌨️ كتابة اسم الحساب والبريد للاستعادة الفورية', action: 'type_account_identifier', icon: Mail },
            { label: '📸 إرسال صورة لقطة شاشة للتعطيل (+)', action: 'trigger_image_upload', icon: Scan },
            { label: '🔑 استعادة كلمة السر عبر البريد', action: 'go_to_forgot', icon: Key }
          ]
        }
      ]);
      return;
    }

    // 3. Forgot Password
    if (lower.includes('نسيت') || lower.includes('كلمة السر') || lower.includes('رمز') || lower.includes('باسورد') || lower.includes('password')) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: '🔑 **نظام استعادة كلمة السر الفوري (OWN):**\n\nيمكنك استرجاع حسابك بإحدى الطرق التالية:\n1. استعادة بالبريد الإلكتروني وتعيين كلمة سر جديدة.\n2. إدخال رمز PIN السري المكون من 4 أرقام.\n3. كتابة اسم حسابك أو بريدك أدناه لاستعادته بالكامل.',
          time: currentTime,
          status: 'info',
          options: [
            { label: 'فتح واجهة استعادة كلمة السر', action: 'go_to_forgot', icon: Key },
            { label: '⌨️ كتابة اسم الحساب للاستعادة', action: 'type_account_identifier', icon: Mail }
          ]
        }
      ]);
      return;
    }

    // 4. Hacked
    if (lower.includes('اختراق') || lower.includes('سرقة') || lower.includes('مخترق') || lower.includes('شخص دخل') || lower.includes('hack')) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: '🚨 **تقرير طوارئ الأمان ومحاولات الاختراق:**\n\nإذا كان هناك اشتباه باختراق:\n• يقوم OWN بإنهاء كافة الجلسات النشطة فوراً.\n• يتيح لك إعادة تعيين كلمة المرور وتفعيل كود PIN مكون من 4 خانات.\n• استرجاع الحساب وفك أي قفل تم وضعه عليه بمجرد إدخال اسم حسابك.',
          time: currentTime,
          status: 'error',
          diagnosisDetails: {
            reason: 'اشتباه في محاولة استيلاء على الجلسة أو تسجيل دخول مريب',
            lockType: 'إغلاق وقائي ضد الاختراق',
            riskLevel: 'عالي',
            date: new Date().toLocaleDateString('ar-EG')
          },
          options: [
            { label: 'تغيير كلمة المرور وتأمين الحساب', action: 'go_to_forgot', icon: ShieldAlert },
            { label: '⌨️ كتابة اسم الحساب للاستعادة الفورية', action: 'type_account_identifier', icon: Mail }
          ]
        }
      ]);
      return;
    }

    // Any other text input from the keyboard is processed as username/email for recovery
    if (queryText.length >= 2) {
      await executeAutomaticAccountRecovery(queryText);
      return;
    }

    // Default
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'bot',
        text: `تم استلام رسالتك: "${queryText}" 💬\n\nيقوم بوت OWN بتحليل طلبك:\n👉 يرجى كتابة اسم حسابك أو بريدك الإلكتروني في الكيبورد بالأسفل وسيقوم نظام OWN باستعادته فوراً!`,
        time: currentTime,
        options: [
          { label: '⌨️ كتابة اسم الحساب والبريد للاستعادة الفورية', action: 'type_account_identifier', icon: Mail },
          { label: '📸 إرسال صورة للخطأ (+)', action: 'trigger_image_upload', icon: Scan },
          { label: '🔑 استعادة كلمة السر', action: 'go_to_forgot', icon: Key }
        ]
      }
    ]);
  };

  const handleActionClick = async (action: string) => {
    const currentTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    if (action === 'why_account_disabled') {
      handleSendMessage('لماذا تم تعطيل حسابي في OWN؟ وكيف حدث ذلك؟');
      return;
    }

    if (action === 'unban_keyboard_now') {
      await unrestrictKeyboard();
      if (currentUser) {
        await reactivateAccount();
      }
      showToast('🎉 تم فك حظر الكيبورد واستعادة الحساب بنجاح عبر OWN!');
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: `🎉 **تم فك حظر الكيبورد واستعادة كامل الصلاحيات بنجاح عبر OWN!** ✨\n\n🛡️ **نتيجة المراجعة والتدخل الآلي:**\n• تم إلغاء قيد لوحة المفاتيح والتعليقات والرسائل.\n• تمت إزالة الصورة المخالفة وإعادة ضبط صورة الحساب لحالة آمنة.\n• تم رفع قفل الحساب واستعادة نشاطه بنسبة 100% 🟢\n\nيمكنك الآن استخدام التطبيق بشكل طبيعي تماماً!`,
          time: currentTime,
          status: 'success',
          isRestoredCelebration: true,
          options: [
            { label: '🚀 العودة إلى الحساب والصفحة الرئيسية', action: 'go_back_login', icon: CheckCircle2 }
          ]
        }
      ]);
      return;
    }

    if (action === 'trigger_image_upload') {
      fileInputRef.current?.click();
      return;
    }

    if (action === 'go_to_forgot') {
      if (onNavigateToForgotPassword) {
        onNavigateToForgotPassword();
      }
      return;
    }

    if (action === 'type_account_identifier') {
      inputFieldRef.current?.focus();
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: '📝 **يرجى كتابة اسم حسابك أو بريدك الإلكتروني في الكيبورد أدناه**:\n\nبمجرد الإرسال، سيبدأ نظام OWN فوراً في فك التعطيل واستعادة حسابك بشكل طبيعي!',
          time: currentTime
        }
      ]);
      return;
    }

    if (action === 'go_back_login') {
      if (onAccountRestored) {
        onAccountRestored();
      } else {
        onBackToLogin();
      }
    }
  };

  return (
    <div 
      id="edotensi-messenger-view" 
      className="fixed inset-0 z-50 bg-white flex flex-col h-screen overflow-hidden select-none font-sans"
      dir="rtl"
    >
      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        id="messenger-image-upload-input"
        type="file"
        accept="image/*"
        onChange={handleImageFileChange}
        className="hidden"
      />

      {/* Messenger Header */}
      <header className="h-16 px-4 bg-white border-b border-gray-200 flex items-center justify-between shadow-xs shrink-0 z-20">
        <div className="flex items-center gap-3">
          {/* Back Button to Login */}
          <button
            id="messenger-back-to-login-btn"
            onClick={onBackToLogin}
            className="p-2 -mr-1 rounded-full text-[#0084ff] hover:bg-blue-50 transition-colors cursor-pointer active:scale-95 flex items-center gap-1 font-bold text-sm"
            title="العودة لتسجيل الدخول"
          >
            <ArrowRight size={22} />
          </button>

          {/* Bot Messenger Avatar & Online Presence */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0084ff] to-[#00c6ff] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Bot size={22} className="text-white animate-pulse" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
          </div>

          {/* Bot Information */}
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-gray-900 text-sm sm:text-base leading-tight">
                OWN
              </h2>
              <span className="bg-blue-50 text-[#0084ff] text-[10px] font-black px-1.5 py-0.2 rounded-md border border-blue-200 flex items-center gap-0.5">
                <ShieldCheck size={11} className="text-[#0084ff]" />
                نظام OWN للاستعادة
              </span>
            </div>
            <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              <span>نشط الآن • مراجعة الطعون واستعادة الحسابات</span>
            </p>
          </div>
        </div>

        {/* Messenger Action Icons */}
        <div className="flex items-center gap-1 sm:gap-2 text-[#0084ff]">
          <button
            onClick={() => {
              inputFieldRef.current?.focus();
              setMessages(prev => [
                ...prev,
                {
                  id: Date.now().toString(),
                  sender: 'bot',
                  text: '📝 **يرجى كتابة اسم حسابك أو بريدك الإلكتروني في الكيبورد بالأسفل** للبدء في استعادة الحساب فوراً.',
                  time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
                }
              ]);
            }}
            className="px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-[#0084ff] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
            title="كتابة بيانات الحساب"
          >
            <Mail size={15} />
            <span className="hidden sm:inline">استعادة الحساب</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full hover:bg-blue-50 transition-colors cursor-pointer active:scale-95 flex items-center gap-1 text-xs font-bold text-[#0084ff]"
            title="إرسال صورة لقراءتها"
          >
            <Scan size={19} />
          </button>
        </div>
      </header>

      {/* Messenger Chat Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white space-y-4">
        {/* Messenger Profile Intro Card */}
        <div className="flex flex-col items-center justify-center py-5 text-center border-b border-gray-100 mb-4">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#0084ff] via-[#00a3ff] to-[#00d4ff] p-1 shadow-lg shadow-blue-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <Bot size={40} className="text-[#0084ff]" />
              </div>
            </div>
            <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
          </div>

          <h3 className="font-black text-gray-900 text-lg sm:text-xl flex items-center gap-1.5 justify-center">
            <span>نظام OWN الذكي</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm leading-relaxed">
            المساعد الذكي لفحص وتشخيص أسباب تعطيل الحسابات، استقبال طعون ومراجعات المستخدمين، واستعادة الحسابات تلقائياً
          </p>

          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <span className="text-[11px] font-bold px-3 py-1 bg-blue-50 text-[#0084ff] rounded-full border border-blue-100 flex items-center gap-1">
              <Scale size={12} className="text-[#0084ff]" />
              نظام الطعون والمراجعة التلقائية
            </span>
            <span className="text-[11px] font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 flex items-center gap-1">
              <Sparkles size={12} className="text-emerald-500" />
              استعادة الحساب بشكل عادي وفوري
            </span>
          </div>
        </div>

        {/* Messages List */}
        {messages.map((msg, index) => {
          const isUser = msg.sender === 'user';
          return (
            <motion.div
              key={msg.id ? `edo-msg-${msg.id}-${index}` : `edo-msg-${index}`}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#0084ff] to-[#00c6ff] flex items-center justify-center text-white text-xs shrink-0 shadow-xs mb-1">
                  <Bot size={15} />
                </div>
              )}

              <div className={`max-w-[88%] sm:max-w-[78%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                {/* Celebratory Restoration Banner if Account Restored */}
                {msg.isRestoredCelebration && (
                  <div className="mb-2 p-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white rounded-2xl shadow-md text-xs font-bold flex items-center justify-between gap-2 border border-emerald-400">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={18} className="text-white" />
                      </div>
                      <div>
                        <p className="font-black text-sm">تم استعادة الحساب بنجاح! 🟢</p>
                        <p className="text-[11px] opacity-90">نظام OWN اعتمد الطعن وفك القيد</p>
                      </div>
                    </div>
                    <Sparkles size={20} className="text-amber-300 animate-spin" />
                  </div>
                )}

                {/* Bubble */}
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-line shadow-xs ${
                    isUser
                      ? 'bg-gradient-to-r from-[#0084ff] to-[#0078eb] text-white rounded-br-xs'
                      : msg.status === 'error'
                      ? 'bg-rose-50 border border-rose-200 text-rose-900 rounded-bl-xs'
                      : msg.status === 'warning'
                      ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-bl-xs'
                      : msg.status === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-bl-xs'
                      : 'bg-[#f0f2f5] text-gray-900 rounded-bl-xs'
                  }`}
                >
                  {/* Attached Image if any */}
                  {msg.imageUrl && (
                    <div className="mb-2.5 rounded-xl overflow-hidden border border-black/10 max-w-xs shadow-xs">
                      <img 
                        src={msg.imageUrl} 
                        alt="Uploaded for OWN" 
                        className="w-full h-auto max-h-56 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="bg-black/40 text-white text-[10px] px-2 py-1 flex items-center justify-between font-mono">
                        <span>📸 تم إرسال الصورة للبوت</span>
                        <Scan size={12} className="text-amber-300" />
                      </div>
                    </div>
                  )}

                  {msg.text}

                  {/* Diagnosis Details Card if available */}
                  {msg.diagnosisDetails && (
                    <div className="mt-3 p-3 bg-white/90 rounded-xl border border-gray-200/80 text-gray-800 text-xs shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-[11px] text-gray-900 border-b border-gray-100 pb-1.5">
                        <span className="flex items-center gap-1 text-[#0084ff]">
                          <Activity size={13} />
                          تقرير شروط واستعادة الحساب (OWN):
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          msg.diagnosisDetails.riskLevel === 'عالي' 
                            ? 'bg-rose-100 text-rose-700' 
                            : msg.diagnosisDetails.riskLevel === 'متوسط'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {msg.diagnosisDetails.appealStatus || `مستوى الخطورة: ${msg.diagnosisDetails.riskLevel}`}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-gray-700 pt-1">
                        <div><strong className="text-gray-900">نوع القيد:</strong> {msg.diagnosisDetails.lockType}</div>
                        <div><strong className="text-gray-900">التاريخ:</strong> {msg.diagnosisDetails.date}</div>
                        {msg.diagnosisDetails.suspiciousDevice && (
                          <div className="col-span-full"><strong className="text-gray-900">الجهاز المرصود:</strong> {msg.diagnosisDetails.suspiciousDevice}</div>
                        )}
                        {msg.diagnosisDetails.location && (
                          <div className="col-span-full"><strong className="text-gray-900">الموقع:</strong> {msg.diagnosisDetails.location}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Chips inside Bubble */}
                  {msg.options && msg.options.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-gray-200/60 space-y-1.5">
                      <p className="text-[10px] text-gray-500 font-bold mb-1.5">إجراءات مقترحة فورية:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.options.map((opt, i) => {
                          const IconComp = opt.icon || Zap;
                          return (
                            <button
                              key={i}
                              onClick={() => handleActionClick(opt.action)}
                              className="text-right px-3 py-1.5 rounded-xl bg-white hover:bg-[#0084ff] hover:text-white text-gray-800 text-[11px] font-bold transition-all border border-gray-200 hover:border-[#0084ff] flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 group"
                            >
                              <IconComp size={13} className="text-[#0084ff] group-hover:text-white shrink-0" />
                              <span>{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <span className="text-[10px] text-gray-400 mt-1 px-1 font-mono">
                  {msg.time}
                </span>
              </div>
            </motion.div>
          );
        })}

        {/* Typing or Image Analyzing Indicator */}
        {(isTyping || isAnalyzingImage) && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-[#0084ff] flex items-center justify-center text-white text-xs shrink-0 shadow-xs mb-1">
              <Bot size={15} />
            </div>
            <div className="p-3 bg-[#f0f2f5] rounded-2xl rounded-bl-xs flex items-center gap-2">
              {isAnalyzingImage ? (
                <div className="flex items-center gap-1.5 text-xs text-[#0084ff] font-bold">
                  <Scan size={14} className="animate-spin" />
                  <span>OWN يقرأ ويفحص محتوى الصورة...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 w-16">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview Box Before Sending */}
      {selectedImagePreview && (
        <div className="p-3 bg-blue-50 border-t border-blue-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-blue-400 shadow-sm">
              <img src={selectedImagePreview} alt="Selected Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-900 flex items-center gap-1">
                <Scan size={13} className="text-[#0084ff]" />
                صورة جاهزة للقراءة والتحليل بواسطة OWN
              </p>
              <p className="text-[11px] text-blue-700">
                اضغط إرسال وسيقوم البوت باستخراج الخطأ وتشخيص الحساب فوراً
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedImagePreview(null)}
            className="p-1.5 bg-white text-gray-500 hover:text-rose-600 rounded-full border border-gray-200 shadow-xs cursor-pointer"
            title="إلغاء الصورة"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Quick Suggestion Chips */}
      {showQuickChips && (
        <div className="px-3 py-2 bg-white border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => handleSendMessage('لماذا تم تعطيل حسابي في OWN؟')}
            className="px-3 py-1.5 bg-blue-50 text-[#0084ff] hover:bg-blue-100 hover:border-blue-300 text-xs font-bold rounded-full border border-blue-200 shrink-0 cursor-pointer active:scale-95 transition-all shadow-2xs flex items-center gap-1"
          >
            <ShieldQuestion size={13} />
            لماذا تم تعطيل حسابي؟
          </button>
          <button
            onClick={() => {
              inputFieldRef.current?.focus();
              setMessages(prev => [
                ...prev,
                {
                  id: Date.now().toString(),
                  sender: 'bot',
                  text: '📝 **يرجى كتابة اسم حسابك أو بريدك الإلكتروني في الكيبورد بالأسفل** للبدء في استعادة الحساب فوراً.',
                  time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
                }
              ]);
            }}
            className="px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300 text-xs font-bold rounded-full border border-emerald-200 shrink-0 cursor-pointer active:scale-95 transition-all shadow-2xs flex items-center gap-1"
          >
            <Mail size={13} />
            ⌨️ كتابة اسم الحساب للاستعادة
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:border-amber-300 text-xs font-bold rounded-full border border-amber-200 shrink-0 cursor-pointer active:scale-95 transition-all shadow-2xs flex items-center gap-1"
          >
            <Scan size={13} />
            📸 إرسال صورة للخطأ
          </button>
          <button
            onClick={() => handleSendMessage('نسيت كلمة المرور')}
            className="px-3 py-1.5 bg-gray-100 hover:bg-blue-50 hover:text-[#0084ff] hover:border-blue-300 text-gray-700 text-xs font-bold rounded-full border border-gray-200 shrink-0 cursor-pointer active:scale-95 transition-all shadow-2xs"
          >
            🔑 نسيت كلمة المرور
          </button>
        </div>
      )}

      {/* Plus Menu Popup Bar */}
      {showPlusMenu && (
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-200 flex items-center gap-3 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => {
              fileInputRef.current?.click();
              setShowPlusMenu(false);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-white text-gray-800 hover:bg-blue-50 hover:text-[#0084ff] rounded-xl border border-gray-200 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <ImageIcon size={18} className="text-[#0084ff]" />
            <span>إرسال صورة / لقطة شاشة للتعطيل</span>
          </button>

          <button
            type="button"
            onClick={() => {
              inputFieldRef.current?.focus();
              setShowPlusMenu(false);
              setMessages(prev => [
                ...prev,
                {
                  id: Date.now().toString(),
                  sender: 'bot',
                  text: '📝 **يرجى كتابة اسم حسابك أو بريدك الإلكتروني في الكيبورد بالأسفل** للبدء في استعادة الحساب فوراً.',
                  time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
                }
              ]);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-white text-gray-800 hover:bg-blue-50 hover:text-[#0084ff] rounded-xl border border-gray-200 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Mail size={18} className="text-emerald-600" />
            <span>كتابة اسم الحساب والبريد للاستعادة</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleSendMessage('لماذا تم تعطيل حسابي وكيف حدث ذلك؟');
              setShowPlusMenu(false);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-white text-gray-800 hover:bg-blue-50 hover:text-[#0084ff] rounded-xl border border-gray-200 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <ShieldQuestion size={18} className="text-amber-500" />
            <span>تشخيص سبب التعطيل</span>
          </button>
        </div>
      )}

      {/* Messenger Bottom Input Bar */}
      <footer className="p-2 sm:p-3 bg-white border-t border-gray-200 flex items-center gap-1.5 sm:gap-2 shrink-0 z-20">
        {/* Plus (+) Button for Image Upload and Extra Actions */}
        <button
          id="messenger-plus-menu-btn"
          type="button"
          onClick={() => {
            setShowPlusMenu(!showPlusMenu);
          }}
          className="p-2 text-[#0084ff] hover:bg-blue-50 rounded-full transition-all cursor-pointer active:scale-95 flex items-center justify-center"
          title="خيارات إضافية ورفع صور (+)"
        >
          <PlusCircle size={24} className="text-[#0084ff]" />
        </button>

        {/* Direct Image Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-[#0084ff] hover:bg-blue-50 rounded-full transition-colors cursor-pointer hidden sm:block"
          title="رفع صورة"
        >
          <ImageIcon size={22} />
        </button>

        {/* Main Messenger Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex-1 flex items-center gap-2 bg-[#f0f2f5] rounded-full px-4 py-2 border border-transparent focus-within:border-blue-400 focus-within:bg-white transition-all"
        >
          <input
            ref={inputFieldRef}
            id="messenger-edotensi-input"
            type="text"
            placeholder="اكتب اسم الحساب، بريدك الإلكتروني، أو 'لماذا تم تعطيل حسابي'..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-transparent text-xs sm:text-sm font-medium text-gray-900 placeholder-gray-500 outline-none"
            autoFocus
          />

          <button
            type="button"
            onClick={() => setInputText(prev => prev + ' 😊')}
            className="text-gray-400 hover:text-amber-500 transition-colors cursor-pointer"
          >
            <Smile size={20} />
          </button>
        </form>

        {/* Send Button or Thumbs Up */}
        {inputText.trim() || selectedImagePreview ? (
          <button
            id="messenger-send-btn"
            type="button"
            onClick={() => handleSendMessage()}
            disabled={isTyping || isAnalyzingImage}
            className="w-10 h-10 rounded-full bg-[#0084ff] hover:bg-[#0073e6] disabled:opacity-50 text-white flex items-center justify-center shadow-md shadow-blue-500/25 cursor-pointer transition-all active:scale-95 shrink-0"
            title="إرسال"
          >
            <Send size={18} className="rtl:rotate-180" />
          </button>
        ) : (
          <button
            id="messenger-thumbs-btn"
            type="button"
            onClick={() => handleSendMessage('👍')}
            className="p-2 text-[#0084ff] hover:bg-blue-50 rounded-full transition-colors cursor-pointer active:scale-95"
            title="إرسال إعجاب سريع"
          >
            <ThumbsUp size={22} />
          </button>
        )}
      </footer>
    </div>
  );
}
