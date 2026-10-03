export interface PhotoHistoryItem {
  id: string;
  url: string;
  type: 'avatar' | 'cover';
  privacy: 'public' | 'friends' | 'private';
  time: string;
}

export interface SubProfile {
  id: string;
  name: string;
  avatar: string;
  cover?: string;
  bio?: string;
  category?: string;
  followersCount?: number;
  createdAt: string;
}

export interface User {
  id: string;
  uid: string;
  name: string;
  avatar: string;
  cover: string;
  bio: string;
  friends: string[];
  friendRequests: string[];
  savedBy: string[];
  savedPosts?: string[];
  subProfiles?: SubProfile[];
  activeSubProfileId?: string | null;
  blockedUsers?: string[];
  status?: 'active' | 'suspended' | 'disabled' | 'locked';
  suspensionReason?: string | null;
  suspendedAt?: string;
  appealStep?: string;
  appealSelfie?: string | null;
  appealPhoto?: string | null;
  appealIdCard?: string | null;
  appealPhone?: string | null;
  appealSubmittedAt?: string | null;
  appealStatus?: 'none' | 'under_review' | 'approved' | 'rejected' | null;
  idVerifiedAt?: string | null;
  reports?: string[];
  birthDate?: string;
  birthDateChanged?: boolean;
  isUnderage?: boolean;
  tempPhotoReview?: string;
  tempPhotoIsSafe?: boolean;
  tempPhotoReason?: string;
  phone?: string;
  phoneVerified?: boolean;
  phoneLinkedAt?: string;
  birthDatePrivacy?: 'public' | 'friends' | 'only_me';
  nickname?: string;
  username?: string;
  currentCity?: string;
  hometown?: string;
  relationshipStatus?: string;
  family?: string;
  work?: string;
  education?: string;
  pinnedDetails?: string[];
  photoHistory?: PhotoHistoryItem[];
  email?: string;
  googleLinked?: boolean;
  googleEmail?: string;
  pin?: string;
  isVerified?: boolean;
  role?: 'user' | 'admin' | 'ai';
  language?: string;
  notifications?: Notification[];
  userNote?: {
    text: string;
    music?: {
      id: string;
      title: string;
      artist: string;
      url: string;
      cover: string;
      duration?: number;
      genre?: string;
    } | null;
    updatedAt: string;
    expiresAt?: string;
  };
  isKeyboardBanned?: boolean;
  keyboardBanReason?: string;
  keyboardBanExpiresAt?: string;
  violationType?: 'sexual_avatar' | 'inappropriate_content' | 'general' | null;
  dailyLockCount?: number;
  lastLockDate?: string;
  avatarReviewStatus?: 'approved' | 'rejected' | 'pending';
  biometricKey?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  accountNumber?: string;
  ownSecurityCode?: string;
  ownSecurityCodeConfirmedAt?: string;
  skyDedicatedNumber?: string;
  skyDedicatedEmail?: string;
  skyVerified?: boolean;
  nameChangesHistory?: string[];
  nameReviewStatus?: 'approved' | 'in_review' | 'none';
  nameReviewSubmittedAt?: string;
  lastActive?: string;
  activeStatusEnabled?: boolean;
  typingIndicatorEnabled?: boolean;
  isProfileLocked?: boolean;
  profileGuardActive?: boolean;
}

export type NotificationType = 'friend_request' | 'mention_post' | 'mention_comment' | 'reaction' | 'comment' | 'report_action_taken';

export interface Notification {
  id: string;
  type: NotificationType;
  fromId: string;
  fromName: string;
  fromAvatar: string;
  targetId?: string; // Post ID or Comment ID
  text: string;
  time: string;
  read: boolean;
  metadata?: {
    reportedUserId?: string;
    reportedUserName?: string;
    reportedUserAvatar?: string;
    actionTaken?: string;
    reason?: string;
    removalTitle?: string;
    timestamp?: string;
  };
}

export interface Comment {
  id: string;
  authorId: string;
  text: string;
  image?: string;
  time: string;
  parentId?: string;
  likes?: string[];
}

export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';

export interface PostType {
  id: string;
  authorId: string;
  time: string;
  content: string;
  image?: string;
  video?: string;
  music?: string;
  reactions: Record<string, ReactionType>;
  comments: Comment[];
  savedBy?: string[];
  isArchived?: boolean;
  archivedAt?: string;
}

export interface Group {
  id: string;
  name: string;
  members: string[];
  avatar?: string;
  admins?: string[];
  nicknames?: Record<string, string>;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId?: string;
  groupId?: string;
  text: string;
  image?: string;
  audio?: string;
  audioDuration?: number;
  reactions?: Record<string, string>;
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  };
  timestamp: string;
  participants: string[];
}

export interface Story {
  id: string;
  authorId: string;
  time: string;
  image?: string;
  video?: string;
  music?: string;
  songTitle?: string;
  songArtist?: string;
  songCover?: string;
  text?: string;
  textColor?: string;
  textSize?: 'small' | 'normal' | 'large';
  isArchived?: boolean;
  archivedAt?: string;
}

export interface AiGeneratedImage {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  category: string;
  categoryKey: string;
  prompt?: string;
}

export type AiUploadContext = 'profile' | 'appeal' | 'comment' | 'post' | 'cover' | 'general';

export interface AiImageAnalysisResult {
  isSafe: boolean;
  score?: number;
  label?: string;
  summary: string;
  domain?: string;
  suggestions?: string[];
  faceDetected?: boolean;
  isBlurry?: boolean;
  resemblanceScore?: number;
  tags?: string[];
}
