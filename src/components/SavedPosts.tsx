import React from 'react';
import { useAppContext } from '../context/AppContext';
import Post from './Post';
import { motion } from 'motion/react';

export default function SavedPosts() {
  const { posts, currentUser } = useAppContext();

  if (!currentUser) return null;

  const savedPosts = posts.filter(post => post.savedBy?.includes(currentUser.id));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="p-4"
    >
      <h2 className="text-2xl font-bold mb-4">المنشورات المحفوظة</h2>
      {savedPosts.length === 0 ? (
        <div className="text-center py-10 text-gray-500">لا توجد منشورات محفوظة.</div>
      ) : (
        <div className="space-y-4">
          {savedPosts.map((post, pIdx) => (
            <Post key={post.id ? `saved-post-${post.id}-${pIdx}` : `saved-post-${pIdx}`} post={post} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
