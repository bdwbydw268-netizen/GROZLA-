import { User } from '../types';

export const isUserOnline = (user: User | null | undefined): boolean => {
  if (!user) return false;
  // If user explicitly disabled active status
  if (user.activeStatusEnabled === false) return false;
  
  if (!user.lastActive) return false;
  
  // 5 minutes timeout for active status
  const lastActiveTime = new Date(user.lastActive).getTime();
  const now = Date.now();
  return (now - lastActiveTime) < 5 * 60 * 1000;
};
