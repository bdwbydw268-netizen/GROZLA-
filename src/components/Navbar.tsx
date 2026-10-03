import React, { useState } from 'react';
import { Search, Home, Users, MessageCircle, Bell, Settings, Globe, Plus, Menu, Music, Download } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { motion } from 'motion/react';
import LanguageSwitcherModal from './LanguageSwitcherModal';
import NineTailedFoxLogo from './NineTailedFoxLogo';
import GrozlaApkDownloadCenter from './GrozlaApkDownloadCenter';

export default function Navbar() {
  const { currentView, setCurrentView, currentUser, notifications, messages, refreshHomeFeed, t, direction, language } = useAppContext();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showGrozlaApkCenter, setShowGrozlaApkCenter] = useState(false);

  if (!currentUser) return null;

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;
  const friendRequestsCount = currentUser.friendRequests?.length || 0;
  const unreadMessagesCount = messages.filter(m => m.receiverId === currentUser.id && m.senderId !== currentUser.id).length || 0;

  // Facebook Lite Primary Tabs
  const tabs = [
    { id: 'home', icon: Home, label: t('home', 'الرئيسية'), badge: 15 },
    { id: 'friends', icon: Users, label: t('friends', 'الأصدقاء'), badge: friendRequestsCount > 0 ? friendRequestsCount : 1 },
    { id: 'messages', icon: MessageCircle, label: t('messages', 'الرسائل'), badge: unreadMessagesCount > 0 ? unreadMessagesCount : 2 },
    { id: 'notifications', icon: Bell, label: t('notifications', 'الإشعارات'), badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined },
    { id: 'music', icon: Music, label: 'موسيقى' },
    { id: 'menu', icon: Menu, label: t('menu', 'القائمة') },
  ];

  return (
    <>
      <div className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200/90 shadow-2xs ${direction === 'rtl' ? 'dir-rtl' : 'dir-ltr'}`}>
        {/* Top Header (Facebook style) */}
        <div className={`max-w-2xl mx-auto px-4 py-2 flex justify-between items-center bg-white ${direction === 'rtl' ? 'dir-rtl' : 'dir-ltr'}`}>
          {/* Right side in RTL (Logo with Nine-Tailed Fox and Bijuu Bomb animation) */}
          <div className="flex items-center">
            <NineTailedFoxLogo
              direction={direction}
              onClick={() => {
                if (currentView === 'home') {
                  refreshHomeFeed();
                } else {
                  setCurrentView('home');
                  refreshHomeFeed();
                }
              }}
            />
          </div>

          {/* Left side in RTL (Action Buttons) */}
          <div className="flex items-center gap-1.5">
            {/* GROZLA APK Download Center Button */}
            <motion.button 
              whileTap={{ scale: 0.92 }}
              onClick={() => setShowGrozlaApkCenter(true)}
              className="px-2.5 h-10 flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs transition-all cursor-pointer shadow-md shadow-purple-900/30 border border-purple-400/40"
              title="مركز تنزيل تطبيق GROZLA APK الرسمي"
            >
              <Download size={16} className="animate-bounce" />
              <span className="hidden sm:inline">GROZLA APK</span>
            </motion.button>
            {/* Plus / Create Button */}
            <motion.button 
              whileTap={{ scale: 0.92 }}
              onClick={() => setCurrentView('create')}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-900 transition-colors cursor-pointer"
            >
              <Plus size={24} strokeWidth={2.5} />
            </motion.button>
            {/* Search Button */}
            <motion.button 
              whileTap={{ scale: 0.92 }}
              onClick={() => setCurrentView('search')}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                currentView === 'search' ? 'bg-[#8b5cf6] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}
            >
              <Search size={22} strokeWidth={2.5} />
            </motion.button>
            {/* Sky Messenger App Button */}
            <motion.button 
              whileTap={{ scale: 0.92 }}
              onClick={() => setCurrentView('sky-messenger')}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-50 hover:bg-purple-100 text-[#8b5cf6] transition-colors cursor-pointer border border-purple-200/80 shadow-2xs relative"
              title="فتح تطبيق مسنجر SKY (Google Play Edition)"
            >
              <MessageCircle size={22} strokeWidth={2.4} />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
            </motion.button>
          </div>
        </div>
        
        {/* Navigation Tab Bar */}
        <div className="max-w-2xl mx-auto flex justify-between border-t border-gray-200/80 bg-white px-0 py-0 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'home') {
                    if (currentView === 'home') {
                      refreshHomeFeed();
                    } else {
                      setCurrentView('home');
                      refreshHomeFeed();
                    }
                  } else {
                    setCurrentView(tab.id);
                  }
                }}
                className={`flex-1 min-w-[50px] py-2.5 flex justify-center items-center relative transition-colors cursor-pointer group select-none ${
                  isActive ? 'text-[#8b5cf6]' : 'text-[#606770] hover:text-purple-600 hover:bg-purple-50/50'
                }`}
                title={tab.label}
              >
                <div className="relative flex items-center justify-center">
                  {tab.id === 'notifications' ? (
                    <div 
                      className={`w-9 h-9 rounded-full flex items-center justify-center bg-cover bg-center relative overflow-hidden transition-all duration-150 group-active:scale-90 border ${
                        isActive 
                          ? 'border-[#8b5cf6] ring-2 ring-[#8b5cf6]/40 shadow-sm' 
                          : 'border-gray-300 hover:border-gray-400 shadow-2xs'
                      }`}
                      style={{ backgroundImage: "url('/messenger_bg.jpg')" }}
                    >
                      {/* Crisp dark overlay to keep image clear without any white fog */}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Icon 
                          size={19} 
                          className="text-white drop-shadow-md" 
                          strokeWidth={isActive ? 2.8 : 2.2} 
                        />
                      </div>
                    </div>
                  ) : (
                    <Icon 
                       size={26} 
                       className={`transition-transform duration-150 group-active:scale-90 ${
                        isActive 
                          ? 'text-[#8b5cf6] fill-[#8b5cf6]' 
                          : 'text-[#606770] hover:text-[#8b5cf6]'
                      }`} 
                      strokeWidth={isActive ? 2.6 : 2.1} 
                    />
                  )}
                  {tab.badge ? (
                    <span className="absolute -top-1.5 -right-2.5 bg-[#e41e3f] text-white text-[11px] font-bold min-w-[20px] h-[20px] px-1 flex items-center justify-center rounded-full border-[2px] border-white shadow-xs leading-none">
                      {tab.badge > 9 ? '15+' : tab.badge}
                    </span>
                  ) : null}
                </div>
                {/* Active Underline Tab Indicator */}
                {isActive && (
                  <motion.div 
                    layoutId="activeNavTab"
                    className="absolute bottom-0 inset-x-0 h-[3px] bg-[#8b5cf6] rounded-t-sm" 
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <LanguageSwitcherModal 
        isOpen={showLanguageModal} 
        onClose={() => setShowLanguageModal(false)} 
      />

      <GrozlaApkDownloadCenter
        isOpen={showGrozlaApkCenter}
        onClose={() => setShowGrozlaApkCenter(false)}
      />
    </>
  );
}
