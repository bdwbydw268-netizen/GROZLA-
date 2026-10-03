import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Sparkles, Music, Video, User, Clock, Eye, ChevronLeft } from 'lucide-react';
import FacebookStoryStudio from './FacebookStoryStudio';
import Stories from './Stories';

export default function StoriesView() {
  const { currentUser, stories, users, addStory } = useAppContext();
  const [showStudio, setShowStudio] = useState(false);

  if (!currentUser) return null;

  return (
    <div className="space-y-4 px-2 sm:px-0 pb-16" dir="rtl">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 flex items-center justify-center text-white shadow-xs">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900 tracking-tight">القصص</h1>
            <p className="text-xs text-gray-500 font-bold">شاهد أحدث لحظات وقصص أصدقائك أو شارك قصتك</p>
          </div>
        </div>

        {/* Create Story Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowStudio(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1877f2] hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer transition-all"
        >
          <Plus size={16} strokeWidth={3} />
          <span>إنشاء قصة</span>
        </motion.button>
      </div>

      {/* Main Stories Carousel & Viewer */}
      <Stories />

      {/* Story Studio Modal */}
      {showStudio && (
        <FacebookStoryStudio 
          isOpen={true}
          onClose={() => setShowStudio(false)}
          onPublish={(storyData) => {
            addStory(
              storyData.image,
              storyData.video,
              storyData.music,
              storyData.songTitle,
              storyData.songArtist,
              storyData.songCover,
              storyData.text,
              storyData.textColor,
              storyData.textSize
            );
            setShowStudio(false);
          }}
        />
      )}
    </div>
  );
}
