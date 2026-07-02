'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useToast } from '../../components/Toast';
import { db, Competitor } from '../../services/db';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Target, 
  Loader2,
  AlertCircle 
} from 'lucide-react';

export default function CompetitorsPage() {
  const { toast } = useToast();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCompName, setNewCompName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCompetitors();
  }, []);

  const fetchCompetitors = async () => {
    setLoading(true);
    try {
      const data = await db.getCompetitors();
      setCompetitors(data);
    } catch (e) {
      toast('Failed to load competitors', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName.trim()) return;

    setSubmitting(true);
    try {
      const trimmed = newCompName.trim();
      
      // Prevent duplicates
      if (competitors.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
        toast('Competitor already exists', 'warning');
        setSubmitting(false);
        return;
      }

      const added = await db.addCompetitor(trimmed);
      setCompetitors(prev => [...prev, added]);
      setNewCompName('');
      toast(`Added competitor "${trimmed}"`, 'success');
    } catch (e) {
      toast('Failed to add competitor', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleCompetitor = async (id: string, enabled: boolean) => {
    try {
      await db.updateCompetitor(id, { enabled });
      setCompetitors(prev => prev.map(c => c.id === id ? { ...c, enabled } : c));
      const comp = competitors.find(c => c.id === id);
      toast(
        `Competitor "${comp?.name}" is now ${enabled ? 'enabled' : 'disabled'}`, 
        enabled ? 'success' : 'info'
      );
    } catch (e) {
      toast('Failed to update competitor', 'error');
    }
  };

  const handleStartEdit = (competitor: Competitor) => {
    setEditingId(competitor.id);
    setEditingName(competitor.name);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      const trimmed = editingName.trim();
      if (competitors.some(c => c.id !== id && c.name.toLowerCase() === trimmed.toLowerCase())) {
        toast('Another competitor with this name already exists', 'warning');
        return;
      }
      await db.updateCompetitor(id, { name: trimmed });
      setCompetitors(prev => prev.map(c => c.id === id ? { ...c, name: trimmed } : c));
      setEditingId(null);
      toast('Competitor updated successfully', 'success');
    } catch (e) {
      toast('Failed to edit competitor', 'error');
    }
  };

  const handleDeleteCompetitor = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete competitor "${name}"?`)) return;
    try {
      await db.deleteCompetitor(id);
      setCompetitors(prev => prev.filter(c => c.id !== id));
      toast(`Deleted competitor "${name}"`, 'success');
    } catch (e) {
      toast('Failed to delete competitor', 'error');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Fashion Competitors
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Manage list of brand names the AI agent monitors within news articles.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-zinc-800/40">
            <Target className="w-3.5 h-3.5" />
            <span>Monitored Competitors: {competitors.filter(c => c.enabled).length}</span>
          </div>
        </div>

        {/* Add Competitor Form */}
        <form onSubmit={handleAddCompetitor} className="glass-panel p-5 rounded-2xl flex gap-3 border border-zinc-800/60 shadow-lg shadow-black/10">
          <input
            type="text"
            placeholder="Add brand name (e.g. Zara, Nike, Patagonia...)"
            value={newCompName}
            onChange={(e) => setNewCompName(e.target.value)}
            disabled={submitting}
            className="flex-1 px-4 py-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition"
          />
          <button
            type="submit"
            disabled={submitting || !newCompName.trim()}
            className="bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm px-5 py-3 rounded-xl flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Add
          </button>
        </form>

        {/* List of Competitors */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            <p className="text-zinc-500 text-sm">Loading competitors...</p>
          </div>
        ) : competitors.length === 0 ? (
          <div className="glass-card p-12 rounded-2xl text-center flex flex-col items-center justify-center gap-3">
            <AlertCircle className="w-10 h-10 text-zinc-600" />
            <h3 className="text-lg font-bold text-zinc-300">No competitors registered</h3>
            <p className="text-zinc-500 text-sm max-w-sm">
              Add major retail rivals or industry labels to trace mentions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {competitors.map((comp) => (
              <div
                key={comp.id}
                className={`glass-card p-4 rounded-xl border flex items-center justify-between gap-4 transition-all duration-200 ${
                  comp.enabled 
                    ? 'border-zinc-800/80 hover:border-violet-500/30' 
                    : 'border-zinc-900/40 opacity-60'
                }`}
              >
                <div className="flex-1 min-w-0">
                  {editingId === comp.id ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 px-3 py-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:border-violet-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(comp.id)}
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
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${comp.enabled ? 'bg-pink-500/10 text-pink-400' : 'bg-zinc-800 text-zinc-500'}`}>
                        <Target className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-zinc-200 text-sm truncate">
                        {comp.name}
                      </span>
                    </div>
                  )}
                </div>

                {editingId !== comp.id && (
                  <div className="flex items-center gap-2">
                    {/* Enable/Disable Toggle */}
                    <button
                      onClick={() => handleToggleCompetitor(comp.id, !comp.enabled)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                        comp.enabled ? 'bg-violet-600' : 'bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          comp.enabled ? 'translate-x-4.5' : 'translate-x-1'
                        }`}
                      />
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => handleStartEdit(comp)}
                      className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition"
                      title="Edit Competitor"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteCompetitor(comp.id, comp.name)}
                      className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      title="Delete Competitor"
                    >
                      <Trash2 className="w-4 h-4" />
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
