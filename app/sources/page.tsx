'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useToast } from '../../components/Toast';
import { db, NewsSource } from '../../services/db';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Rss, 
  Loader2,
  AlertCircle,
  Link as LinkIcon
} from 'lucide-react';

export default function SourcesPage() {
  const { toast } = useToast();
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // New source form fields
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingUrl, setEditingUrl] = useState('');
  const [editingPriority, setEditingPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    setLoading(true);
    try {
      const data = await db.getSources();
      setSources(data);
    } catch (e) {
      toast('Failed to load news sources', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUrl.trim()) return;

    setSubmitting(true);
    try {
      const trimmedName = newName.trim();
      const trimmedUrl = newUrl.trim();

      // Prevent URL duplicates
      if (sources.some(s => s.url.toLowerCase() === trimmedUrl.toLowerCase())) {
        toast('A news source with this URL already exists', 'warning');
        setSubmitting(false);
        return;
      }

      const added = await db.addSource(trimmedName, trimmedUrl, newPriority);
      setSources(prev => [...prev, added]);
      
      // Reset form
      setNewName('');
      setNewUrl('');
      setNewPriority('Medium');
      
      toast(`Added news source "${trimmedName}"`, 'success');
    } catch (e) {
      toast('Failed to add news source', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleSource = async (id: string, enabled: boolean) => {
    try {
      await db.updateSource(id, { enabled });
      setSources(prev => prev.map(s => s.id === id ? { ...s, enabled } : s));
      const source = sources.find(s => s.id === id);
      toast(
        `Source "${source?.name}" is now ${enabled ? 'enabled' : 'disabled'}`, 
        enabled ? 'success' : 'info'
      );
    } catch (e) {
      toast('Failed to update news source', 'error');
    }
  };

  const handleStartEdit = (source: NewsSource) => {
    setEditingId(source.id);
    setEditingName(source.name);
    setEditingUrl(source.url);
    setEditingPriority(source.priority);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingName.trim() || !editingUrl.trim()) return;
    try {
      const trimmedName = editingName.trim();
      const trimmedUrl = editingUrl.trim();

      if (sources.some(s => s.id !== id && s.url.toLowerCase() === trimmedUrl.toLowerCase())) {
        toast('Another source with this URL already exists', 'warning');
        return;
      }

      await db.updateSource(id, {
        name: trimmedName,
        url: trimmedUrl,
        priority: editingPriority,
      });

      setSources(prev => prev.map(s => s.id === id ? { 
        ...s, 
        name: trimmedName, 
        url: trimmedUrl, 
        priority: editingPriority 
      } : s));
      
      setEditingId(null);
      toast('News source updated successfully', 'success');
    } catch (e) {
      toast('Failed to edit news source', 'error');
    }
  };

  const handleDeleteSource = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete news source "${name}"?`)) return;
    try {
      await db.deleteSource(id);
      setSources(prev => prev.filter(s => s.id !== id));
      toast(`Deleted news source "${name}"`, 'success');
    } catch (e) {
      toast('Failed to delete news source', 'error');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              News Sources & RSS Feeds
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Configure endpoints the agent fetches news articles from during execution.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-zinc-800/40">
            <Rss className="w-3.5 h-3.5" />
            <span>Active Sources: {sources.filter(s => s.enabled).length}</span>
          </div>
        </div>

        {/* Add Source Form */}
        <form onSubmit={handleAddSource} className="glass-panel p-5 rounded-2xl border border-zinc-800/60 shadow-lg shadow-black/10 space-y-4">
          <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Add New Source</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-500 font-medium">Source Name</label>
              <input
                type="text"
                placeholder="Google News RSS, GNews API, etc."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm focus:border-violet-500 focus:outline-none transition"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-500 font-medium">Feed or API URL</label>
              <input
                type="text"
                placeholder="https://news.google.com/rss/..."
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm focus:border-violet-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500 font-medium">Fetch Priority:</span>
              <div className="flex items-center gap-1.5">
                {(['High', 'Medium', 'Low'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNewPriority(p)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      newPriority === p
                        ? 'bg-violet-600/10 border-violet-500 text-violet-400'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !newName.trim() || !newUrl.trim()}
              className="bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add Source
            </button>
          </div>
        </form>

        {/* List of Sources */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            <p className="text-zinc-500 text-sm">Loading news sources...</p>
          </div>
        ) : sources.length === 0 ? (
          <div className="glass-card p-12 rounded-2xl text-center flex flex-col items-center justify-center gap-3">
            <AlertCircle className="w-10 h-10 text-zinc-600" />
            <h3 className="text-lg font-bold text-zinc-300">No sources configured</h3>
            <p className="text-zinc-500 text-sm max-w-sm">
              Create a custom RSS feed URL to fetch fashion industry updates.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sources.map((source) => (
              <div
                key={source.id}
                className={`glass-card p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 ${
                  source.enabled 
                    ? 'border-zinc-800/80 hover:border-violet-500/30' 
                    : 'border-zinc-900/40 opacity-60'
                }`}
              >
                {/* Info Area */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  {editingId === source.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:border-violet-500"
                          placeholder="Source Name"
                        />
                        <input
                          type="text"
                          value={editingUrl}
                          onChange={(e) => setEditingUrl(e.target.value)}
                          className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:border-violet-500"
                          placeholder="URL"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-zinc-500">Priority:</span>
                          {(['High', 'Medium', 'Low'] as const).map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setEditingPriority(p)}
                              className={`px-2 py-0.5 rounded text-xxs font-semibold border transition ${
                                editingPriority === p
                                  ? 'bg-violet-600/10 border-violet-500 text-violet-400'
                                  : 'bg-zinc-900 border-zinc-850 text-zinc-400'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSaveEdit(source.id)}
                            className="p-1 text-emerald-400 hover:bg-zinc-850 rounded"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 text-zinc-500 hover:bg-zinc-850 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-zinc-200 text-base">{source.name}</span>
                        {/* Priority Badge */}
                        <span className={`px-2 py-0.5 rounded text-xxs font-bold ${
                          source.priority === 'High'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : source.priority === 'Medium'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {source.priority} Priority
                        </span>
                      </div>
                      <p className="text-zinc-500 text-xs flex items-center gap-1.5 mt-1 truncate">
                        <LinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{source.url}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Operations area */}
                {editingId !== source.id && (
                  <div className="flex items-center justify-end gap-2.5">
                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 font-medium">
                        {source.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <button
                        onClick={() => handleToggleSource(source.id, !source.enabled)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                          source.enabled ? 'bg-violet-600' : 'bg-zinc-850'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            source.enabled ? 'translate-x-4.5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Edit button */}
                    <button
                      onClick={() => handleStartEdit(source)}
                      className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition"
                      title="Edit Source"
                    >
                      <Edit3 className="w-4.5 h-4.5" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteSource(source.id, source.name)}
                      className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      title="Delete Source"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
