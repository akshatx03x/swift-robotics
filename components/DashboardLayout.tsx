'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Tag,
  Target,
  Rss,
  Settings,
  Database,
  Sparkles,
  Menu,
  X,
  TrendingUp,
  Globe,
  Radio
} from 'lucide-react';
import { isSupabaseConfigured, db } from '../services/db';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [geminiConfigured, setGeminiConfigured] = useState(false);
  const [country, setCountry] = useState('USA');

  useEffect(() => {
    // Check configuration statuses
    setSupabaseConnected(isSupabaseConfigured());
    
    // Check local storage overrides too
    const checkSettings = () => {
      setGeminiConfigured(!!db.getGeminiKey() || !!process.env.NEXT_PUBLIC_GEMINI_API_KEY);
      setCountry(db.getCountry());
    };
    
    checkSettings();
    // Listen for storage events (if user changes settings in another tab/page)
    window.addEventListener('storage', checkSettings);
    // Also poll slightly for settings update
    const interval = setInterval(checkSettings, 2000);
    
    return () => {
      window.removeEventListener('storage', checkSettings);
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Topics', href: '/topics', icon: Tag },
    { name: 'Competitors', href: '/competitors', icon: Target },
    { name: 'Sources', href: '/sources', icon: Rss },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* 1. DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-zinc-800/60 p-5 flex-shrink-0">
        <div className="flex items-center gap-3 px-2 py-3 mb-8">
          <div className="bg-violet-600 p-2 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Radio className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <span className="font-bold text-lg bg-gradient-to-r from-violet-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
              FashionPulse
            </span>
            <span className="text-xs block text-zinc-500 font-semibold tracking-wider">
              AI MONITORING
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-250 font-medium text-sm group ${
                  isActive
                    ? 'bg-violet-600/15 text-violet-400 border-l-4 border-violet-500 pl-3'
                    : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-300 ${
                  isActive ? 'text-violet-400 scale-110' : 'text-zinc-400 group-hover:scale-105'
                }`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Dynamic status widgets */}
        <div className="mt-auto space-y-3 pt-6 border-t border-zinc-800/50">
          {/* Country indicator */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900/40 border border-zinc-800/40 text-xs">
            <span className="text-zinc-500 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" /> Region
            </span>
            <span className="font-semibold text-zinc-300 bg-zinc-800/80 px-2 py-0.5 rounded">
              {country}
            </span>
          </div>

          {/* Database status */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900/40 border border-zinc-800/40 text-xs">
            <span className="text-zinc-500 flex items-center gap-1">
              <Database className="w-3.5 h-3.5" /> Database
            </span>
            {supabaseConnected ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                Supabase
              </span>
            ) : (
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Local Mode
              </span>
            )}
          </div>

          {/* AI engine status */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900/40 border border-zinc-800/40 text-xs">
            <span className="text-zinc-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> AI Engine
            </span>
            {geminiConfigured ? (
              <span className="text-violet-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"></span>
                Gemini AI
              </span>
            ) : (
              <span className="text-zinc-400 font-semibold">
                Simulated
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* 2. MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/60 backdrop-blur-sm">
          <div className="w-64 bg-zinc-950 border-r border-zinc-800 p-5 flex flex-col animate-in slide-in-from-left duration-250">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-violet-600 p-1.5 rounded-lg flex items-center justify-center">
                  <Radio className="w-5 h-5 text-white animate-pulse" />
                </div>
                <span className="font-bold text-base bg-gradient-to-r from-violet-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                  FashionPulse
                </span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                      isActive
                        ? 'bg-violet-600/15 text-violet-400 border-l-4 border-violet-500 pl-3'
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="space-y-2 mt-auto pt-4 border-t border-zinc-800/50">
              <div className="flex justify-between items-center text-xs px-2 py-1">
                <span className="text-zinc-500">Region:</span>
                <span className="text-zinc-300 font-semibold">{country}</span>
              </div>
              <div className="flex justify-between items-center text-xs px-2 py-1">
                <span className="text-zinc-500">Database:</span>
                <span className={supabaseConnected ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
                  {supabaseConnected ? "Supabase" : "Local Mode"}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs px-2 py-1">
                <span className="text-zinc-500">AI Engine:</span>
                <span className={geminiConfigured ? "text-violet-400 font-semibold" : "text-zinc-400"}>
                  {geminiConfigured ? "Gemini AI" : "Simulated"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex md:hidden items-center justify-between bg-zinc-950/80 border-b border-zinc-800/50 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-900 focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold bg-gradient-to-r from-violet-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
              FashionPulse
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${supabaseConnected ? "bg-emerald-500 animate-ping" : "bg-amber-500"}`} />
            <span className="text-xs text-zinc-400">{supabaseConnected ? "Cloud" : "Local"}</span>
          </div>
        </header>

        {/* Scrollable Content Container */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 bg-[#09090b]">
          {children}
        </main>
      </div>
    </div>
  );
}
