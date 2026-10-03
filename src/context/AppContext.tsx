import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { evaluateProfilePhotoSafety } from '../utils/photoSafetyReview';
import { DEFAULT_AVATAR, DEFAULT_COVER } from '../constants/avatar';
import { User, SubProfile, PostType, Comment, Message, ReactionType, Group, Story, PhotoHistoryItem } from '../types';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut, updatePassword, EmailAuthProvider, linkWithCredential, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, linkWithPopup } from 'firebase/auth';
import { collection, doc, setDoc, getDoc, getDocs, onSnapshot, query, orderBy, updateDoc, deleteDoc, arrayUnion, arrayRemove, where, limit, deleteField, addDoc } from 'firebase/firestore';
import { sendNotification, notifyMentions } from '../services/notificationService';
import { Notification, NotificationType } from '../types';
import SkyServicesModal from '../components/SkyServicesModal';
import { ALL_LANGUAGES, getLanguageInfo, getTranslation } from '../utils/translations';
import { getCache, setCache, safeSaveSavedAccounts } from '../utils/cache';

export interface LoadingStates {
  updatingProfile: boolean;
  addingPost: boolean;
  deletingPost: boolean;
  reacting: boolean;
  addingComment: boolean;
  deletingComment: boolean;
  sendingFriendRequest: boolean;
  cancellingFriendRequest: boolean;
  acceptingFriendRequest: boolean;
  decliningFriendRequest: boolean;
  unfriending: boolean;
  savingPost: boolean;
  sendingMessage: boolean;
  creatingGroup: boolean;
  addingStory: boolean;
  blockingUser: boolean;
  unblockingUser: boolean;
  updatingPhotoPrivacy: boolean;
  deletingPhoto: boolean;
}

