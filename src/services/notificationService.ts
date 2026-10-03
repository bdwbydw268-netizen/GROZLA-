import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { NotificationType, User } from '../types';

export const sendNotification = async (
  toId: string,
  fromUser: User,
  type: NotificationType,
  text: string,
  targetId?: string
) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      toId,
      fromId: fromUser.uid,
      fromName: fromUser.name,
      fromAvatar: fromUser.avatar,
      type,
      text,
      targetId: targetId || null,
      time: new Date().toISOString(),
      read: false,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

export const notifyMentions = async (
  content: string,
  fromUser: User,
  type: 'mention_post' | 'mention_comment',
  targetId: string
) => {
  const mentionRegex = /@(\S+)/g;
  const matches = content.match(mentionRegex);
  if (!matches) return;

  const usernames = matches.map(m => m.substring(1));
  
  for (const username of usernames) {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('name', '==', username));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const targetUser = querySnapshot.docs[0].data() as User;
        if (targetUser.uid !== fromUser.uid) {
          await sendNotification(
            targetUser.uid,
            fromUser,
            type,
            type === 'mention_post' ? 'قام بذكرك في منشور' : 'قام بذكرك في تعليق',
            targetId
          );
        }
      }
    } catch (error) {
      console.error(`Error notifying mention for ${username}:`, error);
    }
  }
};
