'use client';

/**
 * Footer Component
 * Professional footer with links, contact info, and social icons
 */
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Globe, ExternalLink, Users } from 'lucide-react';

export default function Footer() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    // Set after mount to avoid SSR/client render mismatches.
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-[#1E293B] text-gray-300">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4F6AF6] to-[#3B50D5] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  <path d="M9 14l2 2 4-4" />
                </svg>
              </div>
              <span className="text-xl font-bold">
                <span className="text-[#4F6AF6]">Smart</span>
                <span className="text-white">Queue</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Simplify your queue experience with our cutting-edge digital queue management system. 
              Book tokens remotely and skip long waiting lines.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 rounded-lg bg-gray-700 hover:bg-[#4F6AF6] flex items-center justify-center transition-all duration-300">
                <Globe size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-gray-700 hover:bg-[#4F6AF6] flex items-center justify-center transition-all duration-300">
                <ExternalLink size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-gray-700 hover:bg-[#4F6AF6] flex items-center justify-center transition-all duration-300">
                <Users size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {[
                { href: '/', label: 'Home' },
                { href: '/locations', label: 'Find Locations' },
                { href: '/about', label: 'About Us' },
                { href: '/contact', label: 'Contact' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-[#4F6AF6] transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h3 className="text-white font-semibold mb-4">Solutions</h3>
            <ul className="space-y-3">
              {[
                'Hospital Queue',
                'Clinic Management',
                'Bank Queue',
                'Government Offices',
                'API Integration',
              ].map(item => (
                <li key={item}>
                  <span className="text-sm text-gray-400 hover:text-[#4F6AF6] transition-colors duration-200 cursor-pointer">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Mail size={16} className="text-[#4F6AF6] mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-400">contact@smartqueue.com</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={16} className="text-[#4F6AF6] mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-400">+91 98765 43210</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-[#4F6AF6] mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-400">123 Startup Lane, Tech Park,<br />Bangalore, India</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-500">
            © {year ?? ''} SmartQueue. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-xs text-gray-500 hover:text-gray-400 transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs text-gray-500 hover:text-gray-400 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
