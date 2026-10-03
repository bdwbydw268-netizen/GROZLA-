import React from 'react';
import Post from './Post';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';

export default function Feed({ userId, customPosts }: { userId?: string; customPosts?: any[] }) {
  const { posts: contextPosts, currentUser, users } = useAppContext();
  const posts = customPosts || contextPosts;

  const displayPosts = React.useMemo(() => {
    return posts.filter(p => {
      // Hide archived posts from regular feeds
      if (p.isArchived) {
        return false;
      }
      if (userId) {
        return p.authorId === userId;
      }
      const author = users.find(u => u.id === p.authorId);
      // Hide posts from locked, suspended, or disabled users
      if (author && author.id !== currentUser?.id && author.status !== 'active') {
        return false;
      }
      // Filter out posts from blocked users and users who blocked me
      const isAuthorBlocked = currentUser?.blockedUsers?.includes(p.authorId);
      const hasAuthorBlockedMe = author?.blockedUsers?.includes(currentUser?.id || '');
      return !isAuthorBlocked && !hasAuthorBlockedMe;
    });
  }, [posts, users, currentUser, userId]);

  return (
    <div className="flex flex-col min-h-screen relative select-none">
      <AnimatePresence mode="popLayout">
        {displayPosts.map((post, index) => (
          <motion.div 
            key={post.id ? `feed-post-${post.id}-${index}` : `feed-post-${index}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.2) }}
          >
            <Post post={post} />
          </motion.div>
        ))}
      </AnimatePresence>
      {displayPosts.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-gray-500 py-12 bg-white md:rounded-xl shadow-2xs border border-gray-150 my-2"
        >
          <p className="text-sm font-bold">لا توجد منشورات لعرضها حالياً.</p>
        </motion.div>
      )}
    </div>
  );
}