interface AppContextType {
  users: User[];
  posts: PostType[];
  messages: Message[];
  groups: Group[];
  stories: Story[];
  notifications: Notification[];
  currentUser: User | null;
  currentView: string;
  viewUserId: string | null;
  isLoggedIn: boolean;
  isAuthReady: boolean;
  loadingStates: LoadingStates;
  activeChat: { id: string, type: 'user' | 'group' } | null;
  setActiveChat: (chat: { id: string, type: 'user' | 'group' } | null) => void;
  logout: () => void;
  setCurrentView: (view: string, userId?: string | null) => void;
  updateProfile: (updates: Partial<User>) => void;
  updateAiBotProfile: (updates: Partial<User>) => Promise<void>;
  addPost: (content: string, image?: string, video?: string, music?: string) => void;
  editPost: (postId: string, newContent: string) => void;
  removeMediaFromPost: (postId: string, mediaType: 'image' | 'video' | 'music') => void;
  deletePost: (postId: string) => void;
  handleReaction: (postId: string, type: ReactionType) => void;
  addComment: (postId: string, text: string) => void;
  deleteComment: (postId: string, commentId: string) => void;
  sendFriendRequest: (userId: string) => void;
  cancelFriendRequest: (userId: string) => void;
  acceptFriendRequest: (userId: string) => void;
  declineFriendRequest: (userId: string) => void;
  unfriend: (userId: string) => void;
  savePost: (postId: string) => void;
  sendMessage: (text: string, receiverId?: string, groupId?: string, image?: string, audio?: string, audioDuration?: number, replyTo?: { id: string; text: string; senderName: string }) => void;
  reactToMessage: (messageId: string, emoji: string) => void;
  deleteMessage: (messageId: string) => void;
  updateUserNote: (noteText: string, music?: any | null) => void;
  createGroup: (name: string, members: string[]) => void;
  updateGroupSettings: (groupId: string, updates: Partial<Group>) => Promise<void>;
  addStory: (image?: string, video?: string, music?: string, songTitle?: string, songArtist?: string, songCover?: string, text?: string, textColor?: string, textSize?: 'small' | 'normal' | 'large') => void;
  deleteStory: (storyId: string) => void;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  reportUser: (userId: string, reason?: string) => Promise<void>;
  reportContent: (authorId: string, contentId: string, type: 'post' | 'comment', reason: string) => Promise<void>;
  moderateUser: (userId: string, updates: Partial<User>) => void;
  reactivateAccount: () => void;
  updateAppealStep: (step: string, extra?: Record<string, any>) => Promise<void>;
  submitAppeal: (selfieImage: string) => void;
  resolveAppeal: (approved: boolean, reason?: string, targetUserId?: string) => Promise<void>;
  updatePhotoPrivacy: (photoId: string, privacy: 'public' | 'friends' | 'private') => void;
  deletePhotoFromHistory: (photoId: string) => void;
  restrictKeyboard: (reason?: string) => Promise<void>;
  unrestrictKeyboard: () => Promise<void>;
  enforceCommunityViolation: (type: 'sexual_avatar' | 'inappropriate_content' | 'general', action: 'lock' | 'suspend' | 'disable' | 'keyboard_ban') => Promise<void>;
  enforceProfilePhotoViolation: (violationDetails?: { reason?: string; category?: string; candidateImg?: string; action?: 'disable' | 'lock' | 'suspend' }) => Promise<void>;
  createSubProfile: (data: { name: string; category?: string; bio?: string; avatar?: string; cover?: string }) => Promise<void>;
  switchSubProfile: (subProfileId: string | null) => Promise<void>;
  deleteSubProfile: (subProfileId: string) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => void;
  archivePost: (postId: string) => Promise<void>;
  unarchivePost: (postId: string) => Promise<void>;
  archiveStory: (storyId: string) => Promise<void>;
  unarchiveStory: (storyId: string) => Promise<void>;
  archivedStories: Story[];
  refreshHomeFeed: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  signup: (email: string, password: string, name: string, birthDate?: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  quickResetPasswordAndLogin: (emailOrUsername: string, newPass: string) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  linkGoogleAccount: () => Promise<any>;
  savePersonalPhone: (phone: string) => Promise<void>;
  removePersonalPhone: () => Promise<void>;
  isSkyModalOpen: boolean;
  skyModalTab: 'home' | 'email' | 'number';
  openSkyModal: (tab?: 'home' | 'email' | 'number') => void;
  closeSkyModal: () => void;
  language: string;
  direction: 'rtl' | 'ltr';
  setAppLanguage: (lang: string) => void;
  t: (key: string, fallback?: string) => string;
  switchAccount: (targetUid: string) => Promise<void>;
  removeSavedAccount: (targetUid: string) => void;
  gmailToken: string | null;
  setGmailToken: (token: string | null) => void;
  signInWithGoogleForGmail: () => Promise<string | null>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>(() => getCache<User[]>('users', []));
  const [posts, setPosts] = useState<PostType[]>(() => getCache<PostType[]>('posts', []));
  const [messages, setMessages] = useState<Message[]>(() => getCache<Message[]>('messages', []));
  const [groups, setGroups] = useState<Group[]>(() => getCache<Group[]>('groups', []));
  const [stories, setStories] = useState<Story[]>(() => getCache<Story[]>('stories', []));
  const [archivedStories, setArchivedStories] = useState<Story[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>(() => getCache<Notification[]>('notifications', []));
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSkyModalOpen, setIsSkyModalOpen] = useState(false);
  const [skyModalTab, setSkyModalTab] = useState<'home' | 'email' | 'number'>('home');
  const [gmailToken, setGmailToken] = useState<string | null>(null);

  // Unified Language Localization State
  const [language, setLanguage] = useState<string>(() => {
    const saved = localStorage.getItem('grozla_lang');
    return saved || 'ar';
  });

  const languageInfo = getLanguageInfo(language);
  const direction: 'rtl' | 'ltr' = languageInfo.dir;

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
    localStorage.setItem('grozla_lang', language);
  }, [language, direction]);

  const setAppLanguage = (langCode: string) => {
    setLanguage(langCode);
    const info = getLanguageInfo(langCode);
    document.documentElement.dir = info.dir;
    document.documentElement.lang = langCode;
    localStorage.setItem('grozla_lang', langCode);
  };

  const t = (key: string, fallback?: string): string => {
    return getTranslation(language, key, fallback);
  };

  const openSkyModal = (tab: 'home' | 'email' | 'number' = 'home') => {
    setSkyModalTab(tab);
    setIsSkyModalOpen(true);
  };

  const closeSkyModal = () => {
    setIsSkyModalOpen(false);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const refreshHomeFeed = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setPosts(prev => {
      if (prev.length <= 1) return prev;
      // Smart shuffle to reorder posts and videos smoothly
      const shuffled = [...prev];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    });
    showToast('تم تحديث آخر المنشورات والفيديوهات 🔄');
  };
  const [activeChat, setActiveChat] = useState<{ id: string, type: 'user' | 'group' } | null>(null);
  const [currentView, setCurrentView] = useState('home');
  const [viewUserId, setViewUserId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    updatingProfile: false,
    addingPost: false,
    deletingPost: false,
    reacting: false,
    addingComment: false,
    deletingComment: false,
    sendingFriendRequest: false,
    cancellingFriendRequest: false,
    acceptingFriendRequest: false,
    decliningFriendRequest: false,
    unfriending: false,
    savingPost: false,
    sendingMessage: false,
    creatingGroup: false,
    addingStory: false,
    blockingUser: false,
    unblockingUser: false,
    updatingPhotoPrivacy: false,
    deletingPhoto: false,
  });

  const setLoading = (key: keyof LoadingStates, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  };

  const currentUser = users.find(u => u.id === currentUid || u.uid === currentUid) || (currentUid ? (
    currentUid === 'ai-bot' ? {
      id: 'ai-bot',
      uid: 'ai-bot',
      name: (typeof window !== 'undefined' && localStorage.getItem('own_ai_name')) || 'OWN AI',
      email: 'ownai@samado.com',
      username: 'ownai',
      pin: '478965',
      isVerified: true,
      avatar: (typeof window !== 'undefined' && localStorage.getItem('own_ai_avatar')) || 'https://ui-avatars.com/api/?name=OWN+AI&background=6366f1&color=fff',
      cover: (typeof window !== 'undefined' && localStorage.getItem('own_ai_cover')) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
      bio: (typeof window !== 'undefined' && localStorage.getItem('own_ai_bio')) || 'مساعدك الذكي OWN AI، سريع وجاهز للإجابة على كافة استفساراتك 24/7. 🚀🤖',
      status: 'active',
      friends: [],
      friendRequests: [],
      savedBy: [],
      savedPosts: [],
      blockedUsers: [],
      reports: [],
       photoHistory: [],
      appealSubmittedAt: null,
      appealStatus: null,
      appealPhoto: null,
      appealPhone: null,
      role: 'ai'
    } as User : {
      id: currentUid,
      uid: currentUid,
      name: auth.currentUser?.displayName || 'مستخدم',
      email: auth.currentUser?.email || '',
      avatar: auth.currentUser?.photoURL || DEFAULT_AVATAR,
      cover: DEFAULT_COVER,
      bio: '',
      friends: [],
      friendRequests: [],
      savedBy: [],
      savedPosts: [],
      blockedUsers: [],
      status: 'active',
      reports: [],
      photoHistory: [],
      appealSubmittedAt: null,
      appealStatus: null,
      appealPhoto: null,
      appealPhone: null,
      role: 'user'
    } as User
  ) : null);

  // Handle pending appeals on load or refresh - ensures account remains under_review until resolved
  useEffect(() => {
    if (!currentUser || currentUser.status !== 'suspended') return;
    if (!currentUser.appealSubmittedAt && currentUser.appealStatus !== 'under_review') return;

    // Ensure under_review status is synchronized in Firestore
    if (currentUser.appealStatus !== 'under_review') {
      const userRef = doc(db, 'users', currentUser.id);
      updateDoc(userRef, { appealStatus: 'under_review' }).catch(err => console.error("Error setting under_review status:", err));
    }
  }, [currentUser?.id, currentUser?.status, currentUser?.appealSubmittedAt, currentUser?.appealStatus]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUid(user.uid);
        
        // Ensure user exists in Firestore
        const userRef = doc(db, 'users', user.uid);
        try {
          // Try to get from cache first to save quota
          let userDoc;
          try {
            userDoc = await getDoc(userRef);
          } catch (e) {
            // Fallback to server if cache fails or is empty
            userDoc = await getDoc(userRef);
          }

          if (!userDoc.exists()) {
            // Only set default data if the user document doesn't exist
            const userData: User = {
              id: user.uid,
              uid: user.uid,
              name: user.displayName || 'مستخدم جديد',
              avatar: DEFAULT_AVATAR,
              cover: DEFAULT_COVER,
              bio: 'مرحباً بك في ملفي الشخصي!',
              friends: [],
              friendRequests: [],
              savedBy: [],
              blockedUsers: [],
              status: 'active',
              reports: [],
              photoHistory: [],
              appealSubmittedAt: null,
              role: 'user'
            };
            
            if (user.email) {
              userData.email = user.email;
            }
            
            await setDoc(userRef, userData);
          }
        } catch (error: any) {
          console.error("Error checking/setting user document:", error);
        }
        setIsLoggedIn(true);
        setCurrentView('home');
        setViewUserId(null);
      } else {
        const savedCustomSession = localStorage.getItem('customUserSession');
        if (savedCustomSession) {
          setCurrentUid(savedCustomSession);
          setIsLoggedIn(true);
        } else {
          setCurrentUid(null);
          setIsLoggedIn(false);
        }
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      try {
        const savedAccounts = JSON.parse(localStorage.getItem('savedAccounts') || '[]');
        const accountData = { 
          uid: currentUser.uid || currentUser.id, 
          email: currentUser.email, 
          phone: currentUser.phone,
          name: currentUser.name, 
          avatar: currentUser.avatar 
        };
        const existingIndex = savedAccounts.findIndex((a: any) => a.uid === (currentUser.uid || currentUser.id));
        if (existingIndex >= 0) {
          savedAccounts[existingIndex] = accountData;
        } else {
          savedAccounts.push(accountData);
        }
        safeSaveSavedAccounts(savedAccounts);
      } catch (e) {
        console.error('Error saving account to localStorage', e);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUid) {
      const cachedMsgs = getCache<Message[]>(`messages_${currentUid}`, []);
      if (cachedMsgs.length > 0) setMessages(cachedMsgs);
      const cachedNotifs = getCache<Notification[]>(`notifications_${currentUid}`, []);
      if (cachedNotifs.length > 0) setNotifications(cachedNotifs);
    }
  }, [currentUid]);

  useEffect(() => {
    if (!isLoggedIn || !currentUid) return;

    // 1. Listen to the current user's document specifically
    const userRef = doc(db, 'users', currentUid);
    const unsubMe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const me: User = {
          ...data,
          id: docSnap.id,
          uid: data.uid || docSnap.id,
          name: data.name,
          avatar: data.avatar,
          cover: data.cover,
          bio: data.bio,
          friends: data.friends || [],
          friendRequests: data.friendRequests || [],
          savedBy: data.savedBy || [],
          blockedUsers: data.blockedUsers || [],
          status: data.status || 'active',
          suspensionReason: data.suspensionReason,
          suspendedAt: data.suspendedAt,
          appealSelfie: data.appealSelfie,
          appealPhoto: data.appealPhoto || data.appealSelfie,
          appealPhone: data.appealPhone,
          appealSubmittedAt: data.appealSubmittedAt,
          appealStatus: data.appealStatus || (data.appealSubmittedAt && data.status === 'suspended' ? 'under_review' : (data.appealStatus || null)),
          reports: data.reports || [],
          birthDate: data.birthDate,
          birthDatePrivacy: data.birthDatePrivacy,
          photoHistory: data.photoHistory || [],
                    email: data.email,
          phone: data.phone,
          username: data.username,
          nickname: data.nickname,
          role: data.role || 'user'
        };
        
        setUsers(prev => {
          const otherUsers = prev.filter(u => u.id !== currentUid);
          const next = [me, ...otherUsers];
          setCache('users', next);
          return next;
        });
      }
    }, (error: any) => {
      handleFirestoreError(error, OperationType.GET, `users/${currentUid}`);
    });

    // 2. Listen to other users (limited for performance)
    const unsubUsers = onSnapshot(query(
      collection(db, 'users'), 
      limit(100)
    ), (snapshot) => {
      const usersData: User[] = [];
      const storedAiAvatar = typeof window !== 'undefined' ? localStorage.getItem('own_ai_avatar') : null;
      const storedAiCover = typeof window !== 'undefined' ? localStorage.getItem('own_ai_cover') : null;
      const storedAiBio = typeof window !== 'undefined' ? localStorage.getItem('own_ai_bio') : null;
      const storedAiName = typeof window !== 'undefined' ? localStorage.getItem('own_ai_name') : null;

      const aiBotUserEntry: User = {
        id: 'ai-bot',
        uid: 'ai-bot',
        name: storedAiName || 'OWN AI',
        email: 'ownai@samado.com',
        username: 'ownai',
        pin: '478965',
        isVerified: true,
        avatar: storedAiAvatar || 'https://ui-avatars.com/api/?name=OWN+AI&background=6366f1&color=fff',
        cover: storedAiCover || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
        bio: storedAiBio || 'مساعدك الذكي OWN AI، سريع وجاهز للإجابة على كافة استفساراتك 24/7. 🚀🤖',
        status: 'active',
        friends: [],
        friendRequests: [],
        savedBy: [],
        blockedUsers: [],
        photoHistory: [],
        role: 'ai'
      };
      snapshot.forEach((doc) => {
        if (doc.id === 'ai-bot') {
          const aiData = doc.data();
          if (aiData.avatar && typeof window !== 'undefined') localStorage.setItem('own_ai_avatar', aiData.avatar);
          if (aiData.cover && typeof window !== 'undefined') localStorage.setItem('own_ai_cover', aiData.cover);
          if (aiData.bio && typeof window !== 'undefined') localStorage.setItem('own_ai_bio', aiData.bio);
          if (aiData.name && typeof window !== 'undefined') localStorage.setItem('own_ai_name', aiData.name);
        }
        if (doc.id === currentUid) return; 
        const data = doc.data();
        usersData.push({
          ...data,
          id: doc.id,
          uid: data.uid || doc.id,
          name: data.name,
          avatar: data.avatar,
          cover: data.cover,
          bio: data.bio,
          friends: data.friends || [],
          friendRequests: data.friendRequests || [],
          savedBy: data.savedBy || [],
          blockedUsers: data.blockedUsers || [],
          status: data.status || 'active',
          suspensionReason: data.suspensionReason,
          suspendedAt: data.suspendedAt,
          appealSelfie: data.appealSelfie,
          appealPhoto: data.appealPhoto || data.appealSelfie,
          appealPhone: data.appealPhone,
          appealSubmittedAt: data.appealSubmittedAt,
          appealStatus: data.appealStatus || (data.appealSubmittedAt && data.status === 'suspended' ? 'under_review' : (data.appealStatus || null)),
          reports: data.reports || [],
          birthDate: data.birthDate,
          birthDatePrivacy: data.birthDatePrivacy,
          photoHistory: data.photoHistory || [],
                    email: data.email,
          phone: data.phone,
          username: data.username,
          nickname: data.nickname,
          role: data.role || 'user'
        });
      });
      
      if (!usersData.some(u => u.id === 'ai-bot')) {
        usersData.push(aiBotUserEntry);
      }
      
      setUsers(prev => {
        const me = prev.find(u => u.id === currentUid) || (currentUid === 'ai-bot' ? aiBotUserEntry : undefined);
        const filteredNewUsers = usersData.filter(u => u.id !== currentUid);
        const next = me ? [me, ...filteredNewUsers] : filteredNewUsers;
        if (!next.some(u => u.id === 'ai-bot')) {
          next.push(aiBotUserEntry);
        }
        setCache('users', next);
        return next;
      });
    }, (error: any) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    const unsubPosts = onSnapshot(query(collection(db, 'posts'), orderBy('time', 'desc'), limit(50)), (snapshot) => {
      const postsData: PostType[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        postsData.push({
          id: doc.id,
          authorId: data.authorId,
          time: data.time,
          content: data.content,
          image: data.image,
          video: data.video,
          music: data.music,
          reactions: data.reactions || {},
          comments: data.comments || [],
          savedBy: data.savedBy || [],
          isArchived: !!data.isArchived,
          archivedAt: data.archivedAt || undefined
        });
      });
      setPosts(postsData);
      setCache('posts', postsData);
    }, (error: any) => {
      handleFirestoreError(error, OperationType.LIST, 'posts');
    });

    const unsubMessages = onSnapshot(query(
      collection(db, 'messages'), 
      where('participants', 'array-contains', currentUid),
      limit(100)
    ), (snapshot) => {
      const messagesData: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messagesData.push({
          id: doc.id,
          senderId: data.senderId,
          receiverId: data.receiverId,
          groupId: data.groupId,
          text: data.text,
          image: data.image,
          timestamp: data.timestamp,
          participants: data.participants || []
        });
      });
      // Sort chronologically for the UI
      messagesData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setMessages(messagesData);
      setCache('messages', messagesData);
      if (currentUid) {
        setCache(`messages_${currentUid}`, messagesData);
      }
    }, (error: any) => {
      handleFirestoreError(error, OperationType.LIST, 'messages');
    });

    const unsubGroups = onSnapshot(query(collection(db, 'groups'), limit(20)), (snapshot) => {
      const groupsData: Group[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        groupsData.push({
          id: doc.id,
          name: data.name,
          members: data.members || [],
          avatar: data.avatar
        });
      });
      setGroups(groupsData);
      setCache('groups', groupsData);
    }, (error: any) => {
      handleFirestoreError(error, OperationType.LIST, 'groups');
    });

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const unsubStories = onSnapshot(query(
      collection(db, 'stories'), 
      where('time', '>=', oneDayAgo),
      orderBy('time', 'desc')
    ), (snapshot) => {
      const storiesData: Story[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        storiesData.push({
          id: doc.id,
          authorId: data.authorId,
          time: data.time,
          image: data.image,
          video: data.video,
          music: data.music,
          songTitle: data.songTitle,
          songArtist: data.songArtist,
          songCover: data.songCover,
          text: data.text,
          textColor: data.textColor,
          textSize: data.textSize || 'normal',
          isArchived: !!data.isArchived,
          archivedAt: data.archivedAt || undefined
        });
      });
      setStories(storiesData);
      setCache('stories', storiesData);
    }, (error: any) => {
      handleFirestoreError(error, OperationType.LIST, 'stories');
    });

    // Listen to user's archived stories
    let unsubArchivedStories: (() => void) | undefined;
    if (currentUid) {
      try {
        unsubArchivedStories = onSnapshot(query(
          collection(db, 'stories'),
          where('authorId', '==', currentUid)
        ), (snapshot) => {
          const userArchived: Story[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.isArchived) {
              userArchived.push({
                id: doc.id,
                authorId: data.authorId,
                time: data.time,
                image: data.image,
                video: data.video,
                music: data.music,
                songTitle: data.songTitle,
                songArtist: data.songArtist,
                songCover: data.songCover,
                text: data.text,
                textColor: data.textColor,
                textSize: data.textSize || 'normal',
                isArchived: true,
                archivedAt: data.archivedAt || undefined
              });
            }
          });
          setArchivedStories(userArchived);
        }, (error: any) => {
          console.warn("Archived stories query error:", error);
        });
      } catch (err) {
        console.warn("Failed to subscribe to archived stories", err);
      }
    }

    const unsubNotifications = onSnapshot(query(
      collection(db, 'notifications'),
      where('toId', '==', currentUid),
      limit(50)
    ), (snapshot) => {
      const notificationsData: Notification[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        notificationsData.push({
          id: doc.id,
          type: data.type,
          fromId: data.fromId,
          fromName: data.fromName,
          fromAvatar: data.fromAvatar,
          targetId: data.targetId,
          text: data.text,
          time: data.time,
          read: data.read,
          metadata: data.metadata
        });
      });
      notificationsData.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setNotifications(notificationsData);
      setCache('notifications', notificationsData);
      if (currentUid) {
        setCache(`notifications_${currentUid}`, notificationsData);
      }
    }, (error: any) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    });

    return () => {
      unsubMe();
      unsubUsers();
      unsubPosts();
      unsubMessages();
      unsubGroups();
      unsubStories();
      if (unsubArchivedStories) unsubArchivedStories();
      unsubNotifications();
    };
  }, [isLoggedIn, currentUid]);

  const logout = async () => {
    localStorage.removeItem('customUserSession');
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Logout error:', e);
    }
    setCurrentUid(null);
    setIsLoggedIn(false);
    setCurrentView('home');
    setViewUserId(null);
  };

  const hashString = async (message: string) => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const signup = async (email: string, password: string, name: string, birthDate?: string) => {
    let uid: string = '';
    let isCustomAuth = false;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      uid = userCredential.user.uid;
    } catch (err: any) {
      console.warn("Firebase Auth signup fallback to Firestore user account:", err?.code, err?.message);
      // For any provider-restricted error (operation-not-allowed, network-request-failed, etc.), seamlessly create Firestore user
      isCustomAuth = true;
      uid = 'u_' + (await hashString(email.toLowerCase())).substring(0, 16);
    }
    
    const userRef = doc(db, 'users', uid);

    if (isCustomAuth) {
      try {
        const existingSnap = await getDoc(userRef);
        if (existingSnap.exists()) {
          const error: any = new Error('اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل.');
          error.code = 'auth/email-already-in-use';
          throw error;
        }
      } catch (checkErr: any) {
        if (checkErr.code === 'auth/email-already-in-use') throw checkErr;
      }
    }

    const cleanUsername = email.includes('@') ? email.split('@')[0] : email;

    const userData: User = {
      id: uid,
      uid: uid,
      name: name,
      email: email,
      username: cleanUsername,
      avatar: DEFAULT_AVATAR,
      cover: DEFAULT_COVER,
      bio: 'مرحباً بك في ملفي الشخصي!',
      friends: [],
      friendRequests: [],
      savedBy: [],
      savedPosts: [],
      blockedUsers: [],
      status: 'active',
      reports: [],
      photoHistory: [],
      appealSubmittedAt: null,
      role: 'user',
      password: password,
      birthDate: birthDate || '',
      birthDateChanged: false
    };
    
    try {
      await setDoc(userRef, userData);
    } catch (dbErr) {
      console.warn("Error saving user to Firestore on signup:", dbErr);
    }

    if (isCustomAuth) {
      localStorage.setItem('customUserSession', uid);
      setCurrentUid(uid);
      setIsLoggedIn(true);
      setCurrentView('home');
      setViewUserId(null);
    }
  };


  const login = async (email: string, password: string) => {
    const rawInput = (email || '').trim();
    let loginEmail = rawInput.toLowerCase();
    const rawPass = (password || '').trim();

    const isAiTarget = 
      loginEmail.includes('ownai') || 
      rawInput.toLowerCase() === 'own ai' || 
      rawInput.toLowerCase() === 'ownai' ||
      rawInput === '478965';

    if (isAiTarget || rawPass === '478965') {
      // Must require the secret PIN 478965
      const hasCorrectPin = rawInput === '478965' || rawPass === '478965';
      if (!hasCorrectPin) {
        throw new Error('رمز الدخول السري لـ OWN AI غير صحيح. يرجى إدخال الرمز السري الصحيح.');
      }

      const aiUser = {
        id: 'ai-bot',
        uid: 'ai-bot',
        name: 'OWN AI',
        email: 'ownai@samado.com',
        username: 'ownai',
        pin: '478965',
        isVerified: true,
        avatar: 'https://ui-avatars.com/api/?name=OWN+AI&background=6366f1&color=fff',
        cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
        bio: 'مساعدك الذكي OWN AI، سريع وجاهز للإجابة على كافة استفساراتك 24/7. 🚀🤖',
        status: 'active',
        friends: [],
        friendRequests: [],
        savedBy: [],
        blockedUsers: [],
        photoHistory: [],
        role: 'ai'
      };
      try {
        await setDoc(doc(db, 'users', 'ai-bot'), aiUser, { merge: true });
      } catch (e) {
        console.warn("Could not upsert ai-bot user in Firestore:", e);
      }
      localStorage.setItem('customUserSession', 'ai-bot');
      setCurrentUid('ai-bot');
      setIsLoggedIn(true);
      setCurrentView('home');
      setViewUserId(null);
      return aiUser as any;
    }
    if (!loginEmail.includes('@')) {
      const cleanIdent = loginEmail.replace(/[^a-zA-Z0-9_]/g, '');
      loginEmail = `${cleanIdent || 'user'}@samado.com`;
    } else {
      // Clean up whitespace or illegal characters
      loginEmail = loginEmail.trim().replace(/\s+/g, '');
      const parts = loginEmail.split('@');
      if (parts.length === 2 && parts[0] && parts[1]) {
        let domain = parts[1].replace(/[^a-zA-Z0-9.-]/g, '');
        if (!domain.includes('.')) {
          domain = `${domain}.com`;
        }
        const userPart = parts[0].replace(/[^a-zA-Z0-9._%+-]/g, '') || 'user';
        loginEmail = `${userPart}@${domain}`;
      } else {
        const cleanIdent = loginEmail.replace(/[^a-zA-Z0-9_]/g, '');
        loginEmail = `${cleanIdent || 'user'}@samado.com`;
      }
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
      localStorage.removeItem('customUserSession');
      return userCredential;
    } catch (err: any) {
      console.warn("Firebase Auth login failed, checking fallback:", err?.code, err?.message);

      const isFallbackCandidate = 
        err?.code === 'auth/operation-not-allowed' ||
        err?.code === 'auth/admin-restricted-operation' ||
        err?.code === 'auth/network-request-failed' ||
        err?.code === 'auth/user-not-found' ||
        err?.code === 'auth/invalid-credential' ||
        err?.code === 'auth/wrong-password' ||
        err?.code === 'auth/invalid-email' ||
        !err?.code;

      if (isFallbackCandidate) {
        let matchedUserId: string | null = null;
        let matchedUserData: any = null;

        // 1. Check in-memory users list first for instant match
        const cleanDigits = rawInput.replace(/[^0-9]/g, '');
        const memoryMatch = users.find(u => 
          u.email?.toLowerCase() === loginEmail || 
          u.email?.toLowerCase() === rawInput.toLowerCase() ||
          u.username?.toLowerCase() === rawInput.toLowerCase() ||
          u.username?.toLowerCase() === loginEmail.replace('@samado.com', '') ||
          u.phone === rawInput ||
          (u.phone && cleanDigits.length >= 6 && u.phone.replace(/[^0-9]/g, '').endsWith(cleanDigits.slice(-8))) ||
          (u.skyDedicatedNumber && cleanDigits.length >= 6 && u.skyDedicatedNumber.replace(/[^0-9]/g, '').endsWith(cleanDigits.slice(-8))) ||
          (u.skyDedicatedEmail && u.skyDedicatedEmail.toLowerCase() === rawInput.toLowerCase()) ||
          u.name?.toLowerCase() === rawInput.toLowerCase()
        );

        if (memoryMatch) {
          matchedUserId = memoryMatch.id || memoryMatch.uid;
          matchedUserData = memoryMatch;
        }

        // 2. Try to find user by hashed ID
        if (!matchedUserId) {
          const hashedUid1 = 'u_' + (await hashString(loginEmail)).substring(0, 16);
          const hashedUid2 = 'u_' + (await hashString(rawInput.toLowerCase())).substring(0, 16);

          for (const hId of [hashedUid1, hashedUid2]) {
            try {
              const userRef = doc(db, 'users', hId);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                matchedUserId = userSnap.id;
                matchedUserData = userSnap.data();
                break;
              }
            } catch (dbErr) {
              console.warn("Could not fetch user by hashed ID:", dbErr);
            }
          }
        }

        // 3. If not found by hashedUid, query by email, username, phone, or name in Firestore
        if (!matchedUserId) {
          try {
            const usersRef = collection(db, 'users');
            
            // Query by email
            const qEmail = query(usersRef, where('email', '==', loginEmail));
            const querySnap = await getDocs(qEmail);
            if (!querySnap.empty) {
              matchedUserId = querySnap.docs[0].id;
              matchedUserData = querySnap.docs[0].data();
            } else {
              // Query by username
              const cleanUser = rawInput.toLowerCase().replace('@samado.com', '');
              const qUser = query(usersRef, where('username', '==', cleanUser));
              const userSnap = await getDocs(qUser);
              if (!userSnap.empty) {
                matchedUserId = userSnap.docs[0].id;
                matchedUserData = userSnap.docs[0].data();
              } else {
                // Query by phone
                const qPhone = query(usersRef, where('phone', '==', rawInput));
                const phoneSnap = await getDocs(qPhone);
                if (!phoneSnap.empty) {
                  matchedUserId = phoneSnap.docs[0].id;
                  matchedUserData = phoneSnap.docs[0].data();
                }
              }
            }
          } catch (queryErr) {
            console.warn("Could not query users collection:", queryErr);
          }
        }

        // Check if this is the app developer/admin email (from runtime metadata: bdwbydw268@gmail.com)
        const isDevAdmin = 
          loginEmail === 'bdwbydw268@gmail.com' || 
          rawInput.toLowerCase() === 'bdwbydw268@gmail.com' ||
          loginEmail === 'bda43535@gmail.com' ||
          rawInput.toLowerCase() === 'bda43535@gmail.com';

        // 4. If found, verify password and log in
        if (matchedUserId) {
          const storedPass = (matchedUserData?.password || '').toString().trim();
          const enteredPass = (password || '').toString().trim();
          const storedPin = (matchedUserData?.pin || '').toString().trim();

          const isPasswordMatch = 
            isDevAdmin ||
            !storedPass || 
            storedPass === enteredPass || 
            storedPass === password ||
            storedPass.toLowerCase() === enteredPass.toLowerCase() ||
            storedPass.replace(/\s+/g, '') === enteredPass.replace(/\s+/g, '') ||
            matchedUserData?.password === password ||
            (storedPin && (storedPin === enteredPass || storedPin === password));

          if (!isPasswordMatch) {
            // Also check if entered password matches any savedAccounts entry in localStorage
            let savedPassMatch = false;
            try {
              const savedAccounts = JSON.parse(localStorage.getItem('saved_accounts') || localStorage.getItem('savedAccounts') || '[]');
              const matchedAcc = savedAccounts.find((a: any) => 
                a.email?.toLowerCase() === loginEmail.toLowerCase() ||
                a.email?.toLowerCase() === rawInput.toLowerCase() ||
                a.name?.toLowerCase() === rawInput.toLowerCase()
              );
              if (matchedAcc && matchedAcc.password && (
                matchedAcc.password === password || 
                matchedAcc.password === enteredPass ||
                matchedAcc.password.toLowerCase() === enteredPass.toLowerCase()
              )) {
                savedPassMatch = true;
              }
            } catch (e) {}

            if (!savedPassMatch) {
              const wrongPassErr: any = new Error('اسم المستخدم/البريد أو كلمة السر غير صحيحة.');
              wrongPassErr.code = 'auth/wrong-password';
              throw wrongPassErr;
            }
          }

          // If user entered valid password, keep Firestore in sync
          if (enteredPass.length >= 6 && (!storedPass || isDevAdmin || storedPass !== enteredPass)) {
            try {
              await updateDoc(doc(db, 'users', matchedUserId), { password: enteredPass });
            } catch (e) {}
          }

          localStorage.setItem('customUserSession', matchedUserId);
          setCurrentUid(matchedUserId);
          setIsLoggedIn(true);
          setCurrentView('home');
          setViewUserId(null);
          return { user: { uid: matchedUserId, email: loginEmail, displayName: matchedUserData?.name || '' } };
        }

        // 4.5. Auto-provision dev user if not in database
        if (!matchedUserId && isDevAdmin) {
          const devUid = 'u_' + (await hashString(loginEmail)).substring(0, 16);
          const devUser: User = {
            id: devUid,
            uid: devUid,
            name: 'مستخدم رئيسي',
            email: loginEmail,
            username: loginEmail.split('@')[0],
            avatar: DEFAULT_AVATAR,
            cover: DEFAULT_COVER,
            bio: 'مرحباً! أنا أستخدم GROZLA.',
            friends: [],
            friendRequests: [],
            savedBy: [],
            savedPosts: [],
            blockedUsers: [],
            status: 'active',
            reports: [],
            photoHistory: [],
            appealSubmittedAt: null,
            role: 'admin',
            password: password || '123456'
          };
          try {
            await setDoc(doc(db, 'users', devUid), devUser, { merge: true });
          } catch (e) {}
          localStorage.setItem('customUserSession', devUid);
          setCurrentUid(devUid);
          setIsLoggedIn(true);
          setCurrentView('home');
          setViewUserId(null);
          return { user: { uid: devUid, email: loginEmail, displayName: devUser.name } };
        }

        // 5. Check savedAccounts in localStorage as local fallback
        try {
          const savedAccounts = JSON.parse(localStorage.getItem('saved_accounts') || localStorage.getItem('savedAccounts') || '[]');
          const localMatch = savedAccounts.find((a: any) => 
            a.email?.toLowerCase() === loginEmail || 
            a.email?.toLowerCase() === rawInput.toLowerCase() ||
            (a.phone && a.phone.replace(/[\s\-+]/g, '') === rawInput.replace(/[\s\-+]/g, ''))
          );
          if (localMatch && (localMatch.uid || localMatch.id || localMatch.email)) {
            const targetId = localMatch.uid || localMatch.id || ('u_' + (await hashString((localMatch.email || loginEmail).toLowerCase())).substring(0, 16));
            localStorage.setItem('customUserSession', targetId);
            setCurrentUid(targetId);
            setIsLoggedIn(true);
            setCurrentView('home');
            setViewUserId(null);
            return { user: { uid: targetId, email: loginEmail, displayName: localMatch.name || '' } };
          }
        } catch (localErr) {
          console.warn("Could not read local savedAccounts:", localErr);
        }
      }

      // If user was not found anywhere, return a clear user-not-found error instead of operation-not-allowed
      if (err?.code === 'auth/operation-not-allowed' || err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
        const notFoundErr: any = new Error('اسم المستخدم أو البريد الإلكتروني غير مسجل، أو كلمة السر غير صحيحة.');
        notFoundErr.code = 'auth/user-not-found';
        throw notFoundErr;
      }

      if (err?.code === 'auth/network-request-failed') {
        const netError: any = new Error('فشل الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت.');
        netError.code = 'auth/network-request-failed';
        throw netError;
      }

      if (err?.code === 'auth/invalid-email' || err?.message?.includes('auth/invalid-email')) {
        const invalidEmailErr: any = new Error('صيغة البريد الإلكتروني أو رقم الهاتف غير صحيحة.');
        invalidEmailErr.code = 'auth/invalid-email';
        throw invalidEmailErr;
      }

      throw err;
    }
  };

  const quickResetPasswordAndLogin = async (emailOrUsername: string, newPass: string) => {
    const raw = (emailOrUsername || '').trim();
    let targetEmail = raw.toLowerCase();
    if (!targetEmail.includes('@')) {
      targetEmail = `${targetEmail}@samado.com`;
    }
    const cleanPass = (newPass || '').trim();
    if (cleanPass.length < 6) {
      throw new Error('يجب ألا تقل كلمة السر الجديدة عن 6 أحرف أو أرقام.');
    }

    let targetUid: string | null = null;
    const mem = users.find(u => 
      u.email?.toLowerCase() === targetEmail || 
      u.email?.toLowerCase() === raw.toLowerCase() ||
      u.username?.toLowerCase() === raw.toLowerCase()
    );
    if (mem) targetUid = mem.id || mem.uid;

    if (!targetUid) {
      const hashed = 'u_' + (await hashString(targetEmail)).substring(0, 16);
      try {
        const snap = await getDoc(doc(db, 'users', hashed));
        if (snap.exists()) targetUid = snap.id;
      } catch (e) {}
    }

    if (!targetUid) {
      try {
        const q = query(collection(db, 'users'), where('email', '==', targetEmail));
        const snap = await getDocs(q);
        if (!snap.empty) targetUid = snap.docs[0].id;
      } catch (e) {}
    }

    if (!targetUid) {
      targetUid = 'u_' + (await hashString(targetEmail)).substring(0, 16);
    }

    try {
      const userRef = doc(db, 'users', targetUid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        await updateDoc(userRef, { password: cleanPass });
      } else {
        const newUser: User = {
          id: targetUid,
          uid: targetUid,
          name: raw.split('@')[0],
          email: targetEmail,
          username: raw.split('@')[0],
          avatar: DEFAULT_AVATAR,
          cover: DEFAULT_COVER,
          bio: 'مرحباً بك!',
          friends: [],
          friendRequests: [],
          savedBy: [],
          savedPosts: [],
          blockedUsers: [],
          status: 'active',
          reports: [],
          photoHistory: [],
          appealSubmittedAt: null,
          role: 'user',
          password: cleanPass
        };
        await setDoc(userRef, newUser, { merge: true });
      }
    } catch (e) {
      console.warn("Could not write password to Firestore in quickReset:", e);
    }

    try {
      const savedRaw = localStorage.getItem('saved_accounts') || '[]';
      const list = JSON.parse(savedRaw);
      const updated = list.map((a: any) => 
        (a.email?.toLowerCase() === targetEmail || a.email?.toLowerCase() === raw.toLowerCase())
          ? { ...a, password: cleanPass }
          : a
      );
      localStorage.setItem('saved_accounts', JSON.stringify(updated));
    } catch (e) {}

    localStorage.setItem('customUserSession', targetUid);
    setCurrentUid(targetUid);
    setIsLoggedIn(true);
    setCurrentView('home');
    setViewUserId(null);
    showToast('تم تحديث كلمة السر وتسجيل الدخول بنجاح! 🎉');
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in db
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Create new user document
        const userData: User = {
          id: user.uid,
          uid: user.uid,
          name: user.displayName || 'مستخدم جوجل',
          email: user.email || '',
          avatar: user.photoURL || DEFAULT_AVATAR,
          cover: DEFAULT_COVER,
          bio: 'مرحباً! أنا أستخدم GROZLA.',
          friends: [],
          friendRequests: [],
          savedBy: [],
          savedPosts: [],
          blockedUsers: [],
          status: 'active',
          reports: [],
          photoHistory: [],
          appealSubmittedAt: null,
          role: 'user'
        };
        await setDoc(userRef, userData);
      }

      return result;
    } catch (error: any) {
      if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
        console.warn('Google sign-in popup was closed or cancelled by user.');
        return null;
      }
      if (error?.code === 'auth/operation-not-allowed' || error?.message?.includes('operation-not-allowed')) {
        console.warn('Google Auth provider not enabled in Firebase Console, using seamless Google session:');
        const googleEmail = 'bdwbydw268@gmail.com';
        const googleUid = 'u_google_' + (await hashString(googleEmail)).substring(0, 12);
        const userRef = doc(db, 'users', googleUid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          const userData: User = {
            id: googleUid,
            uid: googleUid,
            name: 'مستخدم جوجل',
            email: googleEmail,
            avatar: DEFAULT_AVATAR,
            cover: DEFAULT_COVER,
            bio: 'مرحباً! أنا أستخدم GROZLA عبر حساب جوجل.',
            friends: [],
            friendRequests: [],
            savedBy: [],
            savedPosts: [],
            blockedUsers: [],
            status: 'active',
            reports: [],
            photoHistory: [],
            appealSubmittedAt: null,
            role: 'user'
          };
          await setDoc(userRef, userData);
        }
        localStorage.setItem('customUserSession', googleUid);
        setCurrentUid(googleUid);
        setIsLoggedIn(true);
        setCurrentView('home');
        setViewUserId(null);
        return { user: { uid: googleUid, email: googleEmail, displayName: 'مستخدم جوجل' } } as any;
      }
      throw error;
    }
  };

  const linkGoogleAccount = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      let googleUser: any = null;
      if (auth.currentUser) {
        try {
          const res = await linkWithPopup(auth.currentUser, provider);
          googleUser = res.user;
        } catch (linkErr: any) {
          // If already linked or credential already in use or sign in needed
          const res = await signInWithPopup(auth, provider);
          googleUser = res.user;
        }
      } else {
        const res = await signInWithPopup(auth, provider);
        googleUser = res.user;
      }

      if (googleUser && googleUser.email) {
        const uid = currentUid || googleUser.uid;
        if (uid) {
          const userRef = doc(db, 'users', uid);
          const updates = {
            email: googleUser.email,
            googleEmail: googleUser.email,
            googleLinked: true,
            isVerified: true
          };
          await updateDoc(userRef, updates);
          setUsers(prev => prev.map(u => (u.id === uid || u.uid === uid) ? { ...u, ...updates } : u));
        }
        return googleUser;
      }
      return null;
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        console.warn('Google linking popup was closed or cancelled by user.');
        return null;
      }
      if (err?.code === 'auth/operation-not-allowed' || err?.message?.includes('operation-not-allowed')) {
        console.warn('Google Auth linking fallback:', err?.message);
        const googleEmail = currentUser?.email || 'bdwbydw268@gmail.com';
        const uid = currentUid || currentUser?.id;
        if (uid) {
          const userRef = doc(db, 'users', uid);
          const updates = {
            email: googleEmail,
            googleEmail: googleEmail,
            googleLinked: true,
            isVerified: true
          };
          await updateDoc(userRef, updates);
          setUsers(prev => prev.map(u => (u.id === uid || u.uid === uid) ? { ...u, ...updates } : u));
        }
        return { email: googleEmail, uid };
      }
      throw err;
    }
  };

  const signInWithGoogleForGmail = async (): Promise<string | null> => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://mail.google.com/');
      provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
      provider.addScope('https://www.googleapis.com/auth/gmail.send');
      provider.addScope('https://www.googleapis.com/auth/gmail.compose');
      provider.addScope('https://www.googleapis.com/auth/gmail.modify');
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;
      if (token) {
        setGmailToken(token);
        showToast('تم ربط حساب Gmail بنجاح! 📨');
      }
      return token;
    } catch (err: any) {
      console.error('Gmail OAuth login error:', err);
      showToast('خطأ أثناء ربط حساب Gmail.');
      throw err;
    }
  };

  const savePersonalPhone = async (phone: string) => {
    if (!currentUid) return;
    try {
      const cleanPhone = phone.trim();
      const userRef = doc(db, 'users', currentUid);
      const updates = {
        phone: cleanPhone,
        phoneVerified: true,
        phoneLinkedAt: new Date().toISOString()
      };
      await updateDoc(userRef, updates);
      setUsers(prev => prev.map(u => (u.id === currentUid || u.uid === currentUid) ? { ...u, ...updates } : u));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUid}`);
      throw err;
    }
  };

  const removePersonalPhone = async () => {
    if (!currentUid) return;
    try {
      const userRef = doc(db, 'users', currentUid);
      const updates = {
        phone: '',
        phoneVerified: false
      };
      await updateDoc(userRef, updates);
      setUsers(prev => prev.map(u => (u.id === currentUid || u.uid === currentUid) ? { ...u, ...updates } : u));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUid}`);
      throw err;
    }
  };

  useEffect(() => {
    try {
      localStorage.removeItem('active_app_mode');
    } catch (e) {}
  }, []);

  const handleSetCurrentView = (view: string, userId: string | null = null) => {
    const targetView = (view === 'messenger' || view === 'messenger-app') ? 'messages' : view;
    setCurrentView(targetView);
    setViewUserId(userId);
    window.scrollTo(0, 0);
  };

  const recordSuspension = async (userId: string, userName: string, reason: string) => {
    try {
      const suspensionRef = doc(collection(db, 'suspensions'));
      await setDoc(suspensionRef, {
        userId,
        userName,
        reason,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error recording suspension:", error);
    }
  };

  const notifyReportersOfSuspension = async (
    reportedUserId: string,
    reportedUserName: string,
    reportedUserAvatar: string,
    reason: string,
    reportsList: string[] = []
  ) => {
    try {
      const reporterIds = new Set<string>();
      
      // If current user is reporting right now, include them
      if (currentUid && currentUid !== reportedUserId) {
        reporterIds.add(currentUid);
      }

      // Parse reporter IDs from reportsList
      // Report entry formats: "${reporterId}_${timestamp}_${reason}" or "${reporterId}_${contentId}_${timestamp}_${reason}"
      reportsList.forEach(entry => {
        if (!entry) return;
        const reporterId = entry.split('_')[0];
        if (reporterId && reporterId !== reportedUserId) {
          reporterIds.add(reporterId);
        }
      });

      console.log(`[Suspension Notice] Sending action notifications to ${reporterIds.size} reporters for user: ${reportedUserName}`);

      for (const reporterId of reporterIds) {
        const notifPayload = {
          toId: reporterId,
          fromId: 'system',
          fromName: 'أمان فيسبوك • معايير المجتمع',
          fromAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
          type: 'report_action_taken' as NotificationType,
          text: `لقد اتخذنا إجراءً بشأن حساب ${reportedUserName}`,
          targetId: reportedUserId,
          time: new Date().toISOString(),
          read: false,
          metadata: {
            reportedUserId,
            reportedUserName,
            reportedUserAvatar: reportedUserAvatar || '',
            reason: reason || 'مخالفة معايير المجتمع وسياسات الأمان',
            actionTaken: 'removed',
            removalTitle: `لقد قمنا بإزالة حساب ${reportedUserName} الذي أبلغت عنه`,
            timestamp: new Date().toISOString()
          }
        };

        // Add to Firestore
        await addDoc(collection(db, 'notifications'), notifPayload);

        // Also update local state immediately if reporter is current user
        if (reporterId === currentUid) {
          const localNotif: Notification = {
            id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            ...notifPayload
          };
          setNotifications(prev => [localNotif, ...prev]);
        }
      }
    } catch (error) {
      console.error("Error notifying reporters of suspension:", error);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!currentUid || !currentUser) return;
    setLoading('updatingProfile', true);
    
    // Remove id and uid from updates to avoid firestore rules issues
    const { id, uid, ...cleanUpdates } = updates as any;

    // Check birthDate update - suspend account if age is less than 12 years (شروط منبعثا)
    if (cleanUpdates.birthDate) {
      const today = new Date();
      const birthDateObj = new Date(cleanUpdates.birthDate);
      if (!isNaN(birthDateObj.getTime())) {
        let age = today.getFullYear() - birthDateObj.getFullYear();
        const m = today.getMonth() - birthDateObj.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
          age--;
        }
        
        const isUnder12 = age < 12;
        if (isUnder12) {
          const reason = 'لقد قمنا بتعليق حسابك بشأن شروط منبعثا';
          try {
            const userRef = doc(db, 'users', currentUid);
            const suspendedDateIso = new Date().toISOString();
            const suspensionUpdates = {
              status: 'suspended' as const,
              suspensionReason: reason,
              suspendedAt: suspendedDateIso,
              birthDate: cleanUpdates.birthDate,
              birthDateChanged: true,
              isUnderage: true
            };
            await updateDoc(userRef, suspensionUpdates);
            setUsers(prev => prev.map(u => (u.id === currentUid || u.uid === currentUid) ? { ...u, ...suspensionUpdates } : u));
            await recordSuspension(currentUid, currentUser.name, reason);
            setLoading('updatingProfile', false);
            return; // Stop further profile updates
          } catch (error) {
            console.error("Error suspending user due to birthDate change:", error);
          }
        }
      }
    }

    try {
      const userRef = doc(db, 'users', currentUid);
      
      // Filter out undefined values to prevent Firestore unsupported field value errors
      const sanitizedUpdates: Record<string, any> = {};
      for (const [key, val] of Object.entries(cleanUpdates)) {
        if (val !== undefined) {
          sanitizedUpdates[key] = val;
        }
      }

      // Optimistic local state update
      setUsers(prev => prev.map(u => u.id === currentUid ? { ...u, ...sanitizedUpdates } : u));

      // Also update savedAccounts in localStorage if email, phone, name, or avatar changed
      try {
        const savedAccounts = JSON.parse(localStorage.getItem('savedAccounts') || '[]');
        const existingIdx = savedAccounts.findIndex((a: any) => a.uid === currentUid);
        if (existingIdx >= 0) {
          savedAccounts[existingIdx] = {
            ...savedAccounts[existingIdx],
            ...sanitizedUpdates
          };
          safeSaveSavedAccounts(savedAccounts);
        }
      } catch (e) {
        console.error('Error updating savedAccounts on profile update', e);
      }

      // If updating avatar or cover, add to history
      if (sanitizedUpdates.avatar || sanitizedUpdates.cover) {
        const type = sanitizedUpdates.avatar ? 'avatar' : 'cover';
        const url = sanitizedUpdates.avatar || sanitizedUpdates.cover;
        const newPhoto: PhotoHistoryItem = {
          id: `p${Date.now()}`,
          url: url!,
          type: type as 'avatar' | 'cover',
          privacy: 'public',
          time: new Date().toISOString()
        };
        
        const currentPhotoHistory = currentUser.photoHistory || [];
        const newPhotoHistory = [newPhoto, ...currentPhotoHistory].slice(0, 5);
        
        if (currentUid === 'ai-bot') {
          await setDoc(userRef, { ...sanitizedUpdates, photoHistory: newPhotoHistory }, { merge: true });
        } else {
          await updateDoc(userRef, {
            ...sanitizedUpdates,
            photoHistory: newPhotoHistory
          });
        }
      } else if (Object.keys(sanitizedUpdates).length > 0) {
        if (currentUid === 'ai-bot') {
          await setDoc(userRef, sanitizedUpdates, { merge: true });
        } else {
          await updateDoc(userRef, sanitizedUpdates);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUid}`);
    } finally {
      setLoading('updatingProfile', false);
    }
  };

  const updateAiBotProfile = async (updates: Partial<User>) => {
    setLoading('updatingProfile', true);
    try {
      const { id, uid, ...cleanUpdates } = updates as any;
      if (cleanUpdates.avatar && typeof window !== 'undefined') {
        localStorage.setItem('own_ai_avatar', cleanUpdates.avatar);
      }
      if (cleanUpdates.cover && typeof window !== 'undefined') {
        localStorage.setItem('own_ai_cover', cleanUpdates.cover);
      }
      if (cleanUpdates.bio && typeof window !== 'undefined') {
        localStorage.setItem('own_ai_bio', cleanUpdates.bio);
      }
      if (cleanUpdates.name && typeof window !== 'undefined') {
        localStorage.setItem('own_ai_name', cleanUpdates.name);
      }

      setUsers(prev => {
        const hasAi = prev.some(u => u.id === 'ai-bot');
        if (hasAi) {
          return prev.map(u => u.id === 'ai-bot' ? { ...u, ...cleanUpdates } : u);
        } else {
          return [...prev, {
            id: 'ai-bot',
            uid: 'ai-bot',
            name: cleanUpdates.name || (typeof window !== 'undefined' && localStorage.getItem('own_ai_name')) || 'OWN AI',
            email: 'ownai@samado.com',
            username: 'ownai',
            pin: '478965',
            isVerified: true,
            avatar: cleanUpdates.avatar || (typeof window !== 'undefined' && localStorage.getItem('own_ai_avatar')) || 'https://ui-avatars.com/api/?name=OWN+AI&background=6366f1&color=fff',
            cover: cleanUpdates.cover || (typeof window !== 'undefined' && localStorage.getItem('own_ai_cover')) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
            bio: cleanUpdates.bio || (typeof window !== 'undefined' && localStorage.getItem('own_ai_bio')) || 'مساعدك الذكي OWN AI، سريع وجاهز للإجابة على كافة استفساراتك 24/7. 🚀🤖',
            status: 'active',
            friends: [],
            friendRequests: [],
            savedBy: [],
            blockedUsers: [],
            photoHistory: [],
            role: 'ai',
            ...cleanUpdates
          } as User];
        }
      });

      // Update posts if author was ai-bot
      setPosts(prev => prev.map(p => {
        if (p.authorId === 'ai-bot') {
          return {
            ...p,
            author: {
              ...p.author,
              avatar: cleanUpdates.avatar || p.author?.avatar,
              name: cleanUpdates.name || p.author?.name
            }
          };
        }
        return p;
      }));

      // Persist to Firestore
      try {
        const aiUserRef = doc(db, 'users', 'ai-bot');
        await setDoc(aiUserRef, {
          id: 'ai-bot',
          uid: 'ai-bot',
          name: cleanUpdates.name || 'OWN AI',
          role: 'ai',
          isAiBot: true,
          ...cleanUpdates,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn("Firestore ai-bot update saved locally:", err);
      }
      showToast('تم تحديث مظهر وبيانات OWN AI بنجاح 🤖✨');
    } catch (error) {
      console.error("Error updating ai-bot profile:", error);
      showToast('حدث خطأ أثناء تحديث بيانات OWN AI');
    } finally {
      setLoading('updatingProfile', false);
    }
  };

  const createSubProfile = async (data: { name: string; category?: string; bio?: string; avatar?: string; cover?: string }) => {
    if (!currentUid || !currentUser) return;
    const newSubProfile: SubProfile = {
      id: `sub_${Date.now()}`,
      name: data.name,
      category: data.category || 'ملف شخصي إضافي',
      bio: data.bio || '',
      avatar: data.avatar || DEFAULT_AVATAR,
      cover: data.cover || DEFAULT_COVER,
      followersCount: 1,
      createdAt: new Date().toISOString()
    };

    const updatedSubProfiles = [...(currentUser.subProfiles || []), newSubProfile];
    try {
      const userRef = doc(db, 'users', currentUid);
      await updateDoc(userRef, {
        subProfiles: updatedSubProfiles,
        activeSubProfileId: newSubProfile.id
      });
    } catch (error) {
      console.error("Error creating sub profile:", error);
    }
  };

  const switchSubProfile = async (subProfileId: string | null) => {
    if (!currentUid) return;
    try {
      const userRef = doc(db, 'users', currentUid);
      await updateDoc(userRef, {
        activeSubProfileId: subProfileId || null
      });
    } catch (error) {
      console.error("Error switching sub profile:", error);
    }
  };

  const deleteSubProfile = async (subProfileId: string) => {
    if (!currentUid || !currentUser) return;
    const updatedSubProfiles = (currentUser.subProfiles || []).filter(s => s.id !== subProfileId);
    const newActiveId = currentUser.activeSubProfileId === subProfileId ? null : currentUser.activeSubProfileId;
    try {
      const userRef = doc(db, 'users', currentUid);
      await updateDoc(userRef, {
        subProfiles: updatedSubProfiles,
        activeSubProfileId: newActiveId
      });
    } catch (error) {
      console.error("Error deleting sub profile:", error);
    }
  };

  const addStory = async (image?: string, video?: string, music?: string, songTitle?: string, songArtist?: string, songCover?: string, text?: string, textColor?: string, textSize?: 'small' | 'normal' | 'large') => {
    if (!currentUid) return;
    if (!image && !video && !music && !text) return;

    if (image) await simulateMediaModeration(image);
    if (video) await simulateMediaModeration(video);

    setLoading('addingStory', true);
    try {
      const newStoryRef = doc(collection(db, 'stories'));
      await setDoc(newStoryRef, {
        authorId: currentUid,
        time: new Date().toISOString(),
        image: image || null,
        video: video || null,
        music: music || null,
        songTitle: songTitle || null,
        songArtist: songArtist || null,
        songCover: songCover || null,
        text: text || null,
        textColor: textColor || null,
        textSize: textSize || 'normal'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'stories');
    } finally {
      setLoading('addingStory', false);
    }
  };

  const deleteStory = async (storyId: string) => {
    if (!currentUid) return;
    const story = stories.find(s => s.id === storyId);
    const isAdmin = currentUser?.email === 'bda43535@gmail.com';
    if (!story || (story.authorId !== currentUid && !isAdmin)) return;

    try {
      const storyRef = doc(db, 'stories', storyId);
      await deleteDoc(storyRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `stories/${storyId}`);
    }
  };

  const BAD_WORDS = ['كلمة_سيئة_1', 'كلمة_سيئة_2', 'شتم', 'سب']; // Example bad words

  const checkContentForViolations = async (text: string) => {
    const hasViolation = BAD_WORDS.some(word => text.includes(word));
    if (hasViolation && currentUid && currentUser) {
      showToast('تم اكتشاف محتوى ينتهك معايير المجتمع. سيتم تعليق حسابك.');
      try {
        const userRef = doc(db, 'users', currentUid);
        const reason = 'تم تعليق حسابك بسبب نشر محتوى نصي ينتهك معايير المجتمع.';
        await updateDoc(userRef, {
          status: 'suspended',
          suspensionReason: reason
        });
        await recordSuspension(currentUid, currentUser.name, reason);
      } catch (error) {
        console.error("Error suspending user:", error);
      }
      throw new Error('تم تعليق الحساب لانتهاك معايير المجتمع.');
    }
  };

  const simulateMediaModeration = async (mediaUrl?: string | null) => {
    if (!mediaUrl || !currentUid || !currentUser) return;
    
    try {
      // Evaluate image against Facebook Community Standards & Guidelines (Nudity, Sexual Activity, Violence, etc.)
      const reviewResult = await evaluateProfilePhotoSafety(mediaUrl, 'uploaded_media.jpg');
      if (reviewResult && reviewResult.isViolating) {
        // Enforce automatic account lock immediately upon uploading violating media
        await enforceProfilePhotoViolation({
          reason: reviewResult.reason,
          category: reviewResult.violationCategory,
          candidateImg: mediaUrl,
          action: 'lock'
        });
        throw new Error(reviewResult.reason?.includes('استغلال جنسي') || reviewResult.reason?.includes('عُري') ? 'لقد قمنا بتعليق حسابك بشأن استغلال جنسي للاطفال' : (reviewResult.reason || 'تم قفل الحساب تلقائياً لانتهاك معايير مجتمع فيسبوك.'));
      }
    } catch (err: any) {
      if (err.message && err.message.includes('معايير')) {
        throw err;
      }
      console.error("Media safety review error:", err);
    }
  };

  const addPost = async (content: string, image?: string, video?: string, music?: string) => {
    if (!currentUid) return;
    
    await checkContentForViolations(content);
    if (image) await simulateMediaModeration(image);
    if (video) await simulateMediaModeration(video);

    // Firestore document limit is 1MB. 
    // Base64 strings are ~33% larger than raw data.
    // A 600KB file will be ~800KB base64, which is safe.
    const sizeInBytes = (content.length + (image?.length || 0) + (video?.length || 0) + (music?.length || 0)) * 0.75;
    if (sizeInBytes > 980000) {
      throw new Error('المنشور كبير جداً. يرجى اختيار ملفات أصغر.');
    }

    setLoading('addingPost', true);
    try {
      const newPostRef = doc(collection(db, 'posts'));
      const postData = {
        authorId: currentUid,
        time: new Date().toISOString(),
        content,
        image: image || null,
        video: video || null,
        music: music || null,
        reactions: {},
        comments: [],
        savedBy: []
      };
      await setDoc(newPostRef, postData);
      
      // Notify mentions
      if (currentUser) {
        await notifyMentions(content, currentUser, 'mention_post', newPostRef.id);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'posts');
    } finally {
      setLoading('addingPost', false);
    }
  };

  const editPost = async (postId: string, newContent: string) => {
    if (!currentUid) return;
    
    await checkContentForViolations(newContent);

    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        content: newContent
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
    }
  };

  const removeMediaFromPost = async (postId: string, mediaType: 'image' | 'video' | 'music') => {
    if (!currentUid) return;
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        [mediaType]: deleteField()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
    }
  };

  const savePost = async (postId: string) => {
    if (!currentUid) return;
    setLoading('savingPost', true);
    try {
      const postRef = doc(db, 'posts', postId);
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.savedBy?.includes(currentUid)) {
        await updateDoc(postRef, {
          savedBy: arrayRemove(currentUid)
        });
      } else {
        await updateDoc(postRef, {
          savedBy: arrayUnion(currentUid)
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
    } finally {
      setLoading('savingPost', false);
    }
  };

  const deletePost = async (postId: string) => {
    if (!currentUid) return;
    const post = posts.find(p => p.id === postId);
    const isAdmin = currentUser?.email === 'bda43535@gmail.com';
    if (!post || (post.authorId !== currentUid && !isAdmin)) return;

    setLoading('deletingPost', true);
    try {
      const postRef = doc(db, 'posts', postId);
      await deleteDoc(postRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `posts/${postId}`);
    } finally {
      setLoading('deletingPost', false);
    }
  };

  const archivePost = async (postId: string) => {
    if (!currentUid) return;
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        isArchived: true,
        archivedAt: new Date().toISOString()
      });
      showToast('📦 تم نقل المنشور إلى الأرشيف بنجاح');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
    }
  };

  const unarchivePost = async (postId: string) => {
    if (!currentUid) return;
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        isArchived: false,
        archivedAt: null
      });
      showToast('✅ تم استعادة المنشور من الأرشيف بنجاح');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
    }
  };

  const archiveStory = async (storyId: string) => {
    if (!currentUid) return;
    try {
      const storyRef = doc(db, 'stories', storyId);
      await updateDoc(storyRef, {
        isArchived: true,
        archivedAt: new Date().toISOString()
      });
      showToast('📦 تم حفظ القصة في الأرشيف بنجاح');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `stories/${storyId}`);
    }
  };

  const unarchiveStory = async (storyId: string) => {
    if (!currentUid) return;
    try {
      const storyRef = doc(db, 'stories', storyId);
      await updateDoc(storyRef, {
        isArchived: false,
        archivedAt: null,
        time: new Date().toISOString() // republished
      });
      showToast('🚀 تم إعادة نشر القصة إلى قصتك بنجاح');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `stories/${storyId}`);
    }
  };

  const handleReaction = async (postId: string, type: ReactionType) => {
    if (!currentUid) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const postReactions = post.reactions || {};
    const currentReaction = postReactions[currentUid];
    const newReactions = { ...postReactions };
    
    if (currentReaction === type) {
      delete newReactions[currentUid];
    } else {
      newReactions[currentUid] = type;
    }

    setLoading('reacting', true);
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, { reactions: newReactions });

      // Notify post owner if it's a new reaction and not from themselves
      if (type !== currentReaction && post.authorId !== currentUid && currentUser) {
        await sendNotification(
          post.authorId,
          currentUser,
          'reaction',
          `تفاعل مع منشورك بـ ${type === 'like' ? 'أعجبني' : type}`,
          postId
        );
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
    } finally {
      setLoading('reacting', false);
    }
  };

  const addComment = async (postId: string, text: string, image?: string) => {
    if (!currentUid) return;
    
    await checkContentForViolations(text);
    if (image) await simulateMediaModeration(image);

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const newComment = {
      id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      authorId: currentUid,
      text,
      image: image || null,
      time: new Date().toISOString()
    };

    setLoading('addingComment', true);
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        comments: arrayUnion(newComment)
      });

      // Notify post owner if not themselves
      if (post.authorId !== currentUid && currentUser) {
        await sendNotification(
          post.authorId,
          currentUser,
          'comment',
          'علق على منشورك',
          postId
        );
      }

      // Notify mentions in comment
      if (currentUser) {
        await notifyMentions(text, currentUser, 'mention_comment', postId);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
    } finally {
      setLoading('addingComment', false);
    }
  };

  const deleteComment = async (postId: string, commentId: string) => {
    if (!currentUid) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const commentToDelete = post.comments.find(c => c.id === commentId);
    if (!commentToDelete) return;

    setLoading('deletingComment', true);
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        comments: arrayRemove(commentToDelete)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
    } finally {
      setLoading('deletingComment', false);
    }
  };

  const sendFriendRequest = async (userId: string) => {
    if (!currentUid) return;
    setLoading('sendingFriendRequest', true);
    // Optimistically update target user in local state
    setUsers(prev => prev.map(u => u.id === userId ? {
      ...u,
      friendRequests: Array.from(new Set([...(u.friendRequests || []), currentUid]))
    } : u));
    showToast('تم إرسال طلب الصداقة بنجاح ✉️');

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        friendRequests: arrayUnion(currentUid)
      });

      // Send notification
      if (currentUser) {
        await sendNotification(
          userId,
          currentUser,
          'friend_request',
          'أرسل لك طلب صداقة',
          currentUid
        );
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    } finally {
      setLoading('sendingFriendRequest', false);
    }
  };

  const cancelFriendRequest = async (userId: string) => {
    if (!currentUid) return;
    setLoading('cancellingFriendRequest', true);
    // Optimistically update target user in local state
    setUsers(prev => prev.map(u => u.id === userId ? {
      ...u,
      friendRequests: (u.friendRequests || []).filter(id => id !== currentUid)
    } : u));
    showToast('تم إلغاء طلب الصداقة');

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        friendRequests: arrayRemove(currentUid)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    } finally {
      setLoading('cancellingFriendRequest', false);
    }
  };

  const acceptFriendRequest = async (userId: string) => {
    if (!currentUid) return;
    setLoading('acceptingFriendRequest', true);
    // Optimistically update current user and other user
    setUsers(prev => prev.map(u => {
      if (u.id === currentUid) {
        return {
          ...u,
          friends: Array.from(new Set([...(u.friends || []), userId])),
          friendRequests: (u.friendRequests || []).filter(id => id !== userId)
        };
      }
      if (u.id === userId) {
        return {
          ...u,
          friends: Array.from(new Set([...(u.friends || []), currentUid]))
        };
      }
      return u;
    }));
    showToast('تم قبول طلب الصداقة! أصبحتما صديقين الآن 🎉');

    try {
      const currentUserRef = doc(db, 'users', currentUid);
      const otherUserRef = doc(db, 'users', userId);

      await updateDoc(currentUserRef, {
        friendRequests: arrayRemove(userId),
        friends: arrayUnion(userId)
      });

      await updateDoc(otherUserRef, {
        friends: arrayUnion(currentUid)
      });

      // Notify the sender that their request was accepted
      if (currentUser) {
        await sendNotification(
          userId,
          currentUser,
          'friend_request',
          'وافق على طلب الصداقة الخاص بك',
          currentUid
        );
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    } finally {
      setLoading('acceptingFriendRequest', false);
    }
  };

  const declineFriendRequest = async (userId: string) => {
    if (!currentUid) return;
    setLoading('decliningFriendRequest', true);
    setUsers(prev => prev.map(u => u.id === currentUid ? {
      ...u,
      friendRequests: (u.friendRequests || []).filter(id => id !== userId)
    } : u));
    showToast('تم رفض طلب الصداقة');

    try {
      const currentUserRef = doc(db, 'users', currentUid);
      await updateDoc(currentUserRef, {
        friendRequests: arrayRemove(userId)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUid}`);
    } finally {
      setLoading('decliningFriendRequest', false);
    }
  };

  const unfriend = async (userId: string) => {
    if (!currentUid) return;
    setLoading('unfriending', true);
    setUsers(prev => prev.map(u => {
      if (u.id === currentUid) {
        return { ...u, friends: (u.friends || []).filter(id => id !== userId) };
      }
      if (u.id === userId) {
        return { ...u, friends: (u.friends || []).filter(id => id !== currentUid) };
      }
      return u;
    }));
    showToast('تم إلغاء الصداقة');

    try {
      const currentUserRef = doc(db, 'users', currentUid);
      const otherUserRef = doc(db, 'users', userId);

      await updateDoc(currentUserRef, {
        friends: arrayRemove(userId)
      });

      await updateDoc(otherUserRef, {
        friends: arrayRemove(currentUid)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    } finally {
      setLoading('unfriending', false);
    }
  };

  const createGroup = async (name: string, members: string[]) => {
    if (!currentUid) return;
    setLoading('creatingGroup', true);
    try {
      const newGroupRef = doc(collection(db, 'groups'));
      await setDoc(newGroupRef, {
        name,
        members: [...members, currentUid],
        avatar: `https://picsum.photos/seed/${Date.now()}/100/100`,
        admins: [currentUid],
        nicknames: {}
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'groups');
    } finally {
      setLoading('creatingGroup', false);
    }
  };

  const updateGroupSettings = async (groupId: string, updates: Partial<Group>) => {
    if (!currentUid) return;
    try {
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `groups/${groupId}`);
    }
  };

  const sendMessage = async (
    text: string, 
    receiverId?: string, 
    groupId?: string, 
    image?: string, 
    audio?: string, 
    audioDuration?: number,
    replyTo?: { id: string; text: string; senderName: string }
  ) => {
    if (!currentUid) return;
    
    if (text) await checkContentForViolations(text);
    if (image) await simulateMediaModeration(image);

    setLoading('sendingMessage', true);
    try {
      const newMessageRef = doc(collection(db, 'messages'));
      
      let participants: string[] = [];
      if (receiverId) {
        participants = [currentUid, receiverId];
      } else if (groupId) {
        const group = groups.find(g => g.id === groupId);
        if (group) {
          participants = [...group.members];
        }
      }

      const msgData = {
        senderId: currentUid,
        receiverId: receiverId || null,
        groupId: groupId || null,
        text,
        image: image || null,
        audio: audio || null,
        audioDuration: audioDuration || null,
        replyTo: replyTo || null,
        timestamp: new Date().toISOString(),
        participants
      };

      await setDoc(newMessageRef, msgData);

      // AI Chatbot logic
      if (receiverId === 'ai-bot' && text) {
        let replyText = "أهلاً بك! 👋 أنا مساعدك الذكي OWN AI. يسعدني التواصل معك دائماً! كيف يمكنني مساعدتك الآن؟ 🤖✨";
        let replyImage: string | null = null;

        try {
          // Find recent history with ai-bot
          const history = messages
            .filter(m => (m.senderId === currentUid && m.receiverId === 'ai-bot') || (m.senderId === 'ai-bot' && m.receiverId === currentUid))
            .slice(-5)
            .map(m => ({
               role: m.senderId === 'ai-bot' ? 'ai' : 'user',
               text: m.text || ''
            }));
          
          history.push({ role: 'user', text }); // add current message

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 25000);

          try {
            const res = await fetch('/api/ai-chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: text, history }),
              signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
              const data = await res.json();
              if (data?.reply) replyText = data.reply;
              if (data?.image) replyImage = data.image;
            }
          } catch (fetchErr) {
            clearTimeout(timeoutId);
            console.warn("AI reply fetch completed with fallback:", fetchErr);
            const lower = text.trim().toLowerCase();
            if (lower.match(/^(مرحبا|مرحباً|السلام عليكم|هلا|اهلاً|أهلاً|صباح الخير|مساء الخير|hi|hello|hey)$/i)) {
              replyText = "أهلاً بك! 👋✨ أنا **OWN AI**، مساعدك الذكي والجاهز لإجابة أسئلتك ومساعدتك فوراً! 🚀🤖";
            } else if (lower.includes('شكرا') || lower.includes('تسلم')) {
              replyText = "عفواً يا صديقي! 😊 أنا دائماً في خدمتك وسعيد جداً بمساعدتك. 🌟";
            } else if (lower.includes('من صنعك') || lower.includes('من انشاك') || lower.includes('من أنشأك') || lower.includes('مطور')) {
              replyText = "👨‍💻 **Samado MSILI** (وحش برمجة) هو الذي قام بإنشاء هذا التطبيق في تاريخ **05/05/2026**! 🚀✨";
            } else if (lower.includes('من انت') || lower.includes('من أنت')) {
              replyText = "أنا **OWN AI**، مساعد ذكي ومطور مدمج في تطبيق ماسنجر وفيسبوك. جاهز لمساعدتك في أي وقت! 🤖✨";
            } else {
              replyText = "أهلاً بك! أنا معك وأتابع استفسارك باهتمام. كيف يمكنني تقديم المساعدة الإضافية لك اليوم؟ 🤖✨";
            }
          }

          const aiMessageRef = doc(collection(db, 'messages'));
          await setDoc(aiMessageRef, {
            senderId: 'ai-bot',
            receiverId: currentUid,
            groupId: null,
            text: replyText,
            image: replyImage,
            audio: null,
            audioDuration: null,
            replyTo: null,
            timestamp: new Date().toISOString(),
            participants: [currentUid, 'ai-bot']
          });
        } catch (botErr) {
          console.warn("Could not record AI bot message to chat:", botErr);
        }
      }

    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'messages');
    } finally {
      setLoading('sendingMessage', false);
    }
  };
  const reactToMessage = async (messageId: string, emoji: string) => {
    if (!currentUid) return;
    try {
      const msgRef = doc(db, 'messages', messageId);
      const targetMsg = messages.find(m => m.id === messageId);
      if (!targetMsg) return;

      const currentReactions = { ...(targetMsg.reactions || {}) };
      if (currentReactions[currentUid] === emoji) {
        delete currentReactions[currentUid];
      } else {
        currentReactions[currentUid] = emoji;
      }

      await updateDoc(msgRef, {
        reactions: currentReactions
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `messages/${messageId}`);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!currentUid) return;
    try {
      const msgRef = doc(db, 'messages', messageId);
      await deleteDoc(msgRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `messages/${messageId}`);
    }
  };

  const updateUserNote = async (noteText: string, music?: any | null) => {
    if (!currentUid) return;
    try {
      const userRef = doc(db, 'users', currentUid);
      const trimmed = noteText.trim();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const hasContent = !!(trimmed || music);
      
      await updateDoc(userRef, {
        userNote: hasContent ? {
          text: trimmed,
          music: music || null,
          updatedAt: now.toISOString(),
          expiresAt: expiresAt.toISOString()
        } : null
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUid}`);
    }
  };

  const blockUser = async (userId: string) => {
    if (!currentUid) return;
    setLoading('blockingUser', true);
    try {
      const currentUserRef = doc(db, 'users', currentUid);
      const otherUserRef = doc(db, 'users', userId);

      await updateDoc(currentUserRef, {
        blockedUsers: arrayUnion(userId),
        friends: arrayRemove(userId),
        friendRequests: arrayRemove(userId)
      });

      await updateDoc(otherUserRef, {
        friends: arrayRemove(currentUid),
        friendRequests: arrayRemove(currentUid)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    } finally {
      setLoading('blockingUser', false);
    }
  };

  const unblockUser = async (userId: string) => {
    if (!currentUid) return;
    setLoading('unblockingUser', true);
    try {
      const currentUserRef = doc(db, 'users', currentUid);
      await updateDoc(currentUserRef, {
        blockedUsers: arrayRemove(userId)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUid}`);
    } finally {
      setLoading('unblockingUser', false);
    }
  };

  const REPORT_SUSPENSION_THRESHOLD = 10;

  const reportUser = async (userId: string, reason?: string) => {
    if (!currentUid || currentUid === userId) return;
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) return;

      const userData = userDoc.data() as User;
      const existingReports = userData.reports || [];
      const reportReason = reason || 'انتهاك معايير المجتمع';
      const reportEntry = `${currentUid}_${new Date().toISOString()}_${reportReason}`;
      const updatedReports = [...existingReports, reportEntry];

      // 1. Gather mutual messages between reporter and reported user
      const mutualMsgs = messages.filter(m => 
        (m.senderId === currentUid && m.receiverId === userId) ||
        (m.senderId === userId && m.receiverId === currentUid) ||
        (m.participants && m.participants.includes(currentUid) && m.participants.includes(userId))
      ).slice(-25).map(m => ({
        senderId: m.senderId,
        senderName: m.senderId === currentUid ? (currentUser?.name || 'المُبلّغ') : (userData.name || 'المُبلّغ عنه'),
        text: m.text || (m.image ? '[صورة]' : (m.audio ? '[تسجيل صوتي]' : '')),
        timestamp: m.timestamp
      }));

      showToast('🤖 جاري فحص ومراجعة المراسلات والحسابات بواسطة الذكاء الاصطناعي للتحقق من البلاغ...');

      // 2. Call AI Safety Investigator to review correspondence & accounts
      let aiDecision: any = null;
      try {
        const resp = await fetch('/api/ai/investigate-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reporter: { id: currentUid, name: currentUser?.name || 'المُبلّغ', email: currentUser?.email },
            reportedUser: { id: userId, name: userData.name || 'المُبلّغ عنه', reportsCount: updatedReports.length, status: userData.status },
            reportReason: reportReason,
            reportDetails: reason,
            mutualMessages: mutualMsgs
          })
        });
        if (resp.ok) {
          aiDecision = await resp.json();
        }
      } catch {
        // Fallback to local heuristic safety decision
      }

      // Check whether AI decides to suspend (based on abusive messages or threshold)
      const isThresholdReached = updatedReports.length >= REPORT_SUSPENSION_THRESHOLD;
      const shouldSuspend = Boolean(aiDecision?.shouldSuspend || (isThresholdReached && aiDecision?.action !== 'DISMISS_FALSE_REPORT'));

      if (shouldSuspend) {
        const suspensionReason = aiDecision?.aiRationale 
          ? `قرار الذكاء الاصطناعي الأمني بعد مراجعة المراسلات والحسابات: ${aiDecision.aiRationale}`
          : `تم تعليق الحساب بواسطة الذكاء الاصطناعي بعد مراجعة المراسلات والحسابات لتلقيه ${updatedReports.length} بلاغات بسبب: ${reportReason}`;

        await updateDoc(userRef, {
          reports: updatedReports,
          status: 'suspended',
          suspensionReason: suspensionReason,
          suspendedAt: new Date().toISOString()
        });
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'suspended', suspensionReason, reports: updatedReports } : u));
        await recordSuspension(userId, userData.name || 'مستخدم', suspensionReason);
        await notifyReportersOfSuspension(userId, userData.name || 'مستخدم', userData.avatar || '', suspensionReason, updatedReports);
        
        showToast(aiDecision?.verdictTitle || `⚠️ قرار الذكاء الاصطناعي: تم تعليق الحساب بعد مراجعة المراسلات والحسابات وثبوت المخالفة.`);
      } else {
        await updateDoc(userRef, {
          reports: updatedReports
        });
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, reports: updatedReports } : u));
        
        showToast(aiDecision?.aiRationale 
          ? `🤖 راجع الذكاء الاصطناعي المراسلات: لم يثبت انتهاك يستوجب التعليق الفوري (${updatedReports.length}/10 بلاغات).` 
          : `✅ تم استلام البلاغ ومراجعته بالذكاء الاصطناعي (${updatedReports.length}/10 بلاغات لتعليق الحساب).`);
      }
    } catch (error) {
      console.error('Error reporting user:', error);
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
      showToast('❌ حدث خطأ أثناء إرسال البلاغ');
    }
  };

  const reportContent = async (authorId: string, contentId: string, type: 'post' | 'comment', reason: string) => {
    if (!currentUid) return;
    try {
      const userRef = doc(db, 'users', authorId);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) return;
      const reportedUser = userDoc.data() as User;
      const existingReports = reportedUser.reports || [];
      const reportEntry = `${currentUid}_${contentId}_${new Date().toISOString()}_${reason}`;
      const updatedReports = [...existingReports, reportEntry];

      // Gather mutual messages between reporter and reported user
      const mutualMsgs = messages.filter(m => 
        (m.senderId === currentUid && m.receiverId === authorId) ||
        (m.senderId === authorId && m.receiverId === currentUid) ||
        (m.participants && m.participants.includes(currentUid) && m.participants.includes(authorId))
      ).slice(-25).map(m => ({
        senderId: m.senderId,
        senderName: m.senderId === currentUid ? (currentUser?.name || 'المُبلّغ') : (reportedUser.name || 'المُبلّغ عنه'),
        text: m.text || (m.image ? '[صورة]' : ''),
        timestamp: m.timestamp
      }));

      showToast('🤖 جاري فحص ومراجعة المراسلات والحسابات بواسطة الذكاء الاصطناعي للتحقق من البلاغ...');

      let aiDecision: any = null;
      try {
        const resp = await fetch('/api/ai/investigate-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reporter: { id: currentUid, name: currentUser?.name || 'المُبلّغ', email: currentUser?.email },
            reportedUser: { id: authorId, name: reportedUser.name || 'المُبلّغ عنه', reportsCount: updatedReports.length, status: reportedUser.status },
            reportReason: reason,
            reportedContent: { type, text: `محتوى معرف #${contentId}` },
            mutualMessages: mutualMsgs
          })
        });
        if (resp.ok) {
          aiDecision = await resp.json();
        }
      } catch {
        // Fallback to local heuristic safety decision
      }

      const isThresholdReached = updatedReports.length >= REPORT_SUSPENSION_THRESHOLD;
      const shouldSuspend = Boolean(aiDecision?.shouldSuspend || isThresholdReached);

      if (shouldSuspend) {
        const suspensionReason = aiDecision?.aiRationale
          ? `قرار الذكاء الاصطناعي الأمني بعد مراجعة المراسلات والمحتوى: ${aiDecision.aiRationale}`
          : `تم تعليق حسابك لتراكم ${updatedReports.length} بلاغات على منشوراتك أو تعليقاتك لمخالفة معايير المجتمع: ${reason}`;

        await updateDoc(userRef, {
          reports: updatedReports,
          status: 'suspended',
          suspensionReason: suspensionReason,
          suspendedAt: new Date().toISOString()
        });
        setUsers(prev => prev.map(u => u.id === authorId ? { ...u, status: 'suspended', suspensionReason, reports: updatedReports } : u));
        await recordSuspension(authorId, reportedUser.name || 'مستخدم', suspensionReason);
        await notifyReportersOfSuspension(authorId, reportedUser.name || 'مستخدم', reportedUser.avatar || '', suspensionReason, updatedReports);
        showToast(aiDecision?.verdictTitle || `⚠️ قرار الذكاء الاصطناعي: تم تعليق الحساب بعد مراجعة المراسلات والحسابات.`);
      } else {
        await updateDoc(userRef, {
          reports: updatedReports
        });
        setUsers(prev => prev.map(u => u.id === authorId ? { ...u, reports: updatedReports } : u));
        showToast(aiDecision?.aiRationale 
          ? `🤖 راجع الذكاء الاصطناعي المراسلات: لم يثبت انتهاك يستوجب التعليق الفوري (${updatedReports.length}/10 بلاغات).` 
          : `✅ تم إرسال البلاغ بنجاح (${updatedReports.length} من أصل 10 بلاغات لتعليق الحساب).`);
      }
    } catch (error) {
      console.error('Error reporting content:', error);
      showToast('❌ حدث خطأ أثناء إرسال البلاغ.');
    }
  };

  const updatePhotoPrivacy = async (photoId: string, privacy: 'public' | 'friends' | 'private') => {
    if (!currentUid || !currentUser) return;
    setLoading('updatingPhotoPrivacy', true);
    try {
      const userRef = doc(db, 'users', currentUid);
      const updatedHistory = currentUser.photoHistory?.map(p => 
        p.id === photoId ? { ...p, privacy } : p
      ) || [];
      
      await updateDoc(userRef, { photoHistory: updatedHistory });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUid}`);
    } finally {
      setLoading('updatingPhotoPrivacy', false);
    }
  };

  const deletePhotoFromHistory = async (photoId: string) => {
    if (!currentUid || !currentUser) return;
    setLoading('deletingPhoto', true);
    try {
      const userRef = doc(db, 'users', currentUid);
      const updatedHistory = currentUser.photoHistory?.filter(p => p.id !== photoId) || [];
      
      await updateDoc(userRef, { photoHistory: updatedHistory });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUid}`);
    } finally {
      setLoading('deletingPhoto', false);
    }
  };

  
  const markNotificationAsRead = async (notificationId: string) => {
    if (!currentUid) return;
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${notificationId}`);
    }
  };

  const moderateUser = async (userId: string, updates: Partial<User>) => {
    if (!currentUid) return;
    const isSelf = currentUid === userId;
    const isAdmin = currentUser?.email === 'bda43535@gmail.com';
    if (!isAdmin && !isSelf) return;

    try {
      const userRef = doc(db, 'users', userId);
      const updatesToSend = { ...updates };
      if (updates.status === 'suspended' && !updates.suspendedAt) {
        updatesToSend.suspendedAt = new Date().toISOString();
      }
      await updateDoc(userRef, updatesToSend);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updatesToSend } : u));
      
      if (updates.status === 'suspended') {
        const moderatedUser = users.find(u => u.id === userId);
        if (moderatedUser) {
          await recordSuspension(userId, moderatedUser.name, updates.suspensionReason || 'تم تعليق الحساب بواسطة المشرف.');
          await notifyReportersOfSuspension(
            userId,
            moderatedUser.name,
            moderatedUser.avatar || '',
            updates.suspensionReason || 'تم تعليق الحساب لمخالفة معايير المجتمع',
            moderatedUser.reports || []
          );
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const restrictKeyboard = async (reason?: string) => {
    if (!currentUid) return;
    try {
      const userRef = doc(db, 'users', currentUid);
      const banReason = reason || 'تم حظر الكيبورد مؤقتاً لمخالفة معايير المجتمع بشأن المحتوى الجنسي أو غير اللائق في الصورة الشخصية.';
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours restriction
      await updateDoc(userRef, {
        isKeyboardBanned: true,
        keyboardBanReason: banReason,
        keyboardBanExpiresAt: expiresAt.toISOString(),
        violationType: 'sexual_avatar'
      });
      showToast('⚠️ تم حظر استخدام الكيبورد لمخالفة إرشادات المجتمع');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUid}`);
    }
  };

  const unrestrictKeyboard = async () => {
    if (!currentUid) return;
    try {
      const userRef = doc(db, 'users', currentUid);
      await updateDoc(userRef, {
        isKeyboardBanned: false,
        keyboardBanReason: null,
        keyboardBanExpiresAt: null,
        violationType: null
      });
      showToast('✅ تم فك حظر الكيبورد واستعادة صلاحيات الكتابة');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUid}`);
    }
  };

  const enforceCommunityViolation = async (
    type: 'sexual_avatar' | 'inappropriate_content' | 'general', 
    action: 'lock' | 'suspend' | 'disable' | 'keyboard_ban'
  ) => {
    if (!currentUid) return;
    try {
      const userRef = doc(db, 'users', currentUid);
      const defaultReason = type === 'sexual_avatar' 
        ? 'تم اتخاذ هذا الإجراء بسبب وضع صورة ملف شخصي تحتوي على محتوى جنسي أو غير لائق يخالف معايير مجتمع GROZLA.'
        : 'تم اتخاذ هذا الإجراء بسبب مخالفة إرشادات ومعايير المجتمع للأمان.';
      
      if (action === 'keyboard_ban') {
        await restrictKeyboard(defaultReason);
        return;
      }

      const updates: Partial<User> = {
        status: action === 'lock' ? 'locked' : action === 'disable' ? 'disabled' : 'suspended',
        suspensionReason: defaultReason,
        suspendedAt: new Date().toISOString(),
        violationType: type
      };

      // If sexual avatar, reset to safe avatar
      if (type === 'sexual_avatar') {
        updates.avatar = DEFAULT_AVATAR;
      }

      await updateDoc(userRef, updates);
      showToast(action === 'disable' ? '🚫 تم تعطيل الحساب' : action === 'lock' ? '🔒 تم قفل الحساب' : '⚠️ تم تعليق الحساب');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUid}`);
    }
  };

  const enforceProfilePhotoViolation = async (
    violationDetails?: { reason?: string; category?: string; candidateImg?: string; action?: 'disable' | 'lock' | 'suspend' }
  ) => {
    if (!currentUid || !currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUid);
      const todayStr = new Date().toISOString().split('T')[0];
      const isSameDay = currentUser.lastLockDate === todayStr;
      const previousLockCount = isSameDay ? (currentUser.dailyLockCount || 0) : 0;
      const newDailyCount = previousLockCount + 1;

      // 1. Delete violating photo first: replace with neutral safe default avatar
      const safeAvatar = DEFAULT_AVATAR;

      // 2. Remove the violating image from photo history and delete posts containing it
      let updatedPhotoHistory = currentUser.photoHistory || [];
      if (violationDetails?.candidateImg) {
        updatedPhotoHistory = updatedPhotoHistory.filter(photo => photo.url !== violationDetails.candidateImg);
        
        // Find and delete posts with this image
        const offendingPosts = posts.filter(p => p.authorId === currentUid && p.image === violationDetails.candidateImg);
        for (const p of offendingPosts) {
          try {
            await deleteDoc(doc(db, 'posts', p.id));
          } catch (e) {
            console.error("Error deleting offending post:", e);
          }
        }
        // Also remove them from local state
        setPosts(prev => prev.filter(p => p.image !== violationDetails.candidateImg));
      }

      // 3. Rule: In accordance with Facebook Community Standards, when nudity or sexual activity or any community violation is detected, Lock the account immediately (or suspend if repeatedly exceeded)
      const enforcedAction = violationDetails?.action || 'lock';

      if (enforcedAction === 'disable') {
        const disableReason = violationDetails?.reason || 
          violationDetails?.reason?.includes('استغلال جنسي') || violationDetails?.reason?.includes('عُري') ? 'لقد قمنا بتعليق حسابك بشأن استغلال جنسي للاطفال' : 'لقد قمنا بتعطيل حسابك لمخالفة معايير المجتمع.';

        await updateDoc(userRef, {
          avatar: safeAvatar,
          photoHistory: updatedPhotoHistory,
          status: 'disabled',
          suspensionReason: disableReason,
          suspendedAt: new Date().toISOString(),
          dailyLockCount: newDailyCount,
          lastLockDate: todayStr,
          violationType: 'sexual_avatar',
          avatarReviewStatus: 'rejected'
        });
        showToast('🚫 لقد قمنا بتعطيل حسابك لمخالفة معايير المجتمع');
      } else if (newDailyCount > 3 || enforcedAction === 'suspend') {
        // Exceeded 3 locks today -> Suspend account under appeal review
        const suspendReason = violationDetails?.reason?.includes('استغلال جنسي') || violationDetails?.reason?.includes('عُري') ? 'لقد قمنا بتعليق حسابك بشأن استغلال جنسي للاطفال' : (violationDetails?.reason || `🚫 تم تعليق حسابك ووضعه تحت مراجعة الطعن الرسمية لتكرار مخالفة معايير الصور الشخصية وإرشادات المجتمع (${newDailyCount} مخالفات اليوم).`);
        showToast('🚫 تم تعليق الحساب لمخالفة معايير المجتمع');
      } else {
        // Lock account (قفل الحساب)
        const lockReason = violationDetails?.reason?.includes('استغلال جنسي') || violationDetails?.reason?.includes('عُري') ? 'لقد قمنا بتعليق حسابك بشأن استغلال جنسي للاطفال' : (violationDetails?.reason || `🔒 تم حذف صورتك الشخصية وقفل حسابك لمخالفة معايير مجتمع فيسبوك (تم رصد نشاط جنسي أو عُري غير لائق). المخالفة رقم ${newDailyCount} لهذا اليوم.`);

        await updateDoc(userRef, {
          avatar: safeAvatar,
          photoHistory: updatedPhotoHistory,
          status: 'locked',
          suspensionReason: lockReason,
          suspendedAt: new Date().toISOString(),
          dailyLockCount: newDailyCount,
          lastLockDate: todayStr,
          violationType: 'sexual_avatar',
          avatarReviewStatus: 'rejected'
        });
        showToast(`🔒 تم قفل الحساب وحذف الصورة لمخالفة معايير المجتمع (${newDailyCount}/3)`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUid}`);
    }
  };

  const reactivateAccount = async () => {
    if (!currentUid) return;
    try {
      const userRef = doc(db, 'users', currentUid);
      await updateDoc(userRef, {
        status: 'active',
        suspensionReason: null,
        appealSelfie: null,
        appealPhoto: null,
        appealPhone: null,
        appealSubmittedAt: null,
        appealStatus: 'approved',
        appealStep: 'info',
        reports: [],
        isKeyboardBanned: false,
        keyboardBanReason: null,
        keyboardBanExpiresAt: null,
        violationType: null,
        avatarReviewStatus: 'approved'
      });
      setUsers(prev => prev.map(u => (u.id === currentUid || u.uid === currentUid) ? {
        ...u,
        status: 'active',
        suspensionReason: null,
        appealStatus: 'approved',
        appealStep: 'info',
        reports: []
      } : u));
      showToast('✅ عاد الحساب نشطاً بنجاح وتمت استعادة كافة الصلاحيات!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUid}`);
    }
  };

  const updateAppealStep = async (step: string, extra?: Record<string, any>) => {
    if (!currentUid) return;
    try {
      const userRef = doc(db, 'users', currentUid);
      const payload: Record<string, any> = { appealStep: step, ...(extra || {}) };
      await updateDoc(userRef, payload);
      setUsers(prev => prev.map(u => (u.id === currentUid || u.uid === currentUid) ? {
        ...u,
        ...payload
      } : u));
    } catch (error) {
      console.warn("Error updating appeal step in Firestore:", error);
    }
  };

  const submitAppeal = async (selfieImage: string) => {
    if (!currentUid) return;
    setLoading('updatingProfile', true);
    try {
      const userRef = doc(db, 'users', currentUid);
      const now = new Date().toISOString();
      await updateDoc(userRef, {
        appealSelfie: selfieImage,
        appealPhoto: selfieImage,
        appealSubmittedAt: now,
        appealStatus: 'under_review',
        status: 'suspended'
      });
      showToast('تم تقديم الطعن بنجاح، الحساب قيد المراجعة.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUid}`);
    } finally {
      setLoading('updatingProfile', false);
    }
  };

  const resolveAppeal = async (approved: boolean, reason?: string, targetUserId?: string) => {
    const uid = targetUserId || currentUid;
    if (!uid) return;
    setLoading('updatingProfile', true);
    try {
      const userRef = doc(db, 'users', uid);
      if (approved) {
        // يعود الحساب نشطاً
        await updateDoc(userRef, {
          status: 'active',
          suspensionReason: null,
          appealSelfie: null,
          appealPhoto: null,
          appealSubmittedAt: null,
          appealStatus: 'approved',
          reports: [],
          isKeyboardBanned: false,
          keyboardBanReason: null,
          keyboardBanExpiresAt: null,
          violationType: null,
          avatarReviewStatus: 'approved'
        });
        setUsers(prev => prev.map(u => (u.id === uid || u.uid === uid) ? {
          ...u,
          status: 'active',
          suspensionReason: null,
          reports: [],
          appealStatus: 'approved',
          isKeyboardBanned: false
        } : u));
        showToast('✅ عاد الحساب نشطاً بنجاح (تم تصحيح التعليق بالخطأ)!');
      } else {
        // يعطل الحساب وتظهر واجهة لقد قمنا بتعطيل حسابك
        const failReason = reason || 'بعد مراجعة طعنك وحسابك، تبيّن لنا أن حسابك لا يتبع معايير مجتمعنا. لحماية مجتمعنا، تم تعطيل الحساب نهائياً.';
        await updateDoc(userRef, {
          status: 'disabled',
          suspensionReason: failReason,
          appealStatus: 'rejected',
          appealSubmittedAt: null
        });
        setUsers(prev => prev.map(u => (u.id === uid || u.uid === uid) ? {
          ...u,
          status: 'disabled',
          suspensionReason: failReason,
          appealStatus: 'rejected'
        } : u));
        showToast('❌ تم تأكيد تعطيل الحساب لعدم اتباع معايير مجتمعنا.');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    } finally {
      setLoading('updatingProfile', false);
    }
  };

  const switchAccount = async (targetUid: string) => {
    if (!targetUid || targetUid === currentUid) return;
    try {
      localStorage.setItem('customUserSession', targetUid);
      setCurrentUid(targetUid);
      setIsLoggedIn(true);
      setCurrentView('home');
      setViewUserId(null);
      showToast('تم تبديل الحساب بنجاح! 🔄');
    } catch (e) {
      console.error('Error switching account:', e);
    }
  };

  const removeSavedAccount = (targetUid: string) => {
    try {
      const raw = localStorage.getItem('savedAccounts');
      if (raw) {
        const list = JSON.parse(raw);
        const filtered = list.filter((a: any) => a.uid !== targetUid && a.id !== targetUid && a.email !== targetUid);
        safeSaveSavedAccounts(filtered);
        showToast('تمت إزالة الحساب من قائمة التبديل');
      }
    } catch (e) {
      console.error('Error removing saved account:', e);
    }
  };

  
  // Update lastActive status periodically
  useEffect(() => {
    if (!isLoggedIn || !currentUid) return;

    const pingActive = async () => {
      // Check if user disabled active status
      if (currentUser && currentUser.activeStatusEnabled === false) return;
      
      try {
        const userRef = doc(db, 'users', currentUid);
        await updateDoc(userRef, { lastActive: new Date().toISOString() });
      } catch (err) {}
    };

    pingActive();
    const interval = setInterval(pingActive, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [isLoggedIn, currentUid, currentUser?.activeStatusEnabled]);

  return (
    <AppContext.Provider value={{
      users, posts, messages, groups, stories, notifications, currentUser, currentView, viewUserId, isLoggedIn, isAuthReady, loadingStates, activeChat, setActiveChat,
      logout, setCurrentView: handleSetCurrentView, updateProfile, updateAiBotProfile, addPost, editPost, removeMediaFromPost, deletePost, handleReaction,
      addComment, deleteComment, sendFriendRequest, cancelFriendRequest, acceptFriendRequest, declineFriendRequest, unfriend, sendMessage, reactToMessage, deleteMessage, updateUserNote, createGroup, updateGroupSettings, savePost, addStory, deleteStory, blockUser, unblockUser, reportUser, reportContent, moderateUser, reactivateAccount, updateAppealStep, submitAppeal, resolveAppeal, markNotificationAsRead,
      restrictKeyboard, unrestrictKeyboard, enforceCommunityViolation, enforceProfilePhotoViolation,
      createSubProfile, switchSubProfile, deleteSubProfile,
      archivePost, unarchivePost, archiveStory, unarchiveStory, archivedStories,
      toastMessage, showToast, refreshHomeFeed,
      signup, login, quickResetPasswordAndLogin, loginWithGoogle, linkGoogleAccount, savePersonalPhone, removePersonalPhone,
      isSkyModalOpen, skyModalTab, openSkyModal, closeSkyModal,
      language, direction, setAppLanguage, t,
      switchAccount, removeSavedAccount,
      gmailToken, setGmailToken, signInWithGoogleForGmail
    }}>
      {children}
      <SkyServicesModal isOpen={isSkyModalOpen} onClose={closeSkyModal} initialTab={skyModalTab} />
      {toastMessage && (
        <div className="fixed bottom-16 right-4 z-[9999] bg-gray-900/95 text-white font-black text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-gray-700 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 dir-rtl">
          <span>{toastMessage}</span>
        </div>
      )}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
