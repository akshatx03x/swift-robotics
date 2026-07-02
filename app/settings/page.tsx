'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useToast } from '../../components/Toast';
import { db, isSupabaseConfigured } from '../../services/db';
import { 
  Save, 
  Trash2, 
  Info, 
  Database, 
  Sparkles, 
  Globe2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function SettingsPage() {
  const { toast } = useToast();
  
  // Settings Form States
  const [country, setCountry] = useState('USA');
  const [geminiKey, setGeminiKey] = useState('');
  
  // Supabase Env Status
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [envSupabaseUrl, setEnvSupabaseUrl] = useState('');
  
  useEffect(() => {
    // Load current values
    setCountry(db.getCountry());
    setGeminiKey(db.getGeminiKey());
    setSupabaseConnected(isSupabaseConfigured());
    
    // Read env variable presence for UI guidance
    setEnvSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || '');
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      db.setCountry(country);
      db.setGeminiKey(geminiKey);
      
      // Dispatch storage event to notify layout immediately
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
      }
      
      toast('Settings saved successfully', 'success');
    } catch (e) {
      toast('Failed to save settings', 'error');
    }
  };

  const handleClearDatabase = async () => {
    if (!confirm('Are you sure you want to delete all fetched articles from the dashboard? This cannot be undone.')) return;
    try {
      await db.clearArticles();
      toast('Dashboard articles cleared', 'success');
    } catch (e) {
      toast('Failed to clear articles', 'error');
    }
  };

  const countries = ['India', 'USA', 'UK', 'Germany', 'China'];

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            System Settings
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Configure target country settings, AI intelligence engines, and database configurations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Settings Form */}
          <div className="md:col-span-2 space-y-6">
            <form onSubmit={handleSaveSettings} className="glass-panel p-6 rounded-2xl border border-zinc-800/60 shadow-lg space-y-5">
              <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-violet-400" /> General Settings
              </h3>

              {/* Country Selection */}
              <div className="space-y-2">
                <label className="text-xs text-zinc-400 font-semibold block">Target Monitored Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:border-violet-500 focus:outline-none transition cursor-pointer"
                >
                  {countries.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <p className="text-zinc-500 text-xxs">
                  Fetches economic & consumer updates tailored to this region when clicking "Fetch Latest News".
                </p>
              </div>

              {/* Gemini API Key */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-zinc-400 font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Gemini API Key
                  </label>
                  {geminiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY ? (
                    <span className="text-xxs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Configured
                    </span>
                  ) : (
                    <span className="text-xxs text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Simulating Analyst
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  placeholder="Enter Gemini API Key..."
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:border-violet-500 focus:outline-none transition"
                />
                <p className="text-zinc-500 text-xxs">
                  If left empty, a mock AI agent analyzer simulates responses using configured active topics & competitors.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm py-2.5 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Save Configurations
              </button>
            </form>

            {/* Database Admin Operations Card */}
            <div className="glass-panel p-6 rounded-2xl border border-zinc-800/60 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-zinc-350 uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-pink-400" /> Database Maintenance
              </h3>
              <p className="text-zinc-400 text-xs">
                Clear cached articles stored on the active database client to reset dashboard stats.
              </p>
              <button
                onClick={handleClearDatabase}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-medium text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Delete All Saved Articles
              </button>
            </div>
          </div>

          {/* Configuration Status Sidebar */}
          <div className="space-y-6">
            <div className="glass-panel p-5 rounded-2xl border border-zinc-800/60 shadow-lg space-y-4">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Connection Logs</h4>
              
              {/* Database status details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-semibold">Active Database</span>
                  {supabaseConnected ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Supabase
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" /> Local Fallback
                    </span>
                  )}
                </div>
                <div className="p-3 bg-zinc-950/60 border border-zinc-900 rounded-xl text-xxs text-zinc-500 leading-normal">
                  {supabaseConnected ? (
                    <span>Connected to cloud instance: <br/><code className="text-zinc-400 font-mono select-all text-[10px] break-all">{envSupabaseUrl}</code></span>
                  ) : (
                    <span>No Supabase variables set. Topics, competitors, and sources CRUD is falling back to browser LocalStorage.</span>
                  )}
                </div>
              </div>

              {/* AI engine status details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-semibold">AI Processor</span>
                  {geminiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY ? (
                    <span className="text-violet-400 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Gemini Enabled
                    </span>
                  ) : (
                    <span className="text-zinc-400 flex items-center gap-1">
                      Simulated
                    </span>
                  )}
                </div>
                <div className="p-3 bg-zinc-950/60 border border-zinc-900 rounded-xl text-xxs text-zinc-500 leading-normal">
                  {geminiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY ? (
                    <span>Connecting to <code className="text-zinc-400">gemini-1.5-flash</code> for live news parsing and industry relevance categorization.</span>
                  ) : (
                    <span>Using deterministic pattern-matching and a pre-defined LLM template response generator to mock fashion insights.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Hint alert */}
            <div className="bg-violet-600/10 border border-violet-500/20 p-4 rounded-2xl flex gap-3 text-xs text-violet-300">
              <Info className="w-5 h-5 flex-shrink-0 text-violet-400 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">Deployment Tip</span>
                To lock cloud database values in production, define <code className="bg-zinc-900 text-violet-400 px-1 py-0.5 rounded font-mono text-xxs">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="bg-zinc-900 text-violet-400 px-1 py-0.5 rounded font-mono text-xxs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in your environment parameters.
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
