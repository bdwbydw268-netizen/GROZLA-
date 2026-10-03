import { compressImage, validateImageFile } from '../utils/imageUtils';
import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Edit2, Pencil, UserPlus, UserCheck, UserMinus, Clock, Video, Users, 
  Grid, Ban, X, AlertTriangle, MoreHorizontal, MessageSquare, MessageCircle, Plus, Image as ImageIcon, 
  Lock, Globe, Trash2, Repeat, CheckCircle2, Layers, Sparkles, ChevronDown, MapPin, 
  Home as HomeIcon, Cake, Heart, Music, Search, Menu as MenuIcon, PlusCircle, Briefcase, 
  GraduationCap, Shield, Copy, Eye, Activity, Share2, Check, Bookmark, Settings, Info,
  Flame, Radio, Smile, Compass, AlertCircle, ChevronRight, ChevronLeft, Clapperboard, ShieldAlert,
  ShieldCheck, Flag, Download, Cloud, Play, Pause, Volume2, Archive, Hash, Calendar,
  Palette, RefreshCw
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import Feed from './Feed';
import CreatePost from './CreatePost';
import { motion, AnimatePresence } from 'motion/react';
import AccountsCenterModal from './AccountsCenterModal';
import { 
  evaluateProfilePhotoSafety, 
  calculateEnforcementAction, 
  PhotoReviewResult, 
  FACEBOOK_COMMUNITY_STANDARDS, 
  CommunityViolationCategory 
} from '../utils/photoSafetyReview';
import { ProfileCommunityStandardsModal, ReportProfilePhotoModal } from './ProfileCommunityStandardsModal';
import { CoverPhotoModal } from './CoverPhotoModal';
import { DEFAULT_AVATAR, DEFAULT_COVER } from '../constants/avatar';
import StoryMusicSelector from './StoryMusicSelector';
import { Song } from '../constants/music';
import AiImagePickerModal from './AiImagePickerModal';

const AI_BOT_AVATAR_PRESETS = [
  {
    id: 'ai-default',
    title: 'الافتراضي الأرجواني',
    url: 'https://ui-avatars.com/api/?name=OWN+AI&background=6366f1&color=fff'
  },
  {
    id: 'ai-neon-waves',
    title: 'خيال نيون رقمي',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'ai-cyber-robot',
    title: 'روبوت سيبراني',
    url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'ai-neural-mesh',
    title: 'الشبكة العصبية',
    url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'ai-cosmic-bot',
    title: 'ذكاء كوني',
    url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'ai-cyber-avatar',
    title: 'مساعد مستقبلي',
    url: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=400&auto=format&fit=crop&q=80'
  }
];

const AI_BOT_COVER_PRESETS = [
  {
    id: 'ai-cover-purple-studio',
    title: 'استوديو الإنتاج والموسيقى البنفسجي 🎹',
    url: '/profile_studio_cover.jpg'
  },
  {
    id: 'ai-cover-default',
    title: 'خيال رقمي أرجواني',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80'
  },
  {
    id: 'ai-cover-space',
    title: 'الفضاء والشبكة العالمية',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80'
  },
  {
    id: 'ai-cover-matrix',
    title: 'الماتريكس والأكواد الخضراء',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80'
  },
  {
    id: 'ai-cover-cyberpunk',
    title: 'سايبربنك نيون مستقبلي',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80'
  }
];

export default function Profile() {
  const { 
    users, 
    posts,
    currentUser, 
    viewUserId, 
    updateProfile,
    updateAiBotProfile,
    updateUserNote,
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    unfriend,
    setCurrentView,
    setActiveChat,
    addPost,
    blockUser,
    unblockUser,
    reportUser,
    updatePhotoPrivacy,
    deletePhotoFromHistory,
    createSubProfile,
    switchSubProfile,
    deleteSubProfile,
    restrictKeyboard,
    unrestrictKeyboard,
    enforceCommunityViolation,
    enforceProfilePhotoViolation
  } = useAppContext();

  const [showViolationModal, setShowViolationModal] = useState<boolean>(false);
  const [violationCandidateImg, setViolationCandidateImg] = useState<string | null>(null);
  const [violationResultDetails, setViolationResultDetails] = useState<PhotoReviewResult | null>(null);
  const [isEvaluatingAvatar, setIsEvaluatingAvatar] = useState<boolean>(false);

  // Facebook Community Standards & Profile Photo Safety Modals
  const [showCommunityStandardsModal, setShowCommunityStandardsModal] = useState<boolean>(false);
  const [selectedStandardCategory, setSelectedStandardCategory] = useState<CommunityViolationCategory>('sexual_activity');
  const [showReportPhotoModal, setShowReportPhotoModal] = useState<boolean>(false);
  const [showAvatarOptionsModal, setShowAvatarOptionsModal] = useState<boolean>(false);
  const [showAvatarViewerModal, setShowAvatarViewerModal] = useState<boolean>(false);
  const [showDeleteAvatarConfirm, setShowDeleteAvatarConfirm] = useState<boolean>(false);
  const [showCoverModal, setShowCoverModal] = useState<boolean>(false);
  const [showAiAvatarPickerModal, setShowAiAvatarPickerModal] = useState<boolean>(false);

  // 3-Second Lock Countdown System upon changing/setting profile photo
  const [lockCountdown, setLockCountdown] = useState<number | null>(null);
  const [lockCountdownProgress, setLockCountdownProgress] = useState<number>(100);
  const [lockCountdownData, setLockCountdownData] = useState<{
    title: string;
    message: string;
    avatarUrl?: string;
    isViolating?: boolean;
    reason?: string;
  } | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (lockCountdown !== null && lockCountdown > 0) {
      timer = setTimeout(() => {
        setLockCountdown(prev => (prev !== null ? prev - 1 : null));
        setLockCountdownProgress(prev => Math.max(0, prev - 33.3));
      }, 1000);
    } else if (lockCountdown === 0) {
      const executeLock = async () => {
        if (lockCountdownData?.isViolating) {
          await enforceProfilePhotoViolation({
            reason: lockCountdownData.reason,
            candidateImg: lockCountdownData.avatarUrl
          });
        } else {
          await enforceProfilePhotoViolation({
            reason: '🔒 تم قفل الحساب احترازياً فور وضع صورة الملف الشخصي الجديدة للمراجعة الأمنية وتأكيد الهوية.',
            candidateImg: lockCountdownData?.avatarUrl
          });
        }
      };
      executeLock();
    }
    return () => clearTimeout(timer);
  }, [lockCountdown, lockCountdownData]);

    const [aiRejectModal, setAiRejectModal] = useState<boolean>(false);
