'use client';

/**
 * Navbar Component
 * Responsive navigation with auth state, notifications bell, and mobile menu
 */
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Menu, X, Bell, ChevronDown, LogOut, User, LayoutDashboard,
  History, Settings, Shield
} from 'lucide-react';
import { notificationService } from '@/services/notification.service';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, isOrganization, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  // Track scroll for navbar background
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch unread notification count
  useEffect(() => {
    if (isAuthenticated) {
      const fetchUnread = async () => {
        try {
          const res = await notificationService.getAll({ unread_only: 'true' });
          setUnreadCount(res.data.data.unreadCount);
        } catch (e) { /* silent */ }
      };
      fetchUnread();
      const interval = setInterval(fetchUnread, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Close menus when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
  }, [pathname]);

  const isAdminPage = pathname?.startsWith('/admin');
  const isOrgPage = pathname?.startsWith('/org');

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/locations', label: 'Locations' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || isAdminPage
          ? 'bg-white/90 backdrop-blur-lg shadow-md'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4F6AF6] to-[#3B50D5] flex items-center justify-center shadow-lg shadow-blue-200 group-hover:shadow-blue-300 transition-shadow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <path d="M9 14l2 2 4-4" />
              </svg>
            </div>
            <span className="text-xl font-bold">
              <span className="text-[var(--primary)]">Smart</span>
              <span className="text-[var(--secondary)]">Queue</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === link.href
                    ? 'text-[var(--primary)] bg-[var(--primary-50)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Notifications Bell */}
                <Link
                  href="/notifications"
                  className="relative p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--primary-50)] transition-all"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F6AF6] to-[#7B93FF] flex items-center justify-center text-white text-sm font-bold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-[var(--text-primary)] max-w-[120px] truncate">
                      {user?.name}
                    </span>
                    <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-2 animate-fade-in">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">{user?.name}</p>
                          <p className="text-xs text-[var(--text-muted)]">{user?.email}</p>
                          {isAdmin && (
                            <span className="badge badge-active mt-1 text-[10px]">Admin</span>
                          )}
                        </div>
                        <Link
                          href={isOrganization ? "/org/dashboard" : "/dashboard"}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-gray-50 hover:text-[var(--primary)] transition-colors"
                        >
                          <LayoutDashboard size={16} /> Dashboard
                        </Link>
                        {!isOrganization && (
                          <Link href="/history" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-gray-50 hover:text-[var(--primary)] transition-colors">
                            <History size={16} /> Booking History
                          </Link>
                        )}
                        {isAdmin && (
                          <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-gray-50 hover:text-[var(--primary)] transition-colors">
                            <Shield size={16} /> Admin Panel
                          </Link>
                        )}
                        <hr className="my-1 border-gray-100" />
                        <button
                          onClick={logout}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors w-full"
                        >
                          <LogOut size={16} /> Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-5 py-2 text-sm font-semibold text-[var(--primary)] border-2 border-[var(--primary)] rounded-xl hover:bg-[var(--primary-50)] transition-all"
                >
                  Login
                </Link>
                <Link
                  href="/org/register"
                  className="px-5 py-2 text-sm font-semibold text-[var(--text-secondary)] border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                >
                  Provider Sign Up
                </Link>
                <Link
                  href="/register"
                  className="btn-primary text-sm !py-2.5 !px-5"
                >
                  Get Token
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:bg-gray-100 transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg animate-fade-in">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-[var(--primary)] bg-[var(--primary-50)]'
                    : 'text-[var(--text-secondary)] hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link href={isOrganization ? "/org/dashboard" : "/dashboard"} className="block px-4 py-3 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-gray-50">
                  Dashboard
                </Link>
                {!isOrganization && (
                  <Link href="/history" className="block px-4 py-3 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-gray-50">
                    History
                  </Link>
                )}
                {isAdmin && (
                  <Link href="/admin" className="block px-4 py-3 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-gray-50">
                    Admin Panel
                  </Link>
                )}
                <button onClick={logout} className="block w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50">
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-3 pt-3 border-t border-gray-100">
                <Link href="/login" className="flex-1 text-center px-4 py-2.5 text-sm font-semibold text-[var(--primary)] border-2 border-[var(--primary)] rounded-xl">
                  Login
                </Link>
                <Link href="/org/register" className="flex-1 text-center px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] border-2 border-gray-200 rounded-xl">
                  Provider
                </Link>
                <Link href="/register" className="flex-1 text-center btn-primary text-sm !py-2.5">
                  Get Token
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
