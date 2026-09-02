'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, User, Menu, X, Info, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/js/core/SupabaseClient';
import { useAuthStore } from '@/js/store/authStore';
import { useNotificationStore } from '@/js/store/notificationStore';
import NotificationService from '@/js/services/NotificationService';
import AuthService from '@/js/services/AuthService';

interface NavLink {
  page: string;
  label: string;
  isBtn?: boolean;
  extraClass?: string;
}

const NAV_LINKS: Record<string, NavLink[]> = {
  admin_pusat: [
    { page: '/distribusi', label: 'Dashboard Logistik' },
    { page: '/menu', label: 'Menu Makanan' },
    { page: '/vehicles', label: 'Vehicle Tracker' },
    { page: '/help', label: 'Bantuan' }
  ],
  admin_sekolah: [
    { page: '/distribusi', label: 'Dashboard Logistik' },
    { page: '/registrasi-sekolah', label: 'Registrasi' },
    { page: '/vehicles', label: 'Vehicle Tracker' },
    { page: '/feedback', label: 'Umpan Balik' },
    { page: '/help', label: 'Bantuan' }
  ],
  user_umum: [
    { page: '/vehicles', label: 'Vehicle Tracker' },
    { page: '/feedback', label: 'Umpan Balik' },
    { page: '/help', label: 'Bantuan' }
  ],
  guest: [
    { page: '/feedback', label: 'Umpan Balik' },
    { page: '/login', label: 'Masuk', isBtn: true, extraClass: 'login-btn' },
    { page: '/signup', label: 'Daftar', isBtn: true, extraClass: 'signup-btn' }
  ]
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { currentUser, isInitialized } = useAuthStore();
  const { notifications, unreadCount } = useNotificationStore();

  // Initialize and Subscribe
  useEffect(() => {
    if (!currentUser) return;

    // Initial fetch
    NotificationService.fetchNotifications(currentUser.id);

    // Real-time subscription
    const channel = NotificationService.subscribeToNotifications(currentUser.id);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // Handle opening notif icon
  const handleNotifClick = () => {
    setIsNotifOpen(!isNotifOpen);
    // Auto-clear visual indicator if there are unread items
    if (!isNotifOpen && unreadCount > 0 && currentUser) {
      NotificationService.markAllAsRead(currentUser.id);
    }
  };

  // Handle click on specific notif
  const handleItemClick = (notif: any) => {
    setIsNotifOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  // Close notif when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const role = !isInitialized ? 'loading' : currentUser?.role || 'guest';
  const links = role === 'loading' ? [] : (NAV_LINKS[role as keyof typeof NAV_LINKS] || NAV_LINKS.guest);

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <>
      <nav className="immersive-nav">
        <Link href="/" className="nav-logo">
          <img src="/Assets/logo.png" alt="GiziKita Logo" style={{ width: 42, height: 42 }} />
          <span className="logo-text">Gizi<br/>Kita</span>
        </Link>

        <div className="nav-right-container">
          <ul className="nav-links desktop-only">
            {links.map((link) => (
              <li key={link.page}>
                <Link 
                  href={link.page} 
                  className={`nav-link-item ${link.extraClass || ''} ${isActive(link.page) ? 'active' : ''}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {currentUser ? (
            <div className="nav-icons-wrapper" ref={notifRef}>
              <div 
                className={`nav-icon-btn ${isNotifOpen ? 'active' : ''}`} 
                id="nav-notif-icon"
                onClick={handleNotifClick}
              >
                <Bell size={20} />
                {unreadCount > 0 && <span className="notif-dot"></span>}

                {isNotifOpen && (
                  <div className="notif-dropdown">
                    <div className="notif-header">
                      <h3>Notifikasi</h3>
                      <span>{notifications.length} Total</span>
                    </div>
                    <div className="notif-list">
                      {notifications.length > 0 ? (
                        notifications.map(n => (
                          <div key={n.id} className="notif-item" onClick={() => handleItemClick(n)}>
                            <div className="notif-icon-circle">
                              <Info size={14} />
                            </div>
                            <div className="notif-content">
                              <div className="notif-title-row">
                                <strong>{n.title}</strong>
                                <span>{new Date(n.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p>{n.message}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                          Belum ada notifikasi baru
                        </div>
                      )}
                    </div>
                    <div className="notif-footer" onClick={(e) => {
                      e.stopPropagation();
                      if (currentUser) NotificationService.markAllAsRead(currentUser.id);
                      setIsNotifOpen(false);
                    }}>
                      Tandai semua telah dibaca
                    </div>
                  </div>
                )}
              </div>
              <Link href="/profil" className="nav-icon-btn profile-btn">
                <User size={18} />
              </Link>
              <button className="nav-icon-btn" type="button" onClick={() => AuthService.logout()} aria-label="Keluar">
                <LogOut size={18} />
              </button>
            </div>
          ) : null}

          <div className="hamburger-btn mobile-only" onClick={toggleMobileMenu}>
             <Menu size={28} color="var(--maroon)" />
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-panel">
            <div className="mobile-menu-header">
              <span className="mobile-menu-title">Menu</span>
              <div className="close-menu-btn" onClick={toggleMobileMenu}>
                  <X size={28} color="var(--maroon)" />
              </div>
            </div>
            <ul className="mobile-nav-links">
              {links.map((link) => (
                <li key={link.page}>
                  <Link 
                    href={link.page} 
                    className={`nav-link-item ${link.extraClass || ''} ${isActive(link.page) ? 'active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
      </div>
    </>
  );
}
