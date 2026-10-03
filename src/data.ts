import { User, PostType, Message, Group } from './types';

export const CURRENT_USER_ID = 'u1';

export const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    uid: 'u1',
    name: 'أحمد محمود',
    avatar: 'https://picsum.photos/seed/ahmed/100/100',
    cover: 'https://picsum.photos/seed/cover1/800/300',
    bio: 'مطور واجهات أمامية مهتم بتعلم التقنيات الجديدة.',
    friends: ['u2', 'u3'],
    friendRequests: ['u4'],
    savedBy: []
  },
  {
    id: 'u2',
    uid: 'u2',
    name: 'سارة خالد',
    avatar: 'https://picsum.photos/seed/sara/100/100',
    cover: 'https://picsum.photos/seed/cover2/800/300',
    bio: 'مصممة جرافيك | محبة للطبيعة',
    friends: ['u1'],
    friendRequests: [],
    savedBy: []
  },
  {
    id: 'u3',
    uid: 'u3',
    name: 'محمد علي',
    avatar: 'https://picsum.photos/seed/mohamed/100/100',
    cover: 'https://picsum.photos/seed/cover3/800/300',
    bio: 'عشاق الطعام والسفر',
    friends: ['u1'],
    friendRequests: [],
    savedBy: []
  },
  {
    id: 'u4',
    uid: 'u4',
    name: 'نورة عبدالله',
    avatar: 'https://picsum.photos/seed/noura/100/100',
    cover: 'https://picsum.photos/seed/cover4/800/300',
    bio: 'قارئة نهمة 📚',
    friends: [],
    friendRequests: [],
    savedBy: []
  }
];

export const INITIAL_POSTS: PostType[] = [
  {
    id: 'p1',
    authorId: 'u1',
    time: 'منذ ساعتين',
    content: 'صباح الخير للجميع! يوم جميل ومشرق ☀️\nأتمنى لكم التوفيق في أعمالكم اليوم.',
    reactions: { 'u2': 'like', 'u3': 'love' },
    comments: [
      { id: 'c1', authorId: 'u2', text: 'صباح النور!', time: 'منذ ساعة' }
    ]
  },
  {
    id: 'p2',
    authorId: 'u2',
    time: 'منذ 5 ساعات',
    content: 'صورة من رحلتي الأخيرة إلى الجبال. الطبيعة ساحرة جداً! 🏔️🌲',
    image: 'https://picsum.photos/seed/mountains/800/600',
    reactions: { 'u1': 'wow', 'u3': 'like', 'u4': 'love' },
    comments: [
      { id: 'c2', authorId: 'u1', text: 'مكان رائع جداً!', time: 'منذ 4 ساعات' }
    ]
  }
];

export const INITIAL_GROUPS: Group[] = [
  { id: 'g1', name: 'مجموعة العمل', members: ['u1', 'u2', 'u3'], avatar: 'https://picsum.photos/seed/workgroup/100/100' }
];

export const INITIAL_MESSAGES: Message[] = [
  { id: 'm1', senderId: 'u2', receiverId: 'u1', text: 'مرحباً أحمد! كيف حالك؟', timestamp: '10:00 ص', participants: ['u1', 'u2'] },
  { id: 'm2', senderId: 'u1', receiverId: 'u2', text: 'أهلاً سارة، أنا بخير الحمد لله. وأنتِ؟', timestamp: '10:05 ص', participants: ['u1', 'u2'] },
  { id: 'm3', senderId: 'u3', receiverId: 'u1', text: 'هل رأيت المنشور الأخير؟', timestamp: 'الأمس', participants: ['u1', 'u3'] },
  { id: 'm4', senderId: 'u1', groupId: 'g1', text: 'مرحباً بالجميع في مجموعة العمل!', timestamp: '11:00 ص', participants: ['u1', 'u2', 'u3'] },
  { id: 'm5', senderId: 'u2', groupId: 'g1', text: 'أهلاً بك أحمد.', timestamp: '11:05 ص', participants: ['u1', 'u2', 'u3'] },
];