const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ 
    name: '', 
    nickname: '', 
    bio: '', 
    birthDate: '', 
    birthDatePrivacy: 'public' as 'public' | 'friends' | 'only_me',
    pin: '' 
  });

  // Birth Date System Helpers
  const calculateAge = (dateString?: string) => {
    if (!dateString) return null;
    const birth = new Date(dateString);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  const getZodiacSign = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    const day = date.getDate();
    const month = date.getMonth() + 1;

    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return { name: 'الحمل', emoji: '♈' };
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return { name: 'الثور', emoji: '♉' };
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return { name: 'الجوزاء', emoji: '♊' };
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return { name: 'السرطان', emoji: '♋' };
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return { name: 'الأسد', emoji: '♌' };
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return { name: 'العذراء', emoji: '♍' };
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return { name: 'الميزان', emoji: '♎' };
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return { name: 'العقرب', emoji: '♏' };
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return { name: 'القوس', emoji: '♐' };
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return { name: 'الجدي', emoji: '♑' };
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return { name: 'الدلو', emoji: '♒' };
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return { name: 'الحوت', emoji: '♓' };
    return null;
  };

  const formatArabicDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const monthsArabic = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return `${date.getDate()} ${monthsArabic[date.getMonth()]} ${date.getFullYear()}`;
  };
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'about' | 'friends' | 'photos'>('all');
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showBioExpanded, setShowBioExpanded] = useState(false);

  // Photo selection & customization states
  const [selectedPhotoTypeForSelection, setSelectedPhotoTypeForSelection] = useState<'avatar' | 'cover' | null>(null);
  const [showPhotoLibraryModal, setShowPhotoLibraryModal] = useState<boolean>(false);
  const [selectedCustomizationPhoto, setSelectedCustomizationPhoto] = useState<string | null>(null);
  const [photoCurve, setPhotoCurve] = useState<'none' | 'sm' | 'full'>('full');
  const [showAiCustomizerModal, setShowAiCustomizerModal] = useState<boolean>(false);
  

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Profile Lock & Guard state
  const [isProfileLocked, setIsProfileLocked] = useState<boolean>(false);
  const [hasProfileGuard, setHasProfileGuard] = useState<boolean>(true);
  const [showAccountsCenterModal, setShowAccountsCenterModal] = useState<boolean>(false);
  const [showProfileDetailsModal, setShowProfileDetailsModal] = useState<boolean>(false);

  // Report Account Modal states
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [selectedReportReason, setSelectedReportReason] = useState<string>('انتحال شخصية شخص آخر أو شخصية عامة');
  const [customReportText, setCustomReportText] = useState<string>('');
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);

  // Username Modal state
  const [showUsernameModal, setShowUsernameModal] = useState<boolean>(false);
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>('');

  // Bio Modal state
  const [showBioModal, setShowBioModal] = useState<boolean>(false);
  const [bioInput, setBioInput] = useState<string>('');

  // Edit Profile sections accordion states
  const [introSectionOpen, setIntroSectionOpen] = useState<boolean>(true);
  const [personalDetailsSectionOpen, setPersonalDetailsSectionOpen] = useState<boolean>(true);

  // Edit Profile individual item modals
  const [showCityModal, setShowCityModal] = useState<boolean>(false);
  const [currentCityInput, setCurrentCityInput] = useState<string>('');

  const [showHometownModal, setShowHometownModal] = useState<boolean>(false);
  const [hometownInput, setHometownInput] = useState<string>('');

  const [showBirthDateModal, setShowBirthDateModal] = useState<boolean>(false);
  const [birthDateInput, setBirthDateInput] = useState<string>('');
  const [birthDatePrivacyInput, setBirthDatePrivacyInput] = useState<'public' | 'friends' | 'only_me'>('public');

  const [showRelationshipModal, setShowRelationshipModal] = useState<boolean>(false);
  const [relationshipInput, setRelationshipInput] = useState<string>('');

  const [showFamilyModal, setShowFamilyModal] = useState<boolean>(false);
  const [familyInput, setFamilyInput] = useState<string>('');

  const [showPinnedModal, setShowPinnedModal] = useState<boolean>(false);

  // Arabic Numerals Helper
  const toArabicNumerals = (str: string | number) => {
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str.toString().replace(/[0-9]/g, (d) => arabicNumbers[parseInt(d, 10)]);
  };

  const formatBirthDateArabic = (dateString?: string) => {
    if (!dateString) return '١١ أغسطس ٢٠٠٨';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = date.getDate();
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${toArabicNumerals(day)} ${month} ${toArabicNumerals(year)}`;
  };

  // Profile Note state & 24-hour Expiration Lifecycle
  const isNoteValid = (note?: { text?: string; music?: any; updatedAt: string; expiresAt?: string } | null): boolean => {
    if (!note || (!note.text && !note.music) || !note.updatedAt) return false;
    const updatedTime = new Date(note.updatedAt).getTime();
    if (isNaN(updatedTime)) return false;
    const now = Date.now();
    const diffHours = (now - updatedTime) / (1000 * 60 * 60);
    return diffHours < 24 && diffHours >= 0;
  };

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

  const [showNoteModal, setShowNoteModal] = useState<boolean>(false);
  const [newNoteInput, setNewNoteInput] = useState<string>('');
  const [selectedNoteMusic, setSelectedNoteMusic] = useState<Song | null>(null);
  const [showMusicPickerForNote, setShowMusicPickerForNote] = useState<boolean>(false);
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

  // Personal details state (التفاصيل الشخصية)
  const [personalDetails, setPersonalDetails] = useState({
    work: 'صانع محتوى وفني تقني',
    education: 'جامعة الجزائر 1',
    location: 'Sidi Aïssa, Bouira, Algeria',
    hometown: 'Sidi Aïssa',
    relationship: 'مرتبط',
    relationshipDate: 'منذ ٢ أبريل ٢٠٢٥',
    customQuote: 'موسيقى وحياة هادئة 🎧',
    joinedDate: 'أبريل 2019',
    followers: '2,480'
  });
  const [showEditDetailsModal, setShowEditDetailsModal] = useState<boolean>(false);

  // Interests state (الاهتمامات)
  const [interests, setInterests] = useState([
    '꧁❀+ﾟ•┈🍓✧ﾟ•.🌐★ﾟ*',
    '奇Music is sweet in☆ a place where...'
  ]);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

    if (!currentUser) return null;

  const isAiBotProfile = viewUserId === "ai-bot" || (!viewUserId && currentUser.id === "ai-bot");
  const existingAiUser = users.find(u => u.id === "ai-bot");
  const storedAiAvatar = typeof window !== 'undefined' ? localStorage.getItem('own_ai_avatar') : null;
  const storedAiCover = typeof window !== 'undefined' ? localStorage.getItem('own_ai_cover') : null;
  const storedAiBio = typeof window !== 'undefined' ? localStorage.getItem('own_ai_bio') : null;
  const storedAiName = typeof window !== 'undefined' ? localStorage.getItem('own_ai_name') : null;

  const aiBotUser = isAiBotProfile ? {
    id: "ai-bot",
    uid: "ai-bot",
    name: existingAiUser?.name || storedAiName || "OWN AI",
    avatar: existingAiUser?.avatar || storedAiAvatar || "https://ui-avatars.com/api/?name=OWN+AI&background=6366f1&color=fff",
    cover: existingAiUser?.cover || storedAiCover || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
    bio: existingAiUser?.bio || storedAiBio || "مساعدك الذكي OWN AI، سريع وجاهز للإجابة على كافة استفساراتك، توليد الصور الفنية، وتقديم اقتراحات ذكية 24/7. 🚀🤖",
    status: "active",
    role: "ai",
    isAiBot: true,
    friends: existingAiUser?.friends || [],
    friendRequests: existingAiUser?.friendRequests || [],
    savedBy: existingAiUser?.savedBy || [],
    reports: existingAiUser?.reports || [],
    photoHistory: existingAiUser?.photoHistory || [],
    currentCity: "السحابة الرقمية (Cloud Run)",
    hometown: "العالم الرقمي العالمي",
    relationshipStatus: "متاح دائماً لمساعدتك ❤️",
    work: "مساعد ذكي افتراضي في OWN AI Messenger",
    education: "جامعة الذكاء الاصطناعي والتطور التقني"
  } : null;

  const profileUser = isAiBotProfile ? aiBotUser : users.find(u => u.id === (viewUserId || currentUser.id));

  if (!profileUser) return <div className="p-8 text-center font-bold text-gray-500">المستخدم غير موجود</div>;

  if (profileUser.id !== currentUser.id && profileUser.status !== 'active') {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 text-center dir-rtl">
        <div className="bg-white p-8 rounded-2xl shadow-md max-w-md w-full flex flex-col items-center gap-4 border border-gray-150">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shadow-xs">
            <Lock size={32} />
          </div>
          <h2 className="text-xl font-black text-gray-900">هذا الحساب غير متوفر</h2>
          <p className="text-xs sm:text-sm text-gray-600 font-bold leading-relaxed">
            تم قفل أو تعطيل هذا الحساب لمخالفة معايير وإرشادات المجتمع، ولا يمكن استعراض الملف الشخصي أو مراسلته.
          </p>
          <button
            onClick={() => setCurrentView('home')}
            className="mt-2 bg-[#1877f2] hover:bg-blue-700 text-white font-black text-sm px-6 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            العودة إلى الصفحة الرئيسية
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = !isAiBotProfile && (currentUser.id === profileUser.id);
  const activeTargetNote = isOwnProfile ? currentUser?.userNote : profileUser?.userNote;
  const isTargetNoteActive = isNoteValid(activeTargetNote);
  const displayNoteText = isTargetNoteActive 
    ? (activeTargetNote?.text || (activeTargetNote?.music ? `${activeTargetNote.music.title} • ${activeTargetNote.music.artist}` : '')) 
    : (isOwnProfile ? '+ شارك ملاحظة وموسيقى (24 س)' : 'حكايتي هيا راني مطنن');

  const activeSubProfile = isOwnProfile && currentUser?.activeSubProfileId 
    ? currentUser.subProfiles?.find(s => s.id === currentUser.activeSubProfileId)
    : null;

  // Exact styling & profile data from active user / subprofile
  const displayName = activeSubProfile ? activeSubProfile.name : (profileUser.name || 'مستخدم');
  const displayAvatar = activeSubProfile ? activeSubProfile.avatar : (profileUser.avatar || DEFAULT_AVATAR);
  const displayBio = activeSubProfile ? (activeSubProfile.bio || '') : (profileUser.bio || '');
  const displayCover = activeSubProfile?.cover || profileUser.cover || DEFAULT_COVER;

  const isFriend = currentUser.friends.includes(profileUser.id);
  const hasSentRequest = profileUser.friendRequests.includes(currentUser.id);
  const hasReceivedRequest = currentUser.friendRequests.includes(profileUser.id);
  const isBlocked = currentUser.blockedUsers?.includes(profileUser.id);

  const profileFriends = users.filter(u => profileUser.friends.includes(u.id) && !currentUser.blockedUsers?.includes(u.id));
  const blockedUsersList = users.filter(u => currentUser.blockedUsers?.includes(u.id));

  const handleEditClick = () => {
    setEditForm({ 
      name: displayName, 
      nickname: profileUser.nickname || '', 
      bio: displayBio, 
      birthDate: profileUser.birthDate || '2000-01-01',
      birthDatePrivacy: profileUser.birthDatePrivacy || 'public',
      pin: profileUser.pin || ''
    });
    setBioInput(displayBio);
    setCurrentCityInput(profileUser.currentCity || personalDetails.location || '');
    setHometownInput(profileUser.hometown || personalDetails.hometown || '');
    setBirthDateInput(profileUser.birthDate || '2000-01-01');
    setBirthDatePrivacyInput(profileUser.birthDatePrivacy || 'public');
    setRelationshipInput(profileUser.relationshipStatus || personalDetails.relationship || 'أعزب');
    setFamilyInput(profileUser.family || '');
    setIsEditing(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: editForm.name,
      nickname: editForm.nickname,
      bio: editForm.bio,
      birthDate: editForm.birthDate,
      birthDatePrivacy: editForm.birthDatePrivacy,
      pin: editForm.pin
    });
    setIsEditing(false);
    showToast('تم حفظ بيانات الملف الشخصي بنجاح');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateImageFile(file, 20);
      if (!validation.valid) {
        showToast(validation.error || 'الملف المختار غير صالح.');
        e.target.value = '';
        return;
      }
      
      try {
        showToast('جاري معالجة وضغط الصورة... ⏳');
        const compressedBase64 = await compressImage(file, 900, 900, 0.75);
        setSelectedPhotoTypeForSelection(type);
        setSelectedCustomizationPhoto(compressedBase64);
        setShowPhotoLibraryModal(true);
        showToast('يرجى ضبط الزووم والتعديل ثم الضغط على تأكيد ✨');
      } catch (err) {
        console.warn("Image upload/compression warning:", err);
        showToast('حدث خطأ أثناء معالجة الصورة، يرجى اختيار صورة أخرى.');
      } finally {
        e.target.value = '';
      }
    }
  };


  const copyProfileLink = () => {
    const link = `${window.location.origin}/profile/${profileUser.id}`;
    navigator.clipboard.writeText(link).catch(() => {});
    setShowOptionsMenu(false);
    showToast('تم نسخ رابط الملف الشخصي إلى الحافظة');
  };

  const handleDeleteAvatar = async () => {
    try {
      if (isAiBotProfile) {
        await updateAiBotProfile({ avatar: 'https://ui-avatars.com/api/?name=OWN+AI&background=6366f1&color=fff' });
      } else {
        await updateProfile({ avatar: DEFAULT_AVATAR });
      }
      setShowDeleteAvatarConfirm(false);
      setShowAvatarViewerModal(false);
      setShowAvatarOptionsModal(false);
      showToast('تم استعادة الصورة الافتراضية بنجاح 🗑️');
    } catch (error) {
      console.error('Error deleting avatar:', error);
      showToast('حدث خطأ أثناء حذف الصورة الشخصية');
    }
  };

  const handleSelectCoverPreset = (newCoverUrl: string) => {
    if (isAiBotProfile) {
      updateAiBotProfile({ cover: newCoverUrl });
    } else {
      updateProfile({ cover: newCoverUrl });
    }
    showToast('تم تطبيق وتعيين غلاف فيسبوك الفاخر بنجاح ✨');
  };

  const handleSelectAiAvatar = async (newAvatarUrl: string) => {
    if (isAiBotProfile) {
      await updateAiBotProfile({ avatar: newAvatarUrl });
      showToast('تم تحديث صورة OWN AI بنجاح 🤖✨');
    } else {
      setSelectedPhotoTypeForSelection('avatar');
      setSelectedCustomizationPhoto(newAvatarUrl);
      setShowPhotoLibraryModal(true);
      showToast('تم اختيار الصورة! اضغط حفظ وتأكيد للمراجعة الأمنية');
    }
  };

  const handleDeleteCover = async () => {
    try {
      if (isAiBotProfile) {
        await updateAiBotProfile({ cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80' });
      } else {
        await updateProfile({ cover: DEFAULT_COVER });
      }
      setShowCoverModal(false);
      showToast('تم استعادة غلاف فيسبوك الافتراضي بنجاح 🔄');
    } catch (error) {
      console.error('Error resetting cover:', error);
      showToast('حدث خطأ أثناء استعادة الغلاف');
    }
  };

  // Helper to render all edit modals seamlessly
  const renderAllModals = () => (
    <>
      {/* AI PROFILE AVATAR GENERATION & UPLOAD MODAL (IN ANY FIELD) */}
      <AiImagePickerModal
        isOpen={showAiAvatarPickerModal}
        onClose={() => setShowAiAvatarPickerModal(false)}
        context="profile"
        title="رفع وتوليد صورة الملف الشخصي بالذكاء الاصطناعي 👤✨"
        subtitle="اختر أي مجال لتوليد صورة رمزية مميزة أو ارفع صورتك الخاصة مع فحص الأمان ومعايير المجتمع."
        onSelectImage={(newAvatarUrl) => {
          handleSelectAiAvatar(newAvatarUrl);
          setShowAiAvatarPickerModal(false);
        }}
      />

      {/* COVER PHOTO MANAGEMENT & PRESET GALLERY MODAL */}
      <CoverPhotoModal
        isOpen={showCoverModal}
        onClose={() => setShowCoverModal(false)}
        currentCover={displayCover}
        userName={displayName}
        isOwnProfile={isOwnProfile || isAiBotProfile}
        onSelectCover={handleSelectCoverPreset}
        onUploadCoverClick={() => coverInputRef.current?.click()}
        onDeleteCover={handleDeleteCover}
      />

      {/* OWN AI CUSTOMIZER MODAL */}
      <AnimatePresence>
        {showAiCustomizerModal && (
          <div className="fixed inset-0 z-[210] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 dir-rtl">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 text-right overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                    <Sparkles size={20} className="text-yellow-300" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-base">تخصيص صورة وغلاف OWN AI 🤖</h3>
                    <p className="text-[11px] text-gray-500 font-bold">يمكنك تغيير صورة المساعد وغلافه من جهازك أو اختيار تصميم جاهز</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAiCustomizerModal(false)}
                  className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
                {/* SECTION 1: AVATAR */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                        <Camera size={16} />
                      </div>
                      <span className="font-extrabold text-sm text-gray-900">صورة الملف الشخصي لـ OWN AI</span>
                    </div>
                    <button
                      onClick={() => {
                        avatarInputRef.current?.click();
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                    >
                      <Camera size={14} />
                      <span>رفع من جهازك</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-100">
                    <div className="w-16 h-16 rounded-full border-2 border-indigo-200 overflow-hidden shrink-0 shadow-sm">
                      <img src={displayAvatar} alt="Current AI Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-gray-800">الصورة الحالية للمساعد</p>
                      <p className="text-[11px] text-gray-500 font-bold mt-0.5">تظهر هذه الصورة في المحادثات والمنشورات والتعليقات</p>
                    </div>
                  </div>

                  {/* Preset Avatars */}
                  <div className="space-y-1.5 pt-1">
                    <p className="text-xs font-bold text-gray-600">أو اختر من تصاميم الذكاء الاصطناعي الجاهزة:</p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {AI_BOT_AVATAR_PRESETS.map((preset, pIdx) => (
                        <button
                          key={`ai-avatar-preset-${preset.id}-${pIdx}`}
                          onClick={() => {
                            updateAiBotProfile({ avatar: preset.url });
                          }}
                          className={`flex flex-col items-center p-1.5 rounded-xl border transition-all cursor-pointer ${
                            displayAvatar === preset.url
                              ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500/20 shadow-xs'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="w-11 h-11 rounded-full overflow-hidden mb-1 border border-gray-200 shadow-2xs">
                            <img src={preset.url} alt={preset.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <span className="text-[10px] font-bold text-gray-700 text-center truncate w-full">{preset.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SECTION 2: COVER */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                        <ImageIcon size={16} />
                      </div>
                      <span className="font-extrabold text-sm text-gray-900">صورة غلاف OWN AI</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowAiCustomizerModal(false);
                          setShowCoverModal(true);
                        }}
                        className="px-2.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Palette size={13} />
                        <span>معرض الأغلفة (50+)</span>
                      </button>
                      <button
                        onClick={() => {
                          coverInputRef.current?.click();
                        }}
                        className="px-3 py-1.5 bg-[#8b5cf6] hover:bg-purple-600 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                      >
                        <Camera size={14} />
                        <span>رفع من جهازك</span>
                      </button>
                    </div>
                  </div>

                  <div className="h-28 rounded-xl overflow-hidden border border-gray-200 relative group shadow-sm">
                    <img src={displayCover} alt="Current AI Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-black px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-xs">الغلاف المعروض حالياً</span>
                    </div>
                  </div>

                  {/* Preset Covers */}
                  <div className="space-y-1.5 pt-1">
                    <p className="text-xs font-bold text-gray-600">أغلفة مقترحة سريعة لـ OWN AI:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {AI_BOT_COVER_PRESETS.map((preset, cIdx) => (
                        <button
                          key={`ai-cover-preset-${preset.id}-${cIdx}`}
                          onClick={() => {
                            updateAiBotProfile({ cover: preset.url });
                          }}
                          className={`rounded-xl overflow-hidden border transition-all text-right cursor-pointer group relative ${
                            displayCover === preset.url
                              ? 'border-indigo-600 ring-2 ring-indigo-500/30 shadow-xs'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="h-16 w-full overflow-hidden relative">
                            <img src={preset.url} alt={preset.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                            {displayCover === preset.url && (
                              <div className="absolute top-1 left-1 bg-indigo-600 text-white p-0.5 rounded-full shadow-xs">
                                <Check size={12} strokeWidth={3} />
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] font-bold text-gray-700 p-1.5 truncate bg-white">{preset.title}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Reset to Default */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <button
                    onClick={async () => {
                      await updateAiBotProfile({
                        avatar: 'https://ui-avatars.com/api/?name=OWN+AI&background=6366f1&color=fff',
                        cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80'
                      });
                      showToast('تمت استعادة الصورة والغلاف الافتراضي لـ OWN AI بنجاح 🔄');
                    }}
                    className="text-xs font-bold text-gray-500 hover:text-rose-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw size={14} />
                    <span>استعادة المظهر الافتراضي للمساعد</span>
                  </button>
                  <button
                    onClick={() => setShowAiCustomizerModal(false)}
                    className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-black rounded-xl cursor-pointer transition-colors"
                  >
                    تم الحفظ
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FACEBOOK COMMUNITY STANDARDS HUB MODAL */}
      <ProfileCommunityStandardsModal 
        isOpen={showCommunityStandardsModal}
        onClose={() => setShowCommunityStandardsModal(false)}
        initialSystemId={selectedStandardCategory}
      />

      {/* REPORT PROFILE PHOTO MODAL */}
      <ReportProfilePhotoModal 
        isOpen={showReportPhotoModal}
        onClose={() => setShowReportPhotoModal(false)}
        targetUserName={displayName}
        targetUserAvatar={displayAvatar}
        onSubmitReport={async (category, details) => {
          if (profileUser?.id) {
            await reportUser(profileUser.id, `مخالفة صورة الملف الشخصي لمعايير المجتمع: ${category} ${details ? `(${details})` : ''}`);
          }
        }}
      />

      {/* AVATAR OPTIONS ACTION SHEET (مطابق لOWN あ تماماً) */}
      <AnimatePresence>
        {showAvatarOptionsModal && (
          <div className="fixed inset-0 z-[190] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 dir-rtl">
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-gray-200 text-right overflow-hidden space-y-2"
            >
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <img 
                    src={displayAvatar} 
                    alt={displayName} 
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="font-black text-gray-900 text-sm">{displayName}</h3>
                    <p className="text-[11px] text-gray-500 font-bold">خيارات صورة الملف الشخصي</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAvatarOptionsModal(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-1 pt-1">
                {/* 1. View Profile Photo */}
                <button 
                  onClick={() => {
                    setShowAvatarOptionsModal(false);
                    setShowAvatarViewerModal(true);
                  }}
                  className="w-full p-3 rounded-2xl hover:bg-gray-50 flex items-center gap-3 text-xs font-bold text-gray-800 transition-colors cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                    <Eye size={18} />
                  </div>
                  <div>
                    <p className="font-extrabold text-gray-900">عرض صورة الملف الشخصي</p>
                    <p className="text-[10px] text-gray-400 font-normal">معاينة الصورة بكامل الدقة والتحكم الكامل</p>
                  </div>
                </button>

                {/* 2. Facebook Community Standards */}
                <button 
                  onClick={() => {
                    setShowAvatarOptionsModal(false);
                    setShowCommunityStandardsModal(true);
                  }}
                  className="w-full p-3 rounded-2xl hover:bg-blue-50/50 flex items-center gap-3 text-xs font-bold text-[#1877f2] transition-colors cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-[#1877f2] flex items-center justify-center shrink-0">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <p className="font-extrabold">معايير مجتمع OWN あ للصور الشخصية</p>
                    <p className="text-[10px] text-blue-600/80 font-normal">استعراض الـ 8 أنظمة (العُري، العنف، الأطفال، الكراهية...)</p>
                  </div>
                </button>

                {/* Own Profile / AI Bot actions */}
                {(isOwnProfile || isAiBotProfile) ? (
                  <>
                    {/* AI Profile Photo Generation & Upload System */}
                    <button 
                      onClick={() => {
                        setShowAvatarOptionsModal(false);
                        setShowAiAvatarPickerModal(true);
                      }}
                      className="w-full p-3 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 flex items-center gap-3 text-xs font-bold text-indigo-950 transition-colors cursor-pointer border border-indigo-200/70"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Sparkles size={18} className="text-amber-300" />
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-indigo-950 flex items-center gap-1.5">
                          <span>رفع وتوليد صورة الملف الشخصي بالذكاء الاصطناعي</span>
                          <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full">AI Studio</span>
                        </p>
                        <p className="text-[10px] text-indigo-700 font-bold">ابتكار صورة رمزية في أي مجال (بورتريه، 3D، أنمي، طبيعة، سيارات) أو رفع مع فحص أمان ذكي</p>
                      </div>
                    </button>

                    <button 
                      onClick={() => {
                        setShowAvatarOptionsModal(false);
                        avatarInputRef.current?.click();
                      }}
                      className="w-full p-3 rounded-2xl hover:bg-gray-50 flex items-center gap-3 text-xs font-bold text-gray-800 transition-colors cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                        <Camera size={18} />
                      </div>
                      <div>
                        <p className="font-extrabold text-gray-900">اختيار صورة ملف شخصي جديدة</p>
                        <p className="text-[10px] text-gray-400 font-normal">مع فحص أمان تلقائي فوري ضد معايير مجتمع OWN あ</p>
                      </div>
                    </button>

                    {/* Delete Profile Photo Option */}
                    <button 
                      onClick={() => {
                        setShowAvatarOptionsModal(false);
                        setShowDeleteAvatarConfirm(true);
                      }}
                      className="w-full p-3 rounded-2xl hover:bg-rose-50 flex items-center gap-3 text-xs font-bold text-rose-600 transition-colors cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                        <Trash2 size={18} />
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-rose-600">حذف صورة الملف الشخصي</p>
                        <p className="text-[10px] text-rose-400 font-normal">إزالة الصورة الشخصية واسترجاع الصورة الافتراضية</p>
                      </div>
                    </button>

                    <button 
                      onClick={() => {
                        setHasProfileGuard(!hasProfileGuard);
                        setShowAvatarOptionsModal(false);
                        showToast(hasProfileGuard ? 'تم إيقاف تشغيل درع الصورة' : 'تم تشغيل درع حماية صورة الملف الشخصي بنجاح');
                      }}
                      className="w-full p-3 rounded-2xl hover:bg-gray-50 flex items-center gap-3 text-xs font-bold text-gray-800 transition-colors cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Shield size={18} />
                      </div>
                      <div>
                        <p className="font-extrabold text-gray-900">
                          {hasProfileGuard ? 'إيقاف تشغيل درع حماية الصورة' : 'تشغيل درع حماية صورة الملف الشخصي'}
                        </p>
                        <p className="text-[10px] text-gray-400 font-normal">منع الآخرين من تنزيل أو مشاركة صورتك الشخصية</p>
                      </div>
                    </button>
                  </>
                ) : (
                  /* Other user options: Report */
                  <button 
                    onClick={() => {
                      setShowAvatarOptionsModal(false);
                      setShowReportPhotoModal(true);
                    }}
                    className="w-full p-3 rounded-2xl hover:bg-rose-50 flex items-center gap-3 text-xs font-bold text-rose-700 transition-colors cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                      <Flag size={18} />
                    </div>
                    <div>
                      <p className="font-extrabold">إبلاغ عن صورة الملف الشخصي</p>
                      <p className="text-[10px] text-rose-500 font-normal">إذا كانت تخالف معايير مجتمع OWN あ</p>
                    </div>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AVATAR FULLSCREEN VIEWER MODAL (نمط OWN あ الرسمي) */}
      <AnimatePresence>
        {showAvatarViewerModal && (
          <div className="fixed inset-0 z-[210] bg-black/95 flex flex-col justify-between p-4 dir-rtl">
            {/* Top Bar */}
            <div className="flex items-center justify-between text-white pb-3 border-b border-gray-800 z-20">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowAvatarViewerModal(false)}
                  className="p-2 rounded-full hover:bg-white/10 text-white transition-all cursor-pointer"
                >
                  <ChevronRight size={24} />
                </button>
                <div>
                  <h3 className="font-black text-sm text-white">{displayName}</h3>
                  <p className="text-[11px] text-gray-400 font-medium">صورة الملف الشخصي</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isOwnProfile && (
                  <button 
                    onClick={() => setShowDeleteAvatarConfirm(true)}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                    title="حذف الصورة الشخصية"
                  >
                    <Trash2 size={14} />
                    <span>حذف الصورة</span>
                  </button>
                )}

                <button 
                  onClick={() => setShowCommunityStandardsModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <ShieldCheck size={15} />
                  <span>معايير المجتمع</span>
                </button>

                <button 
                  onClick={() => setShowAvatarViewerModal(false)}
                  className="p-2 rounded-full hover:bg-white/10 text-gray-300 cursor-pointer"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Center Image */}
            <div className="flex-1 flex items-center justify-center p-4 relative">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="max-w-md w-full aspect-square rounded-3xl overflow-hidden shadow-2xl relative border-4 border-white/10"
              >
                <img 
                  src={displayAvatar} 
                  alt={displayName} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />

                {/* Facebook Community Standards Protected Pill */}
                <div className="absolute bottom-3 left-3 right-3 bg-black/70 backdrop-blur-md text-white p-2.5 rounded-2xl border border-white/20 flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-blue-400 shrink-0" />
                    <span className="text-[11px]">تم فحص ومطابقة الصورة لمعايير مجتمع OWN あ</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/40 font-black">
                    آمنة ومصرحة ✓
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="pt-3 border-t border-gray-800 flex items-center justify-around text-gray-300 text-xs font-bold">
              <button 
                onClick={() => {
                  setShowAvatarViewerModal(false);
                  setShowCommunityStandardsModal(true);
                }}
                className="flex flex-col items-center gap-1 hover:text-white transition-colors cursor-pointer"
              >
                <ShieldCheck size={20} className="text-[#1877f2]" />
                <span>المعايير</span>
              </button>

              {(isOwnProfile || isAiBotProfile) ? (
                <>
                  <button 
                    onClick={() => {
                      setShowAvatarViewerModal(false);
                      avatarInputRef.current?.click();
                    }}
                    className="flex flex-col items-center gap-1 hover:text-white transition-colors cursor-pointer"
                  >
                    <Camera size={20} />
                    <span>تغيير الصورة</span>
                  </button>
                  <button 
                    onClick={() => setShowDeleteAvatarConfirm(true)}
                    className="flex flex-col items-center gap-1 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    <Trash2 size={20} />
                    <span>حذف الصورة</span>
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => {
                    setShowAvatarViewerModal(false);
                    setShowReportPhotoModal(true);
                  }}
                  className="flex flex-col items-center gap-1 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <Flag size={20} />
                  <span>إبلاغ</span>
                </button>
              )}

              <button 
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = displayAvatar;
                  a.download = `profile_${displayName}.jpg`;
                  a.click();
                  showToast('جاري تنزيل الصورة...');
                }}
                className="flex flex-col items-center gap-1 hover:text-white transition-colors cursor-pointer"
              >
                <Download size={20} />
                <span>حفظ</span>
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE AVATAR CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDeleteAvatarConfirm && (
          <div className="fixed inset-0 bg-black/70 z-[260] flex items-center justify-center p-4 backdrop-blur-xs dir-rtl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 text-right space-y-4 overflow-hidden"
            >
              <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 size={22} />
                </div>
                <div>
                  <h3 className="font-black text-base text-gray-900">حذف صورة الملف الشخصي</h3>
                  <p className="text-[11px] text-gray-500 font-bold">تأكيد عملية الحذف</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <img 
                  src={displayAvatar} 
                  alt="" 
                  className="w-12 h-12 rounded-full object-cover border border-gray-200 shrink-0" 
                  referrerPolicy="no-referrer"
                />
                <p className="text-xs text-gray-700 font-bold leading-relaxed">
                  هل أنت متأكد من رغبتك في إزالة هذه الصورة الشخصية والرجوع للصورة الافتراضية؟
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleDeleteAvatar}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white py-2.5 rounded-xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={16} />
                  <span>نعم، حذف الصورة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteAvatarConfirm(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3-SECOND AUTOMATIC LOCK COUNTDOWN MODAL */}
      <AnimatePresence>
        {lockCountdown !== null && (
          <div className="fixed inset-0 bg-black/80 z-[250] flex items-center justify-center p-4 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.88, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 30 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl dir-rtl text-center overflow-hidden border-2 border-amber-400"
            >
              {/* Animated Countdown Circle */}
              <div className="flex flex-col items-center justify-center mb-4">
                <div className="relative w-24 h-24 flex items-center justify-center mb-2">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="#f3f4f6"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="#e11d48"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * lockCountdownProgress) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span 
                      key={lockCountdown}
                      initial={{ scale: 1.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-3xl font-black text-rose-600"
                    >
                      {lockCountdown > 0 ? lockCountdown : <Lock size={28} className="text-rose-600 animate-bounce" />}
                    </motion.span>
                    {lockCountdown > 0 && <span className="text-[10px] font-bold text-gray-500">ثوانٍ</span>}
                  </div>
                </div>

                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-black">
                  <ShieldAlert size={14} className="text-rose-600" />
                  <span>إجراء أمني تلقائي</span>
                </div>
              </div>

              {/* Title and Explanation */}
              <h3 className="text-base font-black text-gray-900 mb-1.5">
                {lockCountdownData?.title || 'تم وضع صورة الملف الشخصي'}
              </h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed mb-4">
                {lockCountdownData?.message || 'سيتم قفل الحساب تلقائياً بعد 3 ثوانٍ للمراجعة الأمنية وتأكيد الهوية.'}
              </p>

              {/* Countdown Progress Bar */}
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-4">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-rose-600 transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${lockCountdownProgress}%` }}
                />
              </div>

              {/* Direct Action Button */}
              <button
                type="button"
                onClick={async () => {
                  setLockCountdown(0);
                  if (lockCountdownData?.isViolating) {
                    await enforceProfilePhotoViolation({
                      reason: lockCountdownData.reason,
                      candidateImg: lockCountdownData.avatarUrl
                    });
                  } else {
                    await enforceProfilePhotoViolation({
                      reason: '🔒 تم قفل الحساب احترازياً فور وضع صورة الملف الشخصي الجديدة للمراجعة الأمنية وتأكيد الهوية.',
                      candidateImg: lockCountdownData?.avatarUrl
                    });
                  }
                }}
                className="w-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white py-3 rounded-2xl font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock size={15} />
                <span>قفل الحساب الآن والانتقال للمراجعة</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* COMMUNITY VIOLATION & INAPPROPRIATE AVATAR MODAL */}
      <AnimatePresence>
        {showViolationModal && (
          <div className="fixed inset-0 bg-black/75 z-[220] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl dir-rtl text-right overflow-hidden border border-red-200"
            >
              <div className="flex justify-between items-center pb-3 border-b border-red-100">
                <div className="flex items-center gap-2 text-rose-600">
                  <ShieldAlert size={26} className="shrink-0 text-rose-600 animate-pulse" />
                  <div>
                    <h3 className="text-base font-black text-gray-900">تم حذف الصورة الشخصية وقفل الحساب</h3>
                    <p className="text-[11px] text-rose-600 font-bold">انتهاك شروط OWN وحظر العُري والمحتوى غير اللائق</p>
                  </div>
                </div>
                <button onClick={() => setShowViolationModal(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {/* Warning Alert Banner */}
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-black text-sm flex items-center gap-1.5 text-rose-700">
                      <span>🚨 تم رصد مخالفة: {violationResultDetails?.categoryLabel || 'عُري / محتوى غير لائق'}</span>
                    </p>
                    <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                      تم الحذف الفوري 🗑️
                    </span>
                  </div>
                  <p className="font-bold text-gray-800 leading-relaxed">
                    {violationResultDetails?.reason || 'تم رصد عُري أو استغلال جنسي أو نساء/رجال/أطفال عراة أو محتوى غير لائق في الصورة الشخصية.'}
                  </p>
                  <p className="text-[11px] text-rose-700 font-medium bg-white/70 p-2 rounded-xl border border-rose-100">
                    💡 <strong>الإجراء الفوري:</strong> تم حذف تلك الصورة تماماً ومنع اعتمادها، وسيتم قفل حسابك احترازياً لحماية المجتمع وشروط OWN.
                  </p>
                </div>

                {/* Candidate Image Preview (blurred with warning) */}
                {violationCandidateImg && (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-rose-400 h-32 bg-gray-950 flex items-center justify-center">
                    <img 
                      src={violationCandidateImg} 
                      alt="Violating preview" 
                      className="w-full h-full object-cover blur-lg opacity-30 scale-110"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center text-white bg-black/60">
                      <Trash2 size={28} className="text-rose-400 mb-1 animate-bounce" />
                      <span className="text-xs font-black text-rose-200">❌ تم حذف وإتلاف هذه الصورة نهائياً</span>
                      <span className="text-[10px] text-rose-300 font-semibold mt-0.5">
                        التصنيف: {violationResultDetails?.categoryLabel || 'عُري ومحتوى غير لائق'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Enforcement Pipeline Steps */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5 text-xs text-gray-700">
                  <p className="text-gray-900 font-black flex items-center justify-between">
                    <span>⚖️ الإجراءات الرسمية المطبقة:</span>
                    <span className="text-[11px] bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full font-black">
                      قفل اليوم: {(currentUser?.dailyLockCount || 0) > 3 ? `${currentUser?.dailyLockCount} (تجاوز الحد)` : `${currentUser?.dailyLockCount || 1} من 3`}
                    </span>
                  </p>
                  
                  <div className="space-y-2 text-[11px]">
                    <div className="flex items-start gap-2 bg-white p-2 rounded-xl border border-gray-200">
                      <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                      <div>
                        <strong className="text-gray-900 block">حذف الصورة فوراً:</strong>
                        <span className="text-gray-600">تم مسح الصورة المخالفة فوراً واستبدالها بصورة آمنة ومسحها من الحساب.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-white p-2 rounded-xl border border-gray-200">
                      <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                      <div>
                        <strong className="text-gray-900 block">قفل الحساب الاحترازي (≤ 3 مرات في اليوم):</strong>
                        <span className="text-gray-600">يتم قفل الحساب وتوجيهه لمركز الأمان لتأكيد الهوية.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-white p-2 rounded-xl border border-gray-200">
                      <span className="w-5 h-5 rounded-full bg-red-800 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                      <div>
                        <strong className="text-gray-900 block">التعليق والوضع تحت مراجعة الطعن (&gt; 3 مرات في اليوم):</strong>
                        <span className="text-gray-600">إذا تم قفل الحساب أكثر من 3 مرات في اليوم، يتم تعليقه رسمياً ووضعه تحت مراجعة الطعن.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                  (currentUser?.dailyLockCount || 0) >= 3
                    ? 'bg-rose-100 border-rose-300 text-rose-900'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}>
                  <ShieldAlert size={18} className="shrink-0 text-rose-600" />
                  <span>
                    {(currentUser?.dailyLockCount || 0) >= 3
                      ? '⚠️ تم تعليق الحساب ووضعه تحت مراجعة الطعن لتجاوز 3 مخالفات اليوم.'
                      : '🔒 تم حذف الصورة وقفل الحساب احترازياً.'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowViolationModal(false);
                      window.location.reload();
                    }}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Lock size={15} />
                    <span>متابعة إلى شاشة قفل الحساب وتأكيد الهوية</span>
                  </button>

                  <button 
                    type="button" 
                    onClick={() => {
                      setShowViolationModal(false);
                      setViolationCandidateImg(null);
                    }}
                    className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all cursor-pointer"
                  >
                    إغلاق النافذة
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* USERNAME & NAME MODAL (تعديل الاسم واسم المستخدم) */}
      <AnimatePresence>
        {showUsernameModal && (
          <div className="fixed inset-0 bg-black/60 z-[160] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl dir-rtl text-right"
            >
              <div className="flex justify-between items-center pb-2 border-b border-gray-100 mb-3">
                <h3 className="text-base font-black text-gray-900">تعديل الاسم واسم المستخدم</h3>
                <button onClick={() => setShowUsernameModal(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">الاسم أو اللقب</label>
                  <input 
                    type="text" 
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    placeholder="أدخل اسمك"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold outline-none focus:border-[#1877f2] bg-gray-50 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">اسم المستخدم (@username)</label>
                  <input 
                    type="text" 
                    value={usernameInput}
                    onChange={e => setUsernameInput(e.target.value)}
                    placeholder="مثال: samado"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold outline-none focus:border-[#1877f2] bg-gray-50 focus:bg-white transition-all dir-ltr text-left"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">يساعد هذا في العثور عليك في محرك البحث.</p>
                </div>
                <div className="pt-3 border-t border-gray-100 flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      updateProfile({ 
                        name: nameInput.trim() || profileUser.name,
                        username: usernameInput.trim().replace('@', '') 
                      });
                      setShowUsernameModal(false);
                      showToast('تم تحديث الاسم واسم المستخدم');
                    }}
                    className="flex-1 bg-[#1877f2] hover:bg-blue-600 text-white py-2.5 rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer"
                  >
                    حفظ
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowUsernameModal(false)} 
                    className="px-4 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BIO MODAL (تعديل وتعيين السيرة الذاتية) */}
      <AnimatePresence>
        {showBioModal && (
          <div className="fixed inset-0 bg-black/60 z-[160] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl dir-rtl text-right"
            >
              <div className="flex justify-between items-center pb-2 border-b border-gray-100 mb-3">
                <h3 className="text-base font-black text-gray-900">السيرة الذاتية (Bio)</h3>
                <button onClick={() => setShowBioModal(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-600">
                  أضف سيرة ذاتية قصيرة لتخبر أصدقاءك والمتابعين المزيد عن نفسك.
                </p>

                <div className="relative">
                  <textarea 
                    value={bioInput}
                    onChange={e => setBioInput(e.target.value)}
                    placeholder="اكتب سيرتك الذاتية الكاملة هنا..."
                    rows={4}
                    maxLength={300}
                    className="w-full border border-gray-200 rounded-2xl p-3 text-sm font-bold outline-none focus:border-[#1877f2] bg-gray-50 focus:bg-white transition-all text-right resize-none"
                  />
                  <div className="text-[11px] font-bold text-gray-400 text-left mt-1">
                    {300 - bioInput.length} حرف متبقي
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      updateProfile({ bio: bioInput.trim() });
                      setShowBioModal(false);
                      showToast('تم تحديث السيرة الذاتية بنجاح');
                    }}
                    className="flex-1 bg-[#1877f2] hover:bg-blue-600 text-white py-2.5 rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer"
                  >
                    حفظ السيرة الذاتية
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowBioModal(false)} 
                    className="px-4 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CITY MODAL */}
      <AnimatePresence>
        {showCityModal && (
          <div className="fixed inset-0 bg-black/60 z-[160] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl dir-rtl text-right"
            >
              <div className="flex justify-between items-center pb-2 border-b border-gray-100 mb-3">
                <h3 className="text-base font-black text-gray-900">المدينة أو البلدة الحالية</h3>
                <button onClick={() => setShowCityModal(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-3">
                <input 
                  type="text" 
                  value={currentCityInput}
                  onChange={e => setCurrentCityInput(e.target.value)}
                  placeholder="مثال: Sidi Aïssa, Bouira, Algeria"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-[#1877f2] bg-gray-50 focus:bg-white transition-all"
                />
                <div className="pt-3 border-t border-gray-100 flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      updateProfile({ currentCity: currentCityInput.trim() });
                      setPersonalDetails(prev => ({ ...prev, location: currentCityInput.trim() }));
                      setShowCityModal(false);
                      showToast('تم تحديث المدينة الحالية');
                    }}
                    className="flex-1 bg-[#1877f2] hover:bg-blue-600 text-white py-2.5 rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer"
                  >
                    حفظ
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowCityModal(false)} 
                    className="px-4 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HOMETOWN MODAL */}
      <AnimatePresence>
        {showHometownModal && (
          <div className="fixed inset-0 bg-black/60 z-[160] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl dir-rtl text-right"
            >
              <div className="flex justify-between items-center pb-2 border-b border-gray-100 mb-3">
                <h3 className="text-base font-black text-gray-900">مكان المنشأ</h3>
                <button onClick={() => setShowHometownModal(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-3">
                <input 
                  type="text" 
                  value={hometownInput}
                  onChange={e => setHometownInput(e.target.value)}
                  placeholder="مثال: Sidi Aïssa"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-[#1877f2] bg-gray-50 focus:bg-white transition-all"
                />
                <div className="pt-3 border-t border-gray-100 flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      updateProfile({ hometown: hometownInput.trim() });
                      setPersonalDetails(prev => ({ ...prev, hometown: hometownInput.trim() }));
                      setShowHometownModal(false);
                      showToast('تم تحديث مكان المنشأ');
                    }}
                    className="flex-1 bg-[#1877f2] hover:bg-blue-600 text-white py-2.5 rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer"
                  >
                    حفظ
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowHometownModal(false)} 
                    className="px-4 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BIRTHDATE MODAL */}
      <AnimatePresence>
        {showBirthDateModal && (
          <div className="fixed inset-0 bg-black/60 z-[160] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl dir-rtl text-right"
            >
              <div className="flex justify-between items-center pb-2 border-b border-gray-100 mb-3">
                <h3 className="text-base font-black text-gray-900">تعديل تاريخ الميلاد والخصوصية</h3>
                <button onClick={() => setShowBirthDateModal(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 mb-1">اختر تاريخ الميلاد</label>
                  <input 
                    type="date" 
                    value={birthDateInput}
                    onChange={e => setBirthDateInput(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 mb-1">من يستطيع رؤيته؟</label>
                  <select 
                    value={birthDatePrivacyInput}
                    onChange={e => setBirthDatePrivacyInput(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-blue-500 bg-white cursor-pointer"
                  >
                    <option value="public">🌐 العامة (الجميع)</option>
                    <option value="friends">👥 الأصدقاء فقط</option>
                    <option value="only_me">🔒 أنا فقط</option>
                  </select>
                </div>
                {birthDateInput && (
                  <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
                    (calculateAge(birthDateInput) ?? 99) < 12 
                      ? 'bg-amber-50 border-amber-200 text-amber-900' 
                      : 'bg-blue-50 border-blue-100 text-blue-900'
                  }`}>
                    <span>📅 {formatBirthDateArabic(birthDateInput)}</span>
                    {calculateAge(birthDateInput) !== null && (
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                        (calculateAge(birthDateInput) ?? 99) < 12 
                          ? 'bg-amber-200 text-amber-950' 
                          : 'bg-blue-200/80 text-blue-900'
                      }`}>
                        العمر: {calculateAge(birthDateInput)} سنة {(calculateAge(birthDateInput) ?? 99) < 12 ? '(أقل من 12 سنة)' : ''}
                      </span>
                    )}
                  </div>
                )}
                {birthDateInput && (calculateAge(birthDateInput) ?? 99) < 12 && (
                  <div className="text-[11px] font-bold text-red-800 bg-red-50 p-2.5 rounded-xl border border-red-200 leading-relaxed">
                    ⚠️ تنبيه: إدخال تاريخ ميلاد لسن أقل من 12 سنة يخالف شروط منبعثا وسيؤدي لتعليق الحساب.
                  </div>
                )}
                <div className="pt-3 border-t border-gray-100 flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      updateProfile({ 
                        birthDate: birthDateInput, 
                        birthDatePrivacy: birthDatePrivacyInput 
                      });
                      setShowBirthDateModal(false);
                      showToast('تم تحديث تاريخ الميلاد');
                    }}
                    className="flex-1 bg-[#1877f2] hover:bg-blue-600 text-white py-2.5 rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer"
                  >
                    حفظ
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowBirthDateModal(false)} 
                    className="px-4 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RELATIONSHIP MODAL */}
      <AnimatePresence>
        {showRelationshipModal && (
          <div className="fixed inset-0 bg-black/60 z-[160] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl dir-rtl text-right"
            >
              <div className="flex justify-between items-center pb-2 border-b border-gray-100 mb-3">
                <h3 className="text-base font-black text-gray-900">الحالة الاجتماعية</h3>
                <button onClick={() => setShowRelationshipModal(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-3">
                <select 
                  value={relationshipInput}
                  onChange={e => setRelationshipInput(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-[#1877f2] bg-gray-50 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="أعزب">أعزب</option>
                  <option value="مرتبط">مرتبط</option>
                  <option value="مخطوب">مخطوب</option>
                  <option value="متزوج">متزوج</option>
                  <option value="في علاقة معقدة">في علاقة معقدة</option>
                  <option value="منفصل">منفصل</option>
                  <option value="أرمل">أرمل</option>
                </select>
                <div className="pt-3 border-t border-gray-100 flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      updateProfile({ relationshipStatus: relationshipInput });
                      setPersonalDetails(prev => ({ ...prev, relationship: relationshipInput }));
                      setShowRelationshipModal(false);
                      showToast('تم تحديث الحالة الاجتماعية');
                    }}
                    className="flex-1 bg-[#1877f2] hover:bg-blue-600 text-white py-2.5 rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer"
                  >
                    حفظ
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowRelationshipModal(false)} 
                    className="px-4 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FAMILY MODAL */}
      <AnimatePresence>
        {showFamilyModal && (
          <div className="fixed inset-0 bg-black/60 z-[160] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl dir-rtl text-right"
            >
              <div className="flex justify-between items-center pb-2 border-b border-gray-100 mb-3">
                <h3 className="text-base font-black text-gray-900">أفراد العائلة</h3>
                <button onClick={() => setShowFamilyModal(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-3">
                <input 
                  type="text" 
                  value={familyInput}
                  onChange={e => setFamilyInput(e.target.value)}
                  placeholder="أضف أفراد العائلة (مثال: الأخ، الأخت، الوالدين)..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-[#1877f2] bg-gray-50 focus:bg-white transition-all"
                />
                <div className="pt-3 border-t border-gray-100 flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      updateProfile({ family: familyInput.trim() });
                      setShowFamilyModal(false);
                      showToast('تم تحديث بيانات العائلة');
                    }}
                    className="flex-1 bg-[#1877f2] hover:bg-blue-600 text-white py-2.5 rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer"
                  >
                    حفظ
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowFamilyModal(false)} 
                    className="px-4 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PINNED DETAILS MODAL */}
      <AnimatePresence>
        {showPinnedModal && (
          <div className="fixed inset-0 bg-black/60 z-[160] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl dir-rtl text-right"
            >
              <div className="flex justify-between items-center pb-2 border-b border-gray-100 mb-3">
                <h3 className="text-base font-black text-gray-900">التفاصيل المثبّتة على الملف الشخصي</h3>
                <button onClick={() => setShowPinnedModal(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-600">
                  اختر التفاصيل التي ترغب في تثبيتها في أعلى ملفك الشخصي ليراها الجميع.
                </p>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer">
                    <span className="text-xs font-extrabold text-gray-800">المدينة الحالية</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600" />
                  </label>
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer">
                    <span className="text-xs font-extrabold text-gray-800">مكان المنشأ</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600" />
                  </label>
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer">
                    <span className="text-xs font-extrabold text-gray-800">تاريخ الميلاد</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600" />
                  </label>
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer">
                    <span className="text-xs font-extrabold text-gray-800">الحالة الاجتماعية</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600" />
                  </label>
                </div>
                <div className="pt-3 border-t border-gray-100 flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowPinnedModal(false);
                      showToast('تم حفظ التفاصيل المثبّتة');
                    }}
                    className="flex-1 bg-[#1877f2] hover:bg-blue-600 text-white py-2.5 rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer"
                  >
                    حفظ
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowPinnedModal(false)} 
                    className="px-4 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );

  // DEDICATED FULL-SCREEN EDIT PROFILE VIEW (مطابق للصورة تماماً)

  if (isEditing) {
    return (
      <div className="bg-white min-h-screen pb-24 font-sans dir-rtl select-none text-gray-900">
        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-16 left-1/2 -translate-x-1/2 z-[200] bg-gray-900 text-white font-bold px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-xs border border-gray-700"
            >
              <CheckCircle2 size={16} className="text-green-400" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TOP HEADER BAR (تعديل الملف الشخصي) */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <div className="w-8"></div>
          <h1 className="text-base sm:text-lg font-black text-gray-900 text-center flex-1">
            تعديل الملف الشخصي
          </h1>
          <button 
            onClick={() => setIsEditing(false)} 
            className="p-1 rounded-full text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            title="الرجوع إلى الملف الشخصي"
          >
            <ChevronLeft size={26} strokeWidth={2.5} />
          </button>
        </div>

        {/* COVER PHOTO & AVATAR MEDIA SECTION (مطابق للصورة تماماً) */}
        <div className="relative w-full bg-gray-100">
          {/* Cover Photo */}
          <div 
            onClick={() => setShowCoverModal(true)}
            className="w-full h-56 sm:h-64 bg-slate-900 relative overflow-hidden cursor-pointer group"
          >
            <img 
              src={displayCover} 
              alt="Cover" 
              className="w-full h-full object-cover  transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            
            {/* Camera button bottom-left on cover */}
            <div className="absolute bottom-3 left-4 z-20 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={coverInputRef} 
                onChange={(e) => handleImageUpload(e, 'cover')} 
              />
              <button 
                onClick={() => setShowCoverModal(true)}
                className="px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white font-bold text-xs flex items-center gap-1.5 shadow-lg border border-white/20 transition-all cursor-pointer"
                title="تعديل واختيار غلاف فيسبوك"
              >
                <Camera size={15} strokeWidth={2.3} />
                <span>تعديل الغلاف</span>
              </button>
            </div>
          </div>

          {/* Overlapping Avatar bottom-right */}
          <div className="absolute -bottom-10 right-4 z-30">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white overflow-hidden shadow-xl bg-gray-200">
                <img 
                  src={displayAvatar} 
                  alt={displayName} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Camera Button bottom-left on avatar */}
              <div className="absolute bottom-0 left-0 z-40 flex items-center gap-1.5">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={avatarInputRef} 
                  onChange={(e) => handleImageUpload(e, 'avatar')} 
                />
                <button 
                  onClick={() => avatarInputRef.current?.click()}
                  className="w-8 h-8 rounded-full bg-gray-200 text-gray-900 flex items-center justify-center border-2 border-white shadow-md hover:bg-gray-300 transition-all cursor-pointer"
                  title="تغيير الصورة الشخصية من الجهاز"
                >
                  <Camera size={15} strokeWidth={2.4} />
                </button>
                <button 
                  onClick={() => setShowAiAvatarPickerModal(true)}
                  className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center border-2 border-white shadow-md hover:scale-105 transition-all cursor-pointer"
                  title="رفع وتوليد صورة بالذكاء الاصطناعي (في أي مجال)"
                >
                  <Sparkles size={14} className="text-yellow-300" />
                </button>
              </div>

              {/* Shield Icon Badge */}
              <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center border border-white text-[10px]">
                <Shield size={13} strokeWidth={2.4} />
              </div>
            </div>
          </div>
        </div>

        {/* SECTIONS (نبذة مختصرة & التفاصيل الشخصية) */}
        <div className="pt-14 px-4 space-y-6">
          {/* SECTION 1: نبذة مختصرة */}
          <div className="border-b border-gray-100 pb-5">
            <button 
              onClick={() => setIntroSectionOpen(!introSectionOpen)}
              className="w-full flex items-center justify-between py-2 text-right cursor-pointer"
            >
              <div className="text-gray-400">
                {introSectionOpen ? <ChevronDown size={22} /> : <ChevronLeft size={22} />}
              </div>
              <h3 className="text-base font-black text-gray-900">نبذة مختصرة</h3>
            </button>

            {introSectionOpen && (
              <div className="mt-3 space-y-3 pr-1">
                {/* ITEM: السيرة الذاتية */}
                <div 
                  onClick={() => {
                    setBioInput(displayBio);
                    setShowBioModal(true);
                  }}
                  className="flex items-start justify-between p-2.5 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  <button className="p-1.5 text-gray-500 hover:text-[#1877f2] transition-colors rounded-full hover:bg-blue-50">
                    <Pencil size={18} strokeWidth={2.2} />
                  </button>
                  <div className="text-right flex-1 pr-3">
                    <div className="flex items-center justify-end gap-1.5 font-black text-gray-900 text-sm">
                      <span>السيرة الذاتية</span>
                      <span className="text-amber-600">✋</span>
                      <span className="text-xs text-gray-500 font-normal">( 🖊 )</span>
                    </div>
                    <p className="text-xs font-bold text-gray-700 mt-1 leading-relaxed dir-rtl whitespace-pre-line">
                      {displayBio || 'سيرة ذاتية'}
                    </p>
                  </div>
                </div>

                {/* ITEM: التفاصيل المثبّتة */}
                <div 
                  onClick={() => setShowPinnedModal(true)}
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  <div className="text-xs font-bold text-blue-600">تعديل</div>
                  <div className="flex items-center gap-2 font-black text-gray-900 text-sm">
                    <span>التفاصيل المثبّتة</span>
                    <Bookmark size={18} className="text-gray-600" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: التفاصيل الشخصية */}
          <div className="border-b border-gray-100 pb-5">
            <button 
              onClick={() => setPersonalDetailsSectionOpen(!personalDetailsSectionOpen)}
              className="w-full flex items-center justify-between py-2 text-right cursor-pointer"
            >
              <div className="text-gray-400">
                {personalDetailsSectionOpen ? <ChevronDown size={22} /> : <ChevronLeft size={22} />}
              </div>
              <h3 className="text-base font-black text-gray-900">التفاصيل الشخصية</h3>
            </button>

            {personalDetailsSectionOpen && (
              <div className="mt-3 space-y-3 pr-1">
                {/* ITEM: المدينة أو البلدة الحالية */}
                <div 
                  onClick={() => {
                    setCurrentCityInput(profileUser.currentCity || personalDetails.location || '');
                    setShowCityModal(true);
                  }}
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="text-xs font-bold text-blue-600">تعديل</div>
                  <div className="flex items-center gap-2.5 font-black text-gray-900 text-sm">
                    <span className="text-xs font-bold text-gray-700">
                      {profileUser.currentCity || personalDetails.location || 'المدينة أو البلدة الحالية'}
                    </span>
                    <MapPin size={18} className="text-gray-700 shrink-0" />
                  </div>
                </div>

                {/* ITEM: مكان المنشأ */}
                <div 
                  onClick={() => {
                    setHometownInput(profileUser.hometown || personalDetails.hometown || '');
                    setShowHometownModal(true);
                  }}
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="text-xs font-bold text-blue-600">تعديل</div>
                  <div className="flex items-center gap-2.5 font-black text-gray-900 text-sm">
                    <span className="text-xs font-bold text-gray-700">
                      {profileUser.hometown || personalDetails.hometown || 'مكان المنشأ'}
                    </span>
                    <HomeIcon size={18} className="text-gray-700 shrink-0" />
                  </div>
                </div>

                {/* ITEM: تاريخ الميلاد */}
                <div 
                  onClick={() => {
                    setBirthDateInput(profileUser.birthDate || '2008-08-11');
                    setBirthDatePrivacyInput(profileUser.birthDatePrivacy || 'public');
                    setShowBirthDateModal(true);
                  }}
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <button className="p-1.5 text-gray-500 hover:text-[#1877f2] transition-colors rounded-full hover:bg-blue-50">
                    <Pencil size={18} strokeWidth={2.2} />
                  </button>
                  <div className="flex items-center gap-2 font-black text-gray-900 text-sm">
                    <Lock size={14} className="text-gray-500" />
                    <span>{formatBirthDateArabic(profileUser.birthDate || '2008-08-11')}</span>
                    <Lock size={14} className="text-gray-500" />
                    <Cake size={18} className="text-gray-800 shrink-0" />
                  </div>
                </div>

                {/* ITEM: الحالة الاجتماعية */}
                <div 
                  onClick={() => {
                    setRelationshipInput(profileUser.relationshipStatus || personalDetails.relationship || 'مرتبط');
                    setShowRelationshipModal(true);
                  }}
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="text-xs font-bold text-blue-600">تعديل</div>
                  <div className="flex items-center gap-2.5 font-black text-gray-900 text-sm">
                    <span className="text-xs font-bold text-gray-700">
                      {profileUser.relationshipStatus || personalDetails.relationship || 'الحالة الاجتماعية'}
                    </span>
                    <Heart size={18} className="text-gray-800 shrink-0" />
                  </div>
                </div>

                {/* ITEM: العائلة */}
                <div 
                  onClick={() => {
                    setFamilyInput(profileUser.family || '');
                    setShowFamilyModal(true);
                  }}
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="text-xs font-bold text-blue-600">تعديل</div>
                  <div className="flex items-center gap-2.5 font-black text-gray-900 text-sm">
                    <span className="text-xs font-bold text-gray-700">
                      {profileUser.family || 'العائلة'}
                    </span>
                    <Users size={18} className="text-gray-800 shrink-0" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MODALS RENDERED HERE FOR EDIT PROFILE AS WELL */}
        {renderAllModals()}
      </div>
    );
  }

  // DEDICATED FULL-SCREEN OPTIONS MENU VIEW
  if (showOptionsMenu) {
    return (
      <div className="bg-white min-h-screen pb-24 font-sans dir-rtl select-none text-gray-900">
        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-16 left-1/2 -translate-x-1/2 z-[200] bg-gray-900 text-white font-bold px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-xs border border-gray-700"
            >
              <CheckCircle2 size={16} className="text-green-400" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-3 py-2.5 flex items-center gap-3">
          <button 
            onClick={() => setShowOptionsMenu(false)} 
            className="text-gray-900 hover:opacity-75 transition-opacity cursor-pointer p-1"
          >
            <ChevronRight size={28} strokeWidth={2.5} />
          </button>
          <span className="font-black text-lg">
            {isOwnProfile ? 'إعدادات الملف الشخصي' : 'خيارات الملف الشخصي'}
          </span>
        </div>

        <div className="p-4 space-y-4 max-w-2xl mx-auto">
          {/* Account Identity Card */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
            <img 
              src={displayAvatar} 
              alt={displayName} 
              className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm shrink-0" 
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-gray-900 text-base truncate">{displayName}</h4>
              <p className="text-sm text-gray-500 font-bold dir-ltr text-right truncate">
                @{profileUser.username || (profileUser.email ? profileUser.email.split('@')[0] : 'user')}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            {/* 1. نسخ رابط الملف الشخصي */}
            <button 
              onClick={() => {
                const profileUrl = `${window.location.origin}/profile/${profileUser.id}`;
                navigator.clipboard.writeText(profileUrl);
                showToast(isOwnProfile ? '✅ تم نسخ رابط ملفك الشخصي بنجاح' : `✅ تم نسخ رابط ملف ${displayName} الشخصي بنجاح`);
                setShowOptionsMenu(false);
              }}
              className="w-full p-4 rounded-2xl bg-white hover:bg-gray-50 flex items-center justify-between transition-colors cursor-pointer border border-gray-100 shadow-xs"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Copy size={22} />
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-gray-900 text-sm">نسخ رابط الملف الشخصي</p>
                  <p className="text-[11px] text-gray-500 font-normal mt-0.5">مشاركة الرابط المباشر للملف الشخصي</p>
                </div>
              </div>
              <ChevronLeft size={20} className="text-gray-400" />
            </button>

            {/* 2. عرض معلومات الحساب والملف الشخصي كواجهة */}
            <button 
              onClick={() => {
                setShowOptionsMenu(false);
                setShowProfileDetailsModal(true);
              }}
              className="w-full p-4 rounded-2xl bg-white hover:bg-indigo-50 flex items-center justify-between transition-colors cursor-pointer border border-gray-100 shadow-xs"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Info size={22} />
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-gray-900 text-sm">معلومات الحساب والملف الشخصي</p>
                  <p className="text-[11px] text-gray-500 font-normal mt-0.5">عرض بيانات الحساب، المعرف، ورقم الحساب المعتمد</p>
                </div>
              </div>
              <ChevronLeft size={20} className="text-indigo-400" />
            </button>

            {!isOwnProfile ? (
              <>
                {/* 3. إبلاغ عن حساب */}
                <button 
                  onClick={() => {
                    setShowOptionsMenu(false);
                    setShowReportModal(true);
                  }}
                  className="w-full p-4 rounded-2xl bg-white hover:bg-rose-50 flex items-center justify-between transition-colors cursor-pointer border border-gray-100 shadow-xs"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <AlertTriangle size={22} />
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-gray-900 text-sm">إبلاغ عن حساب</p>
                      <p className="text-[11px] text-gray-500 font-normal mt-0.5">الإبلاغ عن انتهاك لمعايير المجتمع أو انتحال شخصية</p>
                    </div>
                  </div>
                  <ChevronLeft size={20} className="text-gray-400" />
                </button>

                {/* 4. حظر الحساب */}
                <button 
                  onClick={() => {
                    blockUser(profileUser.id);
                    setShowOptionsMenu(false);
                    showToast(`تم حظر ${displayName} بنجاح`);
                    setCurrentView('home');
                  }}
                  className="w-full p-4 rounded-2xl bg-white hover:bg-gray-50 flex items-center justify-between transition-colors cursor-pointer border border-gray-100 shadow-xs"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                      <Ban size={22} />
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-gray-900 text-sm">حظر {displayName}</p>
                      <p className="text-[11px] text-gray-500 font-normal mt-0.5">منع المستخدم من التفاعل أو رؤية منشوراتك</p>
                    </div>
                  </div>
                  <ChevronLeft size={20} className="text-gray-400" />
                </button>
              </>
            ) : (
              <>
                {/* Own Profile Actions: Archive & Accounts Center */}
                <button 
                  onClick={() => {
                    setShowOptionsMenu(false);
                    setCurrentView('archive');
                  }}
                  className="w-full p-4 rounded-2xl bg-white hover:bg-blue-50 flex items-center justify-between transition-colors cursor-pointer border border-gray-100 shadow-xs"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Archive size={22} />
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-gray-900 text-sm">الأرشيف (Archive)</p>
                      <p className="text-[11px] text-gray-500 font-normal mt-0.5">منشورات وقصص محفوظة خاصة بك</p>
                    </div>
                  </div>
                  <ChevronLeft size={20} className="text-gray-400" />
                </button>



                <button 
                  onClick={() => {
                    setShowOptionsMenu(false);
                    handleEditClick();
                  }}
                  className="w-full p-4 rounded-2xl bg-white hover:bg-gray-50 flex items-center justify-between transition-colors cursor-pointer border border-gray-100 shadow-xs"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                      <Pencil size={22} />
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-gray-900 text-sm">تعديل الملف الشخصي</p>
                      <p className="text-[11px] text-gray-500 font-normal mt-0.5">تحديث الصورة والسيرة الذاتية والتفاصيل</p>
                    </div>
                  </div>
                  <ChevronLeft size={20} className="text-gray-400" />
                </button>

                <button 
                  onClick={() => {
                    setIsProfileLocked(!isProfileLocked);
                    setShowOptionsMenu(false);
                    showToast(isProfileLocked ? 'تم إلغاء قفل الملف الشخصي' : '🔒 تم قفل الملف الشخصي بنجاح');
                  }}
                  className="w-full p-4 rounded-2xl bg-white hover:bg-gray-50 flex items-center justify-between transition-colors cursor-pointer border border-gray-100 shadow-xs"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                      <Lock size={22} />
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-gray-900 text-sm">
                        {isProfileLocked ? 'إلغاء قفل الملف الشخصي' : 'قفل الملف الشخصي'}
                      </p>
                      <p className="text-[11px] text-gray-500 font-normal mt-0.5">حماية منشوراتك وصورك من غير الأصدقاء</p>
                    </div>
                  </div>
                  <ChevronLeft size={20} className="text-gray-400" />
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Render modals here too, in case one gets triggered while view is active, though they close the view usually */}
      </div>
    );
  }


  return (
    <div className="relative min-h-screen pb-24 font-sans dir-rtl select-none text-gray-900">
      {/* 100% CRYSTAL CLEAR STUDIO BACKGROUND - ZERO BLUR / ZERO FOG (خلفية الاستوديو فائقة الوضوح وبدون أي ضباب) */}
      <div 
        className="fixed inset-0 bg-cover bg-center -z-10 pointer-events-none transition-all duration-700"
        style={{ backgroundImage: `url('/profile_studio_cover.jpg')` }}
      />
      
      {/* TOP HEADER BAR (تصميم Apple iOS / iPhone المميز) */}
      <div className="sticky top-0 z-40 bg-white/90 border-b border-gray-200/70 px-4 py-2 flex items-center justify-between shadow-2xs">
        {/* Left side in RTL: iOS rounded action icon buttons */}
        <div className="flex items-center gap-2 text-gray-900">
          <button onClick={() => setShowOptionsMenu(true)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs" title="خيارات">
            <MoreHorizontal size={18} strokeWidth={2.3} />
          </button>
          <button className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs" title="بحث">
            <Search size={16} strokeWidth={2.3} />
          </button>
          <button className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs" title="تعديل">
            <Pencil size={16} strokeWidth={2.3} />
          </button>
        </div>
        
        {/* Center Name */}
        <div className="flex-1 flex justify-center items-center font-black text-[16px] text-gray-900 tracking-tight" onClick={() => setShowOptionsMenu(true)}>
          <span className="truncate max-w-[150px]">{displayName}</span>
        </div>

        {/* Right side in RTL: Back Arrow */}
        <div className="flex items-center gap-1.5 cursor-pointer w-[80px] justify-end">
          <button 
            onClick={() => setCurrentView('home')} 
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-900 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs"
            title="رجوع"
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-[200] bg-gray-900 text-white font-bold px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-xs border border-gray-700"
          >
            <CheckCircle2 size={16} className="text-green-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>


      {/* KEYBOARD BAN RESTRICTION ALERT BANNER (إذا كان الكيبورد محظوراً لمخالفة الصورة) */}
      {currentUser?.isKeyboardBanned && isOwnProfile && (
        <div className="bg-rose-600 text-white p-3.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-bold shadow-md animate-pulse">
          <div className="flex items-center gap-2">
            <ShieldAlert size={20} className="shrink-0 text-white" />
            <div>
              <span className="font-black block">⚠️ تنبيه أمني: تم حظر الكيبورد والكتابة على حسابك</span>
              <span className="text-[11px] text-rose-100 font-medium">{currentUser.keyboardBanReason || 'بسبب مخالفة إرشادات المجتمع بشأن الصورة الشخصية.'}</span>
            </div>
          </div>
          <button 
            onClick={() => unrestrictKeyboard()}
            className="bg-white text-rose-700 hover:bg-rose-50 px-3.5 py-1.5 rounded-xl font-black text-xs shadow-sm transition-all shrink-0 cursor-pointer flex items-center gap-1"
          >
            <span>⚡ فك الحظر الفوري عبر OWN</span>
          </button>
        </div>
      )}

      {/* COVER PHOTO AREA (تصميم غلاف فيسبوك الفاخر مع ملء كامل وتأثيرات سينمائية) */}
      <div className="relative bg-transparent pb-6 select-none">
        <div 
          onClick={() => setShowCoverModal(true)}
          className="w-full h-52 sm:h-64 md:h-72 relative overflow-hidden bg-slate-900 group cursor-pointer"
        >
          {/* Main Cover Image - Standard natural display */}
          <img 
            src={displayCover} 
            alt="Facebook Cover" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />

          {/* Cover Action Buttons */}
          {(isOwnProfile || isAiBotProfile) && (
            <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={coverInputRef} 
                onChange={(e) => handleImageUpload(e, 'cover')} 
              />
              
              <button 
                onClick={() => {
                  handleSelectCoverPreset('/profile_studio_cover.jpg');
                  showToast('🎹 تم تعيين غلاف استوديو الإنتاج والموسيقى بنجاح!');
                }}
                className="py-1.5 px-3 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-black border border-white/30 shadow-md hover:bg-black/80 transition-all cursor-pointer flex items-center gap-1.5"
                title="تعيين غلاف الاستوديو البنفسجي"
              >
                <Sparkles size={13} className="text-yellow-300" />
                <span>غلاف الاستوديو 🎹</span>
              </button>

              <button 
                onClick={() => setShowCoverModal(true)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-200 text-gray-900 flex items-center justify-center border-2 border-white shadow-md hover:bg-gray-300 transition-all cursor-pointer"
                title="تعديل صورة الغلاف"
              >
                <Camera size={20} strokeWidth={2.4} />
              </button>
            </div>
          )}
        </div>

        {/* PROFILE AVATAR & NAME / STATS SECTION */}
        <div className="px-4 relative flex flex-row items-end gap-4 -mt-[3.5rem] sm:-mt-[4.5rem] z-20 mb-3">
          
          {/* Avatar Container (Will be on the Right in RTL) */}
          <div className="relative shrink-0 flex flex-col items-center">
            {/* FLOATING CLOUD NOTE BUBBLE */}
            {(isOwnProfile || isTargetNoteActive) && (
              <div className="absolute -top-12 sm:-top-14 z-40">
                <motion.div 
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    if (isOwnProfile) {
                      setNewNoteInput(isTargetNoteActive ? (activeTargetNote?.text || '') : '');
                      setSelectedNoteMusic(isTargetNoteActive && activeTargetNote?.music ? (activeTargetNote.music as Song) : null);
                      setShowNoteModal(true);
                    } else if (activeTargetNote?.music?.url) {
                      togglePlayNoteMusic(activeTargetNote.music.url);
                    }
                  }}
                  className="relative group cursor-pointer flex flex-col items-center focus:outline-none"
                  title={isOwnProfile ? (isTargetNoteActive ? 'ملاحظتك وموسيقاك (انقر للتعديل أو الحذف)' : 'شارك ملاحظة وموسيقى لمدة 24 ساعة') : 'انقر لسماع الموسيقى أو قراءة الملاحظة'}
                >
                  <div className="relative px-5 py-2 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center min-w-[100px] max-w-[240px] z-10">
                    {isTargetNoteActive && activeTargetNote?.music ? (
                      <div className="flex items-center gap-2 min-w-0 w-full">
                        <button
                          type="button"
                          onClick={(e) => togglePlayNoteMusic(activeTargetNote.music!.url, e)}
                          className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 hover:scale-110 active:scale-95 text-white flex items-center justify-center shrink-0 shadow-xs transition-transform cursor-pointer"
                        >
                          {playingNoteAudioUrl === activeTargetNote.music.url ? (
                            <Pause size={12} className="fill-white" />
                          ) : (
                            <Play size={12} className="fill-white ml-0.5" />
                          )}
                        </button>
                        <div className="flex flex-col min-w-0 flex-1">
                          {activeTargetNote.text && (
                            <span className="text-sm font-bold text-gray-900 truncate">
                              {activeTargetNote.text}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-gray-900 text-center break-words line-clamp-2">
                        {displayNoteText}
                      </span>
                    )}
                  </div>
                  <div className="w-2.5 h-2.5 bg-white rounded-full mt-1 shadow-sm border border-gray-100" />
                </motion.div>
              </div>
            )}
            
            <div 
              onClick={() => setShowAvatarOptionsModal(true)}
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-[4px] border-white overflow-hidden shadow-md bg-gray-200 cursor-pointer relative group hover:ring-2 hover:ring-[#1877f2] transition-all"
              title="خيارات الصورة الشخصية"
            >
              <img 
                src={displayAvatar} 
                alt={displayName} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            
            {(isOwnProfile || isAiBotProfile) && (
              <div className="absolute bottom-1 left-0 z-30 flex items-center gap-1.5">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={avatarInputRef} 
                  onChange={(e) => handleImageUpload(e, 'avatar')} 
                />
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAvatarOptionsModal(true);
                  }}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-200 text-gray-900 flex items-center justify-center border-2 border-white shadow-md hover:bg-gray-300 transition-all cursor-pointer"
                  title="خيارات الصورة الشخصية"
                >
                  <Camera size={20} strokeWidth={2.4} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAiAvatarPickerModal(true);
                  }}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center border-2 border-white shadow-md hover:scale-105 transition-all cursor-pointer"
                  title="رفع وتوليد صورة بالذكاء الاصطناعي (في أي مجال)"
                >
                  <Sparkles size={17} className="text-yellow-300" />
                </button>
              </div>
            )}
          </div>

          {/* Name & Stats Container (Will be on the Left in RTL) */}
          <div className="flex-1 min-w-0 pb-1 sm:pb-3 text-right">
            {/* Name */}
            <div 
              className="flex items-center justify-start gap-1.5 group cursor-pointer"
              onClick={() => {
                if (isOwnProfile) {
                  setNameInput(profileUser.name || '');
                  setUsernameInput(profileUser.username || '');
                  setShowUsernameModal(true);
                }
              }}
            >
              <h1 className="text-[22px] sm:text-3xl font-extrabold text-gray-900 flex items-center gap-1.5 truncate">
                {displayName}
                {(profileUser?.id === 'ai-bot' || displayName === 'OWN AI') && (
                  <span className="bg-blue-500 text-white rounded-full w-4 h-4 inline-flex items-center justify-center text-[10px] font-bold shrink-0" title="موثق">✓</span>
                )}
              </h1>
            </div>

            {/* Nickname if any */}
            {profileUser.nickname && (
              <p className="text-sm font-bold text-gray-500 mt-0.5">({profileUser.nickname})</p>
            )}

            {/* Stats below name */}
            <div className="mt-1.5 flex items-center justify-start text-[14px] font-bold text-gray-700 gap-3">
              <span>{profileUser.friends?.length || 0} الأصدقاء</span>
              <span>{posts.filter(p => p.authorId === profileUser.id).length} منشورات</span>
            </div>
          </div>
        </div>

        {/* BIO LINE & BUTTONS WRAPPER */}
        <div className="px-4 flex flex-col items-center w-full">
          {/* BIO LINE */}
          <div className="mt-3 text-center max-w-lg w-full">
            {/* BIO LINE - ALWAYS FULL AND COMPLETE (ظهور السيرة الذاتية كاملة بدون أي اقتطاع) */}
            <div 
              onClick={() => {
                if (isOwnProfile) {
                  setBioInput(displayBio);
                  setShowBioModal(true);
                }
              }}
              className={`inline-block w-full max-w-md text-center ${isOwnProfile ? 'cursor-pointer group' : ''}`}
            >
              {displayBio ? (
                <p className="text-[15px] font-extrabold text-gray-900 leading-relaxed break-words whitespace-pre-line px-3 py-1.5 bg-white/75 rounded-2xl border border-white/70 shadow-2xs">
                  {displayBio}
                </p>
              ) : (
                <div className="text-sm font-bold text-gray-500 hover:text-gray-700 py-1">
                  <Pencil size={14} className="inline ml-1" />
                  إضافة سيرة ذاتية...
                </div>
              )}
            </div>
          </div>

          {/* PRIMARY ACTION BUTTONS */}
          <div className="w-full mt-4 max-w-md px-2">
            {isOwnProfile ? (
              <div className="flex flex-col gap-2">
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCurrentView('home')}
                  className="w-full bg-[#8b5cf6] hover:bg-purple-700 active:scale-95 text-white py-2 px-4 rounded-lg font-bold text-[15px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <Plus size={18} strokeWidth={2.5} />
                  <span>إضافة إلى القصة</span>
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  onClick={handleEditClick}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 py-2 px-4 rounded-lg font-bold text-[15px] flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Pencil size={16} strokeWidth={2.5} />
                  <span>تعديل الملف الشخصي</span>
                </motion.button>
              </div>
            ) : isAiBotProfile ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setActiveChat({ id: 'ai-bot', type: 'user' });
                    setCurrentView('messages');
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-2.5 px-4 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Sparkles size={18} className="text-yellow-300" />
                  <span>مراسلة المساعد OWN AI 🤖✨</span>
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAiCustomizerModal(true)}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  title="تغيير صورة وغلاف OWN AI"
                >
                  <Camera size={18} />
                  <span>تغيير الصورة والغلاف</span>
                </motion.button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {currentUser.friends?.includes(profileUser.id) ? (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        if (window.confirm(`هل أنت متأكد من إلغاء صداقة ${profileUser.name}؟`)) {
                          unfriend(profileUser.id);
                        }
                      }}
                      className="flex-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 py-2.5 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs"
                    >
                      <UserCheck size={18} className="text-emerald-600" />
                      <span>أصدقاء ✓ (إلغاء الصداقة)</span>
                    </button>
                    <button 
                      onClick={() => {
                        setActiveChat({ id: profileUser.id, type: 'user' });
                        setCurrentView('messages');
                      }}
                      className="flex-1 bg-[#8b5cf6] hover:bg-purple-700 text-white py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs"
                    >
                      <MessageCircle size={18} />
                      <span>مراسلة</span>
                    </button>
                  </div>
                ) : currentUser.friendRequests?.includes(profileUser.id) ? (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-purple-700 bg-purple-50 p-2 rounded-xl text-center border border-purple-100">
                      أرسل لك هذا الشخص طلب صداقة!
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => acceptFriendRequest(profileUser.id)}
                        className="flex-1 bg-[#8b5cf6] hover:bg-purple-700 text-white py-2.5 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs"
                      >
                        <Check size={18} />
                        <span>تأكيد الطلب</span>
                      </button>
                      <button 
                        onClick={() => declineFriendRequest(profileUser.id)}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all"
                      >
                        <X size={18} />
                        <span>حذف الطلب</span>
                      </button>
                    </div>
                  </div>
                ) : (profileUser.friendRequests?.includes(currentUser.id)) ? (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => cancelFriendRequest(profileUser.id)}
                      className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 py-2.5 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 transition-all"
                      title="اضغط لإلغاء طلب الصداقة"
                    >
                      <Clock size={17} className="animate-spin-slow" />
                      <span>تم إرسال الطلب (إلغاء)</span>
                    </button>
                    <button 
                      onClick={() => {
                        setActiveChat({ id: profileUser.id, type: 'user' });
                        setCurrentView('messages');
                      }}
                      className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all"
                    >
                      <MessageCircle size={18} />
                      <span>مراسلة</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <motion.button 
                      whileTap={{ scale: 0.98 }}
                      onClick={() => sendFriendRequest(profileUser.id)}
                      className="flex-1 bg-[#8b5cf6] hover:bg-purple-700 active:scale-95 text-white py-2.5 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                    >
                      <UserPlus size={18} strokeWidth={2.3} />
                      <span>إضافة صديق</span>
                    </motion.button>
                    <motion.button 
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setActiveChat({ id: profileUser.id, type: 'user' });
                        setCurrentView('messages');
                      }}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <MessageCircle size={18} className="text-gray-900" />
                      <span>مراسلة</span>
                    </motion.button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PROFILE NAVIGATION TABS (شريط الأقسام الكلاسيكي لفيسبوك شفاف بدون ضبابية) */}
      <div className="mt-0 border-y border-white/50 bg-white/80 sticky top-[49px] z-30 overflow-x-auto scrollbar-none shadow-2xs">
        <div className="flex justify-between items-center px-4 min-w-full gap-2">

          
          {/* الصور */}
          <button 
            onClick={() => setActiveTab('photos')}
            className={`flex-1 py-3 px-3 text-[15px] font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
              activeTab === 'photos' 
                ? 'text-[#8b5cf6] border-b-[3px] border-[#8b5cf6]' 
                : 'text-gray-600 hover:bg-white/40'
            }`}
          >
            الصور
          </button>
          
          {/* الكل */}
          <button 
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-3 px-3 text-[15px] font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
              (activeTab === 'all' || activeTab === 'posts')
                ? 'text-[#8b5cf6] border-b-[3px] border-[#8b5cf6]' 
                : 'text-gray-600 hover:bg-white/40'
            }`}
          >
            الكل
          </button>
        </div>
      </div>
      {/* TAB CONTENT: ALL (الكل) */}
      {activeTab === 'all' && (
        <div className="p-4 space-y-4">
          {/* Create Post in All Tab */}
          {isOwnProfile && <CreatePost />}
          {/* PERSONAL DETAILS SUMMARY (تصميم آيفون iOS Squircles مع خلفية زجاجية تبرز صورة الاستوديو بدون ضبابية) */}
          <div className="bg-white/85 p-4 rounded-3xl border border-white/80 shadow-md">
            <div className="flex items-center justify-between mb-4">
              {isOwnProfile ? (
                <button 
                  onClick={() => setShowEditDetailsModal(true)}
                  className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
                  title="تعديل التفاصيل"
                >
                  <Pencil size={14} strokeWidth={2.4} />
                </button>
              ) : <div></div>}
              <h3 className="font-extrabold text-lg text-gray-900">
                التفاصيل الشخصية
              </h3>
            </div>

            <div className="space-y-3.5">
              {/* Birthdate - iOS Pink/Rose Squircle */}
              <div className="flex items-center justify-end gap-3 text-gray-900 font-bold">
                <span className="text-[16px] font-extrabold text-gray-900 dir-rtl">
                  {profileUser.birthDate ? formatBirthDateArabic(profileUser.birthDate) : '١٦ مايو ٢٠٠٧'}
                </span>
                <div className="w-8 h-8 rounded-[10px] bg-gradient-to-tr from-[#FF2D55] to-[#FF375F] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Cake size={18} strokeWidth={2.4} />
                </div>
              </div>

              {/* Relationship - iOS Crimson Red Squircle */}
              <div className="flex items-center justify-end gap-3 text-gray-900">
                <div className="text-right">
                  <div className="text-[16px] font-extrabold text-gray-900">
                    {profileUser.relationshipStatus || personalDetails.relationship || 'مرتبط'}
                  </div>
                  <div className="text-xs text-gray-500 font-bold mt-0.5">
                    {personalDetails.relationshipDate || 'منذ ٢ أبريل ٢٠٢٥'}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-[10px] bg-gradient-to-tr from-[#FF3B30] to-[#FF453A] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Heart size={18} strokeWidth={2.4} className="fill-white" />
                </div>
              </div>

              {/* Residence Location - iOS Green Squircle */}
              <div className="flex items-center justify-end gap-3 text-gray-900 font-bold">
                <div className="text-right">
                  <span className="text-[16px] font-extrabold text-gray-900">
                    {personalDetails.location || 'Sidi Aïssa, Bouira, Algeria'}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-[10px] bg-gradient-to-tr from-[#34C759] to-[#30D158] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <HomeIcon size={18} strokeWidth={2.4} />
                </div>
              </div>
            </div>
          </div>

          {/* INTERESTS SECTION (الاهتمامات - أيقونة آيفون للموسيقى) */}
          <div className="bg-white/85 p-4 rounded-3xl border border-white/80 shadow-md">
            <div className="flex items-center justify-between mb-3">
              {isOwnProfile ? (
                <button 
                  onClick={() => {
                    const newTag = prompt('أدخل اهتماماً جديداً:');
                    if (newTag) {
                      setInterests([...interests, newTag]);
                      showToast('تمت إضافة الاهتمام بنجاح');
                    }
                  }}
                  className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
                  title="تعديل الاهتمامات"
                >
                  <Pencil size={14} strokeWidth={2.4} />
                </button>
              ) : <div></div>}
              <h3 className="font-extrabold text-lg text-gray-900">
                الاهتمامات
              </h3>
            </div>

            <div className="flex items-center justify-end gap-2 mt-1">
               <span className="text-[16px] font-extrabold text-gray-900">
                 الموسيقى
               </span>
               <div className="w-8 h-8 rounded-[10px] bg-gradient-to-tr from-[#FA2D48] to-[#FF2D55] text-white flex items-center justify-center shrink-0 shadow-xs">
                 <Music size={18} strokeWidth={2.4} />
               </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end gap-3 text-right dir-ltr items-center">
               <span className="font-serif italic text-[16px] font-bold text-gray-800">{personalDetails.customQuote}</span>
               <div className="w-9 h-9 rounded-[10px] bg-gradient-to-tr from-[#FA2D48] to-[#FF375F] text-white flex items-center justify-center shrink-0 shadow-xs">
                 <Music size={19} strokeWidth={2.4} />
               </div>
            </div>
          </div>

          <hr className="border-gray-200 border-[3px] -mx-4" />
          
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                <Grid size={18} className="text-[#1877f2]" />
                المنشورات
              </h3>
            </div>
            <Feed userId={profileUser.id} customPosts={isAiBotProfile ? [
              {
                id: 'ai-post-1',
                authorId: 'ai-bot',
                content: 'مرحباً بكم يا أصدقاء! 🤖✨ أنا **OWN AI** المساعد الذكي المدمج في ماسنجر وفيسبوك. جاهز دائماً لمساعدتكم في الإجابة على الأسئلة المعقدة، كتابة النصوص، وتوليد الصور الفنية المذهلة بضغطة زر واحدة! ما الذي تودون مناقشته اليوم؟ 🚀',
                image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80',
                time: 'منذ ساعة',
                reactions: { 'user-1': 'like' },
                comments: []
              },
              {
                id: 'ai-post-2',
                authorId: 'ai-bot',
                content: '💡 **نصيحة تقنية من OWN AI**: هل تعلم أنه يمكنك تفعيل نظام الرد السريع والاستفادة من الردود الفورية للأسئلة الشائعة دون انتظار؟ جرب التحدث معي الآن في المحادثة! 🌟',
                time: 'منذ 3 ساعات',
                reactions: {},
                comments: []
              }
            ] : undefined} />
          </div>

        </div>
      )}

      {/* TAB CONTENT: POSTS (المنشورات) */}
      {activeTab === 'posts' && (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
              <Grid size={18} className="text-[#1877f2]" />
              منشورات {displayName}
            </h3>
          </div>
          {isOwnProfile && <CreatePost />}
          <Feed userId={profileUser.id} customPosts={isAiBotProfile ? [
            {
              id: 'ai-post-1',
              authorId: 'ai-bot',
              content: 'مرحباً بكم يا أصدقاء! 🤖✨ أنا **OWN AI** المساعد الذكي المدمج في ماسنجر وفيسبوك. جاهز دائماً لمساعدتكم في الإجابة على الأسئلة المعقدة، كتابة النصوص، وتوليد الصور الفنية المذهلة بضغطة زر واحدة! ما الذي تودون مناقشته اليوم؟ 🚀',
              image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80',
              time: 'منذ ساعة',
              reactions: { 'user-1': 'like' },
              comments: []
            },
            {
              id: 'ai-post-2',
              authorId: 'ai-bot',
              content: '💡 **نصيحة تقنية من OWN AI**: هل تعلم أنه يمكنك تفعيل نظام الرد السريع والاستفادة من الردود الفورية للأسئلة الشائعة دون انتظار؟ جرب التحدث معي الآن في المحادثة! 🌟',
              time: 'منذ 3 ساعات',
              reactions: {},
              comments: []
            }
          ] : undefined} />
        </div>
      )}

      {/* TAB CONTENT: ABOUT (حول) */}
      {activeTab === 'about' && (
        <div className="p-4 bg-white space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <h3 className="font-extrabold text-lg text-gray-900 flex items-center gap-2">
              <Info size={22} className="text-[#1877f2]" />
              حول {displayName}
            </h3>
            {isOwnProfile && (
              <button 
                onClick={() => setShowEditDetailsModal(true)}
                className="px-3 py-1.5 bg-blue-50 text-[#1877f2] font-black rounded-xl text-xs flex items-center gap-1 border border-blue-200"
              >
                <Pencil size={14} />
                تعديل التفاصيل
              </button>
            )}
          </div>

          {/* Bio */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80 space-y-1">
            <p className="text-xs font-bold text-gray-500">السيرة الذاتية (Bio)</p>
            <p className="text-sm font-extrabold text-gray-900 whitespace-pre-line">{displayBio}</p>
          </div>

          {/* Basic Details List with iOS Squircles */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider">المعلومات الأساسية</h4>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-2xl border border-gray-200/60">
              <div className="w-8 h-8 rounded-[10px] bg-gradient-to-tr from-[#34C759] to-[#30D158] text-white flex items-center justify-center shrink-0 shadow-xs">
                <HomeIcon size={18} strokeWidth={2.4} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold">مكان الإقامة الحالي</p>
                <p className="text-sm font-black text-gray-900">{personalDetails.location || 'Sidi Aïssa, Bouira, Algeria'}</p>
              </div>
            </div>

            {profileUser.birthDate && (
              <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-2xl border border-gray-200/60">
                <div className="w-8 h-8 rounded-[10px] bg-gradient-to-tr from-[#FF2D55] to-[#FF375F] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Cake size={18} strokeWidth={2.4} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold">تاريخ الميلاد والبرج</p>
                  <p className="text-sm font-black text-gray-900">
                    {formatArabicDate(profileUser.birthDate)} ({calculateAge(profileUser.birthDate)} سنة) {getZodiacSign(profileUser.birthDate)?.emoji} {getZodiacSign(profileUser.birthDate)?.name}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-2xl border border-gray-200/60">
              <div className="w-8 h-8 rounded-[10px] bg-gradient-to-tr from-[#5856D6] to-[#706FD3] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Clock size={18} strokeWidth={2.4} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold">تاريخ الانضمام إلى GROZLA</p>
                <p className="text-sm font-black text-gray-900">أغسطس 2024</p>
              </div>
            </div>
          </div>

          {/* Interests with iOS Apple Music Pill Tags */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider">الاهتمامات والموسيقى المفضلة</h4>
            <div className="flex flex-wrap gap-2">
              {interests.map((item, idx) => (
                <span key={`profile-interest-${item}-${idx}`} className="px-3.5 py-1.5 bg-rose-50 text-[#FA2D48] font-black text-xs rounded-full border border-rose-200/70 flex items-center gap-1.5 shadow-2xs">
                  <div className="w-4 h-4 rounded-full bg-[#FA2D48] text-white flex items-center justify-center">
                    <Music size={10} strokeWidth={2.5} />
                  </div>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: FRIENDS (الأصدقاء) */}
      {activeTab === 'friends' && (
        <div className="p-4 bg-white space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-200">
            <div>
              <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                <Users size={20} className="text-[#1877f2]" />
                أصدقاء {displayName}
              </h3>
              <p className="text-xs font-bold text-gray-500 mt-0.5">{profileFriends.length} صديق</p>
            </div>
          </div>

          {profileFriends.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Users size={36} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm font-bold text-gray-600">لا يوجد أصدقاء للعرض حتى الآن</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {profileFriends.map((friend, fIdx) => (
                <div 
                  key={friend.id ? `prof-friend-${friend.id}-${fIdx}` : `prof-friend-${fIdx}`}
                  className="bg-gray-50 p-3 rounded-2xl border border-gray-200/80 flex flex-col items-center text-center space-y-2 group hover:border-blue-300 transition-all"
                >
                  <img 
                    src={friend.avatar} 
                    alt={friend.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-2xs  transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 w-full">
                    <h4 className="font-extrabold text-sm text-gray-900 truncate">{friend.name}</h4>
                    <p className="text-[11px] text-gray-500 font-medium truncate dir-ltr text-center">@{friend.username || friend.email?.split('@')[0]}</p>
                  </div>

                  <div className="flex gap-1.5 w-full pt-1">
                    <button 
                      onClick={() => setCurrentView('profile', friend.id)}
                      className="flex-1 py-1.5 bg-[#1877f2] hover:bg-blue-600 text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer shadow-2xs"
                    >
                      الملف
                    </button>
                    <button 
                      onClick={() => {
                        setActiveChat({ id: friend.id, type: 'user' });
                        setCurrentView('messages');
                      }}
                      className="p-1.5 bg-gray-200 hover:bg-blue-100 hover:text-[#1877f2] text-gray-800 rounded-xl transition-colors cursor-pointer"
                      title="مراسلة"
                    >
                      <MessageCircle size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: PHOTOS (الصور) */}
      {activeTab === 'photos' && (
        <div className="p-4 bg-white">
          <h3 className="font-extrabold text-base text-gray-900 mb-3 flex items-center gap-2">
            <ImageIcon size={18} className="text-[#1877f2]" />
            معرض الصور
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {profileUser.photoHistory?.length ? (
              profileUser.photoHistory.map((photo, pIdx) => (
                <div key={photo.id ? `prof-photo-${photo.id}-${pIdx}` : `prof-photo-${pIdx}`} className="aspect-square rounded-xl overflow-hidden border border-gray-200 relative group">
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  {isOwnProfile && (
                    <button 
                      onClick={() => deletePhotoFromHistory(photo.id)}
                      className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-700 text-white p-2 rounded-full shadow-lg transition-all cursor-pointer opacity-90 group-hover:opacity-100 flex items-center justify-center z-10"
                      title="حذف الصورة من الأرشيف"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))
            ) : (
              [1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="aspect-square rounded-xl overflow-hidden border border-gray-200">
                  <img src={`https://picsum.photos/seed/photo_${n}/300/300`} alt="" className="w-full h-full object-cover" />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Removed Reels section */}

      {/* FULL INTERFACE: REPORT ACCOUNT (واجهة الإبلاغ عن حساب) */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-[170] bg-gray-100 overflow-y-auto dir-rtl text-right">
            <div className="max-w-2xl mx-auto min-h-screen bg-white shadow-xl flex flex-col">
              {/* Header */}
              <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-3.5 flex items-center justify-between">
                <button 
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-950 p-2 rounded-xl hover:bg-gray-100 cursor-pointer"
                >
                  <ChevronRight size={20} />
                  <span>العودة للملف الشخصي</span>
                </button>
                <div className="flex items-center gap-2 text-rose-600">
                  <ShieldAlert size={18} />
                  <h3 className="font-extrabold text-sm text-gray-900">واجهة الإبلاغ عن حساب</h3>
                </div>
                <div className="w-16" />
              </div>

              {/* Interface Content */}
              <div className="p-4 sm:p-6 space-y-5 flex-1">
                {/* Target User Info */}
                <div className="flex items-center gap-3.5 p-4 bg-rose-50/70 rounded-2xl border border-rose-100 shadow-xs">
                  <img 
                    src={displayAvatar} 
                    alt={displayName} 
                    className="w-14 h-14 rounded-full object-cover border-2 border-rose-300 shrink-0" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-rose-600">أنت تقدم إبلاغاً رسمياً عن الحساب:</p>
                    <h4 className="font-black text-gray-900 text-base truncate">{displayName}</h4>
                    <p className="text-xs font-bold text-gray-500 mt-0.5">
                      الحد لتعليق الحساب تلقائياً: <span className="text-rose-600 font-black">10 إبلاغات</span> (المسجلة حالياً: {profileUser?.reports?.length || 0} / 10)
                    </p>
                  </div>
                </div>

                {/* Explanation of procedure */}
                <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-2xl text-xs font-medium text-blue-950 space-y-1">
                  <div className="flex items-center gap-1.5 font-black text-blue-800">
                    <Sparkles size={16} />
                    <span>مراجعة الذكاء الاصطناعي الأمني الصارم</span>
                  </div>
                  <p className="text-blue-900/90 leading-relaxed">
                    يتم فحص بلاغك والمراسلات المتبادلة والمنشورات فوراً عبر أنظمة الذكاء الاصطناعي. عند وصول الحساب إلى 10 إبلاغات مؤكدة، سيتم تعليقه وإزالته نهائياً وتصلك إفادة رسمية في الإشعارات.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-black text-gray-800">حدد سبب الإبلاغ:</p>
                  <div className="space-y-2">
                    {[
                      { id: 'impersonation', label: 'انتحال شخصية شخص آخر أو شخصية عامة' },
                      { id: 'fake_account', label: 'حساب زائف أو وهمي' },
                      { id: 'inappropriate', label: 'نشر محتوى غير لائق أو مسيء أو مخل بالآداب' },
                      { id: 'harassment', label: 'مضايقة أو تنمر أو سب وشتم' },
                      { id: 'spam', label: 'احتيال أو نصب أو منشورات مزعجة (سبام)' },
                      { id: 'violence', label: 'عنف أو خطاب كراهية أو تهديد بالضرر' },
                      { id: 'underage', label: 'مستخدم دون السن القانوني المسموح به' }
                    ].map((item, itemIdx) => (
                      <label 
                        key={`profile-report-reason-${item.id}-${itemIdx}`}
                        onClick={() => setSelectedReportReason(item.label)}
                        className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                          selectedReportReason === item.label
                            ? 'border-[#8b5cf6] bg-purple-50 text-[#8b5cf6] shadow-xs'
                            : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <span>{item.label}</span>
                        <input 
                          type="radio" 
                          name="reportReason" 
                          checked={selectedReportReason === item.label}
                          onChange={() => setSelectedReportReason(item.label)}
                          className="accent-[#1877f2] w-4 h-4 cursor-pointer"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Extra details */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">تفاصيل إضافية حول المخالفة (اختياري):</label>
                  <textarea 
                    value={customReportText}
                    onChange={e => setCustomReportText(e.target.value)}
                    placeholder="اكتب ملاحظات إضافية حول المخالفة لمساعدة الذكاء الاصطناعي الأمني في التدقيق..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none focus:border-[#1877f2] bg-gray-50 focus:bg-white resize-none transition-colors"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex gap-3 shadow-lg">
                <button 
                  type="button"
                  disabled={isSubmittingReport}
                  onClick={async () => {
                    setIsSubmittingReport(true);
                    try {
                      const fullReason = customReportText.trim() 
                        ? `${selectedReportReason} - ${customReportText.trim()}`
                        : selectedReportReason;
                      await reportUser(profileUser.id, fullReason);
                      setShowReportModal(false);
                      setCustomReportText('');
                    } finally {
                      setIsSubmittingReport(false);
                    }
                  }}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:opacity-50 text-white py-3 rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <AlertTriangle size={16} />
                  <span>{isSubmittingReport ? 'الذكاء الاصطناعي يدقق المراسلات والحسابات...' : 'إرسال البلاغ والتدقيق الفوري'}</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-5 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT PUBLIC DETAILS (تعديل التفاصيل الشخصية) */}
      <AnimatePresence>
        {showEditDetailsModal && (
          <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-gray-200 dir-rtl text-right overflow-hidden space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <h3 className="font-black text-gray-900 text-base">تعديل التفاصيل الشخصية</h3>
                <button onClick={() => setShowEditDetailsModal(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto px-1">
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 mb-1">مكان الإقامة / المدينة</label>
                  <input 
                    type="text" 
                    value={personalDetails.location} 
                    onChange={e => setPersonalDetails({...personalDetails, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 mb-1">الحالة الاجتماعية</label>
                  <input 
                    type="text" 
                    value={personalDetails.relationship} 
                    onChange={e => setPersonalDetails({...personalDetails, relationship: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 mb-1">تاريخ / تفاصيل الحالة (مثل: منذ تاريخ كذا)</label>
                  <input 
                    type="text" 
                    value={personalDetails.relationshipDate} 
                    onChange={e => setPersonalDetails({...personalDetails, relationshipDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 mb-1">عبارة أو أغنية الملف الشخصي</label>
                  <input 
                    type="text" 
                    value={personalDetails.customQuote} 
                    onChange={e => setPersonalDetails({...personalDetails, customQuote: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex gap-2">
                <button 
                  onClick={() => {
                    setShowEditDetailsModal(false);
                    showToast('تم تحديث التفاصيل الشخصية بنجاح');
                  }}
                  className="flex-1 py-2.5 bg-[#1877f2] text-white font-extrabold rounded-xl text-xs shadow-md"
                >
                  حفظ التغييرات
                </button>
                <button 
                  onClick={() => setShowEditDetailsModal(false)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: SHARE NOTE (24 Hours Lifecycle + AI Music) */}
      <AnimatePresence>
        {showNoteModal && (
          <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-gray-200 dir-rtl text-right overflow-hidden space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
                  <Clock size={20} className="text-[#1877f2]" />
                  <span>ملاحظة الملف الشخصي (24 ساعة)</span>
                </h3>
                <button onClick={() => setShowNoteModal(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              {/* 24-hour Expiration Notice */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-xs text-blue-900 font-bold space-y-1">
                <div className="flex items-center gap-1.5 font-black text-blue-700">
                  <Clock size={15} />
                  <span>تدوم الملاحظة 24 ساعة فقط</span>
                </div>
                <p className="text-[11px] text-gray-600 font-medium">
                  تختفي ملاحظتك تلقائياً بعد مرور 24 ساعة من لحظة مشاركتها، وتظهر فوق صورتك الشخصية وفي مسنجر مع مقطع الموسيقى المختار.
                </p>
                {isTargetNoteActive && (
                  <div className="pt-1 mt-1 border-t border-blue-200/50 text-[11px] text-emerald-700 font-black">
                    🟢 الملاحظة الحالية نشطة (متبقي {getNoteRemainingTime(activeTargetNote)})
                  </div>
                )}
              </div>

              {/* Note Text Input */}
              <div>
                <label className="block text-xs font-extrabold text-gray-700 mb-1">اكتب ملاحظتك (تظهر أعلى الغلاف فوق صورتك)</label>
                <input 
                  type="text" 
                  value={newNoteInput}
                  onChange={e => setNewNoteInput(e.target.value)}
                  placeholder="مثال: حكايتي هيا راني مطنن..."
                  maxLength={60}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-1">
                  <span>حد أقصى 60 حرفاً</span>
                  <span>{newNoteInput.length}/60</span>
                </div>
              </div>

              {/* Music Attachment Section */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-gray-700">موسيقى الملاحظة (مدعوم ببحث الذكاء الاصطناعي)</label>
                
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
                    <span>إضافة موسيقى للملاحظة 🎵 (بحث ذكي بالذكاء الاصطناعي ويدعم العربية)</span>
                    <Sparkles size={14} className="text-amber-500" />
                  </button>
                )}
              </div>

              <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowNoteModal(false)}
                    className="px-4 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-200 cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button 
                    onClick={() => {
                      if (newNoteInput.trim() || selectedNoteMusic) {
                        updateUserNote(newNoteInput.trim(), selectedNoteMusic);
                        setShowNoteModal(false);
                        showToast('تم نشر الملاحظة لـ 24 ساعة بنجاح');
                      }
                    }}
                    disabled={!newNoteInput.trim() && !selectedNoteMusic}
                    className={`flex-1 py-2.5 ${newNoteInput.trim() || selectedNoteMusic ? 'bg-[#1877f2] text-white hover:bg-blue-600 shadow-md cursor-pointer' : 'bg-gray-200 text-gray-400 cursor-not-allowed'} font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5`}
                  >
                    <Clock size={14} />
                    <span>{isTargetNoteActive ? 'تجديد لـ 24 ساعة' : 'مشاركة لـ 24 ساعة'}</span>
                  </button>
                </div>

                {isTargetNoteActive && isOwnProfile && (
                  <button 
                    onClick={() => {
                      updateUserNote('', null);
                      setSelectedNoteMusic(null);
                      setShowNoteModal(false);
                      showToast('تم حذف الملاحظة');
                    }}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl border border-rose-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>حذف الملاحظة الآن</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MUSIC SELECTOR MODAL FOR PROFILE NOTE */}
      <StoryMusicSelector
        isOpen={showMusicPickerForNote}
        onClose={() => setShowMusicPickerForNote(false)}
        title="موسيقى الملاحظة (24 ساعة)"
        subtitle="ابحث بالذكاء الاصطناعي وباللغة العربية عن أي فنان أو أغنية"
        currentSongUrl={selectedNoteMusic?.url}
        onSelectSong={(song) => {
          setSelectedNoteMusic(song);
          setShowMusicPickerForNote(false);
        }}
      />

      {/* RENDER ALL MODALS */}
      {renderAllModals()}

      {/* FLOATING QUICK ACTION BAR FOR OTHER USERS */}
      {!isOwnProfile && (
        <div className="fixed bottom-14 left-0 right-0 z-40 px-4 py-2 pointer-events-none flex justify-center">
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="pointer-events-auto bg-white/95 backdrop-blur-md border border-gray-200/90 shadow-xl rounded-full px-4 py-2 flex items-center justify-between gap-3 max-w-md w-full"
          >
            <div className="flex items-center gap-2 min-w-0 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img 
                src={displayAvatar} 
                alt={displayName} 
                className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <h4 className="text-xs font-black text-gray-900 truncate">{displayName}</h4>
                <p className="text-[10px] text-gray-500 font-bold truncate">
                  {isFriend ? 'صديق' : hasSentRequest ? 'تم إرسال طلب' : 'ملف شخصي'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {!isFriend && !hasSentRequest && !hasReceivedRequest && (
                <button
                  onClick={() => {
                    sendFriendRequest(profileUser.id);
                    showToast('تم إرسال طلب الصداقة');
                  }}
                  className="bg-[#1877f2] hover:bg-blue-600 text-white text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                >
                  <UserPlus size={14} />
                  <span>إضافة صديق</span>
                </button>
              )}
              {hasReceivedRequest && (
                <button
                  onClick={() => {
                    acceptFriendRequest(profileUser.id);
                    showToast('تم قبول طلب الصداقة');
                  }}
                  className="bg-[#1877f2] hover:bg-blue-600 text-white text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                >
                  <Check size={14} />
                  <span>تأكيد</span>
                </button>
              )}
              <button
                onClick={() => {
                  setActiveChat({ id: profileUser.id, type: 'user' });
                  setCurrentView('messages');
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 transition-all cursor-pointer border border-gray-200"
              >
                <MessageCircle size={14} className="text-[#1877f2]" />
                <span>مراسلة</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

    
      {/* AI Reject Modal */}
      <AnimatePresence>
        {aiRejectModal && (
          <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center w-full max-w-md"
            >
              <h1 className="text-white text-6xl font-black mb-16">نأسف لذالك</h1>
              
              <div className="mt-32 space-y-6">
                <p className="text-gray-400 text-sm font-medium">تعذر علينا وصول الي صفحة موالية</p>
                <button 
                  onClick={() => {}} 
                  className="px-8 py-3 bg-white text-black font-bold rounded-full w-full"
                >
                  اغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PHOTO LIBRARY & CUSTOMIZATION MODAL */}
      {showPhotoLibraryModal && (
        <div className="fixed inset-0 z-[110] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm dir-rtl">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="font-black text-gray-900 text-base">
                  {selectedPhotoTypeForSelection === 'avatar' ? 'اختيار صورة ملف شخصي' : 'اختيار صورة غلاف'}
                </h3>
                <p className="text-xs text-gray-500">اختر من الصور المحفوظة في ملفك الشخصي</p>
              </div>
              <button 
                onClick={() => {
                  setShowPhotoLibraryModal(false);
                  setSelectedCustomizationPhoto(null);
                }}
                className="w-9 h-9 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center hover:bg-gray-300 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Area: If photo selected, show customizer; else show photo gallery */}
            {selectedCustomizationPhoto ? (
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                <div className="text-center font-bold text-sm text-gray-800">تخصيص مظهر الصورة المختارة</div>
                
                {/* Live Preview Box */}
                <div className="flex justify-center my-4">
                  <div className={`overflow-hidden border-4 border-gray-200 shadow-lg bg-gray-100 transition-all duration-300 ${
                    selectedPhotoTypeForSelection === 'avatar' 
                      ? (photoCurve === 'full' ? 'rounded-full w-40 h-40' : photoCurve === 'sm' ? 'rounded-2xl w-40 h-40' : 'rounded-none w-40 h-40')
                      : (photoCurve === 'full' ? 'rounded-3xl w-full h-48' : photoCurve === 'sm' ? 'rounded-xl w-full h-48' : 'rounded-none w-full h-48')
                  }`}>
                    <img 
                      src={selectedCustomizationPhoto} 
                      alt="Preview" 
                      className="w-full h-full object-cover transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                {/* Customization Options */}
                <div className="space-y-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  {/* Curve Options */}
                  <div>
                    <label className="block text-xs font-black text-gray-800 mb-1.5">شكل الحواف (الانحناء):</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPhotoCurve('none')}
                        className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${photoCurve === 'none' ? 'bg-[#1877f2] text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-200'}`}
                      >
                        مربعة (حادة)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotoCurve('sm')}
                        className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${photoCurve === 'sm' ? 'bg-[#1877f2] text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-200'}`}
                      >
                        منحنية قليلاً
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotoCurve('full')}
                        className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${photoCurve === 'full' ? 'bg-[#1877f2] text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-200'}`}
                      >
                        {selectedPhotoTypeForSelection === 'avatar' ? 'دائرية كاملة' : 'منحنية جداً'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCustomizationPhoto(null)}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-2xl transition-colors cursor-pointer"
                  >
                    العودة للصور
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedPhotoTypeForSelection === 'avatar') {
                        if (isAiBotProfile) {
                          updateAiBotProfile({ avatar: selectedCustomizationPhoto }).catch(err => {
                            showToast(err.message || 'فشل تحديث الصورة');
                          });
                          showToast('تم تحديث وتخصيص صورة ملف OWN AI بنجاح 🤖✨');
                        } else {
                          updateProfile({ avatar: selectedCustomizationPhoto }).catch(err => {
                            showToast(err.message || 'فشل تحديث الصورة بسبب انتهاك المعايير');
                          });
                          showToast('تم تحديث وتخصيص صورة الملف الشخصي بنجاح');
                        }
                      } else {
                        if (isAiBotProfile) {
                          updateAiBotProfile({ cover: selectedCustomizationPhoto }).catch(err => {
                            showToast(err.message || 'فشل تحديث الغلاف');
                          });
                          showToast('تم تحديث وتخصيص غلاف OWN AI بنجاح 🤖✨');
                        } else {
                          updateProfile({ cover: selectedCustomizationPhoto }).catch(err => {
                            showToast(err.message || 'فشل تحديث الغلاف بسبب انتهاك المعايير');
                          });
                          showToast('تم تحديث وتخصيص صورة الغلاف بنجاح');
                        }
                      }
                      setShowPhotoLibraryModal(false);
                      setSelectedCustomizationPhoto(null);
                    }}
                    className="flex-1 py-3 bg-[#1877f2] hover:bg-blue-600 text-white font-black text-sm rounded-2xl shadow-md transition-all cursor-pointer"
                  >
                    تأكيد وتطبيق الصورة
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 overflow-y-auto flex-1 space-y-4">
                <p className="text-xs font-bold text-gray-500">اختر صورة من أرشيف صور ملفك الشخصي:</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {[
                    profileUser.avatar,
                    profileUser.cover,
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=60',
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=60',
                    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=60',
                    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=60',
                    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=60'
                  ].map((imgUrl, idx) => (
                    <div 
                      key={`profile-custom-photo-${idx}`}
                      onClick={() => setSelectedCustomizationPhoto(imgUrl)}
                      className="relative aspect-square rounded-2xl overflow-hidden border-2 border-transparent hover:border-[#8b5cf6] cursor-pointer group shadow-sm bg-gray-100 transition-all"
                    >
                      <img 
                        src={imgUrl} 
                        alt="Saved profile photo" 
                        className="w-full h-full object-cover  transition-transform duration-200"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                        اختيار وتخصيص
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* MODAL: PROFILE DETAILS & ACCOUNT INFO (واجهة معلومات الحساب) */}
      <AnimatePresence>
        {showProfileDetailsModal && (
          <div 
            onClick={() => setShowProfileDetailsModal(false)}
            className="fixed inset-0 z-[170] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 dir-rtl cursor-default"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-200 overflow-hidden flex flex-col text-right"
            >
              <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#1877f2] text-white flex items-center justify-center shadow-md shadow-blue-200 shrink-0">
                    <Info size={22} />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-base flex items-center gap-1.5">
                      <span>معلومات الحساب والملف</span>
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-black">
                        OWN ID
                      </span>
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">بطاقة بيانات الحساب المعتمدة</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowProfileDetailsModal(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Main Identity Banner */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-center gap-3.5">
                  <img 
                    src={displayAvatar} 
                    alt={displayName} 
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-sm shrink-0" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-gray-900 text-base truncate flex items-center gap-1.5">
                      <span>{displayName}</span>
                      <span className="text-blue-500 text-xs font-bold">✓</span>
                    </h4>
                    <p className="text-xs text-gray-500 font-mono dir-ltr text-right truncate">
                      @{profileUser.username || profileUser.email?.split('@')[0] || 'user'}
                    </p>
                    <span className="inline-block mt-1 text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-100">
                      حساب موثق بنظام OWN
                    </span>
                  </div>
                </div>

                {/* Structured Fields Grid */}
                <div className="space-y-2.5">
                  {/* Account Number */}
                  <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-bold flex items-center gap-1.5">
                      <Hash size={14} className="text-emerald-600" />
                      رقم الحساب المعتمد
                    </span>
                    <span className="text-xs font-black text-gray-900 font-mono dir-ltr">
                      {profileUser.accountNumber || `OWN-${profileUser.id.substring(0, 8).toUpperCase()}`}
                    </span>
                  </div>

                  {/* Name breakdown if available */}
                  {(profileUser.firstName || profileUser.lastName) && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-white rounded-xl border border-gray-200">
                        <span className="text-[11px] text-gray-400 block font-medium">الاسم الأول</span>
                        <span className="text-xs font-black text-gray-900 mt-0.5 block">{profileUser.firstName || '-'}</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-gray-200">
                        <span className="text-[11px] text-gray-400 block font-medium">اسم العائلة</span>
                        <span className="text-xs font-black text-gray-900 mt-0.5 block">{profileUser.lastName || '-'}</span>
                      </div>
                    </div>
                  )}

                  {/* Birthdate & Age if available */}
                  {profileUser.birthDate && (
                    <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-bold flex items-center gap-1.5">
                        <Calendar size={14} className="text-blue-600" />
                        تاريخ الميلاد
                      </span>
                      <span className="text-xs font-bold text-gray-900">
                        {formatArabicDate(profileUser.birthDate)}
                        {calculateAge(profileUser.birthDate) !== null && ` (${calculateAge(profileUser.birthDate)} سنة)`}
                      </span>
                    </div>
                  )}

                  {/* Direct Profile Link */}
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between">
                    <span className="text-xs text-blue-800 font-bold flex items-center gap-1.5">
                      <Globe size={14} className="text-blue-600" />
                      رابط الملف الشخصي
                    </span>
                    <button
                      onClick={() => {
                        const profileUrl = `${window.location.origin}/profile/${profileUser.id}`;
                        navigator.clipboard.writeText(profileUrl);
                        showToast('✅ تم نسخ رابط الملف الشخصي');
                      }}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-black flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Copy size={12} />
                      <span>نسخ الرابط</span>
                    </button>
                  </div>
                </div>

                {/* Bio text if any */}
                {profileUser.bio && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700 leading-relaxed font-medium">
                    <span className="text-[10px] text-gray-400 block mb-1 font-bold">السيرة الذاتية (Bio):</span>
                    {profileUser.bio}
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    const infoSummary = `بيانات الحساب:\nالاسم: ${displayName}\nالمعرف: @${profileUser.username || 'user'}\nرقم الحساب: ${profileUser.accountNumber || profileUser.id}\nالرابط: ${window.location.origin}/profile/${profileUser.id}`;
                    navigator.clipboard.writeText(infoSummary);
                    showToast('✅ تم نسخ ملخص بيانات الحساب بالكامل');
                  }}
                  className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-100 text-gray-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy size={14} />
                  <span>نسخ الملخص</span>
                </button>

                <button
                  onClick={() => setShowProfileDetailsModal(false)}
                  className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dedicated Accounts Center Modal for Profile */}
      <AccountsCenterModal
        isOpen={showAccountsCenterModal}
        onClose={() => setShowAccountsCenterModal(false)}
      />
</div>
  );
}
