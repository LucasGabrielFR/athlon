'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, BellRing } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { markNotificationAsReadAction, markAllNotificationsAsReadAction } from '@/app/actions/notifications';
import { useRouter } from 'next/navigation';

export type NotificationType = {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date | null;
};

export function NotificationBell({ initialNotifications }: { initialNotifications: NotificationType[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    await markAllNotificationsAsReadAction();
  };

  const handleNotificationClick = async (notif: NotificationType) => {
    if (!notif.isRead) {
      setNotifications(notifications.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      await markNotificationAsReadAction(notif.id);
    }
    setIsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-ice/60 hover:text-ice transition-colors rounded-full hover:bg-azure/10"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5 animate-pulse text-amber-400" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
        
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-navy border border-azure/20 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            <div className="flex items-center justify-between p-4 border-b border-azure/10 bg-slate-dark/50">
              <h3 className="text-ice font-semibold">Notificações</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllRead}
                  className="text-xs text-azure hover:text-ice transition-colors flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Marcar todas como lidas
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-ice/40 text-sm">
                  Nenhuma notificação por enquanto.
                </div>
              ) : (
                <div className="divide-y divide-azure/5">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-4 hover:bg-azure/5 transition-colors cursor-pointer flex flex-col gap-1 ${!notif.isRead ? 'bg-azure/5' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm font-semibold ${!notif.isRead ? 'text-ice' : 'text-ice/70'}`}>
                          {notif.title}
                        </span>
                        {!notif.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                        )}
                      </div>
                      <p className={`text-xs ${!notif.isRead ? 'text-ice/80' : 'text-ice/50'} line-clamp-2`}>
                        {notif.message}
                      </p>
                      {notif.createdAt && (
                        <span className="text-[10px] text-ice/30 mt-1">
                          {new Date(notif.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
