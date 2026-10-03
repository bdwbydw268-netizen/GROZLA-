/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CreatePost from './components/CreatePost';
import Feed from './components/Feed';
import Profile from './components/Profile';
import Friends from './components/Friends';
import Messages from './components/Messages';
import Notifications from './components/Notifications';
import Search from './components/Search';
import Settings from './components/Settings';
import SavedPosts from './components/SavedPosts';
import Marketplace from './components/Marketplace';
import Login from './components/Login';
import Stories from './components/Stories';
import StoriesView from './components/StoriesView';

import MusicPlayer from './components/MusicPlayer';
import ArchiveView from './components/ArchiveView';
import ReportActionView from './components/ReportActionView';
import SuspendedAccount from './components/SuspendedAccount';
import DisabledAccount from './components/DisabledAccount';
import SkyMessengerApp from './components/SkyMessengerApp';
import GrozlaMail from './components/GrozlaMail';
import { AppProvider, useAppContext } from './context/AppContext';
import { AnimatePresence, motion } from 'motion/react';
import { auth } from './firebase';

function AppContent() {
  const { currentView, setCurrentView, currentUser, showToast, direction, notifications, logout } = useAppContext();
  const [appRefreshRate, setAppRefreshRate] = React.useState<number>(() => {
    const saved = localStorage.getItem('app_refresh_rate');
    return saved ? parseInt(saved, 10) : 244;
  });

  React.useEffect(() => {
    // Initialize dark mode from localStorage
    const isSavedDark = localStorage.getItem('app_dark_mode') === 'true';
    if (isSavedDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const handleRateChange = (e: any) => {
      if (e.detail) {
        setAppRefreshRate(e.detail);
      }
    };
    const handleDarkModeToggle = (e: any) => {
      if (e.detail) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    window.addEventListener('app_refresh_rate_change', handleRateChange);
    window.addEventListener('app_dark_mode_toggle', handleDarkModeToggle);
    return () => {
      window.removeEventListener('app_refresh_rate_change', handleRateChange);
      window.removeEventListener('app_dark_mode_toggle', handleDarkModeToggle);
    };
  }, []);

  if (currentUser?.status === 'suspended' || currentUser?.status === 'locked') {
    return <SuspendedAccount />;
  }

  if (currentUser?.status === 'disabled') {
    return <DisabledAccount />;
  }

  if (currentView === 'sky-messenger') {
    return (
      <SkyMessengerApp
        onBackToFacebook={() => setCurrentView('home')}
        onLogout={() => logout()}
      />
    );
  }

  const handleRefreshHome = async () => {
    // Simulated smooth re-sync / refresh
    await new Promise(resolve => setTimeout(resolve, 800));
    showToast('تم تحديث آخر الأخبار والمنشورات');
  };

  return (
    <div dir={direction} className="min-h-screen bg-gray-100 pb-8 font-sans overflow-x-hidden selection:bg-blue-100 selection:text-blue-600">
      <Navbar />
      <main className="max-w-2xl mx-auto pt-32 md:pt-36 pb-12 md:pb-16 px-0 md:px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.99 }}
            transition={{ ease: [0.16, 1, 0.3, 1], duration: appRefreshRate >= 240 ? 0.08 : 0.12 }}
            className={appRefreshRate >= 240 ? 'fps-244' : 'fps-120'}
          >
            {currentView === 'home' && (
              <div className="relative min-h-[90vh]">
                {/* 100% CRYSTAL CLEAR BALLROOM GALA PARTY BACKGROUND - ZERO BLUR / ZERO FOG (خلفية الحفلة وقاعة الرقص فائقة الوضوح وبدون ضباب) */}
                <div 
                  className="fixed inset-0 bg-cover bg-center -z-10 pointer-events-none transition-all duration-700"
                  style={{ backgroundImage: `url('/home_ballroom_bg.jpg')` }}
                />
                
                <div className="space-y-3 relative z-10">
                  <CreatePost />
                  <Stories />
                  <Feed />
                </div>
              </div>
            )}
            {currentView === 'profile' && <Profile />}
            {currentView === 'friends' && <Friends />}
            {currentView === 'stories' && <StoriesView />}
            {currentView === 'messages' && <Messages />}
            {currentView === 'notifications' && <Notifications />}
            {currentView === 'search' && <Search />}
            {currentView === 'music' && <MusicPlayer />}
            {currentView === 'archive' && <ArchiveView />}
            {(currentView === 'report-action' || currentView === 'reports') && (
              <ReportActionView
                notification={notifications.find(n => n.type === 'report_action_taken') || null}
                onBack={() => setCurrentView('notifications')}
              />
            )}
            {(currentView === 'marketplace' || currentView === 'saved-posts') && <Marketplace />}
            {currentView === 'mail' && <GrozlaMail />}
            {currentView === 'menu' && <Settings />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function AppRoot() {
  const { isLoggedIn, isAuthReady, currentView, setCurrentView } = useAppContext();

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex flex-col items-center bg-white">
        <div className="flex-1 flex flex-col items-center justify-center space-y-5 mt-10">
          <div className="text-[#1877f2] font-black text-5xl tracking-tighter">
            GROZLA
          </div>
          <div className="w-8 h-8 border-[3.5px] border-gray-300 border-t-[#1877f2] rounded-full animate-spin"></div>
        </div>
        <div className="pb-8 flex flex-col items-center justify-center">
          <span className="text-[10px] font-bold text-gray-500 tracking-widest mb-0.5 uppercase">from</span>
          <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-widest uppercase">
            OWN
          </span>
        </div>
      </div>
    );
  }

  if (isLoggedIn) {
    return <AppContent />;
  }

  return <Login />;
}

export default function App() {
  return (
    <AppProvider>
      <AppRoot />
    </AppProvider>
  );
}
