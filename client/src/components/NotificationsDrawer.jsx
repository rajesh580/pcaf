import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { Bell, X, CheckCheck, Info, CheckCircle2, AlertTriangle, Radio } from 'lucide-react';

export default function NotificationsDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('ALL');

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.warn('Could not fetch notifications:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    const unreadList = notifications.filter((n) => !n.isRead);
    for (const n of unreadList) {
      try {
        await api.patch(`/notifications/${n.id}/read`);
      } catch (e) {
        // ignore individual fail
      }
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const filteredList = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.isRead;
    return true;
  });

  const getIcon = (event = '', title = '') => {
    if (event.includes('SELECTED') || event.includes('ACCEPTED')) {
      return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
    }
    if (event.includes('REJECTED') || title.toLowerCase().includes('alert')) {
      return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
    }
    if (event.includes('BROADCAST') || title.toLowerCase().includes('announcement')) {
      return <Radio className="w-4 h-4 text-blue-600 shrink-0" />;
    }
    return <Info className="w-4 h-4 text-indigo-600 shrink-0" />;
  };

  return (
    <>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          fetchNotifications();
        }}
        className="relative p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition"
        title="Notifications"
        aria-label={`Notifications, ${unreadCount} unread`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-slate-900 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Slide-Over Drawer backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm transition-opacity">
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

          <aside className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
              
              {/* Header */}
              <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <Bell className="w-5 h-5 text-blue-400" />
                  <div>
                    <h2 className="text-base font-bold">Notifications</h2>
                    <p className="text-[11px] text-slate-400">
                      {unreadCount} unread update{unreadCount === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold hover:underline"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Read all
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex gap-2">
                <button
                  type="button"
                  onClick={() => setFilter('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    filter === 'ALL'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('UNREAD')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    filter === 'UNREAD'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              {/* Notification List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredList.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 dark:text-slate-500 space-y-2">
                    <Bell className="w-8 h-8 mx-auto opacity-30" />
                    <p className="text-xs font-medium">No notifications to display</p>
                  </div>
                ) : (
                  filteredList.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => !notif.isRead && markAsRead(notif.id)}
                      className={`p-4 rounded-xl border transition cursor-pointer relative ${
                        notif.isRead
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80'
                          : 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {getIcon(notif.event, notif.title)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {notif.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {notif.body}
                          </p>
                        </div>
                      </div>
                      {!notif.isRead && (
                        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[11px] text-slate-400">
                  PFAC Real-Time Dispatch System
                </span>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
