import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { motion } from 'motion/react';
import { UserPlus, MessageSquare, Heart, AtSign, Bell, ShieldAlert } from 'lucide-react';
import { Notification } from '../types';
import ReportActionView from './ReportActionView';

export default function Notifications() {
  const { users, notifications, currentUser, acceptFriendRequest, declineFriendRequest, setCurrentView, markNotificationAsRead } = useAppContext();
  const [selectedReportActionNotif, setSelectedReportActionNotif] = useState<Notification | null>(null);
  
  const displayNotifications = notifications.filter(n => {
    if (!n.fromId || n.fromId === 'system') return true;
    const fromUser = users.find(u => u.id === n.fromId);
    return !fromUser || fromUser.status === 'active';
  });

  useEffect(() => {
    // Mark all unread notifications as read when viewing the notifications page
    displayNotifications.forEach(notification => {
      if (!notification.read) {
        markNotificationAsRead(notification.id);
      }
    });
  }, [displayNotifications.length]);

  if (!currentUser) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'friend_request': return <UserPlus className="text-blue-500" size={18} />;
      case 'mention_post':
      case 'mention_comment': return <AtSign className="text-purple-500" size={18} />;
      case 'comment': return <MessageSquare className="text-green-500" size={18} />;
      case 'reaction': return <Heart className="text-red-500" size={18} fill="currentColor" />;
      case 'report_action_taken': return <ShieldAlert className="text-rose-500" size={18} />;
      default: return <Bell className="text-gray-500" size={18} />;
    }
  };

  const formatTime = (time: string) => {
    const date = new Date(time);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} د`;
    if (hours < 24) return `منذ ${hours} س`;
    return `منذ ${days} ي`;
  };

  const unreadCount = displayNotifications.filter(n => !n.read).length;

  // Render as a full interface if a report notification is selected (not a modal or backdrop)
  if (selectedReportActionNotif) {
    return (
      <ReportActionView
        notification={selectedReportActionNotif}
        onBack={() => setSelectedReportActionNotif(null)}
      />
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="min-h-screen p-3 sm:p-4 relative flex flex-col text-right dir-rtl font-sans bg-cover bg-center bg-no-repeat bg-fixed rounded-2xl md:rounded-3xl shadow-xl overflow-hidden"
      style={{
        backgroundImage: "url('/messenger_bg.jpg')",
      }}
    >
      {/* Notifications Header */}
      <div className="flex justify-between items-center mb-4 p-3.5 bg-slate-900/85 text-white rounded-2xl border border-white/15 shadow-lg">
        <div className="flex items-center gap-3">
          <div 
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md bg-cover bg-center border border-white/30 relative overflow-hidden"
            style={{ backgroundImage: "url('/messenger_bg.jpg')" }}
          >
            <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
              <Bell size={22} className="text-white drop-shadow-md" />
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">الإشعارات</h2>
            <p className="text-[11px] text-gray-300 font-medium">مركز التنبيهات المباشرة</p>
          </div>
        </div>

        {unreadCount > 0 ? (
          <span className="bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-md animate-pulse">
            {unreadCount} جديد
          </span>
        ) : (
          <span className="text-xs text-gray-300 font-medium bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
            محدث
          </span>
        )}
      </div>

      <div className="space-y-2">
        {displayNotifications.length > 0 ? (
          displayNotifications.map((notification, nIdx) => (
            <motion.div 
              key={notification.id ? `notif-${notification.id}-${nIdx}` : `notif-idx-${nIdx}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-start gap-3 p-3.5 rounded-2xl transition-all cursor-pointer shadow-md border ${
                notification.read 
                  ? 'bg-slate-900/80 text-gray-100 border-white/10 hover:bg-slate-900/90' 
                  : 'bg-slate-900/95 text-white border-2 border-blue-500/80 ring-2 ring-blue-500/20 shadow-xl hover:bg-slate-900'
              }`}
              onClick={() => {
                if (notification.type === 'report_action_taken') {
                  setSelectedReportActionNotif(notification);
                  if (!notification.read) markNotificationAsRead(notification.id);
                  return;
                }
                if (notification.targetId) {
                  if (notification.type === 'friend_request') {
                    setCurrentView('profile', notification.fromId);
                  } else {
                    setCurrentView('home'); // Or a specific post view if implemented
                  }
                }
                if (!notification.read) markNotificationAsRead(notification.id);
              }}
            >
              <div className="relative">
                <img 
                  src={notification.type === 'report_action_taken' ? (notification.metadata?.reportedUserAvatar || notification.fromAvatar) : notification.fromAvatar} 
                  alt={notification.fromName} 
                  className={`w-14 h-14 rounded-full object-cover ring-2 ${notification.type === 'report_action_taken' ? 'ring-rose-500/50 grayscale-[30%]' : 'ring-white/20'}`}
                  referrerPolicy="no-referrer"
                />
                <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-full shadow-md border ${
                  notification.type === 'report_action_taken' ? 'bg-rose-950 border-rose-500/60' : 'bg-slate-800 border-white/20'
                }`}>
                  {getIcon(notification.type)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="text-[15px] leading-tight text-gray-100">
                      <span className="font-bold text-white">{notification.fromName}</span>
                      {' '}{notification.text}
                    </p>
                    {notification.type === 'report_action_taken' && (
                      <span className="text-[11px] text-rose-300 font-bold bg-rose-500/20 px-2 py-0.5 rounded-md border border-rose-500/30 inline-flex items-center gap-1 mt-1">
                        ⚠️ انقر لعرض تفاصيل إزالة الحساب
                      </span>
                    )}
                  </div>
                  {!notification.read && (
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1.5 shrink-0 shadow-xs shadow-blue-400"></div>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1 font-medium">{formatTime(notification.time)}</p>
                
                {notification.type === 'friend_request' && !notification.read && (
                  <div className="flex gap-2 mt-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        acceptFriendRequest(notification.fromId);
                      }}
                      className="flex-1 bg-blue-600 text-white py-1.5 px-3 rounded-xl font-bold hover:bg-blue-500 transition-colors text-sm shadow-md active:scale-95"
                    >
                      تأكيد
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        declineFriendRequest(notification.fromId);
                      }}
                      className="flex-1 bg-white/15 text-gray-200 py-1.5 px-3 rounded-xl font-bold hover:bg-white/25 transition-colors text-sm border border-white/10 active:scale-95"
                    >
                      حذف
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-slate-900/80 rounded-2xl border border-white/15 text-white shadow-xl text-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-cover bg-center border border-white/30 shadow-md relative overflow-hidden"
              style={{ backgroundImage: "url('/messenger_bg.jpg')" }}
            >
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                <Bell size={32} className="text-white drop-shadow" />
              </div>
            </div>
            <p className="text-base font-bold text-white mb-1">ليس لديك إشعارات جديدة حالياً</p>
            <p className="text-xs text-gray-300">ستظهر هنا جميع التنبيهات والطلبات فور وصولها</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
