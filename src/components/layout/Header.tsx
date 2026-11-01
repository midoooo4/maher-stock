'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import { stockService } from '@/lib/db/stock-service';
import { 
  Bell, 
  Globe, 
  LogOut, 
  User, 
  ChevronDown, 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { language, toggleLanguage, t } = useTranslation();
  const { user, role, logout, switchUser, allUsers } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = user ? stockService.getNotifications(user.role, user.id) : [];
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm h-16">
      <div className="px-4 sm:px-6 h-full flex items-center justify-between">
        
        {/* Left: Mobile hamburger & Logo Branding */}
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 focus:outline-none"
              aria-label="Toggle Navigation"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-white shadow-sm border border-amber-100 flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Complexe Maher"
                fill
                className="object-contain p-0.5"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-base text-brand-navy tracking-tight leading-none">
                  MAHER STOCK
                </h1>
                <span className="text-[10px] bg-brand-orange/15 text-brand-orange font-bold px-1.5 py-0.5 rounded-full">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium hidden sm:block leading-none mt-1">
                COMPLEXE MAHER – RESTAURANT ET PISCINE
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions (Language toggle, Demo Role Switcher, Notifications, User) */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Language Toggle Button */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-brand-navy hover:bg-gray-50 transition-colors"
            title="Changer de langue / تغيير اللغة"
          >
            <Globe className="w-3.5 h-3.5 text-brand-turquoise" />
            <span>{language === 'fr' ? 'العربية' : 'Français'}</span>
          </button>

          {/* Quick Demo Switcher (Helps verify all 3 personas instantly) */}
          <div className="relative hidden md:block">
            <select
              value={user?.id || ''}
              onChange={(e) => {
                const target = allUsers.find(u => u.id === e.target.value);
                if (target) switchUser(target);
              }}
              className="text-xs bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-orange cursor-pointer"
            >
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.role === 'ADMIN' ? '👑 ' : u.role === 'RESPONSABLE' ? '🔑 ' : '👤 '}
                  {u.full_name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none"
              title={t('nav_notifications')}
            >
              <Bell className="w-5 h-5 text-brand-navy" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-brand-orange text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-dropdown border border-gray-100 z-50 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-brand-navy uppercase tracking-wider">
                    {t('nav_notifications')} ({unreadCount} non lues)
                  </h4>
                  <button
                    onClick={() => {
                      notifications.forEach(n => stockService.markNotificationAsRead(n.id));
                      setShowNotifications(false);
                    }}
                    className="text-[11px] text-brand-orange hover:underline font-medium"
                  >
                    Tout marquer comme lu
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-400">
                      Aucune notification
                    </div>
                  ) : (
                    notifications.slice(0, 6).map((n) => (
                      <div
                        key={n.id}
                        className={`p-3.5 text-xs transition-colors hover:bg-gray-50 ${
                          !n.is_read ? 'bg-amber-50/50' : ''
                        }`}
                        onClick={() => {
                          stockService.markNotificationAsRead(n.id);
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <span className="w-2 h-2 mt-1 rounded-full bg-brand-orange flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-brand-navy">
                              {language === 'ar' ? n.title_ar : n.title_fr}
                            </p>
                            <p className="text-gray-600 text-[11px] mt-0.5">
                              {language === 'ar' ? n.message_ar : n.message_fr}
                            </p>
                            <span className="text-[10px] text-gray-400 mt-1 block">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-brand-navy text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden lg:block leading-tight">
                <p className="text-xs font-semibold text-brand-navy truncate max-w-[120px]">
                  {user?.full_name || 'Utilisateur'}
                </p>
                <p className="text-[10px] text-brand-orange font-bold uppercase">
                  {user?.role || 'Guest'}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden lg:block" />
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-dropdown border border-gray-100 z-50 p-2">
                <div className="px-3 py-2 border-b border-gray-100 mb-1">
                  <p className="text-xs font-bold text-brand-navy">{user?.full_name}</p>
                  <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
                  {user?.department && (
                    <span className="inline-block mt-1 text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                      Service: {user.department}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
